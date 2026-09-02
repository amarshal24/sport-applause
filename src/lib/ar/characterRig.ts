// ============================================================
// Stage: skeletal retargeting + character mesh.
// The tracked skeleton drives a rigged character so the
// replacement body copies the person's exact movement:
// every bone is drawn as a tapered, landmark-deformed mesh
// strip rather than a rectangular sprite pasted on top.
// ============================================================

import type { Landmark, TrackedTarget } from "./types";

export const POSE = {
  nose: 0,
  leftEye: 2,
  rightEye: 5,
  leftEar: 7,
  rightEar: 8,
  leftShoulder: 11,
  rightShoulder: 12,
  leftElbow: 13,
  rightElbow: 14,
  leftWrist: 15,
  rightWrist: 16,
  leftHip: 23,
  rightHip: 24,
  leftKnee: 25,
  rightKnee: 26,
  leftAnkle: 27,
  rightAnkle: 28,
  leftFoot: 31,
  rightFoot: 32,
} as const;

export interface CharacterStyle {
  id: string;
  label: string;
  /** Body suit / primary colour. */
  suit: string;
  /** Secondary colour: chest plate, boots, gloves. */
  accent: string;
  /** Skin / face colour. */
  skin: string;
  outline: string;
  /** Optional glow colour for energy characters. */
  glow?: string;
  cape?: boolean;
  mask?: boolean;
  helmet?: boolean;
  /** Chunky cartoon proportions. */
  chibi?: boolean;
  premium?: boolean;
}

export const CHARACTER_STYLES: CharacterStyle[] = [
  {
    id: "hero-bolt",
    label: "Bolt (superhero)",
    suit: "#1d4ed8",
    accent: "#f97316",
    skin: "#f2c39b",
    outline: "#0b1220",
    glow: "#60a5fa",
    cape: true,
    mask: true,
  },
  {
    id: "hero-blaze",
    label: "Blaze (superhero)",
    suit: "#b91c1c",
    accent: "#facc15",
    skin: "#e8b48a",
    outline: "#1a0505",
    glow: "#fb923c",
    cape: true,
    mask: true,
  },
  {
    id: "athlete-pro",
    label: "Pro athlete",
    suit: "#0f172a",
    accent: "#22d3ee",
    skin: "#c98c5f",
    outline: "#020617",
  },
  {
    id: "toon-kid",
    label: "Cartoon",
    suit: "#16a34a",
    accent: "#fde047",
    skin: "#fcd5b5",
    outline: "#14290f",
    chibi: true,
  },
  {
    id: "chrome-mech",
    label: "Chrome mech",
    suit: "#94a3b8",
    accent: "#38bdf8",
    skin: "#cbd5e1",
    outline: "#0f172a",
    glow: "#7dd3fc",
    helmet: true,
    premium: true,
  },
  {
    id: "energy-ghost",
    label: "Energy ghost",
    suit: "#7c3aed",
    accent: "#22d3ee",
    skin: "#ddd6fe",
    outline: "#1e1b4b",
    glow: "#a78bfa",
    premium: true,
  },
];

interface P {
  x: number;
  y: number;
}

const px = (l: Landmark | undefined, w: number, h: number): P | null =>
  l && (l.visibility ?? 1) > 0.15 ? { x: l.x * w, y: l.y * h } : null;

const mid = (a: P, b: P): P => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
const dist = (a: P, b: P) => Math.hypot(a.x - b.x, a.y - b.y);

/**
 * Draws a bone as a tapered quad with rounded caps — a two-triangle
 * mesh strip deformed by its two joints, so it bends and stretches
 * exactly like the tracked limb.
 */
const bone = (
  ctx: CanvasRenderingContext2D,
  a: P,
  b: P,
  r1: number,
  r2: number,
  fill: string,
  outline?: string
) => {
  const ang = Math.atan2(b.y - a.y, b.x - a.x);
  const n = ang + Math.PI / 2;
  const nx = Math.cos(n);
  const ny = Math.sin(n);
  ctx.beginPath();
  ctx.moveTo(a.x + nx * r1, a.y + ny * r1);
  ctx.lineTo(b.x + nx * r2, b.y + ny * r2);
  ctx.arc(b.x, b.y, r2, n, n + Math.PI, false);
  ctx.lineTo(a.x - nx * r1, a.y - ny * r1);
  ctx.arc(a.x, a.y, r1, n + Math.PI, n + Math.PI * 2, false);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  if (outline) {
    ctx.lineWidth = Math.max(1.5, r1 * 0.22);
    ctx.strokeStyle = outline;
    ctx.stroke();
  }
};

const blob = (ctx: CanvasRenderingContext2D, pts: P[], fill: string, outline?: string) => {
  if (pts.length < 3) return;
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) {
    const prev = pts[i - 1];
    const cur = pts[i];
    ctx.quadraticCurveTo(prev.x, prev.y, (prev.x + cur.x) / 2, (prev.y + cur.y) / 2);
  }
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  if (outline) {
    ctx.lineWidth = 2;
    ctx.strokeStyle = outline;
    ctx.stroke();
  }
};

/**
 * Retargets the tracked skeleton onto a character rig and draws it.
 * Everything is derived from the live landmarks, so pose, proportions,
 * orientation and movement carry over one-to-one.
 */
export const drawCharacter = (
  ctx: CanvasRenderingContext2D,
  target: TrackedTarget,
  w: number,
  h: number,
  style: CharacterStyle,
  timeMs: number,
  tuning: RigTuning = DEFAULT_RIG
) => {
  const pose = target.pose;
  if (!pose?.length) return;

  const p = (i: number) => px(pose[i], w, h);
  const ls = p(POSE.leftShoulder);
  const rs = p(POSE.rightShoulder);
  const lh = p(POSE.leftHip);
  const rh = p(POSE.rightHip);
  if (!ls || !rs || !lh || !rh) return;

  const shoulders = mid(ls, rs);
  const hips = mid(lh, rh);
  const torsoLen = Math.max(8, dist(shoulders, hips));
  const shoulderW = Math.max(8, dist(ls, rs));
  const unit = (shoulderW + torsoLen) / 2;

  const bulk = (style.chibi ? 1.35 : 1) * tuning.bulk;
  const limb = unit * 0.15 * bulk;
  const arm = unit * 0.13 * bulk;
  const headR = unit * (style.chibi ? 0.52 : 0.36) * tuning.headScale;

  ctx.save();
  ctx.globalAlpha =
    Math.max(0.25, Math.min(1, target.confidence + (target.coasting ? 0.15 : 0.35))) * tuning.opacity;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  // --- live rig tuning: pose offset, scale, lean and idle animation ---
  const anim = rigAnimation(tuning, timeMs, unit);
  const pivotX = (shoulders.x + hips.x) / 2;
  const pivotY = (shoulders.y + hips.y) / 2;
  ctx.translate(pivotX + tuning.offsetX * unit + anim.dx, pivotY + tuning.offsetY * unit + anim.dy);
  ctx.rotate(tuning.lean + anim.rot);
  ctx.scale(tuning.scale * anim.sx, tuning.scale * anim.sy);
  ctx.translate(-pivotX, -pivotY);

  if (style.glow) {
    ctx.shadowColor = style.glow;
    ctx.shadowBlur = unit * 0.35 * tuning.glow;
  }


  // --- cape (follows torso, sways with velocity) ---
  if (style.cape) {
    const sway = Math.max(-1, Math.min(1, -target.velocity.x * 2)) * unit * 0.5;
    const flap = Math.sin(timeMs / 180) * unit * 0.12;
    blob(
      ctx,
      [
        { x: ls.x, y: ls.y },
        { x: rs.x, y: rs.y },
        { x: rs.x + sway + flap, y: hips.y + torsoLen * 0.9 },
        { x: hips.x + sway, y: hips.y + torsoLen * 1.15 },
        { x: ls.x + sway - flap, y: hips.y + torsoLen * 0.9 },
      ],
      style.accent,
      style.outline
    );
  }

  // --- legs ---
  const legPairs: [number, number, number][] = [
    [POSE.leftHip, POSE.leftKnee, POSE.leftAnkle],
    [POSE.rightHip, POSE.rightKnee, POSE.rightAnkle],
  ];
  for (const [hipI, kneeI, ankleI] of legPairs) {
    const a = p(hipI);
    const b = p(kneeI);
    const c = p(ankleI);
    if (a && b) bone(ctx, a, b, limb, limb * 0.85, style.suit, style.outline);
    if (b && c) bone(ctx, b, c, limb * 0.85, limb * 0.7, style.suit, style.outline);
    if (c) {
      const foot = p(ankleI === POSE.leftAnkle ? POSE.leftFoot : POSE.rightFoot);
      if (foot) bone(ctx, c, foot, limb * 0.75, limb * 0.55, style.accent, style.outline);
    }
  }

  // --- torso mesh (four corners driven by shoulders + hips) ---
  const spread = style.chibi ? 1.25 : 1.08;
  const tx = (a: P, b: P, k: number): P => ({ x: b.x + (a.x - b.x) * k, y: b.y + (a.y - b.y) * k });
  blob(
    ctx,
    [
      tx(ls, shoulders, spread),
      tx(rs, shoulders, spread),
      tx(rh, hips, spread * 0.92),
      tx(lh, hips, spread * 0.92),
    ],
    style.suit,
    style.outline
  );
  // chest emblem / jersey plate
  const chest = mid(shoulders, hips);
  ctx.beginPath();
  ctx.ellipse(chest.x, chest.y - torsoLen * 0.12, unit * 0.2, unit * 0.24, target.rotation, 0, Math.PI * 2);
  ctx.fillStyle = style.accent;
  ctx.fill();

  // --- arms ---
  const armPairs: [number, number, number][] = [
    [POSE.leftShoulder, POSE.leftElbow, POSE.leftWrist],
    [POSE.rightShoulder, POSE.rightElbow, POSE.rightWrist],
  ];
  for (const [sI, eI, wI] of armPairs) {
    const a = p(sI);
    const b = p(eI);
    const c = p(wI);
    if (a && b) bone(ctx, a, b, arm * 1.1, arm * 0.9, style.suit, style.outline);
    if (b && c) bone(ctx, b, c, arm * 0.9, arm * 0.75, style.suit, style.outline);
    if (c) {
      ctx.beginPath();
      ctx.arc(c.x, c.y, arm * 1.05, 0, Math.PI * 2);
      ctx.fillStyle = style.accent;
      ctx.fill();
      ctx.strokeStyle = style.outline;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }

  // --- head (position + orientation from face/ear landmarks) ---
  const nose = p(POSE.nose);
  const lEar = p(POSE.leftEar);
  const rEar = p(POSE.rightEar);
  const headCenter = nose
    ? { x: nose.x, y: nose.y - headR * 0.15 }
    : { x: shoulders.x, y: shoulders.y - headR };
  const headTilt = target.head?.roll ?? Math.atan2((lEar?.y ?? 0) - (rEar?.y ?? 0), (lEar?.x ?? 1) - (rEar?.x ?? 0));

  // neck
  bone(ctx, shoulders, headCenter, arm * 0.9, arm * 0.8, style.suit, style.outline);

  ctx.save();
  ctx.translate(headCenter.x, headCenter.y);
  ctx.rotate(isFinite(headTilt) ? headTilt : 0);
  ctx.beginPath();
  ctx.ellipse(0, 0, headR * 0.9, headR, 0, 0, Math.PI * 2);
  ctx.fillStyle = style.helmet || style.mask ? style.suit : style.skin;
  ctx.fill();
  ctx.strokeStyle = style.outline;
  ctx.lineWidth = 2;
  ctx.stroke();

  if (style.mask) {
    // visor across the eye line
    ctx.beginPath();
    ctx.ellipse(0, -headR * 0.12, headR * 0.78, headR * 0.3, 0, 0, Math.PI * 2);
    ctx.fillStyle = style.accent;
    ctx.fill();
  } else if (style.helmet) {
    ctx.beginPath();
    ctx.ellipse(0, -headR * 0.05, headR * 0.72, headR * 0.34, 0, 0, Math.PI * 2);
    ctx.fillStyle = style.glow ?? style.accent;
    ctx.fill();
  } else {
    // cartoon eyes that follow head yaw
    const yaw = target.head?.yaw ?? 0;
    const gx = Math.max(-1, Math.min(1, yaw)) * headR * 0.12;
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.ellipse(s * headR * 0.32, -headR * 0.1, headR * 0.18, headR * 0.22, 0, 0, Math.PI * 2);
      ctx.fillStyle = "#ffffff";
      ctx.fill();
      ctx.beginPath();
      ctx.arc(s * headR * 0.32 + gx, -headR * 0.08, headR * 0.09, 0, Math.PI * 2);
      ctx.fillStyle = style.outline;
      ctx.fill();
    }
    ctx.beginPath();
    ctx.arc(0, headR * 0.3, headR * 0.3, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.strokeStyle = style.outline;
    ctx.lineWidth = Math.max(2, headR * 0.09);
    ctx.stroke();
  }
  ctx.restore();
  ctx.restore();
};
