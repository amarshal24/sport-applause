// Client-side video trim + optional square crop.
// Re-encodes by playing the source clip into a canvas and recording the canvas stream.
export interface TrimOptions {
  start: number;
  end: number;
  square?: boolean;
  /** Crop shape (overrides `square`): width/height ratio, e.g. 1, 9/16, 16/9. */
  aspect?: number;
  /** Text burned into the bottom of every frame. */
  caption?: string;
  withAudio?: boolean;
  onProgress?: (pct: number) => void;
}

export const trimVideo = (blob: Blob, { start, end, square, aspect, caption, withAudio, onProgress }: TrimOptions): Promise<Blob> =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const video = document.createElement("video");
    video.src = url;
    video.muted = !withAudio;
    video.playsInline = true;

    const cleanup = () => URL.revokeObjectURL(url);

    video.onerror = () => {
      cleanup();
      reject(new Error("Could not read the recorded video."));
    };

    video.onloadedmetadata = () => {
      const duration = isFinite(video.duration) ? video.duration : end;
      const from = Math.max(0, Math.min(start, duration));
      const to = Math.max(from + 0.2, Math.min(end, duration));

      const vw = video.videoWidth || 720;
      const vh = video.videoHeight || 1280;
      const ratio = aspect ?? (square ? 1 : vw / vh);
      let cw = vw, ch = vh;
      if (vw / vh > ratio) cw = Math.round(vh * ratio); else ch = Math.round(vw / ratio);
      const canvas = document.createElement("canvas");
      canvas.width = cw;
      canvas.height = ch;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        cleanup();
        reject(new Error("Canvas not supported on this device."));
        return;
      }

      const sx = (vw - cw) / 2;
      const sy = (vh - ch) / 2;
      const drawCaption = () => {
        const text = caption?.trim();
        if (!text) return;
        const fs = Math.max(16, Math.round(cw * 0.055));
        ctx.font = `bold ${fs}px sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "bottom";
        const words = text.split(/\s+/);
        const lines: string[] = [];
        let line = "";
        for (const w of words) {
          const t = line ? `${line} ${w}` : w;
          if (ctx.measureText(t).width > cw * 0.9 && line) { lines.push(line); line = w; } else line = t;
        }
        if (line) lines.push(line);
        const lh = fs * 1.25;
        let y = ch - fs;
        ctx.lineWidth = Math.max(3, fs / 6);
        ctx.strokeStyle = "rgba(0,0,0,0.85)";
        ctx.fillStyle = "#fff";
        for (const l of lines.slice(-3).reverse()) {
          ctx.strokeText(l, cw / 2, y);
          ctx.fillText(l, cw / 2, y);
          y -= lh;
        }
      };

      const stream = canvas.captureStream(30);

      // Keep the original audio track when the clip was recorded with sound
      let audioCtx: AudioContext | null = null;
      if (withAudio) {
        try {
          const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
          audioCtx = new Ctx();
          const source = audioCtx.createMediaElementSource(video);
          const dest = audioCtx.createMediaStreamDestination();
          source.connect(dest);
          dest.stream.getAudioTracks().forEach((t) => stream.addTrack(t));
        } catch {
          audioCtx = null;
        }
      }
      const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
        ? "video/webm;codecs=vp9"
        : "video/webm";
      const recorder = new MediaRecorder(stream, { mimeType });
      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };
      recorder.onerror = () => {
        cleanup();
        reject(new Error("Trimming failed. Try again."));
      };
      recorder.onstop = () => {
        cleanup();
        audioCtx?.close().catch(() => {});
        onProgress?.(100);
        resolve(new Blob(chunks, { type: "video/webm" }));
      };

      let raf = 0;
      const draw = () => {
        if (video.currentTime >= to || video.ended) {
          cancelAnimationFrame(raf);
          video.pause();
          if (recorder.state !== "inactive") recorder.stop();
          return;
        }
        ctx.drawImage(video, sx, sy, cw, ch, 0, 0, cw, ch);
        drawCaption();
        onProgress?.(Math.min(99, Math.round(((video.currentTime - from) / (to - from)) * 100)));
        raf = requestAnimationFrame(draw);
      };

      video.onseeked = () => {
        video.onseeked = null;
        recorder.start();
        video.play().then(() => {
          raf = requestAnimationFrame(draw);
        }).catch(() => {
          cleanup();
          reject(new Error("Could not play the clip for trimming."));
        });
      };

      video.currentTime = from;
    };
  });
