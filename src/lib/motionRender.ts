import { paintMotion, type MotionObject, type MotionPalette } from "./motionStudio";

// Exact-frame rendering for Motion FX Studio.
// Every source frame is painted with the effect evaluated at THAT frame's presentation
// timestamp, so the exported file never depends on wall-clock playback speed, dropped
// frames or requestAnimationFrame jitter. Pure of browser decoding so it can be unit-tested.

export interface DecodedFrame { canvas: CanvasImageSource; timestamp: number; duration: number }
export interface FrameSink { add(timestamp: number, duration: number): Promise<void> }

export interface RenderResult { frames: number; firstTimestamp: number | null; lastEnd: number }

export async function renderMotionFrames(args: {
  frames: AsyncIterable<DecodedFrame>;
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  objects: MotionObject[];
  palette: MotionPalette;
  sink: FrameSink;
  signal?: AbortSignal;
  onFrame?: (frame: DecodedFrame, index: number) => void;
}): Promise<RenderResult> {
  const { frames, ctx, width, height, objects, palette, sink, signal, onFrame } = args;
  let count = 0, first: number | null = null, lastEnd = 0;
  for await (const frame of frames) {
    if (signal?.aborted) throw new DOMException("Cancelled", "AbortError");
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(frame.canvas, 0, 0, width, height);
    paintMotion(ctx, width, height, frame.timestamp, objects, palette);
    await sink.add(frame.timestamp, frame.duration);
    if (first === null) first = frame.timestamp;
    lastEnd = frame.timestamp + frame.duration;
    onFrame?.(frame, count);
    count++;
  }
  return { frames: count, firstTimestamp: first, lastEnd };
}

/** Deterministic noise (seeded) so two exports of the same project have identical audio. */
export function addSwish(channels: Float32Array[], sampleRate: number, at: number, seconds = 0.3, gain = 0.25) {
  const start = Math.max(0, Math.round(at * sampleRate)), length = Math.floor(sampleRate * seconds);
  let seed = 0x9e3779b9;
  const next = () => { seed ^= seed << 13; seed >>>= 0; seed ^= seed >>> 17; seed ^= seed << 5; seed >>>= 0; return seed / 0xffffffff; };
  for (let i = 0; i < length; i++) {
    const v = (next() * 2 - 1) * Math.sin(i / length * Math.PI) * gain;
    for (const data of channels) if (start + i < data.length) data[start + i] += v;
  }
}

/** Fit the output inside `max` px on its longest side with even dimensions (H.264 requirement). */
export function exportSize(width: number, height: number, max = 1280) {
  const scale = Math.min(1, max / Math.max(width, height));
  const even = (n: number) => Math.max(2, Math.round(n * scale / 2) * 2);
  return { width: even(width), height: even(height) };
}
