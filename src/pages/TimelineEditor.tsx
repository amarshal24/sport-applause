import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Upload,
  Download,
  Play,
  Pause,
  SkipBack,
  ChevronLeft,
  ChevronRight,
  Scissors,
  Undo2,
  Redo2,
  Mic,
  Square,
  Type,
  Layers,
  Flame,
  Music,
  Loader2,
  Save,
  Plus,
  Captions,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { FunctionsHttpError } from "@supabase/supabase-js";
import { toast } from "sonner";
import Timeline from "@/components/timeline/Timeline";
import Inspector from "@/components/timeline/Inspector";
import {
  newProject,
  newClip,
  mediaSchema,
  endFrame,
  splitClip,
  type Project,
  type Clip,
  type Asset,
} from "@/lib/timeline/model";
import { saveProject, recoverProject } from "@/lib/timeline/storage";
import { TimelineMedia, importAsset } from "@/lib/timeline/media";
import { renderFrame, exportTimeline } from "@/lib/timeline/render";
import { mixAudio, audioWav } from "@/lib/timeline/audio";
import { sportsFx } from "@/lib/timeline/sportsFx";
import { trackObject } from "@/lib/objectTracker";
import { splitIntoCues } from "@/lib/captions";
import { trimAudioToWav } from "@/lib/audioTrim";
import { sportsSound } from "@/lib/timeline/soundFx";
export default function TimelineEditor() {
  const { user, loading } = useAuth();
  const [p, setP] = useState<Project>(newProject);
  const [ready, setReady] = useState(false),
    [saved, setSaved] = useState("Opening project…"),
    [frame, setFrame] = useState(0),
    [selected, setSelected] = useState<string | null>(null),
    [tab, setTab] = useState("media"),
    [sport, setSport] = useState("Basketball"),
    [zoom, setZoom] = useState(65),
    [playing, setPlaying] = useState(false),
    [busy, setBusy] = useState(""),
    [progress, setProgress] = useState(0),
    [error, setError] = useState(""),
    [recording, setRecording] = useState(false),
    [output, setOutput] = useState<string | null>(null);
  const canvas = useRef<HTMLCanvasElement>(null),
    upload = useRef<HTMLInputElement>(null),
    media = useRef(new TimelineMedia()),
    history = useRef<Project[]>([]),
    future = useRef<Project[]>([]),
    current = useRef(p),
    rendering = useRef(false),
    desired = useRef(0),
    abort = useRef<AbortController | null>(null),
    recorder = useRef<MediaRecorder | null>(null),
    stream = useRef<MediaStream | null>(null),
    started = useRef(0),
    audioCtx = useRef<AudioContext | null>(null),
    player = useRef<AudioBufferSourceNode | null>(null),
    mounted = useRef(true);
  current.current = p;
  const clip = p.clips.find((c) => c.id === selected);
  const change = (next: Project) => {
    setPlaying(false);
    history.current.push(current.current);
    if (history.current.length > 40) history.current.shift();
    future.current = [];
    setP(next);
  };
  const patch = (v: Partial<Clip>) => {
    if (!clip) return;
    change({
      ...p,
      clips: p.clips.map((c) => (c.id === clip.id ? { ...c, ...v } : c)),
    });
  };
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      abort.current?.abort();
      player.current?.stop();
      void audioCtx.current?.close();
      recorder.current?.stop();
      stream.current?.getTracks().forEach((t) => t.stop());
      media.current.dispose();
    };
  }, []);
  useEffect(() => {
    if (!user) return;
    setReady(false);
    recoverProject(user.id)
      .then((found) => {
        if (!mounted.current) return;
        history.current = [];
        future.current = [];
        setSelected(null);
        setFrame(0);
        setP(found ?? newProject());
        setSaved(found ? "Project recovered" : "New project");
        setReady(true);
      })
      .catch(() => {
        setError(
          "Local project storage is unavailable. Export before closing.",
        );
        setReady(true);
      });
  }, [user?.id]);
  useEffect(() => {
    if (!ready || !user) return;
    setSaved("Saving…");
    const id = setTimeout(() => {
      void saveProject(user.id, p)
        .then(() => setSaved("Saved on this device"))
        .catch(() => {
          setSaved("Not saved");
          setError("Project could not be saved. Device storage may be full.");
        });
    }, 700);
    return () => clearTimeout(id);
  }, [p, ready, user?.id]);
  useEffect(
    () => () => {
      if (output) URL.revokeObjectURL(output);
    },
    [output],
  );
  useEffect(() => {
    desired.current = frame;
    const draw = async () => {
      if (rendering.current || !canvas.current) return;
      rendering.current = true;
      let last = -1;
      try {
        while (last !== desired.current && mounted.current) {
          last = desired.current;
          await renderFrame(
            canvas.current,
            current.current,
            last,
            media.current,
          );
        }
      } catch (e) {
        if (mounted.current)
          setError(e instanceof Error ? e.message : "Preview failed");
      } finally {
        rendering.current = false;
      }
    };
    void draw();
  }, [p, frame]);
  useEffect(() => {
    if (!playing) return;
    const from = frame;
    let start = performance.now();
    let raf = 0,
      stopped = false;
    const tick = () => {
      const next =
        from + Math.floor(((performance.now() - start) / 1000) * p.fps);
      if (next >= endFrame(p)) {
        setPlaying(false);
        setFrame(endFrame(p) - 1);
        return;
      }
      setFrame(next);
      raf = requestAnimationFrame(tick);
    };
    void mixAudio(p, media.current)
      .then(async (buffer) => {
        if (stopped) return;
        const ctx = new AudioContext();
        audioCtx.current = ctx;
        await ctx.resume();
        if (stopped) {
          await ctx.close();
          return;
        }
        const node = ctx.createBufferSource();
        node.buffer = buffer;
        node.connect(ctx.destination);
        node.start(0, from / p.fps);
        start = performance.now();
        player.current = node;
        raf = requestAnimationFrame(tick);
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : "Audio preview failed");
        setPlaying(false);
      });
    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
      try {
        player.current?.stop();
      } catch {}
      player.current = null;
      void audioCtx.current?.close();
      audioCtx.current = null;
    };
  }, [playing]);
  const seek = (n: number) => {
    setPlaying(false);
    setFrame(Math.max(0, Math.min(endFrame(p) - 1, n)));
  };
  const importFiles = async (files: File[]) => {
    setBusy("Importing media");
    setError("");
    try {
      const assets: Asset[] = [];
      for (const f of files) {
        mediaSchema.parse(f);
        assets.push(await importAsset(f));
      }
      change({
        ...current.current,
        assets: [...current.current.assets, ...assets],
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Import failed");
    } finally {
      setBusy("");
    }
  };
  const addAsset = (a: Asset) => {
    const kind = a.kind === "audio" ? "audio" : "video";
    const t = p.tracks.find((t) => t.kind === kind);
    if (!t) return;
    const c = newClip(t, frame, Math.round(a.duration * p.fps), a.name, a.id);
    change({ ...p, clips: [...p.clips, c] });
    setSelected(c.id);
  };
  const addText = (text: string) => {
    const t = p.tracks.find((t) => t.kind === "text");
    if (!t) return;
    const c = newClip(t, frame, p.fps * 3, text);
    c.text = text;
    c.transform.y = 82;
    change({ ...p, clips: [...p.clips, c] });
    setSelected(c.id);
  };
  const addFx = (id: string) => {
    const t = p.tracks.find((t) => t.kind === "effects"),
      fx = sportsFx.find((f) => f.id === id);
    if (!t || !fx) return;
    const c = newClip(t, frame, p.fps * 2, fx.name);
    c.effect = id;
    change({ ...p, clips: [...p.clips, c] });
    setSelected(c.id);
  };
  const record = async () => {
    if (recording) {
      recorder.current?.stop();
      return;
    }
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      stream.current = s;
      const r = new MediaRecorder(s),
        chunks: Blob[] = [];
      recorder.current = r;
      r.ondataavailable = (e) => {
        if (e.data.size) chunks.push(e.data);
      };
      started.current = performance.now();
      r.onstop = async () => {
        const seconds = (performance.now() - started.current) / 1000,
          blob = new Blob(chunks, { type: r.mimeType });
        s.getTracks().forEach((t) => t.stop());
        recorder.current = null;
        setRecording(false);
        const asset: Asset = {
          id: crypto.randomUUID(),
          name: "Voiceover " + new Date().toLocaleTimeString(),
          kind: "audio",
          blob,
          duration: seconds,
        };
        const project = current.current,
          t = project.tracks.find((t) => t.kind === "audio");
        if (!t) return;
        change({
          ...project,
          assets: [...project.assets, asset],
          clips: [
            ...project.clips,
            newClip(
              t,
              frame,
              Math.max(1, Math.round(seconds * project.fps)),
              asset.name,
              asset.id,
            ),
          ],
        });
      };
      r.start();
      setRecording(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Microphone unavailable");
    }
  };
  const exportFile = async () => {
    setPlaying(false);
    setBusy("Rendering highlight");
    setError("");
    const controller = new AbortController();
    abort.current = controller;
    try {
      const blob = await exportTimeline(p, controller.signal, setProgress);
      setOutput(URL.createObjectURL(blob));
      toast.success("Highlight ready");
    } catch (e) {
      if (!controller.signal.aborted)
        setError(e instanceof Error ? e.message : "Export failed");
    } finally {
      setBusy("");
    }
  };
  const separate = () => {
    if (!clip?.assetId) return;
    const t = p.tracks.find((t) => t.kind === "audio");
    if (!t) return;
    change({
      ...p,
      clips: [
        ...p.clips.map((c) => (c.id === clip.id ? { ...c, muted: true } : c)),
        {
          ...clip,
          id: crypto.randomUUID(),
          trackId: t.id,
          name: clip.name + " audio",
          muted: false,
        },
      ],
    });
  };
  const tracking = async () => {
    if (!clip) return;
    const video = p.clips.find(
      (c) =>
        c.assetId &&
        p.assets.find((a) => a.id === c.assetId)?.kind === "video" &&
        frame >= c.start &&
        frame < c.start + c.duration,
    );
    const asset = p.assets.find((a) => a.id === video?.assetId);
    if (!asset || !video) {
      setError("Place the playhead over a video clip to track.");
      return;
    }
    setBusy("Tracking target");
    const controller = new AbortController();
    abort.current = controller;
    try {
      const motion = await trackObject(asset.blob, {
        startTime: (video.offset + frame - video.start) / p.fps,
        x: clip.transform.x,
        y: clip.transform.y,
        signal: controller.signal,
        onProgress: setProgress,
      });
      patch({
        motion,
        motionAssetId: asset.id,
        motionOffset: video.offset + clip.start - video.start,
      });
    } catch (e) {
      if (!controller.signal.aborted)
        setError(e instanceof Error ? e.message : "Tracking failed");
    } finally {
      setBusy("");
    }
  };
  const captions = async () => {
    if (!clip?.assetId) {
      setError("Select a video or audio clip first.");
      return;
    }
    const a = p.assets.find((a) => a.id === clip.assetId);
    if (!a) return;
    setBusy("Generating captions");
    setError("");
    try {
      const buffer = await media.current.sound(a);
      if (!buffer) throw new Error("Selected clip has no audio");
      const cropped = await trimAudioToWav(
        audioWav(buffer),
        clip.offset / p.fps,
        (clip.offset + clip.duration) / p.fps,
      );
      if (cropped.size > 24 * 1024 * 1024)
        throw new Error(
          "Selected audio is too long for one caption request. Split into shorter clips first.",
        );
      const form = new FormData();
      form.append("file", cropped, "selected-clip.wav");
      const { data, error } = await supabase.functions.invoke(
        "transcribe-video",
        { body: form },
      );
      if (error)
        throw new Error(
          error instanceof FunctionsHttpError
            ? await error.context.text()
            : error.message,
        );
      const cues = splitIntoCues(data.text ?? ""),
        t = p.tracks.find((t) => t.kind === "text");
      if (!t || !cues.length) throw new Error("No speech found");
      let start = clip.start;
      const each = Math.max(1, Math.floor(clip.duration / cues.length));
      const added = cues.map((text, i) => {
        const c = newClip(
          t,
          start,
          i === cues.length - 1 ? clip.start + clip.duration - start : each,
          "Caption " + (i + 1),
        );
        c.text = text;
        c.fontSize = 42;
        c.transform.y = 87;
        start += each;
        return c;
      });
      change({ ...p, clips: [...p.clips, ...added] });
      toast.info(
        "Caption text generated. Timings are estimated; review before export.",
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Caption generation failed");
    } finally {
      setBusy("");
    }
  };
  if (loading || (!ready && user))
    return (
      <main className="p-20 flex justify-center">
        <Loader2 className="animate-spin" />
      </main>
    );
  if (!user)
    return (
      <main className="min-h-screen flex flex-col items-center justify-center gap-4">
        <h1 className="text-3xl">Complete Video Editor</h1>
        <Button asChild>
          <Link to="/auth">Sign in</Link>
        </Button>
      </main>
    );
  return (
    <div className="bg-background text-foreground min-h-screen pb-20">
      <header className="border-b border-border">
        <div className="max-w-5xl mx-auto py-4 px-4 flex flex-wrap items-center gap-3">
          <Button variant="ghost" size="icon" asChild title="Back to editor">
            <Link to="/editor">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-secondary font-semibold">U⚡️Sportz</p>
            <h1 className="text-xl">Complete Video Editor</h1>
          </div>
          <Button
            size="sm"
            onClick={() => void exportFile()}
            disabled={!!busy || !p.clips.length}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 py-4 space-y-4">
        <div className="flex flex-wrap gap-2 items-center">
          <Input
            className="max-w-[230px] h-8"
            aria-label="Project name"
            value={p.name}
            onChange={(e) => change({ ...p, name: e.target.value })}
          />
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Save className="h-3 w-3" />
            {saved}
          </span>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              if (
                confirm(
                  "Start a new local project? Export your current project first.",
                )
              ) {
                history.current = [];
                future.current = [];
                setP(newProject());
                setSelected(null);
                setFrame(0);
              }
            }}
          >
            <Plus className="h-3 w-3 mr-1" />
            New
          </Button>
        </div>
        {error && (
          <p role="alert" className="text-sm text-destructive break-words">
            {error}
          </p>
        )}
        {busy && (
          <div role="status" className="flex items-center gap-2 text-xs">
            <Loader2 className="h-4 w-4 animate-spin" />
            {busy} {progress > 0 ? `${progress}%` : ""}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => abort.current?.abort()}
              disabled={
                !["Rendering highlight", "Tracking target"].includes(busy)
              }
            >
              Cancel
            </Button>
          </div>
        )}
        <div className="grid lg:grid-cols-[190px_minmax(0,1fr)_235px] gap-4">
          <section className="min-w-0 border-b lg:border-b-0 lg:border-r border-border lg:pr-3 pb-3">
            <div className="flex gap-1 mb-3">
              {[
                ["media", Layers],
                ["audio", Music],
                ["text", Type],
                ["fx", Flame],
              ].map(([name, Icon]) => {
                const I = Icon as typeof Layers;
                return (
                  <Button
                    key={String(name)}
                    size="icon"
                    variant={tab === name ? "secondary" : "ghost"}
                    title={String(name)}
                    aria-label={String(name)}
                    onClick={() => setTab(String(name))}
                  >
                    <I className="h-4 w-4" />
                  </Button>
                );
              })}
            </div>
            <div className="max-h-64 lg:max-h-[430px] overflow-y-auto space-y-2">
              {tab === "media" && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full"
                    onClick={() => upload.current?.click()}
                    disabled={!!busy}
                  >
                    <Upload className="h-3 w-3 mr-2" />
                    Import media
                  </Button>
                  {p.assets
                    .filter((a) => a.kind !== "audio")
                    .map((a) => (
                      <Button
                        key={a.id}
                        variant="ghost"
                        className="w-full h-auto text-left justify-start py-2"
                        onClick={() => addAsset(a)}
                      >
                        <Plus className="h-3 w-3 shrink-0 mr-2" />
                        <span className="truncate text-xs">
                          {a.name}
                          <span className="block text-muted-foreground">
                            {a.duration.toFixed(1)}s · {a.kind}
                          </span>
                        </span>
                      </Button>
                    ))}
                </>
              )}
              {tab === "audio" && (
                <>
                  <Button
                    size="sm"
                    variant={recording ? "destructive" : "outline"}
                    className="w-full"
                    onClick={() => void record()}
                    disabled={!!busy}
                  >
                    {recording ? (
                      <Square className="h-3 w-3 mr-2" />
                    ) : (
                      <Mic className="h-3 w-3 mr-2" />
                    )}
                    {recording ? "Stop voiceover" : "Record voiceover"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full"
                    onClick={() => upload.current?.click()}
                  >
                    <Upload className="h-3 w-3 mr-2" />
                    Personal audio
                  </Button>
                  {(["swish", "impact", "whistle"] as const).map((kind) => (
                    <Button
                      key={kind}
                      size="sm"
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        const a = sportsSound(kind),
                          t = p.tracks.find((t) => t.kind === "audio");
                        if (t)
                          change({
                            ...p,
                            assets: [...p.assets, a],
                            clips: [
                              ...p.clips,
                              newClip(
                                t,
                                frame,
                                Math.round(a.duration * p.fps),
                                a.name,
                                a.id,
                              ),
                            ],
                          });
                      }}
                    >
                      {kind === "swish"
                        ? "Hoop swish"
                        : kind === "impact"
                          ? "Sports impact"
                          : "Referee whistle"}
                    </Button>
                  ))}
                  {p.assets
                    .filter((a) => a.kind === "audio")
                    .map((a) => (
                      <Button
                        key={a.id}
                        variant="ghost"
                        className="w-full h-auto text-xs justify-start"
                        onClick={() => addAsset(a)}
                      >
                        <Plus className="h-3 w-3 shrink-0 mr-1" />
                        <span className="truncate">{a.name}</span>
                      </Button>
                    ))}
                  <div className="border-t border-border pt-3">
                    <p className="text-sm font-semibold">Licensed music</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      No rights-cleared tracks available.
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full"
                    disabled={!clip?.assetId}
                    onClick={separate}
                  >
                    Separate clip audio
                  </Button>
                </>
              )}
              {tab === "text" && (
                <>
                  {[
                    "PLAYER NAME",
                    "TEAM · 24 – 18",
                    "PTS 24  |  AST 8",
                    "YOUR NEXT HIGHLIGHT",
                    "🏆",
                    "⚡",
                  ].map((text) => (
                    <Button
                      key={text}
                      size="sm"
                      variant="outline"
                      className="w-full text-xs"
                      onClick={() => addText(text)}
                    >
                      <Type className="h-3 w-3 mr-2" />
                      {text}
                    </Button>
                  ))}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="w-full"
                    onClick={() => void captions()}
                    disabled={!clip?.assetId || !!busy}
                  >
                    <Captions className="h-3 w-3 mr-2" />
                    Automatic captions
                  </Button>
                </>
              )}
              {tab === "fx" && (
                <>
                  <h2 className="text-lg">Sports FX</h2>
                  <select
                    aria-label="Sport FX category"
                    value={sport}
                    onChange={(e) => setSport(e.target.value)}
                    className="w-full bg-background border border-input rounded h-8 text-xs px-2"
                  >
                    {[
                      "Basketball",
                      "Football",
                      "Soccer",
                      "Baseball",
                      "Fitness",
                    ].map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                  {sportsFx
                    .filter((f) => f.sport === sport)
                    .map((f) => (
                      <Button
                        key={f.id}
                        variant="outline"
                        size="sm"
                        className="w-full text-xs justify-start"
                        onClick={() => addFx(f.id)}
                      >
                        <Flame className="h-3 w-3 mr-2 shrink-0" />
                        <span className="truncate">{f.name}</span>
                      </Button>
                    ))}
                </>
              )}
            </div>
            <input
              hidden
              type="file"
              multiple
              accept="video/*,audio/*,image/*"
              ref={upload}
              onChange={(e) => {
                void importFiles(Array.from(e.target.files ?? []));
                e.target.value = "";
              }}
            />
          </section>
          <section className="min-w-0 space-y-3">
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                void importFiles(Array.from(e.dataTransfer.files));
              }}
              className="bg-muted/30 border border-border aspect-video relative overflow-hidden rounded-md"
            >
              <canvas
                aria-label="Edited project preview"
                ref={canvas}
                className="w-full h-full object-contain"
              />
              {!p.clips.length && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                  <Layers className="h-9 w-9 text-primary" />
                  <Button
                    variant="outline"
                    onClick={() => upload.current?.click()}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Import video
                  </Button>
                </div>
              )}
            </div>
            <div className="flex justify-center items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                aria-label="Go to start"
                title="Go to start"
                onClick={() => seek(0)}
              >
                <SkipBack className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Previous frame"
                title="Previous frame"
                onClick={() => seek(frame - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="default"
                size="icon"
                aria-label={playing ? "Pause timeline" : "Play timeline"}
                title={playing ? "Pause" : "Play"}
                disabled={!!busy || !p.clips.length}
                onClick={() => setPlaying(!playing)}
              >
                {playing ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Next frame"
                title="Next frame"
                onClick={() => seek(frame + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <span className="text-xs font-mono ml-2">
                {Math.floor(frame / p.fps)}s :{" "}
                {String(frame % p.fps).padStart(2, "0")}
              </span>
            </div>
            <Slider
              aria-label="Frame scrubber"
              step={1}
              min={0}
              max={endFrame(p) - 1}
              value={[frame]}
              onValueChange={([n]) => seek(n)}
            />
            <div className="flex justify-center flex-wrap gap-1">
              <Button
                variant="outline"
                size="sm"
                disabled={!clip}
                onClick={() =>
                  patch({
                    transform: {
                      ...clip?.transform,
                      x: 72,
                      y: 28,
                      scale: 0.32,
                    } as Clip["transform"],
                    composition: "fit",
                  })
                }
              >
                Picture in picture
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={!clip}
                onClick={() =>
                  patch({
                    transform: {
                      ...clip?.transform,
                      x: 25,
                      y: 50,
                      scale: 1,
                    } as Clip["transform"],
                    composition: "left",
                  })
                }
              >
                Split left
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={!clip}
                onClick={() =>
                  patch({
                    transform: {
                      ...clip?.transform,
                      x: 75,
                      y: 50,
                      scale: 1,
                    } as Clip["transform"],
                    composition: "right",
                  })
                }
              >
                Split right
              </Button>
            </div>
          </section>
          <section className="min-w-0 border-t lg:border-t-0 lg:border-l border-border pt-3 lg:pt-0 lg:pl-3">
            {clip ? (
              <Inspector
                p={p}
                c={clip}
                frame={frame}
                patch={patch}
                remove={() => {
                  change({
                    ...p,
                    clips: p.clips.filter((c) => c.id !== clip.id),
                  });
                  setSelected(null);
                }}
                duplicate={() => {
                  const c = {
                    ...clip,
                    id: crypto.randomUUID(),
                    start: clip.start + clip.duration,
                  };
                  change({ ...p, clips: [...p.clips, c] });
                  setSelected(c.id);
                }}
                track={() => void tracking()}
                busy={!!busy}
              />
            ) : (
              <div className="text-sm text-muted-foreground flex items-center gap-2">
                <Layers className="h-4 w-4" />
                No clip selected
              </div>
            )}
          </section>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            title="Undo"
            aria-label="Undo"
            disabled={!history.current.length}
            onClick={() => {
              const prev = history.current.pop();
              if (prev) {
                future.current.push(p);
                setP(prev);
              }
            }}
          >
            <Undo2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            title="Redo"
            aria-label="Redo"
            disabled={!future.current.length}
            onClick={() => {
              const next = future.current.pop();
              if (next) {
                history.current.push(p);
                setP(next);
              }
            }}
          >
            <Redo2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            title="Split clip"
            aria-label="Split clip"
            disabled={!clip}
            onClick={() => {
              if (clip)
                change({
                  ...p,
                  clips: p.clips.flatMap((c) =>
                    c.id === clip.id ? splitClip(c, frame) : [c],
                  ),
                });
            }}
          >
            <Scissors className="h-4 w-4" />
          </Button>
          <span className="text-xs text-muted-foreground ml-auto">Zoom</span>
          <Slider
            className="w-24"
            aria-label="Timeline zoom"
            min={30}
            max={150}
            value={[zoom]}
            onValueChange={([n]) => setZoom(n)}
          />
        </div>
        <Timeline
          project={p}
          frame={frame}
          selected={selected}
          zoom={zoom}
          onFrame={seek}
          onSelect={setSelected}
          onChange={change}
        />
        {output && (
          <section className="border-t border-border pt-4 space-y-3">
            <h2 className="text-xl">Rendered highlight</h2>
            <video
              aria-label="Rendered highlight"
              controls
              src={output}
              className="max-h-72 max-w-full"
            />
            <Button asChild>
              <a
                href={output}
                download={`${p.name.replace(/[^a-z0-9]/gi, "-")}.webm`}
              >
                <Download className="h-4 w-4 mr-2" />
                Download highlight
              </a>
            </Button>
          </section>
        )}
      </main>
    </div>
  );
}
