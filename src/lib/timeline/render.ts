import {
  Output,
  WebMOutputFormat,
  BufferTarget,
  CanvasSource,
  AudioBufferSource,
} from "mediabunny";
import { activeClip, endFrame, sampleTransform, type Project } from "./model";
import { TimelineMedia } from "./media";
import { paintSportsFx } from "./sportsFx";
import { sampleTrack } from "../objectTracker";
import { mixAudio } from "./audio";
const color = (token: string) =>
  `hsl(${getComputedStyle(document.documentElement).getPropertyValue(`--${token}`).trim()})`;
export async function renderFrame(
  canvas: HTMLCanvasElement,
  p: Project,
  frame: number,
  media: TimelineMedia,
) {
  if (canvas.width !== p.width) canvas.width = p.width;
  if (canvas.height !== p.height) canvas.height = p.height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Canvas unavailable");
  ctx.clearRect(0, 0, p.width, p.height);
  ctx.fillStyle = color("background");
  ctx.fillRect(0, 0, p.width, p.height);
  for (const track of p.tracks) {
    if (track.hidden || track.kind === "audio") continue;
    for (const c of p.clips.filter(
      (c) => c.trackId === track.id && activeClip(c, frame),
    )) {
      const t = sampleTransform(c, frame);
      const local = (frame - c.start) / p.fps;
      const point = c.motion.length
        ? sampleTrack(c.motion, local + (c.motionOffset ?? c.offset) / p.fps)
        : null;
      if (point) {
        t.x = point.x;
        t.y = point.y;
      }
      ctx.save();
      ctx.globalCompositeOperation = c.blend;
      ctx.globalAlpha = t.opacity;
      if (c.animation === "fade")
        ctx.globalAlpha *= Math.min(
          1,
          local * 3,
          (c.duration / p.fps - local) * 3,
        );
      if (c.animation === "pulse")
        ctx.globalAlpha *= 0.75 + Math.sin(local * 7) * 0.25;
      if (c.animation === "slide") t.y += Math.max(0, 1 - local * 3) * 15;
      if (track.kind === "effects") {
        paintSportsFx(ctx, p.width, p.height, frame / p.fps, c, t, p.fps);
        ctx.restore();
        continue;
      }
      if (c.composition === "left" || c.composition === "right") {
        ctx.beginPath();
        ctx.rect(
          c.composition === "left" ? 0 : p.width / 2,
          0,
          p.width / 2,
          p.height,
        );
        ctx.clip();
      }
      ctx.translate((t.x * p.width) / 100, (t.y * p.height) / 100);
      ctx.rotate((t.rotation * Math.PI) / 180);
      ctx.scale(t.scale, t.scale);
      if (track.kind === "text") {
        ctx.font = `700 ${c.fontSize}px sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = color(c.color);
        ctx.strokeStyle = color("background");
        ctx.lineWidth = 5;
        const lines = c.text.split("\n");
        lines.forEach((line, i) => {
          ctx.strokeText(
            line,
            0,
            (i - (lines.length - 1) / 2) * c.fontSize * 1.2,
          );
          ctx.fillText(
            line,
            0,
            (i - (lines.length - 1) / 2) * c.fontSize * 1.2,
          );
        });
      } else {
        const a = p.assets.find((a) => a.id === c.assetId);
        if (a) {
          const image = await media.frame(
            a,
            (c.offset + frame - c.start) / p.fps,
          );
          if (image) {
            const scratch = document.createElement("canvas");
            scratch.width = p.width;
            scratch.height = p.height;
            const sc = scratch.getContext("2d", { willReadFrequently: true });
            if (sc) {
              const dims = image as { width: number; height: number };
              const ratio = Math.min(
                  p.width / dims.width,
                  p.height / dims.height,
                ),
                w = dims.width * ratio,
                h = dims.height * ratio;
              sc.drawImage(image, (p.width - w) / 2, (p.height - h) / 2, w, h);
              if (c.chroma) {
                const pixels = sc.getImageData(0, 0, p.width, p.height);
                for (let i = 0; i < pixels.data.length; i += 4) {
                  const r = pixels.data[i],
                    g = pixels.data[i + 1],
                    b = pixels.data[i + 2];
                  if (g > r * 1.35 && g > b * 1.25 && g > 65)
                    pixels.data[i + 3] = 0;
                }
                sc.putImageData(pixels, 0, 0);
              }
              if (c.personRemoval)
                await media.background.remove(scratch, scratch);
              if (c.mask === "circle") {
                ctx.beginPath();
                ctx.arc(
                  0,
                  0,
                  Math.min(p.width, p.height) * 0.4,
                  0,
                  Math.PI * 2,
                );
                ctx.clip();
              }
              if (c.mask === "rectangle") {
                ctx.beginPath();
                ctx.rect(
                  -p.width * 0.35,
                  -p.height * 0.35,
                  p.width * 0.7,
                  p.height * 0.7,
                );
                ctx.clip();
              }
              ctx.drawImage(scratch, -p.width / 2, -p.height / 2);
            }
          }
        }
      }
      ctx.restore();
    }
  }
}
export async function exportTimeline(
  p: Project,
  signal: AbortSignal,
  progress: (n: number) => void,
): Promise<Blob> {
  if (typeof VideoEncoder === "undefined")
    throw new Error(
      "Frame export requires a browser with WebCodecs (recent Chrome or Edge).",
    );
  const canvas = document.createElement("canvas"),
    media = new TimelineMedia(),
    target = new BufferTarget(),
    output = new Output({ format: new WebMOutputFormat(), target });
  const video = new CanvasSource(canvas, { codec: "vp9", bitrate: 4_000_000 });
  const audio = new AudioBufferSource({ codec: "opus", bitrate: 128000 });
  canvas.width = p.width;
  canvas.height = p.height;
  output.addVideoTrack(video, { frameRate: p.fps });
  output.addAudioTrack(audio);
  try {
    const mixed = await mixAudio(p, media);
    if (signal.aborted) throw new DOMException("Cancelled", "AbortError");
    await output.start();
    await audio.add(mixed);
    audio.close();
    const total = endFrame(p);
    for (let frame = 0; frame < total; frame++) {
      if (signal.aborted) throw new DOMException("Cancelled", "AbortError");
      await renderFrame(canvas, p, frame, media);
      await video.add(frame / p.fps, 1 / p.fps);
      progress(Math.round(((frame + 1) / total) * 100));
    }
    video.close();
    await output.finalize();
    if (!target.buffer) throw new Error("Export produced no file");
    return new Blob([target.buffer], { type: "video/webm" });
  } catch (e) {
    await output.cancel();
    throw e;
  } finally {
    media.dispose();
  }
}
