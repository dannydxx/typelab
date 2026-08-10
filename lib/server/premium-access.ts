import "server-only";
import { createServiceClient } from "@/lib/supabase/service";
import type { AccessSessionIdentity } from "@/lib/server/access-session";
import type { DimensionScores, PremiumAccessState, StoredResult } from "@/lib/types";

export interface AccessResultRow {
  attempt_id: string;
  access_code_id: string;
  personality_type: string;
  dimension_scores: unknown;
  completed_at: string;
}

export interface AccessAttemptRow {
  id: string;
  access_code_id: string;
  status: string;
  completed_at: string | null;
}

const deniedState = (): PremiumAccessState => ({
  authorized: false,
  canStart: false,
  hasActiveAttempt: false,
  activeAttemptId: null,
  hasCompletedResult: false,
});

export function createPremiumAccessState(
  identity: AccessSessionIdentity | null,
  attempt: AccessAttemptRow | null,
  hasCompletedResult: boolean,
): PremiumAccessState {
  if (!identity) return deniedState();
  return {
    authorized: true,
    canStart: !attempt,
    hasActiveAttempt: attempt?.status === "started",
    activeAttemptId: attempt?.status === "started" ? attempt.id : null,
    hasCompletedResult,
  };
}

export function unavailablePremiumAccessState() {
  return deniedState();
}

function isDimensionScores(value: unknown): value is DimensionScores {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const scores = value as Record<string, unknown>;
  return ["security", "closeness", "expression", "conflict"].every(
    (key) => typeof scores[key] === "number" && Number.isFinite(scores[key]) && (scores[key] as number) >= -10 && (scores[key] as number) <= 10,
  );
}

export function validatePremiumResultRecords(
  identity: AccessSessionIdentity | null,
  result: AccessResultRow | null,
  attempt: AccessAttemptRow | null,
): StoredResult | null {
  if (
    !identity
    || !result
    || !attempt
    || result.access_code_id !== identity.accessCodeId
    || attempt.access_code_id !== identity.accessCodeId
    || attempt.id !== result.attempt_id
    || identity.attemptId !== attempt.id
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

export async function getPremiumAccessState(identity: AccessSessionIdentity | null): Promise<PremiumAccessState> {
  if (!identity) return deniedState();
  const supabase = createServiceClient();
  const { data: attempt, error: attemptError } = identity.attemptId
    ? await supabase.from("test_attempts").select("id, access_code_id, status, completed_at").eq("id", identity.attemptId).maybeSingle()
    : { data: null, error: null };
  if (attemptError) throw attemptError;
  const { data: result, error: resultError } = identity.attemptId
    ? await supabase.from("test_results").select("attempt_id").eq("access_code_id", identity.accessCodeId).eq("attempt_id", identity.attemptId).maybeSingle()
    : { data: null, error: null };
  if (resultError) throw resultError;
  return createPremiumAccessState(identity, attempt as AccessAttemptRow | null, Boolean(result));
}

export async function getPremiumResultForAccess(identity: AccessSessionIdentity): Promise<StoredResult | null> {
  if (!identity.attemptId) return null;
  const supabase = createServiceClient();
  const { data: result, error: resultError } = await supabase
    .from("test_results")
    .select("attempt_id, access_code_id, personality_type, dimension_scores, completed_at")
    .eq("access_code_id", identity.accessCodeId)
    .eq("attempt_id", identity.attemptId)
    .maybeSingle();
  if (resultError || !result) return null;
  const { data: attempt, error: attemptError } = await supabase
    .from("test_attempts")
    .select("id, access_code_id, status, completed_at")
    .eq("id", identity.attemptId)
    .maybeSingle();
  if (attemptError || !attempt) return null;
  return validatePremiumResultRecords(identity, result as AccessResultRow, attempt as AccessAttemptRow);
}
