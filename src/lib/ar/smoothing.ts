// ============================================================
// Stage: temporal smoothing.
// One Euro filters kill jitter without adding lag, and a
// constant-velocity predictor keeps a target alive (coasting)
// while detection is momentarily lost.
// ============================================================

import type { Landmark, Vec2 } from "./types";

const alphaFor = (cutoff: number, dt: number) => {
  const tau = 1 / (2 * Math.PI * cutoff);
  return 1 / (1 + tau / Math.max(dt, 1e-4));
};

/** Classic 1€ filter — adaptive cutoff: slow = smooth, fast = responsive. */
export class OneEuro {
  private x: number | null = null;
  private dx = 0;
  private lastT = 0;

  constructor(
    private minCutoff = 1.2,
    private beta = 0.015,
    private dCutoff = 1
  ) {}

  reset() {
    this.x = null;
    this.dx = 0;
  }

  filter(value: number, t: number): number {
    if (this.x === null || !isFinite(this.x)) {
      this.x = value;
      this.lastT = t;
      return value;
    }
    const dt = Math.max(1e-3, t - this.lastT);
    this.lastT = t;

    const dxRaw = (value - this.x) / dt;
    this.dx = this.dx + alphaFor(this.dCutoff, dt) * (dxRaw - this.dx);

    const cutoff = this.minCutoff + this.beta * Math.abs(this.dx);
    const a = alphaFor(cutoff, dt);
    this.x = this.x + a * (value - this.x);
    return this.x;
  }

  /** Current velocity estimate (units / second). */
  get speed() {
    return this.dx;
  }
}

export class Vec2Smoother {
  private fx: OneEuro;
  private fy: OneEuro;

  constructor(minCutoff = 1.2, beta = 0.015) {
    this.fx = new OneEuro(minCutoff, beta);
    this.fy = new OneEuro(minCutoff, beta);
  }

  filter(p: Vec2, t: number): Vec2 {
    return { x: this.fx.filter(p.x, t), y: this.fy.filter(p.y, t) };
  }

  get velocity(): Vec2 {
    return { x: this.fx.speed, y: this.fy.speed };
  }

  reset() {
    this.fx.reset();
    this.fy.reset();
  }
}

/** Smooths a whole landmark set, keeping per-point filter state. */
export class LandmarkSmoother {
  private fx: OneEuro[] = [];
  private fy: OneEuro[] = [];
  private fz: OneEuro[] = [];

  constructor(private minCutoff = 1.4, private beta = 0.02) {}

  /** `stickiness` 0..1 — 1 follows raw detections, 0 is very smooth. */
  setStickiness(stickiness: number) {
    const s = Math.max(0, Math.min(1, stickiness));
    this.minCutoff = 0.35 + s * 3.2;
    this.beta = 0.004 + s * 0.05;
    this.fx = [];
    this.fy = [];
    this.fz = [];
  }

  filter(points: Landmark[], t: number): Landmark[] {
    return points.map((p, i) => {
      if (!this.fx[i]) {
        this.fx[i] = new OneEuro(this.minCutoff, this.beta);
        this.fy[i] = new OneEuro(this.minCutoff, this.beta);
        this.fz[i] = new OneEuro(this.minCutoff, this.beta);
      }
      return {
        x: this.fx[i].filter(p.x, t),
        y: this.fy[i].filter(p.y, t),
        z: this.fz[i].filter(p.z ?? 0, t),
        visibility: p.visibility,
      };
    });
  }

  reset() {
    this.fx = [];
    this.fy = [];
    this.fz = [];
  }
}

/** Constant-velocity motion model used to coast through detection gaps. */
export class MotionPredictor {
  private last: Vec2 | null = null;
  private v: Vec2 = { x: 0, y: 0 };
  private lastT = 0;

  observe(p: Vec2, t: number) {
    if (this.last) {
      const dt = Math.max(1e-3, t - this.lastT);
      const vx = (p.x - this.last.x) / dt;
      const vy = (p.y - this.last.y) / dt;
      // Blend so a single noisy frame cannot fling the prediction.
      this.v = { x: this.v.x * 0.6 + vx * 0.4, y: this.v.y * 0.6 + vy * 0.4 };
    }
    this.last = p;
    this.lastT = t;
  }

  /** Extrapolated position at `t`, with velocity decay so it settles. */
  predict(t: number): Vec2 | null {
    if (!this.last) return null;
    const dt = Math.max(0, t - this.lastT);
    const decay = Math.exp(-2.5 * dt);
    return {
      x: this.last.x + this.v.x * dt * decay,
      y: this.last.y + this.v.y * dt * decay,
    };
  }

  get velocity() {
    return this.v;
  }
}
