import { PERSONALITIES } from "./personalities";
import { QUESTIONS } from "./questions";
import type { AnswerValue, DimensionScores, Personality, Question } from "./types";

export function calculateScores(answers: Array<AnswerValue | null>): DimensionScores {
  return calculateScoresForQuestions(QUESTIONS, answers);
}

export function calculateScoresForQuestions(questions: Question[], answers: Array<AnswerValue | null>): DimensionScores {
  if (answers.length !== questions.length || answers.some((answer) => answer === null)) {
    throw new Error("INCOMPLETE_ANSWERS");
  }

  return questions.reduce<DimensionScores>((scores, question, index) => {
    scores[question.dimension] += answers[index] as AnswerValue;
    return scores;
  }, { security: 0, closeness: 0, expression: 0, conflict: 0 });
}

export function personalityKey(scores: DimensionScores): Personality["poles"] {
  return [
    scores.security >= 0 ? "sensitive" : "stable",
    scores.closeness >= 0 ? "close" : "independent",
    scores.expression >= 0 ? "direct" : "restrained",
    scores.conflict >= 0 ? "resolve" : "calm",
  ];
}

export function getPersonality(scores: DimensionScores): Personality {
  const key = personalityKey(scores).join("|");
  const personality = PERSONALITIES.find((item) => item.poles.join("|") === key);
  if (!personality) throw new Error(`PERSONALITY_NOT_FOUND:${key}`);
  return personality;
}

export function scoreToPercent(score: number): number {
  return Math.max(0, Math.min(100, ((score + 10) / 20) * 100));
}
