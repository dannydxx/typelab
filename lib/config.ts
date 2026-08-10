export const PUBLIC_SITE_URL = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "http://localhost:3000";

export const PRODUCT_CONFIG = {
  brandName: "未央关系研究所",
  testName: "16型恋爱人格测试",
  xhsAccount: "",
  maxCompletedTests: 3,
  showQrCode: false,
  siteUrl: PUBLIC_SITE_URL,
} as const;

export const FREE_MODE = true;
export const PREMIUM_MODE = true;

export const XHS_FIXTURE_ATTEMPT_COOKIE_NAME = "love_xhs_fixture_attempt";
export const XHS_FIXTURE_RESULT_COOKIE_NAME = "love_xhs_fixture_result";

export const STORAGE_KEYS = {
  attemptId: "love_attempt_id",
  progress: "love_test_progress",
} as const;

export const FREE_STORAGE_KEYS = {
  progress: "love_free_test_progress",
  lastResult: "love_free_last_result",
  answerSnapshot: "love_free_answer_snapshot",
} as const;
