import type { DimensionScores, StoredResult } from "./types";

function readFreeScores(value: unknown): DimensionScores | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const candidate = value as Record<string, unknown>;
  const keys: Array<keyof DimensionScores> = ["security", "closeness", "expression", "conflict"];
  if (keys.some((key) => typeof candidate[key] !== "number" || !Number.isFinite(candidate[key]) || (candidate[key] as number) < -4 || (candidate[key] as number) > 4)) return null;
  return {
    security: candidate.security as number,
    closeness: candidate.closeness as number,
    expression: candidate.expression as number,
    conflict: candidate.conflict as number,
  };
}

export function parseFreeStoredResult(raw: string): StoredResult | null {
  try {
    const candidate = JSON.parse(raw) as Partial<StoredResult>;
    if (
      typeof candidate.personalityId !== "string"
      || !/^(0[1-9]|1[0-6])$/.test(candidate.personalityId)
      || typeof candidate.attemptId !== "string"
      || typeof candidate.completedAt !== "string"
      || Number.isNaN(Date.parse(candidate.completedAt))
    ) return null;
    const scores = readFreeScores(candidate.scores);
    if (!scores) return null;
    return { attemptId: candidate.attemptId, personalityId: candidate.personalityId, scores, completedAt: candidate.completedAt };
  } catch {
    return null;
  }
}
