import { describe, expect, it, vi } from "vitest";
import type { PlatformEntitlementIdentity } from "@/lib/types";

vi.mock("server-only", () => ({}));

import {
  createPremiumAccessState,
  unavailablePremiumAccessState,
  validateEntitledResultRecords,
} from "./premium-access";
import { getServerEntitlementFixture, XHS_PLATFORM_INTEGRATION_STATUS } from "./xhs-entitlement";

const identity: PlatformEntitlementIdentity = {
  entitlementId: "entitlement-1",
  platformUserId: "xhs-user-1",
  entitlement: { entitled: true, source: "xiaohongshu", productId: "product-1", orderId: "order-1", grantedAt: "2026-08-10T12:00:00.000Z" },
  maxCompletedTests: 3,
  fixture: false,
};

const resultRow = {
  attempt_id: "attempt-1",
  entitlement_id: "entitlement-1",
  personality_type: "09",
  dimension_scores: { security: 2, closeness: 3, expression: 1, conflict: -2 },
  completed_at: "2026-08-10T12:00:00.000Z",
};

const attemptRow = {
  id: "attempt-1",
  entitlement_id: "entitlement-1",
  platform_user_id: "xhs-user-1",
  status: "completed",
  completed_at: "2026-08-10T12:00:00.000Z",
};

describe("Premium entitlement authorization", () => {
  it("denies Premium when no entitlement exists", () => {
    expect(unavailablePremiumAccessState()).toEqual({ entitled: false, canStart: false, hasActiveAttempt: false, activeAttemptId: null, hasCompletedResult: false });
    expect(createPremiumAccessState(null, 0, null, false).entitled).toBe(false);
  });

  it("allows an entitled identity to start and resume", () => {
    expect(createPremiumAccessState(identity, 0, "attempt-1", false)).toMatchObject({ entitled: true, canStart: true, hasActiveAttempt: true, activeAttemptId: "attempt-1" });
  });

  it("accepts a completed result owned by the entitlement and platform user", () => {
    expect(validateEntitledResultRecords(identity, resultRow, attemptRow)).toMatchObject({ attemptId: "attempt-1", personalityId: "09" });
  });

  it("rejects a result or attempt owned by another entitlement", () => {
    expect(validateEntitledResultRecords(identity, { ...resultRow, entitlement_id: "entitlement-2" }, attemptRow)).toBeNull();
    expect(validateEntitledResultRecords(identity, resultRow, { ...attemptRow, platform_user_id: "xhs-user-2" })).toBeNull();
  });

  it("never enables the server fixture in production", () => {
    expect(getServerEntitlementFixture("production", "entitled")).toBeNull();
    expect(getServerEntitlementFixture("development", "not-entitled")).toBeNull();
    expect(getServerEntitlementFixture("development", "entitled")?.entitlement.entitled).toBe(true);
  });

  it("marks the official platform integration as pending", () => {
    expect(XHS_PLATFORM_INTEGRATION_STATUS).toBe("PENDING_XHS_PLATFORM_INTEGRATION");
  });
});
