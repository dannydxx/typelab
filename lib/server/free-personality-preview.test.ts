import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { PERSONALITIES } from "../personalities";
import { selectFreePersonalityPreview } from "./free-personality-preview";

describe("free personality preview boundary", () => {
  const personality = PERSONALITIES[0];
  const v2 = personality.v2!;
  const preview = selectFreePersonalityPreview(personality)!;

  it("keeps the correct personality identity for the free HERO", () => {
    expect(preview).toMatchObject({
      id: personality.id,
      name: personality.name,
      previewPortrait: "/personality-preview/type01.webp",
      tagline: personality.tagline,
      keywords: personality.keywords,
    });
    expect(preview).not.toHaveProperty("image");
    expect(JSON.stringify(preview)).not.toContain(personality.image);
    expect(JSON.stringify(preview)).not.toContain("/api/premium/personality-portrait/");
  });

  it("exposes summary.headline but not summary description or metrics", () => {
    expect(preview.summaryHeadline).toBe(v2.summary.headline);
    expect(preview).not.toHaveProperty("summaryDescription");
    expect(preview).not.toHaveProperty("summaryMetrics");
    expect(JSON.stringify(preview)).not.toContain(v2.summary.description);
  });

  it("exposes relationship labels and poles without interpretations", () => {
    expect(preview.relationshipPosition[0]).toEqual({
      key: v2.relationshipPosition[0].key,
      label: v2.relationshipPosition[0].label,
      left: v2.relationshipPosition[0].left,
      right: v2.relationshipPosition[0].right,
    });
    expect(preview.relationshipPosition.every((item) => !("interpretation" in item))).toBe(true);
    expect(JSON.stringify(preview)).not.toContain(v2.relationshipPosition[0].interpretation);
  });

  it("exposes only the first boundary title", () => {
    expect(preview.boundaryFirstTitle).toBe(v2.boundaries.items[0].title);
    expect(JSON.stringify(preview)).not.toContain(v2.boundaries.items[0].description);
    expect(JSON.stringify(preview)).not.toContain(v2.boundaries.items[1].title);
    expect(JSON.stringify(preview)).not.toContain(v2.boundaries.items[2].title);
  });

  it("exposes the first inner-OS situation and outer voice without its inner voice", () => {
    expect(preview.innerOSPreview).toEqual({ situation: v2.innerOS[0].situation, outer: v2.innerOS[0].outer });
    expect(preview.innerOSPreview).not.toHaveProperty("inner");
    expect(JSON.stringify(preview)).not.toContain(v2.innerOS[0].inner);
  });

  it("exposes the base headline without premium base copy", () => {
    expect(preview.baseHeadline).toBe(v2.base.headline);
    expect(JSON.stringify(preview)).not.toContain(v2.base.insight);
    expect(JSON.stringify(preview)).not.toContain(v2.base.description);
    expect(JSON.stringify(preview)).not.toContain(v2.base.quote);
  });
});
