import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Camera, Crosshair, Download, Flame, Loader2, Pause, Play, Plus, Trash2, Upload, X, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { trackObject, trackQuality, mergeTracks } from "@/lib/objectTracker";
import { correctMotionPoint, motionSample, motionUploadSchema, motionRangeSchema, paintMotion, motionPalette, type MotionObject, type MotionEffect } from "@/lib/motionStudio";
import { MotionSegmenter } from "@/lib/motionSegmentation";
import { exportMotion } from "@/lib/motionExport";
const MotionLiveCamera = lazy(() => import("@/components/video-fx/MotionLiveCamera"));

export default function MotionStudio() {
  const { user, loading } = useAuth();
  const [mode, setMode] = useState<"edit" | "live">("edit");
  const [file, setFile] = useState<File | null>(null), [url, setUrl] = useState("");
  const [objects, setObjects] = useState<MotionObject[]>([]), [selected, setSelected] = useState<string | null>(null);
  const [duration, setDuration] = useState(0), [time, setTime] = useState(0), [playing, setPlaying] = useState(false);
  const [picking, setPicking] = useState<"add" | "correct" | null>(null), [busy, setBusy] = useState("");
  const [progress, setProgress] = useState(0), [error, setError] = useState(""), [segment, setSegment] = useState(true);
  const [swishAt, setSwishAt] = useState<number | null>(null), [output, setOutput] = useState<{ url: string; blob: Blob } | null>(null);
  const video = useRef<HTMLVideoElement>(null), canvas = useRef<HTMLCanvasElement>(null), input = useRef<HTMLInputElement>(null);
  const data = useRef(objects), selectedRef = useRef(selected), abort = useRef<AbortController | null>(null), segmenter = useRef<MotionSegmenter | null>(null);
  const mask = useRef<HTMLCanvasElement | null>(null), maskTime = useRef(0), run = useRef(0), mounted = useRef(true);
  data.current = objects; selectedRef.current = selected;
  const object = objects.find(o => o.id === selected);
  useEffect(() => { mounted.current = true; document.title = "AI Motion FX Studio | U⚡️Sportz"; return () => { mounted.current = false; run.current++; abort.current?.abort(); segmenter.current?.dispose(); segmenter.current = null; }; }, []);
  useEffect(() => () => { if (url) URL.revokeObjectURL(url); }, [url]);
  useEffect(() => () => { if (output) URL.revokeObjectURL(output.url); }, [output]);
  useEffect(() => {
    if (!url || mode !== "edit") return;
    let raf = 0; const palette = motionPalette();
    const draw = () => {
      raf = requestAnimationFrame(draw); const v = video.current, c = canvas.current;
      if (!v || !c || v.readyState < 2) return;
      if (c.width !== v.videoWidth || c.height !== v.videoHeight) { c.width = v.videoWidth; c.height = v.videoHeight; }
      const ctx = c.getContext("2d"); if (!ctx) return; ctx.clearRect(0, 0, c.width, c.height);
      if (mask.current && v.paused && Math.abs(v.currentTime - maskTime.current) < 0.04) ctx.drawImage(mask.current, 0, 0, c.width, c.height);
      paintMotion(ctx, c.width, c.height, v.currentTime, data.current, palette);
      for (const o of data.current) {
        const p = motionSample(o, v.currentTime); if (!p) continue;
        ctx.strokeStyle = o.id === selectedRef.current ? palette.core : palette.electric; ctx.lineWidth = Math.max(2, c.width / 450);
        ctx.beginPath(); ctx.arc(p.x * c.width / 100, p.y * c.height / 100, p.size * Math.min(c.width, c.height) / 200, 0, Math.PI * 2); ctx.stroke();
      }
    }; draw(); return () => cancelAnimationFrame(raf);
  }, [url, mode]);
  const load = (next: File) => {
    const parsed = motionUploadSchema.safeParse(next); if (!parsed.success) { setError(parsed.error.issues[0]?.message ?? "Select a video"); return; }
    run.current++; abort.current?.abort(); setBusy(""); setError(""); setFile(next); setUrl(URL.createObjectURL(next)); setObjects([]); setSelected(null); setOutput(null); setDuration(0); setTime(0); setSwishAt(null); mask.current = null; setMode("edit"); setPicking(null);
  };
  const patch = (values: Partial<MotionObject>) => setObjects(all => all.map(o => o.id === selected ? { ...o, ...values } : o));
  const choose = async (event: React.PointerEvent<HTMLCanvasElement>) => {
    const v = video.current; if (!picking || !v || busy || v.readyState < 2) return;
    v.pause(); const bounds = event.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, (event.clientX - bounds.left) / bounds.width * 100)), y = Math.max(0, Math.min(100, (event.clientY - bounds.top) / bounds.height * 100));
    const t = v.currentTime, generation = run.current;
    if (picking === "correct" && object) { patch({ corrections: correctMotionPoint(object.corrections, { t, x, y, size: object.size, visible: true, c: 1 }) }); setPicking(null); mask.current = null; return; }
    let size = 8;
    if (segment) {
      setBusy("Selecting object"); setError("");
      try { if (!segmenter.current) segmenter.current = new MotionSegmenter(); const result = await segmenter.current.select(v, x, y); if (!mounted.current || generation !== run.current) return; mask.current = result.mask; maskTime.current = t; size = result.size; }
      catch (e) { if (mounted.current && generation === run.current) setError(e instanceof Error ? `${e.message} Manual point selection remains available.` : "AI selection unavailable. Turn off AI selection to place a manual point."); return; }
      finally { if (mounted.current && generation === run.current) setBusy(""); }
    }
    const id = crypto.randomUUID(); setObjects(all => [...all, { id, label: `Object ${all.length + 1}`, effect: "flame", x, y, size, start: 0, end: duration, intensity: 0.8, track: [], corrections: [] }]); setSelected(id); setPicking(null);
  };
  const track = async (forward: boolean) => {
    const v = video.current; if (!file || !object || !v) return;
    v.pause(); const controller = new AbortController(); abort.current = controller; setBusy("Tracking object"); setProgress(0); setError("");
    const generation = run.current, id = object.id, from = v.currentTime;
    const p = motionSample(object, from) ?? { x: object.x, y: object.y };
    try {
      const result = await trackObject(file, { startTime: from, x: p.x, y: p.y, signal: controller.signal, forwardOnly: forward, onProgress: n => { if (mounted.current && generation === run.current) setProgress(n); } });
      if (controller.signal.aborted || !mounted.current || generation !== run.current) return;
      setObjects(all => all.map(o => o.id === id ? { ...o, track: forward ? mergeTracks(o.track, result, from) : result, corrections: o.corrections.map(key => Math.abs(key.t - from) < 0.05 ? { ...key, x: p.x, y: p.y } : key) } : o));
      const quality = trackQuality(result); if (quality?.health !== "strong") setError("Tracking needs review. Correct drift and mark hidden intervals before export.");
    } catch (e) { if (!controller.signal.aborted) setError(e instanceof Error ? e.message : "Tracking failed"); }
    finally { if (mounted.current && generation === run.current) setBusy(""); }
  };
  const save = async () => {
    if (!file) return; video.current?.pause(); const controller = new AbortController(); abort.current = controller; const generation = run.current;
    setBusy("Rendering edited video"); setProgress(0); setError("");
    try { const blob = await exportMotion(file, objects, controller.signal, n => { if (mounted.current && generation === run.current) setProgress(n); }, swishAt); if (controller.signal.aborted || !mounted.current || generation !== run.current) return; setOutput({ blob, url: URL.createObjectURL(blob) }); toast.success("Edited video ready"); }
    catch (e) { if (!controller.signal.aborted) setError(e instanceof Error ? e.message : "Export failed"); }
    finally { if (mounted.current && generation === run.current) setBusy(""); }
  };
  if (loading) return <div className="p-16 flex justify-center"><Loader2 className="animate-spin" /></div>;
  if (!user) return <main className="min-h-screen bg-background flex flex-col items-center justify-center gap-4"><h1 className="text-3xl">AI Motion FX Studio</h1><Button asChild><Link to="/auth">Sign in</Link></Button></main>;
  return <div className="min-h-screen bg-background text-foreground pb-20">
    <header className="border-b border-border"><div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between gap-3"><Button variant="ghost" size="icon" title="Back to editor" aria-label="Back to editor" asChild><Link to="/editor"><ArrowLeft className="h-5 w-5" /></Link></Button><div className="flex-1"><p className="text-xs text-secondary font-semibold">U⚡️Sportz</p><h1 className="text-xl sm:text-2xl">AI Motion FX Studio</h1></div><Button size="sm" disabled={!file || !!busy || mode !== "edit"} onClick={() => void save()}><Download className="h-4 w-4 mr-1" />Export</Button></div></header>
    <main className="max-w-5xl mx-auto px-4 py-5 space-y-5">
      <div className="flex justify-between flex-wrap gap-3"><div className="flex gap-1"><Button variant={mode === "edit" ? "default" : "ghost"} disabled={!!busy} onClick={() => setMode("edit")}><Crosshair className="h-4 w-4 mr-2" />Video effects</Button><Button variant={mode === "live" ? "default" : "ghost"} disabled={!!busy} onClick={() => setMode("live")}><Camera className="h-4 w-4 mr-2" />Live camera</Button></div><Button variant="outline" disabled={!!busy} onClick={() => input.current?.click()}><Upload className="h-4 w-4 mr-2" />{file ? "Replace video" : "Upload video"}</Button><input type="file" accept="video/*" hidden ref={input} onChange={e => { const next = e.target.files?.[0]; if (next) load(next); e.target.value = ""; }} /></div>
      {error && <p role="alert" className="text-sm text-destructive break-words">{error}</p>}
      {busy && <div role="status" className="flex items-center gap-3 text-sm"><Loader2 className="h-4 w-4 animate-spin" />{busy} {busy !== "Selecting object" && `${progress}%`}<Button variant="ghost" size="icon" aria-label="Cancel operation" title="Cancel operation" disabled={busy === "Selecting object"} onClick={() => abort.current?.abort()}><X className="h-4 w-4" /></Button></div>}
      {mode === "live" ? <Suspense fallback={<Loader2 className="animate-spin" />}><MotionLiveCamera onClip={load} /></Suspense> : !url ? <div className="min-h-[55vh] flex flex-col items-center justify-center gap-5 border-y border-border"><Flame className="h-12 w-12 text-secondary" /><h2 className="text-3xl">Your next highlight.</h2><Button onClick={() => input.current?.click()}><Upload className="h-4 w-4 mr-2" />Choose video</Button></div> : <>
        <div className="grid lg:grid-cols-[minmax(0,1fr)_300px] gap-5">
          <section className="min-w-0 space-y-3">
            <div className="relative mx-auto w-fit max-w-full bg-muted rounded-lg overflow-hidden">
              <video ref={video} src={url} playsInline className="block max-h-[58vh] max-w-full" onLoadedMetadata={e => { const v = e.currentTarget; if (!Number.isFinite(v.duration)) { setError("Video length is unavailable. Use a video with a known duration."); return; } setDuration(v.duration); }} onTimeUpdate={e => setTime(e.currentTarget.currentTime)} onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => setPlaying(false)} />
              <canvas ref={canvas} onPointerDown={e => void choose(e)} aria-label="Video object selection" className={`absolute inset-0 w-full h-full touch-none ${picking ? "cursor-crosshair" : "pointer-events-none"}`} />
              {picking && <span className="absolute top-2 left-2 text-xs bg-background/90 rounded px-2 py-1 pointer-events-none">{picking === "correct" ? "Select corrected position" : "Select object"}</span>}
            </div>
            <div className="flex items-center gap-3"><Button size="icon" variant="ghost" disabled={!!busy} aria-label={playing ? "Pause video" : "Play video"} onClick={() => { const v = video.current; if (v) { if (v.paused) void v.play(); else v.pause(); } }}><>{playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}</></Button><Slider aria-label="Video time" disabled={!!busy} value={[time]} min={0} max={duration || 1} step={0.01} onValueChange={([n]) => { if (video.current) video.current.currentTime = n; setTime(n); }} /><span className="text-xs font-mono whitespace-nowrap">{time.toFixed(2)} / {duration.toFixed(2)}</span></div>
            <div className="flex flex-wrap gap-2 items-center"><Button disabled={!!busy || !duration} variant="outline" onClick={() => { video.current?.pause(); setPicking("add"); }}><Plus className="h-4 w-4 mr-2" />Select object</Button><label className="text-xs flex items-center gap-2"><Switch checked={segment} onCheckedChange={setSegment} disabled={!!busy} />AI selection</label>{picking && <Button variant="ghost" onClick={() => setPicking(null)}>Cancel selection</Button>}</div>
            <div className="divide-y divide-border border-y border-border">{objects.map(o => <div key={o.id} className="flex items-center gap-2 py-2"><Button variant={o.id === selected ? "secondary" : "ghost"} className="flex-1 justify-start min-w-0" disabled={!!busy} onClick={() => { setSelected(o.id); mask.current = null; }}><Crosshair className="h-4 w-4 mr-2 shrink-0" /><span className="truncate">{o.label}</span></Button><span className="text-xs text-muted-foreground">{o.track.length ? trackQuality(o.track)?.health : "Manual"}</span><Button variant="ghost" size="icon" title="Delete object" aria-label={`Delete ${o.label}`} disabled={!!busy} onClick={() => { setObjects(all => all.filter(item => item.id !== o.id)); if (selected === o.id) setSelected(null); }}><Trash2 className="h-4 w-4" /></Button></div>)}</div>
          </section>
          <section className="border-t lg:border-t-0 lg:border-l border-border pt-4 lg:pt-0 lg:pl-5 space-y-4 min-w-0">
            <h2 className="text-xl">{object ? "Object effects" : "Selected objects"}</h2>
            {object && <fieldset disabled={!!busy} className="space-y-4 min-w-0">
              <Label htmlFor="object-name">Name</Label><Input id="object-name" value={object.label} maxLength={60} onChange={e => patch({ label: e.target.value })} />
              <div className="grid grid-cols-2 gap-2">{([ ["flame", "Flaming Ball"], ["electric", "Electric"], ["trail", "Motion trail"], ["none", "No effect"] ] as [MotionEffect, string][]).map(([effect, label]) => <Button key={effect} size="sm" variant={object.effect === effect ? "default" : "outline"} onClick={() => patch({ effect })}>{effect === "flame" ? <Flame className="h-3 w-3 mr-1" /> : effect === "electric" ? <Zap className="h-3 w-3 mr-1" /> : null}{label}</Button>)}</div>
              <Label>Size · {object.size.toFixed(1)}%</Label><Slider aria-label="Object effect size" value={[object.size]} min={2} max={60} step={0.5} onValueChange={([size]) => patch({ size })} />
              <Label>Intensity · {Math.round(object.intensity * 100)}%</Label><Slider aria-label="Effect intensity" value={[object.intensity]} min={0} max={1} step={0.05} onValueChange={([intensity]) => patch({ intensity })} />
              <Label>Effect range</Label><Slider aria-label="Effect time range" value={[object.start, object.end]} min={0} max={duration || 1} step={0.01} minStepsBetweenThumbs={1} onValueChange={([start, end]) => { if (motionRangeSchema.safeParse({ start, end }).success) patch({ start, end }); }} /><p className="text-xs text-muted-foreground">{object.start.toFixed(2)}s — {object.end.toFixed(2)}s</p>
              <div className="flex flex-wrap gap-2"><Button size="sm" onClick={() => void track(false)}>Track video</Button><Button size="sm" variant="outline" onClick={() => void track(true)}>Retrack from here</Button><Button size="sm" variant="outline" onClick={() => { video.current?.pause(); setPicking("correct"); }}>Correct position</Button></div>
              <div className="flex flex-wrap gap-2"><Button size="sm" variant="outline" onClick={() => patch({ corrections: correctMotionPoint(object.corrections, { t: time, x: motionSample(object, time)?.x ?? object.x, y: motionSample(object, time)?.y ?? object.y, size: object.size, visible: false }) })}>Hide from here</Button><Button size="sm" variant="outline" onClick={() => patch({ corrections: correctMotionPoint(object.corrections, { t: time, x: object.x, y: object.y, size: object.size, visible: true }) })}>Show from here</Button><Button size="sm" variant="outline" onClick={() => { const p = motionSample(object, time); if (p) patch({ corrections: correctMotionPoint(object.corrections, { t: time, ...p, size: object.size, visible: true }) }); }}>Keyframe size</Button></div>
              <div className="flex flex-wrap gap-1">{object.corrections.map(key => <div className="flex items-center border border-border rounded" key={key.t}><Button variant="ghost" size="sm" onClick={() => { if (video.current) video.current.currentTime = key.t; setTime(key.t); }}>{key.t.toFixed(2)}s · {key.visible ? "Visible" : "Hidden"}</Button><Button size="icon" variant="ghost" title="Delete correction" aria-label={`Delete correction at ${key.t.toFixed(2)} seconds`} onClick={() => patch({ corrections: object.corrections.filter(p => p !== key) })}><X className="h-3 w-3" /></Button></div>)}</div>
            </fieldset>}
            <div className="border-t border-border pt-4 space-y-3"><label className="flex items-center gap-2 text-sm"><Switch disabled={!!busy} checked={swishAt !== null} onCheckedChange={value => setSwishAt(value ? time : null)} />Hoop sound</label>{swishAt !== null && <><Label htmlFor="hoop-time">Sound timestamp (seconds)</Label><Input id="hoop-time" type="number" min={0} max={duration} step={0.01} disabled={!!busy} value={swishAt} onChange={e => { const n = Number(e.target.value); if (Number.isFinite(n) && n >= 0 && n <= duration) setSwishAt(n); }} /></>}</div>
          </section>
        </div>
        {output && <section className="border-t border-border pt-5 space-y-3"><h2 className="text-2xl">Edited video</h2><video src={output.url} controls className="max-h-80 max-w-full rounded-lg" /><Button asChild><a href={output.url} download={output.blob.type.includes("mp4") ? "usportz-motion-fx.mp4" : "usportz-motion-fx.webm"}><Download className="h-4 w-4 mr-2" />Download edited video</a></Button></section>}
        <div className="border-t border-border pt-4 flex flex-wrap gap-3 text-sm text-muted-foreground"><span className="break-all">Original · {file?.name}</span><Button size="sm" variant="link" asChild><a href={url} download={file?.name}>Download original</a></Button></div>
      </>}
    </main>
  </div>;
}