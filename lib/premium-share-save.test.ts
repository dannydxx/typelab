import { describe, expect, it, vi } from "vitest";
import {
  prefersPremiumImageFallback,
  sharePremiumCardFile,
  shouldTryPremiumFileShare,
} from "./premium-share-save";

const desktopChrome = "Mozilla/5.0 (Macintosh; Intel Mac OS X) AppleWebKit/537.36 Chrome/140.0 Safari/537.36";
const iosSafari = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1";
const iosWebView = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148";

describe("Premium share-card save capability", () => {
  it("uses the rendered-image fallback for embedded WebViews and missing download support", () => {
    expect(prefersPremiumImageFallback(desktopChrome, true)).toBe(false);
    expect(prefersPremiumImageFallback(iosSafari, true)).toBe(false);
    expect(prefersPremiumImageFallback(iosWebView, true)).toBe(true);
    expect(prefersPremiumImageFallback(`${desktopChrome} MicroMessenger/8.0`, true)).toBe(true);
    expect(prefersPremiumImageFallback(`${desktopChrome} XiaoHongShu/8.0`, true)).toBe(true);
    expect(prefersPremiumImageFallback(`${desktopChrome}; wv) Version/4.0`, true)).toBe(true);
    expect(prefersPremiumImageFallback(desktopChrome, false)).toBe(true);
  });

  it("only prioritizes file share on Apple mobile and embedded browsers", () => {
    expect(shouldTryPremiumFileShare(desktopChrome)).toBe(false);
    expect(shouldTryPremiumFileShare(iosSafari)).toBe(true);
    expect(shouldTryPremiumFileShare(`${desktopChrome} MicroMessenger/8.0`)).toBe(true);
  });

  it("shares a PNG file only when the browser confirms file-share support", async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    const canShare = vi.fn().mockReturnValue(true);
    const blob = new Blob(["card"], { type: "image/png" });

    await expect(sharePremiumCardFile(blob, "橘光狐狸型", { share, canShare })).resolves.toBe("shared");
    expect(canShare).toHaveBeenCalledOnce();
    expect(share).toHaveBeenCalledOnce();
    expect(share.mock.calls[0][0].files?.[0]).toMatchObject({ name: "恋爱人格-橘光狐狸型.png", type: "image/png" });
  });

  it("distinguishes unavailable, cancelled, and failed file sharing", async () => {
    const blob = new Blob(["card"], { type: "image/png" });
    await expect(sharePremiumCardFile(blob, "晴岛小狗型", {})).resolves.toBe("unavailable");
    await expect(sharePremiumCardFile(blob, "晴岛小狗型", { share: vi.fn(), canShare: () => false })).resolves.toBe("unavailable");
    await expect(sharePremiumCardFile(blob, "晴岛小狗型", {
      share: vi.fn().mockRejectedValue(new DOMException("cancelled", "AbortError")),
      canShare: () => true,
    })).resolves.toBe("cancelled");
    await expect(sharePremiumCardFile(blob, "晴岛小狗型", {
      share: vi.fn().mockRejectedValue(new Error("blocked")),
      canShare: () => true,
    })).resolves.toBe("failed");
  });

});
