// ============================================================
// Stage: tracking.
// Greedy IoU + centroid association gives every person/object a
// persistent ID across frames. Targets survive occlusion and
// missed detections by coasting on a motion model, and only die
// once they have been unmatched for too long.
// ============================================================

import { LandmarkSmoother, MotionPredictor, Vec2Smoother } from "./smoothing";
import type {
  BoundingBox,
  HeadOrientation,
  Landmark,
  Observation,
  TrackedTarget,
  Vec2,
} from "./types";

const iou = (a: BoundingBox, b: BoundingBox) => {
  const x1 = Math.max(a.x, b.x);
  const y1 = Math.max(a.y, b.y);
  const x2 = Math.min(a.x + a.w, b.x + b.w);
  const y2 = Math.min(a.y + a.h, b.y + b.h);
  const inter = Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
  const union = a.w * a.h + b.w * b.h - inter;
  return union <= 0 ? 0 : inter / union;
};

const centerOf = (b: BoundingBox): Vec2 => ({ x: b.x + b.w / 2, y: b.y + b.h / 2 });

/** Head orientation from the face landmarker's 4x4 transform matrix. */
const matrixToEuler = (m?: number[]): HeadOrientation | undefined => {
  if (!m || m.length < 16) return undefined;
  // Column-major 4x4 → rotation part.
  const r00 = m[0], r10 = m[1], r20 = m[2];
  const r21 = m[6], r22 = m[10];
  const sy = Math.sqrt(r00 * r00 + r10 * r10);
  if (sy < 1e-6) return { yaw: 0, pitch: Math.atan2(-r20, sy), roll: 0 };
  return {
    roll: Math.atan2(r10, r00),
    pitch: Math.atan2(-r20, sy),
    yaw: Math.atan2(r21, r22),
  };
};

const shoulderRotation = (pose?: Landmark[]) => {
  if (!pose || pose.length < 13) return 0;
  const l = pose[11];
  const r = pose[12];
  if (!l || !r) return 0;
  return Math.atan2(l.y - r.y, l.x - r.x) + Math.PI;
};

const meanDepth = (pose?: Landmark[]) => {
  if (!pose?.length) return 0;
  let s = 0;
  let n = 0;
  for (const p of pose) {
    if (p.z !== undefined) {
      s += p.z;
      n++;
    }
  }
  return n ? s / n : 0;
};

interface Track {
  target: TrackedTarget;
  predictor: MotionPredictor;
  boxSmoother: Vec2Smoother;
  sizeSmoother: Vec2Smoother;
  poseSmoother: LandmarkSmoother;
  faceSmoother: LandmarkSmoother;
  handSmoothers: LandmarkSmoother[];
  missed: number;
  baseHeight: number;
}

export interface TrackerOptions {
  /** How many frames a target may coast before being dropped. */
  coastFrames?: number;
  /** Minimum IoU (or proximity) required to reuse an ID. */
  matchThreshold?: number;
  stickiness?: number;
  maxTargets?: number;
}

export class MultiTargetTracker {
  private tracks = new Map<number, Track>();
  private nextId = 1;
  private opts: Required<TrackerOptions>;

  constructor(opts: TrackerOptions = {}) {
    this.opts = {
      coastFrames: opts.coastFrames ?? 12,
      matchThreshold: opts.matchThreshold ?? 0.2,
      stickiness: opts.stickiness ?? 0.5,
      maxTargets: opts.maxTargets ?? 4,
    };
  }

  setStickiness(s: number) {
    this.opts.stickiness = s;
    this.tracks.forEach((t) => {
      t.poseSmoother.setStickiness(s);
      t.faceSmoother.setStickiness(s);
      t.handSmoothers.forEach((h) => h.setStickiness(s));
    });
  }

  reset() {
    this.tracks.clear();
  }

  /** Runs association + smoothing for one frame. `t` in seconds. */
  update(observations: Observation[], t: number): TrackedTarget[] {
    const unmatched = new Set(this.tracks.keys());
    const used = new Set<number>();

    // --- association: best score first ---
    const pairs: { id: number; obs: number; score: number }[] = [];
    observations.forEach((o, oi) => {
      this.tracks.forEach((track, id) => {
        if (track.target.kind !== o.kind) return;
        const predicted = track.predictor.predict(t) ?? track.target.center;
        const oc = centerOf(o.box);
        const dist = Math.hypot(predicted.x - oc.x, predicted.y - oc.y);
        const proximity = Math.max(0, 1 - dist / 0.45);
        const score = Math.max(iou(track.target.box, o.box), proximity * 0.9);
        if (score >= this.opts.matchThreshold) pairs.push({ id, obs: oi, score });
      });
    });
    pairs.sort((a, b) => b.score - a.score);

    for (const p of pairs) {
      if (used.has(p.obs) || !unmatched.has(p.id)) continue;
      used.add(p.obs);
      unmatched.delete(p.id);
      this.applyObservation(this.tracks.get(p.id)!, observations[p.obs], t);
    }

    // --- new targets ---
    observations.forEach((o, oi) => {
      if (used.has(oi)) return;
      if (this.tracks.size >= this.opts.maxTargets) return;
      this.spawn(o, t);
    });

    // --- coast / retire the unmatched ---
    unmatched.forEach((id) => {
      const track = this.tracks.get(id)!;
      track.missed++;
      if (track.missed > this.opts.coastFrames) {
        this.tracks.delete(id);
        return;
      }
      const predicted = track.predictor.predict(t);
      if (predicted) {
        track.target.center = predicted;
        track.target.box = {
          ...track.target.box,
          x: predicted.x - track.target.box.w / 2,
          y: predicted.y - track.target.box.h / 2,
        };
      }
      track.target.coasting = true;
      // Confidence decays so effects fade instead of popping off.
      track.target.confidence = Math.max(0, track.target.confidence * 0.82);
      track.target.ageFrames++;
    });

    return [...this.tracks.values()]
      .map((t2) => t2.target)
      .sort((a, b) => b.box.w * b.box.h - a.box.w * a.box.h);
  }

  private spawn(o: Observation, t: number) {
    const id = this.nextId++;
    const center = centerOf(o.box);
    const track: Track = {
      predictor: new MotionPredictor(),
      boxSmoother: new Vec2Smoother(1.0, 0.02),
      sizeSmoother: new Vec2Smoother(0.7, 0.01),
      poseSmoother: new LandmarkSmoother(),
      faceSmoother: new LandmarkSmoother(),
      handSmoothers: [new LandmarkSmoother(), new LandmarkSmoother()],
      missed: 0,
      baseHeight: Math.max(0.05, o.box.h),
      target: {
        id,
        kind: o.kind,
        box: o.box,
        center,
        scale: 1,
        rotation: 0,
        velocity: { x: 0, y: 0 },
        depth: meanDepth(o.pose),
        confidence: o.score,
        coasting: false,
        ageFrames: 0,
        lastSeenAt: t,
        maskIndex: o.maskIndex,
      },
    };
    track.poseSmoother.setStickiness(this.opts.stickiness);
    track.faceSmoother.setStickiness(this.opts.stickiness);
    track.handSmoothers.forEach((h) => h.setStickiness(this.opts.stickiness));
    this.tracks.set(id, track);
    this.applyObservation(track, o, t);
  }

  private applyObservation(track: Track, o: Observation, t: number) {
    const raw = centerOf(o.box);
    track.predictor.observe(raw, t);

    const center = track.boxSmoother.filter(raw, t);
    const size = track.sizeSmoother.filter({ x: o.box.w, y: o.box.h }, t);

    const target = track.target;
    target.center = center;
    target.box = { x: center.x - size.x / 2, y: center.y - size.y / 2, w: size.x, h: size.y };
    target.velocity = track.predictor.velocity;
    target.scale = size.y / track.baseHeight;
    target.confidence = o.score;
    target.coasting = false;
    target.lastSeenAt = t;
    target.ageFrames++;
    target.maskIndex = o.maskIndex ?? target.maskIndex;

    if (o.pose?.length) {
      target.pose = track.poseSmoother.filter(o.pose, t);
      target.rotation = shoulderRotation(target.pose);
      target.depth = meanDepth(o.pose);
    }
    if (o.face?.length) target.face = track.faceSmoother.filter(o.face, t);
    const head = matrixToEuler(o.faceMatrix);
    if (head) target.head = head;
    if (o.hands?.length) {
      target.hands = o.hands.map((h, i) => ({
        handedness: h.handedness,
        landmarks: (track.handSmoothers[i] ??= new LandmarkSmoother()).filter(h.landmarks, t),
      }));
    }
    track.missed = 0;
  }
}
