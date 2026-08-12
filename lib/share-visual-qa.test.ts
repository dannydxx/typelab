import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("development share visual QA", () => {
  it("reuses both production share-card generators without copying canvas drawing logic", () => {
    const source = readFileSync(new URL("../components/share-visual-qa.tsx", import.meta.url), "utf8");
    expect(source).toContain('createFreeShareCard(entry.freePreview)');
    expect(source).toContain('createPremiumShareCard(entry.personality, entry.result)');
    expect(source).not.toMatch(/createElement\(["']canvas["']\)|drawCoverImage|fillText|drawImage/);
  });

  it("keeps the route development-only", () => {
    const source = readFileSync(new URL("../app/dev/share-preview/page.tsx", import.meta.url), "utf8");
    expect(source).toContain('process.env.NODE_ENV !== "development"');
    expect(source).toContain("notFound()");
    expect(source).toContain("PERSONALITIES.map");
  });

  it("provides lightweight filters and stable TYPE anchors for mobile visual review", () => {
    const source = readFileSync(new URL("../components/share-visual-qa.tsx", import.meta.url), "utf8");
    expect(source).toContain('type CardFilter = "all" | "free" | "premium"');
    expect(source).toContain('id={`share-qa-type-${personality.id}`}');
    expect(source).toContain('href="#share-qa-top"');
    expect(source).toContain('filter !== "premium"');
    expect(source).toContain('filter !== "free"');
  });
});
