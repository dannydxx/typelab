import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({ getSession: vi.fn(), getPremiumResult: vi.fn(), readPortrait: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/server/access-session", () => ({ getAccessSessionFromRequest: mocks.getSession }));
vi.mock("@/lib/server/premium-access", () => ({ getPremiumResultForAccess: mocks.getPremiumResult }));
vi.mock("@/lib/server/personality-portrait", () => ({ readPremiumPersonalityPortrait: mocks.readPortrait }));

import { GET } from "./premium/personality-portrait/[type]/route";

const identity = { sessionId: "session-1", accessCodeId: "code-1", sessionExpiresAt: "2026-08-13T12:00:00.000Z", accessExpiresAt: "2026-08-13T12:00:00.000Z", attemptId: "attempt-1" };
const result = { attemptId: "attempt-1", personalityId: "09", scores: { security: 2, closeness: 3, expression: 1, conflict: -2 }, completedAt: "2026-08-10T12:00:00.000Z" };
const requestPortrait = (type: string, search = "") => GET(new NextRequest(`http://localhost/api/premium/personality-portrait/${type}${search}`), { params: Promise.resolve({ type }) });

describe("premium personality portrait Access Session authorization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getSession.mockResolvedValue(null);
    mocks.getPremiumResult.mockResolvedValue(result);
    mocks.readPortrait.mockResolvedValue(Buffer.from("premium-image"));
  });

  it("rejects the full portrait without an Access Session", async () => {
    const response = await requestPortrait("09");
    expect(response.status).toBe(403);
    expect(mocks.readPortrait).not.toHaveBeenCalled();
  });

  it("serves the full portrait after formal result authorization", async () => {
    mocks.getSession.mockResolvedValue(identity);
    const response = await requestPortrait("09");
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("image/webp");
    expect(response.headers.get("cache-control")).toContain("no-store");
  });

  it("does not reveal another TYPE by changing the URL", async () => {
    mocks.getSession.mockResolvedValue(identity);
    const response = await requestPortrait("10");
    expect(response.status).toBe(403);
    expect(mocks.readPortrait).not.toHaveBeenCalled();
  });

  it("returns a safe error when the authorized asset is absent", async () => {
    mocks.getSession.mockResolvedValue(identity);
    mocks.readPortrait.mockResolvedValue(null);
    const response = await requestPortrait("09");
    expect(response.status).toBe(404);
  });

  it("does not accept a preview query as an authorization bypass", async () => {
    const response = await requestPortrait("09", "?preview=09");
    expect(response.status).toBe(403);
    expect(mocks.getSession).toHaveBeenCalled();
    expect(mocks.readPortrait).not.toHaveBeenCalled();
  });
});
