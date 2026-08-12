import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { PERSONALITIES } from "./personalities";
import { createDevPremiumResult } from "./dev-premium-preview";

describe("Premium UI development preview", () => {
  it("creates deterministic in-memory result fixtures for all sixteen stable TYPEs", () => {
    expect(PERSONALITIES.map((personality) => createDevPremiumResult(personality).personalityId)).toEqual(
      Array.from({ length: 16 }, (_, index) => String(index + 1).padStart(2, "0")),
    );
    expect(PERSONALITIES.map((personality) => createDevPremiumResult(personality).attemptId)).toEqual(
      Array.from({ length: 16 }, (_, index) => `dev-preview-type-${String(index + 1).padStart(2, "0")}`),
    );
  });

  it("keeps the fixture questionnaire isolated from Access Code and database APIs", () => {
    const source = readFileSync(new URL("../components/dev-premium-test-experience.tsx", import.meta.url), "utf8");
    expect(source).toContain("Array(QUESTIONS.length).fill(null)");
    expect(source).not.toMatch(/fetch\(|localStorage|\/api\/|AccessCode|startPremiumAttempt|calculateScores/);
    expect(source).toContain("devPreview");
  });

  it("keeps the development banner compact and removes its height from the preview questionnaire", () => {
    const bannerSource = readFileSync(new URL("../components/dev-preview-banner.tsx", import.meta.url), "utf8");
    const styles = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
    expect(bannerSource).toContain("DEV / VISUAL QA · 仅预览");
    expect(styles).toContain("height: 28px");
    expect(styles).toContain(".test-page--dev-preview");
    expect(styles).not.toMatch(/\.dev-preview-banner\s*\{[\s\S]*?position:\s*sticky/);
  });

  it("removes query preview bypasses from the formal Premium test and result paths", () => {
    const testSource = readFileSync(new URL("../components/test-experience.tsx", import.meta.url), "utf8");
    const resultSource = readFileSync(new URL("../app/premium/result/page.tsx", import.meta.url), "utf8");
    const portraitSource = readFileSync(new URL("../app/api/premium/personality-portrait/[type]/route.ts", import.meta.url), "utf8");
    expect(testSource + resultSource + portraitSource).not.toMatch(/searchParams|get\(["']preview["']\)|previewResult/);
    expect(resultSource).toContain("getAccessSessionFromServerCookies");
    expect(portraitSource).toContain("getAccessSessionFromRequest");
  });

  it("marks every development page as production-inaccessible", () => {
    const routes = [
      "../app/dev/premium-preview/page.tsx",
      "../app/dev/premium-preview/test/page.tsx",
      "../app/dev/premium-preview/result/[type]/page.tsx",
      "../app/dev/share-preview/page.tsx",
    ];
    for (const route of routes) {
      const source = readFileSync(new URL(route, import.meta.url), "utf8");
      expect(source).toContain('process.env.NODE_ENV !== "development"');
      expect(source).toContain("notFound()");
    }
  });
});
