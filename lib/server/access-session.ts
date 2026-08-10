import "server-only";
import { createHmac, randomBytes } from "crypto";
import { cookies } from "next/headers";
import type { NextRequest, NextResponse } from "next/server";
import { ACCESS_SESSION_COOKIE_NAME } from "@/lib/config";
import { createServiceClient } from "@/lib/supabase/service";

export interface AccessSessionIdentity {
  sessionId: string;
  accessCodeId: string;
  sessionExpiresAt: string;
  accessExpiresAt: string;
  testExpiresAt: string;
  resultViewExpiresAt: string | null;
  attemptId: string | null;
}

type AccessSessionRow = {
  id: string;
  access_code_id: string;
  expires_at: string;
};

type AccessCodeSessionRow = {
  id: string;
  status: string;
  expires_at: string | null;
  result_view_expires_at: string | null;
  attempt_id: string | null;
};

function sessionHashSecret() {
  const secret = process.env.ACCESS_SESSION_HASH_SECRET;
  if (!secret && process.env.NODE_ENV === "production") throw new Error("ACCESS_SESSION_HASH_SECRET_REQUIRED");
  return secret || "development-only-access-session-hash-secret";
}

export function createAccessSessionToken() {
  return randomBytes(32).toString("base64url");
}

export function hashAccessSessionToken(token: string, secret = sessionHashSecret()) {
  return createHmac("sha256", secret).update(token).digest("hex");
}

export function accessSessionCookieOptions(expiresAt: string, production = process.env.NODE_ENV === "production") {
  const expires = new Date(expiresAt);
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: production,
    path: "/",
    expires,
    maxAge: Math.max(0, Math.floor((expires.getTime() - Date.now()) / 1000)),
  };
}

export function setAccessSessionCookie(response: NextResponse, token: string, expiresAt: string) {
  response.cookies.set(ACCESS_SESSION_COOKIE_NAME, token, accessSessionCookieOptions(expiresAt));
}

export function clearAccessSessionCookie(response: NextResponse) {
  response.cookies.set(ACCESS_SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(0),
    maxAge: 0,
  });
}

export function validateAccessSessionRecords(
  session: AccessSessionRow | null,
  code: AccessCodeSessionRow | null,
  now = new Date(),
): AccessSessionIdentity | null {
  if (!session || !code || session.access_code_id !== code.id || code.status !== "ACTIVE" || !code.expires_at) return null;
  const sessionExpiry = Date.parse(session.expires_at);
  const effectiveExpiryValue = code.result_view_expires_at || code.expires_at;
  const accessExpiry = Date.parse(effectiveExpiryValue);
  if (!Number.isFinite(sessionExpiry) || !Number.isFinite(accessExpiry) || sessionExpiry <= now.getTime() || accessExpiry <= now.getTime()) return null;
  return {
    sessionId: session.id,
    accessCodeId: code.id,
    sessionExpiresAt: session.expires_at,
    accessExpiresAt: effectiveExpiryValue,
    testExpiresAt: code.expires_at,
    resultViewExpiresAt: code.result_view_expires_at,
    attemptId: code.attempt_id,
  };
}

export async function getAccessSession(token: string | null): Promise<AccessSessionIdentity | null> {
  if (!token || token.length < 32 || token.length > 128) return null;
  const supabase = createServiceClient();
  const { data: session, error: sessionError } = await supabase
    .from("access_sessions")
    .select("id, access_code_id, expires_at")
    .eq("token_hash", hashAccessSessionToken(token))
    .maybeSingle();
  if (sessionError || !session) return null;
  const { data: code, error: codeError } = await supabase
    .from("access_codes")
    .select("id, status, expires_at, result_view_expires_at, attempt_id")
    .eq("id", session.access_code_id)
    .maybeSingle();
  if (codeError || !code) return null;
  return validateAccessSessionRecords(session as AccessSessionRow, code as AccessCodeSessionRow);
}

export async function getAccessSessionFromRequest(request: NextRequest) {
  return getAccessSession(request.cookies.get(ACCESS_SESSION_COOKIE_NAME)?.value ?? null);
}

export async function getAccessSessionFromServerCookies() {
  const store = await cookies();
  return getAccessSession(store.get(ACCESS_SESSION_COOKIE_NAME)?.value ?? null);
}
