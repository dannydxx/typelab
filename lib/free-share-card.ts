import { PRODUCT_CONFIG } from "./config";
import { getPublicEntryUrl } from "./public-entry";
import {
  canvasToPngBlob,
  createShareCanvas,
  drawCoverImage,
  drawPortraitFallback,
  loadImage,
  roundedRect,
  wrapCanvasText,
} from "./share-card";
import type { FreePersonalityPreview } from "./types";

export const FREE_SHARE_CARD_SIZE = { width: 1080, height: 1920 } as const;
export const FREE_SHARE_PORTRAIT_FRAME = { x: 72, y: 72, width: 936, height: 1248 } as const;

export interface FreeShareCardModel {
  id: string;
  name: string;
  portraitUrl: string;
  tagline: string;
  keywords: readonly string[];
  summaryHeadline: string;
  publicUrl: string;
}

export function createFreeShareCardModel(preview: FreePersonalityPreview, configuredUrl = PRODUCT_CONFIG.siteUrl): FreeShareCardModel {
  return {
    id: preview.id,
    name: preview.name,
    portraitUrl: preview.previewPortrait,
    tagline: preview.tagline,
    keywords: preview.keywords,
    summaryHeadline: preview.summaryHeadline,
    publicUrl: getPublicEntryUrl(configuredUrl),
  };
}

export async function createFreeShareCard(preview: FreePersonalityPreview, configuredUrl = PRODUCT_CONFIG.siteUrl) {
  const model = createFreeShareCardModel(preview, configuredUrl);
  const { canvas, ctx } = createShareCanvas(FREE_SHARE_CARD_SIZE.width, FREE_SHARE_CARD_SIZE.height);
  ctx.fillStyle = "#f3f0e9"; ctx.fillRect(0, 0, FREE_SHARE_CARD_SIZE.width, FREE_SHARE_CARD_SIZE.height);

  const image = await loadImage(model.portraitUrl);
  const portrait = FREE_SHARE_PORTRAIT_FRAME;
  if (image) drawCoverImage(ctx, image, portrait.x, portrait.y, portrait.width, portrait.height);
  else drawPortraitFallback(ctx, model.id, preview.secondaryColor, preview.primaryColor, preview.darkColor, portrait.x, portrait.y, portrait.width, portrait.height);

  ctx.fillStyle = "#77736c"; ctx.font = '16px -apple-system, "PingFang SC", sans-serif'; ctx.letterSpacing = "2px";
  ctx.textAlign = "left"; ctx.fillText(`TYPE ${model.id} · 8题初步人格`, 72, 48);
  ctx.textAlign = "right"; ctx.fillText("TypeLab 16型恋爱人格测试", 1008, 48);

  ctx.textAlign = "left"; ctx.fillStyle = "#242321"; ctx.font = '72px "Songti SC", serif'; ctx.letterSpacing = "5px"; ctx.fillText(model.name, 70, 1410);
  ctx.fillStyle = "#4b4944"; ctx.font = '34px "Songti SC", serif'; ctx.letterSpacing = "1px";
  const taglineBottom = wrapCanvasText(ctx, model.tagline, 70, 1478, 900, 40, 2);

  let traitX = 70;
  const traitTop = taglineBottom + 12;
  ctx.font = '24px -apple-system, "PingFang SC", sans-serif';
  model.keywords.forEach((trait) => {
    const width = ctx.measureText(trait).width + 38;
    ctx.fillStyle = preview.secondaryColor; roundedRect(ctx, traitX, traitTop, width, 46, 4);
    ctx.fillStyle = preview.darkColor; ctx.fillText(trait, traitX + 19, traitTop + 32); traitX += width + 14;
  });

  ctx.fillStyle = "#97928a"; ctx.font = '14px -apple-system, "PingFang SC", sans-serif'; ctx.letterSpacing = "3px"; ctx.fillText("初步判断", 70, 1660);
  ctx.fillStyle = "#5f5b55"; ctx.font = '24px "Songti SC", serif'; ctx.letterSpacing = ".5px";
  wrapCanvasText(ctx, model.summaryHeadline, 70, 1700, 900, 34, 2);

  ctx.fillStyle = preview.primaryColor; ctx.fillRect(70, 1774, 2, 78);
  ctx.fillStyle = "#77736c"; ctx.font = '16px -apple-system, "PingFang SC", sans-serif'; ctx.letterSpacing = "1px";
  ctx.fillText("当前为8题初步人格 · 完成20题后将重新校准正式人格", 96, 1802);
  ctx.fillText("解锁正式人格、完整形象与完整关系档案", 96, 1840);
  ctx.textAlign = "right"; ctx.fillStyle = "#8b867e"; ctx.font = '16px -apple-system, "PingFang SC", sans-serif'; ctx.letterSpacing = "1px";
  ctx.fillText("小红书 · TypeLab 类型志", 1010, 1888);
  return canvasToPngBlob(canvas);
}
