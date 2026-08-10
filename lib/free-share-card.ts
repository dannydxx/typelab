import { PRODUCT_CONFIG } from "./config";
import { getPublicEntryUrl } from "./public-entry";
import {
  canvasToPngBlob,
  createQrImage,
  createShareCanvas,
  drawCoverImage,
  drawPortraitFallback,
  loadImage,
  roundedRect,
  wrapCanvasText,
} from "./share-card";
import type { FreePersonalityPreview } from "./types";

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
  const { canvas, ctx } = createShareCanvas();
  ctx.fillStyle = "#f3f0e9"; ctx.fillRect(0, 0, 1080, 1440);

  const image = await loadImage(model.portraitUrl);
  if (image) drawCoverImage(ctx, image, 70, 72, 940, 620);
  else drawPortraitFallback(ctx, model.id, preview.secondaryColor, preview.primaryColor, preview.darkColor, 70, 72, 940, 620);
  ctx.fillStyle = "rgba(243,240,233,.2)"; ctx.fillRect(70, 72, 940, 620);
  ctx.fillStyle = "rgba(23,23,22,.72)"; ctx.fillRect(70, 72, 940, 60);
  ctx.fillStyle = "#f8f5ee"; ctx.textAlign = "left"; ctx.font = '20px -apple-system, "PingFang SC", sans-serif'; ctx.letterSpacing = "4px"; ctx.fillText(`TYPE ${model.id} · 8题初步人格`, 102, 111);

  ctx.fillStyle = "#242321"; ctx.font = '72px "Songti SC", serif'; ctx.letterSpacing = "4px"; ctx.fillText(model.name, 70, 790);
  ctx.fillStyle = "#55514b"; ctx.font = '31px "Songti SC", serif'; ctx.letterSpacing = "1px";
  const taglineBottom = wrapCanvasText(ctx, model.tagline, 72, 854, 880, 48, 2);

  let traitX = 70;
  ctx.font = '23px -apple-system, "PingFang SC", sans-serif';
  model.keywords.forEach((trait) => {
    const width = ctx.measureText(trait).width + 36;
    ctx.fillStyle = preview.secondaryColor; roundedRect(ctx, traitX, taglineBottom + 22, width, 44, 4);
    ctx.fillStyle = preview.darkColor; ctx.fillText(trait, traitX + 18, taglineBottom + 53); traitX += width + 12;
  });

  ctx.fillStyle = preview.primaryColor; ctx.fillRect(70, 1052, 2, 116);
  ctx.fillStyle = "#242321"; ctx.font = '28px "Songti SC", serif';
  wrapCanvasText(ctx, model.summaryHeadline, 102, 1092, 650, 44, 2);
  ctx.fillStyle = "#77736c"; ctx.font = '17px -apple-system, "PingFang SC", sans-serif';
  ctx.fillText("完整20题将重新校准正式人格", 102, 1170);

  const qr = await createQrImage(model.publicUrl, preview.darkColor);
  if (qr) ctx.drawImage(qr, 846, 1040, 164, 164);
  ctx.fillStyle = "#242321"; ctx.font = '25px "Songti SC", serif'; ctx.fillText("测测你的恋爱人格", 70, 1304);
  ctx.fillStyle = "#77736c"; ctx.font = '17px -apple-system, "PingFang SC", sans-serif'; ctx.fillText(model.publicUrl, 70, 1342);
  ctx.textAlign = "right"; ctx.fillText(`${PRODUCT_CONFIG.brandName} · ${PRODUCT_CONFIG.testName}`, 1010, 1342);
  return canvasToPngBlob(canvas);
}
