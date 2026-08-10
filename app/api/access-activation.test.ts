import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({ rpc: vi.fn(), consumeRateLimit: vi.fn(), clearFailures: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/service", () => ({ createServiceClient: () => ({ rpc: mocks.rpc }) }));
vi.mock("@/lib/server/access-rate-limit", () => ({
  consumeAccessActivationAttempt: mocks.consumeRateLimit,
  clearAccessActivationFailures: mocks.clearFailures,
}));

import { POST } from "./access/activate/route";

const request = (accessCode: string) => new NextRequest("http://localhost/api/access/activate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ accessCode }) });

describe("Access Code activation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.consumeRateLimit.mockResolvedValue({ identifierHash: "anonymous-hash", allowed: true, retryAfterSeconds: 1 });
    mocks.clearFailures.mockResolvedValue(undefined);
    mocks.rpc.mockResolvedValue({ data: [{ access_code_id: "code-1", state: "ACTIVE", expires_at: "2099-08-13T12:00:00.000Z" }], error: null });
  });

  it("activates a valid unused code and establishes an HttpOnly session", async () => {
    const response = await POST(request("ABCD-2345"));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true, authorized: true });
    const cookie = response.headers.get("set-cookie") || "";
    expect(cookie).toContain("love_access_session=");
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("SameSite=lax");
    expect(cookie).not.toContain("ABCD-2345");
    expect(mocks.clearFailures).toHaveBeenCalledWith("anonymous-hash");
  });

  it("counts invalid format attempts before rejecting them", async () => {
    const response = await POST(request("1234"));
    expect(response.status).toBe(400);
    expect(mocks.consumeRateLimit).toHaveBeenCalled();
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("returns one public error for missing, revoked, and expired codes", async () => {
    const responses = [];
    mocks.rpc.mockResolvedValueOnce({ data: [], error: null });
    responses.push(await POST(request("ABCD-2345")));
    mocks.rpc.mockResolvedValueOnce({ data: [{ access_code_id: "code-1", state: "REVOKED", expires_at: null }], error: null });
    responses.push(await POST(request("ABCD-2345")));
    mocks.rpc.mockResolvedValueOnce({ data: [{ access_code_id: "code-1", state: "EXPIRED", expires_at: "2026-08-11T00:00:00.000Z" }], error: null });
    responses.push(await POST(request("ABCD-2345")));
    const bodies = await Promise.all(responses.map((response) => response.json()));
    expect(responses.every((response) => response.status === 400)).toBe(true);
    expect(new Set(bodies.map((body) => `${body.code}:${body.message}`)).size).toBe(1);
  });

  it("rate limits repeated attempts before Access Code lookup", async () => {
    mocks.consumeRateLimit.mockResolvedValue({ identifierHash: "anonymous-hash", allowed: false, retryAfterSeconds: 900 });
    const response = await POST(request("ABCD-2345"));
    expect(response.status).toBe(429);
    expect(response.headers.get("retry-after")).toBe("900");
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("never exposes hashes, code identity, or session tokens in JSON", async () => {
    const response = await POST(request("ABCD-2345"));
    const body = JSON.stringify(await response.json());
    expect(body).not.toMatch(/hash|token|code-1|ABCD/);
  });
});
