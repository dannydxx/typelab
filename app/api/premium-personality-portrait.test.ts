import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import type { RedeemSessionIdentity } from "@/lib/server/premium-authorization";

const mocks = vi.hoisted(() => ({
  getSessionFromRequest: vi.fn(),
  getPremiumResult: vi.fn(),
  decodeDemoResult: vi.fn(),
  readPortrait: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/server/redeem-session", () => ({
  getRedeemSessionFromRequest: mocks.getSessionFromRequest,
}));
vi.mock("@/lib/server/premium-result", () => ({
  getPremiumResultForSession: mocks.getPremiumResult,
  decodeDemoPremiumResult: mocks.decodeDemoResult,
}));
vi.mock("@/lib/server/personality-portrait", () => ({
  readPremiumPersonalityPortrait: mocks.readPortrait,
}));

import { GET } from "./premium/personality-portrait/[type]/route";

const identity: RedeemSessionIdentity = {
  sessionId: "session-1",
  redeemCodeId: "code-1",
  sessionExpiresAt: "2026-08-11T12:00:00.000Z",
  codeExpiresAt: "2026-08-11T12:00:00.000Z",
  activatedAt: "2026-08-10T12:00:00.000Z",
  completedCount: 1,
  maxCompletedCount: 3,
  demo: false,
};

const result = {
  attemptId: "attempt-1",
  personalityId: "09",
  scores: { security: 2, closeness: 3, expression: 1, conflict: -2 },
  completedAt: "2026-08-10T12:00:00.000Z",
};

function requestPortrait(type: string) {
  return GET(
    new NextRequest(`http://localhost/api/premium/personality-portrait/${type}`),
    { params: Promise.resolve({ type }) },
  );
}

describe("premium personality portrait authorization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getSessionFromRequest.mockResolvedValue(null);
    mocks.getPremiumResult.mockResolvedValue(result);
    mocks.readPortrait.mockResolvedValue(Buffer.from("premium-image"));
  });

  it("rejects the full portrait when the Premium session is missing", async () => {
    const response = await requestPortrait("09");
    expect(response.status).toBe(401);
    expect(mocks.readPortrait).not.toHaveBeenCalled();
  });

  it("serves the full portrait after session and formal result authorization", async () => {
    mocks.getSessionFromRequest.mockResolvedValue(identity);
    const response = await requestPortrait("09");
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("image/webp");
    expect(response.headers.get("cache-control")).toContain("no-store");
    expect(Buffer.from(await response.arrayBuffer()).toString()).toBe("premium-image");
  });

  it("does not reveal another TYPE when the free and formal results differ", async () => {
    mocks.getSessionFromRequest.mockResolvedValue(identity);
    const response = await requestPortrait("10");
    expect(response.status).toBe(403);
    expect(mocks.readPortrait).not.toHaveBeenCalled();
  });

  it("uses a safe placeholder path when the authorized full asset is not configured", async () => {
    mocks.getSessionFromRequest.mockResolvedValue(identity);
    mocks.readPortrait.mockResolvedValue(null);
    const response = await requestPortrait("09");
    expect(response.status).toBe(404);
    expect(await response.json()).toMatchObject({ code: "PORTRAIT_NOT_CONFIGURED" });
  });
});
