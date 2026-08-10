import { PRODUCT_CONFIG } from "./config";
import { getPersonalityVisualAsset } from "./personality-visual-assets";
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

export async function createPremiumShareCard(personality: Personality, result: StoredResult) {
  const { canvas, ctx } = createShareCanvas();
  ctx.fillStyle = "#f3f0e9"; ctx.fillRect(0, 0, 1080, 1440);

  const fullPortrait = getPersonalityVisualAsset(personality.id)?.premiumPortrait ?? personality.image;
  const image = await loadImage(fullPortrait);
  if (image) drawCoverImage(ctx, image, 70, 72, 940, 760);
  else drawPortraitFallback(ctx, personality.id, personality.secondaryColor, personality.primaryColor, personality.darkColor, 70, 72, 940, 760);

  ctx.fillStyle = "rgba(23,23,22,.76)"; ctx.fillRect(70, 72, 940, 60);
  ctx.fillStyle = "#f8f5ee"; ctx.textAlign = "left"; ctx.font = '20px -apple-system, "PingFang SC", sans-serif'; ctx.letterSpacing = "4px"; ctx.fillText(`16型恋爱人格测试 · ${personality.id}号人格`, 102, 111);
  ctx.fillStyle = "#77736c"; ctx.font = '20px -apple-system, "PingFang SC", sans-serif'; ctx.letterSpacing = "3px"; ctx.fillText("我的正式恋爱人格", 72, 898);
  ctx.fillStyle = "#242321"; ctx.font = '76px "Songti SC", serif'; ctx.letterSpacing = "5px"; ctx.fillText(personality.name, 68, 995);
  ctx.fillStyle = "#4b4944"; ctx.font = '34px "Songti SC", serif'; ctx.letterSpacing = "1px"; ctx.fillText(personality.tagline, 70, 1052);

  let traitX = 70;
  ctx.font = '24px -apple-system, "PingFang SC", sans-serif';
  personality.keywords.forEach((trait) => {
    const width = ctx.measureText(trait).width + 38;
    ctx.fillStyle = personality.secondaryColor; roundedRect(ctx, traitX, 1090, width, 46, 4);
    ctx.fillStyle = personality.darkColor; ctx.fillText(trait, traitX + 19, 1122); traitX += width + 14;
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
