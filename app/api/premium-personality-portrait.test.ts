import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import type { PlatformEntitlementIdentity } from "@/lib/types";

const mocks = vi.hoisted(() => ({
  getEntitlement: vi.fn(),
  getPremiumResult: vi.fn(),
  decodeFixtureResult: vi.fn(),
  readPortrait: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/server/xhs-entitlement", () => ({
  getPremiumEntitlementIdentityFromRequest: mocks.getEntitlement,
}));
vi.mock("@/lib/server/premium-access", () => ({
  getPremiumResultForEntitlement: mocks.getPremiumResult,
  decodeFixturePremiumResult: mocks.decodeFixtureResult,
}));
vi.mock("@/lib/server/personality-portrait", () => ({
  readPremiumPersonalityPortrait: mocks.readPortrait,
}));

import { GET } from "./premium/personality-portrait/[type]/route";

const identity: PlatformEntitlementIdentity = {
  entitlementId: "entitlement-1",
  platformUserId: "xhs-user-1",
  entitlement: { entitled: true, source: "xiaohongshu", productId: "product-1", orderId: "order-1", grantedAt: "2026-08-10T12:00:00.000Z" },
  maxCompletedTests: 3,
  fixture: false,
};

const result = {
  attemptId: "attempt-1",
  personalityId: "09",
  scores: { security: 2, closeness: 3, expression: 1, conflict: -2 },
  completedAt: "2026-08-10T12:00:00.000Z",
};

function requestPortrait(type: string) {
  return GET(new NextRequest(`http://localhost/api/premium/personality-portrait/${type}`), { params: Promise.resolve({ type }) });
}

describe("premium personality portrait entitlement", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getEntitlement.mockResolvedValue(null);
    mocks.getPremiumResult.mockResolvedValue(result);
    mocks.readPortrait.mockResolvedValue(Buffer.from("premium-image"));
  });

  it("rejects the full portrait without Premium entitlement", async () => {
    const response = await requestPortrait("09");
    expect(response.status).toBe(403);
    expect(mocks.readPortrait).not.toHaveBeenCalled();
  });

  it("serves the full portrait after entitlement and formal result authorization", async () => {
    mocks.getEntitlement.mockResolvedValue(identity);
    const response = await requestPortrait("09");
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("image/webp");
    expect(response.headers.get("cache-control")).toContain("no-store");
    expect(Buffer.from(await response.arrayBuffer()).toString()).toBe("premium-image");
  });

  it("does not reveal a TYPE different from the server-owned formal result", async () => {
    mocks.getEntitlement.mockResolvedValue(identity);
    const response = await requestPortrait("10");
    expect(response.status).toBe(403);
    expect(mocks.readPortrait).not.toHaveBeenCalled();
  });

  it("uses a safe placeholder path when the authorized full asset is not configured", async () => {
    mocks.getEntitlement.mockResolvedValue(identity);
    mocks.readPortrait.mockResolvedValue(null);
    const response = await requestPortrait("09");
    expect(response.status).toBe(404);
    expect(await response.json()).toMatchObject({ code: "PORTRAIT_NOT_CONFIGURED" });
  });
});
