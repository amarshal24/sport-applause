import { z } from "zod";
import type { TrackPoint } from "../objectTracker";
export type TrackKind = "video" | "audio" | "text" | "effects";
export interface Transform {
  x: number;
  y: number;
  scale: number;
  rotation: number;
  opacity: number;
  intensity: number;
}
export interface Keyframe extends Transform {
  frame: number;
}
export interface Clip {
  id: string;
  trackId: string;
  name: string;
  assetId?: string;
  start: number;
  duration: number;
  offset: number;
  transform: Transform;
  keys: Keyframe[];
  text: string;
  effect: string;
  fontSize: number;
  color: string;
  animation: "none" | "fade" | "slide" | "pulse";
  mask: "none" | "circle" | "rectangle";
  blend: GlobalCompositeOperation;
  chroma: boolean;
  personRemoval?: boolean;
  composition?: "fit" | "left" | "right";
  volume: number;
  fadeIn: number;
  fadeOut: number;
  duck: boolean;
  normalize: boolean;
  denoise: boolean;
  muted: boolean;
  motion: TrackPoint[];
  motionAssetId?: string;
  motionOffset?: number;
}
export interface Track {
  id: string;
  name: string;
  kind: TrackKind;
  muted: boolean;
  hidden: boolean;
}
export interface Asset {
  id: string;
  name: string;
  blob: Blob;
  duration: number;
  kind: "video" | "audio" | "image";
  license?: string;
}
export interface Project {
  version: 1;
  id: string;
  name: string;
  fps: number;
  width: number;
  height: number;
  tracks: Track[];
  clips: Clip[];
  assets: Asset[];
  savedAt: number;
}
export const defaults: Transform = {
  x: 50,
  y: 50,
  scale: 1,
  rotation: 0,
  opacity: 1,
  intensity: 0.8,
};
export const frameAt = (seconds: number, fps: number) =>
  Math.max(0, Math.round(seconds * fps));
export const secondsAt = (frame: number, fps: number) => frame / fps;
export const endFrame = (p: Project) =>
  Math.max(p.fps, ...p.clips.map((c) => c.start + c.duration));
export const mediaSchema = z
  .object({
    type: z.string().regex(/^(video|audio|image)\//),
    size: z.number().positive(),
  })
  .superRefine((v, ctx) => {
    const cap = v.type.startsWith("video/") ? 100 : 20;
    if (v.size > cap * 1024 * 1024)
      ctx.addIssue({
        code: "custom",
        message: `${cap}MB maximum for this media type`,
      });
  });
export function newProject(): Project {
  return {
    version: 1,
    id: crypto.randomUUID(),
    name: "Untitled highlight",
    fps: 30,
    width: 1280,
    height: 720,
    tracks: ["video", "audio", "text", "effects"].map((kind, i) => ({
      id: crypto.randomUUID(),
      kind: kind as TrackKind,
      name: `${kind[0].toUpperCase() + kind.slice(1)} 1`,
      muted: false,
      hidden: false,
    })),
    clips: [],
    assets: [],
    savedAt: 0,
  };
}
export function newClip(
  track: Track,
  start: number,
  duration: number,
  name: string,
  assetId?: string,
): Clip {
  return {
    id: crypto.randomUUID(),
    trackId: track.id,
    name,
    assetId,
    start,
    duration: Math.max(1, duration),
    offset: 0,
    transform: { ...defaults },
    keys: [],
    text: name,
    effect: "basketball-flaming",
    fontSize: 64,
    color: "foreground",
    animation: "none",
    mask: "none",
    blend: "source-over",
    chroma: false,
    volume: 1,
    fadeIn: 0,
    fadeOut: 0,
    duck: false,
    normalize: false,
    denoise: false,
    muted: false,
    motion: [],
  };
}
export function activeClip(c: Clip, frame: number) {
  return frame >= c.start && frame < c.start + c.duration;
}
export function sampleTransform(c: Clip, frame: number): Transform {
  const t = frame - c.start;
  const keys = [...c.keys].sort((a, b) => a.frame - b.frame);
  const before = [...keys].reverse().find((k) => k.frame <= t);
  const after = keys.find((k) => k.frame > t);
  if (!before) return after ? { ...after } : { ...c.transform };
  if (!after) return { ...before };
  const mix = (t - before.frame) / (after.frame - before.frame);
  const result = { ...c.transform };
  for (const k of Object.keys(defaults) as (keyof Transform)[])
    result[k] = before[k] + (after[k] - before[k]) * mix;
  return result;
}
export function addKey(c: Clip, frame: number) {
  const at = Math.max(0, Math.min(c.duration - 1, frame - c.start));
  return [
    ...c.keys.filter((k) => k.frame !== at),
    { frame: at, ...c.transform },
  ].sort((a, b) => a.frame - b.frame);
}
export function moveClip(c: Clip, trackId: string, start: number) {
  return { ...c, trackId, start: Math.max(0, Math.round(start)) };
}
export function splitClip(c: Clip, frame: number): Clip[] {
  const at = frame - c.start;
  if (at <= 0 || at >= c.duration) return [c];
  const state = sampleTransform(c, frame);
  return [
    {
      ...c,
      duration: at,
      keys: c.keys
        .filter((k) => k.frame < at)
        .concat({ frame: at - 1, ...state }),
    },
    {
      ...c,
      id: crypto.randomUUID(),
      start: frame,
      offset: c.offset + at,
      duration: c.duration - at,
      transform: state,
      keys: [
        { frame: 0, ...state },
        ...c.keys
          .filter((k) => k.frame > at)
          .map((k) => ({ ...k, frame: k.frame - at })),
      ],
    },
  ];
}
export function volumeAt(c: Clip, localFrame: number, voiceActive: boolean) {
  let v = c.volume;
  if (c.fadeIn > 0) v *= Math.min(1, localFrame / c.fadeIn);
  if (c.fadeOut > 0) v *= Math.min(1, (c.duration - localFrame) / c.fadeOut);
  if (c.duck && voiceActive) v *= 0.25;
  return Math.max(0, v);
}
export function compatible(p: Project, c: Clip, trackId: string) {
  return (
    p.tracks.find((t) => t.id === c.trackId)?.kind ===
    p.tracks.find((t) => t.id === trackId)?.kind
  );
}
