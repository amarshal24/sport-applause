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
  const audioOptions = {
    sampleRate: mp4Settings.sampleRate,
    numberOfChannels: mp4Settings.numberOfChannels,
    bitrate: mp4Settings.audioBitrate,
  };
  if (!(await support.audio("aac", audioOptions))) await register();
  if (!(await support.audio("aac", audioOptions)))
    throw new Error("MP4 audio encoding is unavailable. Please retry in a recent browser.");
  return support.video("avc", { width, height, frameRate, bitrate: 4_000_000 });
}