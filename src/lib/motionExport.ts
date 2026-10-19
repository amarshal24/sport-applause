import { paintMotion, motionPalette, type MotionObject } from "./motionStudio";
import fixWebmDuration from "fix-webm-duration";

export async function exportMotion(file: File, objects: MotionObject[], signal: AbortSignal, progress: (p: number) => void, swishAt: number | null = null): Promise<Blob> {
  if (typeof MediaRecorder === "undefined") throw new Error("Export is unavailable in this browser.");
  const video = document.createElement("video"), url = URL.createObjectURL(file);
  let audio: AudioContext | null = null, stream: MediaStream | null = null, recorder: MediaRecorder | null = null, raf = 0;
  const palette = motionPalette();
  try {
    video.muted = true; video.playsInline = true; video.preload = "auto";
    await new Promise<void>((resolve, reject) => {
      const abort = () => reject(new DOMException("Cancelled", "AbortError"));
      signal.addEventListener("abort", abort, { once: true });
      video.onloadeddata = () => { signal.removeEventListener("abort", abort); resolve(); };
      video.onerror = () => { signal.removeEventListener("abort", abort); reject(new Error("Cannot decode this video")); };
      video.src = url;
    });
    if (signal.aborted) throw new DOMException("Cancelled", "AbortError");
    if (!Number.isFinite(video.duration) || video.duration <= 0) throw new Error("Video duration is unavailable");
    const canvas = document.createElement("canvas");
    const scale = Math.min(1, 1280 / Math.max(video.videoWidth, video.videoHeight));
    canvas.width = Math.round(video.videoWidth * scale); canvas.height = Math.round(video.videoHeight * scale);
    const ctx = canvas.getContext("2d"); if (!ctx) throw new Error("Canvas export unavailable");
    audio = new AudioContext(); await audio.resume();
    const destination = audio.createMediaStreamDestination();
    const source = audio.createMediaElementSource(video); source.connect(destination); video.muted = false;
    stream = canvas.captureStream(30); destination.stream.getAudioTracks().forEach(track => stream?.addTrack(track));
    const mime = ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/mp4", "video/webm"].find(m => MediaRecorder.isTypeSupported(m));
    if (!mime) throw new Error("No supported video export format on this device");
    recorder = new MediaRecorder(stream, { mimeType: mime });
    const chunks: Blob[] = []; let swished = false;
    const output = new Promise<Blob>((resolve, reject) => {
      const abort = () => { if (recorder?.state !== "inactive") recorder?.stop(); reject(new DOMException("Cancelled", "AbortError")); };
      signal.addEventListener("abort", abort, { once: true });
      if (!recorder) return reject(new Error("Recorder unavailable"));
      recorder.ondataavailable = e => { if (e.data.size) chunks.push(e.data); };
      recorder.onerror = () => { signal.removeEventListener("abort", abort); reject(new Error("Video export failed")); };
      recorder.onstop = () => { signal.removeEventListener("abort", abort); resolve(new Blob(chunks, { type: mime.split(";")[0] })); };
      const draw = () => {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height); paintMotion(ctx, canvas.width, canvas.height, video.currentTime, objects, palette);
        if (swishAt !== null && !swished && video.currentTime >= swishAt && audio) {
          swished = true;
          const length = Math.floor(audio.sampleRate * 0.3), buffer = audio.createBuffer(1, length, audio.sampleRate);
          const data = buffer.getChannelData(0); for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * Math.sin(i / length * Math.PI) * 0.25;
          const noise = audio.createBufferSource(); noise.buffer = buffer; noise.connect(destination); noise.start();
        }
        progress(Math.min(99, Math.round(video.currentTime / video.duration * 100)));
        if (video.ended) { if (recorder?.state === "recording") recorder.stop(); return; }
        raf = requestAnimationFrame(draw);
      };
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height); recorder.start(200);
      video.play().then(draw).catch(reject);
    });
    const blob = await output;
    const fixed = blob.type.includes("webm") ? await fixWebmDuration(blob, video.duration * 1000, { logger: false }) : blob;
    progress(100); return fixed;
  } finally {
    cancelAnimationFrame(raf); video.pause(); if (recorder && recorder.state !== "inactive") recorder.stop();
    stream?.getTracks().forEach(t => t.stop()); await audio?.close(); video.removeAttribute("src"); video.load(); URL.revokeObjectURL(url);
  }
}