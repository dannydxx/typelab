export const PRODUCT_CONFIG = {
  brandName: "未央关系研究所",
  testName: "16型恋爱人格测试",
  xhsAccount: "@你的品牌账号",
  redeemValidHours: 24,
  maxCompletedTests: 3,
  showQrCode: false,
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  purchaseUrl: "",
} as const;

export const FREE_MODE = true;
export const PREMIUM_MODE = true;

export const REDEEM_CODE_PATTERN = /^LOVE-[A-HJ-KM-NP-Z2-9]{4}-[A-HJ-KM-NP-Z2-9]{4}$/;
export const REDEEM_CHARACTER_POOL = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

// 仅供 `npm run dev` 本地验收使用；生产环境中的 API 不接受此演示会话。
export const LOCAL_DEMO_CODE = "LOVE-DEMV-2626";
export const LOCAL_DEMO_SESSION = "local-demo-session-v1";

export const REDEEM_SESSION_COOKIE_NAME = "love_premium_session";
export const DEMO_ATTEMPT_COOKIE_NAME = "love_premium_demo_attempt";
export const DEMO_RESULT_COOKIE_NAME = "love_premium_demo_result";

export const STORAGE_KEYS = {
  code: "love_redeem_code",
  session: "love_redeem_session",
  activatedAt: "love_activated_at",
  attemptId: "love_attempt_id",
  progress: "love_test_progress",
  lastResult: "love_last_result",
} as const;

export const FREE_STORAGE_KEYS = {
  progress: "love_free_test_progress",
  lastResult: "love_free_last_result",
  answerSnapshot: "love_free_answer_snapshot",
} as const;
