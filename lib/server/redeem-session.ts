import "server-only";
import { cookies } from "next/headers";
import type { NextRequest, NextResponse } from "next/server";
import {
  DEMO_ATTEMPT_COOKIE_NAME,
  DEMO_RESULT_COOKIE_NAME,
  LOCAL_DEMO_SESSION,
  PRODUCT_CONFIG,
  REDEEM_SESSION_COOKIE_NAME,
} from "@/lib/config";
import { createServiceClient } from "@/lib/supabase/service";
import {
  validateRedeemSessionRecords,
  type RedeemCodeRow,
  type RedeemSessionIdentity,
  type RedeemSessionRow,
} from "./premium-authorization";
import { hashSessionToken, isCurrentRedeemSessionToken } from "./security";

export function redeemSessionCookieOptions(expiresAt: string, isProduction = process.env.NODE_ENV === "production") {
  const expires = new Date(expiresAt);
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: isProduction,
    path: "/",
    expires,
    maxAge: Math.max(0, Math.floor((expires.getTime() - Date.now()) / 1000)),
  };
}

export function setRedeemSessionCookie(response: NextResponse, token: string, expiresAt: string) {
  response.cookies.set(REDEEM_SESSION_COOKIE_NAME, token, redeemSessionCookieOptions(expiresAt));
}

export function setPrivateCookie(response: NextResponse, name: string, value: string, expiresAt: string) {
  response.cookies.set(name, value, redeemSessionCookieOptions(expiresAt));
}

export function clearRedeemSessionCookies(response: NextResponse) {
  const options = { httpOnly: true, sameSite: "lax" as const, secure: process.env.NODE_ENV === "production", path: "/", expires: new Date(0), maxAge: 0 };
  response.cookies.set(REDEEM_SESSION_COOKIE_NAME, "", options);
  response.cookies.set(DEMO_ATTEMPT_COOKIE_NAME, "", options);
  response.cookies.set(DEMO_RESULT_COOKIE_NAME, "", options);
}

function createDemoIdentity(): RedeemSessionIdentity {
  const expiresAt = new Date(Date.now() + PRODUCT_CONFIG.redeemValidHours * 60 * 60 * 1000).toISOString();
  return {
    sessionId: "local-demo-session",
    redeemCodeId: "local-demo-code",
    sessionExpiresAt: expiresAt,
    codeExpiresAt: expiresAt,
    activatedAt: new Date().toISOString(),
    completedCount: 0,
    maxCompletedCount: PRODUCT_CONFIG.maxCompletedTests,
    demo: true,
  };
}

export async function getRedeemSession(token: string | null): Promise<RedeemSessionIdentity | null> {
  if (process.env.NODE_ENV === "development" && token === LOCAL_DEMO_SESSION) return createDemoIdentity();
  if (!token || !isCurrentRedeemSessionToken(token)) return null;

  const supabase = createServiceClient();
  const { data: session, error: sessionError } = await supabase
    .from("redeem_sessions")
    .select("id, redeem_code_id, expires_at")
    .eq("token_hash", hashSessionToken(token))
    .maybeSingle();
  if (sessionError || !session) return null;

  const { data: code, error: codeError } = await supabase
    .from("redeem_codes")
    .select("id, status, activated_at, expires_at, completed_count, max_completed_count")
    .eq("id", session.redeem_code_id)
    .maybeSingle();
  if (codeError || !code) return null;

  return validateRedeemSessionRecords(session as RedeemSessionRow, code as RedeemCodeRow);
}

export async function getRedeemSessionFromRequest(request: NextRequest) {
  return getRedeemSession(readRedeemSessionCookie(request));
}

export function readRedeemSessionCookie(request: NextRequest) {
  return request.cookies.get(REDEEM_SESSION_COOKIE_NAME)?.value ?? null;
}

export async function getRedeemSessionFromServerCookies() {
  const cookieStore = await cookies();
  return getRedeemSession(cookieStore.get(REDEEM_SESSION_COOKIE_NAME)?.value ?? null);
}
