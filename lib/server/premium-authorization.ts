import type { DimensionScores, PremiumSessionState, StoredResult } from "../types";

export interface RedeemSessionRow {
  id: string;
  redeem_code_id: string;
  expires_at: string;
}

export interface RedeemCodeRow {
  id: string;
  status: string;
  activated_at: string | null;
  expires_at: string | null;
  completed_count: number;
  max_completed_count: number;
}

export interface RedeemSessionIdentity {
  sessionId: string;
  redeemCodeId: string;
  sessionExpiresAt: string;
  codeExpiresAt: string;
  activatedAt: string | null;
  completedCount: number;
  maxCompletedCount: number;
  demo: boolean;
}

export interface PremiumResultRow {
  attempt_id: string;
  redeem_code_id: string;
  personality_type: string;
  dimension_scores: unknown;
  completed_at: string;
}

export interface PremiumAttemptRow {
  id: string;
  redeem_code_id: string;
  status: string;
  completed_at: string | null;
}

export function validateRedeemSessionRecords(
  session: RedeemSessionRow | null,
  code: RedeemCodeRow | null,
  now = new Date(),
): RedeemSessionIdentity | null {
  if (!session || !code || session.redeem_code_id !== code.id || code.status !== "active" || !code.expires_at) return null;
  const sessionExpiry = Date.parse(session.expires_at);
  const codeExpiry = Date.parse(code.expires_at);
  if (!Number.isFinite(sessionExpiry) || !Number.isFinite(codeExpiry) || sessionExpiry <= now.getTime() || codeExpiry <= now.getTime()) return null;

  return {
    sessionId: session.id,
    redeemCodeId: code.id,
    sessionExpiresAt: session.expires_at,
    codeExpiresAt: code.expires_at,
    activatedAt: code.activated_at,
    completedCount: Number(code.completed_count),
    maxCompletedCount: Number(code.max_completed_count),
    demo: false,
  };
}

export function createPremiumSessionState(
  identity: RedeemSessionIdentity,
  activeAttemptId: string | null,
  hasCompletedResult: boolean,
): PremiumSessionState {
  return {
    authenticated: true,
    canStart: identity.completedCount < identity.maxCompletedCount,
    hasActiveAttempt: Boolean(activeAttemptId),
    activeAttemptId,
    hasCompletedResult,
  };
}

export function unauthenticatedPremiumSessionState(): PremiumSessionState {
  return {
    authenticated: false,
    canStart: false,
    hasActiveAttempt: false,
    activeAttemptId: null,
    hasCompletedResult: false,
  };
}

function isDimensionScores(value: unknown): value is DimensionScores {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const scores = value as Record<string, unknown>;
  return ["security", "closeness", "expression", "conflict"].every(
    (key) => typeof scores[key] === "number" && Number.isFinite(scores[key]) && (scores[key] as number) >= -10 && (scores[key] as number) <= 10,
  );
}

export function validatePremiumResultRecords(
  identity: RedeemSessionIdentity | null,
  result: PremiumResultRow | null,
  attempt: PremiumAttemptRow | null,
): StoredResult | null {
  if (
    !identity
    || !result
    || !attempt
    || result.redeem_code_id !== identity.redeemCodeId
    || attempt.redeem_code_id !== identity.redeemCodeId
    || attempt.id !== result.attempt_id
    || attempt.status !== "completed"
    || !attempt.completed_at
    || !/^(0[1-9]|1[0-6])$/.test(result.personality_type)
    || !isDimensionScores(result.dimension_scores)
    || Number.isNaN(Date.parse(result.completed_at))
  ) return null;

  return {
    attemptId: result.attempt_id,
    personalityId: result.personality_type,
    scores: result.dimension_scores,
    completedAt: result.completed_at,
  };
}
