import { STORAGE_KEYS } from "./config";

export function clearPremiumAttemptStorage() {
  [STORAGE_KEYS.attemptId, STORAGE_KEYS.progress].forEach((key) => localStorage.removeItem(key));
}

export function clearPremiumClientStorage() {
  clearPremiumAttemptStorage();
}
