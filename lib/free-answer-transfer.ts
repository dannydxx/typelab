import { FREE_QUESTION_IDS, FREE_QUESTIONS } from "./free-questions";
import { QUESTIONS } from "./questions";
import type { AnswerValue, FreeAnswerSnapshot, PremiumProgress, Question } from "./types";

export const FREE_ANSWER_SNAPSHOT_VERSION = 1 as const;
export const FREE_QUESTION_SET_VERSION = "v1" as const;
export const PREMIUM_PROGRESS_VERSION = 1 as const;

const allowedFreeQuestionIds = new Set(FREE_QUESTION_IDS.map(String));

export function isAnswerValue(value: unknown): value is AnswerValue {
  return value === -2 || value === -1 || value === 1 || value === 2;
}

export function createFreeAnswerSnapshot(
  answers: Array<AnswerValue | null>,
  completedAt: string,
): FreeAnswerSnapshot {
  if (answers.length !== FREE_QUESTIONS.length || answers.some((answer) => !isAnswerValue(answer))) {
    throw new Error("INCOMPLETE_FREE_ANSWERS");
  }

  return {
    version: FREE_ANSWER_SNAPSHOT_VERSION,
    questionSetVersion: FREE_QUESTION_SET_VERSION,
    answersByQuestionId: Object.fromEntries(
      FREE_QUESTIONS.map((question, index) => [String(question.id), answers[index] as AnswerValue]),
    ),
    completedAt,
  };
}

export function parseFreeAnswerSnapshot(raw: string | null): FreeAnswerSnapshot | null {
  if (!raw) return null;

  try {
    const candidate = JSON.parse(raw) as Partial<FreeAnswerSnapshot>;
    if (
      candidate.version !== FREE_ANSWER_SNAPSHOT_VERSION
      || candidate.questionSetVersion !== FREE_QUESTION_SET_VERSION
      || typeof candidate.completedAt !== "string"
      || Number.isNaN(Date.parse(candidate.completedAt))
      || !candidate.answersByQuestionId
      || typeof candidate.answersByQuestionId !== "object"
      || Array.isArray(candidate.answersByQuestionId)
    ) return null;

    const entries = Object.entries(candidate.answersByQuestionId);
    if (
      entries.length !== FREE_QUESTION_IDS.length
      || entries.some(([questionId, answer]) => !allowedFreeQuestionIds.has(questionId) || !isAnswerValue(answer))
      || FREE_QUESTION_IDS.some((questionId) => !Object.hasOwn(candidate.answersByQuestionId!, String(questionId)))
    ) return null;

    return candidate as FreeAnswerSnapshot;
  } catch {
    return null;
  }
}

export function mapFreeSnapshotToPremiumAnswers(
  snapshot: FreeAnswerSnapshot,
  questions: Question[] = QUESTIONS,
): Array<AnswerValue | null> | null {
  const questionIndexById = new Map(questions.map((question, index) => [String(question.id), index]));
  const answers: Array<AnswerValue | null> = Array(questions.length).fill(null);

  for (const [questionId, answer] of Object.entries(snapshot.answersByQuestionId)) {
    const index = questionIndexById.get(questionId);
    if (index === undefined || !isAnswerValue(answer)) return null;
    answers[index] = answer;
  }

  return answers;
}

export function findFirstUnansweredIndex(answers: Array<AnswerValue | null>): number {
  return answers.findIndex((answer) => answer === null);
}

export function createEmptyPremiumProgress(attemptId: string): PremiumProgress {
  return {
    version: PREMIUM_PROGRESS_VERSION,
    attemptId,
    current: 0,
    answers: Array(QUESTIONS.length).fill(null),
    source: "premium",
  };
}

export function parsePremiumProgress(
  raw: string | null,
  attemptId: string,
  { allowLegacy = true }: { allowLegacy?: boolean } = {},
): PremiumProgress | null {
  if (!raw) return null;

  try {
    const candidate = JSON.parse(raw) as Partial<PremiumProgress>;
    if (
      (candidate.version !== undefined && candidate.version !== PREMIUM_PROGRESS_VERSION)
      || (!allowLegacy && candidate.attemptId === undefined)
      || (candidate.attemptId !== undefined && candidate.attemptId !== attemptId)
      || !Array.isArray(candidate.answers)
      || candidate.answers.length !== QUESTIONS.length
      || candidate.answers.some((answer) => answer !== null && !isAnswerValue(answer))
      || !Number.isInteger(candidate.current)
      || (candidate.current as number) < 0
      || (candidate.current as number) >= QUESTIONS.length
      || (candidate.source !== undefined && candidate.source !== "premium" && candidate.source !== "free-transfer")
    ) return null;

    return {
      version: PREMIUM_PROGRESS_VERSION,
      attemptId,
      current: candidate.current as number,
      answers: candidate.answers as Array<AnswerValue | null>,
      source: candidate.source ?? "premium",
    };
  } catch {
    return null;
  }
}

export function preparePremiumProgressForAttempt({
  attemptId,
  existingProgress,
  freeSnapshot,
}: {
  attemptId: string;
  existingProgress: PremiumProgress | null;
  freeSnapshot: FreeAnswerSnapshot | null;
}): PremiumProgress {
  if (existingProgress?.attemptId === attemptId) return existingProgress;
  if (!freeSnapshot) return createEmptyPremiumProgress(attemptId);

  const answers = mapFreeSnapshotToPremiumAnswers(freeSnapshot);
  if (!answers) return createEmptyPremiumProgress(attemptId);

  const current = findFirstUnansweredIndex(answers);
  return {
    version: PREMIUM_PROGRESS_VERSION,
    attemptId,
    current: current === -1 ? 0 : current,
    answers,
    source: "free-transfer",
  };
}
