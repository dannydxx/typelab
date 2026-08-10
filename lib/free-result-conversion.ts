import type { PremiumSessionState } from "./types";

export type FreeRedeemAction = "resume-attempt" | "start-attempt" | "view-result" | "unavailable";

export function getFreeRedeemAction(state: PremiumSessionState): FreeRedeemAction {
  if (state.hasActiveAttempt && state.activeAttemptId) return "resume-attempt";
  if (state.canStart) return "start-attempt";
  if (state.hasCompletedResult) return "view-result";
  return "unavailable";
}

export function getFreeUnlockCopy(hasValidSnapshot: boolean) {
  return hasValidSnapshot ? {
    title: "继续完成剩余12题，确认你的正式人格。",
    description: "免费答案会自动带入。完成后将揭晓完整人格形象，并展开完整关系报告。",
  } : {
    title: "完成20题，确认你的正式人格。",
    description: "完整测试将重新校准关系坐标，确认正式人格，并揭晓完整人格形象与完整关系报告。",
  };
}
