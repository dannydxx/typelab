import { readFileSync } from "node:fs";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import type { PlatformEntitlementIdentity } from "@/lib/types";

const mocks = vi.hoisted(() => ({ getEntitlement: vi.fn(), rpc: vi.fn() }));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/server/xhs-entitlement", () => ({
  getPremiumEntitlementIdentityFromRequest: mocks.getEntitlement,
}));
vi.mock("@/lib/supabase/service", () => ({
  createServiceClient: () => ({ rpc: mocks.rpc }),
}));

import { GET as getEntitlement } from "./premium/entitlement/route";
import { POST as startAttempt } from "./attempts/start/route";
import { POST as completeAttempt } from "./attempts/complete/route";

const identity: PlatformEntitlementIdentity = {
  entitlementId: "00000000-0000-4000-8000-000000000001",
  platformUserId: "xhs-user-1",
  entitlement: { entitled: true, source: "xiaohongshu", productId: "product-1", orderId: "order-1", grantedAt: "2026-08-10T12:00:00.000Z" },
  maxCompletedTests: 3,
  fixture: false,
};

const answers = Array.from({ length: 20 }, (_, index) => index % 2 ? 1 : -1);

describe("Premium entitlement protected routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getEntitlement.mockResolvedValue(null);
    mocks.rpc.mockResolvedValue({ data: "00000000-0000-4000-8000-000000000099", error: null });
  });

  it("does not trust a client-forged entitlement header", async () => {
    const response = await getEntitlement(new NextRequest("http://localhost/api/premium/entitlement", { headers: { "x-premium-entitled": "true" } }));
    expect(await response.json()).toMatchObject({ entitled: false, canStart: false });
  });

  it("returns Premium access for a server-side entitled fixture", async () => {
    mocks.getEntitlement.mockResolvedValue({ ...identity, fixture: true });
    const response = await getEntitlement(new NextRequest("http://localhost/api/premium/entitlement"));
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ entitled: true, canStart: true, hasActiveAttempt: false });
  });

  it("blocks Premium attempt creation without entitlement", async () => {
    const response = await startAttempt(new NextRequest("http://localhost/api/attempts/start", { method: "POST" }));
    expect(response.status).toBe(403);
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("creates a Premium attempt for a server-confirmed entitlement", async () => {
    mocks.getEntitlement.mockResolvedValue(identity);
    const response = await startAttempt(new NextRequest("http://localhost/api/attempts/start", { method: "POST" }));
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ attemptId: "00000000-0000-4000-8000-000000000099" });
    expect(mocks.rpc).toHaveBeenCalledWith("start_entitled_test_attempt", expect.objectContaining({ p_entitlement_id: identity.entitlementId, p_platform_user_id: identity.platformUserId }));
  });

  it("blocks completion without entitlement", async () => {
    const response = await completeAttempt(new NextRequest("http://localhost/api/attempts/complete", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ attemptId: "00000000-0000-4000-8000-000000000099", answers }) }));
    expect(response.status).toBe(403);
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("submits all 20 answers to the existing server scorer after entitlement verification", async () => {
    mocks.getEntitlement.mockResolvedValue(identity);
    mocks.rpc.mockResolvedValue({ data: true, error: null });
    const response = await completeAttempt(new NextRequest("http://localhost/api/attempts/complete", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ attemptId: "00000000-0000-4000-8000-000000000099", answers }) }));
    expect(response.status).toBe(200);
    expect(mocks.rpc).toHaveBeenCalledWith("complete_entitled_test_attempt", expect.objectContaining({ p_entitlement_id: identity.entitlementId, p_platform_user_id: identity.platformUserId }));
  });

  it("keeps Premium result rendering behind the server entitlement provider", () => {
    const source = readFileSync(new URL("../premium/result/page.tsx", import.meta.url), "utf8");
    expect(source).toContain("getPremiumEntitlementIdentityFromServerContext");
    expect(source).toContain("identity?.entitlement.entitled");
    expect(source).not.toMatch(/localStorage|redeem/i);
  });
});
