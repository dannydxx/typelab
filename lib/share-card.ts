import QRCode from "qrcode";

export function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  ctx.beginPath(); ctx.roundRect(x, y, width, height, radius); ctx.fill();
}

export function drawCoverImage(ctx: CanvasRenderingContext2D, image: HTMLImageElement, x: number, y: number, width: number, height: number) {
  const scale = Math.max(width / image.width, height / image.height);
  const sourceWidth = width / scale;
  const sourceHeight = height / scale;
  ctx.drawImage(image, (image.width - sourceWidth) / 2, (image.height - sourceHeight) / 2, sourceWidth, sourceHeight, x, y, width, height);
}

export async function loadImage(url: string) {
  return new Promise<HTMLImageElement | null>((resolve) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = url;
  });
}

export function createShareCanvas() {
  const canvas = document.createElement("canvas");
  canvas.width = 1080; canvas.height = 1440;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("CANVAS_UNAVAILABLE");
  return { canvas, ctx };
}

export function wrapCanvasText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number, maxLines = 3) {
  const characters = Array.from(text);
  const lines: string[] = [];
  let line = "";
  for (const character of characters) {
    const candidate = line + character;
    if (ctx.measureText(candidate).width > maxWidth && line) {
      lines.push(line);
      line = character;
      if (lines.length === maxLines) break;
    } else line = candidate;
  }
  if (lines.length < maxLines && line) lines.push(line);
  lines.forEach((value, index) => ctx.fillText(value, x, y + index * lineHeight));
  return y + lines.length * lineHeight;
}

export async function createQrImage(publicUrl: string, darkColor: string, lightColor = "#f3f0e9") {
  const dataUrl = await QRCode.toDataURL(publicUrl, {
    margin: 0,
    width: 164,
    errorCorrectionLevel: "M",
    color: { dark: darkColor, light: lightColor },
  });
  return loadImage(dataUrl);
}

export function canvasToPngBlob(canvas: HTMLCanvasElement) {
  return new Promise<Blob>((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("CANVAS_EXPORT_FAILED")), "image/png", 1));
}

export function drawPortraitFallback(ctx: CanvasRenderingContext2D, id: string, secondaryColor: string, primaryColor: string, darkColor: string, x: number, y: number, width: number, height: number) {
  const gradient = ctx.createLinearGradient(x, y, x + width, y + height);
  gradient.addColorStop(0, secondaryColor); gradient.addColorStop(.58, primaryColor); gradient.addColorStop(1, darkColor);
  ctx.fillStyle = gradient; ctx.fillRect(x, y, width, height);
  ctx.strokeStyle = "rgba(255,255,255,.35)"; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x + width * .8, y + height * .27, width * .25, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = "rgba(255,255,255,.14)"; ctx.beginPath(); ctx.ellipse(x + width * .5, y + height * .82, width * .28, height * .4, 0, Math.PI, 0); ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,.78)"; ctx.font = '200px "Songti SC", serif'; ctx.textAlign = "center"; ctx.fillText(id, x + width / 2, y + height * .57);
}
