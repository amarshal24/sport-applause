import { test } from "node:test";
import assert from "node:assert/strict";
import { trackFrames } from "./objectTracker";
// Synthetic sanity test only. It proves the decoder-independent core runs; it is NOT evidence of real-footage accuracy.
const W = 96, H = 64;
const frame = (cx: number, cy: number) => { const g = new Float32Array(W * H).fill(40); for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const d = Math.hypot(x - cx, y - cy); if (d < 6) g[y * W + x] = 220 - d * 8; } return g; };
test("trackFrames follows a bright blob moving at constant speed", async () => {
  const grab = async (t: number) => frame(20 + t * 24 * 1.5, 30);
  const pts = await trackFrames(grab, { w: W, h: H, duration: 1.5, startTime: 0, x: (20 / W) * 100, y: (30 / H) * 100, forwardOnly: true });
  const last = pts[pts.length - 1], wantX = (20 + last.t * 24 * 1.5) / W * 100;
  assert.ok(pts.length > 30);
  assert.ok(Math.abs(last.x - wantX) < 4, `x ${last.x} vs ${wantX}`);
});
