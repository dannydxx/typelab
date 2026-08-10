import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { accessSessionCookieOptions, hashAccessSessionToken, validateAccessSessionRecords } from "./access-session";

const session = { id: "session-1", access_code_id: "code-1", expires_at: "2026-08-13T12:00:00.000Z" };
const code = { id: "code-1", status: "ACTIVE", expires_at: "2026-08-13T12:00:00.000Z", result_view_expires_at: null, attempt_id: "attempt-1" };

describe("Access Session", () => {
  it("accepts only a live ACTIVE code-owned session", () => {
    expect(validateAccessSessionRecords(session, code, new Date("2026-08-11T12:00:00.000Z"))).toMatchObject({ accessCodeId: "code-1", attemptId: "attempt-1" });
  });

  it("rejects expired, revoked, and mismatched records", () => {
    expect(validateAccessSessionRecords(session, code, new Date("2026-08-14T12:00:00.000Z"))).toBeNull();
    expect(validateAccessSessionRecords(session, { ...code, status: "REVOKED" }, new Date("2026-08-11T12:00:00.000Z"))).toBeNull();
    expect(validateAccessSessionRecords(session, { ...code, id: "code-2" }, new Date("2026-08-11T12:00:00.000Z"))).toBeNull();
  });

  it("uses the result-view expiry after a formal result is completed", () => {
    const resultSession = { ...session, expires_at: "2026-09-12T12:00:00.000Z" };
    const resultCode = { ...code, result_view_expires_at: "2026-09-12T12:00:00.000Z" };
    expect(validateAccessSessionRecords(resultSession, resultCode, new Date("2026-08-20T12:00:00.000Z"))).toMatchObject({ resultViewExpiresAt: "2026-09-12T12:00:00.000Z" });
    expect(validateAccessSessionRecords(resultSession, resultCode, new Date("2026-09-13T12:00:00.000Z"))).toBeNull();
  });

  it("hashes the browser token before persistence", () => {
    const hash = hashAccessSessionToken("a".repeat(43), "test-session-secret");
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
    expect(hash).not.toContain("aaaa");
  });

  it("fails closed in production when the Session HMAC secret is missing", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("ACCESS_SESSION_HASH_SECRET", "");
    expect(() => hashAccessSessionToken("a".repeat(43))).toThrow("ACCESS_SESSION_HASH_SECRET_REQUIRED");
    vi.unstubAllEnvs();
  });

  it("sets an HttpOnly SameSite=Lax root cookie and Secure in production", () => {
    expect(accessSessionCookieOptions("2099-08-13T12:00:00.000Z", true)).toMatchObject({ httpOnly: true, sameSite: "lax", secure: true, path: "/" });
    expect(accessSessionCookieOptions("2099-08-13T12:00:00.000Z", false).secure).toBe(false);
  });
});
