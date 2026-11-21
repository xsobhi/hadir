import type { Area } from "react-easy-crop";

/** Export the selected square directly to a 512px canvas; keep original media in browser memory only. */
export async function cropImage(source: string, crop: Area, rotation: number): Promise<string> {
  const img = new Image();
  img.src = source;
  await img.decode();
  const w = img.naturalWidth, h = img.naturalHeight;
  const radians = rotation * Math.PI / 180;
  const boundW = Math.abs(Math.cos(radians) * w) + Math.abs(Math.sin(radians) * h);
  const boundH = Math.abs(Math.sin(radians) * w) + Math.abs(Math.cos(radians) * h);
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 512;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas_unavailable");
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, 512, 512);
  ctx.imageSmoothingQuality = "high";
  ctx.scale(512 / crop.width, 512 / crop.height);
  ctx.translate(-crop.x, -crop.y);
  ctx.translate(boundW / 2, boundH / 2);
  ctx.rotate(radians);
  ctx.drawImage(img, -w / 2, -h / 2);
  return canvas.toDataURL("image/webp", 0.9);
}
