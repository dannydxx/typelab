import { describe, expect, it } from "vitest";
import { calculateScores, calculateScoresForQuestions, getPersonality, scoreToPercent } from "./scoring";
import { FREE_QUESTIONS } from "./free-questions";
import type { AnswerValue } from "./types";

describe("scoring", () => {
  it("recalculates all four dimensions from answers", () => {
    const answers = Array.from({ length: 4 }, () => [-2, -1, 1, 1, 1]).flat() as AnswerValue[];
    expect(calculateScores(answers)).toEqual({ security: 0, closeness: 0, expression: 0, conflict: 0 });
  });

  it("maps every binary combination to one unique personality", () => {
    const values = [-1, 1];
    const found = new Set<string>();
    for (const security of values) for (const closeness of values) for (const expression of values) for (const conflict of values) {
      found.add(getPersonality({ security, closeness, expression, conflict }).id);
    }
    expect(found.size).toBe(16);
  });

  it("keeps score positions within the dimension track", () => {
    expect(scoreToPercent(-10)).toBe(0);
    expect(scoreToPercent(0)).toBe(50);
    expect(scoreToPercent(10)).toBe(100);
  });

  it("scores the free question set across all four dimensions", () => {
    expect(calculateScoresForQuestions(FREE_QUESTIONS, Array(8).fill(2))).toEqual({ security: 4, closeness: 4, expression: 4, conflict: 4 });
  });
});
