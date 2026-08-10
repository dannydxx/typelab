import "server-only";
import { createHmac } from "crypto";
import type { NextRequest } from "next/server";
import { ACCESS_ACTIVATION_RATE_LIMIT } from "@/lib/config";
import { createServiceClient } from "@/lib/supabase/service";

function rateLimitSecret() {
  const secret = process.env.ACCESS_RATE_LIMIT_SECRET;
  if (!secret && process.env.NODE_ENV === "production") throw new Error("ACCESS_RATE_LIMIT_SECRET_REQUIRED");
  return secret || "development-only-access-rate-limit-secret";
}

export function getActivationClientIdentifier(request: NextRequest) {
  const realIp = request.headers.get("x-real-ip")?.trim();
  const forwardedIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return realIp || forwardedIp || "unknown-client";
}

export function hashActivationClientIdentifier(identifier: string, secret = rateLimitSecret()) {
  return createHmac("sha256", secret).update(identifier).digest("hex");
}

type RateLimitRow = { allowed: boolean; retry_after_seconds: number };

export async function consumeAccessActivationAttempt(request: NextRequest) {
  const identifierHash = hashActivationClientIdentifier(getActivationClientIdentifier(request));
  const supabase = createServiceClient();
  const { data, error } = await supabase.rpc("consume_access_activation_attempt", {
    p_identifier_hash: identifierHash,
    p_max_attempts: ACCESS_ACTIVATION_RATE_LIMIT.maxAttempts,
    p_window_seconds: ACCESS_ACTIVATION_RATE_LIMIT.windowSeconds,
    p_block_seconds: ACCESS_ACTIVATION_RATE_LIMIT.blockSeconds,
  });
  if (error) throw error;
  const row = (Array.isArray(data) ? data[0] : data) as RateLimitRow | null;
  if (!row) throw new Error("ACCESS_RATE_LIMIT_UNAVAILABLE");
  return { identifierHash, allowed: row.allowed, retryAfterSeconds: Math.max(1, Number(row.retry_after_seconds) || 1) };
}

export async function clearAccessActivationFailures(identifierHash: string) {
  const supabase = createServiceClient();
  const { error } = await supabase.rpc("clear_access_activation_failures", { p_identifier_hash: identifierHash });
  if (error) throw error;
}
