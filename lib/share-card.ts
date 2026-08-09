import QRCode from "qrcode";
import { PRODUCT_CONFIG } from "./config";
import { scoreToPercent } from "./scoring";
import type { Personality, StoredResult } from "./types";

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  ctx.beginPath(); ctx.roundRect(x, y, width, height, radius); ctx.fill();
}

function drawCoverImage(ctx: CanvasRenderingContext2D, image: HTMLImageElement, x: number, y: number, width: number, height: number) {
  const scale = Math.max(width / image.width, height / image.height);
  const sourceWidth = width / scale;
  const sourceHeight = height / scale;
  ctx.drawImage(image, (image.width - sourceWidth) / 2, (image.height - sourceHeight) / 2, sourceWidth, sourceHeight, x, y, width, height);
}

async function loadImage(url: string) {
  return new Promise<HTMLImageElement | null>((resolve) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = url;
  });
}

export async function createShareCard(personality: Personality, result: StoredResult) {
  const canvas = document.createElement("canvas");
  canvas.width = 1080; canvas.height = 1440;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("CANVAS_UNAVAILABLE");

  ctx.fillStyle = "#f3f0e9"; ctx.fillRect(0, 0, 1080, 1440);
  const image = await loadImage(personality.image);
  if (image) drawCoverImage(ctx, image, 70, 72, 940, 760);
  else {
    const gradient = ctx.createLinearGradient(70, 72, 1010, 832);
    gradient.addColorStop(0, personality.secondaryColor); gradient.addColorStop(.58, personality.primaryColor); gradient.addColorStop(1, personality.darkColor);
    ctx.fillStyle = gradient; ctx.fillRect(70, 72, 940, 760);
    ctx.strokeStyle = "rgba(255,255,255,.35)"; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(825, 275, 235, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = "rgba(255,255,255,.14)"; ctx.beginPath(); ctx.ellipse(540, 690, 265, 310, 0, Math.PI, 0); ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,.78)"; ctx.font = '200px "Songti SC", serif'; ctx.textAlign = "center"; ctx.fillText(personality.id, 540, 505);
  }

  ctx.fillStyle = "rgba(23,23,22,.76)"; ctx.fillRect(70, 72, 940, 60);
  ctx.fillStyle = "#f8f5ee"; ctx.textAlign = "left"; ctx.font = '20px -apple-system, "PingFang SC", sans-serif'; ctx.letterSpacing = "4px"; ctx.fillText("RELATIONSHIP PERSONALITY · TYPE " + personality.id, 102, 111);

  ctx.fillStyle = "#77736c"; ctx.font = '20px -apple-system, "PingFang SC", sans-serif'; ctx.letterSpacing = "3px"; ctx.fillText("我的恋爱人格", 72, 898);
  ctx.fillStyle = "#242321"; ctx.font = '76px "Songti SC", serif'; ctx.letterSpacing = "5px"; ctx.fillText(personality.name, 68, 995);
  ctx.fillStyle = "#4b4944"; ctx.font = '34px "Songti SC", serif'; ctx.letterSpacing = "1px"; ctx.fillText(personality.tagline, 70, 1052);

  let traitX = 70;
  ctx.font = '24px -apple-system, "PingFang SC", sans-serif';
  personality.traits.forEach((trait) => {
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

  ctx.fillStyle = "#242321"; ctx.font = '22px "Songti SC", serif'; ctx.fillText("有些人越喜欢越主动，有些人越喜欢反而越安静。", 70, 1372);
  ctx.textAlign = "right"; ctx.fillStyle = "#77736c"; ctx.font = '17px -apple-system, "PingFang SC", sans-serif'; ctx.fillText(`${PRODUCT_CONFIG.brandName}  ·  ${PRODUCT_CONFIG.xhsAccount}`, 1010, 1372);

  if (PRODUCT_CONFIG.showQrCode) {
    const qr = await loadImage(await QRCode.toDataURL(PRODUCT_CONFIG.siteUrl, { margin: 0, width: 110, color: { dark: personality.darkColor, light: "#f3f0e9" } }));
    if (qr) ctx.drawImage(qr, 900, 1190, 110, 110);
  }

  return new Promise<Blob>((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("CANVAS_EXPORT_FAILED")), "image/png", 1));
}
