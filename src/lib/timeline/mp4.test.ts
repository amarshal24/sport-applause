import { test } from "node:test";
import assert from "node:assert/strict";
import { mp4Settings, mp4VideoOptions, prepareMp4 } from "./mp4";

test("timeline output uses MP4 with H.264 video and AAC audio", () => {
  assert.equal(mp4Settings.mimeType, "video/mp4");
  assert.equal(mp4Settings.extension, "mp4");
  assert.equal(mp4Settings.videoCodec, "avc");
  assert.equal(mp4Settings.audioCodec, "aac");
});

test("720p30 requests constrained Baseline level 3.1 rather than High profile", () => {
  assert.equal(mp4VideoOptions(1280, 720, 30).fullCodecString, "avc1.42e01f");
  assert.equal(mp4VideoOptions(1280, 720, 30).alpha, "discard");
});

test("AVC level accounts for frame rate as well as dimensions", () => {
  assert.equal(mp4VideoOptions(1920, 1080, 30).fullCodecString, "avc1.42e028");
  assert.equal(mp4VideoOptions(1920, 1080, 60).fullCodecString, "avc1.42e02a");
});

test("invalid or odd dimensions fail before encoder initialization", async () => {
  for (const size of [[1279, 720], [1280, 719], [0, 720]]) {
    await assert.rejects(prepareMp4(size[0], size[1], 30), /positive even/);
  }
});

test("native capability check uses the same constrained profile as export", async () => {
  await prepareMp4(1280, 720, 30, {
    audio: async () => true,
    video: async (_codec, options) => {
      assert.equal(options?.fullCodecString, "avc1.42e01f");
      return true;
    },
  });
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