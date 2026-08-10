import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { calculateScores, getPersonality } from "@/lib/scoring";
import { ACCESS_SESSION_COOKIE_NAME, RESULT_VIEW_TTL_DAYS } from "@/lib/config";
import { getAccessSessionFromRequest, setAccessSessionCookie } from "@/lib/server/access-session";
import { apiError, unexpectedError } from "@/lib/server/http";
import { createServiceClient } from "@/lib/supabase/service";

const schema = z.object({
  attemptId: z.string().uuid(),
  answers: z.array(z.union([z.literal(-2), z.literal(-1), z.literal(1), z.literal(2)])).length(20),
});

type CompleteAttemptRow = { completed_now: boolean; result_expires_at: string };

export async function POST(request: NextRequest) {
  try {
    const identity = await getAccessSessionFromRequest(request);
    if (!identity) return apiError("请先输入有效的完整版访问码。", 403, "ACCESS_SESSION_REQUIRED");
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return apiError("答题数据不完整，请返回检查。", 400, "INVALID_ANSWERS");

    const scores = calculateScores(parsed.data.answers);
    const personality = getPersonality(scores);
    const supabase = createServiceClient();
    const { data, error } = await supabase.rpc("complete_access_test_attempt", {
      p_access_code_id: identity.accessCodeId,
      p_attempt_id: parsed.data.attemptId,
      p_personality_type: personality.id,
      p_dimension_scores: scores,
      p_result_view_days: RESULT_VIEW_TTL_DAYS,
    });
    if (error) {
      if (error.message.includes("ATTEMPT_INVALID")) return apiError("本次测试已失效，请返回完整版入口。", 409, "ATTEMPT_INVALID");
      if (error.message.includes("ACCESS_EXPIRED")) return apiError("这个访问码已超过有效期。", 403, "ACCESS_CODE_EXPIRED");
      if (error.message.includes("ACCESS_REVOKED")) return apiError("这个访问码已被撤销。", 403, "ACCESS_CODE_REVOKED");
      throw error;
    }
    const row = (Array.isArray(data) ? data[0] : data) as CompleteAttemptRow | null;
    if (!row?.result_expires_at) throw new Error("RESULT_VIEW_EXPIRY_MISSING");
    const response = NextResponse.json({ ok: true, idempotent: !row.completed_now });
    const sessionToken = request.cookies.get(ACCESS_SESSION_COOKIE_NAME)?.value;
    if (sessionToken) setAccessSessionCookie(response, sessionToken, row.result_expires_at);
    return response;
  } catch (error) {
    return unexpectedError(error);
  }
}
