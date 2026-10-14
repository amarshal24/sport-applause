import { useEffect, useMemo, useRef, useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Scissors, Crop, Captions } from "lucide-react";

export interface HighlightEdits {
  start: number;
  end: number;
  duration: number;
  aspect: number | null; // null = original
  caption: string;
}

const CROPS: { label: string; value: number | null }[] = [
  { label: "Original", value: null },
  { label: "Square", value: 1 },
  { label: "Vertical 9:16", value: 9 / 16 },
  { label: "Wide 16:9", value: 16 / 9 },
];

const fmt = (s: number) => `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, "0")}`;

interface Props {
  file: File;
  edits: HighlightEdits;
  onChange: (e: HighlightEdits) => void;
}

const HighlightEditor = ({ file, edits, onChange }: Props) => {
  const url = useMemo(() => URL.createObjectURL(file), [file]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [natural, setNatural] = useState<number>(16 / 9);

  useEffect(() => () => URL.revokeObjectURL(url), [url]);

  // Loop playback inside the trim range
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onTime = () => {
      if (v.currentTime >= edits.end || v.currentTime < edits.start - 0.1) v.currentTime = edits.start;
    };
    v.addEventListener("timeupdate", onTime);
    return () => v.removeEventListener("timeupdate", onTime);
  }, [edits.start, edits.end]);

  const ratio = edits.aspect ?? natural;

  return (
    <div className="space-y-4">
      <div className="flex justify-center bg-muted/40 rounded-lg p-2">
        <div
          className="relative overflow-hidden rounded-md bg-background max-h-64 w-full"
          style={{ aspectRatio: ratio, maxWidth: `calc(16rem * ${ratio})` }}
        >
          <video
            ref={videoRef}
            src={url}
            className="absolute inset-0 w-full h-full object-cover"
            muted
            playsInline
            autoPlay
            loop
            onLoadedMetadata={(e) => {
              const v = e.currentTarget;
              const d = isFinite(v.duration) ? v.duration : 0;
              if (v.videoWidth && v.videoHeight) setNatural(v.videoWidth / v.videoHeight);
              if (!edits.duration && d) onChange({ ...edits, start: 0, end: d, duration: d });
            }}
          />
          {edits.caption.trim() && (
            <p className="absolute bottom-2 inset-x-2 text-center font-bold text-sm text-foreground [text-shadow:0_0_4px_hsl(var(--background)),0_0_8px_hsl(var(--background))]">
              {edits.caption}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label className="flex items-center gap-2"><Scissors className="w-4 h-4" /> Trim</Label>
        {edits.duration > 0 ? (
          <>
            <Slider
              min={0}
              max={edits.duration}
              step={0.1}
              value={[edits.start, edits.end]}
              onValueChange={([s, e]) => {
                if (e - s < 0.5) return;
                onChange({ ...edits, start: s, end: e });
                if (videoRef.current) videoRef.current.currentTime = s;
              }}
              aria-label="Trim range"
            />
            <p className="text-xs text-muted-foreground">
              {fmt(edits.start)} – {fmt(edits.end)} ({(edits.end - edits.start).toFixed(1)}s)
            </p>
          </>
        ) : (
          <p className="text-xs text-muted-foreground">Loading clip…</p>
        )}
      </div>

      <div className="space-y-2">
        <Label className="flex items-center gap-2"><Crop className="w-4 h-4" /> Crop</Label>
        <div className="flex flex-wrap gap-2">
          {CROPS.map((c) => (
            <Button
              key={c.label}
              type="button"
              size="sm"
              variant={edits.aspect === c.value ? "default" : "outline"}
              onClick={() => onChange({ ...edits, aspect: c.value })}
            >
              {c.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="hl-caption" className="flex items-center gap-2"><Captions className="w-4 h-4" /> Caption</Label>
        <Input
          id="hl-caption"
          value={edits.caption}
          onChange={(e) => onChange({ ...edits, caption: e.target.value })}
          placeholder="Buzzer beater from half court!"
          maxLength={120}
        />
      </div>
    </div>
  );
};

export default HighlightEditor;
