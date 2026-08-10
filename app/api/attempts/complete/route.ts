import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { calculateScores, getPersonality } from "@/lib/scoring";
import { apiError, unexpectedError } from "@/lib/server/http";
import { getPremiumEntitlementIdentityFromRequest } from "@/lib/server/xhs-entitlement";
import { getPremiumFixtureExpiry, setPremiumFixtureCookie } from "@/lib/server/premium-fixture-cookie";
import { createServiceClient } from "@/lib/supabase/service";
import { XHS_FIXTURE_ATTEMPT_COOKIE_NAME, XHS_FIXTURE_RESULT_COOKIE_NAME } from "@/lib/config";
import { encodeFixturePremiumResult } from "@/lib/server/premium-access";
import type { StoredResult } from "@/lib/types";

const schema = z.object({
  attemptId: z.string().uuid(),
  answers: z.array(z.union([z.literal(-2), z.literal(-1), z.literal(1), z.literal(2)])).length(20),
});

export async function POST(request: NextRequest) {
  try {
    const identity = await getPremiumEntitlementIdentityFromRequest(request);
    if (!identity?.entitlement.entitled) return apiError("当前账号暂无完整版访问权限。", 403, "ENTITLEMENT_REQUIRED");

    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return apiError("答题数据不完整，请返回检查。", 400, "INVALID_ANSWERS");

    const scores = calculateScores(parsed.data.answers);
    const personality = getPersonality(scores);

    if (identity.fixture) {
      const activeAttemptId = request.cookies.get(XHS_FIXTURE_ATTEMPT_COOKIE_NAME)?.value;
      if (activeAttemptId !== parsed.data.attemptId) return apiError("本次测试已失效，请重新开始。", 409, "ATTEMPT_INVALID");
      const result: StoredResult = {
        attemptId: parsed.data.attemptId,
        personalityId: personality.id,
        scores,
        completedAt: new Date().toISOString(),
      };
      const response = NextResponse.json({ ok: true, idempotent: false, fixture: true });
      const expiresAt = getPremiumFixtureExpiry();
      setPremiumFixtureCookie(response, XHS_FIXTURE_RESULT_COOKIE_NAME, encodeFixturePremiumResult(result), expiresAt);
      setPremiumFixtureCookie(response, XHS_FIXTURE_ATTEMPT_COOKIE_NAME, "", new Date(0).toISOString());
      return response;
    }

    const supabase = createServiceClient();
    const { data, error } = await supabase.rpc("complete_entitled_test_attempt", {
      p_entitlement_id: identity.entitlementId,
      p_platform_user_id: identity.platformUserId,
      p_attempt_id: parsed.data.attemptId,
      p_personality_type: personality.id,
      p_dimension_scores: scores,
    });
    if (error) {
      if (error.message.includes("ATTEMPT_INVALID")) return apiError("本次测试已失效，请重新开始。", 409, "ATTEMPT_INVALID");
      if (error.message.includes("ENTITLEMENT_INVALID")) return apiError("当前完整版权益已失效。", 403, "ENTITLEMENT_INVALID");
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
