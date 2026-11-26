import { readFileSync } from "node:fs";
import { trackFrames } from "../../src/lib/objectTracker";
const [,, file, W, H, startT, sx, sy, gtJson] = process.argv;
const w = +W, h = +H, raw = readFileSync(file), n = raw.length / (w * h);
const gt: [number, number, number][] = JSON.parse(gtJson); // [t, x%, y%]
const grab = async (t: number) => { const i = Math.min(n - 1, Math.max(0, Math.round(t * 24))); const f = new Float32Array(w * h); const o = i * w * h; for (let k = 0; k < f.length; k++) f[k] = raw[o + k]; return f; };
const pts = await trackFrames(grab, { w, h, duration: n / 24, startTime: +startT, x: +sx, y: +sy });
const at = (t: number) => pts.reduce((b, p) => Math.abs(p.t - t) < Math.abs(b.t - t) ? p : b);
let ok = 0, ok2 = 0;
for (const [t, gx, gy] of gt) {
  const p = at(t), dx = (p.x - gx) * w / 100, dy = (p.y - gy) * h / 100, err = Math.hypot(dx, dy);
  const R = 0.165 * w; // ball radius on screen (~33% of frame width)
  const hit = err <= R; const tight = err <= R / 2; if (hit) ok++; if (tight) ok2++;
  console.log(`t=${t.toFixed(1)} gt=(${gx.toFixed(0)},${gy.toFixed(0)}) trk=(${p.x.toFixed(0)},${p.y.toFixed(0)}) err=${err.toFixed(1)}px conf=${(p.c ?? 0).toFixed(2)} ${tight ? "LOCKED" : hit ? "on-ball" : "MISS"}`);
}
const jumps = pts.slice(1).map((p, i) => Math.hypot((p.x - pts[i].x) * w / 100, (p.y - pts[i].y) * h / 100));
console.log(`frames=${pts.length} onBall=${ok}/${gt.length} locked(<R/2)=${ok2}/${gt.length} maxJump=${Math.max(...jumps).toFixed(1)}px lowConf(<0.3)=${pts.filter(p => (p.c ?? 0) < 0.3).length}`);
