// ============================================================
// Lightweight client-side object tracker.
// The user taps an object in the video (e.g. the basketball) and
// this follows it frame-by-frame so the FX stays locked on it.
// Template matching on a downscaled grayscale frame — no ML, no
// network, works entirely in the browser.
// ============================================================

export interface TrackPoint {
  t: number; // seconds
  x: number; // 0-100 %
  y: number; // 0-100 %
  c?: number; // match confidence 0-1 (1 = perfect lock)
  s?: number; // object size relative to the pick frame (1 = same size)
}

const SAMPLE_FPS = 24; // tracked samples per second (denser = less lag on fast moves)
const WORK_W = 288; // downscaled analysis width
const PATCH = 12; // half-size of the template patch (in work px)
const SEARCH = 10; // search radius around the motion-predicted spot (in work px)
const RECOVER = 3; // search-radius multiplier when the lock is weak
const SCALES = [0.9, 1, 1.1]; // per-step size change tested (player moving toward/away)
const MIN_S = 0.35;
const MAX_S = 3;

const toGray = (data: Uint8ClampedArray, w: number, h: number) => {
  const g = new Float32Array(w * h);
  for (let i = 0, p = 0; i < g.length; i++, p += 4) {
    g[i] = 0.299 * data[p] + 0.587 * data[p + 1] + 0.114 * data[p + 2];
  }
  return g;
};

const SIZE = PATCH * 2 + 1;
const N = SIZE * SIZE;

/** Bilinear sample, clamped to the frame. */
const at = (g: Float32Array, w: number, h: number, x: number, y: number) => {
  const cx = Math.min(w - 1.001, Math.max(0, x));
  const cy = Math.min(h - 1.001, Math.max(0, y));
  const x0 = cx | 0;
  const y0 = cy | 0;
  const fx = cx - x0;
  const fy = cy - y0;
  const i = y0 * w + x0;
  const a = g[i] + (g[i + 1] - g[i]) * fx;
  const b = g[i + w] + (g[i + w + 1] - g[i + w]) * fx;
  return a + (b - a) * fy;
};

/** Zero-mean, unit-norm patch sampled at scale `k` (k = object size vs. pick). */
const patchAt = (g: Float32Array, w: number, h: number, cx: number, cy: number, k = 1) => {
  const out = new Float32Array(N);
  let mean = 0;
  for (let dy = -PATCH, i = 0; dy <= PATCH; dy++) {
    for (let dx = -PATCH; dx <= PATCH; dx++, i++) {
      out[i] = at(g, w, h, cx + dx * k, cy + dy * k);
      mean += out[i];
    }
  }
  mean /= N;
  let norm = 0;
  for (let i = 0; i < N; i++) {
    out[i] -= mean;
    norm += out[i] * out[i];
  }
  norm = Math.sqrt(norm) || 1;
  for (let i = 0; i < N; i++) out[i] /= norm;
  return out;
};

/** Normalised cross-correlation (-1..1): robust to lighting and shadows. */
const ncc = (tpl: Float32Array, g: Float32Array, w: number, h: number, cx: number, cy: number, k: number) => {
  const cand = patchAt(g, w, h, cx, cy, k);
  let s = 0;
  for (let i = 0; i < N; i++) s += tpl[i] * cand[i];
  return s;
};

const seekTo = (video: HTMLVideoElement, t: number) =>
  new Promise<void>((resolve) => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      video.removeEventListener("seeked", finish);
      // Let the newly decoded frame reach the canvas source before sampling.
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    };
    video.addEventListener("seeked", finish);
    video.currentTime = Math.max(0, t);
    // Safety net if the browser never fires `seeked`
    setTimeout(finish, 400);
  });

export interface TrackOptions {
  /** Seconds in the clip where the user picked the object. */
  startTime: number;
  /** Picked point, 0-100 % of the frame. */
  x: number;
  y: number;
  onProgress?: (pct: number, confidence?: number) => void;
  signal?: AbortSignal;
  /** Only track forward from `startTime` (used when re-tracking after a loss). */
  forwardOnly?: boolean;
}

/** One search step: best position + scale for the template near (px, py). */
export const searchStep = (
  template: Float32Array,
  g: Float32Array,
  w: number,
  h: number,
  px: number,
  py: number,
  scale: number,
  radius: number
) => {
  let best = -Infinity;
  let bx = px;
  let by = py;
  let bs = scale;
  const stride = radius > SEARCH ? 3 : 2;
  for (const f of SCALES) {
    const k = Math.min(MAX_S, Math.max(MIN_S, scale * f));
    for (let dy = -radius; dy <= radius; dy += stride) {
      for (let dx = -radius; dx <= radius; dx += stride) {
        const nx = px + dx;
        const ny = py + dy;
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
        // Mild preference for the predicted spot stops jumps to look-alikes.
        const s = ncc(template, g, w, h, nx, ny, k) - 0.0006 * (dx * dx + dy * dy) / Math.max(1, k);
        if (s > best) { best = s; bx = nx; by = ny; bs = k; }
      }
    }
  }
  // Sub-pixel refinement around the coarse winner.
  for (const step of [1, 0.5]) {
    const cx = bx, cy = by;
    for (let dy = -step; dy <= step; dy += step) {
      for (let dx = -step; dx <= step; dx += step) {
        if (!dx && !dy) continue;
        const s = ncc(template, g, w, h, cx + dx, cy + dy, bs) - 0.0006 * ((cx + dx - px) ** 2 + (cy + dy - py) ** 2) / Math.max(1, bs);
        if (s > best) { best = s; bx = cx + dx; by = cy + dy; }
      }
    }
  }
  return { x: bx, y: by, scale: bs, score: best };
};

/** NCC score -> 0-1 lock confidence. */
export const nccConfidence = (score: number) => Math.max(0, Math.min(1, (score - 0.2) / 0.7));

/**
 * Follows the object under (x, y) across the whole clip and returns a
 * keyframed path (position + relative size). Tracks forward from the pick
 * point, then backward. Uses motion prediction, scale search and a drift-
 * guarded template so fast athletes stay locked.
 */
export const trackObject = async (
  source: string | File | Blob,
  { startTime, x, y, onProgress, signal, forwardOnly }: TrackOptions
): Promise<TrackPoint[]> => {
  const objectUrl = typeof source === "string" ? null : URL.createObjectURL(source);
  const src = typeof source === "string" ? source : (objectUrl as string);

  const video = document.createElement("video");
  video.src = src;
  video.muted = true;
  video.playsInline = true;
  video.crossOrigin = "anonymous";
  video.preload = "auto";

  const cleanup = () => {
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    video.removeAttribute("src");
    video.load();
  };

  try {
    await new Promise<void>((resolve, reject) => {
      video.onloadeddata = () => resolve();
      video.onerror = () => reject(new Error("Could not read the clip for tracking."));
      setTimeout(() => reject(new Error("Tracking timed out loading the clip.")), 15000);
    });

    const duration = isFinite(video.duration) ? video.duration : 0;
    if (!duration) throw new Error("Clip length is unknown, cannot track.");

    const vw = video.videoWidth || 720;
    const vh = video.videoHeight || 1280;
    const w = Math.min(WORK_W, vw);
    const h = Math.max(2, Math.round((vh / vw) * w));

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) throw new Error("Tracking is not supported on this device.");

    const grab = async (t: number) => {
      await seekTo(video, t);
      ctx.drawImage(video, 0, 0, w, h);
      return toGray(ctx.getImageData(0, 0, w, h).data, w, h);
    };

    const step = 1 / SAMPLE_FPS;
    const total = Math.max(1, Math.round((forwardOnly ? duration - startTime : duration) / step));
    let processed = 0;

    const anchor = Math.min(Math.max(0, startTime), Math.max(0, duration - step));
    const first = await grab(anchor);
    const ax = (x / 100) * w;
    const ay = (y / 100) * h;
    const anchorTpl = patchAt(first, w, h, ax, ay, 1);

    const points: TrackPoint[] = [{ t: anchor, x: (ax / w) * 100, y: (ay / h) * 100, c: 1, s: 1 }];

    const run = async (dir: 1 | -1) => {
      let px = ax;
      let py = ay;
      let vx = 0;
      let vy = 0;
      let scale = 1;
      let lost = 0;
      const template = anchorTpl.slice();

      for (let t = anchor + dir * step; t >= 0 && t <= duration - 0.01; t += dir * step) {
        if (signal?.aborted) return;
        const g = await grab(t);

        // Constant-velocity prediction keeps the search window on fast movers.
        const qx = Math.min(w - 1, Math.max(0, px + vx));
        const qy = Math.min(h - 1, Math.max(0, py + vy));
        const radius = Math.round((lost ? SEARCH * RECOVER : SEARCH) * Math.max(1, scale));
        let m = searchStep(template, g, w, h, qx, qy, scale, radius);
        // Re-acquire against the original look when the adapted one fails.
        if (nccConfidence(m.score) < 0.45) {
          const r = searchStep(anchorTpl, g, w, h, qx, qy, scale, Math.round(SEARCH * RECOVER * Math.max(1, scale)));
          if (r.score > m.score) m = r;
        }
        const conf = nccConfidence(m.score);

        if (conf >= 0.3) {
          vx = (vx * 0.5 + (m.x - px) * 0.5);
          vy = (vy * 0.5 + (m.y - py) * 0.5);
          px = m.x;
          py = m.y;
          scale = scale * 0.6 + m.scale * 0.4;
          lost = 0;
        } else {
          // Coast on the motion model instead of snapping to a look-alike.
          px = qx;
          py = qy;
          vx *= 0.7;
          vy *= 0.7;
          lost++;
        }
        points.push({ t, x: (px / w) * 100, y: (py / h) * 100, c: conf, s: scale });

        // Drift guard: adapt only on confident locks, anchored to the original look.
        if (conf >= 0.6) {
          const fresh = patchAt(g, w, h, px, py, scale);
          for (let i = 0; i < N; i++) {
            template[i] = template[i] * 0.8 + fresh[i] * 0.12 + anchorTpl[i] * 0.08;
          }
        }

        processed++;
        onProgress?.(Math.min(99, Math.round((processed / total) * 100)), conf);
      }
    };

    await run(1);
    if (!forwardOnly) await run(-1);

    points.sort((a, b) => a.t - b.t);
    onProgress?.(100);
    return points;
  } finally {
    cleanup();
  }
};

/** Interpolated position on the track at time `t` (returns null when empty). */
export const sampleTrack = (
  track: TrackPoint[] | undefined,
  t: number
): { x: number; y: number; c?: number; s?: number } | null => {
  if (!track || track.length === 0) return null;
  if (t <= track[0].t) return { x: track[0].x, y: track[0].y, c: track[0].c, s: track[0].s };
  const last = track[track.length - 1];
  if (t >= last.t) return { x: last.x, y: last.y, c: last.c, s: last.s };

  let lo = 0;
  let hi = track.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (track[mid].t <= t) lo = mid;
    else hi = mid;
  }
  const a = track[lo];
  const b = track[hi];
  const span = b.t - a.t || 1;
  const k = (t - a.t) / span;
  return {
    x: a.x + (b.x - a.x) * k,
    y: a.y + (b.y - a.y) * k,
    c: Math.min(a.c ?? 1, b.c ?? 1),
    s: a.s === undefined && b.s === undefined ? undefined : (a.s ?? 1) + ((b.s ?? 1) - (a.s ?? 1)) * k,
  };
};

export type TrackHealth = "strong" | "shaky" | "lost";

export interface TrackQuality {
  /** Average confidence 0-1 across the clip. */
  average: number;
  /** Lowest confidence sample. */
  worst: number;
  /** Share of samples below the usable threshold (0-1). */
  weakRatio: number;
  health: TrackHealth;
  /** Time (s) of the first sample where the tracker lost the object. */
  lostAt: number | null;
}

export const WEAK_CONFIDENCE = 0.45;

/** Summarises how well a track held onto its object. */
export const trackQuality = (track: TrackPoint[] | undefined): TrackQuality | null => {
  if (!track || track.length === 0) return null;
  const cs = track.map((p) => p.c ?? 1);
  const average = cs.reduce((a, b) => a + b, 0) / cs.length;
  const worst = Math.min(...cs);
  const weak = track.filter((p) => (p.c ?? 1) < WEAK_CONFIDENCE);
  const weakRatio = weak.length / track.length;
  const health: TrackHealth =
    weakRatio > 0.3 || average < 0.4 ? "lost" : weakRatio > 0.08 || average < 0.62 ? "shaky" : "strong";
  return { average, worst, weakRatio, health, lostAt: weak.length ? weak[0].t : null };
};

/** Shift a whole track by a delta (used when the user drags a locked pin). */
export const shiftTrack = (track: TrackPoint[], dx: number, dy: number): TrackPoint[] =>
  track.map((p) => ({
    t: p.t,
    x: Math.max(0, Math.min(100, p.x + dx)),
    y: Math.max(0, Math.min(100, p.y + dy)),
    c: p.c,
    s: p.s,
  }));


/**
 * Merges a re-tracked segment into an existing track, keeping every sample
 * before `fromTime` from the original path.
 */
export const mergeTracks = (
  original: TrackPoint[] | undefined,
  segment: TrackPoint[],
  fromTime: number
): TrackPoint[] => {
  const head = (original ?? []).filter((p) => p.t < fromTime);
  const tail = segment.filter((p) => p.t >= fromTime);
  return [...head, ...tail].sort((a, b) => a.t - b.t);
};

/** Last sample before the tracker started losing the object. */
export const lastGoodPoint = (track: TrackPoint[] | undefined): TrackPoint | null => {
  if (!track?.length) return null;
  let best: TrackPoint | null = null;
  for (const p of track) {
    if ((p.c ?? 1) < WEAK_CONFIDENCE) break;
    best = p;
  }
  return best;
};

/**
 * Smooths a tracked path. `stickiness` (0..1) controls how tightly the effect
 * clings to the raw detection: 1 = follow every jitter, 0 = very smooth/lazy.
 */
export const smoothTrack = (
  track: TrackPoint[] | undefined,
  stickiness: number
): TrackPoint[] | undefined => {
  if (!track?.length) return track;
  const alpha = Math.max(0.05, Math.min(1, 0.12 + 0.88 * stickiness));
  if (alpha >= 1 || track.length < 3) return track;
  // Forward + backward pass (zero-phase): removes jitter without the effect
  // trailing behind the athlete. Low-confidence samples pull less weight.
  const pass = (xs: number[], ws: number[], rev: boolean) => {
    const out = xs.slice();
    const idx = rev ? [...xs.keys()].reverse() : [...xs.keys()];
    let v = xs[idx[0]];
    for (const i of idx) {
      v += (xs[i] - v) * alpha * ws[i];
      out[i] = v;
    }
    return out;
  };
  const ws = track.map((p) => 0.35 + 0.65 * Math.min(1, p.c ?? 1));
  const sm = (xs: number[]) => {
    const f = pass(xs, ws, false);
    const b = pass(xs, ws, true);
    return f.map((v, i) => (v + b[i]) / 2);
  };
  const xs = sm(track.map((p) => p.x));
  const ys = sm(track.map((p) => p.y));
  const ss = track.some((p) => p.s !== undefined) ? sm(track.map((p) => p.s ?? 1)) : null;
  return track.map((p, i) => ({ t: p.t, x: xs[i], y: ys[i], c: p.c, ...(ss ? { s: ss[i] } : {}) }));
};
