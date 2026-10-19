import { useEffect, useState } from "react";
import { Camera, CameraOff, Download, RefreshCw, Square, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useARCamera } from "@/hooks/useARCamera";
import { FILTERS } from "@/lib/filters/filterRenderer";
import { toast } from "sonner";

export default function MotionLiveCamera({ onClip }: { onClip: (file: File) => void }) {
  const ar = useARCamera();
  const [clip, setClip] = useState<{ url: string; blob: Blob } | null>(null);
  useEffect(() => { ar.setDebug(false); ar.setFilterId("head-flame"); }, []);
  useEffect(() => () => { if (clip) URL.revokeObjectURL(clip.url); }, [clip]);
  const capture = async () => {
    try {
      if (ar.recording) { const blob = await ar.stopRecording(); if (blob) setClip({ url: URL.createObjectURL(blob), blob }); }
      else ar.startRecording();
    } catch (error) { toast.error(error instanceof Error ? error.message : "Recording unavailable"); }
  };
  return <div className="space-y-4">
    <div className="relative bg-muted overflow-hidden aspect-[9/16] max-h-[65vh] mx-auto w-full max-w-sm rounded-lg">
      <video ref={ar.videoRef} muted playsInline className={`absolute inset-0 w-full h-full object-contain ${ar.mirrored ? "-scale-x-100" : ""}`} />
      <canvas ref={ar.canvasRef} className={`absolute inset-0 w-full h-full object-contain pointer-events-none ${ar.mirrored ? "-scale-x-100" : ""}`} />
      {!ar.active && <div className="absolute inset-0 flex items-center justify-center"><Button onClick={() => void ar.startCamera()}><Camera className="h-4 w-4 mr-2" />Start camera</Button></div>}
      <span role="status" className="absolute bottom-3 left-3 bg-background/80 rounded px-2 py-1 text-xs">{ar.recording ? `Recording · ${ar.elapsed}s` : ar.status === "loading" ? "Loading live tracking…" : `${ar.stats.fps} FPS · ${ar.previewQuality}`}</span>
    </div>
    {ar.error && <p role="alert" className="text-sm text-destructive">{ar.error}</p>}
    <div className="flex gap-2 overflow-x-auto pb-2">{FILTERS.filter(f => !f.id.startsWith("skin-") && !f.id.startsWith("swap-") && !f.premium).map(f => <Button key={f.id} size="sm" variant={ar.filterId === f.id ? "default" : "outline"} onClick={() => ar.setFilterId(f.id)}>{f.emoji} {f.label}</Button>)}</div>
    <div className="flex flex-wrap justify-center gap-2">
      <Button variant="outline" size="icon" aria-label="Switch camera" title="Switch camera" disabled={ar.recording} onClick={() => void ar.switchCamera()}><RefreshCw className="h-4 w-4" /></Button>
      <Button disabled={!ar.active} onClick={() => void capture()}>{ar.recording ? <Square className="h-4 w-4 mr-2" /> : <Video className="h-4 w-4 mr-2" />}{ar.recording ? "Stop recording" : "Record"}</Button>
      <Button variant="outline" size="icon" title="Stop camera" aria-label="Stop camera" disabled={ar.recording} onClick={ar.stopCamera}><CameraOff className="h-4 w-4" /></Button>
      <Button variant="outline" disabled={ar.recording} onClick={() => ar.setPreviewQuality(ar.previewQuality === "low" ? "standard" : "low")}>{ar.previewQuality === "low" ? "Standard preview" : "Lower-resolution preview"}</Button>
    </div>
    {ar.active && ar.stats.fps > 0 && ar.stats.fps < 18 && <p role="status" className="text-sm text-secondary">Low frame rate. Lower the preview resolution, or record with No effect and edit the clip afterward.</p>}
    {clip && <div className="flex flex-col items-center gap-3 border-t border-border pt-4"><video src={clip.url} controls className="max-h-48 rounded-lg" /><div className="flex gap-2"><Button variant="outline" asChild><a download={clip.blob.type.includes("mp4") ? "usportz-live.mp4" : "usportz-live.webm"} href={clip.url}><Download className="h-4 w-4 mr-2" />Save clip</a></Button><Button onClick={() => onClip(new File([clip.blob], clip.blob.type.includes("mp4") ? "live-clip.mp4" : "live-clip.webm", { type: clip.blob.type }))}>Edit clip</Button></div></div>}
  </div>;
}