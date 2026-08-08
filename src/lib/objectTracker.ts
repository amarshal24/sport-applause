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
}

const SAMPLE_FPS = 10; // tracked samples per second
const WORK_W = 192; // downscaled analysis width
const PATCH = 9; // half-size of the template patch (in work px)
const SEARCH = 14; // search radius per step (in work px)

const toGray = (data: Uint8ClampedArray, w: number, h: number) => {
  const g = new Float32Array(w * h);
  for (let i = 0, p = 0; i < g.length; i++, p += 4) {
    g[i] = 0.299 * data[p] + 0.587 * data[p + 1] + 0.114 * data[p + 2];
  }
  return g;
};

const patchAt = (g: Float32Array, w: number, h: number, cx: number, cy: number) => {
  const size = PATCH * 2 + 1;
  const out = new Float32Array(size * size);
  for (let dy = -PATCH, i = 0; dy <= PATCH; dy++) {
    for (let dx = -PATCH; dx <= PATCH; dx++, i++) {
      const x = Math.min(w - 1, Math.max(0, cx + dx));
      const y = Math.min(h - 1, Math.max(0, cy + dy));
      out[i] = g[y * w + x];
    }
  }
  return out;
};

const score = (
  tpl: Float32Array,
  g: Float32Array,
  w: number,
  h: number,
  cx: number,
  cy: number
) => {
  let sum = 0;
  for (let dy = -PATCH, i = 0; dy <= PATCH; dy++) {
    for (let dx = -PATCH; dx <= PATCH; dx++, i++) {
      const x = Math.min(w - 1, Math.max(0, cx + dx));
      const y = Math.min(h - 1, Math.max(0, cy + dy));
      const d = tpl[i] - g[y * w + x];
      sum += d * d;
    }
  }
  return sum;
};

const seekTo = (video: HTMLVideoElement, t: number) =>
  new Promise<void>((resolve) => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      video.removeEventListener("seeked", finish);
      resolve();
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
}

/**
 * Follows the object under (x, y) across the whole clip and returns a
 * keyframed path. Tracks forward from the pick point, then backward.
 */
export const trackObject = async (
  source: string | File | Blob,
  { startTime, x, y, onProgress, signal }: TrackOptions
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
    const total = Math.max(1, Math.round(duration / step));
    let processed = 0;

    const anchor = Math.min(Math.max(0, startTime), Math.max(0, duration - step));
    const first = await grab(anchor);
    let cx = Math.round((x / 100) * w);
    let cy = Math.round((y / 100) * h);
    let tpl = patchAt(first, w, h, cx, cy);

    const points: TrackPoint[] = [
      { t: anchor, x: (cx / w) * 100, y: (cy / h) * 100, c: 1 },
    ];
    const N = (PATCH * 2 + 1) ** 2;
    // Root-mean-square pixel difference -> 0-1 confidence.
    const toConfidence = (ssd: number) =>
      Math.max(0, Math.min(1, 1 - Math.sqrt(ssd / N) / 45));

    const run = async (dir: 1 | -1) => {
      let px = Math.round((x / 100) * w);
      let py = Math.round((y / 100) * h);
      let template = tpl.slice();

      for (let t = anchor + dir * step; t >= 0 && t <= duration - 0.01; t += dir * step) {
        if (signal?.aborted) return;
        const g = await grab(t);

        let best = Infinity;
        let bx = px;
        let by = py;
        for (let dy = -SEARCH; dy <= SEARCH; dy += 2) {
          for (let dx = -SEARCH; dx <= SEARCH; dx += 2) {
            const nx = px + dx;
            const ny = py + dy;
            if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
            const s = score(template, g, w, h, nx, ny);
            if (s < best) {
              best = s;
              bx = nx;
              by = ny;
            }
          }
        }
        // Refine with a 1px pass around the coarse winner
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const nx = bx + dx;
            const ny = by + dy;
            if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
            const s = score(template, g, w, h, nx, ny);
            if (s < best) {
              best = s;
              bx = nx;
              by = ny;
            }
          }
        }

        px = bx;
        py = by;
        const conf = toConfidence(best);
        points.push({ t, x: (px / w) * 100, y: (py / h) * 100, c: conf });

        // Slowly adapt the template so lighting / rotation drift is tolerated
        const fresh = patchAt(g, w, h, px, py);
        for (let i = 0; i < template.length; i++) {
          template[i] = template[i] * 0.85 + fresh[i] * 0.15;
        }

        processed++;
        onProgress?.(Math.min(99, Math.round((processed / total) * 100)), conf);
      }
    };

    await run(1);
    await run(-1);

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
): { x: number; y: number; c?: number } | null => {
  if (!track || track.length === 0) return null;
  if (t <= track[0].t) return { x: track[0].x, y: track[0].y, c: track[0].c };
  const last = track[track.length - 1];
  if (t >= last.t) return { x: last.x, y: last.y, c: last.c };

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
  }));
