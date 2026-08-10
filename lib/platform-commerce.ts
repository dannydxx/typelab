export type PlatformCommerceAction =
  | { available: false; platform: "xiaohongshu" }
  | { available: true; platform: "xiaohongshu"; href: string; label: string };

export function getPlatformCommerceAction(value = process.env.NEXT_PUBLIC_XHS_PRODUCT_URL ?? ""): PlatformCommerceAction {
  try {
    const url = new URL(value.trim());
    if (url.protocol !== "https:" && url.protocol !== "http:") return { available: false, platform: "xiaohongshu" };
    return { available: true, platform: "xiaohongshu", href: url.toString(), label: "前往小红书商品页" };
  } catch {
    return { available: false, platform: "xiaohongshu" };
  }
}
