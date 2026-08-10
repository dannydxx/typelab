import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  DEMO_ATTEMPT_COOKIE_NAME,
  DEMO_RESULT_COOKIE_NAME,
  LOCAL_DEMO_CODE,
  LOCAL_DEMO_SESSION,
  PRODUCT_CONFIG,
  REDEEM_CODE_PATTERN,
} from "@/lib/config";
import { createServiceClient } from "@/lib/supabase/service";
import { apiError, unexpectedError } from "@/lib/server/http";
import { createSessionToken } from "@/lib/server/security";
import { getRedeemSession, setPrivateCookie, setRedeemSessionCookie } from "@/lib/server/redeem-session";
import { getPremiumSessionState } from "@/lib/server/premium-result";

const schema = z.object({ code: z.string().trim().toUpperCase() });

export async function POST(request: NextRequest) {
  try {
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success || !REDEEM_CODE_PATTERN.test(parsed.data.code)) {
      return apiError("这个兑换码好像不存在，请检查后重新输入。", 404, "CODE_NOT_FOUND");
    }

    if (process.env.NODE_ENV === "development" && parsed.data.code === LOCAL_DEMO_CODE) {
      const activatedAt = new Date();
      const expiresAt = new Date(activatedAt.getTime() + PRODUCT_CONFIG.redeemValidHours * 60 * 60 * 1000).toISOString();
      const response = NextResponse.json({
        ok: true,
        authenticated: true,
        canStart: true,
        hasActiveAttempt: false,
        activeAttemptId: null,
        hasCompletedResult: false,
      });
      setRedeemSessionCookie(response, LOCAL_DEMO_SESSION, expiresAt);
      setPrivateCookie(response, DEMO_ATTEMPT_COOKIE_NAME, "", new Date(0).toISOString());
      setPrivateCookie(response, DEMO_RESULT_COOKIE_NAME, "", new Date(0).toISOString());
      return response;
    }

    const supabase = createServiceClient();
    const { data, error } = await supabase.rpc("redeem_code", {
      p_code: parsed.data.code,
      p_valid_hours: PRODUCT_CONFIG.redeemValidHours,
    });
    if (error) throw error;
    const result = Array.isArray(data) ? data[0] : data;
    if (!result) return apiError("这个兑换码好像不存在，请检查后重新输入。", 404, "CODE_NOT_FOUND");
    if (result.state === "disabled") return apiError("该兑换码当前无法使用。", 403, "CODE_DISABLED");
    if (result.state === "expired") return apiError("该兑换码已经超过有效期。", 410, "CODE_EXPIRED");

    const { token, digest } = createSessionToken();
    const { error: sessionError } = await supabase.from("redeem_sessions").insert({
      redeem_code_id: result.code_id,
      token_hash: digest,
      expires_at: result.expires_at,
    });
    if (sessionError) throw sessionError;

    const identity = await getRedeemSession(token);
    if (!identity) throw new Error("SESSION_CREATION_FAILED");
    const state = await getPremiumSessionState(identity);
    const response = NextResponse.json({
      ok: true,
      ...state,
    });
    setRedeemSessionCookie(response, token, result.expires_at);
    return response;
  } catch (error) {
    return unexpectedError(error);
  }
}
