import { canEncodeAudio, canEncodeVideo } from "mediabunny";

export const mp4Settings = {
  mimeType: "video/mp4",
  extension: "mp4",
  videoCodec: "avc",
  audioCodec: "aac",
  audioBitrate: 128000,
  sampleRate: 48000,
  numberOfChannels: 2,
} as const;

// Constrained Baseline avoids the automatic High-profile selection and B-frames.
export function mp4VideoOptions(width: number, height: number, frameRate: number) {
  if (![width, height].every((n) => Number.isInteger(n) && n > 0 && n % 2 === 0) ||
      !Number.isFinite(frameRate) || frameRate <= 0) {
    throw new Error("MP4 requires positive even video dimensions and a valid frame rate.");
  }
  const blocks = Math.ceil(width / 16) * Math.ceil(height / 16);
  const level = [
    { id: 31, frame: 3600, second: 108000 },
    { id: 40, frame: 8192, second: 245760 },
    { id: 42, frame: 8704, second: 522240 },
    { id: 51, frame: 36864, second: 983040 },
    { id: 52, frame: 36864, second: 2073600 },
  ].find((limit) => blocks <= limit.frame && blocks * frameRate <= limit.second);
  if (!level) throw new Error("Video resolution or frame rate exceeds MP4 export limits.");
  return {
    codec: mp4Settings.videoCodec,
    bitrate: 4_000_000,
    fullCodecString: `avc1.42e0${level.id.toString(16)}`,
    alpha: "discard" as const,
    keyFrameInterval: 1,
  };
}

export async function prepareMp4(
  width: number,
  height: number,
  frameRate: number,
  support = { audio: canEncodeAudio, video: canEncodeVideo },
  register = async () => {
    const { registerAacEncoder } = await import("@mediabunny/aac-encoder");
    registerAacEncoder();
  },
) {
  const videoOptions = mp4VideoOptions(width, height, frameRate);
  const audioOptions = {
    sampleRate: mp4Settings.sampleRate,
    numberOfChannels: mp4Settings.numberOfChannels,
    bitrate: mp4Settings.audioBitrate,
  };
  if (!(await support.audio("aac", audioOptions))) await register();
  if (!(await support.audio("aac", audioOptions)))
    throw new Error("MP4 audio encoding is unavailable. Please retry in a recent browser.");
  return support.video("avc", { width, height, frameRate, ...videoOptions });
}