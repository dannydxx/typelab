import type { PremiumSessionState } from "./types";

export type FreeRedeemAction = "resume-attempt" | "start-attempt" | "view-result" | "unavailable";

export function getFreeRedeemAction(state: PremiumSessionState): FreeRedeemAction {
  if (state.hasActiveAttempt && state.activeAttemptId) return "resume-attempt";
  if (state.canStart) return "start-attempt";
  if (state.hasCompletedResult) return "view-result";
  return "unavailable";
}
