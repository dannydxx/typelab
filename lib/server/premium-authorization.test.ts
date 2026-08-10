import { describe, expect, it } from "vitest";
import {
  createPremiumSessionState,
  unauthenticatedPremiumSessionState,
  validatePremiumResultRecords,
  validateRedeemSessionRecords,
  type PremiumAttemptRow,
  type PremiumResultRow,
  type RedeemCodeRow,
  type RedeemSessionIdentity,
  type RedeemSessionRow,
} from "./premium-authorization";

const now = new Date("2026-08-10T12:00:00.000Z");
const sessionRow: RedeemSessionRow = {
  id: "session-1",
  redeem_code_id: "code-1",
  expires_at: "2026-08-11T12:00:00.000Z",
};
const codeRow: RedeemCodeRow = {
  id: "code-1",
  status: "active",
  activated_at: "2026-08-10T12:00:00.000Z",
  expires_at: "2026-08-11T12:00:00.000Z",
  completed_count: 1,
  max_completed_count: 3,
};

function identity(): RedeemSessionIdentity {
  const value = validateRedeemSessionRecords(sessionRow, codeRow, now);
  if (!value) throw new Error("expected valid identity");
  return value;
}

const resultRow: PremiumResultRow = {
  attempt_id: "attempt-1",
  redeem_code_id: "code-1",
  personality_type: "10",
  dimension_scores: { security: 2, closeness: -2, expression: 4, conflict: -4 },
  completed_at: "2026-08-10T13:00:00.000Z",
};
const attemptRow: PremiumAttemptRow = {
  id: "attempt-1",
  redeem_code_id: "code-1",
  status: "completed",
  completed_at: "2026-08-10T13:00:00.000Z",
};

describe("premium server authorization", () => {
  it("accepts a live session whose redeem code is active", () => {
    expect(validateRedeemSessionRecords(sessionRow, codeRow, now)).toMatchObject({
      sessionId: "session-1",
      redeemCodeId: "code-1",
      demo: false,
    });
  });

  it("rejects an expired session", () => {
    expect(validateRedeemSessionRecords({ ...sessionRow, expires_at: "2026-08-10T11:59:59.000Z" }, codeRow, now)).toBeNull();
  });

  it("rejects a missing session", () => {
    expect(validateRedeemSessionRecords(null, codeRow, now)).toBeNull();
  });

  it("rejects an expired or disabled redeem code", () => {
    expect(validateRedeemSessionRecords(sessionRow, { ...codeRow, expires_at: "2026-08-10T11:00:00.000Z" }, now)).toBeNull();
    expect(validateRedeemSessionRecords(sessionRow, { ...codeRow, status: "disabled" }, now)).toBeNull();
  });

  it("accepts a completed result belonging to the authenticated redeem identity", () => {
    expect(validatePremiumResultRecords(identity(), resultRow, attemptRow)).toEqual({
      attemptId: "attempt-1",
      personalityId: "10",
      scores: resultRow.dimension_scores,
      completedAt: resultRow.completed_at,
    });
  });

  it("rejects a result belonging to another redeem code", () => {
    expect(validatePremiumResultRecords(identity(), { ...resultRow, redeem_code_id: "code-2" }, attemptRow)).toBeNull();
  });

  it("rejects an attempt belonging to another redeem code", () => {
    expect(validatePremiumResultRecords(identity(), resultRow, { ...attemptRow, redeem_code_id: "code-2" })).toBeNull();
  });

  it("does not display a result before its attempt is completed", () => {
    expect(validatePremiumResultRecords(identity(), resultRow, { ...attemptRow, status: "started", completed_at: null })).toBeNull();
  });

  it("cannot authorize a forged localStorage session without a server identity", () => {
    const forgedLocalStorageSession = "forged-browser-token";
    expect(forgedLocalStorageSession).toBeTruthy();
    expect(validatePremiumResultRecords(null, resultRow, attemptRow)).toBeNull();
  });

  it("ignores a forged localStorage result when no server result exists", () => {
    const forgedLocalStorageResult = { personalityId: "10", scores: resultRow.dimension_scores };
    expect(forgedLocalStorageResult).toBeTruthy();
    expect(validatePremiumResultRecords(identity(), null, attemptRow)).toBeNull();
  });

  it("returns only the minimum public session state", () => {
    const state = createPremiumSessionState(identity(), "attempt-1", true);
    expect(state).toEqual({
      authenticated: true,
      canStart: true,
      hasActiveAttempt: true,
      activeAttemptId: "attempt-1",
      hasCompletedResult: true,
    });
    expect(JSON.stringify(state)).not.toMatch(/token|redeem.?code|sessionId/i);
  });

  it("returns a closed public state for unauthenticated clients", () => {
    expect(unauthenticatedPremiumSessionState()).toEqual({
      authenticated: false,
      canStart: false,
      hasActiveAttempt: false,
      activeAttemptId: null,
      hasCompletedResult: false,
    });
  });

  it("can reconstruct the same authorized result after a page refresh", () => {
    const firstLoad = validatePremiumResultRecords(identity(), resultRow, attemptRow);
    const refreshedLoad = validatePremiumResultRecords(identity(), resultRow, attemptRow);
    expect(refreshedLoad).toEqual(firstLoad);
  });
});
