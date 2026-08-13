import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import {
  createFreeShareCardModel,
  FREE_SHARE_CARD_SIZE,
  FREE_SHARE_PORTRAIT_FRAME,
} from "./free-share-card";
import { createFreeShareText, shareFreeResult } from "./free-share";
import { getPublicEntryUrl, getVisibleBrandAccount } from "./public-entry";
import type { FreePersonalityPreview } from "./types";

const preview: FreePersonalityPreview = {
  id: "09",
  name: "蜜糖小熊型",
  animal: "熊",
  primaryColor: "#8d6e52",
  secondaryColor: "#eadac6",
  darkColor: "#3f3024",
  visualKeywords: ["暖光"],
  previewPortrait: "/personality-preview/type09.webp",
  tagline: "愿意先给出温度，也需要看见热情有来有回。",
  keywords: ["热情", "坦率", "互惠", "参与"],
  summaryHeadline: "你的投入需要在日常里得到可见回应。",
  relationshipPosition: [],
  baseHeadline: "温度需要双向流动",
  boundaryFirstTitle: "长期只有自己主动",
  innerOSPreview: { situation: "我今天不先找你", outer: "你忙你的", },
};

describe("public free sharing", () => {
  it("sanitizes every return path to the public root URL", () => {
    expect(getPublicEntryUrl("https://example.com/free/result?code=secret&attempt=1#type09")).toBe("https://example.com/");
    expect(createFreeShareText(preview, "https://example.com/premium?session=secret")).toContain("https://example.com/");
    expect(createFreeShareText(preview, "https://example.com/premium?session=secret")).not.toMatch(/session|secret|attempt|code=/);
  });

  it("builds the free card from preview-only fields", () => {
    const model = createFreeShareCardModel(preview, "https://example.com/free/result?attempt=private");
    const serialized = JSON.stringify(model);
    expect(model.portraitUrl).toBe("/personality-preview/type09.webp");
    expect(model.publicUrl).toBe("https://example.com/");
    expect(serialized).not.toContain("/api/premium/personality-portrait/");
    expect(serialized).not.toContain("scores");
    expect(serialized).not.toContain("share.quote");
  });

  it("uses the same phone canvas and 3:4 portrait frame as the locked Premium master", () => {
    expect(FREE_SHARE_CARD_SIZE).toEqual({ width: 1080, height: 1920 });
    expect(FREE_SHARE_PORTRAIT_FRAME.width / FREE_SHARE_PORTRAIT_FRAME.height).toBe(3 / 4);
  });

  it("shares a PNG file when the browser supports file sharing", async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    const outcome = await shareFreeResult(new Blob(["png"], { type: "image/png" }), preview, "https://example.com/", {
      canShare: (payload) => Boolean(payload.files?.length),
      share,
    });
    expect(outcome).toBe("shared-file");
    expect(share.mock.calls[0][0].files).toHaveLength(1);
    expect(share.mock.calls[0][0].url).toBe("https://example.com/");
  });

  it("falls back to text and root URL when file sharing is unavailable", async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    const outcome = await shareFreeResult(new Blob(["png"]), preview, "https://example.com/free", {
      canShare: () => false,
      share,
    });
    expect(outcome).toBe("shared-link");
    expect(share.mock.calls[0][0]).not.toHaveProperty("files");
    expect(share.mock.calls[0][0].url).toBe("https://example.com/");
  });

  it("requests a local save when Web Share is unavailable", async () => {
    await expect(shareFreeResult(new Blob(["png"]), preview, "https://example.com/", {})).resolves.toBe("save");
  });

  it("never exposes an unset brand account", () => {
    expect(getVisibleBrandAccount("@你的品牌账号")).toBeNull();
    expect(getVisibleBrandAccount("")).toBeNull();
    expect(getVisibleBrandAccount("@official")).toBe("@official");
  });

  it("keeps the free share source outside Premium data and portrait APIs", () => {
    const source = readFileSync(new URL("./free-share-card.ts", import.meta.url), "utf8");
    expect(source).toContain("preview.previewPortrait");
    expect(source).not.toContain("premiumPortrait");
    expect(source).not.toContain("/api/premium");
    expect(source).not.toContain("StoredResult");
    expect(source).not.toContain("share.quote");
  });

  it("renders a restrained locked preview without QR, URL, or heavy acquisition copy", () => {
    const source = readFileSync(new URL("./free-share-card.ts", import.meta.url), "utf8");
    expect(source).toContain("当前为8题初步人格 · 完成20题后将重新校准正式人格");
    expect(source).toContain("解锁正式人格、完整形象与完整关系档案");
    expect(source).toContain("小红书 · TypeLab 类型志");
    expect(source).not.toContain("createQrImage");
    expect(source).not.toContain("测测你的恋爱人格");
    expect(source).not.toContain("ctx.fillText(model.publicUrl");
    expect(source).not.toContain('ctx.fillStyle = "rgba(243,240,233,.12)"');
    expect(source).not.toContain('portrait.y + portrait.height - 250');
  });
});
