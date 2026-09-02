import { RotateCcw, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { RIG_ANIMATIONS, type RigTuning } from "@/lib/ar/characterRig";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tuning: RigTuning;
  onChange: (patch: Partial<RigTuning>) => void;
  onReset: () => void;
  skinMode: "full" | "face";
  onSkinModeChange: (mode: "full" | "face") => void;
}

const Row = ({
  label,
  value,
  min,
  max,
  step,
  onChange,
  format,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  format?: (v: number) => string;
}) => (
  <div className="space-y-1">
    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
      <span>{label}</span>
      <span className="font-mono">{format ? format(value) : value.toFixed(2)}</span>
    </div>
    <Slider value={[value]} min={min} max={max} step={step} onValueChange={([v]) => onChange(v)} />
  </div>
);

/** Live skin/rig editor — every change feeds the render loop through refs. */
export const SkinEditorPanel = ({
  open,
  onOpenChange,
  tuning,
  onChange,
  onReset,
  skinMode,
  onSkinModeChange,
}: Props) => {
  if (!open) {
    return (
      <Button
        size="icon"
        variant="secondary"
        onClick={() => onOpenChange(true)}
        aria-label="Open skin editor"
      >
        <SlidersHorizontal className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <div className="max-h-[52vh] w-[min(320px,86vw)] space-y-3 overflow-y-auto rounded-xl bg-background/85 p-3 backdrop-blur">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold">Skin editor</span>
        <div className="flex gap-1">
          <Button size="icon" variant="ghost" onClick={onReset} aria-label="Reset rig">
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>
          <Button size="icon" variant="ghost" onClick={() => onOpenChange(false)} aria-label="Close skin editor">
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted/40 p-1 text-[11px]">
        {(["full", "face"] as const).map((m) => (
          <button
            key={m}
            onClick={() => onSkinModeChange(m)}
            className={cn(
              "rounded-md py-1 transition",
              skinMode === m ? "bg-primary text-primary-foreground" : "text-muted-foreground"
            )}
          >
            {m === "full" ? "Full body" : "Face only"}
          </button>
        ))}
      </div>

      <Row label="Scale" value={tuning.scale} min={0.5} max={2} step={0.01} onChange={(v) => onChange({ scale: v })} />
      <Row label="Bulk" value={tuning.bulk} min={0.5} max={2.2} step={0.01} onChange={(v) => onChange({ bulk: v })} />
      <Row label="Head size" value={tuning.headScale} min={0.5} max={2} step={0.01} onChange={(v) => onChange({ headScale: v })} />
      <Row label="Offset X" value={tuning.offsetX} min={-1} max={1} step={0.01} onChange={(v) => onChange({ offsetX: v })} />
      <Row label="Offset Y" value={tuning.offsetY} min={-1} max={1} step={0.01} onChange={(v) => onChange({ offsetY: v })} />
      <Row
        label="Lean"
        value={tuning.lean}
        min={-0.6}
        max={0.6}
        step={0.01}
        onChange={(v) => onChange({ lean: v })}
        format={(v) => `${Math.round((v * 180) / Math.PI)}°`}
      />
      <Row label="Glow" value={tuning.glow} min={0} max={3} step={0.05} onChange={(v) => onChange({ glow: v })} />
      <Row label="Opacity" value={tuning.opacity} min={0.2} max={1} step={0.02} onChange={(v) => onChange({ opacity: v })} />

      <div className="space-y-1">
        <span className="text-[11px] text-muted-foreground">Animation</span>
        <div className="flex flex-wrap gap-1">
          {RIG_ANIMATIONS.map((a) => (
            <button
              key={a.id}
              onClick={() => onChange({ animation: a.id })}
              className={cn(
                "rounded-full border px-2 py-1 text-[10px] transition",
                tuning.animation === a.id
                  ? "border-primary bg-primary/20 text-foreground"
                  : "border-border/60 text-muted-foreground"
              )}
            >
              {a.label}
            </button>
          ))}
        </div>
      </div>

      <Row label="Anim speed" value={tuning.animSpeed} min={0.1} max={4} step={0.05} onChange={(v) => onChange({ animSpeed: v })} />
      <Row label="Anim amount" value={tuning.animAmount} min={0} max={2.5} step={0.05} onChange={(v) => onChange({ animAmount: v })} />
    </div>
  );
};

export default SkinEditorPanel;
