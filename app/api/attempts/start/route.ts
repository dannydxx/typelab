import { NextRequest, NextResponse } from "next/server";
import { apiError, unexpectedError } from "@/lib/server/http";
import { getPremiumEntitlementIdentityFromRequest } from "@/lib/server/xhs-entitlement";
import { getPremiumFixtureExpiry, setPremiumFixtureCookie } from "@/lib/server/premium-fixture-cookie";
import { createServiceClient } from "@/lib/supabase/service";
import { XHS_FIXTURE_ATTEMPT_COOKIE_NAME } from "@/lib/config";
import { randomUUID } from "crypto";

export async function POST(request: NextRequest) {
  try {
    const identity = await getPremiumEntitlementIdentityFromRequest(request);
    if (!identity?.entitlement.entitled) return apiError("当前账号暂无完整版访问权限。", 403, "ENTITLEMENT_REQUIRED");

    if (identity.fixture) {
      const attemptId = randomUUID();
      const response = NextResponse.json({ ok: true, attemptId, fixture: true });
      setPremiumFixtureCookie(response, XHS_FIXTURE_ATTEMPT_COOKIE_NAME, attemptId, getPremiumFixtureExpiry());
      return response;
    }

    const supabase = createServiceClient();
    const { data, error } = await supabase.rpc("start_entitled_test_attempt", {
      p_entitlement_id: identity.entitlementId,
      p_platform_user_id: identity.platformUserId,
    });
    if (error) {
      if (error.message.includes("LIMIT_REACHED")) return apiError("该商品权益的测试次数已经使用完毕。", 403, "LIMIT_REACHED");
      if (error.message.includes("ENTITLEMENT_INVALID")) return apiError("当前完整版权益已失效。", 403, "ENTITLEMENT_INVALID");
      throw error;
    }
    return NextResponse.json({ ok: true, attemptId: data });
  } catch (error) {
    return unexpectedError(error);
  }
}
