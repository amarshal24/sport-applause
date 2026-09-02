// ============================================================
// Pipeline stages 6-7: filter transformation + canvas rendering.
//
// Filters are data: each one declares an anchor (head, eyes,
// hands, torso, feet, full body…) and a draw routine. The
// renderer resolves the anchor into a position/scale/rotation
// from the tracked landmarks, so new filters can be registered
// without touching the tracking engine.
// ============================================================

import { CHARACTER_STYLES, POSE, drawCharacter, type CharacterStyle } from "@/lib/ar/characterRig";
import { maskToCanvas } from "@/lib/vision/segmenter";
import type {
  AnchorId,
  AnchorTransform,
  Landmark,
  SegmentationFrame,
  TrackedTarget,
} from "@/lib/ar/types";

export interface FilterDef {
  id: string;
  label: string;
  emoji: string;
  anchor: AnchorId;
  /** Full-body skin replacement driven by segmentation + skeleton. */
  skin?: CharacterStyle;
  scale?: number;
  offset?: { x: number; y: number };
  draw?: (
    ctx: CanvasRenderingContext2D,
    t: AnchorTransform,
    target: TrackedTarget,
    timeMs: number
  ) => void;
  premium?: boolean;
}

// ---------- anchor resolution ----------

const lm = (pts: Landmark[] | undefined, i: number, w: number, h: number) => {
  const p = pts?.[i];
  if (!p || (p.visibility ?? 1) < 0.15) return null;
  return { x: p.x * w, y: p.y * h };
};

const midpoint = (a: { x: number; y: number }, b: { x: number; y: number }) => ({
  x: (a.x + b.x) / 2,
  y: (a.y + b.y) / 2,
});

/** Turns a body region into a drawable transform in output pixels. */
export const resolveAnchor = (
  target: TrackedTarget,
  anchor: AnchorId,
  w: number,
  h: number
): AnchorTransform | null => {
  const pose = target.pose;
  const face = target.face;
  const alpha = Math.max(0.15, Math.min(1, target.confidence * (target.coasting ? 0.7 : 1) + 0.25));
  const base: Omit<AnchorTransform, "x" | "y" | "width" | "height"> = {
    rotation: target.rotation,
    alpha,
    depth: target.depth,
  };

  const ls = lm(pose, POSE.leftShoulder, w, h);
  const rs = lm(pose, POSE.rightShoulder, w, h);
  const lh = lm(pose, POSE.leftHip, w, h);
  const rh = lm(pose, POSE.rightHip, w, h);
  const nose = lm(pose, POSE.nose, w, h);
  const lEar = lm(pose, POSE.leftEar, w, h);
  const rEar = lm(pose, POSE.rightEar, w, h);

  const headWidth = lEar && rEar ? Math.hypot(lEar.x - rEar.x, lEar.y - rEar.y) * 1.9 : target.box.w * w * 0.55;
  const headRoll =
    target.head?.roll ??
    (lEar && rEar ? Math.atan2(lEar.y - rEar.y, lEar.x - rEar.x) : target.rotation) ??
    0;

  switch (anchor) {
    case "head":
    case "forehead": {
      const eyesL = lm(face, 33, w, h) ?? lm(pose, POSE.leftEye, w, h);
      const eyesR = lm(face, 263, w, h) ?? lm(pose, POSE.rightEye, w, h);
      const top = lm(face, 10, w, h);
      const center =
        top ??
        (nose ? { x: nose.x, y: nose.y - headWidth * (anchor === "forehead" ? 0.72 : 0.45) } : null) ??
        (eyesL && eyesR ? midpoint(eyesL, eyesR) : null);
      if (!center) return null;
      return {
        ...base,
        x: center.x,
        y: center.y - (anchor === "forehead" ? headWidth * 0.28 : 0),
        width: headWidth,
        height: headWidth * 1.15,
        rotation: headRoll,
      };
    }
    case "face": {
      const chin = lm(face, 152, w, h);
      const top = lm(face, 10, w, h);
      if (top && chin) {
        const c = midpoint(top, chin);
        const height = Math.hypot(top.x - chin.x, top.y - chin.y) * 1.1;
        return { ...base, x: c.x, y: c.y, width: height * 0.82, height, rotation: headRoll };
      }
      if (!nose) return null;
      return { ...base, x: nose.x, y: nose.y, width: headWidth, height: headWidth * 1.25, rotation: headRoll };
    }
    case "eyes": {
      const a = lm(face, 33, w, h) ?? lm(pose, POSE.leftEye, w, h);
      const b = lm(face, 263, w, h) ?? lm(pose, POSE.rightEye, w, h);
      if (!a || !b) return null;
      const c = midpoint(a, b);
      const width = Math.hypot(a.x - b.x, a.y - b.y) * 2.1;
      return {
        ...base,
        x: c.x,
        y: c.y,
        width,
        height: width * 0.42,
        rotation: Math.atan2(b.y - a.y, b.x - a.x),
      };
    }
    case "mouth": {
      const a = lm(face, 61, w, h);
      const b = lm(face, 291, w, h);
      if (!a || !b) return null;
      const c = midpoint(a, b);
      const width = Math.hypot(a.x - b.x, a.y - b.y) * 1.6;
      return { ...base, x: c.x, y: c.y, width, height: width * 0.7, rotation: headRoll };
    }
    case "neck": {
      if (!ls || !rs || !nose) return null;
      const s = midpoint(ls, rs);
      return { ...base, x: (s.x + nose.x) / 2, y: (s.y + nose.y) / 2, width: headWidth * 0.8, height: headWidth * 0.6 };
    }
    case "leftShoulder":
    case "rightShoulder": {
      const p = anchor === "leftShoulder" ? ls : rs;
      if (!p || !ls || !rs) return null;
      const width = Math.hypot(ls.x - rs.x, ls.y - rs.y) * 0.5;
      return {
        ...base,
        x: p.x,
        y: p.y,
        width,
        height: width,
        rotation: Math.atan2(ls.y - rs.y, ls.x - rs.x),
      };
    }
    case "chest":
    case "torso": {
      if (!ls || !rs || !lh || !rh) return null;
      const s = midpoint(ls, rs);
      const hp = midpoint(lh, rh);
      const c = anchor === "chest" ? midpoint(s, midpoint(s, hp)) : midpoint(s, hp);
      const width = Math.hypot(ls.x - rs.x, ls.y - rs.y) * 1.15;
      const height = Math.hypot(s.x - hp.x, s.y - hp.y) * (anchor === "chest" ? 0.8 : 1.1);
      return {
        ...base,
        x: c.x,
        y: c.y,
        width,
        height,
        rotation: Math.atan2(ls.y - rs.y, ls.x - rs.x),
      };
    }
    case "hips": {
      if (!lh || !rh) return null;
      const c = midpoint(lh, rh);
      const width = Math.hypot(lh.x - rh.x, lh.y - rh.y) * 1.3;
      return { ...base, x: c.x, y: c.y, width, height: width * 0.6, rotation: Math.atan2(lh.y - rh.y, lh.x - rh.x) };
    }
    case "leftHand":
    case "rightHand": {
      const hand = target.hands?.find((x) =>
        anchor === "leftHand" ? x.handedness === "Left" : x.handedness === "Right"
      );
      const p =
        (hand ? lm(hand.landmarks, 9, w, h) : null) ??
        lm(pose, anchor === "leftHand" ? POSE.leftWrist : POSE.rightWrist, w, h);
      if (!p) return null;
      const size = headWidth * 0.55;
      return { ...base, x: p.x, y: p.y, width: size, height: size };
    }
    case "leftFoot":
    case "rightFoot": {
      const p = lm(pose, anchor === "leftFoot" ? POSE.leftAnkle : POSE.rightAnkle, w, h);
      if (!p) return null;
      const size = headWidth * 0.6;
      return { ...base, x: p.x, y: p.y, width: size, height: size };
    }
    case "fullBody":
    case "object":
    default:
      return {
        ...base,
        x: target.center.x * w,
        y: target.center.y * h,
        width: target.box.w * w,
        height: target.box.h * h,
      };
  }
};

// ---------- built-in filters ----------

const flame = (ctx: CanvasRenderingContext2D, t: AnchorTransform, target: TrackedTarget, time: number) => {
  const r = t.width * 0.5;
  ctx.save();
  ctx.globalAlpha = t.alpha;
  ctx.translate(t.x, t.y - t.height * 0.45);
  ctx.rotate(t.rotation * 0.6 - Math.max(-0.5, Math.min(0.5, target.velocity.x)) * 0.4);
  ctx.globalCompositeOperation = "lighter";
  for (let i = 0; i < 7; i++) {
    const phase = time / 130 + i * 1.1;
    const sway = Math.sin(phase) * r * 0.22;
    const lift = (Math.sin(phase * 0.8) * 0.5 + 0.5) * r * 0.5;
    const hgt = r * (1.25 + Math.sin(phase * 1.3) * 0.25) + lift;
    const g = ctx.createLinearGradient(0, 0, 0, -hgt);
    g.addColorStop(0, "rgba(255,180,40,0.85)");
    g.addColorStop(0.5, "rgba(255,90,20,0.6)");
    g.addColorStop(1, "rgba(255,240,150,0)");
    ctx.beginPath();
    ctx.moveTo(-r * 0.5 + i * (r / 6), 0);
    ctx.quadraticCurveTo(sway, -hgt * 0.6, sway * 0.4, -hgt);
    ctx.quadraticCurveTo(sway - r * 0.18, -hgt * 0.5, -r * 0.5 + i * (r / 6) + r * 0.16, 0);
    ctx.closePath();
    ctx.fillStyle = g;
    ctx.fill();
  }
  ctx.restore();
};

const halo = (ctx: CanvasRenderingContext2D, t: AnchorTransform, _target: TrackedTarget, time: number) => {
  ctx.save();
  ctx.globalAlpha = t.alpha;
  ctx.translate(t.x, t.y - t.height * 0.55);
  ctx.rotate(t.rotation);
  ctx.scale(1, 0.34);
  const pulse = 1 + Math.sin(time / 320) * 0.05;
  ctx.beginPath();
  ctx.arc(0, 0, t.width * 0.52 * pulse, 0, Math.PI * 2);
  ctx.lineWidth = t.width * 0.1;
  ctx.strokeStyle = "#facc15";
  ctx.shadowColor = "#fde68a";
  ctx.shadowBlur = t.width * 0.35;
  ctx.stroke();
  ctx.restore();
};

const crown = (ctx: CanvasRenderingContext2D, t: AnchorTransform, _target: TrackedTarget, time: number) => {
  ctx.save();
  ctx.globalAlpha = t.alpha;
  ctx.translate(t.x, t.y - t.height * 0.42);
  ctx.rotate(t.rotation);
  const w = t.width * 0.9;
  const h = w * 0.5;
  ctx.beginPath();
  ctx.moveTo(-w / 2, h / 2);
  ctx.lineTo(-w / 2, -h * 0.1);
  ctx.lineTo(-w / 4, h * 0.15);
  ctx.lineTo(0, -h * 0.55);
  ctx.lineTo(w / 4, h * 0.15);
  ctx.lineTo(w / 2, -h * 0.1);
  ctx.lineTo(w / 2, h / 2);
  ctx.closePath();
  const g = ctx.createLinearGradient(0, -h, 0, h);
  g.addColorStop(0, "#fde68a");
  g.addColorStop(1, "#d97706");
  ctx.fillStyle = g;
  ctx.fill();
  ctx.lineWidth = Math.max(1, w * 0.03);
  ctx.strokeStyle = "#78350f";
  ctx.stroke();
  const sparkle = (Math.sin(time / 200) * 0.5 + 0.5) * 0.8 + 0.2;
  ctx.globalAlpha = t.alpha * sparkle;
  ctx.beginPath();
  ctx.arc(0, -h * 0.5, w * 0.06, 0, Math.PI * 2);
  ctx.fillStyle = "#fff7ed";
  ctx.fill();
  ctx.restore();
};

const visor = (ctx: CanvasRenderingContext2D, t: AnchorTransform) => {
  ctx.save();
  ctx.globalAlpha = t.alpha * 0.9;
  ctx.translate(t.x, t.y);
  ctx.rotate(t.rotation);
  ctx.beginPath();
  ctx.roundRect(-t.width / 2, -t.height * 0.7, t.width, t.height * 1.4, t.height * 0.7);
  const g = ctx.createLinearGradient(-t.width / 2, 0, t.width / 2, 0);
  g.addColorStop(0, "rgba(34,211,238,0.85)");
  g.addColorStop(0.5, "rgba(15,23,42,0.95)");
  g.addColorStop(1, "rgba(249,115,22,0.85)");
  ctx.fillStyle = g;
  ctx.fill();
  ctx.restore();
};

const handBolt = (ctx: CanvasRenderingContext2D, t: AnchorTransform, _target: TrackedTarget, time: number) => {
  ctx.save();
  ctx.globalAlpha = t.alpha;
  ctx.translate(t.x, t.y);
  ctx.globalCompositeOperation = "lighter";
  const r = t.width * (0.5 + Math.sin(time / 140) * 0.06);
  const g = ctx.createRadialGradient(0, 0, r * 0.1, 0, 0, r);
  g.addColorStop(0, "rgba(255,255,255,0.95)");
  g.addColorStop(0.4, "rgba(56,189,248,0.65)");
  g.addColorStop(1, "rgba(37,99,235,0)");
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fillStyle = g;
  ctx.fill();
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    const a = time / 90 + (i * Math.PI * 2) / 3;
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    ctx.strokeStyle = "rgba(191,219,254,0.8)";
    ctx.lineWidth = Math.max(1, r * 0.08);
    ctx.stroke();
  }
  ctx.restore();
};

const speedTrail = (ctx: CanvasRenderingContext2D, t: AnchorTransform, target: TrackedTarget, time: number) => {
  const speed = Math.hypot(target.velocity.x, target.velocity.y);
  ctx.save();
  ctx.globalAlpha = t.alpha * Math.min(1, 0.2 + speed * 3);
  ctx.globalCompositeOperation = "lighter";
  ctx.translate(t.x, t.y);
  for (let i = 1; i <= 5; i++) {
    const off = -Math.sign(target.velocity.x || 1) * i * t.width * 0.18;
    ctx.globalAlpha = (t.alpha * (6 - i)) / 14;
    ctx.beginPath();
    ctx.ellipse(off, Math.sin(time / 200 + i) * t.height * 0.02, t.width * 0.4, t.height * 0.5, 0, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(56,189,248,0.35)";
    ctx.fill();
  }
  ctx.restore();
};

export const FILTERS: FilterDef[] = [
  { id: "none", label: "No effect", emoji: "🚫", anchor: "head" },
  { id: "head-flame", label: "Fire head", emoji: "🔥", anchor: "head", draw: flame },
  { id: "halo", label: "Halo", emoji: "😇", anchor: "head", draw: halo },
  { id: "crown", label: "Crown", emoji: "👑", anchor: "head", draw: crown },
  { id: "visor", label: "Cyber visor", emoji: "🕶️", anchor: "eyes", draw: visor },
  { id: "hand-bolt", label: "Energy hands", emoji: "⚡", anchor: "leftHand", draw: handBolt },
  { id: "speed-trail", label: "Speed trail", emoji: "💨", anchor: "torso", draw: speedTrail },
  ...CHARACTER_STYLES.map<FilterDef>((s) => ({
    id: `skin-${s.id}`,
    label: `Skin: ${s.label}`,
    emoji: s.premium ? "💎" : "🧍",
    anchor: "fullBody",
    skin: s,
    premium: s.premium,
  })),
];

export const getFilter = (id: string) => FILTERS.find((f) => f.id === id) ?? FILTERS[0];

// ---------- renderer ----------

export interface RenderOptions {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  targets: TrackedTarget[];
  segmentation?: SegmentationFrame;
  filter: FilterDef;
  timeMs: number;
  debug?: boolean;
  mirrored?: boolean;
  /** Scratch canvases reused between frames (avoids per-frame allocation). */
  scratch: { mask: HTMLCanvasElement; layer: HTMLCanvasElement };
}

const POSE_EDGES: [number, number][] = [
  [11, 12], [11, 13], [13, 15], [12, 14], [14, 16],
  [11, 23], [12, 24], [23, 24], [23, 25], [25, 27],
  [24, 26], [26, 28], [27, 31], [28, 32], [0, 11], [0, 12],
];

const drawDebug = (
  ctx: CanvasRenderingContext2D,
  targets: TrackedTarget[],
  w: number,
  h: number
) => {
  ctx.save();
  ctx.lineWidth = Math.max(2, w * 0.004);
  targets.forEach((t) => {
    const hue = (t.id * 67) % 360;
    const color = `hsl(${hue} 90% 60%)`;
    // bounding box
    ctx.strokeStyle = t.coasting ? `hsl(${hue} 90% 60% / 0.5)` : color;
    ctx.setLineDash(t.coasting ? [8, 6] : []);
    ctx.strokeRect(t.box.x * w, t.box.y * h, t.box.w * w, t.box.h * h);
    ctx.setLineDash([]);

    // skeleton
    const pose = t.pose;
    if (pose?.length) {
      ctx.strokeStyle = color;
      POSE_EDGES.forEach(([a, b]) => {
        const p = pose[a];
        const q = pose[b];
        if (!p || !q || (p.visibility ?? 1) < 0.3 || (q.visibility ?? 1) < 0.3) return;
        ctx.beginPath();
        ctx.moveTo(p.x * w, p.y * h);
        ctx.lineTo(q.x * w, q.y * h);
        ctx.stroke();
      });
      ctx.fillStyle = "#ffffff";
      pose.forEach((p) => {
        if ((p.visibility ?? 1) < 0.3) return;
        ctx.beginPath();
        ctx.arc(p.x * w, p.y * h, Math.max(2, w * 0.005), 0, Math.PI * 2);
        ctx.fill();
      });
    }

    // face mesh (sparse)
    if (t.face?.length) {
      ctx.fillStyle = `hsl(${hue} 90% 75% / 0.85)`;
      for (let i = 0; i < t.face.length; i += 4) {
        const p = t.face[i];
        ctx.fillRect(p.x * w - 1, p.y * h - 1, 2, 2);
      }
    }

    // hands
    t.hands?.forEach((hnd) => {
      ctx.fillStyle = "#f97316";
      hnd.landmarks.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x * w, p.y * h, Math.max(1.5, w * 0.004), 0, Math.PI * 2);
        ctx.fill();
      });
    });

    // label
    const label = `#${t.id} ${(t.confidence * 100).toFixed(0)}%${t.coasting ? " • predicted" : ""}`;
    ctx.font = `${Math.max(12, w * 0.028)}px ui-monospace, monospace`;
    const tw = ctx.measureText(label).width;
    const lx = t.box.x * w;
    const ly = Math.max(18, t.box.y * h - 8);
    ctx.fillStyle = "rgba(2,6,23,0.75)";
    ctx.fillRect(lx - 4, ly - 16, tw + 8, 22);
    ctx.fillStyle = color;
    ctx.fillText(label, lx, ly);
  });
  ctx.restore();
};

/**
 * Draws one composited AR frame onto the overlay canvas.
 * The source video stays untouched in its own element/layer.
 */
export const renderARFrame = (o: RenderOptions) => {
  const { ctx, width: w, height: h, targets, filter, timeMs, segmentation, scratch } = o;
  ctx.clearRect(0, 0, w, h);

  for (const target of targets) {
    if (filter.skin) {
      // --- full-body skin: segmentation stencil + skeletal retarget ---
      const layer = scratch.layer;
      if (layer.width !== w || layer.height !== h) {
        layer.width = w;
        layer.height = h;
      }
      const lctx = layer.getContext("2d");
      if (!lctx) continue;
      lctx.clearRect(0, 0, w, h);
      drawCharacter(lctx, target, w, h, filter.skin, timeMs);

      if (segmentation && target.maskIndex !== undefined) {
        // Keep the character inside the person silhouette so it
        // replaces the body instead of floating over the scene.
        const mask = maskToCanvas(segmentation, scratch.mask, target.maskIndex + 1);
        if (mask) {
          // Clip the retargeted character to the person silhouette so it
          // replaces the body instead of floating over the scene.
          lctx.save();
          lctx.globalCompositeOperation = "destination-in";
          lctx.filter = "blur(1.5px)";
          lctx.drawImage(mask as HTMLCanvasElement, 0, 0, w, h);
          lctx.restore();
          lctx.filter = "none";
          // Re-draw the head/limb rig on top at reduced alpha so extremities
          // that fall just outside the mask still read.
          lctx.globalAlpha = 0.55;
          drawCharacter(lctx, target, w, h, filter.skin, timeMs);
          lctx.globalAlpha = 1;
        }
      }
      ctx.drawImage(layer, 0, 0);
      continue;
    }

    if (!filter.draw) continue;
    const t = resolveAnchor(target, filter.anchor, w, h);
    if (!t) continue;
    if (filter.scale) {
      t.width *= filter.scale;
      t.height *= filter.scale;
    }
    if (filter.offset) {
      t.x += filter.offset.x * t.width;
      t.y += filter.offset.y * t.height;
    }
    filter.draw(ctx, t, target, timeMs);

    // Mirror hand effects onto the other hand automatically.
    if (filter.anchor === "leftHand") {
      const rt = resolveAnchor(target, "rightHand", w, h);
      if (rt) filter.draw(ctx, rt, target, timeMs + 300);
    }
  }

  if (o.debug) {
    if (segmentation) {
      const mask = maskToCanvas(segmentation, scratch.mask, undefined, [34, 211, 238]);
      if (mask) {
        ctx.save();
        ctx.globalAlpha = 0.28;
        ctx.drawImage(mask as HTMLCanvasElement, 0, 0, w, h);
        ctx.restore();
      }
    }
    drawDebug(ctx, targets, w, h);
  }
};
