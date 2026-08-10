import { getPublicEntryUrl } from "./public-entry";
import type { FreePersonalityPreview } from "./types";

export type FreeShareOutcome = "shared-file" | "shared-link" | "save" | "cancelled";

interface ShareNavigator {
  share?: (data: ShareData) => Promise<void>;
  canShare?: (data: ShareData) => boolean;
}

export function createFreeShareText(preview: Pick<FreePersonalityPreview, "name">, configuredUrl: string) {
  return `我测出来是「${preview.name}」。你是什么型？\n${getPublicEntryUrl(configuredUrl)}`;
}

export async function shareFreeResult(blob: Blob, preview: Pick<FreePersonalityPreview, "name">, configuredUrl: string, shareNavigator: ShareNavigator = navigator) : Promise<FreeShareOutcome> {
  if (!shareNavigator.share) return "save";
  const publicUrl = getPublicEntryUrl(configuredUrl);
  const text = createFreeShareText(preview, publicUrl);
  const file = new File([blob], `恋爱人格-${preview.name}-初步人格.png`, { type: "image/png" });
  try {
    const filePayload: ShareData = { title: "我的初步恋爱人格", text, url: publicUrl, files: [file] };
    if (shareNavigator.canShare?.(filePayload)) {
      await shareNavigator.share(filePayload);
      return "shared-file";
    }
    await shareNavigator.share({ title: "我的初步恋爱人格", text, url: publicUrl });
    return "shared-link";
  } catch (cause) {
    if (cause instanceof DOMException && cause.name === "AbortError") return "cancelled";
    return "save";
  }
}

export function downloadFreeShareCard(blob: Blob, personalityName: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `恋爱人格-${personalityName}-初步人格.png`;
  anchor.click();
  return url;
}
