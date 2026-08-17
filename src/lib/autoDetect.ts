// ============================================================
// Auto-detection of movers in a clip.
// Samples a handful of frames, diffs them to find what actually
// moves (ball, player, etc.) and clusters the motion into a few
// candidate targets the user can one-tap into FX pins.
// Pure client-side, no ML, no network.
// ============================================================

export interface DetectedTarget {
  /** 0-100 % of the frame */
  x: number;
  y: number;
  /** Rough blob width as % of frame width */
  size: number;
  /** 0-1 motion strength */
  score: number;
  /** Small fast blob => object, tall/large blob => person */
  kind: "object" | "character";
}

const WORK_W = 160;
const SAMPLES = 6;
const GRID = 16; // cluster cell size in work px

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
    setTimeout(finish, 400);
  });

const gray = (d: Uint8ClampedArray, n: number) => {
  const g = new Float32Array(n);
  for (let i = 0, p = 0; i < n; i++, p += 4) {
    g[i] = 0.299 * d[p] + 0.587 * d[p + 1] + 0.114 * d[p + 2];
  }
  return g;
};

export interface DetectOptions {
  /** Where in the clip to focus the scan (seconds). */
  around?: number;
  max?: number;
  onProgress?: (pct: number) => void;
  signal?: AbortSignal;
}

/**
 * Scans the clip and returns the strongest movers, best first.
 */
export const detectTargets = async (
  source: string | File | Blob,
  { around, max = 4, onProgress, signal }: DetectOptions = {}
): Promise<DetectedTarget[]> => {
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
      video.onerror = () => reject(new Error("Could not read the clip."));
      setTimeout(() => reject(new Error("Auto-detect timed out loading the clip.")), 15000);
    });

    const duration = isFinite(video.duration) ? video.duration : 0;
    if (!duration) throw new Error("Clip length is unknown.");

    const vw = video.videoWidth || 720;
    const vh = video.videoHeight || 1280;
    const w = Math.min(WORK_W, vw);
    const h = Math.max(2, Math.round((vh / vw) * w));

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) throw new Error("Auto-detect is not supported on this device.");

    // Sample a short window around the playhead (or the whole clip).
    const span = Math.min(duration, 2.5);
    const start = Math.max(0, Math.min((around ?? duration / 2) - span / 2, duration - span));
    const step = span / (SAMPLES - 1 || 1);

    const frames: Float32Array[] = [];
    for (let i = 0; i < SAMPLES; i++) {
      if (signal?.aborted) return [];
      // eslint-disable-next-line no-await-in-loop
      await seekTo(video, start + i * step);
      ctx.drawImage(video, 0, 0, w, h);
      frames.push(gray(ctx.getImageData(0, 0, w, h).data, w * h));
      onProgress?.(Math.round(((i + 1) / (SAMPLES + 1)) * 100));
    }

    // Accumulate absolute frame-to-frame difference.
    const motion = new Float32Array(w * h);
    for (let f = 1; f < frames.length; f++) {
      const a = frames[f - 1];
      const b = frames[f];
      for (let i = 0; i < motion.length; i++) motion[i] += Math.abs(b[i] - a[i]);
    }

    let peak = 0;
    for (let i = 0; i < motion.length; i++) if (motion[i] > peak) peak = motion[i];
    if (peak < 12) return []; // static clip

    const threshold = peak * 0.35;

    // Cluster the hot pixels into a coarse grid.
    const cols = Math.ceil(w / GRID);
    const rows = Math.ceil(h / GRID);
    const cells = new Array(cols * rows).fill(0).map(() => ({
      sum: 0,
      n: 0,
      sx: 0,
      sy: 0,
      minX: w,
      maxX: 0,
      minY: h,
      maxY: 0,
    }));

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const v = motion[y * w + x];
        if (v < threshold) continue;
        const c = cells[Math.floor(y / GRID) * cols + Math.floor(x / GRID)];
        c.sum += v;
        c.n++;
        c.sx += x;
        c.sy += y;
        if (x < c.minX) c.minX = x;
        if (x > c.maxX) c.maxX = x;
        if (y < c.minY) c.minY = y;
        if (y > c.maxY) c.maxY = y;
      }
    }

    const candidates = cells
      .filter((c) => c.n >= 6)
      .map((c) => {
        const bw = (c.maxX - c.minX + 1) / w;
        const bh = (c.maxY - c.minY + 1) / h;
        const tall = bh > bw * 1.4;
        const big = bh > 0.22;
        return {
          x: (c.sx / c.n / w) * 100,
          y: (c.sy / c.n / h) * 100,
          size: bw * 100,
          score: Math.max(0, Math.min(1, c.sum / c.n / peak)),
          kind: (tall || big ? "character" : "object") as DetectedTarget["kind"],
        };
      })
      .sort((a, b) => b.score - a.score);

    // Drop near-duplicates that sit on top of each other.
    const out: DetectedTarget[] = [];
    for (const c of candidates) {
      if (out.some((o) => Math.hypot(o.x - c.x, o.y - c.y) < 12)) continue;
      out.push(c);
      if (out.length >= max) break;
    }

    onProgress?.(100);
    return out;
  } finally {
    cleanup();
  }
};
