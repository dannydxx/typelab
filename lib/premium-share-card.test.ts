import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { PERSONALITIES } from "./personalities";
import {
  createPremiumTaglineLayout,
  PREMIUM_SHARE_CARD_SIZE,
  PREMIUM_SHARE_PORTRAIT_FRAME,
} from "./premium-share-card";

const approximateSongtiWidth = (value: string, fontSize: number) => Array.from(value).length * fontSize;

describe("Premium share-card tagline layout", () => {
  it("uses a phone-oriented canvas with an exact 3:4 portrait frame", () => {
    expect(PREMIUM_SHARE_CARD_SIZE).toEqual({ width: 1080, height: 1920 });
    expect(PREMIUM_SHARE_PORTRAIT_FRAME.width / PREMIUM_SHARE_PORTRAIT_FRAME.height).toBe(3 / 4);
  });

  it("keeps identity and product labels outside the portrait without restoring the black overlay", () => {
    const source = readFileSync(new URL("./premium-share-card.ts", import.meta.url), "utf8");
    expect(source).toContain("我的正式恋爱人格 · ${personality.id}号人格");
    expect(source).toContain("TypeLab 16型恋爱人格测试");
    expect(source).toContain('loadImage("/brand/typelab-wordmark.png")');
    expect(source).toContain("brandWordmark.naturalWidth / brandWordmark.naturalHeight");
    expect(source).toContain('ctx.fillText("小红书"');
    expect(source).not.toContain("小红书 · TypeLab 类型志");
    expect(source).not.toContain('rgba(23,23,22,.76)');
  });

  it("keeps all sixteen frozen taglines within the safe width and at no more than two lines", () => {
    for (const personality of PERSONALITIES) {
      const layout = createPremiumTaglineLayout(personality.tagline, approximateSongtiWidth);
      expect(layout.lines.join(""), personality.id).toBe(personality.tagline);
      expect(layout.lines.length, personality.id).toBeLessThanOrEqual(2);
      expect(layout.lines.every((line) => approximateSongtiWidth(line, layout.fontSize) + Math.max(0, Array.from(line).length - 1) <= 900), personality.id).toBe(true);
    }
  });

  it("uses a limited one-step size fallback for the longest current TYPE02 tagline", () => {
    const personality = PERSONALITIES.find(({ id }) => id === "02");
    expect(personality).toBeDefined();
    const layout = createPremiumTaglineLayout(personality!.tagline, approximateSongtiWidth);
    expect(layout).toMatchObject({ fontSize: 32, lines: [personality!.tagline], firstBaseline: 1478, traitTop: 1520 });
  });

  it("wraps longer future text without leading closing punctuation or trailing opening punctuation", () => {
    const text = "这是用于验证不同系统字体度量的超长人格说明（需要安全换行），同时保留中文标点。";
    const layout = createPremiumTaglineLayout(text, approximateSongtiWidth);
    expect(layout.lines.join("")).toBe(text);
    expect(layout.lines.length).toBe(2);
    expect(layout.lines[0]).not.toMatch(/[“‘（《〈【〔［｛]$/);
    expect(layout.lines[1]).not.toMatch(/^[，。！？；：、）》〉】〕］｝”’…]/);
    expect(layout.traitTop).toBe(1558);
  });

  it("keeps English words intact in mixed-language taglines", () => {
    const text = "这是一段用于校验跨系统字体的说明 TypeLabPreview 会保持英文单词完整。";
    const layout = createPremiumTaglineLayout(text, approximateSongtiWidth);

    expect(layout.lines).toHaveLength(2);
    expect(layout.lines.some((line) => line.includes("TypeLabPreview"))).toBe(true);
    expect(layout.lines.join("")).toBe(text);
  });
});
