export const PUBLIC_SITE_URL = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "http://localhost:3000";

export const PRODUCT_CONFIG = {
  brandName: "未央关系研究所",
  testName: "16型恋爱人格测试",
  xhsAccount: "",
  showQrCode: false,
  siteUrl: PUBLIC_SITE_URL,
} as const;

export const FREE_MODE = true;
export const PREMIUM_MODE = true;

export const ACCESS_SESSION_COOKIE_NAME = "love_access_session";
const configuredTestHours = Number(process.env.ACCESS_TEST_TTL_HOURS || 72);
const configuredResultDays = Number(process.env.RESULT_VIEW_TTL_DAYS || 30);
export const ACCESS_TEST_TTL_HOURS = Number.isInteger(configuredTestHours) && configuredTestHours >= 1 && configuredTestHours <= 720
  ? configuredTestHours
  : 72;
export const RESULT_VIEW_TTL_DAYS = Number.isInteger(configuredResultDays) && configuredResultDays >= 1 && configuredResultDays <= 365
  ? configuredResultDays
  : 30;
export const ACCESS_ACTIVATION_RATE_LIMIT = {
  maxAttempts: 10,
  windowSeconds: 60,
  blockSeconds: 15 * 60,
} as const;
export const ACCESS_CODE_CHARACTER_POOL = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
export const ACCESS_CODE_PATTERN = /^[A-HJ-KM-NP-Z2-9]{4}-[A-HJ-KM-NP-Z2-9]{4}$/;

export const STORAGE_KEYS = {
  attemptId: "love_attempt_id",
  progress: "love_test_progress",
} as const;

export const FREE_STORAGE_KEYS = {
  progress: "love_free_test_progress",
  lastResult: "love_free_last_result",
  answerSnapshot: "love_free_answer_snapshot",
} as const;
