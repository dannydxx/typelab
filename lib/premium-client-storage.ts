import { STORAGE_KEYS } from "./config";

export function clearLegacyPremiumAuthorizationStorage() {
  [
    STORAGE_KEYS.code,
    STORAGE_KEYS.session,
    STORAGE_KEYS.activatedAt,
    STORAGE_KEYS.lastResult,
  ].forEach((key) => localStorage.removeItem(key));
}

export function clearPremiumAttemptStorage() {
  [STORAGE_KEYS.attemptId, STORAGE_KEYS.progress].forEach((key) => localStorage.removeItem(key));
}

export function clearPremiumClientStorage() {
  clearLegacyPremiumAuthorizationStorage();
  clearPremiumAttemptStorage();
}
