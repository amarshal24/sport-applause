import { test } from "node:test";
import assert from "node:assert/strict";
const expect = (actual: unknown) => ({
  toBe: (expected: unknown) => assert.equal(actual, expected),
  toEqual: (expected: unknown) => assert.deepEqual(actual, expected),
  toMatchObject: (expected: unknown) => {
    for (const [key, value] of Object.entries(
      expected as Record<string, unknown>,
    ))
      assert.equal((actual as Record<string, unknown>)[key], value);
  },
  toHaveLength: (length: number) =>
    assert.equal((actual as unknown[]).length, length),
});
import {
  newProject,
  newClip,
  frameAt,
  sampleTransform,
  addKey,
  splitClip,
  volumeAt,
  mediaSchema,
  activeClip,
  moveClip,
} from "./model";
test("frame accurate scrubbing uses integer frame grid", () => {
  expect(frameAt(1.05, 30)).toBe(32);
});
test("keyframes interpolate position scale rotation opacity and intensity", () => {
  const p = newProject(),
    c = newClip(p.tracks[0], 0, 90, "clip");
  c.keys = [
    { frame: 0, x: 0, y: 10, scale: 1, rotation: 0, opacity: 0, intensity: 0 },
    {
      frame: 60,
      x: 100,
      y: 90,
      scale: 3,
      rotation: 180,
      opacity: 1,
      intensity: 1,
    },
  ];
  expect(sampleTransform(c, 30)).toMatchObject({
    x: 50,
    y: 50,
    scale: 2,
    rotation: 90,
    opacity: 0.5,
    intensity: 0.5,
  });
});
test("same frame key replaces previous animation state", () => {
  const p = newProject(),
    c = newClip(p.tracks[0], 0, 90, "clip");
  c.keys = addKey(c, 30);
  c.transform.x = 80;
  c.keys = addKey(c, 30);
  expect(c.keys).toHaveLength(1);
  expect(c.keys[0].x).toBe(80);
});
test("split preserves source time and duration", () => {
  const p = newProject(),
    c = newClip(p.tracks[0], 30, 90, "clip");
  c.offset = 15;
  const parts = splitClip(c, 60);
  expect(parts.map((c) => [c.start, c.duration, c.offset])).toEqual([
    [30, 30, 15],
    [60, 60, 45],
  ]);
});
test("clip ranges do not overlap at end boundary", () => {
  const p = newProject(),
    c = newClip(p.tracks[0], 30, 60, "clip");
  expect(activeClip(c, 89)).toBe(true);
  expect(activeClip(c, 90)).toBe(false);
});
test("ducking reduces music to quarter under voiceover", () => {
  const p = newProject(),
    c = newClip(p.tracks[1], 0, 90, "music");
  c.duck = true;
  expect(volumeAt(c, 30, true)).toBe(0.25);
  expect(volumeAt(c, 30, false)).toBe(1);
});
test("audio fade ramps independently", () => {
  const p = newProject(),
    c = newClip(p.tracks[1], 0, 90, "music");
  c.fadeIn = 30;
  c.fadeOut = 30;
  expect(volumeAt(c, 15, false)).toBe(0.5);
  expect(volumeAt(c, 75, false)).toBe(0.5);
});
test("video 100MB and personal audio 20MB retained", () => {
  expect(
    mediaSchema.safeParse({ type: "video/webm", size: 100 * 1024 * 1024 })
      .success,
  ).toBe(true);
  expect(
    mediaSchema.safeParse({ type: "video/webm", size: 100 * 1024 * 1024 + 1 })
      .success,
  ).toBe(false);
  expect(
    mediaSchema.safeParse({ type: "audio/wav", size: 20 * 1024 * 1024 + 1 })
      .success,
  ).toBe(false);
});
test("dragging clips cannot move before timeline origin", () => {
  const p = newProject(),
    c = newClip(p.tracks[0], 30, 60, "clip");
  expect(moveClip(c, c.trackId, -4).start).toBe(0);
});
