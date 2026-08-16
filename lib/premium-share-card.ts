import { getPremiumPortraitUrl } from "./personality-visual-assets";
import { scoreToPercent } from "./scoring";
import {
  canvasToPngBlob,
  createShareCanvas,
  drawCoverImage,
  drawPortraitFallback,
  loadImage,
  roundedRect,
  wrapCanvasText,
} from "./share-card";
import type { Personality, StoredResult } from "./types";

const PREMIUM_TAGLINE_MAX_WIDTH = 900;
const PREMIUM_TAGLINE_LETTER_SPACING = 1;
const PREMIUM_TAGLINE_FONT_SIZES = [34, 32, 30, 28, 26, 24] as const;
const OPENING_PUNCTUATION = new Set(Array.from("“‘（《〈【〔［｛"));
const CLOSING_PUNCTUATION = new Set(Array.from("，。！？；：、）》〉】〕］｝”’…"));

export const PREMIUM_SHARE_CARD_SIZE = { width: 1080, height: 1920 } as const;
export const PREMIUM_SHARE_PORTRAIT_FRAME = { x: 72, y: 72, width: 936, height: 1248 } as const;

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
      return { fontSize, lines: [text], lineHeight: 0, firstBaseline: 1478, traitTop: 1520 };
    }
  }

  for (const fontSize of PREMIUM_TAGLINE_FONT_SIZES.slice(1)) {
    const lines = wrapPremiumTagline(text, (value) => measuredWidth(value, fontSize));
    if (lines && lines.length <= 2) {
      return { fontSize, lines, lineHeight: 40, firstBaseline: 1470, traitTop: 1558 };
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
  const { canvas, ctx } = createShareCanvas(PREMIUM_SHARE_CARD_SIZE.width, PREMIUM_SHARE_CARD_SIZE.height);
  ctx.fillStyle = "#f3f0e9"; ctx.fillRect(0, 0, PREMIUM_SHARE_CARD_SIZE.width, PREMIUM_SHARE_CARD_SIZE.height);

  const pathname = typeof window === "undefined" ? "" : window.location.pathname;
  const fullPortrait = getPremiumPortraitUrl(personality.id, pathname) ?? personality.image;
  const [image, brandWordmark] = await Promise.all([
    loadImage(fullPortrait),
    loadImage("/brand/typelab-wordmark.png"),
  ]);
  const portrait = PREMIUM_SHARE_PORTRAIT_FRAME;
  if (image) drawCoverImage(ctx, image, portrait.x, portrait.y, portrait.width, portrait.height);
  else drawPortraitFallback(ctx, personality.id, personality.secondaryColor, personality.primaryColor, personality.darkColor, portrait.x, portrait.y, portrait.width, portrait.height);

  ctx.fillStyle = "#77736c"; ctx.font = '16px -apple-system, "PingFang SC", sans-serif'; ctx.letterSpacing = "2px";
  ctx.textAlign = "left"; ctx.fillText(`我的正式恋爱人格 · ${personality.id}号人格`, 72, 48);
  ctx.textAlign = "right"; ctx.fillText("TypeLab 16型恋爱人格测试", 1008, 48);
  ctx.textAlign = "left";
  ctx.fillStyle = "#242321"; ctx.font = '72px "Songti SC", serif'; ctx.letterSpacing = "5px"; ctx.fillText(personality.name, 70, 1410);
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
    const x = 70 + (index % 2) * 500; const y = 1650 + Math.floor(index / 2) * 64;
    ctx.fillStyle = "#77736c"; ctx.font = '18px -apple-system, "PingFang SC", sans-serif'; ctx.fillText(name, x, y);
    ctx.strokeStyle = "rgba(36,35,33,.25)"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x + 100, y - 6); ctx.lineTo(x + 420, y - 6); ctx.stroke();
    ctx.fillStyle = personality.primaryColor; ctx.beginPath(); ctx.arc(x + 100 + scoreToPercent(score) * 3.2, y - 6, 8, 0, Math.PI * 2); ctx.fill();
  });

  ctx.textAlign = "left"; ctx.fillStyle = "#97928a"; ctx.font = '14px -apple-system, "PingFang SC", sans-serif'; ctx.letterSpacing = "3px"; ctx.fillText("关系主张", 70, 1778);
  ctx.fillStyle = "#5f5b55"; ctx.font = '20px "Songti SC", serif'; ctx.letterSpacing = ".5px";
  wrapCanvasText(ctx, personality.v2?.share.quote ?? "有些人越喜欢越主动，有些人越喜欢反而越安静。", 70, 1814, 650, 28, 2);
  const brandCenterY = 1882;
  const brandLogoHeight = 22;
  const brandLogoAspectRatio = brandWordmark && brandWordmark.naturalWidth > 0 && brandWordmark.naturalHeight > 0
    ? brandWordmark.naturalWidth / brandWordmark.naturalHeight
    : 0;
  const brandLogoWidth = brandLogoHeight * brandLogoAspectRatio;
  ctx.textAlign = "right"; ctx.textBaseline = "middle"; ctx.fillStyle = "#8b867e"; ctx.font = '16px -apple-system, "PingFang SC", sans-serif'; ctx.letterSpacing = "1px";
  ctx.fillText("小红书", brandWordmark ? 1010 - brandLogoWidth - 12 : 1010, brandCenterY);
  if (brandWordmark) ctx.drawImage(brandWordmark, 1010 - brandLogoWidth, brandCenterY - brandLogoHeight / 2, brandLogoWidth, brandLogoHeight);
  ctx.textBaseline = "alphabetic";
  return canvasToPngBlob(canvas);
}
