import { useCallback, useEffect, useRef, useState } from "react";
import { TrackingManager } from "@/lib/vision/trackingManager";
import { getFilter, renderARFrame } from "@/lib/filters/filterRenderer";
import type { EngineStats } from "@/lib/ar/types";

export type CameraFacing = "user" | "environment";
export type SourceKind = "camera" | "file";

interface DebugSnapshot extends EngineStats {
  targetIds: number[];
  confidence: number;
  coasting: boolean;
}

/**
 * Owns the camera, the vision pipeline and the render loop.
 * High-frequency tracking data never enters React state — the loop
 * reads it straight from the TrackingManager. Only coarse UI state
 * (status, stats @4Hz, recording flags) is stored in React.
 */
export const useARCamera = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const recordCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const managerRef = useRef<TrackingManager | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const filterRef = useRef("head-flame");
  const debugRef = useRef(true);
  const trackingRef = useRef(true);
  const mirrorRef = useRef(true);
  const scratchRef = useRef({
    mask: document.createElement("canvas"),
    layer: document.createElement("canvas"),
  });
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const timerRef = useRef<number | null>(null);

  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [active, setActive] = useState(false);
  const [sourceKind, setSourceKind] = useState<SourceKind>("camera");
  const [facing, setFacing] = useState<CameraFacing>("user");
  const [filterId, setFilterId] = useState("head-flame");
  const [debug, setDebug] = useState(true);
  const [tracking, setTracking] = useState(true);
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [torchAvailable, setTorchAvailable] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [stats, setStats] = useState<DebugSnapshot>({
    fps: 0,
    inferenceMs: 0,
    renderMs: 0,
    targets: 0,
    droppedFrames: 0,
    targetIds: [],
    confidence: 0,
    coasting: false,
  });

  filterRef.current = filterId;
  debugRef.current = debug;
  trackingRef.current = tracking;
  mirrorRef.current = sourceKind === "camera" && facing === "user";

  // ---- engine boot ----
  useEffect(() => {
    const manager = new TrackingManager({ maxPeople: 2, segmentation: true, face: true, hands: true });
    managerRef.current = manager;
    const off = manager.onStatus(({ status: s, message }) => {
      setStatus(s);
      if (message) setError(message);
    });
    manager.init();
    return () => {
      off();
      manager.dispose();
      managerRef.current = null;
    };
  }, []);

  // ---- render loop (stage 8: compositing) ----
  useEffect(() => {
    let lastStatPush = 0;
    const loop = () => {
      rafRef.current = requestAnimationFrame(loop);
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const manager = managerRef.current;
      if (!video || !canvas || !manager || video.readyState < 2) return;

      const vw = video.videoWidth || 720;
      const vh = video.videoHeight || 1280;
      if (canvas.width !== vw || canvas.height !== vh) {
        canvas.width = vw;
        canvas.height = vh;
      }
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const t0 = performance.now();
      if (trackingRef.current) {
        renderARFrame({
          ctx,
          width: vw,
          height: vh,
          targets: manager.state.targets,
          segmentation: manager.state.segmentation,
          filter: getFilter(filterRef.current),
          timeMs: t0,
          debug: debugRef.current,
          scratch: scratchRef.current,
        });
      } else {
        ctx.clearRect(0, 0, vw, vh);
      }
      const renderMs = performance.now() - t0;
      manager.noteRenderedFrame(t0, renderMs);

      // recording composite: raw video + AR overlay, off-screen
      const rec = recordCanvasRef.current;
      if (rec && recorderRef.current) {
        if (rec.width !== vw || rec.height !== vh) {
          rec.width = vw;
          rec.height = vh;
        }
        const rctx = rec.getContext("2d");
        if (rctx) {
          rctx.save();
          if (mirrorRef.current) {
            rctx.translate(vw, 0);
            rctx.scale(-1, 1);
          }
          rctx.drawImage(video, 0, 0, vw, vh);
          rctx.drawImage(canvas, 0, 0, vw, vh);
          rctx.restore();
        }
      }

      if (t0 - lastStatPush > 250) {
        lastStatPush = t0;
        const targets = manager.state.targets;
        setStats({
          ...manager.stats,
          targetIds: targets.map((t) => t.id),
          confidence: targets[0]?.confidence ?? 0,
          coasting: targets.some((t) => t.coasting),
        });
      }
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setTorchAvailable(false);
    setTorchOn(false);
  }, []);

  const startCamera = useCallback(
    async (want: CameraFacing = facing) => {
      setError(null);
      try {
        stopStream();
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: want, width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: true,
        });
        streamRef.current = stream;
        const video = videoRef.current;
        if (video) {
          video.srcObject = stream;
          video.muted = true;
          video.playsInline = true;
          await video.play().catch(() => undefined);
        }
        const track = stream.getVideoTracks()[0];
        const caps = (track?.getCapabilities?.() ?? {}) as MediaTrackCapabilities & { torch?: boolean };
        setTorchAvailable(Boolean(caps.torch));
        setFacing(want);
        setSourceKind("camera");
        setActive(true);
        managerRef.current?.setSource(video);
        managerRef.current?.start();
      } catch (e) {
        const err = e as DOMException;
        setError(
          err?.name === "NotAllowedError"
            ? "Camera permission denied. Allow camera access in your browser settings to use AR."
            : err?.message || "Could not start the camera."
        );
        setActive(false);
      }
    },
    [facing, stopStream]
  );

  const stopCamera = useCallback(() => {
    managerRef.current?.stop();
    stopStream();
    const video = videoRef.current;
    if (video) {
      video.srcObject = null;
      video.removeAttribute("src");
      video.load();
    }
    setActive(false);
  }, [stopStream]);

  const switchCamera = useCallback(() => {
    startCamera(facing === "user" ? "environment" : "user");
  }, [facing, startCamera]);

  const toggleTorch = useCallback(async () => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;
    const next = !torchOn;
    try {
      await track.applyConstraints({ advanced: [{ torch: next } as MediaTrackConstraintSet] });
      setTorchOn(next);
    } catch {
      setTorchAvailable(false);
    }
  }, [torchOn]);

  const loadVideoFile = useCallback(
    async (file: File) => {
      stopStream();
      const video = videoRef.current;
      if (!video) return;
      video.srcObject = null;
      video.src = URL.createObjectURL(file);
      video.loop = true;
      video.muted = true;
      video.playsInline = true;
      await video.play().catch(() => undefined);
      setSourceKind("file");
      setActive(true);
      managerRef.current?.setSource(video);
      managerRef.current?.start();
    },
    [stopStream]
  );

  // ---- capture ----
  const capturePhoto = useCallback((): string | null => {
    const video = videoRef.current;
    const overlay = canvasRef.current;
    if (!video || !overlay) return null;
    const out = document.createElement("canvas");
    out.width = video.videoWidth || overlay.width;
    out.height = video.videoHeight || overlay.height;
    const ctx = out.getContext("2d");
    if (!ctx) return null;
    ctx.save();
    if (mirrorRef.current) {
      ctx.translate(out.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, out.width, out.height);
    ctx.drawImage(overlay, 0, 0, out.width, out.height);
    ctx.restore();
    return out.toDataURL("image/jpeg", 0.92);
  }, []);

  const startRecording = useCallback(() => {
    if (recorderRef.current) return;
    if (!recordCanvasRef.current) recordCanvasRef.current = document.createElement("canvas");
    const rec = recordCanvasRef.current;
    const video = videoRef.current;
    rec.width = video?.videoWidth || 720;
    rec.height = video?.videoHeight || 1280;
    const stream = rec.captureStream(30);
    const audio = streamRef.current?.getAudioTracks?.()[0];
    if (audio) stream.addTrack(audio);
    const mime = ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm"].find((m) =>
      MediaRecorder.isTypeSupported(m)
    );
    const recorder = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
    chunksRef.current = [];
    recorder.ondataavailable = (e) => e.data.size && chunksRef.current.push(e.data);
    recorder.start(200);
    recorderRef.current = recorder;
    setRecording(true);
    setElapsed(0);
    timerRef.current = window.setInterval(() => setElapsed((s) => s + 1), 1000);
  }, []);

  const stopRecording = useCallback(
    () =>
      new Promise<Blob | null>((resolve) => {
        const recorder = recorderRef.current;
        if (!recorder) return resolve(null);
        recorder.onstop = () => {
          const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "video/webm" });
          recorderRef.current = null;
          chunksRef.current = [];
          setRecording(false);
          if (timerRef.current) window.clearInterval(timerRef.current);
          resolve(blob);
        };
        recorder.stop();
      }),
    []
  );

  useEffect(
    () => () => {
      stopStream();
      if (timerRef.current) window.clearInterval(timerRef.current);
    },
    [stopStream]
  );

  return {
    videoRef,
    canvasRef,
    status,
    error,
    active,
    sourceKind,
    facing,
    mirrored: sourceKind === "camera" && facing === "user",
    filterId,
    setFilterId,
    debug,
    setDebug,
    tracking,
    setTracking,
    recording,
    elapsed,
    stats,
    torchAvailable,
    torchOn,
    toggleTorch,
    startCamera,
    stopCamera,
    switchCamera,
    loadVideoFile,
    capturePhoto,
    startRecording,
    stopRecording,
  };
};
