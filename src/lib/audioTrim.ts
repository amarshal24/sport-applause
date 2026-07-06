// Client-side audio trimming + fade rendering. Outputs a WAV Blob.
export async function trimAudioToWav(
  file: File | Blob,
  startSec: number,
  endSec: number,
  fadeIn = 0,
  fadeOut = 0,
): Promise<Blob> {
  const arrayBuf = await file.arrayBuffer();
  const decodeCtx = new AudioContext();
  const decoded = await decodeCtx.decodeAudioData(arrayBuf.slice(0));
  decodeCtx.close();

  const start = Math.max(0, Math.min(startSec, decoded.duration));
  const end = Math.max(start + 0.05, Math.min(endSec, decoded.duration));
  const duration = end - start;
  const sampleRate = decoded.sampleRate;
  const channels = decoded.numberOfChannels;
  const frameCount = Math.floor(duration * sampleRate);

  const offline = new OfflineAudioContext(channels, frameCount, sampleRate);
  const src = offline.createBufferSource();
  src.buffer = decoded;
  const gain = offline.createGain();
  const now = 0;
  gain.gain.setValueAtTime(fadeIn > 0 ? 0.0001 : 1, now);
  if (fadeIn > 0) gain.gain.linearRampToValueAtTime(1, now + Math.min(fadeIn, duration));
  if (fadeOut > 0) {
    const fo = Math.min(fadeOut, duration);
    gain.gain.setValueAtTime(1, now + Math.max(0, duration - fo));
    gain.gain.linearRampToValueAtTime(0.0001, now + duration);
  }
  src.connect(gain).connect(offline.destination);
  src.start(0, start, duration);
  const rendered = await offline.startRendering();
  return bufferToWav(rendered);
}

function bufferToWav(buffer: AudioBuffer): Blob {
  const numCh = buffer.numberOfChannels;
  const sr = buffer.sampleRate;
  const samples = buffer.length;
  const bytesPerSample = 2;
  const blockAlign = numCh * bytesPerSample;
  const dataSize = samples * blockAlign;
  const ab = new ArrayBuffer(44 + dataSize);
  const view = new DataView(ab);
  const writeStr = (o: number, s: string) => { for (let i = 0; i < s.length; i++) view.setUint8(o + i, s.charCodeAt(i)); };
  writeStr(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeStr(8, "WAVE");
  writeStr(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numCh, true);
  view.setUint32(24, sr, true);
  view.setUint32(28, sr * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true);
  writeStr(36, "data");
  view.setUint32(40, dataSize, true);

  const chans: Float32Array[] = [];
  for (let c = 0; c < numCh; c++) chans.push(buffer.getChannelData(c));
  let offset = 44;
  for (let i = 0; i < samples; i++) {
    for (let c = 0; c < numCh; c++) {
      let s = Math.max(-1, Math.min(1, chans[c][i]));
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
      offset += 2;
    }
  }
  return new Blob([ab], { type: "audio/wav" });
}
