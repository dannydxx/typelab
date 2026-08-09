const NETWORK_ERROR_PATTERN = /failed to fetch|networkerror|load failed|fetch failed/i;

export function getUserFacingError(cause: unknown, fallback: string) {
  if (!(cause instanceof Error)) return fallback;
  const message = cause.message.trim();
  if (!message) return fallback;
  if (NETWORK_ERROR_PATTERN.test(message)) return "无法连接服务，请确认网络和本地测试服务正常后重试。";
  if (/[a-z]{2,}/i.test(message)) return fallback;
  return message;
}
