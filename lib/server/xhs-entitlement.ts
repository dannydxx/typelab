import "server-only";
import type { NextRequest } from "next/server";
import { PRODUCT_CONFIG } from "@/lib/config";
import type { PlatformEntitlementIdentity } from "@/lib/types";

export const XHS_PLATFORM_INTEGRATION_STATUS = "PENDING_XHS_PLATFORM_INTEGRATION" as const;

export function getServerEntitlementFixture(
  nodeEnv = process.env.NODE_ENV,
  fixture = process.env.XHS_ENTITLEMENT_FIXTURE,
): PlatformEntitlementIdentity | null {
  if (nodeEnv === "production" || fixture !== "entitled") return null;
  return {
    entitlementId: "00000000-0000-4000-8000-000000000001",
    platformUserId: "xhs-server-fixture-user",
    entitlement: {
      entitled: true,
      source: "xiaohongshu",
      productId: process.env.XHS_PREMIUM_PRODUCT_ID || "xhs-fixture-product",
      orderId: "xhs-fixture-order",
      grantedAt: new Date(0).toISOString(),
    },
    maxCompletedTests: PRODUCT_CONFIG.maxCompletedTests,
    fixture: true,
  };
}

/**
 * PENDING_XHS_PLATFORM_INTEGRATION
 *
 * The official XHS identity and order-verification flow must be implemented here.
 * Until signed platform identity and a verified order are available, production
 * deliberately returns no entitlement.
 */
export async function getPremiumEntitlementIdentityFromRequest(request: NextRequest) {
  void request;
  return getServerEntitlementFixture();
}

export async function getPremiumEntitlementIdentityFromServerContext() {
  return getServerEntitlementFixture();
}
