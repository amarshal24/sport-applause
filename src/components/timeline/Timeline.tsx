import { useRef } from "react";
import { Eye, EyeOff, Volume2, VolumeX, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  type Project,
  type TrackKind,
  compatible,
  moveClip,
  endFrame,
} from "@/lib/timeline/model";
interface Props {
  project: Project;
  frame: number;
  selected: string | null;
  zoom: number;
  onFrame: (n: number) => void;
  onSelect: (id: string) => void;
  onChange: (p: Project) => void;
}
export default function Timeline({
  project: p,
  frame,
  selected,
  zoom,
  onFrame,
  onSelect,
  onChange,
}: Props) {
  const drag = useRef<{
    id: string;
    x: number;
    start: number;
    trackId: string;
  } | null>(null);
  const width = Math.max(680, (endFrame(p) / p.fps + 3) * zoom),
    unit = zoom / p.fps;
  const commit = (e: React.PointerEvent) => {
    const d = drag.current;
    drag.current = null;
    if (!d) return;
    const target =
      document
        .elementFromPoint(e.clientX, e.clientY)
        ?.closest("[data-track]")
        ?.getAttribute("data-track") ?? d.trackId;
    onChange({
      ...p,
      clips: p.clips.map((c) =>
        c.id === d.id
          ? moveClip(
              c,
              compatible(p, c, target) ? target : d.trackId,
              d.start + (e.clientX - d.x) / unit,
            )
          : c,
      ),
    });
  };
  return (
    <section
      aria-label="Multi-track timeline"
      className="border-y border-border bg-card min-w-0"
    >
      <div className="overflow-x-auto">
        <div style={{ width: width + 110 }} className="relative">
          <div className="h-9 flex border-b border-border">
            <span className="w-[110px] shrink-0 text-xs p-2 text-muted-foreground">
              {p.fps} FPS
            </span>
            <div
              className="relative flex-1 cursor-crosshair"
              aria-label="Timeline ruler"
              onPointerDown={(e) => {
                const r = e.currentTarget.getBoundingClientRect();
                onFrame(
                  Math.max(
                    0,
                    Math.min(
                      endFrame(p) - 1,
                      Math.round((e.clientX - r.left) / unit),
                    ),
                  ),
                );
              }}
            >
              {Array.from({ length: Math.floor(width / zoom) + 1 }, (_, s) => (
                <span
                  key={s}
                  style={{ left: s * zoom }}
                  className="absolute text-[10px] font-mono border-l border-border pl-1 pt-2 h-full"
                >
                  {s}s
                </span>
              ))}
            </div>
          </div>
          {p.tracks.map((track) => (
            <div
              key={track.id}
              data-track={track.id}
              className="flex h-[62px] border-b border-border last:border-b-0"
            >
              <div className="sticky left-0 w-[110px] shrink-0 z-10 bg-card px-2 py-1 border-r border-border">
                <span className="text-xs font-semibold block truncate">
                  {track.name}
                </span>
                <div className="flex">
                  <Button
                    className="h-6 w-7"
                    size="icon"
                    variant="ghost"
                    title={track.hidden ? "Show track" : "Hide track"}
                    aria-label={`Visibility ${track.name}`}
                    onClick={() =>
                      onChange({
                        ...p,
                        tracks: p.tracks.map((t) =>
                          t.id === track.id ? { ...t, hidden: !t.hidden } : t,
                        ),
                      })
                    }
                  >
                    {track.hidden ? (
                      <EyeOff className="h-3 w-3" />
                    ) : (
                      <Eye className="h-3 w-3" />
                    )}
                  </Button>
                  <Button
                    className="h-6 w-7"
                    size="icon"
                    variant="ghost"
                    title={track.muted ? "Unmute track" : "Mute track"}
                    aria-label={`Mute ${track.name}`}
                    onClick={() =>
                      onChange({
                        ...p,
                        tracks: p.tracks.map((t) =>
                          t.id === track.id ? { ...t, muted: !t.muted } : t,
                        ),
                      })
                    }
                  >
                    {track.muted ? (
                      <VolumeX className="h-3 w-3" />
                    ) : (
                      <Volume2 className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              </div>
              <div className="relative flex-1 bg-muted/20" onPointerUp={commit}>
                {p.clips
                  .filter((c) => c.trackId === track.id)
                  .map((c) => (
                    <div
                      key={c.id}
                      style={{
                        left: c.start * unit,
                        width: Math.max(14, c.duration * unit),
                      }}
                      onPointerDown={(e) => {
                        if (e.button !== 0) return;
                        e.currentTarget.setPointerCapture(e.pointerId);
                        drag.current = {
                          id: c.id,
                          x: e.clientX,
                          start: c.start,
                          trackId: c.trackId,
                        };
                        onSelect(c.id);
                      }}
                      onPointerUp={commit}
                      role="button"
                      tabIndex={0}
                      aria-label={`Clip ${c.name}`}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") onSelect(c.id);
                        if (e.key === "ArrowLeft" || e.key === "ArrowRight")
                          onChange({
                            ...p,
                            clips: p.clips.map((a) =>
                              a.id === c.id
                                ? moveClip(
                                    c,
                                    c.trackId,
                                    c.start + (e.key === "ArrowRight" ? 1 : -1),
                                  )
                                : a,
                            ),
                          });
                      }}
                      className={`absolute top-2 bottom-2 border rounded cursor-grab touch-none overflow-hidden px-2 py-1 ${selected === c.id ? "ring-2 ring-ring" : ""} ${track.kind === "video" ? "bg-primary/25 border-primary/50" : track.kind === "audio" ? "bg-accent/50 border-accent" : track.kind === "text" ? "bg-secondary/20 border-secondary/50" : "bg-muted border-muted-foreground/40"}`}
                    >
                      <span className="text-[11px] font-semibold whitespace-nowrap">
                        {c.name}
                      </span>
                      <div className="flex gap-1 mt-1">
                        {c.keys.map((k) => (
                          <span
                            key={k.frame}
                            className="absolute text-[8px] text-secondary"
                            style={{ left: k.frame * unit }}
                          >
                            ◆
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
          <div
            style={{ left: 110 + frame * unit }}
            className="absolute top-0 bottom-0 w-px bg-secondary pointer-events-none z-20"
          >
            <span className="block w-2 h-2 bg-secondary -translate-x-1 rotate-45" />
          </div>
        </div>
      </div>
      <div className="p-2 flex flex-wrap gap-2">
        {(["video", "audio", "text", "effects"] as TrackKind[]).map((kind) => (
          <Button
            key={kind}
            size="sm"
            variant="ghost"
            onClick={() =>
              onChange({
                ...p,
                tracks: [
                  ...p.tracks,
                  {
                    id: crypto.randomUUID(),
                    name: `${kind} ${p.tracks.filter((t) => t.kind === kind).length + 1}`,
                    kind,
                    muted: false,
                    hidden: false,
                  },
                ],
              })
            }
          >
            <Plus className="h-3 w-3 mr-1" />
            {kind}
          </Button>
        ))}
      </div>
    </section>
  );
}
