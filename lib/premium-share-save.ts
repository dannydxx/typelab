export type PremiumFileShareOutcome = "shared" | "unavailable" | "cancelled" | "failed";

interface FileShareNavigator {
  share?: (data: ShareData) => Promise<void>;
  canShare?: (data: ShareData) => boolean;
}

const EMBEDDED_BROWSER_PATTERN = /MicroMessenger|XiaoHongShu|XHS\/|RedApp|;\s*wv\)|\bwv\b.*Version\/4\.0/i;
const IOS_DEVICE_PATTERN = /iPhone|iPad|iPod/i;
const IOS_BROWSER_PATTERN = /Version\/[\d.]+.*Safari|CriOS|FxiOS|EdgiOS|OPiOS/i;

export function prefersPremiumImageFallback(userAgent: string, downloadSupported: boolean) {
  if (!downloadSupported || EMBEDDED_BROWSER_PATTERN.test(userAgent)) return true;
  return IOS_DEVICE_PATTERN.test(userAgent)
    && /AppleWebKit/i.test(userAgent)
    && !IOS_BROWSER_PATTERN.test(userAgent);
}

export function shouldTryPremiumFileShare(userAgent: string) {
  return IOS_DEVICE_PATTERN.test(userAgent) || EMBEDDED_BROWSER_PATTERN.test(userAgent);
}

export async function sharePremiumCardFile(
  blob: Blob,
  personalityName: string,
  shareNavigator: FileShareNavigator,
): Promise<PremiumFileShareOutcome> {
  if (!shareNavigator.share || !shareNavigator.canShare) return "unavailable";

  const file = new File([blob], `恋爱人格-${personalityName}.png`, { type: blob.type || "image/png" });
  const payload: ShareData = { title: `我的恋爱人格 · ${personalityName}`, files: [file] };

  try {
    if (!shareNavigator.canShare(payload)) return "unavailable";
    await shareNavigator.share(payload);
    return "shared";
  } catch (cause) {
    if (cause instanceof DOMException && cause.name === "AbortError") return "cancelled";
    return "failed";
  }
}
