import "server-only";
import type { NextResponse } from "next/server";

export function premiumFixtureCookieOptions(expiresAt: string, isProduction = process.env.NODE_ENV === "production") {
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

export function setPremiumFixtureCookie(response: NextResponse, name: string, value: string, expiresAt: string) {
  response.cookies.set(name, value, premiumFixtureCookieOptions(expiresAt));
}

export function getPremiumFixtureExpiry() {
  return new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
}
