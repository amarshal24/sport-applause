import {
  activeClip,
  endFrame,
  volumeAt,
  type Project,
  type Clip,
} from "./model";
import { TimelineMedia } from "./media";
export async function mixAudio(
  p: Project,
  media: TimelineMedia,
): Promise<AudioBuffer> {
  const sr = 48000,
    total = endFrame(p) / p.fps,
    out = new AudioBuffer({
      length: Math.ceil(total * sr),
      numberOfChannels: 2,
      sampleRate: sr,
    });
  const clips = p.clips.filter(
    (c) =>
      !c.muted &&
      !p.tracks.find((t) => t.id === c.trackId)?.muted &&
      c.assetId &&
      ["audio", "video"].includes(
        p.tracks.find((t) => t.id === c.trackId)?.kind ?? "",
      ),
  );
  const voice = clips.filter((c) => c.name.toLowerCase().includes("voiceover"));
  for (const c of clips) {
    const a = p.assets.find((a) => a.id === c.assetId);
    if (!a) continue;
    const buffer = await media.sound(a);
    if (!buffer) continue;
    let peak = 0;
    for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
      const data = buffer.getChannelData(ch);
      for (let i = 0; i < data.length; i++)
        peak = Math.max(peak, Math.abs(data[i]));
    }
    const boost = c.normalize && peak > 0 ? 0.9 / peak : 1;
    for (let ch = 0; ch < 2; ch++) {
      const src = buffer.getChannelData(
          Math.min(ch, buffer.numberOfChannels - 1),
        ),
        dst = out.getChannelData(ch);
      let prior = 0;
      const begin = Math.round((c.start / p.fps) * sr),
        length = Math.round((c.duration / p.fps) * sr);
      for (let i = 0; i < length && begin + i < dst.length; i++) {
        const pos = Math.floor((c.offset / p.fps + i / sr) * buffer.sampleRate);
        if (pos >= src.length) break;
        let value = src[pos] * boost;
        if (c.denoise) {
          const high = value - prior * 0.95;
          prior = value;
          value = Math.abs(high) < 0.012 ? 0 : high;
        }
        const localFrame = (i / sr) * p.fps;
        const duck = voice.some(
          (v) => v.id !== c.id && activeClip(v, c.start + localFrame),
        );
        dst[begin + i] += value * volumeAt(c, localFrame, duck);
      }
    }
  }
  for (let ch = 0; ch < 2; ch++) {
    const data = out.getChannelData(ch);
    for (let i = 0; i < data.length; i++)
      data[i] = Math.max(-1, Math.min(1, data[i]));
  }
  return out;
}
export function audioWav(b: AudioBuffer): Blob {
  const channels = b.numberOfChannels,
    bytes = 44 + b.length * channels * 2,
    data = new ArrayBuffer(bytes),
    v = new DataView(data);
  const text = (at: number, s: string) =>
    [...s].forEach((c, i) => v.setUint8(at + i, c.charCodeAt(0)));
  text(0, "RIFF");
  v.setUint32(4, bytes - 8, true);
  text(8, "WAVE");
  text(12, "fmt ");
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true);
  v.setUint16(22, channels, true);
  v.setUint32(24, b.sampleRate, true);
  v.setUint32(28, b.sampleRate * channels * 2, true);
  v.setUint16(32, channels * 2, true);
  v.setUint16(34, 16, true);
  text(36, "data");
  v.setUint32(40, bytes - 44, true);
  for (let i = 0; i < b.length; i++)
    for (let ch = 0; ch < channels; ch++)
      v.setInt16(
        44 + (i * channels + ch) * 2,
        Math.round(Math.max(-1, Math.min(1, b.getChannelData(ch)[i])) * 32767),
        true,
      );
  return new Blob([data], { type: "audio/wav" });
}
