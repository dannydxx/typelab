import { describe, expect, it } from "vitest";
import { PERSONALITIES } from "./personalities";
import { createPremiumTaglineLayout } from "./premium-share-card";

const approximateSongtiWidth = (value: string, fontSize: number) => Array.from(value).length * fontSize;

describe("Premium share-card tagline layout", () => {
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
    expect(layout).toMatchObject({ fontSize: 32, lines: [personality!.tagline], firstBaseline: 1052, traitTop: 1090 });
  });

  it("wraps longer future text without leading closing punctuation or trailing opening punctuation", () => {
    const text = "这是用于验证不同系统字体度量的超长人格说明（需要安全换行），同时保留中文标点。";
    const layout = createPremiumTaglineLayout(text, approximateSongtiWidth);
    expect(layout.lines.join("")).toBe(text);
    expect(layout.lines.length).toBe(2);
    expect(layout.lines[0]).not.toMatch(/[“‘（《〈【〔［｛]$/);
    expect(layout.lines[1]).not.toMatch(/^[，。！？；：、）》〉】〕］｝”’…]/);
    expect(layout.traitTop).toBe(1112);
  });

  it("keeps English words intact in mixed-language taglines", () => {
    const text = "这是一段用于校验跨系统字体的说明 TypeLabPreview 会保持英文单词完整。";
    const layout = createPremiumTaglineLayout(text, approximateSongtiWidth);

    expect(layout.lines).toHaveLength(2);
    expect(layout.lines.some((line) => line.includes("TypeLabPreview"))).toBe(true);
    expect(layout.lines.join("")).toBe(text);
  });
});
