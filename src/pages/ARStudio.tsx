import { useEffect, useRef, useState } from "react";
import {
  Camera,
  CameraOff,
  Circle,
  Download,
  Image as ImageIcon,
  RefreshCw,
  Square,
  Upload,
  Video,
  Zap,
  ZapOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { FILTERS } from "@/lib/filters/filterRenderer";
import { useARCamera } from "@/hooks/useARCamera";

const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

const ARStudio = () => {
  const ar = useARCamera();

  useEffect(() => {
    const prev = document.title;
    document.title = "AR Camera Studio | U⚡️Sportz";
    const meta = document.querySelector('meta[name="description"]');
    const prevDesc = meta?.getAttribute("content") ?? "";
    meta?.setAttribute(
      "content",
      "Real-time AR camera with live face, pose and body tracking, animated effects and full-body character skins."
    );
    return () => {
      document.title = prev;
      meta?.setAttribute("content", prevDesc);
    };
  }, []);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [mode, setMode] = useState<"photo" | "video">("video");
  const [shot, setShot] = useState<string | null>(null);
  const [clip, setClip] = useState<string | null>(null);

  useEffect(() => () => {
    if (clip) URL.revokeObjectURL(clip);
  }, [clip]);

  const shutter = async () => {
    if (mode === "photo") {
      const data = ar.capturePhoto();
      if (!data) return toast.error("Nothing to capture yet");
      setShot(data);
      toast.success("Photo captured");
      return;
    }
    if (ar.recording) {
      const blob = await ar.stopRecording();
      if (blob) {
        setClip(URL.createObjectURL(blob));
        toast.success("Clip ready");
      }
    } else {
      ar.startRecording();
    }
  };

  return (
    <div className="fixed inset-0 bg-background text-foreground">
      {/* --- stage: raw video layer + separate AR overlay canvas --- */}
      <div className="relative h-full w-full overflow-hidden bg-black">
        <video
          ref={ar.videoRef}
          playsInline
          muted
          className={cn(
            "absolute inset-0 h-full w-full object-cover",
            ar.mirrored && "scale-x-[-1]"
          )}
        />
        <canvas
          ref={ar.canvasRef}
          className={cn(
            "pointer-events-none absolute inset-0 h-full w-full object-cover",
            ar.mirrored && "scale-x-[-1]"
          )}
        />

        {!ar.active && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-gradient-to-b from-background/95 to-background/80 px-6 text-center">
            <h1 className="text-2xl font-bold">AR Camera Studio</h1>
            <p className="max-w-sm text-sm text-muted-foreground">
              Live face, pose and body tracking with animated effects that stay locked to you as you move.
            </p>
            <div className="flex gap-2">
              <Button onClick={() => ar.startCamera()}>
                <Camera className="mr-2 h-4 w-4" /> Start camera
              </Button>
              <Button variant="secondary" onClick={() => fileRef.current?.click()}>
                <Upload className="mr-2 h-4 w-4" /> Upload video
              </Button>
            </div>
            {ar.error && <p className="text-sm text-destructive">{ar.error}</p>}
          </div>
        )}

        {/* --- top bar --- */}
        <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-background/70 px-3 py-1 text-xs font-medium backdrop-blur">
              {ar.status === "ready" ? "Tracking engine ready" : ar.status === "loading" ? "Loading models…" : ar.status === "error" ? "Engine error" : "Idle"}
            </span>
            {ar.recording && (
              <span className="flex items-center gap-1 rounded-full bg-destructive px-3 py-1 text-xs font-semibold text-destructive-foreground">
                <Circle className="h-2 w-2 fill-current" /> {fmt(ar.elapsed)}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {ar.torchAvailable && (
              <Button size="icon" variant="secondary" onClick={ar.toggleTorch} aria-label="Toggle flash">
                {ar.torchOn ? <Zap className="h-4 w-4" /> : <ZapOff className="h-4 w-4" />}
              </Button>
            )}
            <Button size="icon" variant="secondary" onClick={ar.switchCamera} aria-label="Switch camera">
              <RefreshCw className="h-4 w-4" />
            </Button>
            {ar.active && (
              <Button size="icon" variant="secondary" onClick={ar.stopCamera} aria-label="Stop camera">
                <CameraOff className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* --- debug panel --- */}
        {ar.debug && (
          <div className="absolute left-3 top-16 rounded-lg bg-background/75 p-3 font-mono text-[11px] leading-relaxed backdrop-blur">
            <div>FPS: {ar.stats.fps}</div>
            <div>Inference: {ar.stats.inferenceMs.toFixed(1)} ms</div>
            <div>Render: {ar.stats.renderMs.toFixed(1)} ms</div>
            <div>Targets: {ar.stats.targets} [{ar.stats.targetIds.join(", ") || "—"}]</div>
            <div>Confidence: {(ar.stats.confidence * 100).toFixed(0)}%</div>
            <div>Dropped: {ar.stats.droppedFrames}</div>
            {ar.stats.coasting && <div className="text-primary">predicting through loss…</div>}
          </div>
        )}

        {/* --- bottom controls --- */}
        <div className="absolute inset-x-0 bottom-0 space-y-3 bg-gradient-to-t from-background/90 to-transparent p-3 pb-5">
          <div className="flex items-center justify-between gap-4 rounded-xl bg-background/60 px-3 py-2 text-xs backdrop-blur">
            <label className="flex items-center gap-2">
              <Switch checked={ar.tracking} onCheckedChange={ar.setTracking} /> Tracking
            </label>
            <label className="flex items-center gap-2">
              <Switch checked={ar.debug} onCheckedChange={ar.setDebug} /> Debug
            </label>
            <Button size="sm" variant="ghost" onClick={() => fileRef.current?.click()}>
              <Upload className="mr-1 h-3.5 w-3.5" /> Video
            </Button>
          </div>

          {/* filter carousel */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                onClick={() => ar.setFilterId(f.id)}
                className={cn(
                  "flex min-w-[72px] shrink-0 flex-col items-center gap-1 rounded-xl border px-2 py-2 text-[10px] backdrop-blur transition",
                  ar.filterId === f.id
                    ? "border-primary bg-primary/20 text-foreground"
                    : "border-border/60 bg-background/50 text-muted-foreground"
                )}
              >
                <span className="text-xl" aria-hidden>{f.emoji}</span>
                <span className="line-clamp-2 text-center leading-tight">{f.label}</span>
              </button>
            ))}
          </div>

          <div className="flex items-center justify-center gap-6">
            <button
              onClick={() => setMode("photo")}
              className={cn("text-xs", mode === "photo" ? "font-bold text-primary" : "text-muted-foreground")}
            >
              <ImageIcon className="mx-auto mb-0.5 h-4 w-4" /> Photo
            </button>
            <button
              onClick={shutter}
              aria-label={ar.recording ? "Stop recording" : "Capture"}
              className={cn(
                "flex h-18 w-18 items-center justify-center rounded-full border-4 border-primary p-1 transition",
                ar.recording ? "scale-95" : "hover:scale-105"
              )}
              style={{ height: 72, width: 72 }}
            >
              <span
                className={cn(
                  "block bg-primary transition-all",
                  ar.recording ? "h-6 w-6 rounded-md" : "h-full w-full rounded-full"
                )}
              />
            </button>
            <button
              onClick={() => setMode("video")}
              className={cn("text-xs", mode === "video" ? "font-bold text-primary" : "text-muted-foreground")}
            >
              <Video className="mx-auto mb-0.5 h-4 w-4" /> Video
            </button>
          </div>
        </div>

        {/* --- results --- */}
        {(shot || clip) && (
          <div className="absolute bottom-40 right-3 w-32 space-y-2">
            {shot && (
              <a href={shot} download="ar-photo.jpg" className="block">
                <img src={shot} alt="Captured AR photo" className="rounded-lg border border-border" />
                <span className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Download className="h-3 w-3" /> Save photo
                </span>
              </a>
            )}
            {clip && (
              <div>
                <video src={clip} controls className="w-full rounded-lg border border-border" />
                <a href={clip} download="ar-clip.webm" className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Download className="h-3 w-3" /> Save clip
                </a>
              </div>
            )}
          </div>
        )}

        <input
          ref={fileRef}
          type="file"
          accept="video/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) ar.loadVideoFile(f);
            e.target.value = "";
          }}
        />
      </div>
    </div>
  );
};

export default ARStudio;
