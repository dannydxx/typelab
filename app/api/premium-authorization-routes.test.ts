import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import type { RedeemSessionIdentity } from "@/lib/server/premium-authorization";

const mocks = vi.hoisted(() => ({
  getSessionFromRequest: vi.fn(),
  getSession: vi.fn(),
  getSessionState: vi.fn(),
  rpc: vi.fn(),
  insert: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/service", () => ({
  createServiceClient: () => ({
    rpc: mocks.rpc,
    from: () => ({ insert: mocks.insert }),
  }),
}));
vi.mock("@/lib/server/security", () => ({
  createSessionToken: () => ({ token: "v3_server-generated-session-token-with-enough-length", digest: "token-digest" }),
  hashSessionToken: (token: string) => `hash:${token}`,
  isCurrentRedeemSessionToken: (token: string) => token.startsWith("v3_"),
}));
vi.mock("@/lib/server/redeem-session", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/server/redeem-session")>();
  return {
    ...actual,
    getRedeemSessionFromRequest: mocks.getSessionFromRequest,
    getRedeemSession: mocks.getSession,
  };
});
vi.mock("@/lib/server/premium-result", () => ({
  getPremiumSessionState: mocks.getSessionState,
  encodeDemoPremiumResult: vi.fn(() => "signed-demo-result"),
}));

import { POST as startAttempt } from "./attempts/start/route";
import { POST as completeAttempt } from "./attempts/complete/route";
import { POST as redeem } from "./redeem/route";
import { GET as getSessionState } from "./redeem/session/route";

const identity: RedeemSessionIdentity = {
  sessionId: "session-1",
  redeemCodeId: "code-1",
  sessionExpiresAt: "2026-08-11T12:00:00.000Z",
  codeExpiresAt: "2026-08-11T12:00:00.000Z",
  activatedAt: "2026-08-10T12:00:00.000Z",
  completedCount: 0,
  maxCompletedCount: 3,
  demo: false,
};
const answers = Array.from({ length: 20 }, (_, index) => index % 2 === 0 ? -1 : 1);

describe("premium authorization routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getSessionFromRequest.mockResolvedValue(null);
    mocks.getSession.mockResolvedValue(identity);
    mocks.getSessionState.mockResolvedValue({
      authenticated: true,
      canStart: true,
      hasActiveAttempt: false,
      activeAttemptId: null,
      hasCompletedResult: false,
    });
    mocks.insert.mockResolvedValue({ error: null });
  });

  it("rejects the start API without an authorized cookie session", async () => {
    const response = await startAttempt(new NextRequest("http://localhost/api/attempts/start", { method: "POST" }));
    expect(response.status).toBe(401);
    expect(await response.json()).toMatchObject({ code: "SESSION_EXPIRED" });
  });

  it("rejects the complete API without an authorized cookie session", async () => {
    const response = await completeAttempt(new NextRequest("http://localhost/api/attempts/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ attemptId: "00000000-0000-4000-8000-000000000001", answers }),
    }));
    expect(response.status).toBe(401);
    expect(await response.json()).toMatchObject({ code: "SESSION_EXPIRED" });
  });

  it("allows the start API to create an attempt only after cookie authorization", async () => {
    mocks.getSessionFromRequest.mockResolvedValue(identity);
    mocks.rpc.mockResolvedValue({ data: "00000000-0000-4000-8000-000000000001", error: null });
    const response = await startAttempt(new NextRequest("http://localhost/api/attempts/start", { method: "POST" }));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true, attemptId: "00000000-0000-4000-8000-000000000001" });
    expect(mocks.rpc).toHaveBeenCalledWith("start_test_attempt", { p_code_id: "code-1" });
  });

  it("rejects completion when the attempt does not belong to the cookie session", async () => {
    mocks.getSessionFromRequest.mockResolvedValue(identity);
    mocks.rpc.mockResolvedValue({ data: null, error: { message: "ATTEMPT_INVALID" } });
    const response = await completeAttempt(new NextRequest("http://localhost/api/attempts/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ attemptId: "00000000-0000-4000-8000-000000000002", answers }),
    }));
    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({ code: "ATTEMPT_INVALID" });
  });

  it("sets the HttpOnly cookie on redemption without returning the token or code", async () => {
    mocks.rpc.mockResolvedValue({
      data: [{
        code_id: "code-1",
        state: "active",
        activated_at: "2026-08-10T12:00:00.000Z",
        expires_at: "2026-08-11T12:00:00.000Z",
        completed_count: 0,
        max_completed_count: 3,
      }],
      error: null,
    });
    const response = await redeem(new NextRequest("http://localhost/api/redeem", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: "LOVE-ABCD-2345" }),
    }));
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body).toMatchObject({ authenticated: true, canStart: true });
    expect(body).not.toHaveProperty("sessionToken");
    expect(body).not.toHaveProperty("code");
    expect(response.headers.get("set-cookie")).toMatch(/love_premium_session=.*HttpOnly/i);
  });

  it("returns a minimal session status without leaking credentials", async () => {
    mocks.getSessionFromRequest.mockResolvedValue(identity);
    const response = await getSessionState(new NextRequest("http://localhost/api/redeem/session"));
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body).toMatchObject({ authenticated: true, activeAttemptId: null });
    expect(JSON.stringify(body)).not.toMatch(/sessionToken|redeem.?code|LOVE-/i);
    expect(response.headers.get("cache-control")).toContain("no-store");
  });

  it("returns an unauthenticated state when the session cookie is missing or invalid", async () => {
    const response = await getSessionState(new NextRequest("http://localhost/api/redeem/session", {
      headers: { "x-redeem-session": "forged-local-storage-token" },
    }));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      authenticated: false,
      canStart: false,
      hasActiveAttempt: false,
      activeAttemptId: null,
      hasCompletedResult: false,
    });
  });
});
