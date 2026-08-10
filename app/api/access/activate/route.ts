import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ACCESS_TEST_TTL_HOURS } from "@/lib/config";
import { hashAccessCode, isValidAccessCodeFormat, normalizeAccessCode } from "@/lib/server/access-code";
import { clearAccessActivationFailures, consumeAccessActivationAttempt } from "@/lib/server/access-rate-limit";
import { createAccessSessionToken, hashAccessSessionToken, setAccessSessionCookie } from "@/lib/server/access-session";
import { apiError, unexpectedError } from "@/lib/server/http";
import { createServiceClient } from "@/lib/supabase/service";

const schema = z.object({ accessCode: z.string().min(1).max(32) });

type ActivationRow = { access_code_id: string; state: string; expires_at: string };

export async function POST(request: NextRequest) {
  try {
    const rateLimit = await consumeAccessActivationAttempt(request);
    if (!rateLimit.allowed) {
      const response = apiError("尝试次数较多，请稍后再试。", 429, "ACCESS_ACTIVATION_RATE_LIMITED");
      response.headers.set("Retry-After", String(rateLimit.retryAfterSeconds));
      return response;
    }

    const parsed = schema.safeParse(await request.json().catch(() => null));
    if (!parsed.success || !isValidAccessCodeFormat(parsed.data.accessCode)) {
      return apiError("访问码无效或暂不可用，请检查后重试。", 400, "ACCESS_CODE_UNAVAILABLE");
    }

    const normalized = normalizeAccessCode(parsed.data.accessCode);
    const token = createAccessSessionToken();
    const supabase = createServiceClient();
    const { data, error } = await supabase.rpc("activate_access_code", {
      p_code_hash: hashAccessCode(normalized),
      p_token_hash: hashAccessSessionToken(token),
      p_test_hours: ACCESS_TEST_TTL_HOURS,
    });
    if (error) {
      if (error.message.includes("ACCESS_CODE_REVOKED") || error.message.includes("ACCESS_CODE_EXPIRED")) {
        return apiError("访问码无效或暂不可用，请检查后重试。", 400, "ACCESS_CODE_UNAVAILABLE");
      }
      throw error;
    }
    const activation = (Array.isArray(data) ? data[0] : data) as ActivationRow | null;
    if (!activation || activation.state === "REVOKED" || activation.state === "EXPIRED") {
      return apiError("访问码无效或暂不可用，请检查后重试。", 400, "ACCESS_CODE_UNAVAILABLE");
    }
    if (activation.state !== "ACTIVE" || !activation.expires_at) throw new Error("ACCESS_CODE_ACTIVATION_INVALID");
    await clearAccessActivationFailures(rateLimit.identifierHash);
    const response = NextResponse.json({ ok: true, authorized: true });
    setAccessSessionCookie(response, token, activation.expires_at);
    response.headers.set("Cache-Control", "private, no-store, max-age=0");
    return response;
  } catch (error) {
    return unexpectedError(error);
  }
}
