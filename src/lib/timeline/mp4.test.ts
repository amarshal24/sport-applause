import { test } from "node:test";
import assert from "node:assert/strict";
import { mp4Settings, prepareMp4 } from "./mp4";

test("timeline output uses MP4 with H.264 video and AAC audio", () => {
  assert.equal(mp4Settings.mimeType, "video/mp4");
  assert.equal(mp4Settings.extension, "mp4");
  assert.equal(mp4Settings.videoCodec, "avc");
  assert.equal(mp4Settings.audioCodec, "aac");
});

test("missing browser AAC registers an encoder and missing H.264 selects software", async () => {
  let registered = false;
  const native = await prepareMp4(1280, 720, 30, {
    audio: async () => registered,
    video: async () => false,
  }, async () => { registered = true; });
  assert.equal(registered, true);
  assert.equal(native, false);
});

test("native MP4 codecs do not load fallback encoders", async () => {
  const native = await prepareMp4(1280, 720, 30, {
    audio: async () => true,
    video: async () => true,
  }, async () => { assert.fail("unneeded software encoder"); });
  assert.equal(native, true);
});

test("unavailable AAC fails rather than silently exporting incompatible audio", async () => {
  await assert.rejects(prepareMp4(1280, 720, 30, {
    audio: async () => false,
    video: async () => true,
  }, async () => {}), /MP4 audio encoding is unavailable/);
});