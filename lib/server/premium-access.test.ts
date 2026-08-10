import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { createPremiumAccessState, unavailablePremiumAccessState, validatePremiumResultRecords } from "./premium-access";
import type { AccessSessionIdentity } from "./access-session";

const identity: AccessSessionIdentity = {
  sessionId: "session-1",
  accessCodeId: "access-code-1",
  sessionExpiresAt: "2026-08-13T12:00:00.000Z",
  accessExpiresAt: "2026-08-13T12:00:00.000Z",
  testExpiresAt: "2026-08-13T12:00:00.000Z",
  resultViewExpiresAt: null,
  attemptId: "attempt-1",
};
const resultRow = {
  attempt_id: "attempt-1",
  access_code_id: "access-code-1",
  personality_type: "09",
  dimension_scores: { security: 2, closeness: 3, expression: 1, conflict: -2 },
  completed_at: "2026-08-10T12:00:00.000Z",
};
const attemptRow = { id: "attempt-1", access_code_id: "access-code-1", status: "completed", completed_at: "2026-08-10T12:00:00.000Z" };

describe("Premium Access authorization", () => {
  it("denies Premium without an Access Session", () => {
    expect(unavailablePremiumAccessState()).toEqual({ authorized: false, canStart: false, hasActiveAttempt: false, activeAttemptId: null, hasCompletedResult: false });
  });

  it("allows a new Access Session to create one attempt", () => {
    expect(createPremiumAccessState({ ...identity, attemptId: null }, null, false)).toMatchObject({ authorized: true, canStart: true });
  });

  it("restores an active attempt", () => {
    expect(createPremiumAccessState(identity, { ...attemptRow, status: "started", completed_at: null }, false)).toMatchObject({ authorized: true, canStart: false, hasActiveAttempt: true, activeAttemptId: "attempt-1" });
  });

  it("restores one completed formal result", () => {
    expect(createPremiumAccessState(identity, attemptRow, true)).toMatchObject({ canStart: false, hasCompletedResult: true });
    expect(validatePremiumResultRecords(identity, resultRow, attemptRow)).toMatchObject({ attemptId: "attempt-1", personalityId: "09" });
  });

  it("rejects a result or portrait belonging to another Access Code", () => {
    expect(validatePremiumResultRecords(identity, { ...resultRow, access_code_id: "access-code-2" }, attemptRow)).toBeNull();
    expect(validatePremiumResultRecords(identity, resultRow, { ...attemptRow, id: "attempt-2" })).toBeNull();
  });
});
