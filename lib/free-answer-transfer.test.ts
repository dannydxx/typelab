import { describe, expect, it } from "vitest";
import { FREE_QUESTION_IDS } from "./free-questions";
import {
  createEmptyPremiumProgress,
  createFreeAnswerSnapshot,
  findFirstUnansweredIndex,
  isAnswerValue,
  mapFreeSnapshotToPremiumAnswers,
  parseFreeAnswerSnapshot,
  parsePremiumProgress,
  preparePremiumProgressForAttempt,
} from "./free-answer-transfer";
import { QUESTIONS } from "./questions";
import { calculateScores } from "./scoring";
import type { AnswerValue, FreeAnswerSnapshot, PremiumProgress } from "./types";

const completedAt = "2026-08-10T12:00:00.000Z";
const freeAnswers: AnswerValue[] = [-2, -1, 1, 2, -2, -1, 1, 2];

function snapshot(): FreeAnswerSnapshot {
  return createFreeAnswerSnapshot(freeAnswers, completedAt);
}

function rawSnapshot(overrides: Partial<FreeAnswerSnapshot> = {}): string {
  return JSON.stringify({ ...snapshot(), ...overrides });
}

describe("free answer transfer", () => {
  it("maps all 8 free answers into their matching full-question positions", () => {
    const mapped = mapFreeSnapshotToPremiumAnswers(snapshot());

    expect(mapped).not.toBeNull();
    FREE_QUESTION_IDS.forEach((questionId, index) => {
      expect(mapped?.[QUESTIONS.findIndex((question) => question.id === questionId)]).toBe(freeAnswers[index]);
    });
  });

  it("maps by question id even when the full question order changes", () => {
    const reorderedQuestions = [...QUESTIONS].reverse();
    const reorderedEntries = Object.entries(snapshot().answersByQuestionId).reverse();
    const reorderedSnapshot = {
      ...snapshot(),
      answersByQuestionId: Object.fromEntries(reorderedEntries),
    };
    const mapped = mapFreeSnapshotToPremiumAnswers(reorderedSnapshot, reorderedQuestions);

    FREE_QUESTION_IDS.forEach((questionId, index) => {
      expect(mapped?.[reorderedQuestions.findIndex((question) => question.id === questionId)]).toBe(freeAnswers[index]);
    });
  });

  it("leaves exactly 12 full questions unanswered", () => {
    const mapped = mapFreeSnapshotToPremiumAnswers(snapshot());
    expect(mapped?.filter((answer) => answer === null)).toHaveLength(12);
  });

  it("finds the first unanswered full question", () => {
    const mapped = mapFreeSnapshotToPremiumAnswers(snapshot());
    expect(mapped).not.toBeNull();
    expect(findFirstUnansweredIndex(mapped!)).toBe(1);
    expect(QUESTIONS[findFirstUnansweredIndex(mapped!)]?.id).toBe(2);
  });

  it("seeds a new premium attempt at the first unanswered question", () => {
    const progress = preparePremiumProgressForAttempt({
      attemptId: "attempt-seeded",
      existingProgress: null,
      freeSnapshot: snapshot(),
    });

    expect(progress.source).toBe("free-transfer");
    expect(progress.current).toBe(1);
    expect(progress.answers.filter((answer) => answer !== null)).toHaveLength(8);
  });

  it("requires only the 12 unanswered questions to complete a seeded attempt", () => {
    const answers = mapFreeSnapshotToPremiumAnswers(snapshot())!;
    let answeredInPremium = 0;
    let next = findFirstUnansweredIndex(answers);

    while (next !== -1) {
      answers[next] = 1;
      answeredInPremium += 1;
      next = findFirstUnansweredIndex(answers);
    }

    expect(answeredInPremium).toBe(12);
    expect(answers).not.toContain(null);
  });

  it("rejects a snapshot containing an illegal answer value", () => {
    const answersByQuestionId = { ...snapshot().answersByQuestionId, "1": 0 };
    expect(parseFreeAnswerSnapshot(rawSnapshot({ answersByQuestionId } as Partial<FreeAnswerSnapshot>))).toBeNull();
  });

  it("rejects the whole snapshot when it contains an unknown question id", () => {
    const answersByQuestionId = { ...snapshot().answersByQuestionId } as Record<string, AnswerValue>;
    delete answersByQuestionId[String(FREE_QUESTION_IDS.at(-1))];
    answersByQuestionId["999"] = 2;
    expect(parseFreeAnswerSnapshot(rawSnapshot({ answersByQuestionId }))).toBeNull();
  });

  it("rejects an unsupported snapshot version", () => {
    expect(parseFreeAnswerSnapshot(rawSnapshot({ version: 2 as 1 }))).toBeNull();
  });

  it("rejects an unsupported question-set version", () => {
    expect(parseFreeAnswerSnapshot(rawSnapshot({ questionSetVersion: "v2" as "v1" }))).toBeNull();
  });

  it("starts a normal 20-question attempt when no snapshot exists", () => {
    const progress = preparePremiumProgressForAttempt({
      attemptId: "attempt-new",
      existingProgress: null,
      freeSnapshot: null,
    });

    expect(progress).toEqual(createEmptyPremiumProgress("attempt-new"));
    expect(progress.answers).toHaveLength(20);
    expect(progress.answers.every((answer) => answer === null)).toBe(true);
  });

  it("keeps progress from the same premium attempt instead of applying the free snapshot", () => {
    const existingProgress: PremiumProgress = {
      ...createEmptyPremiumProgress("attempt-existing"),
      current: 14,
      answers: QUESTIONS.map((_, index) => index < 14 ? 1 : null),
    };
    const progress = preparePremiumProgressForAttempt({
      attemptId: "attempt-existing",
      existingProgress,
      freeSnapshot: snapshot(),
    });

    expect(progress).toBe(existingProgress);
    expect(progress.current).toBe(14);
    expect(progress.answers.slice(0, 14).every((answer) => answer === 1)).toBe(true);
  });

  it("does not treat unscoped legacy progress as progress for a newly created attempt", () => {
    const legacyProgress = JSON.stringify({ current: 10, answers: QUESTIONS.map(() => 1) });
    expect(parsePremiumProgress(legacyProgress, "attempt-new", { allowLegacy: false })).toBeNull();
    expect(parsePremiumProgress(legacyProgress, "attempt-existing")).toMatchObject({
      attemptId: "attempt-existing",
      current: 10,
      source: "premium",
    });
  });

  it("keeps a user's edited transferred answer in the final answer set", () => {
    const seeded = mapFreeSnapshotToPremiumAnswers(snapshot())!;
    seeded[0] = 2;
    const completed = seeded.map((answer) => answer ?? 1) as AnswerValue[];

    expect(completed[0]).toBe(2);
    expect(() => calculateScores(completed)).not.toThrow();
  });

  it("produces a complete, legal 20-answer payload for the existing server scorer", () => {
    const seeded = mapFreeSnapshotToPremiumAnswers(snapshot())!;
    const completed = seeded.map((answer, index) => answer ?? (index % 2 === 0 ? -1 : 1));

    expect(completed).toHaveLength(20);
    expect(completed.every(isAnswerValue)).toBe(true);
    expect(completed).not.toContain(null);
    expect(() => calculateScores(completed)).not.toThrow();
  });
});
