import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Bookmark, BookmarkPlus, Trash2, Crosshair } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SavedTrack } from "@/hooks/useSavedTracks";
import type { TrackPoint } from "@/lib/objectTracker";

interface Props {
  tracks: SavedTrack[];
  /** Key of the clip currently being edited — matching tracks are listed first. */
  clipKey: string | null;
  canSave: boolean;
  disabled?: boolean;
  onSave: () => void;
  onApply: (path: TrackPoint[]) => void;
  onDelete: (id: string) => void;
}

const tone = (health: string | null) =>
  health === "strong"
    ? "text-emerald-500"
    : health === "shaky"
      ? "text-amber-500"
      : health === "lost"
        ? "text-destructive"
        : "text-muted-foreground";

export const SavedTrackControls = ({
  tracks,
  clipKey,
  canSave,
  disabled,
  onSave,
  onApply,
  onDelete,
}: Props) => {
  const [open, setOpen] = useState(false);
  const sameClip = tracks.filter((t) => clipKey && t.clipKey === clipKey);
  const otherClips = tracks.filter((t) => !clipKey || t.clipKey !== clipKey);

  const row = (t: SavedTrack) => (
    <div
      key={t.id}
      className="flex items-center gap-2 rounded-md border border-border p-2"
    >
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium truncate">{t.label}</p>
        <p className="text-[11px] text-muted-foreground">
          {t.path.length} pts
          {t.avgConfidence !== null && (
            <>
              {" · "}
              <span className={tone(t.health)}>
                avg {Math.round(t.avgConfidence * 100)}%
              </span>
            </>
          )}
        </p>
      </div>
      <Button
        size="sm"
        variant="secondary"
        className="h-7 text-xs gap-1 shrink-0"
        onClick={() => {
          onApply(t.path);
          setOpen(false);
        }}
      >
        <Crosshair className="h-3.5 w-3.5" />
        Apply
      </Button>
      <Button
        size="sm"
        variant="ghost"
        className="h-7 w-7 p-0 text-destructive shrink-0"
        aria-label={`Delete ${t.label}`}
        onClick={() => onDelete(t.id)}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  );

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <Button
        size="sm"
        variant="ghost"
        className="h-7 text-xs gap-1"
        disabled={!canSave || disabled}
        onClick={onSave}
      >
        <BookmarkPlus className="h-3.5 w-3.5" />
        Save track
      </Button>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-xs gap-1"
            disabled={disabled || tracks.length === 0}
          >
            <Bookmark className="h-3.5 w-3.5" />
            Reuse ({tracks.length})
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-72 p-2 space-y-2 max-h-80 overflow-y-auto">
          <p className="text-[11px] text-muted-foreground">
            Reuse a saved path — swap in any animation filter without re-tracking.
          </p>
          {sameClip.length > 0 && (
            <div className="space-y-1.5">
              <p className={cn("text-[10px] uppercase tracking-wide text-primary font-medium")}>
                This clip
              </p>
              {sameClip.map(row)}
            </div>
          )}
          {otherClips.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">
                Other clips
              </p>
              {otherClips.map(row)}
            </div>
          )}
          {tracks.length === 0 && (
            <p className="text-xs text-muted-foreground p-2">No saved tracks yet.</p>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
};
