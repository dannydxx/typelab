import type { DimensionScores, Personality, StoredResult } from "./types";

export function createDevPremiumResult(personality: Personality): StoredResult {
  const scores: DimensionScores = {
    security: personality.poles[0] === "sensitive" ? 6 : -6,
    closeness: personality.poles[1] === "close" ? 6 : -6,
    expression: personality.poles[2] === "direct" ? 6 : -6,
    conflict: personality.poles[3] === "resolve" ? 6 : -6,
  };

  return {
    attemptId: `dev-preview-type-${personality.id}`,
    personalityId: personality.id,
    scores,
    completedAt: "2026-01-01T00:00:00.000Z",
  };
}
