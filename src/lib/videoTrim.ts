// Client-side video trim + optional square crop.
// Re-encodes by playing the source clip into a canvas and recording the canvas stream.
export interface TrimOptions {
  start: number;
  end: number;
  square?: boolean;
  onProgress?: (pct: number) => void;
}

export const trimVideo = (blob: Blob, { start, end, square, onProgress }: TrimOptions): Promise<Blob> =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const video = document.createElement("video");
    video.src = url;
    video.muted = true;
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
      const size = Math.min(vw, vh);
      const canvas = document.createElement("canvas");
      canvas.width = square ? size : vw;
      canvas.height = square ? size : vh;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        cleanup();
        reject(new Error("Canvas not supported on this device."));
        return;
      }

      const sx = square ? (vw - size) / 2 : 0;
      const sy = square ? (vh - size) / 2 : 0;

      const stream = canvas.captureStream(30);
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
        ctx.drawImage(video, sx, sy, square ? size : vw, square ? size : vh, 0, 0, canvas.width, canvas.height);
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
