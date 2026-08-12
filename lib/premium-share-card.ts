import { PRODUCT_CONFIG } from "./config";
import { getPremiumPortraitUrl } from "./personality-visual-assets";
import { getVisibleBrandAccount } from "./public-entry";
import { scoreToPercent } from "./scoring";
import {
  canvasToPngBlob,
  createShareCanvas,
  drawCoverImage,
  drawPortraitFallback,
  loadImage,
  roundedRect,
} from "./share-card";
import type { Personality, StoredResult } from "./types";

const PREMIUM_TAGLINE_MAX_WIDTH = 900;
const PREMIUM_TAGLINE_LETTER_SPACING = 1;
const PREMIUM_TAGLINE_FONT_SIZES = [34, 32, 30, 28, 26, 24] as const;
const OPENING_PUNCTUATION = new Set(Array.from("“‘（《〈【〔［｛"));
const CLOSING_PUNCTUATION = new Set(Array.from("，。！？；：、）》〉】〕］｝”’…"));

export type PremiumTaglineLayout = {
  fontSize: number;
  lines: string[];
  lineHeight: number;
  firstBaseline: number;
  traitTop: number;
};

export function createPremiumTaglineLayout(
  text: string,
  measureText: (value: string, fontSize: number) => number,
): PremiumTaglineLayout {
  const measuredWidth = (value: string, fontSize: number) => (
    measureText(value, fontSize) + Math.max(0, Array.from(value).length - 1) * PREMIUM_TAGLINE_LETTER_SPACING
  );

  for (const fontSize of PREMIUM_TAGLINE_FONT_SIZES.slice(0, 2)) {
    if (measuredWidth(text, fontSize) <= PREMIUM_TAGLINE_MAX_WIDTH) {
      return { fontSize, lines: [text], lineHeight: 0, firstBaseline: 1052, traitTop: 1090 };
    }
  }

  for (const fontSize of PREMIUM_TAGLINE_FONT_SIZES.slice(1)) {
    const lines = wrapPremiumTagline(text, (value) => measuredWidth(value, fontSize));
    if (lines && lines.length <= 2) {
      return { fontSize, lines, lineHeight: 38, firstBaseline: 1044, traitTop: 1112 };
    }
  }

  throw new Error("PREMIUM_TAGLINE_TOO_LONG");
}

function wrapPremiumTagline(text: string, measureText: (value: string) => number) {
  const lines: string[] = [];
  let line = "";

  for (const character of Array.from(text)) {
    const candidate = line + character;
    if (!line || measureText(candidate) <= PREMIUM_TAGLINE_MAX_WIDTH) {
      line = candidate;
      continue;
    }

    let nextLine = character;
    const lineCharacters = Array.from(line);
    const trailingEnglishWord = /[A-Za-z0-9]+(?:['’-][A-Za-z0-9]+)*$/.exec(line);
    if (/[A-Za-z0-9]/.test(character) && trailingEnglishWord?.index && lineCharacters.length > 1) {
      nextLine = `${lineCharacters.splice(trailingEnglishWord.index).join("")}${character}`;
    } else if (CLOSING_PUNCTUATION.has(character) && lineCharacters.length > 1) {
      nextLine = `${lineCharacters.pop()}${character}`;
    }
    while (lineCharacters.length > 1 && OPENING_PUNCTUATION.has(lineCharacters.at(-1) ?? "")) {
      nextLine = `${lineCharacters.pop()}${nextLine}`;
    }

    lines.push(lineCharacters.join(""));
    if (lines.length >= 2) return null;
    line = nextLine;
  }

  if (line) lines.push(line);
  return lines.length <= 2 && lines.every((value) => measureText(value) <= PREMIUM_TAGLINE_MAX_WIDTH)
    ? lines
    : null;
}

export async function createPremiumShareCard(personality: Personality, result: StoredResult) {
  const { canvas, ctx } = createShareCanvas();
  ctx.fillStyle = "#f3f0e9"; ctx.fillRect(0, 0, 1080, 1440);

  const pathname = typeof window === "undefined" ? "" : window.location.pathname;
  const fullPortrait = getPremiumPortraitUrl(personality.id, pathname) ?? personality.image;
  const image = await loadImage(fullPortrait);
  if (image) drawCoverImage(ctx, image, 70, 72, 940, 760);
  else drawPortraitFallback(ctx, personality.id, personality.secondaryColor, personality.primaryColor, personality.darkColor, 70, 72, 940, 760);

  ctx.fillStyle = "rgba(23,23,22,.76)"; ctx.fillRect(70, 72, 940, 60);
  ctx.fillStyle = "#f8f5ee"; ctx.textAlign = "left"; ctx.font = '20px -apple-system, "PingFang SC", sans-serif'; ctx.letterSpacing = "4px"; ctx.fillText(`16型恋爱人格测试 · ${personality.id}号人格`, 102, 111);
  ctx.fillStyle = "#77736c"; ctx.font = '20px -apple-system, "PingFang SC", sans-serif'; ctx.letterSpacing = "3px"; ctx.fillText("我的正式恋爱人格", 72, 898);
  ctx.fillStyle = "#242321"; ctx.font = '76px "Songti SC", serif'; ctx.letterSpacing = "5px"; ctx.fillText(personality.name, 68, 995);
  const taglineLayout = createPremiumTaglineLayout(personality.tagline, (value, fontSize) => {
    ctx.font = `${fontSize}px "Songti SC", serif`;
    return ctx.measureText(value).width;
  });
  ctx.fillStyle = "#4b4944"; ctx.font = `${taglineLayout.fontSize}px "Songti SC", serif`; ctx.letterSpacing = "1px";
  taglineLayout.lines.forEach((line, index) => ctx.fillText(line, 70, taglineLayout.firstBaseline + index * taglineLayout.lineHeight));

  let traitX = 70;
  ctx.font = '24px -apple-system, "PingFang SC", sans-serif';
  personality.keywords.forEach((trait) => {
    const width = ctx.measureText(trait).width + 38;
    ctx.fillStyle = personality.secondaryColor; roundedRect(ctx, traitX, taglineLayout.traitTop, width, 46, 4);
    ctx.fillStyle = personality.darkColor; ctx.fillText(trait, traitX + 19, taglineLayout.traitTop + 32); traitX += width + 14;
  });

  const dimensions = [
    ["安全感", result.scores.security], ["亲密节奏", result.scores.closeness], ["表达方式", result.scores.expression], ["冲突处理", result.scores.conflict],
  ] as const;
  dimensions.forEach(([name, score], index) => {
    const x = 70 + (index % 2) * 500; const y = 1208 + Math.floor(index / 2) * 66;
    ctx.fillStyle = "#77736c"; ctx.font = '18px -apple-system, "PingFang SC", sans-serif'; ctx.fillText(name, x, y);
    ctx.strokeStyle = "rgba(36,35,33,.25)"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x + 100, y - 6); ctx.lineTo(x + 420, y - 6); ctx.stroke();
    ctx.fillStyle = personality.primaryColor; ctx.beginPath(); ctx.arc(x + 100 + scoreToPercent(score) * 3.2, y - 6, 8, 0, Math.PI * 2); ctx.fill();
  });

  ctx.fillStyle = "#242321"; ctx.font = '22px "Songti SC", serif'; ctx.fillText(personality.v2?.share.quote ?? "有些人越喜欢越主动，有些人越喜欢反而越安静。", 70, 1372);
  const brandAccount = getVisibleBrandAccount(PRODUCT_CONFIG.xhsAccount);
  ctx.textAlign = "right"; ctx.fillStyle = "#77736c"; ctx.font = '17px -apple-system, "PingFang SC", sans-serif';
  ctx.fillText([PRODUCT_CONFIG.brandName, brandAccount].filter(Boolean).join(" · "), 1010, 1372);
  return canvasToPngBlob(canvas);
}
