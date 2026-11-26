import {
  Output, Mp4OutputFormat, BufferTarget, CanvasSource, AudioBufferSource,
  Input, BlobSource, ALL_FORMATS, CanvasSink, AudioBufferSink,
} from "mediabunny";
import { motionPalette, type MotionObject } from "./motionStudio";
import { addSwish, exportSize, renderMotionFrames } from "./motionRender";
import { mp4Settings, mp4VideoOptions, prepareMp4 } from "./timeline/mp4";

/** Thrown when this device cannot do exact-frame export; callers may fall back to real-time capture. */
export class ExactExportUnavailable extends Error {}

/**
 * Decodes every source frame in presentation order, paints the effect at that frame's own
 * timestamp and encodes it at the same timestamp (H.264/AAC MP4). Not real-time capture.
 */
export async function exportMotionExact(
  file: File | Blob, objects: MotionObject[], signal: AbortSignal,
  progress: (p: number) => void, swishAt: number | null = null,
): Promise<Blob> {
  const input = new Input({ source: new BlobSource(file), formats: ALL_FORMATS });
  const target = new BufferTarget();
  let output: Output | undefined;
  try {
    const track = await input.getPrimaryVideoTrack();
    if (!track) throw new ExactExportUnavailable("No video track found.");
    const duration = await input.computeDuration();
    const stats = await track.computePacketStats(300);
    const fps = Number.isFinite(stats.averagePacketRate) && stats.averagePacketRate > 0 ? Math.min(120, stats.averagePacketRate) : 30;
    const { width, height } = exportSize(track.displayWidth, track.displayHeight);
    if (!(await prepareMp4(width, height, fps))) throw new ExactExportUnavailable("This browser cannot encode H.264 video.");

    const canvas = document.createElement("canvas"); canvas.width = width; canvas.height = height;
    const ctx = canvas.getContext("2d"); if (!ctx) throw new ExactExportUnavailable("Canvas unavailable.");
    output = new Output({ format: new Mp4OutputFormat({ fastStart: "in-memory" }), target });
    const video = new CanvasSource(canvas, mp4VideoOptions(width, height, fps));
    output.addVideoTrack(video, { frameRate: fps });
    const audioTrack = await input.getPrimaryAudioTrack();
    const audio = audioTrack ? new AudioBufferSource({ codec: mp4Settings.audioCodec, bitrate: mp4Settings.audioBitrate }) : null;
    if (audio) output.addAudioTrack(audio);
    await output.start();

    if (audio && audioTrack) {
      const pieces: { timestamp: number; buffer: AudioBuffer }[] = [];
      for await (const part of new AudioBufferSink(audioTrack).buffers()) {
        if (signal.aborted) throw new DOMException("Cancelled", "AbortError");
        pieces.push(part);
      }
      if (pieces.length) {
        const rate = pieces[0].buffer.sampleRate, channels = pieces[0].buffer.numberOfChannels;
        const mixed = new AudioBuffer({ length: Math.ceil(duration * rate), numberOfChannels: channels, sampleRate: rate });
        for (const part of pieces) {
          const at = Math.max(0, Math.round(part.timestamp * rate));
          for (let ch = 0; ch < channels; ch++) {
            const dst = mixed.getChannelData(ch);
            if (at < dst.length) dst.set(part.buffer.getChannelData(ch).subarray(0, dst.length - at), at);
          }
        }
        if (swishAt !== null) addSwish(Array.from({ length: channels }, (_, ch) => mixed.getChannelData(ch)), rate, swishAt);
        await audio.add(mixed);
      }
      audio.close();
    }

    const sink = new CanvasSink(track);
    await renderMotionFrames({
      frames: sink.canvases(), ctx, width, height, objects, palette: motionPalette(),
      sink: { add: (t, d) => video.add(t, d) }, signal,
      onFrame: frame => progress(Math.min(99, Math.round((frame.timestamp / Math.max(duration, 0.001)) * 100))),
    });
    video.close();
    await output.finalize();
    if (!target.buffer) throw new Error("Export produced no file");
    progress(100);
    return new Blob([target.buffer], { type: mp4Settings.mimeType });
  } catch (e) {
    await output?.cancel().catch(() => undefined);
    throw e;
  } finally {
    input.dispose();
  }
}
