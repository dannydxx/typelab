import { readFileSync } from "node:fs";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({ getSession: vi.fn(), rpc: vi.fn() }));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/server/access-session", async () => {
  const actual = await vi.importActual<typeof import("@/lib/server/access-session")>("@/lib/server/access-session");
  return { ...actual, getAccessSessionFromRequest: mocks.getSession };
});
vi.mock("@/lib/supabase/service", () => ({ createServiceClient: () => ({ rpc: mocks.rpc }) }));

import { POST as startAttempt } from "./attempts/start/route";
import { POST as completeAttempt } from "./attempts/complete/route";

const identity = {
  sessionId: "session-1",
  accessCodeId: "00000000-0000-4000-8000-000000000001",
  sessionExpiresAt: "2026-08-13T12:00:00.000Z",
  accessExpiresAt: "2026-08-13T12:00:00.000Z",
  testExpiresAt: "2026-08-13T12:00:00.000Z",
  resultViewExpiresAt: null,
  attemptId: null,
};
const attemptId = "00000000-0000-4000-8000-000000000099";
const answers = Array.from({ length: 20 }, (_, index) => index % 2 ? 1 : -1);

describe("Access Session protected Premium routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getSession.mockResolvedValue(null);
    mocks.rpc.mockResolvedValue({ data: [{ attempt_id: attemptId, attempt_status: "started" }], error: null });
  });

  it("does not trust local or query Premium flags", async () => {
    const request = new NextRequest("http://localhost/api/attempts/start?premium=true", { method: "POST", headers: { "x-premium": "true", "x-local-storage-premium": "true" } });
    const response = await startAttempt(request);
    expect(response.status).toBe(403);
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("starts an attempt only with a server-validated Access Session", async () => {
    mocks.getSession.mockResolvedValue(identity);
    const response = await startAttempt(new NextRequest("http://localhost/api/attempts/start", { method: "POST" }));
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ attemptId, completed: false });
    expect(mocks.rpc).toHaveBeenCalledWith("start_access_test_attempt", { p_access_code_id: identity.accessCodeId });
  });

  it("returns the same completed attempt instead of creating another", async () => {
    mocks.getSession.mockResolvedValue({ ...identity, attemptId });
    mocks.rpc.mockResolvedValue({ data: [{ attempt_id: attemptId, attempt_status: "completed" }], error: null });
    const response = await startAttempt(new NextRequest("http://localhost/api/attempts/start", { method: "POST" }));
    expect(await response.json()).toMatchObject({ attemptId, completed: true });
  });

  it("blocks completion without an Access Session", async () => {
    const response = await completeAttempt(new NextRequest("http://localhost/api/attempts/complete", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ attemptId, answers }) }));
    expect(response.status).toBe(403);
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("submits all 20 answers to the unchanged server scorer", async () => {
    mocks.getSession.mockResolvedValue({ ...identity, attemptId });
    mocks.rpc.mockResolvedValue({ data: [{ completed_now: true, result_expires_at: "2026-09-12T12:00:00.000Z" }], error: null });
    const response = await completeAttempt(new NextRequest("http://localhost/api/attempts/complete", { method: "POST", headers: { "Content-Type": "application/json", Cookie: `love_access_session=${"a".repeat(43)}` }, body: JSON.stringify({ attemptId, answers }) }));
    expect(response.status).toBe(200);
    expect(mocks.rpc).toHaveBeenCalledWith("complete_access_test_attempt", expect.objectContaining({ p_access_code_id: identity.accessCodeId, p_attempt_id: attemptId }));
    expect(response.headers.get("set-cookie")).toContain("love_access_session=");
  });

  it("does not create or complete a second test during the result-view window", async () => {
    mocks.getSession.mockResolvedValue({ ...identity, attemptId, resultViewExpiresAt: "2026-09-12T12:00:00.000Z", accessExpiresAt: "2026-09-12T12:00:00.000Z" });
    mocks.rpc.mockResolvedValue({ data: [{ attempt_id: attemptId, attempt_status: "completed" }], error: null });
    const startResponse = await startAttempt(new NextRequest("http://localhost/api/attempts/start", { method: "POST" }));
    expect(await startResponse.json()).toMatchObject({ attemptId, completed: true });
    expect(mocks.rpc).toHaveBeenCalledTimes(1);
  });

  it("keeps result rendering behind server Access Session validation", () => {
    const source = readFileSync(new URL("../premium/result/page.tsx", import.meta.url), "utf8");
    expect(source).toContain("getAccessSessionFromServerCookies");
    expect(source).toContain("getPremiumResultForAccess");
    expect(source).not.toMatch(/localStorage|premium=true/);
  });
});
