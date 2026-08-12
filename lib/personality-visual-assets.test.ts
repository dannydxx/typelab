import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { PERSONALITY_VISUAL_IDS, PERSONALITY_VISUALS } from "./personality-visual-assets";

function projectFile(relativePath: string) {
  return new URL(`../${relativePath}`, import.meta.url);
}

describe("personality visual assets", () => {
  it("keeps all sixteen source, protected Premium and public preview files aligned", () => {
    expect(PERSONALITY_VISUAL_IDS).toEqual(
      Array.from({ length: 16 }, (_, index) => String(index + 1).padStart(2, "0")),
    );

    for (const id of PERSONALITY_VISUAL_IDS) {
      const source = readFileSync(projectFile(`assets/personality-source/v3/type${id}.webp`));
      const premium = readFileSync(projectFile(`assets/personality-premium/type${id}.webp`));
      const preview = readFileSync(projectFile(`public/personality-preview/type${id}.webp`));

      expect(PERSONALITY_VISUALS[id]).toEqual({
        previewPortrait: `/personality-preview/type${id}.webp`,
        premiumPortrait: `/api/premium/personality-portrait/${id}`,
      });
      expect(premium.equals(source), `TYPE${id} Premium portrait should match its approved source`).toBe(true);
      expect(preview.equals(premium), `TYPE${id} public preview must not expose its Premium portrait`).toBe(false);
      expect(preview.byteLength, `TYPE${id} public preview should remain a lightweight derivative`).toBeLessThan(premium.byteLength);
    }
  });
});
