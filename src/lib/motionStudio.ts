import { z } from "zod";
import { sampleTrack, type TrackPoint } from "./objectTracker";

export const motionUploadSchema = z.object({ type: z.string().startsWith("video/"), size: z.number().positive().max(100 * 1024 * 1024, "Video must be 100MB or smaller") });
export const motionRangeSchema = z.object({ start: z.number().min(0), end: z.number().positive() }).refine(v => v.end > v.start, "End must be after start");
export type MotionEffect = "flame" | "electric" | "trail" | "none";
export interface MotionKeyframe extends TrackPoint { size: number; visible: boolean }
export interface MotionObject {
  id: string; label: string; effect: MotionEffect; x: number; y: number; size: number;
  start: number; end: number; intensity: number; track: TrackPoint[]; corrections: MotionKeyframe[];
}
export function correctMotionPoint(points: MotionKeyframe[], point: MotionKeyframe) {
  return [...points.filter(p => Math.abs(p.t - point.t) > 0.04), point].sort((a, b) => a.t - b.t);
}
export function motionSample(object: MotionObject, t: number) {
  if (t < object.start || t > object.end) return null;
  const tracked = sampleTrack(object.track, t) ?? { x: object.x, y: object.y, c: 1 };
  const keys = object.corrections;
  const before = [...keys].reverse().find(p => p.t <= t);
  const after = keys.find(p => p.t > t);
  if (before?.visible === false) return null;
  if (!before) return { ...tracked, size: object.size };
  // Corrections are offsets from the tracked path, preserving intervening motion.
  const rawBefore = sampleTrack(object.track, before.t) ?? { x: object.x, y: object.y };
  let dx = before.x - rawBefore.x, dy = before.y - rawBefore.y, size = before.size;
  if (after && after.visible) {
    const rawAfter = sampleTrack(object.track, after.t) ?? { x: object.x, y: object.y };
    const k = (t - before.t) / (after.t - before.t);
    dx += (after.x - rawAfter.x - dx) * k; dy += (after.y - rawAfter.y - dy) * k;
    size += (after.size - size) * k;
  }
  return { x: tracked.x + dx, y: tracked.y + dy, c: tracked.c, size };
}
export interface MotionPalette { flame: string; core: string; electric: string; trail: string }
export function motionPalette(): MotionPalette {
  const css = getComputedStyle(document.documentElement);
  const color = (name: string) => `hsl(${css.getPropertyValue(name).trim()})`;
  return { flame: color("--secondary"), core: color("--victory-gold"), electric: color("--electric-blue"), trail: color("--primary") };
}
export function paintMotion(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, objects: MotionObject[], palette: MotionPalette) {
  for (const object of objects) {
    const p = motionSample(object, t);
    if (!p || object.effect === "none" || (p.c ?? 1) < 0.25) continue;
    const x = p.x * w / 100, y = p.y * h / 100, r = p.size * Math.min(w, h) / 200;
    const prev = motionSample(object, Math.max(object.start, t - 0.08));
    const speed = prev ? Math.hypot(p.x - prev.x, p.y - prev.y) / 0.08 : 0;
    ctx.save(); ctx.globalAlpha = object.intensity * Math.min(1, (p.c ?? 1) * 1.5);
    ctx.strokeStyle = object.effect === "electric" ? palette.electric : object.effect === "flame" ? palette.flame : palette.trail;
    ctx.lineCap = "round";
    for (let i = 12; i > 0; i--) {
      const a = motionSample(object, t - i * 0.025), b = motionSample(object, t - (i - 1) * 0.025);
      if (!a || !b || (a.c ?? 1) < 0.25 || (b.c ?? 1) < 0.25) continue;
      ctx.globalAlpha = object.intensity * (1 - i / 13) * 0.45;
      ctx.lineWidth = Math.max(1, r * (1 - i / 14)); ctx.beginPath(); ctx.moveTo(a.x * w / 100, a.y * h / 100); ctx.lineTo(b.x * w / 100, b.y * h / 100); ctx.stroke();
    }
    ctx.globalAlpha = object.intensity * Math.min(1, (p.c ?? 1) * 1.5);
    if (object.effect === "flame") {
      // Deterministic particles use source video time in both preview and export.
      for (let i = 0; i < 28; i++) {
        const age = (t * 1.9 + i * 0.137) % 1;
        const angle = i * 2.399 + Math.sin(t * 5 + i) * 0.2;
        const spread = r * (0.7 + age * 0.8);
        const px = x + Math.cos(angle) * spread - (prev ? (p.x - prev.x) * w / 100 * age * 1.8 : 0);
        const py = y + Math.sin(angle) * r * 0.6 - age * r * (1.7 + Math.min(speed / 60, 1));
        ctx.globalAlpha = object.intensity * (1 - age) * 0.8;
        ctx.fillStyle = age < 0.4 ? palette.core : palette.flame;
        ctx.beginPath(); ctx.ellipse(px, py, r * 0.25 * (1 - age) + 1, r * 0.5 * (1 - age) + 1, Math.sin(angle), 0, Math.PI * 2); ctx.fill();
      }
    } else if (object.effect === "electric") {
      ctx.lineWidth = Math.max(1, r * 0.07); ctx.beginPath();
      for (let i = 0; i <= 24; i++) {
        const a = i / 24 * Math.PI * 2, rad = r * (1.2 + 0.18 * Math.sin(i * 17 + Math.floor(t * 12)));
        const px = x + Math.cos(a) * rad, py = y + Math.sin(a) * rad;
        if (!i) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.stroke();
    }
    ctx.restore();
  }
}