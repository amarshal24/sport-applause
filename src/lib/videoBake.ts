/**
 * Client-side video bake: composites CSS filters, transforms, text/stickers,
 * character pins, trim, speed, and background music into a real MediaRecorder blob.
 */

export interface BakeTextOverlay {
  text: string;
  x: number;
  y: number;
  fontSize: number;
  color: string;
  fontFamily: string;
}

export interface BakeCharacterPin {
  x: number;
  y: number;
  emoji: string;
}

export interface BakeMusic {
  url: string;
  volume: number; // 0–1
}

export interface VideoBakeInput {
  source: Blob | string;
  filter?: string;
  flipH?: boolean;
  flipV?: boolean;
  rotation?: number;
  trimStartSec?: number;
  trimEndSec?: number;
  playbackSpeed?: number;
  videoVolume?: number; // 0–1
  textOverlays?: BakeTextOverlay[];
  characterPins?: BakeCharacterPin[];
  music?: BakeMusic | null;
  maxDimension?: number;
  fps?: number;
  onProgress?: (percent: number) => void;
}

export interface VideoBakeResult {
  blob: Blob;
  mimeType: string;
  extension: string;
  file: File;
}

const MAX_BAKE_SECONDS = 90;

function pickMimeType(): { mimeType: string; extension: string } {
  const candidates = [
    { mimeType: "video/webm;codecs=vp9,opus", extension: "webm" },
    { mimeType: "video/webm;codecs=vp8,opus", extension: "webm" },
    { mimeType: "video/webm", extension: "webm" },
    { mimeType: "video/mp4", extension: "mp4" },
  ];
  for (const c of candidates) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(c.mimeType)) {
      return c;
    }
  }
  return { mimeType: "video/webm", extension: "webm" };
}

function waitForEvent<T extends EventTarget>(
  target: T,
  event: string,
  errorEvent = "error",
): Promise<void> {
  return new Promise((resolve, reject) => {
    const onOk = () => {
      cleanup();
      resolve();
    };
    const onErr = () => {
      cleanup();
      reject(new Error(`Media failed: ${event}`));
    };
    const cleanup = () => {
      target.removeEventListener(event, onOk);
      target.removeEventListener(errorEvent, onErr);
    };
    target.addEventListener(event, onOk, { once: true });
    target.addEventListener(errorEvent, onErr, { once: true });
  });
}

async function loadVideoElement(source: Blob | string): Promise<HTMLVideoElement> {
  const video = document.createElement("video");
  video.playsInline = true;
  video.preload = "auto";
  video.crossOrigin = "anonymous";
  video.muted = false;

  if (typeof source === "string") {
    video.src = source;
  } else {
    video.src = URL.createObjectURL(source);
  }

  await waitForEvent(video, "loadedmetadata");
  if (video.readyState < 2) {
    await waitForEvent(video, "loadeddata");
  }
  return video;
}

async function decodeMusic(
  ctx: AudioContext,
  url: string,
): Promise<AudioBuffer | null> {
  try {
    const res = await fetch(url, { mode: "cors" });
    if (!res.ok) return null;
    const ab = await res.arrayBuffer();
    return await ctx.decodeAudioData(ab.slice(0));
  } catch {
    return null;
  }
}

function canvasSize(vw: number, vh: number, maxDimension: number) {
  const longest = Math.max(vw, vh) || 1;
  const scale = longest > maxDimension ? maxDimension / longest : 1;
  return {
    width: Math.max(2, Math.round(vw * scale) & ~1),
    height: Math.max(2, Math.round(vh * scale) & ~1),
  };
}

function drawCompositeFrame(
  ctx: CanvasRenderingContext2D,
  video: HTMLVideoElement,
  width: number,
  height: number,
  input: VideoBakeInput,
) {
  const filter = input.filter && input.filter !== "none" ? input.filter : "none";
  const flipH = !!input.flipH;
  const flipV = !!input.flipV;
  const rotation = input.rotation ?? 0;

  ctx.save();
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, width, height);

  ctx.filter = filter;
  ctx.translate(width / 2, height / 2);
  if (flipH) ctx.scale(-1, 1);
  if (flipV) ctx.scale(1, -1);
  if (rotation) ctx.rotate((rotation * Math.PI) / 180);

  const vw = video.videoWidth || width;
  const vh = video.videoHeight || height;
  const scale = Math.min(width / vw, height / vh);
  const dw = vw * scale;
  const dh = vh * scale;
  ctx.drawImage(video, -dw / 2, -dh / 2, dw, dh);
  ctx.restore();

  ctx.filter = "none";
  ctx.shadowColor = "rgba(0,0,0,0.7)";
  ctx.shadowBlur = 8;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  for (const overlay of input.textOverlays ?? []) {
    ctx.font = `bold ${overlay.fontSize}px ${overlay.fontFamily || "sans-serif"}`;
    ctx.fillStyle = overlay.color || "#fff";
    ctx.fillText(overlay.text, (overlay.x / 100) * width, (overlay.y / 100) * height);
  }

  for (const pin of input.characterPins ?? []) {
    ctx.font = `${Math.round(width * 0.08)}px sans-serif`;
    ctx.fillStyle = "#fff";
    ctx.fillText(pin.emoji, (pin.x / 100) * width, (pin.y / 100) * height);
  }

  ctx.shadowBlur = 0;
}

/** Returns true when bake would change the output vs the original file. */
export function hasBakeableEdits(
  input: VideoBakeInput,
  fullDurationSec?: number,
): boolean {
  const filter = input.filter ?? "none";
  const trimStart = input.trimStartSec ?? 0;
  const trimEnd = input.trimEndSec;
  const speed = input.playbackSpeed ?? 1;
  const full = fullDurationSec ?? Number.POSITIVE_INFINITY;
  const trimmed =
    trimStart > 0.05 ||
    (typeof trimEnd === "number" && Number.isFinite(trimEnd) && trimEnd < full - 0.05);

  return (
    (filter !== "none" && filter.trim() !== "") ||
    !!input.flipH ||
    !!input.flipV ||
    (input.rotation ?? 0) !== 0 ||
    (input.textOverlays?.length ?? 0) > 0 ||
    (input.characterPins?.length ?? 0) > 0 ||
    !!input.music?.url ||
    speed !== 1 ||
    trimmed
  );
}

export async function bakeVideo(input: VideoBakeInput): Promise<VideoBakeResult> {
  if (typeof MediaRecorder === "undefined" || typeof document === "undefined") {
    throw new Error("Video export is not supported in this browser");
  }

  const fps = input.fps ?? 30;
  const maxDimension = input.maxDimension ?? 1280;
  const speed = Math.max(0.25, Math.min(4, input.playbackSpeed ?? 1));
  const videoVolume = Math.max(0, Math.min(1, input.videoVolume ?? 1));

  const video = await loadVideoElement(input.source);
  const objectUrl =
    typeof input.source !== "string" ? video.src : null;

  const duration = video.duration;
  if (!Number.isFinite(duration) || duration <= 0) {
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    throw new Error("Could not read video duration");
  }

  let startSec = Math.max(0, input.trimStartSec ?? 0);
  let endSec =
    typeof input.trimEndSec === "number" && Number.isFinite(input.trimEndSec)
      ? input.trimEndSec
      : duration;
  endSec = Math.min(duration, Math.max(startSec + 0.1, endSec));

  if (endSec - startSec > MAX_BAKE_SECONDS) {
    endSec = startSec + MAX_BAKE_SECONDS;
  }

  const { width, height } = canvasSize(video.videoWidth, video.videoHeight, maxDimension);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    throw new Error("Canvas is not available");
  }

  const { mimeType, extension } = pickMimeType();
  const canvasStream = canvas.captureStream(fps);

  const audioCtx = new AudioContext();
  const mixDest = audioCtx.createMediaStreamDestination();
  let musicSource: AudioBufferSourceNode | null = null;

  try {
    try {
      const videoSource = audioCtx.createMediaElementSource(video);
      const videoGain = audioCtx.createGain();
      videoGain.gain.value = videoVolume;
      videoSource.connect(videoGain).connect(mixDest);
    } catch {
      // Cross-origin / already-connected video — continue without original audio
    }

    if (input.music?.url) {
      const buffer = await decodeMusic(audioCtx, input.music.url);
      if (buffer) {
        musicSource = audioCtx.createBufferSource();
        musicSource.buffer = buffer;
        musicSource.loop = true;
        const musicGain = audioCtx.createGain();
        musicGain.gain.value = Math.max(0, Math.min(1, input.music.volume));
        musicSource.connect(musicGain).connect(mixDest);
      }
    }

    const tracks = [
      ...canvasStream.getVideoTracks(),
      ...mixDest.stream.getAudioTracks(),
    ];
    const combined = new MediaStream(tracks);

    const chunks: BlobPart[] = [];
    const recorder = new MediaRecorder(combined, {
      mimeType: MediaRecorder.isTypeSupported(mimeType) ? mimeType : undefined,
      videoBitsPerSecond: 4_000_000,
    });

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    const recorded = new Promise<Blob>((resolve, reject) => {
      recorder.onerror = () => reject(new Error("MediaRecorder failed"));
      recorder.onstop = () => {
        resolve(new Blob(chunks, { type: recorder.mimeType || mimeType }));
      };
    });

    video.playbackRate = speed;
    video.currentTime = startSec;
    await waitForEvent(video, "seeked");

    if (audioCtx.state === "suspended") {
      await audioCtx.resume();
    }

    recorder.start(250);
    musicSource?.start(0);

    try {
      await video.play();
    } catch {
      // Retry muted if autoplay blocks unmuted playback (frames still bake)
      video.muted = true;
      await video.play();
    }

    await new Promise<void>((resolve, reject) => {
      let frameId = 0;
      let settled = false;

      const finish = () => {
        if (settled) return;
        settled = true;
        cancelAnimationFrame(frameId);
        video.pause();
        try {
          if (recorder.state !== "inactive") recorder.stop();
        } catch {
          /* ignore */
        }
        resolve();
      };

      const fail = (err: Error) => {
        if (settled) return;
        settled = true;
        cancelAnimationFrame(frameId);
        video.pause();
        try {
          if (recorder.state !== "inactive") recorder.stop();
        } catch {
          /* ignore */
        }
        reject(err);
      };

      const tick = () => {
        try {
          if (video.currentTime >= endSec - 0.04 || video.ended) {
            drawCompositeFrame(ctx, video, width, height, input);
            finish();
            return;
          }
          drawCompositeFrame(ctx, video, width, height, input);
          const span = endSec - startSec;
          const pct = Math.min(99, Math.max(0, ((video.currentTime - startSec) / span) * 100));
          input.onProgress?.(pct);
          frameId = requestAnimationFrame(tick);
        } catch (err) {
          fail(err instanceof Error ? err : new Error("Bake frame failed"));
        }
      };

      frameId = requestAnimationFrame(tick);

      // Safety timeout (wall clock accounts for speed)
      const wallMs = ((endSec - startSec) / speed) * 1000 + 8000;
      window.setTimeout(() => {
        if (!settled) finish();
      }, wallMs);
    });

    const blob = await recorded;
    input.onProgress?.(100);

    if (!blob.size) {
      throw new Error("Exported video was empty");
    }

    const finalMime = blob.type || mimeType;
    const file = new File([blob], `edited-video-${Date.now()}.${extension}`, {
      type: finalMime,
    });

    return { blob, mimeType: finalMime, extension, file };
  } finally {
    try {
      musicSource?.stop();
    } catch {
      /* ignore */
    }
    video.pause();
    video.removeAttribute("src");
    video.load();
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    canvasStream.getTracks().forEach((t) => t.stop());
    mixDest.stream.getTracks().forEach((t) => t.stop());
    await audioCtx.close().catch(() => undefined);
  }
}
