import "server-only";
import { createHmac, timingSafeEqual } from "crypto";
import { LOCAL_DEMO_SESSION } from "@/lib/config";
import { createServiceClient } from "@/lib/supabase/service";
import type { PremiumSessionState, StoredResult } from "@/lib/types";
import {
  createPremiumSessionState,
  validatePremiumResultRecords,
  type PremiumAttemptRow,
  type PremiumResultRow,
  type RedeemSessionIdentity,
} from "./premium-authorization";

function demoSignature(payload: string) {
  return createHmac("sha256", LOCAL_DEMO_SESSION).update(payload).digest("base64url");
}

export function encodeDemoPremiumResult(result: StoredResult) {
  const payload = Buffer.from(JSON.stringify(result)).toString("base64url");
  return `${payload}.${demoSignature(payload)}`;
}

export function decodeDemoPremiumResult(value: string | null | undefined): StoredResult | null {
  if (!value) return null;
  const [payload, signature] = value.split(".");
  if (!payload || !signature) return null;
  const expected = demoSignature(payload);
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (signatureBuffer.length !== expectedBuffer.length || !timingSafeEqual(signatureBuffer, expectedBuffer)) return null;

  try {
    const result = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as StoredResult;
    if (
      typeof result.attemptId !== "string"
      || !/^(0[1-9]|1[0-6])$/.test(result.personalityId)
      || !result.scores
      || typeof result.completedAt !== "string"
    ) return null;
    return result;
  } catch {
    return null;
  }
}

export async function getPremiumSessionState(
  identity: RedeemSessionIdentity,
  demoState?: { activeAttemptId?: string | null; resultCookie?: string | null },
): Promise<PremiumSessionState> {
  if (identity.demo) {
    return createPremiumSessionState(
      identity,
      demoState?.activeAttemptId ?? null,
      Boolean(decodeDemoPremiumResult(demoState?.resultCookie)),
    );
  }

  const supabase = createServiceClient();
  const [activeAttemptQuery, latestResultQuery] = await Promise.all([
    supabase
      .from("test_attempts")
      .select("id, started_at")
      .eq("redeem_code_id", identity.redeemCodeId)
      .eq("status", "started")
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("test_results")
      .select("attempt_id, completed_at")
      .eq("redeem_code_id", identity.redeemCodeId)
      .order("completed_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);
  if (activeAttemptQuery.error) throw activeAttemptQuery.error;
  if (latestResultQuery.error) throw latestResultQuery.error;
  const activeAttempt = activeAttemptQuery.data;
  const latestResult = latestResultQuery.data;

  const activeAttemptId = activeAttempt
    && (!latestResult || Date.parse(activeAttempt.started_at) > Date.parse(latestResult.completed_at))
    ? activeAttempt.id
    : null;
  return createPremiumSessionState(identity, activeAttemptId, Boolean(latestResult));
}

export async function getPremiumResultForSession(identity: RedeemSessionIdentity): Promise<StoredResult | null> {
  if (identity.demo) return null;
  const supabase = createServiceClient();
  const { data: result, error: resultError } = await supabase
    .from("test_results")
    .select("attempt_id, redeem_code_id, personality_type, dimension_scores, completed_at")
    .eq("redeem_code_id", identity.redeemCodeId)
    .order("completed_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (resultError || !result) return null;

  const { data: attempt, error: attemptError } = await supabase
    .from("test_attempts")
    .select("id, redeem_code_id, status, completed_at")
    .eq("id", result.attempt_id)
    .maybeSingle();
  if (attemptError || !attempt) return null;

  return validatePremiumResultRecords(
    identity,
    result as PremiumResultRow,
    attempt as PremiumAttemptRow,
  );
}
