// ============================================================
// Pipeline stage 4b: person segmentation.
// Converts MediaPipe masks into a compact per-person label map
// (0 = background, n = person index + 1) and provides the
// main-thread helpers used to composite skins through the mask.
// ============================================================

import type { MPMask } from "@mediapipe/tasks-vision";
import type { SegmentationFrame } from "@/lib/ar/types";

/** Union of per-person float masks → single Uint8 label map. */
export const buildLabelMask = (masks: MPMask[] | undefined): SegmentationFrame | undefined => {
  if (!masks?.length) return undefined;
  const { width, height } = masks[0];
  const out = new Uint8Array(width * height);
  masks.forEach((m, idx) => {
    let arr: Float32Array;
    try {
      arr = m.getAsFloat32Array();
    } catch {
      return;
    }
    for (let i = 0; i < out.length; i++) {
      if (out[i] === 0 && arr[i] > 0.5) out[i] = idx + 1;
    }
  });
  masks.forEach((m) => m.close());
  return { data: out, width, height };
};

/**
 * Paints a label map into a canvas as an alpha stencil.
 * `label` picks one person; `undefined` keeps every person.
 */
export const maskToCanvas = (
  frame: SegmentationFrame,
  canvas: HTMLCanvasElement | OffscreenCanvas,
  label?: number,
  color: [number, number, number] = [255, 255, 255]
) => {
  if (canvas.width !== frame.width || canvas.height !== frame.height) {
    canvas.width = frame.width;
    canvas.height = frame.height;
  }
  const ctx = (canvas as HTMLCanvasElement).getContext("2d", {
    willReadFrequently: true,
  }) as CanvasRenderingContext2D | null;
  if (!ctx) return null;
  const img = ctx.createImageData(frame.width, frame.height);
  const d = img.data;
  const [r, g, b] = color;
  for (let i = 0, j = 0; i < frame.data.length; i++, j += 4) {
    const v = frame.data[i];
    const on = label === undefined ? v > 0 : v === label;
    d[j] = r;
    d[j + 1] = g;
    d[j + 2] = b;
    d[j + 3] = on ? 255 : 0;
  }
  ctx.putImageData(img, 0, 0);
  return canvas;
};

/** Cheap 1-pass box blur on the stencil edges to avoid hard aliasing. */
export const featherMask = (canvas: HTMLCanvasElement, radius = 2) => {
  const ctx = canvas.getContext("2d");
  if (!ctx || radius <= 0) return canvas;
  ctx.filter = `blur(${radius}px)`;
  ctx.drawImage(canvas, 0, 0);
  ctx.filter = "none";
  return canvas;
};

/** True if the mask covers a meaningful part of the frame. */
export const maskCoverage = (frame: SegmentationFrame, label?: number) => {
  let n = 0;
  for (let i = 0; i < frame.data.length; i++) {
    const v = frame.data[i];
    if (label === undefined ? v > 0 : v === label) n++;
  }
  return n / frame.data.length;
};
