import { test } from "node:test";
import assert from "node:assert/strict";
import { addSwish, exportSize, renderMotionFrames, type DecodedFrame } from "./motionRender";
import { paintMotion, motionSample, type MotionObject, type MotionPalette } from "./motionStudio";

const palette: MotionPalette = { flame: "#f60", core: "#fc0", electric: "#0cf", trail: "#a0f" };
const recorder = () => {
  const log: string[] = [];
  const ctx = new Proxy({}, {
    get: (_t, k) => (...a: unknown[]) => { log.push(`${String(k)}(${JSON.stringify(a.map(x => (typeof x === "number" ? +x.toFixed(6) : typeof x === "object" ? "obj" : x)))})`); },
    set: (_t, k, v) => { log.push(`${String(k)}=${typeof v === "number" ? +v.toFixed(6) : v}`); return true; },
  }) as unknown as CanvasRenderingContext2D;
  return { ctx, log };
};
// Moving ball: x = 10*t %, y = 40 + 5*t %
const track = Array.from({ length: 61 }, (_, i) => ({ t: i / 24, x: i * 10 / 24, y: 40 + i * 5 / 24, c: 1, s: 1 }));
const ball = (effect: MotionObject["effect"]): MotionObject => ({ id: "a", label: "ball", effect, x: 0, y: 40, size: 8, start: 0, end: 2.5, intensity: 0.8, track, corrections: [] });
// Variable-frame-rate timestamps: the case where wall-clock capture and real frames disagree.
const stamps = [0, 1 / 30, 2 / 30, 0.1 + 0.017, 0.2, 0.2 + 1 / 60, 0.5, 1.01, 2.4];
async function* frames(ts = stamps): AsyncGenerator<DecodedFrame> {
  for (let i = 0; i < ts.length; i++) yield { canvas: {} as CanvasImageSource, timestamp: ts[i], duration: (ts[i + 1] ?? ts[i] + 1 / 30) - ts[i] };
}
const sinkLog = () => { const added: [number, number][] = []; return { added, sink: { add: async (t: number, d: number) => { added.push([t, d]); } } }; };

test("every frame is encoded at its own source timestamp, in order, none dropped", async () => {
  const { ctx } = recorder(), { added, sink } = sinkLog();
  const r = await renderMotionFrames({ frames: frames(), ctx, width: 640, height: 360, objects: [ball("flame")], palette, sink });
  assert.equal(r.frames, stamps.length);
  assert.deepEqual(added.map(a => a[0]), stamps);
  assert.ok(Math.abs(r.lastEnd - (2.4 + 1 / 30)) < 1e-9);
});

for (const effect of ["flame", "electric", "trail"] as const) {
  test(`${effect}: export paints exactly what the preview paints at the same frame time`, async () => {
    const exported = recorder(), { sink } = sinkLog();
    await renderMotionFrames({ frames: frames(), ctx: exported.ctx, width: 640, height: 360, objects: [ball(effect)], palette, sink });
    const preview = recorder();
    for (const t of stamps) { preview.ctx.clearRect(0, 0, 640, 360); preview.ctx.drawImage({} as CanvasImageSource, 0, 0, 640, 360); paintMotion(preview.ctx, 640, 360, t, [ball(effect)], palette); }
    assert.deepEqual(exported.log, preview.log);
  });
}

test("rendering is deterministic: two exports of the same project are identical", async () => {
  const a = recorder(), b = recorder();
  for (const r of [a, b]) await renderMotionFrames({ frames: frames(), ctx: r.ctx, width: 640, height: 360, objects: [ball("flame")], palette, sink: sinkLog().sink });
  assert.deepEqual(a.log, b.log);
});

test("effect position follows the track at each frame's timestamp (no lag, no lead)", () => {
  const o = ball("trail");
  for (const t of [0.1 + 0.017, 1.01]) {
    const p = motionSample(o, t)!;
    assert.ok(Math.abs(p.x - 10 * t) < 1e-6 && Math.abs(p.y - (40 + 5 * t)) < 1e-6, `at ${t}: ${p.x},${p.y}`);
  }
});

test("a frame outside the effect range paints no effect", async () => {
  const o = { ...ball("flame"), start: 1, end: 2 }, r = recorder();
  await renderMotionFrames({ frames: frames([0.2, 0.5]), ctx: r.ctx, width: 640, height: 360, objects: [o], palette, sink: sinkLog().sink });
  assert.ok(!r.log.some(l => l.startsWith("ellipse")));
});

test("cancelling stops the render with AbortError", async () => {
  const c = new AbortController(), { sink } = sinkLog();
  await assert.rejects(renderMotionFrames({ frames: frames(), ctx: recorder().ctx, width: 64, height: 64, objects: [], palette, sink: { add: async () => { c.abort(); } }, signal: c.signal }), (e: Error) => e.name === "AbortError");
});

test("swish audio is deterministic, placed at the requested time, and stays in bounds", () => {
  const make = () => [new Float32Array(48000), new Float32Array(48000)];
  const a = make(), b = make();
  addSwish(a, 48000, 0.5); addSwish(b, 48000, 0.5);
  assert.deepEqual(a[0], b[0]);
  assert.equal(a[0][23999], 0);
  assert.ok(a[0].slice(24000, 38400).some(v => v !== 0));
  assert.equal(a[0][38400], 0);
  const edge = [new Float32Array(100)]; addSwish(edge, 48000, 0.001); assert.equal(edge[0].length, 100);
});

test("export size keeps aspect ratio, caps the long side, and is even for H.264", () => {
  assert.deepEqual(exportSize(1920, 1080), { width: 1280, height: 720 });
  assert.deepEqual(exportSize(1080, 1920), { width: 720, height: 1280 });
  const odd = exportSize(1001, 563, 1000);
  assert.ok(odd.width % 2 === 0 && odd.height % 2 === 0);
  assert.deepEqual(exportSize(640, 360), { width: 640, height: 360 });
});
