import { STORAGE_KEYS } from "./config";

export async function startPremiumAttempt(sessionToken: string) {
  const response = await fetch("/api/attempts/start", { method: "POST", headers: { "x-redeem-session": sessionToken } });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "暂时无法开始测试，请稍后再试。");
  localStorage.setItem(STORAGE_KEYS.attemptId, data.attemptId);
  localStorage.removeItem(STORAGE_KEYS.progress);
  return data.attemptId as string;
}
