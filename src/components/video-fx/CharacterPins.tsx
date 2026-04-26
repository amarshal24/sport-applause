import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Plus, X, User } from "lucide-react";
import { cn } from "@/lib/utils";

// ===== Catalog =====
export const CHARACTER_ANIMATIONS = [
  { id: "none", label: "None", emoji: "—" },
  { id: "speed-lines", label: "Speed Lines", emoji: "💨" },
  { id: "fire-aura", label: "Fire Aura", emoji: "🔥" },
  { id: "sparkle", label: "Sparkle", emoji: "✨" },
  { id: "lightning", label: "Lightning", emoji: "⚡" },
  { id: "shockwave", label: "Shockwave", emoji: "💥" },
  { id: "glow", label: "Glow", emoji: "🌟" },
] as const;

export const CHARACTER_SKINS = [
  { id: "athlete", label: "Athlete", emoji: "🏃" },
  { id: "baller", label: "Baller", emoji: "🏀" },
  { id: "footballer", label: "Footballer", emoji: "🏈" },
  { id: "soccer", label: "Soccer Pro", emoji: "⚽" },
  { id: "boxer", label: "Boxer", emoji: "🥊" },
  { id: "ninja", label: "Ninja", emoji: "🥷" },
  { id: "hero", label: "Superhero", emoji: "🦸" },
  { id: "champ", label: "Champion", emoji: "🏆" },
] as const;

export type CharacterAnimationId = (typeof CHARACTER_ANIMATIONS)[number]["id"];
export type CharacterSkinId = (typeof CHARACTER_SKINS)[number]["id"];

export interface CharacterPin {
  id: string;
  // Position as percent (0-100) of the container
  x: number;
  y: number;
  skin: CharacterSkinId;
  animation: CharacterAnimationId;
}

export const MAX_PINS = 2;

// ===== Overlay (renders on top of the video) =====
interface OverlayProps {
  pins: CharacterPin[];
  onMove: (id: string, x: number, y: number) => void;
  onRemove: (id: string) => void;
  /** When true, tapping empty space drops a new pin at that location */
  placeMode?: boolean;
  onPlace?: (x: number, y: number) => void;
}

export const CharacterPinsOverlay = ({
  pins,
  onMove,
  onRemove,
  placeMode = false,
  onPlace,
}: OverlayProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragId, setDragId] = useState<string | null>(null);

  const handlePointerDown = (e: React.PointerEvent, id: string) => {
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setDragId(id);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragId || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    onMove(dragId, Math.max(0, Math.min(100, x)), Math.max(0, Math.min(100, y)));
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (dragId) {
      (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
      setDragId(null);
    }
  };

  const handleContainerClick = (e: React.MouseEvent) => {
    if (!placeMode || !onPlace || !containerRef.current) return;
    if (pins.length >= MAX_PINS) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    onPlace(Math.max(0, Math.min(100, x)), Math.max(0, Math.min(100, y)));
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        "absolute inset-0",
        placeMode ? "pointer-events-auto cursor-crosshair" : "pointer-events-none"
      )}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onClick={handleContainerClick}
    >
      {placeMode && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-medium shadow-lg pointer-events-none animate-pulse">
          Tap on the video to place a character ({pins.length}/{MAX_PINS})
        </div>
      )}
      {pins.map((pin) => {
        const skin = CHARACTER_SKINS.find((s) => s.id === pin.skin)!;
        return (
          <div
            key={pin.id}
            className={cn(
              "absolute pointer-events-auto select-none group",
              "cursor-grab active:cursor-grabbing"
            )}
            style={{
              left: `${pin.x}%`,
              top: `${pin.y}%`,
              transform: "translate(-50%, -50%)",
            }}
            onPointerDown={(e) => handlePointerDown(e, pin.id)}
          >
            {/* Animation auras (purely visual) */}
            {pin.animation === "speed-lines" && (
              <div className="absolute inset-0 -z-10 flex items-center justify-center">
                <div className="w-24 h-24 rounded-full bg-gradient-to-r from-transparent via-white/40 to-transparent blur-md animate-pulse" />
              </div>
            )}
            {pin.animation === "fire-aura" && (
              <div className="absolute inset-0 -z-10 flex items-center justify-center">
                <div className="w-20 h-20 rounded-full bg-destructive opacity-70 blur-xl animate-pulse" />
              </div>
            )}
            {pin.animation === "sparkle" && (
              <div className="absolute -top-3 -right-3 text-xl animate-pulse">✨</div>
            )}
            {pin.animation === "lightning" && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-2xl animate-pulse">
                ⚡
              </div>
            )}
            {pin.animation === "shockwave" && (
              <div className="absolute inset-0 -z-10 flex items-center justify-center">
                <div className="w-24 h-24 rounded-full border-4 border-primary/60 animate-ping" />
              </div>
            )}
            {pin.animation === "glow" && (
              <div className="absolute inset-0 -z-10 flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-primary/40 blur-2xl animate-pulse" />
              </div>
            )}

            {/* Character emoji */}
            <div className="text-4xl drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]">
              {skin.emoji}
            </div>

            {/* Remove button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove(pin.id);
              }}
              className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Remove pin"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        );
      })}
    </div>
  );
};

// ===== Sidebar / Panel UI to add and configure pins =====
interface PanelProps {
  pins: CharacterPin[];
  onAdd: () => void;
  onUpdate: (id: string, patch: Partial<CharacterPin>) => void;
  onRemove: (id: string) => void;
}

export const CharacterPinsPanel = ({ pins, onAdd, onUpdate, onRemove }: PanelProps) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">Character Pins</p>
          <p className="text-xs text-muted-foreground">
            Add up to {MAX_PINS} characters. Drag on the video to reposition.
          </p>
        </div>
        <Button
          size="sm"
          onClick={onAdd}
          disabled={pins.length >= MAX_PINS}
          className="gap-1"
        >
          <Plus className="h-4 w-4" />
          Add ({pins.length}/{MAX_PINS})
        </Button>
      </div>

      {pins.length === 0 && (
        <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          <User className="h-6 w-6 mx-auto mb-2 opacity-60" />
          No characters yet. Tap "Add" to drop one onto your video.
        </div>
      )}

      {pins.map((pin, idx) => (
        <div key={pin.id} className="rounded-lg border border-border p-3 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Character {idx + 1}</p>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onRemove(pin.id)}
              className="h-7 w-7 p-0 text-destructive"
              aria-label="Remove character"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Skin picker */}
          <div>
            <p className="text-xs text-muted-foreground mb-2">Avatar Skin</p>
            <div className="grid grid-cols-4 gap-2">
              {CHARACTER_SKINS.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => onUpdate(pin.id, { skin: s.id })}
                  className={cn(
                    "rounded-md border p-2 flex flex-col items-center gap-1 transition-colors",
                    pin.skin === s.id
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <span className="text-xl">{s.emoji}</span>
                  <span className="text-[10px] truncate w-full">{s.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Animation picker */}
          <div>
            <p className="text-xs text-muted-foreground mb-2">Animation</p>
            <div className="grid grid-cols-4 gap-2">
              {CHARACTER_ANIMATIONS.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => onUpdate(pin.id, { animation: a.id })}
                  className={cn(
                    "rounded-md border p-2 flex flex-col items-center gap-1 transition-colors",
                    pin.animation === a.id
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <span className="text-lg">{a.emoji}</span>
                  <span className="text-[10px] truncate w-full">{a.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// ===== Hook for state =====
export const useCharacterPins = () => {
  const [pins, setPins] = useState<CharacterPin[]>([]);

  const add = () => {
    setPins((prev) => {
      if (prev.length >= MAX_PINS) return prev;
      return [
        ...prev,
        {
          id: `pin-${Date.now()}`,
          x: 50,
          y: 50,
          skin: "athlete",
          animation: "none",
        },
      ];
    });
  };

  const update = (id: string, patch: Partial<CharacterPin>) =>
    setPins((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));

  const remove = (id: string) => setPins((prev) => prev.filter((p) => p.id !== id));

  const move = (id: string, x: number, y: number) =>
    setPins((prev) => prev.map((p) => (p.id === id ? { ...p, x, y } : p)));

  return { pins, add, update, remove, move };
};
