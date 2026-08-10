import "server-only";
import { createHmac, timingSafeEqual } from "crypto";
import { createServiceClient } from "@/lib/supabase/service";
import type {
  DimensionScores,
  PlatformEntitlementIdentity,
  PremiumAccessState,
  StoredResult,
} from "@/lib/types";

export interface EntitledResultRow {
  attempt_id: string;
  entitlement_id: string;
  personality_type: string;
  dimension_scores: unknown;
  completed_at: string;
}

export interface EntitledAttemptRow {
  id: string;
  entitlement_id: string;
  platform_user_id: string;
  status: string;
  completed_at: string | null;
}

const deniedState = (): PremiumAccessState => ({
  entitled: false,
  canStart: false,
  hasActiveAttempt: false,
  activeAttemptId: null,
  hasCompletedResult: false,
});

export function createPremiumAccessState(
  identity: PlatformEntitlementIdentity | null,
  completedCount: number,
  activeAttemptId: string | null,
  hasCompletedResult: boolean,
): PremiumAccessState {
  if (!identity?.entitlement.entitled) return deniedState();
  return {
    entitled: true,
    canStart: completedCount < identity.maxCompletedTests,
    hasActiveAttempt: Boolean(activeAttemptId),
    activeAttemptId,
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

export function validateEntitledResultRecords(
  identity: PlatformEntitlementIdentity | null,
  result: EntitledResultRow | null,
  attempt: EntitledAttemptRow | null,
): StoredResult | null {
  if (
    !identity?.entitlement.entitled
    || !result
    || !attempt
    || result.entitlement_id !== identity.entitlementId
    || attempt.entitlement_id !== identity.entitlementId
    || attempt.platform_user_id !== identity.platformUserId
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

function fixtureSigningSecret() {
  return process.env.XHS_FIXTURE_SIGNING_SECRET || "development-only-xhs-fixture-secret";
}

function fixtureSignature(payload: string) {
  return createHmac("sha256", fixtureSigningSecret()).update(payload).digest("base64url");
}

export function encodeFixturePremiumResult(result: StoredResult) {
  const payload = Buffer.from(JSON.stringify(result)).toString("base64url");
  return `${payload}.${fixtureSignature(payload)}`;
}

export function decodeFixturePremiumResult(value: string | null | undefined): StoredResult | null {
  if (!value) return null;
  const [payload, signature] = value.split(".");
  if (!payload || !signature) return null;
  const expected = fixtureSignature(payload);
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (signatureBuffer.length !== expectedBuffer.length || !timingSafeEqual(signatureBuffer, expectedBuffer)) return null;
  try {
    const result = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as StoredResult;
    if (typeof result.attemptId !== "string" || !/^(0[1-9]|1[0-6])$/.test(result.personalityId) || !isDimensionScores(result.scores) || Number.isNaN(Date.parse(result.completedAt))) return null;
    return result;
  } catch {
    return null;
  }
}

export async function getPremiumAccessState(
  identity: PlatformEntitlementIdentity | null,
  fixtureState?: { activeAttemptId?: string | null; resultCookie?: string | null },
): Promise<PremiumAccessState> {
  if (!identity?.entitlement.entitled) return deniedState();
  if (identity.fixture) {
    const result = decodeFixturePremiumResult(fixtureState?.resultCookie);
    return createPremiumAccessState(identity, result ? 1 : 0, fixtureState?.activeAttemptId ?? null, Boolean(result));
  }

  const supabase = createServiceClient();
  const [attemptQuery, resultsQuery] = await Promise.all([
    supabase.from("premium_test_attempts").select("id, started_at").eq("entitlement_id", identity.entitlementId).eq("platform_user_id", identity.platformUserId).eq("status", "started").order("started_at", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("premium_test_results").select("attempt_id, completed_at").eq("entitlement_id", identity.entitlementId).order("completed_at", { ascending: false }),
  ]);
  if (attemptQuery.error) throw attemptQuery.error;
  if (resultsQuery.error) throw resultsQuery.error;
  const latestResult = resultsQuery.data?.[0] ?? null;
  const activeAttempt = attemptQuery.data;
  const activeAttemptId = activeAttempt && (!latestResult || Date.parse(activeAttempt.started_at) > Date.parse(latestResult.completed_at)) ? activeAttempt.id : null;
  return createPremiumAccessState(identity, resultsQuery.data?.length ?? 0, activeAttemptId, Boolean(latestResult));
}

export async function getPremiumResultForEntitlement(identity: PlatformEntitlementIdentity): Promise<StoredResult | null> {
  if (identity.fixture) return null;
  const supabase = createServiceClient();
  const { data: result, error: resultError } = await supabase.from("premium_test_results").select("attempt_id, entitlement_id, personality_type, dimension_scores, completed_at").eq("entitlement_id", identity.entitlementId).order("completed_at", { ascending: false }).limit(1).maybeSingle();
  if (resultError || !result) return null;
  const { data: attempt, error: attemptError } = await supabase.from("premium_test_attempts").select("id, entitlement_id, platform_user_id, status, completed_at").eq("id", result.attempt_id).maybeSingle();
  if (attemptError || !attempt) return null;
  return validateEntitledResultRecords(identity, result as EntitledResultRow, attempt as EntitledAttemptRow);
}
