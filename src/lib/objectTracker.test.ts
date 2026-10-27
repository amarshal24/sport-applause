import { test } from "node:test";
import assert from "node:assert/strict";
import { smoothTrack } from "./objectTracker";
test("smoothing does not make the effect trail behind a moving athlete", () => {
  const path = Array.from({ length: 41 }, (_, i) => ({ t: i / 24, x: i * 2, y: 50, c: 1 }));
  const mid = smoothTrack(path, 0.3)![20];
  assert.ok(Math.abs(mid.x - 40) < 0.5, `lag ${40 - mid.x}`);
});
