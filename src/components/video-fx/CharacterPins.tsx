import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Plus, X, User, Sparkles, Package, Wand2, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// ===== Catalogs =====
export const CHARACTER_ANIMATIONS = [
  { id: "none", label: "None", emoji: "—" },
  { id: "speed-lines", label: "Speed Lines", emoji: "💨" },
  { id: "fire-aura", label: "Fire Aura", emoji: "🔥" },
  { id: "sparkle", label: "Sparkle", emoji: "✨" },
  { id: "lightning", label: "Lightning", emoji: "⚡" },
  { id: "shockwave", label: "Shockwave", emoji: "💥" },
  { id: "glow", label: "Glow", emoji: "🌟" },
  { id: "ice", label: "Ice Freeze", emoji: "❄️" },
  { id: "smoke", label: "Smoke", emoji: "🌫️" },
  { id: "rainbow", label: "Rainbow", emoji: "🌈" },
  { id: "portal", label: "Portal", emoji: "🌀" },
  { id: "comet", label: "Comet Trail", emoji: "☄️" },
  { id: "electric", label: "Electric Field", emoji: "🔌" },
  { id: "hoop-fire", label: "Fire Hoop", emoji: "🏀" },
] as const;

// Character skins (persons)
export const CHARACTER_SKINS = [
  { id: "athlete", label: "Athlete", emoji: "🏃", kind: "character" },
  { id: "baller", label: "Baller", emoji: "🏀", kind: "character" },
  { id: "footballer", label: "Footballer", emoji: "🏈", kind: "character" },
  { id: "soccer", label: "Soccer Pro", emoji: "⚽", kind: "character" },
  { id: "boxer", label: "Boxer", emoji: "🥊", kind: "character" },
  { id: "ninja", label: "Ninja", emoji: "🥷", kind: "character" },
  { id: "hero", label: "Superhero", emoji: "🦸", kind: "character" },
  { id: "champ", label: "Champion", emoji: "🏆", kind: "character" },
  { id: "wizard", label: "Wizard", emoji: "🧙", kind: "character" },
  { id: "robot", label: "Robot", emoji: "🤖", kind: "character" },
  { id: "alien", label: "Alien", emoji: "👽", kind: "character" },
  { id: "ghost", label: "Ghost", emoji: "👻", kind: "character" },
  { id: "cowboy", label: "Cowboy", emoji: "🤠", kind: "character" },
  { id: "king", label: "King", emoji: "👑", kind: "character" },
  // Objects
  { id: "basketball", label: "Basketball", emoji: "🏀", kind: "object" },
  { id: "football", label: "Football", emoji: "🏈", kind: "object" },
  { id: "soccerball", label: "Soccer Ball", emoji: "⚽", kind: "object" },
  { id: "baseball", label: "Baseball", emoji: "⚾", kind: "object" },
  { id: "tennisball", label: "Tennis Ball", emoji: "🎾", kind: "object" },
  { id: "hoop", label: "Hoop", emoji: "🥅", kind: "object" },
  { id: "target", label: "Target", emoji: "🎯", kind: "object" },
  { id: "trophy", label: "Trophy", emoji: "🏆", kind: "object" },
  { id: "medal", label: "Medal", emoji: "🥇", kind: "object" },
  { id: "flag", label: "Flag", emoji: "🏁", kind: "object" },
] as const;

export type CharacterAnimationId = (typeof CHARACTER_ANIMATIONS)[number]["id"];
export type CharacterSkinId = (typeof CHARACTER_SKINS)[number]["id"];

export interface CharacterPin {
  id: string;
  x: number;
  y: number;
  skin: CharacterSkinId;
  animation: CharacterAnimationId;
}

export const MAX_PINS = 6;

const getSkin = (id: CharacterSkinId) =>
  CHARACTER_SKINS.find((s) => s.id === id) ?? CHARACTER_SKINS[0];

// ===== Overlay =====
interface OverlayProps {
  pins: CharacterPin[];
  onMove: (id: string, x: number, y: number) => void;
  onRemove: (id: string) => void;
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
          Tap the video to place ({pins.length}/{MAX_PINS})
        </div>
      )}
      {pins.map((pin) => {
        const skin = getSkin(pin.skin);
        const isObject = skin.kind === "object";
        return (
          <div
            key={pin.id}
            className="absolute pointer-events-auto select-none group cursor-grab active:cursor-grabbing"
            style={{
              left: `${pin.x}%`,
              top: `${pin.y}%`,
              transform: "translate(-50%, -50%)",
            }}
            onPointerDown={(e) => handlePointerDown(e, pin.id)}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Auras */}
            {pin.animation === "speed-lines" && (
              <div className="absolute inset-0 -z-10 flex items-center justify-center">
                <div className="w-28 h-28 rounded-full bg-gradient-to-r from-transparent via-white/50 to-transparent blur-md animate-pulse" />
              </div>
            )}
            {pin.animation === "fire-aura" && (
              <div className="absolute inset-0 -z-10 flex items-center justify-center">
                <div className="w-24 h-24 rounded-full bg-orange-500 opacity-70 blur-xl animate-pulse" />
                <div className="absolute w-16 h-16 rounded-full bg-yellow-400 opacity-80 blur-lg animate-ping" />
              </div>
            )}
            {pin.animation === "sparkle" && (
              <>
                <div className="absolute -top-3 -right-3 text-xl animate-pulse">✨</div>
                <div className="absolute -bottom-2 -left-2 text-lg animate-pulse" style={{ animationDelay: "300ms" }}>✨</div>
              </>
            )}
            {pin.animation === "lightning" && (
              <>
                <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-3xl animate-pulse">⚡</div>
                <div className="absolute inset-0 -z-10 flex items-center justify-center">
                  <div className="w-20 h-20 rounded-full bg-yellow-300/60 blur-2xl animate-pulse" />
                </div>
              </>
            )}
            {pin.animation === "shockwave" && (
              <div className="absolute inset-0 -z-10 flex items-center justify-center">
                <div className="w-28 h-28 rounded-full border-4 border-primary/60 animate-ping" />
                <div className="absolute w-20 h-20 rounded-full border-2 border-primary/80 animate-ping" style={{ animationDelay: "250ms" }} />
              </div>
            )}
            {pin.animation === "glow" && (
              <div className="absolute inset-0 -z-10 flex items-center justify-center">
                <div className="w-20 h-20 rounded-full bg-primary/50 blur-2xl animate-pulse" />
              </div>
            )}
            {pin.animation === "ice" && (
              <div className="absolute inset-0 -z-10 flex items-center justify-center">
                <div className="w-24 h-24 rounded-full bg-cyan-300/60 blur-xl animate-pulse" />
                <div className="absolute -top-4 text-xl">❄️</div>
                <div className="absolute -bottom-4 text-xl">❄️</div>
              </div>
            )}
            {pin.animation === "smoke" && (
              <div className="absolute inset-0 -z-10 flex items-center justify-center">
                <div className="w-28 h-28 rounded-full bg-gray-400/60 blur-2xl animate-pulse" />
              </div>
            )}
            {pin.animation === "rainbow" && (
              <div className="absolute inset-0 -z-10 flex items-center justify-center">
                <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-red-500 via-yellow-400 to-blue-500 opacity-60 blur-xl animate-pulse" />
              </div>
            )}
            {pin.animation === "portal" && (
              <div className="absolute inset-0 -z-10 flex items-center justify-center">
                <div className="w-28 h-28 rounded-full bg-gradient-to-tr from-purple-600 via-fuchsia-500 to-blue-500 opacity-70 blur-md animate-spin" style={{ animationDuration: "3s" }} />
              </div>
            )}
            {pin.animation === "comet" && (
              <div className="absolute inset-0 -z-10">
                <div className="absolute top-1/2 right-full w-24 h-2 -translate-y-1/2 bg-gradient-to-l from-orange-400 via-yellow-300 to-transparent blur-sm animate-pulse" />
              </div>
            )}
            {pin.animation === "electric" && (
              <div className="absolute inset-0 -z-10 flex items-center justify-center">
                <div className="w-24 h-24 rounded-full border-2 border-cyan-300 animate-ping" />
                <div className="absolute text-lg animate-pulse">⚡</div>
              </div>
            )}
            {pin.animation === "hoop-fire" && (
              <div className="absolute inset-0 -z-10 flex items-center justify-center">
                <div className="w-32 h-32 rounded-full bg-gradient-to-t from-red-600 via-orange-500 to-yellow-300 opacity-80 blur-lg animate-pulse" />
                <div className="absolute w-20 h-20 rounded-full border-4 border-orange-400 animate-ping" />
              </div>
            )}

            {/* Skin */}
            <div className={cn(
              "drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]",
              isObject ? "text-5xl" : "text-4xl"
            )}>
              {skin.emoji}
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove(pin.id);
              }}
              className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Remove"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        );
      })}
    </div>
  );
};

// ===== Panel =====
interface PanelProps {
  pins: CharacterPin[];
  onAdd: () => void;
  onUpdate: (id: string, patch: Partial<CharacterPin>) => void;
  onRemove: (id: string) => void;
}

export const CharacterPinsPanel = ({ pins, onAdd, onUpdate, onRemove }: PanelProps) => {
  const characters = CHARACTER_SKINS.filter((s) => s.kind === "character");
  const objects = CHARACTER_SKINS.filter((s) => s.kind === "object");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 text-primary" />
            Character & Object FX
          </p>
          <p className="text-xs text-muted-foreground">
            Add up to {MAX_PINS}. Drag on the video to reposition.
          </p>
        </div>
        <Button size="sm" onClick={onAdd} disabled={pins.length >= MAX_PINS} className="gap-1">
          <Plus className="h-4 w-4" />
          Add ({pins.length}/{MAX_PINS})
        </Button>
      </div>

      {/* AI Skin Swap (coming soon) */}
      <button
        type="button"
        onClick={() =>
          toast.info("AI Skin Swap is coming soon", {
            description: "Auto-detect people & objects and replace them with new skins.",
          })
        }
        className="w-full rounded-lg border border-dashed border-primary/40 bg-primary/5 p-3 flex items-center gap-3 text-left hover:bg-primary/10 transition-colors"
      >
        <div className="h-9 w-9 rounded-md bg-primary/20 flex items-center justify-center">
          <Wand2 className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium flex items-center gap-1.5">
            AI Skin Swap
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/20 text-primary uppercase tracking-wide">
              Soon
            </span>
          </p>
          <p className="text-xs text-muted-foreground truncate">
            Auto-detect players & balls, swap them into full-body skins.
          </p>
        </div>
        <Lock className="h-4 w-4 text-muted-foreground" />
      </button>

      {pins.length === 0 && (
        <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          <User className="h-6 w-6 mx-auto mb-2 opacity-60" />
          Tap "Add" to drop a character or object onto your video.
        </div>
      )}

      {pins.map((pin, idx) => (
        <div key={pin.id} className="rounded-lg border border-border p-3 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">FX {idx + 1}</p>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onRemove(pin.id)}
              className="h-7 w-7 p-0 text-destructive"
              aria-label="Remove"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Characters */}
          <div>
            <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
              <User className="h-3 w-3" /> Character Skin
            </p>
            <div className="grid grid-cols-4 gap-2">
              {characters.map((s) => (
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

          {/* Objects */}
          <div>
            <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
              <Package className="h-3 w-3" /> Object Skin
            </p>
            <div className="grid grid-cols-4 gap-2">
              {objects.map((s) => (
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

          {/* Animation */}
          <div>
            <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
              <Sparkles className="h-3 w-3" /> Animation Filter
            </p>
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

// ===== Hook =====
export const useCharacterPins = () => {
  const [pins, setPins] = useState<CharacterPin[]>([]);

  const add = () => {
    setPins((prev) => {
      if (prev.length >= MAX_PINS) return prev;
      return [
        ...prev,
        { id: `pin-${Date.now()}`, x: 50, y: 50, skin: "athlete", animation: "glow" },
      ];
    });
  };

  const addAt = (x: number, y: number) => {
    setPins((prev) => {
      if (prev.length >= MAX_PINS) return prev;
      return [
        ...prev,
        { id: `pin-${Date.now()}`, x, y, skin: "athlete", animation: "glow" },
      ];
    });
  };

  const update = (id: string, patch: Partial<CharacterPin>) =>
    setPins((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));

  const remove = (id: string) => setPins((prev) => prev.filter((p) => p.id !== id));

  const move = (id: string, x: number, y: number) =>
    setPins((prev) => prev.map((p) => (p.id === id ? { ...p, x, y } : p)));

  return { pins, add, addAt, update, remove, move };
};
