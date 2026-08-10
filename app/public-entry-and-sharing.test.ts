import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

function source(path: string) {
  return readFileSync(new URL(path, import.meta.url), "utf8");
}

describe("public routes and result sharing entries", () => {
  it("renders the shared free home at root without redirecting to Premium", () => {
    const root = source("./page.tsx");
    expect(root).toContain("<FreeHomeExperience");
    expect(root).not.toContain("redirect(");
    expect(root).not.toContain('"/premium"');
  });

  it("keeps /free and /premium as independent compatible routes", () => {
    expect(source("./free/page.tsx")).toContain("<FreeHomeExperience");
    expect(source("./premium/page.tsx")).toContain("<HomeExperience");
  });

  it("places free sharing after the preliminary relationship preview", () => {
    const freeResult = source("../components/free-result-experience.tsx");
    expect(freeResult).toContain("<FreeSharePanel preview={preview}");
    expect(freeResult.indexOf("<FreeSharePanel")).toBeGreaterThan(freeResult.indexOf("<PreliminaryRelationshipPreview"));
    expect(freeResult.indexOf("<FreeSharePanel")).toBeLessThan(freeResult.indexOf("free-report-directory"));
  });

  it("keeps both the Premium HERO save entry and the original bottom share panel", () => {
    const detail = source("../components/result-detail/result-detail-page.tsx");
    expect(detail).toContain("premium-hero-save");
    expect(detail).toContain("保存我的人格卡");
    expect(detail).toContain('<ResultSection number="11" title="人格分享卡"');
    expect(detail).toContain("<ResultSharePanel");
  });

  it("keeps public metadata focused on the free test", () => {
    const layout = source("./layout.tsx");
    const cover = source("./og-cover.jpg/route.tsx");
    expect(layout).toContain("免费完成8道");
    expect(cover).toContain("免费开始");
  });
});
