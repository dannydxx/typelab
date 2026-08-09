import { PERSONALITIES, PERSONALITY_BY_ID } from "./personalities";
import type { DimensionScores, StoredResult } from "./types";

// 仅用于兼容旧Demo的localStorage显示；这些名称不是当前正式人格名称。
export const LEGACY_PERSONALITY_NAME_TO_ID: Record<string, string> = {
  "雨夜小鹿型": "12",
  "琥珀狐狸型": "13",
  "极光猫型": "14",
  "雾岛白鲸型": "15",
  "雪夜黑猫型": "16",
};

function normalizeTypeId(value: unknown): string | null {
  if (typeof value === "number" && Number.isInteger(value) && value >= 1 && value <= 16) return String(value).padStart(2, "0");
  if (typeof value !== "string") return null;
  const direct = value.trim().toUpperCase().match(/^(?:TYPE[_ -]?)?(0?[1-9]|1[0-6])$/)?.[1];
  if (!direct) return null;
  const id = direct.padStart(2, "0");
  return PERSONALITY_BY_ID[id] ? id : null;
}

function normalizeScores(value: unknown): DimensionScores {
  const fallback = { security: 0, closeness: 0, expression: 0, conflict: 0 };
  if (!value || typeof value !== "object") return fallback;
  const candidate = value as Partial<Record<keyof DimensionScores, unknown>>;
  return {
    security: typeof candidate.security === "number" ? candidate.security : 0,
    closeness: typeof candidate.closeness === "number" ? candidate.closeness : 0,
    expression: typeof candidate.expression === "number" ? candidate.expression : 0,
    conflict: typeof candidate.conflict === "number" ? candidate.conflict : 0,
  };
}

export function normalizeStoredResult(raw: string): StoredResult | null {
  try {
    const data = JSON.parse(raw) as Record<string, unknown>;
    const nestedPersonality = data.personality && typeof data.personality === "object" ? data.personality as Record<string, unknown> : null;
    const name = [data.personalityName, data.personality_name, data.name, nestedPersonality?.name].find((value) => typeof value === "string") as string | undefined;
    const currentNameId = name ? PERSONALITIES.find((item) => item.name === name)?.id : undefined;
    const personalityId =
      normalizeTypeId(data.personalityId) ??
      normalizeTypeId(data.personality_type) ??
      normalizeTypeId(data.typeNumber) ??
      normalizeTypeId(nestedPersonality?.id) ??
      currentNameId ??
      (name ? LEGACY_PERSONALITY_NAME_TO_ID[name] : undefined);
    if (!personalityId || !PERSONALITY_BY_ID[personalityId]) return null;

    return {
      attemptId: typeof data.attemptId === "string" ? data.attemptId : "legacy-local-result",
      personalityId,
      scores: normalizeScores(data.scores ?? data.dimension_scores),
      completedAt: typeof data.completedAt === "string" ? data.completedAt : new Date().toISOString(),
    };
  } catch {
    return null;
  }
}
