import { PUBLIC_SITE_URL } from "./config";

const DEVELOPMENT_FALLBACK = "http://localhost:3000/";

export function getPublicEntryUrl(configuredUrl = PUBLIC_SITE_URL) {
  try {
    const url = new URL(configuredUrl);
    if (url.protocol !== "http:" && url.protocol !== "https:") return DEVELOPMENT_FALLBACK;
    url.pathname = "/";
    url.search = "";
    url.hash = "";
    return url.toString();
  } catch {
    return DEVELOPMENT_FALLBACK;
  }
}

export function getVisibleBrandAccount(account: string) {
  const normalized = account.trim();
  if (!normalized || normalized.includes("你的品牌账号")) return null;
  return normalized;
}
