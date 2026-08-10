import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";

vi.mock("server-only", () => ({}));

import { REDEEM_SESSION_COOKIE_NAME } from "../config";
import {
  getRedeemSession,
  readRedeemSessionCookie,
  redeemSessionCookieOptions,
  setRedeemSessionCookie,
} from "./redeem-session";

describe("redeem session cookie", () => {
  beforeEach(() => vi.useRealTimers());

  it("reads the server session token from the cookie instead of a request header", () => {
    const request = new NextRequest("http://localhost/api/redeem/session", {
      headers: {
        cookie: `${REDEEM_SESSION_COOKIE_NAME}=server-cookie-token`,
        "x-redeem-session": "forged-header-token",
      },
    });
    expect(readRedeemSessionCookie(request)).toBe("server-cookie-token");
  });

  it("rejects the legacy token format that was previously exposed to localStorage", async () => {
    await expect(getRedeemSession("legacy-browser-session-token-with-enough-length")).resolves.toBeNull();
  });

  it("uses the required production cookie protections", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-10T12:00:00.000Z"));
    expect(redeemSessionCookieOptions("2026-08-11T12:00:00.000Z", true)).toMatchObject({
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      path: "/",
      maxAge: 86400,
    });
  });

  it("writes an HttpOnly cookie without exposing the token in JSON", async () => {
    const response = NextResponse.json({ authenticated: true });
    setRedeemSessionCookie(response, "server-cookie-token", "2026-08-11T12:00:00.000Z");
    const body = await response.json();
    const setCookie = response.headers.get("set-cookie") ?? "";

    expect(body).toEqual({ authenticated: true });
    expect(JSON.stringify(body)).not.toContain("server-cookie-token");
    expect(setCookie).toContain(`${REDEEM_SESSION_COOKIE_NAME}=server-cookie-token`);
    expect(setCookie).toMatch(/HttpOnly/i);
    expect(setCookie).toMatch(/SameSite=lax/i);
    expect(setCookie).toMatch(/Path=\//i);
  });
});
