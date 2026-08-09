import { QUESTIONS } from "./questions";

// 每个维度精选两题，内容仍来自完整版唯一题库，避免维护两份文案。
export const FREE_QUESTION_IDS = [1, 4, 6, 9, 11, 14, 16, 19] as const;
export const FREE_QUESTIONS = FREE_QUESTION_IDS.map((id) => {
  const question = QUESTIONS.find((item) => item.id === id);
  if (!question) throw new Error(`FREE_QUESTION_NOT_FOUND:${id}`);
  return question;
});
