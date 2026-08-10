import { FREE_STORAGE_KEYS, STORAGE_KEYS } from "./config";
import {
  parseFreeAnswerSnapshot,
  parsePremiumProgress,
  preparePremiumProgressForAttempt,
} from "./free-answer-transfer";

export async function startPremiumAttempt(sessionToken: string) {
  const response = await fetch("/api/attempts/start", { method: "POST", headers: { "x-redeem-session": sessionToken } });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "暂时无法开始测试，请稍后再试。");
  const attemptId = data.attemptId as string;
  const existingProgress = parsePremiumProgress(
    localStorage.getItem(STORAGE_KEYS.progress),
    attemptId,
    { allowLegacy: false },
  );
  const freeSnapshot = parseFreeAnswerSnapshot(localStorage.getItem(FREE_STORAGE_KEYS.answerSnapshot));
  const initialProgress = preparePremiumProgressForAttempt({ attemptId, existingProgress, freeSnapshot });

  localStorage.setItem(STORAGE_KEYS.attemptId, attemptId);
  localStorage.setItem(STORAGE_KEYS.progress, JSON.stringify(initialProgress));
  return attemptId;
}
