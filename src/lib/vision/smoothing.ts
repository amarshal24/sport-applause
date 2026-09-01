// ============================================================
// Pipeline stage 5: temporal smoothing.
// Single entry point for every smoothing/prediction primitive
// used by the vision layer (One Euro filters + constant-velocity
// motion prediction for coasting through lost detections).
// ============================================================

export {
  OneEuro,
  Vec2Smoother,
  LandmarkSmoother,
  MotionPredictor,
} from "@/lib/ar/smoothing";

import type { Landmark } from "@/lib/ar/types";

/** Linear blend between two landmark sets (used for mask/pose alignment). */
export const lerpLandmarks = (a: Landmark[], b: Landmark[], k: number): Landmark[] =>
  b.map((p, i) => {
    const q = a[i] ?? p;
    return {
      x: q.x + (p.x - q.x) * k,
      y: q.y + (p.y - q.y) * k,
      z: (q.z ?? 0) + ((p.z ?? 0) - (q.z ?? 0)) * k,
      visibility: p.visibility,
    };
  });

/** Frame-rate independent damping factor. */
export const damp = (k: number, dt: number) => 1 - Math.exp(-k * dt);
