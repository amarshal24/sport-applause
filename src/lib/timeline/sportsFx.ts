import { motionPalette, paintMotion } from "../motionStudio";
import type { Clip, Transform } from "./model";
export type FxFamily =
  | "flame"
  | "electric"
  | "ice"
  | "trail"
  | "burst"
  | "trajectory"
  | "field"
  | "celebrate"
  | "lights"
  | "muscle";
export interface SportsFx {
  id: string;
  name: string;
  sport: string;
  family: FxFamily;
}
const group = (sport: string, items: [string, FxFamily][]) =>
  items.map(([name, family]) => ({
    id: `${sport.toLowerCase()}-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    name,
    sport,
    family,
  }));
export const sportsFx: SportsFx[] = [
  ...group("Basketball", [
    ["Flaming basketball", "flame"],
    ["Electric basketball", "electric"],
    ["Ice basketball", "ice"],
    ["Neon ball trail", "trail"],
    ["Explosive dunk", "burst"],
    ["Lightning hoop", "electric"],
    ["Slow-motion shot trail", "trail"],
    ["Rim explosion", "burst"],
  ]),
  ...group("Football", [
    ["Flaming football", "flame"],
    ["Lightning football trail", "electric"],
    ["Quarterback passing trajectory", "trajectory"],
    ["Impact shockwave", "burst"],
    ["Touchdown celebration effects", "celebrate"],
    ["Electric field lines", "field"],
  ]),
  ...group("Soccer", [
    ["Fireball kick", "flame"],
    ["Glowing soccer ball", "ice"],
    ["Lightning goal", "electric"],
    ["Ball trajectory trail", "trajectory"],
    ["Goal explosion", "burst"],
    ["Stadium light effects", "lights"],
  ]),
  ...group("Baseball", [
    ["Flaming baseball", "flame"],
    ["Home run trajectory", "trajectory"],
    ["Bat impact explosion", "burst"],
    ["Glowing baseball trail", "trail"],
  ]),
  ...group("Fitness", [["Muscle highlight effects", "muscle"]]),
];
export function paintSportsFx(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  seconds: number,
  c: Clip,
  t: Transform,
  fps: number,
) {
  const fx = sportsFx.find((f) => f.id === c.effect);
  if (!fx) return;
  const palette = motionPalette(),
    x = (t.x * w) / 100,
    y = (t.y * h) / 100,
    r = 55 * t.scale,
    age = (seconds - c.start / fps) / (c.duration / fps);
  ctx.save();
  ctx.globalAlpha = t.opacity * t.intensity;
  ctx.strokeStyle = palette.electric;
  ctx.fillStyle = palette.core;
  ctx.lineWidth = 3;
  if (["flame", "electric", "trail"].includes(fx.family)) {
    const path = c.motion.map((p) => ({
      ...p,
      t: c.start / fps + p.t - (c.motionOffset ?? c.offset) / fps,
    }));
    paintMotion(
      ctx,
      w,
      h,
      seconds,
      [
        {
          id: c.id,
          label: c.name,
          effect:
            fx.family === "flame"
              ? "flame"
              : fx.family === "electric"
                ? "electric"
                : "trail",
          x: t.x,
          y: t.y,
          size: 12 * t.scale,
          start: c.start / fps,
          end: (c.start + c.duration) / fps,
          intensity: t.intensity * t.opacity,
          track: path,
          corrections: [],
        },
      ],
      palette,
    );
    if (!c.motion.length && fx.family === "trail") {
      ctx.beginPath();
      ctx.moveTo(x - r * 3, y + r);
      ctx.quadraticCurveTo(x - r, y - r, x, y);
      ctx.stroke();
    }
  } else if (fx.family === "ice") {
    ctx.strokeStyle = palette.electric;
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.stroke();
  } else if (fx.family === "burst") {
    ctx.globalAlpha *= 1 - age;
    ctx.strokeStyle = palette.flame;
    ctx.beginPath();
    ctx.arc(x, y, r * (0.2 + age * 4), 0, Math.PI * 2);
    ctx.stroke();
    for (let i = 0; i < 24; i++) {
      const a = i * 2.399;
      ctx.beginPath();
      ctx.moveTo(x + Math.cos(a) * r * age, y + Math.sin(a) * r * age);
      ctx.lineTo(x + Math.cos(a) * r * age * 4, y + Math.sin(a) * r * age * 4);
      ctx.stroke();
    }
  } else if (fx.family === "trajectory") {
    ctx.setLineDash([9, 6]);
    ctx.beginPath();
    ctx.moveTo(x - r * 3, y + r * 2);
    ctx.quadraticCurveTo(x - r * 1.5, y - r * 3, x + r * 2, y);
    ctx.stroke();
  } else if (fx.family === "field") {
    ctx.strokeStyle = palette.electric;
    for (let i = 0; i < 6; i++) {
      ctx.beginPath();
      ctx.moveTo(0, y + (i - 3) * r);
      ctx.lineTo(w, y + (i - 3) * r + Math.sin(seconds * 4 + i) * 10);
      ctx.stroke();
    }
  } else if (fx.family === "celebrate") {
    for (let i = 0; i < 60; i++) {
      ctx.fillStyle = i % 2 ? palette.flame : palette.core;
      const a = i * 2.399;
      ctx.fillRect(
        x + Math.cos(a) * age * w * 0.4,
        y + Math.sin(a) * age * h * 0.4 + age * age * h * 0.2,
        5,
        10,
      );
    }
  } else if (fx.family === "lights") {
    ctx.strokeStyle = palette.core;
    for (let i = 0; i < 5; i++) {
      ctx.lineWidth = 10;
      ctx.globalAlpha = t.opacity * t.intensity * 0.15;
      ctx.beginPath();
      ctx.moveTo((w * i) / 4, 0);
      ctx.lineTo(x + (Math.sin(seconds + i) * w) / 3, h);
      ctx.stroke();
    }
  } else if (fx.family === "muscle") {
    ctx.strokeStyle = palette.flame;
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.ellipse(x, y, r * 0.4, r, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}
