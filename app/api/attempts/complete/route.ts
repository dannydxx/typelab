import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { calculateScores, getPersonality } from "@/lib/scoring";
import { apiError, unexpectedError } from "@/lib/server/http";
import { getRedeemSessionFromRequest, setPrivateCookie } from "@/lib/server/redeem-session";
import { createServiceClient } from "@/lib/supabase/service";
import { DEMO_ATTEMPT_COOKIE_NAME, DEMO_RESULT_COOKIE_NAME } from "@/lib/config";
import { encodeDemoPremiumResult } from "@/lib/server/premium-result";
import type { StoredResult } from "@/lib/types";

const schema = z.object({
  attemptId: z.string().uuid(),
  answers: z.array(z.union([z.literal(-2), z.literal(-1), z.literal(1), z.literal(2)])).length(20),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getRedeemSessionFromRequest(request);
    if (!session) return apiError("兑换会话已失效，请重新输入兑换码。", 401, "SESSION_EXPIRED");

    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return apiError("答题数据不完整，请返回检查。", 400, "INVALID_ANSWERS");

    const scores = calculateScores(parsed.data.answers);
    const personality = getPersonality(scores);

    if (session.demo) {
      const activeAttemptId = request.cookies.get(DEMO_ATTEMPT_COOKIE_NAME)?.value;
      if (activeAttemptId !== parsed.data.attemptId) return apiError("本次测试已失效，请重新开始。", 409, "ATTEMPT_INVALID");
      const result: StoredResult = {
        attemptId: parsed.data.attemptId,
        personalityId: personality.id,
        scores,
        completedAt: new Date().toISOString(),
      };
      const response = NextResponse.json({ ok: true, idempotent: false, demo: true });
      const expiresAt = new Date(Math.min(Date.parse(session.sessionExpiresAt), Date.parse(session.codeExpiresAt))).toISOString();
      setPrivateCookie(response, DEMO_RESULT_COOKIE_NAME, encodeDemoPremiumResult(result), expiresAt);
      setPrivateCookie(response, DEMO_ATTEMPT_COOKIE_NAME, "", new Date(0).toISOString());
      return response;
    }

    const supabase = createServiceClient();
    const { data, error } = await supabase.rpc("complete_test_attempt", {
      p_code_id: session.redeemCodeId,
      p_attempt_id: parsed.data.attemptId,
      p_personality_type: personality.id,
      p_dimension_scores: scores,
    });
    if (error) {
      if (error.message.includes("ATTEMPT_INVALID")) return apiError("本次测试已失效，请重新开始。", 409, "ATTEMPT_INVALID");
      if (error.message.includes("CODE_DISABLED")) return apiError("该兑换码当前无法使用。", 403, "CODE_DISABLED");
      if (error.message.includes("CODE_EXPIRED")) return apiError("该兑换码已经超过有效期。", 410, "CODE_EXPIRED");
      if (error.message.includes("LIMIT_REACHED")) return apiError("该兑换码的测试次数已经使用完毕。", 403, "LIMIT_REACHED");
      throw error;
    }
    return NextResponse.json({
      ok: true,
      idempotent: !data,
    });
  } catch (error) {
    return unexpectedError(error);
  }
}
