import { useState, useRef, useEffect, Suspense, lazy } from "react";
import {
  trackObject,
  sampleTrack,
  shiftTrack,
  trackQuality,
  mergeTracks,
  lastGoodPoint,
  smoothTrack,
  WEAK_CONFIDENCE,
  type TrackPoint,
} from "@/lib/objectTracker";
import { detectTargets, type DetectedTarget } from "@/lib/autoDetect";


import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Plus, X, User, Sparkles, Package, Wand2, Lock, PlayCircle, Crosshair, Loader2, AlertTriangle, CheckCircle2, RotateCcw, Undo2, Redo2, Move, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import tutorialVideo from "@/assets/animation-center-tutorial.mp4.asset.json";
import { usePremium } from "@/hooks/usePremium";
import { UpgradeProModal } from "@/components/video-fx/UpgradeProModal";
import { SkinTiersModal } from "@/components/video-fx/SkinTiersModal";
import { hasSkinTier, skinTierOf } from "@/constants/skinTiers";
import { useSavedTracks, clipKeyOf } from "@/hooks/useSavedTracks";
import { SavedTrackControls } from "@/components/video-fx/SavedTrackControls";
import { PinDragPad } from "@/components/video-fx/PinDragPad";
import { TrackedPreview } from "@/components/video-fx/TrackedPreview";
import { useStyleHistory } from "@/hooks/useStyleHistory";
import { Slider } from "@/components/ui/slider";


import { Crown } from "lucide-react";

const AnimationTutorialLazy = lazy(() =>
  import("@/components/video-fx/AnimationTutorial").then((m) => ({ default: m.AnimationTutorial }))
);

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
  // ===== PRO animation filters =====
  { id: "inferno", label: "Inferno", emoji: "🔥", pro: true },
  { id: "neon-trail", label: "Neon Trail", emoji: "🟢", pro: true },
  { id: "shadow-clone", label: "Shadow Clone", emoji: "👥", pro: true },
  { id: "galaxy", label: "Galaxy", emoji: "🌌", pro: true },
  { id: "matrix", label: "Matrix", emoji: "🟩", pro: true },
  { id: "gold-aura", label: "Gold Aura", emoji: "🥇", pro: true },
  { id: "toxic-glow", label: "Toxic Glow", emoji: "☢️", pro: true },
  { id: "frost-nova", label: "Frost Nova", emoji: "🧊", pro: true },
  { id: "sonic-boom", label: "Sonic Boom", emoji: "🔊", pro: true },
  { id: "confetti-burst", label: "Confetti", emoji: "🎉", pro: true },
  { id: "plasma", label: "Plasma Burn", emoji: "🟣", pro: true },
  { id: "thunder-crown", label: "Thunder Crown", emoji: "👑", pro: true },
  { id: "afterimage", label: "Afterimage", emoji: "🎞️", pro: true },
  { id: "lava-steps", label: "Lava Steps", emoji: "🌋", pro: true },
  { id: "bubble-trail", label: "Bubble Trail", emoji: "🫧", pro: true },
  { id: "wind-tunnel", label: "Wind Tunnel", emoji: "🌬️", pro: true },
  { id: "star-shower", label: "Star Shower", emoji: "🌠", pro: true },
  { id: "hologram", label: "Hologram", emoji: "🛰️", pro: true },
  { id: "blood-moon", label: "Blood Moon", emoji: "🌑", pro: true },
  { id: "diamond-dust", label: "Diamond Dust", emoji: "💎", pro: true },
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
  // PRO characters
  { id: "dragon", label: "Dragon", emoji: "🐲", kind: "character", pro: true },
  { id: "vampire", label: "Vampire", emoji: "🧛", kind: "character", pro: true },
  { id: "zombie", label: "Zombie", emoji: "🧟", kind: "character", pro: true },
  { id: "cyborg", label: "Cyborg", emoji: "🦾", kind: "character", pro: true },
  { id: "genie", label: "Genie", emoji: "🧞", kind: "character", pro: true },
  { id: "merman", label: "Merfolk", emoji: "🧜", kind: "character", pro: true },
  { id: "elf", label: "Elf", emoji: "🧝", kind: "character", pro: true },
  { id: "astronaut", label: "Astronaut", emoji: "🧑‍🚀", kind: "character", pro: true },
  { id: "gorilla", label: "Gorilla", emoji: "🦍", kind: "character", pro: true },
  { id: "cheetah", label: "Cheetah", emoji: "🐆", kind: "character", pro: true },
  { id: "eagle", label: "Eagle", emoji: "🦅", kind: "character", pro: true },
  { id: "bull", label: "Bull", emoji: "🐂", kind: "character", pro: true },
  { id: "shark", label: "Shark", emoji: "🦈", kind: "character", pro: true },
  { id: "wolf", label: "Wolf", emoji: "🐺", kind: "character", pro: true },
  { id: "tiger", label: "Tiger", emoji: "🐯", kind: "character", pro: true },
  { id: "phoenix", label: "Phoenix", emoji: "🔥", kind: "character", pro: true },
  { id: "samurai", label: "Samurai", emoji: "🗡️", kind: "character", pro: true },
  { id: "knight", label: "Knight", emoji: "🛡️", kind: "character", pro: true },
  { id: "pirate", label: "Pirate", emoji: "🏴‍☠️", kind: "character", pro: true },
  { id: "mecha", label: "Mecha Suit", emoji: "🤖", kind: "character", pro: true },
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
  { id: "sharkfin", label: "Shark Fin", emoji: "🦈", kind: "object" },
  { id: "flame", label: "Flame", emoji: "🔥", kind: "object" },
  { id: "smokepuff", label: "Smoke Puff", emoji: "💨", kind: "object" },
  { id: "bolt", label: "Lightning Bolt", emoji: "⚡", kind: "object" },
  { id: "wave", label: "Wave", emoji: "🌊", kind: "object" },
  { id: "rocket", label: "Rocket", emoji: "🚀", kind: "object" },
  // PRO objects
  { id: "meteor", label: "Meteor", emoji: "☄️", kind: "object", pro: true },
  { id: "tornado", label: "Tornado", emoji: "🌪️", kind: "object", pro: true },
  { id: "crown", label: "Crown", emoji: "👑", kind: "object", pro: true },
  { id: "diamond", label: "Diamond", emoji: "💎", kind: "object", pro: true },
  { id: "moneybag", label: "Money Bag", emoji: "💰", kind: "object", pro: true },
  { id: "explosion", label: "Explosion", emoji: "💥", kind: "object", pro: true },
  { id: "ufo", label: "UFO", emoji: "🛸", kind: "object", pro: true },
  { id: "portalring", label: "Portal Ring", emoji: "🌀", kind: "object", pro: true },
  { id: "snowflake", label: "Snowflake", emoji: "❄️", kind: "object", pro: true },
  { id: "skull", label: "Skull", emoji: "💀", kind: "object", pro: true },
  { id: "guitar", label: "Guitar", emoji: "🎸", kind: "object", pro: true },
  { id: "clock", label: "Time Stop", emoji: "⏱️", kind: "object", pro: true },
  { id: "cash", label: "Cash Stack", emoji: "💵", kind: "object", pro: true },
  { id: "ring", label: "Championship Ring", emoji: "💍", kind: "object", pro: true },
  { id: "jet", label: "Jet Boost", emoji: "✈️", kind: "object", pro: true },
  { id: "comet-obj", label: "Comet", emoji: "🌠", kind: "object", pro: true },
  { id: "galaxy-orb", label: "Galaxy Orb", emoji: "🪐", kind: "object", pro: true },
  { id: "bomb", label: "Bomb Drop", emoji: "💣", kind: "object", pro: true },
  { id: "wings", label: "Wings", emoji: "🪽", kind: "object", pro: true },
  { id: "halo", label: "Halo", emoji: "😇", kind: "object", pro: true },
  { id: "trident", label: "Trident", emoji: "🔱", kind: "object", pro: true },
] as const;

// One-tap combos: object/character + animation
export const FX_PRESETS = [
  { id: "ball-on-fire", label: "Ball On Fire", emoji: "🔥", skin: "basketball", animation: "fire-aura", hint: "Basketball lit on fire" },
  { id: "flaming-hoop", label: "Flaming Hoop", emoji: "🏀", skin: "hoop", animation: "hoop-fire", hint: "Fire through the net" },
  { id: "smoke-trail", label: "Smoke Trail", emoji: "💨", skin: "smokepuff", animation: "smoke", hint: "Smoke behind a runner" },
  { id: "shark-swim", label: "Shark Fin", emoji: "🦈", skin: "sharkfin", animation: "speed-lines", hint: "Fin follows the swimmer" },
  { id: "speed-demon", label: "Speed Demon", emoji: "🏃", skin: "athlete", animation: "speed-lines", hint: "Blur lines on a sprinter" },
  { id: "electric-play", label: "Electric", emoji: "⚡", skin: "bolt", animation: "electric", hint: "Electric field burst" },
  { id: "comet-ball", label: "Comet Ball", emoji: "☄️", skin: "football", animation: "comet", hint: "Trail behind the ball" },
  { id: "ice-cold", label: "Ice Cold", emoji: "❄️", skin: "champ", animation: "ice", hint: "Freeze the moment" },
  // PRO one-tap combos
  { id: "dragon-fire", label: "Dragon Fire", emoji: "🐲", skin: "dragon", animation: "inferno", hint: "Breathe pure inferno", pro: true },
  { id: "meteor-dunk", label: "Meteor Dunk", emoji: "☄️", skin: "meteor", animation: "inferno", hint: "Meteor slam on the rim", pro: true },
  { id: "cheetah-blur", label: "Cheetah Blur", emoji: "🐆", skin: "cheetah", animation: "neon-trail", hint: "Neon speed streaks", pro: true },
  { id: "shadow-run", label: "Shadow Clones", emoji: "👥", skin: "athlete", animation: "shadow-clone", hint: "Triple-image afterburn", pro: true },
  { id: "galaxy-jam", label: "Galaxy Jam", emoji: "🌌", skin: "basketball", animation: "galaxy", hint: "Cosmic ball trail", pro: true },
  { id: "gold-mode", label: "Gold Mode", emoji: "🥇", skin: "crown", animation: "gold-aura", hint: "MVP golden aura", pro: true },
  { id: "twister", label: "Twister", emoji: "🌪️", skin: "tornado", animation: "sonic-boom", hint: "Spin-cycle blowout", pro: true },
  { id: "freeze-frame", label: "Freeze Frame", emoji: "🧊", skin: "snowflake", animation: "frost-nova", hint: "Ice-blast the moment", pro: true },
  { id: "matrix-move", label: "Matrix Move", emoji: "🟩", skin: "clock", animation: "matrix", hint: "Bullet-time code rain", pro: true },
  { id: "cash-out", label: "Cash Out", emoji: "💰", skin: "moneybag", animation: "confetti-burst", hint: "Confetti money drop", pro: true },
  { id: "phoenix-rise", label: "Phoenix Rise", emoji: "🔥", skin: "phoenix", animation: "lava-steps", hint: "Rise in flames", pro: true },
  { id: "wolf-pack", label: "Wolf Pack", emoji: "🐺", skin: "wolf", animation: "afterimage", hint: "Ghost-trail sprint", pro: true },
  { id: "shark-attack", label: "Shark Attack", emoji: "🦈", skin: "shark", animation: "bubble-trail", hint: "Bubbles in the lane", pro: true },
  { id: "jet-speed", label: "Jet Speed", emoji: "✈️", skin: "jet", animation: "wind-tunnel", hint: "Afterburner blast", pro: true },
  { id: "ring-night", label: "Ring Night", emoji: "💍", skin: "ring", animation: "diamond-dust", hint: "Championship shine", pro: true },
  { id: "holo-play", label: "Holo Play", emoji: "🛰️", skin: "mecha", animation: "hologram", hint: "Futuristic scan", pro: true },
  { id: "star-dunk", label: "Star Dunk", emoji: "🌠", skin: "comet-obj", animation: "star-shower", hint: "Falling star slam", pro: true },
  { id: "plasma-hit", label: "Plasma Hit", emoji: "🟣", skin: "bomb", animation: "plasma", hint: "Plasma impact burn", pro: true },
  { id: "king-strike", label: "King Strike", emoji: "👑", skin: "crown", animation: "thunder-crown", hint: "Thunder over the king", pro: true },
  { id: "blood-moon-run", label: "Blood Moon", emoji: "🌑", skin: "tiger", animation: "blood-moon", hint: "Dark red intensity", pro: true },
] as const;



export type CharacterAnimationId = (typeof CHARACTER_ANIMATIONS)[number]["id"];
export type CharacterSkinId = (typeof CHARACTER_SKINS)[number]["id"];

export interface CharacterPin {
  id: string;
  x: number;
  y: number;
  skin: CharacterSkinId;
  animation: CharacterAnimationId;
  /** Motion path when the pin is locked onto a real object in the clip. */
  track?: TrackPoint[];
  /** Unsmoothed tracker output, kept so stickiness can be re-applied live. */
  trackRaw?: TrackPoint[];
  /** 0..1 — how tightly the effect clings to the tracked path. */
  stickiness?: number;
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

/** Follows the playback time of the <video> rendered next to the overlay. */
const useNeighbourVideoTime = (containerRef: React.RefObject<HTMLDivElement>) => {
  const [time, setTime] = useState(0);

  useEffect(() => {
    let raf = 0;
    const findVideo = (): HTMLVideoElement | null => {
      let node: HTMLElement | null = containerRef.current?.parentElement ?? null;
      for (let i = 0; i < 3 && node; i++) {
        const v = node.querySelector("video");
        if (v) return v;
        node = node.parentElement;
      }
      return null;
    };

    const loop = () => {
      const v = findVideo();
      if (v) setTime(v.currentTime);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [containerRef]);

  return time;
};

export const CharacterPinsOverlay = ({
  pins,
  onMove,
  onRemove,
  placeMode = false,
  onPlace,
}: OverlayProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const videoTime = useNeighbourVideoTime(containerRef);

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
          Tap the object in the video ({pins.length}/{MAX_PINS})
        </div>
      )}
      {pins.map((pin) => {
        const skin = getSkin(pin.skin);
        const isObject = skin.kind === "object";
        // When the pin is locked onto an object, follow the tracked path.
        const tracked = dragId === pin.id ? null : sampleTrack(pin.track, videoTime);
        const px = tracked?.x ?? pin.x;
        const py = tracked?.y ?? pin.y;
        const weak = tracked ? (tracked.c ?? 1) < WEAK_CONFIDENCE : false;
        return (
          <div
            key={pin.id}
            className="absolute pointer-events-auto select-none group cursor-grab active:cursor-grabbing"
            style={{
              left: `${px}%`,
              top: `${py}%`,
              transform: "translate(-50%, -50%)",
            }}
            onPointerDown={(e) => handlePointerDown(e, pin.id)}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Tracker lost the object at this moment */}
            {weak && (
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-20 whitespace-nowrap rounded-full border border-destructive bg-destructive/85 px-2 py-0.5 text-[10px] font-medium text-destructive-foreground pointer-events-none">
                Tracking lost
              </div>
            )}
            {weak && (
              <div className="absolute -inset-4 -z-10 rounded-full border-2 border-dashed border-destructive/80 animate-pulse pointer-events-none" />
            )}



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
  onAdd: (preset?: { skin: CharacterSkinId; animation: CharacterAnimationId }) => void;
  onUpdate: (id: string, patch: Partial<CharacterPin>) => void;
  onRemove: (id: string) => void;
  /** Drops a pin at an exact spot — enables auto-detection. */
  onAddAt?: (
    x: number,
    y: number,
    preset?: { skin?: CharacterSkinId; animation?: CharacterAnimationId }
  ) => void;
  /** Clip being edited — enables "lock onto object" tracking. */
  videoSource?: File | Blob | string | null;
  /** Current playhead position of the preview, in seconds. */
  getCurrentTime?: () => number;
}

export const CharacterPinsPanel = ({
  pins,
  onAdd,
  onUpdate,
  onRemove,
  onAddAt,
  videoSource,
  getCurrentTime,
}: PanelProps) => {

  const characters = CHARACTER_SKINS.filter((s) => s.kind === "character");
  const objects = CHARACTER_SKINS.filter((s) => s.kind === "object");
  const full = pins.length >= MAX_PINS;
  const [howToOpen, setHowToOpen] = useState(false);
  const [trackingId, setTrackingId] = useState<string | null>(null);
  const [trackPct, setTrackPct] = useState(0);
  const [liveConf, setLiveConf] = useState<number | null>(null);
  const [autoRetry, setAutoRetry] = useState(false);
  const [failedIds, setFailedIds] = useState<
    Record<string, { message: string; lastGood: TrackPoint | null; partial?: TrackPoint[] }>
  >({});
  const [batch, setBatch] = useState<{ done: number; total: number } | null>(null);

  // ===== Auto-detection =====
  const [detecting, setDetecting] = useState(false);
  const [detectPct, setDetectPct] = useState(0);
  const [detected, setDetected] = useState<DetectedTarget[] | null>(null);
  // Manual overrides for what a detected target gets applied, keyed by detection index.
  const [detectOverrides, setDetectOverrides] = useState<
    Record<number, { skin?: CharacterSkinId; animation?: CharacterAnimationId }>
  >({});
  const [editingDetect, setEditingDetect] = useState<number | null>(null);

  // ===== AI Skin Swap live preview (non-destructive until committed) =====
  const [swapPreviewOn, setSwapPreviewOn] = useState(false);
  const [swapPreviewSkin, setSwapPreviewSkin] = useState<CharacterSkinId | null>(null);
  const [swapScope, setSwapScope] = useState<"all" | "selected" | "tracked">("all");
  const [selectedPinIds, setSelectedPinIds] = useState<string[]>([]);
  const swapSnapshot = useRef<Record<string, CharacterSkinId>>({});

  const togglePinSelected = (id: string) =>
    setSelectedPinIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );

  // ===== Undo / redo for skin & animation edits (before locking them in) =====
  const styleHistory = useStyleHistory<Partial<CharacterPin>>((id, patch) =>
    onUpdate(id, patch)
  );

  const changeStyle = (pin: CharacterPin, patch: Partial<CharacterPin>) => {
    const prev: Partial<CharacterPin> = {};
    (Object.keys(patch) as (keyof CharacterPin)[]).forEach((k) => {
      (prev as Record<string, unknown>)[k as string] = pin[k];
    });
    styleHistory.record(pin.id, prev, patch);
    onUpdate(pin.id, patch);
  };

  // ===== Drag-to-adjust position & stickiness of a (tracked) pin =====
  const nudgePin = (pin: CharacterPin, x: number, y: number) => {
    const dx = x - pin.x;
    const dy = y - pin.y;
    onUpdate(pin.id, {
      x,
      y,
      track: pin.track ? shiftTrack(pin.track, dx, dy) : undefined,
      trackRaw: pin.trackRaw ? shiftTrack(pin.trackRaw, dx, dy) : undefined,
    });
  };

  const setStickiness = (pin: CharacterPin, value: number) => {
    const raw = pin.trackRaw ?? pin.track;
    onUpdate(pin.id, {
      stickiness: value,
      track: raw ? smoothTrack(raw, value) ?? raw : pin.track,
      trackRaw: raw,
    });
  };

  const scopedPins = (scope = swapScope) =>
    scope === "selected"
      ? pins.filter((p) => selectedPinIds.includes(p.id))
      : scope === "tracked"
        ? pins.filter((p) => p.track?.length)
        : pins;

  const applySwapPreview = (skin: CharacterSkinId, scope = swapScope) => {
    setSwapPreviewSkin(skin);
    scopedPins(scope).forEach((p) => onUpdate(p.id, { skin }));
  };

  const rollbackSwapPreview = () => {
    pins.forEach((p) => {
      const prev = swapSnapshot.current[p.id];
      if (prev && prev !== p.skin) onUpdate(p.id, { skin: prev });
    });
    swapSnapshot.current = {};
  };

  const startSwapPreview = (scope = swapScope, skin?: CharacterSkinId) => {
    const targets = scopedPins(scope);
    if (targets.length === 0) {
      toast.info(
        scope === "selected"
          ? "Select at least one object to swap."
          : scope === "tracked"
            ? "No locked objects yet — track one first."
            : "Add or detect an object first."
      );
      return false;
    }
    swapSnapshot.current = Object.fromEntries(targets.map((p) => [p.id, p.skin]));
    setSwapPreviewOn(true);
    applySwapPreview(skin ?? swapPreviewSkin ?? targets[0].skin, scope);
    return true;
  };

  const toggleSwapPreview = (on: boolean) => {
    if (on) {
      startSwapPreview();
      return;
    }
    rollbackSwapPreview();
    setSwapPreviewOn(false);
  };

  const changeSwapScope = (scope: "all" | "selected" | "tracked") => {
    if (!swapPreviewOn) {
      setSwapScope(scope);
      return;
    }
    rollbackSwapPreview();
    const ok = startSwapPreview(scope);
    setSwapScope(scope);
    if (!ok) setSwapPreviewOn(false);
  };

  const commitSwapPreview = () => {
    const n = Object.keys(swapSnapshot.current).length;
    swapSnapshot.current = {};
    setSwapPreviewOn(false);
    toast.success(`Skin swap applied to ${n} object${n === 1 ? "" : "s"}.`);
  };




  const trackedCount = pins.filter((p) => p.track?.length).length;


  // ===== Saved tracking data (path + scores) reusable across re-edits =====
  const { tracks: savedTracks, saveTrack, deleteTrack } = useSavedTracks();
  const clipKey = clipKeyOf(videoSource);

  const handleSaveTrack = async (pin: CharacterPin, idx: number) => {
    if (!pin.track?.length) return;
    const q = trackQuality(pin.track);
    const saved = await saveTrack({
      label: `${getSkin(pin.skin).label} · Object ${idx + 1}`,
      clipKey: clipKey ?? `session:${Date.now()}`,
      clipDuration: pin.track[pin.track.length - 1]?.t ?? null,
      path: pin.track,
      avgConfidence: q?.average ?? null,
      worstConfidence: q?.worst ?? null,
      health: q?.health ?? null,
    });
    if (saved) toast.success("Track saved — reuse it on any effect later.");
    else toast.error("Couldn't save this track. Try again.");
  };

  const applySavedTrack = (pin: CharacterPin, path: TrackPoint[]) => {
    clearFailure(pin.id);
    onUpdate(pin.id, {
      trackRaw: path,
      track: smoothTrack(path, pin.stickiness ?? 0.6) ?? path,
    });
    toast.success("Saved track applied — pick any animation filter to re-render.");
  };


  const clearFailure = (id: string) =>
    setFailedIds((f) => {
      const { [id]: _drop, ...rest } = f;
      return rest;
    });

  /** Runs the tracker once and returns the raw path (no state writes on the pin). */
  const rawTrack = async (opts: {
    startTime: number;
    x: number;
    y: number;
    forwardOnly?: boolean;
  }) =>
    trackObject(videoSource!, {
      ...opts,
      onProgress: (pct, conf) => {
        setTrackPct(pct);
        if (typeof conf === "number") setLiveConf(conf);
      },
    });

  /**
   * Tracks a pin. When the lock is lost it automatically re-tracks once from
   * the last good frame and merges the recovered segment in.
   */
  const trackPin = async (
    pin: CharacterPin,
    mode: "fresh" | "from-last-good" = "fresh"
  ) => {
    setTrackingId(pin.id);
    setTrackPct(0);
    setLiveConf(null);
    clearFailure(pin.id);
    try {
      const failure = failedIds[pin.id];
      const seed =
        mode === "from-last-good" && failure?.lastGood
          ? failure.lastGood
          : null;

      let track = seed
        ? mergeTracks(
            failure?.partial,
            await rawTrack({
              startTime: seed.t,
              x: seed.x,
              y: seed.y,
              forwardOnly: true,
            }),
            seed.t
          )
        : await rawTrack({
            startTime: getCurrentTime?.() ?? 0,
            x: pin.x,
            y: pin.y,
          });

      let q = trackQuality(track);

      // Auto re-track: recover from the last frame the tracker was confident on.
      if (q && q.health !== "strong") {
        const good = lastGoodPoint(track);
        if (good && good.t > (track[0]?.t ?? 0)) {
          setAutoRetry(true);
          setTrackPct(0);
          const recovered = mergeTracks(
            track,
            await rawTrack({
              startTime: good.t,
              x: good.x,
              y: good.y,
              forwardOnly: true,
            }),
            good.t
          );
          const rq = trackQuality(recovered);
          if (rq && rq.average >= q.average) {
            track = recovered;
            q = rq;
          }
          setAutoRetry(false);
        }
      }

      if (!q || q.health === "lost") {
        setFailedIds((f) => ({
          ...f,
          [pin.id]: {
            message:
              "Lost the object even after an auto re-track. Restart the tracker below.",
            lastGood: lastGoodPoint(track),
            partial: track,
          },
        }));
        onUpdate(pin.id, { track: undefined });
        return false;
      }
      const stick = pin.stickiness ?? 0.6;
      onUpdate(pin.id, {
        trackRaw: track,
        track: smoothTrack(track, stick) ?? track,
        stickiness: stick,
      });
      return true;
    } catch (err) {
      console.error("Object tracking failed", err);
      setFailedIds((f) => ({
        ...f,
        [pin.id]: {
          message: err instanceof Error ? err.message : "Tracking failed on this clip.",
          lastGood: null,
        },
      }));
      return false;
    } finally {
      setTrackingId(null);
      setTrackPct(0);
      setLiveConf(null);
      setAutoRetry(false);
    }
  };

  const runTracking = async (
    pin: CharacterPin,
    mode: "fresh" | "from-last-good" = "fresh"
  ) => {
    if (!videoSource) {
      toast.error("Load a clip first, then place the FX on the object.");
      return;
    }
    const ok = await trackPin(pin, mode);
    if (ok) toast.success("Locked on! The effect now follows the object.");
    else toast.error("Still losing the object — try restarting from a clearer frame.");
  };

  const runTrackAll = async () => {
    if (!videoSource) {
      toast.error("Load a clip first, then place the FX on the objects.");
      return;
    }
    const targets = pins.filter((p) => !p.track?.length);
    if (targets.length === 0) {
      toast.info("Every effect is already locked onto an object.");
      return;
    }
    let ok = 0;
    for (let i = 0; i < targets.length; i++) {
      setBatch({ done: i, total: targets.length });
      // eslint-disable-next-line no-await-in-loop
      if (await trackPin(targets[i])) ok++;
    }
    setBatch(null);
    if (ok === targets.length) toast.success(`Locked ${ok} object${ok > 1 ? "s" : ""} — each keeps its own effect.`);
    else toast.warning(`Locked ${ok}/${targets.length}. Restart the failed ones below.`);
  };

  // ===== Auto-detect movers in the clip =====
  const autoTrackPending = useRef(false);

  const runAutoDetect = async () => {
    if (!videoSource) {
      toast.error("Load a clip first, then run auto-detect.");
      return;
    }
    setDetecting(true);
    setDetectPct(0);
    setDetected(null);
    setDetectOverrides({});
    setEditingDetect(null);
    try {
      const found = await detectTargets(videoSource, {
        around: getCurrentTime?.() ?? undefined,
        max: MAX_PINS,
        onProgress: setDetectPct,
      });
      setDetected(found);
      if (found.length === 0) {
        toast.info("Nothing moving found here — scrub to an action moment and try again.");
      } else {
        toast.success(
          `Found ${found.length} mover${found.length > 1 ? "s" : ""} — add the ones you want.`
        );
      }
    } catch (err) {
      console.error("Auto-detect failed", err);
      toast.error(err instanceof Error ? err.message : "Auto-detect failed on this clip.");
    } finally {
      setDetecting(false);
      setDetectPct(0);
    }
  };

  /**
   * Picks a free-tier skin + animation that matches what the scan found:
   * fast little blobs read as a ball, big/tall ones read as a player,
   * and the motion strength decides how loud the effect should be.
   */
  const suggestedPreset = (
    t: DetectedTarget
  ): { skin: CharacterSkinId; animation: CharacterAnimationId; label: string } => {
    if (t.kind === "character") {
      if (t.score >= 0.66)
        return { skin: "athlete", animation: "speed-lines", label: "Athlete · Speed Lines" };
      if (t.score >= 0.4)
        return { skin: "athlete", animation: "fire-aura", label: "Athlete · Fire Aura" };
      return { skin: "athlete", animation: "glow", label: "Athlete · Glow" };
    }
    // Objects: a tiny, very fast blob is almost always the ball.
    if (t.size <= 8 && t.score >= 0.55)
      return { skin: "basketball", animation: "fire-aura", label: "Ball · Fire Aura" };
    if (t.size <= 8)
      return { skin: "basketball", animation: "comet", label: "Ball · Comet Trail" };
    if (t.score >= 0.6)
      return { skin: "bolt", animation: "lightning", label: "Object · Lightning" };
    return { skin: "flame", animation: "smoke", label: "Object · Smoke" };
  };


  /** Suggested preset with any manual override the user picked applied on top. */
  const effectivePreset = (t: DetectedTarget, i: number) => {
    const base = suggestedPreset(t);
    const o = detectOverrides[i] ?? {};
    const skin = o.skin ?? base.skin;
    const animation = o.animation ?? base.animation;
    const overridden = !!(o.skin || o.animation);
    const label = overridden
      ? `${getSkin(skin).label} · ${CHARACTER_ANIMATIONS.find((a) => a.id === animation)?.label ?? animation}`
      : base.label;
    return { skin, animation, label, overridden };
  };

  const addDetected = (indices: number[], autoTrack: boolean) => {
    if (!onAddAt || !detected) return;
    const room = MAX_PINS - pins.length;
    const picks = indices.slice(0, Math.max(0, room));
    if (picks.length === 0) {
      toast.info(`You already have the max of ${MAX_PINS} effects.`);
      return;
    }
    picks.forEach((i) => {
      const t = detected[i];
      if (!t) return;
      const { skin, animation } = effectivePreset(t, i);
      onAddAt(t.x, t.y, { skin, animation });
    });
    const dropped = new Set(picks);
    // Keep remaining overrides aligned with the re-indexed list.
    setDetectOverrides((prev) => {
      const next: typeof prev = {};
      let k = 0;
      detected.forEach((_t, i) => {
        if (dropped.has(i)) return;
        if (prev[i]) next[k] = prev[i];
        k += 1;
      });
      return next;
    });
    setEditingDetect(null);
    setDetected((prev) => (prev ? prev.filter((_t, i) => !dropped.has(i)) : prev));
    if (autoTrack) autoTrackPending.current = true;
  };


  // Lock the freshly detected pins onto their objects once they're mounted.
  useEffect(() => {
    if (!autoTrackPending.current) return;
    if (trackingId || batch) return;
    if (!pins.some((p) => !p.track?.length)) return;
    autoTrackPending.current = false;
    void runTrackAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pins]);






  const {
    isPremium,
    skinTier,
    upgradeOpen,
    requestUpgrade,
    closeUpgrade,
    skinStoreOpen,
    requestSkinTier,
    closeSkinStore,
  } = usePremium();

  const locked = (item: { pro?: boolean } | Record<string, unknown>) =>
    !!(item as { pro?: boolean }).pro && !isPremium;
  const guard = (item: { pro?: boolean } | Record<string, unknown>, action: () => void) => {
    if (locked(item)) {
      requestUpgrade();
      return;
    }
    action();
  };

  // Skins are sold in tiers (Starter / Pro / Elite) — gate them separately.
  const skinLocked = (id: string) => !hasSkinTier(skinTier, skinTierOf(id));
  const skinGuard = (id: string, action: () => void) => {
    if (skinLocked(id)) {
      requestSkinTier();
      return;
    }
    action();
  };


  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 text-primary" />
            Character & Object FX
          </p>
          <p className="text-xs text-muted-foreground">
            Add up to {MAX_PINS}. Track each object separately — every FX keeps its own skin & animation.
          </p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0"
            disabled={!styleHistory.canUndo}
            onClick={() => styleHistory.undo()}
            aria-label="Undo skin or animation change"
            title={`Undo (${styleHistory.undoCount})`}
          >
            <Undo2 className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0"
            disabled={!styleHistory.canRedo}
            onClick={() => styleHistory.redo()}
            aria-label="Redo skin or animation change"
            title={`Redo (${styleHistory.redoCount})`}
          >
            <Redo2 className="h-4 w-4" />
          </Button>
          <Button size="sm" onClick={() => onAdd()} disabled={full} className="gap-1">
            <Plus className="h-4 w-4" />
            Add ({pins.length}/{MAX_PINS})
          </Button>
        </div>
      </div>

      {/* Multi-object tracking */}
      {pins.length > 1 && (
        <div className="rounded-lg border border-border bg-card/60 p-2.5 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs font-medium flex items-center gap-1.5">
                <Crosshair className="h-3.5 w-3.5 text-primary" />
                Multi-object tracking
              </p>
              <p className="text-[11px] text-muted-foreground">
                {trackedCount}/{pins.length} effects locked onto an object.
              </p>
            </div>
            <Button
              size="sm"
              variant="secondary"
              className="h-7 text-xs gap-1 shrink-0"
              disabled={trackingId !== null}
              onClick={runTrackAll}
            >
              {batch ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  {batch.done + 1}/{batch.total}
                </>
              ) : (
                <>
                  <Crosshair className="h-3.5 w-3.5" />
                  Track all
                </>
              )}
            </Button>
          </div>
          {batch && (
            <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${Math.round(((batch.done + trackPct / 100) / batch.total) * 100)}%` }}
              />
            </div>
          )}
        </div>
      )}



      {/* Video preview: how to customize your video */}
      <button
        type="button"
        onClick={() => setHowToOpen(true)}
        className="w-full rounded-lg border border-border bg-card/60 p-2.5 flex items-center gap-3 text-left hover:bg-accent/60 transition-colors"
      >
        <div className="h-10 w-16 rounded-md overflow-hidden bg-muted relative shrink-0">
          <video
            src={(tutorialVideo as { url?: string })?.url}
            muted
            playsInline
            preload="metadata"
            className="h-full w-full object-cover"
          />
          <span className="absolute inset-0 flex items-center justify-center bg-background/40">
            <PlayCircle className="h-5 w-5 text-primary" />
          </span>
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium">Watch: customize your video</p>
          <p className="text-[11px] text-muted-foreground truncate">
            60-sec preview — filters, characters & saving
          </p>
        </div>
      </button>

      {howToOpen && (
        <Suspense fallback={null}>
          <AnimationTutorialLazy open={howToOpen} onOpenChange={setHowToOpen} />
        </Suspense>
      )}


      {/* One-tap FX combos */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          One-tap effects
        </p>
        <div className="grid grid-cols-2 gap-2">
          {FX_PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              disabled={full && !locked(p)}
              onClick={() =>
                guard(p, () =>
                  skinGuard(p.skin, () =>
                    onAdd({ skin: p.skin as CharacterSkinId, animation: p.animation as CharacterAnimationId })
                  )
                )
              }

              className={cn(
                "relative rounded-lg border border-border bg-card/60 p-2 text-left transition-colors hover:bg-accent/60",
                full && !locked(p) && "opacity-50 pointer-events-none",
                locked(p) && "border-primary/40"
              )}
            >
              <p className="text-sm font-medium flex items-center gap-1.5">
                <span>{p.emoji}</span>
                {p.label}
                {locked(p) && <Crown className="h-3 w-3 text-primary ml-auto" />}
              </p>
              <p className="text-[11px] text-muted-foreground truncate">{p.hint}</p>
            </button>
          ))}
        </div>
      </div>


      {/* Auto-detect movers in the clip */}
      {onAddAt && (
        <div className="rounded-lg border border-primary/40 bg-primary/5 p-3 space-y-2.5">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-md bg-primary/20 flex items-center justify-center shrink-0">
              <Wand2 className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">Auto-detect</p>
              <p className="text-xs text-muted-foreground">
                Scans the action and finds the players & balls in motion.
              </p>
            </div>
            <Button
              size="sm"
              className="h-7 text-xs gap-1 shrink-0"
              disabled={detecting || trackingId !== null || !videoSource}
              onClick={runAutoDetect}
            >
              {detecting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  {detectPct}%
                </>
              ) : (
                <>
                  <Wand2 className="h-3.5 w-3.5" />
                  Scan
                </>
              )}
            </Button>
          </div>

          {detecting && (
            <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${detectPct}%` }}
              />
            </div>
          )}

          {detected && detected.length > 0 && (
            <div className="space-y-2">
              <div className="space-y-1.5">
                {detected.map((t, i) => {
                  const preset = effectivePreset(t, i);
                  const open = editingDetect === i;
                  return (
                    <div
                      key={`${t.x}-${t.y}-${i}`}
                      className="rounded-md border border-border bg-card/70"
                    >
                      <div className="flex items-center gap-1.5 px-2 py-1.5 text-[11px]">
                        <span>{t.kind === "character" ? "🏃" : "🏀"}</span>
                        <span className="font-medium">
                          {t.kind === "character" ? "Player" : "Object"} {i + 1}
                        </span>
                        <span className="text-muted-foreground">{Math.round(t.score * 100)}%</span>
                        <span className="text-primary/90 truncate">{preset.label}</span>
                        {preset.overridden && (
                          <span className="text-[9px] uppercase tracking-wide text-muted-foreground">
                            custom
                          </span>
                        )}
                        <div className="ml-auto flex items-center gap-1 shrink-0">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 px-2 text-[11px]"
                            onClick={() => setEditingDetect(open ? null : i)}
                          >
                            {open ? "Done" : "Change"}
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            className="h-6 px-2 text-[11px] gap-1"
                            disabled={full}
                            onClick={() => addDetected([i], true)}
                          >
                            <Plus className="h-3 w-3" />
                            Add
                          </Button>
                        </div>
                      </div>

                      {open && (
                        <div className="border-t border-border p-2 space-y-2">
                          <div>
                            <p className="text-[10px] text-muted-foreground mb-1 flex items-center gap-1">
                              <User className="h-3 w-3" /> Skin
                            </p>
                            <div className="grid grid-cols-5 gap-1.5">
                              {CHARACTER_SKINS.map((s) => (
                                <button
                                  key={s.id}
                                  type="button"
                                  onClick={() =>
                                    skinGuard(s.id, () =>
                                      setDetectOverrides((prev) => ({
                                        ...prev,
                                        [i]: { ...prev[i], skin: s.id },
                                      }))
                                    )
                                  }
                                  className={cn(
                                    "relative rounded-md border p-1 flex flex-col items-center gap-0.5 transition-colors",
                                    preset.skin === s.id
                                      ? "border-primary bg-primary/10"
                                      : "border-border hover:border-primary/50",
                                    skinLocked(s.id) && "opacity-70"
                                  )}
                                >
                                  {skinLocked(s.id) && (
                                    <Lock className="absolute top-0 right-0 h-2.5 w-2.5 text-primary" />
                                  )}
                                  <span className="text-base">{s.emoji}</span>
                                  <span className="text-[9px] truncate w-full">{s.label}</span>
                                </button>
                              ))}
                            </div>
                          </div>

                          <div>
                            <p className="text-[10px] text-muted-foreground mb-1 flex items-center gap-1">
                              <Sparkles className="h-3 w-3" /> Animation
                            </p>
                            <div className="grid grid-cols-5 gap-1.5">
                              {CHARACTER_ANIMATIONS.map((a) => (
                                <button
                                  key={a.id}
                                  type="button"
                                  onClick={() =>
                                    guard(a, () =>
                                      setDetectOverrides((prev) => ({
                                        ...prev,
                                        [i]: { ...prev[i], animation: a.id },
                                      }))
                                    )
                                  }
                                  className={cn(
                                    "relative rounded-md border p-1 flex flex-col items-center gap-0.5 transition-colors",
                                    preset.animation === a.id
                                      ? "border-primary bg-primary/10"
                                      : "border-border hover:border-primary/50",
                                    locked(a) && "opacity-70"
                                  )}
                                >
                                  {locked(a) && (
                                    <Crown className="absolute top-0 right-0 h-2.5 w-2.5 text-primary" />
                                  )}
                                  <span className="text-base">{a.emoji}</span>
                                  <span className="text-[9px] truncate w-full">{a.label}</span>
                                </button>
                              ))}
                            </div>
                          </div>

                          {preset.overridden && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 px-2 text-[11px]"
                              onClick={() =>
                                setDetectOverrides((prev) => {
                                  const { [i]: _drop, ...rest } = prev;
                                  return rest;
                                })
                              }
                            >
                              Reset to suggested
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <Button
                size="sm"
                variant="secondary"
                className="h-7 w-full text-xs gap-1"
                disabled={full || trackingId !== null}
                onClick={() => addDetected(detected.map((_t, i) => i), true)}
              >
                <Crosshair className="h-3.5 w-3.5" />
                Add all & lock on
              </Button>
            </div>

          )}

          {detected && detected.length === 0 && !detecting && (
            <p className="text-[11px] text-muted-foreground">
              No movement detected here. Scrub to an action moment and scan again.
            </p>
          )}
        </div>
      )}

      {/* AI Skin Swap (preview) */}
      <div className="w-full rounded-lg border border-dashed border-primary/40 bg-primary/5 p-3 space-y-3">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-md bg-primary/20 flex items-center justify-center shrink-0">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium flex items-center gap-1.5">
              AI Skin Swap
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/20 text-primary uppercase tracking-wide">
                Beta
              </span>
            </p>
            <p className="text-xs text-muted-foreground truncate">
              Swap detected players & balls into full-body skins.
            </p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[10px] text-muted-foreground">Live preview</span>
            <Switch
              checked={swapPreviewOn}
              disabled={pins.length === 0}
              onCheckedChange={toggleSwapPreview}
              aria-label="Toggle AI Skin Swap live preview"
            />
          </div>
        </div>

        {pins.length === 0 ? (
          <p className="text-[11px] text-muted-foreground">
            Add or auto-detect at least one object to preview a skin swap.
          </p>
        ) : (
          <>
            {/* Which pins the swap hits */}
            <div className="flex items-center gap-1">
              {(
                [
                  { id: "all", label: `All (${pins.length})` },
                  { id: "selected", label: `Selected (${selectedPinIds.length})` },
                  { id: "tracked", label: `Locked (${trackedCount})` },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => changeSwapScope(opt.id)}
                  className={cn(
                    "flex-1 rounded-md border px-2 py-1 text-[10px] transition-colors",
                    swapScope === opt.id
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/50"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {swapScope === "selected" && selectedPinIds.length === 0 && (
              <p className="text-[11px] text-muted-foreground">
                Tick "Select" on the objects below to target them.
              </p>
            )}
          </>
        )}

        {pins.length > 0 && swapPreviewOn ? (
          <div className="space-y-2">
            <p className="text-[11px] text-muted-foreground">
              Previewing on {scopedPins().length} object{scopedPins().length > 1 ? "s" : ""} —
              nothing is saved until you commit.
            </p>

            <div className="grid grid-cols-5 gap-1.5">
              {CHARACTER_SKINS.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => skinGuard(s.id, () => applySwapPreview(s.id))}
                  className={cn(
                    "relative rounded-md border p-1 flex flex-col items-center gap-0.5 transition-colors",
                    swapPreviewSkin === s.id
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50",
                    skinLocked(s.id) && "opacity-70"
                  )}
                >
                  {skinLocked(s.id) && (
                    <Lock className="absolute top-0 right-0 h-2.5 w-2.5 text-primary" />
                  )}
                  <span className="text-base">{s.emoji}</span>
                  <span className="text-[9px] truncate w-full">{s.label}</span>
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1.5">
              <Button size="sm" className="h-7 text-xs flex-1" onClick={commitSwapPreview}>
                Commit swap
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs"
                onClick={() => toggleSwapPreview(false)}
              >
                Discard
              </Button>
            </div>
          </div>
        ) : null}
      </div>



      {pins.length === 0 && (
        <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          <User className="h-6 w-6 mx-auto mb-2 opacity-60" />
          Tap "Add" to drop a character or object onto your video.
        </div>
      )}

      {pins.map((pin, idx) => (
        <div key={pin.id} className="rounded-lg border border-border p-3 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium flex items-center gap-1.5">
              Object {idx + 1}
              <span className="text-[10px] text-muted-foreground">{getSkin(pin.skin).label}</span>
              {pin.track?.length ? (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/20 text-primary uppercase tracking-wide">
                  Tracked
                </span>
              ) : null}
            </p>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => togglePinSelected(pin.id)}
                className={cn(
                  "rounded-md border px-2 py-1 text-[10px] transition-colors",
                  selectedPinIds.includes(pin.id)
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:border-primary/50"
                )}
                aria-pressed={selectedPinIds.includes(pin.id)}
              >
                {selectedPinIds.includes(pin.id) ? "Selected" : "Select"}
              </button>
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

          </div>

          {/* Lock onto the real object in the video */}
          <div className="rounded-md border border-border bg-card/60 p-2.5 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs font-medium flex items-center gap-1.5">
                  <Crosshair className="h-3.5 w-3.5 text-primary" />
                  {pin.track?.length ? "Locked to object" : "Lock onto object"}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {pin.track?.length
                    ? "The effect follows this object through the clip."
                    : "Drag the FX onto the ball or player, then lock it on."}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {pin.track?.length || failedIds[pin.id] ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs"
                    disabled={trackingId !== null}
                    onClick={() => {
                      onUpdate(pin.id, { track: undefined, trackRaw: undefined });
                      setFailedIds((f) => {
                        const { [pin.id]: _drop, ...rest } = f;
                        return rest;
                      });
                    }}
                  >
                    Reset
                  </Button>
                ) : null}
                <Button
                  size="sm"
                  variant={pin.track?.length ? "outline" : "secondary"}
                  className="h-7 text-xs gap-1"
                  disabled={trackingId !== null}
                  onClick={() => runTracking(pin)}
                >
                  {trackingId === pin.id ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      {trackPct}%
                    </>
                  ) : (
                    <>
                      <Crosshair className="h-3.5 w-3.5" />
                      {pin.track?.length ? "Re-track" : "Track"}
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Save / reuse tracking data */}
            <SavedTrackControls
              tracks={savedTracks}
              clipKey={clipKey}
              canSave={!!pin.track?.length}
              disabled={trackingId !== null}
              onSave={() => handleSaveTrack(pin, idx)}
              onApply={(path) => applySavedTrack(pin, path)}
              onDelete={deleteTrack}
            />



            {/* Live progress + confidence while tracking */}
            {trackingId === pin.id && (
              <div className="space-y-1.5">
                <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${trackPct}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-muted-foreground">
                    {autoRetry ? "Auto re-tracking from last good frame…" : "Match confidence"}
                  </span>
                  <span
                    className={cn(
                      "font-medium",
                      liveConf === null
                        ? "text-muted-foreground"
                        : liveConf < WEAK_CONFIDENCE
                          ? "text-destructive"
                          : liveConf < 0.7
                            ? "text-amber-500"
                            : "text-emerald-500"
                    )}
                  >
                    {liveConf === null ? "measuring…" : `${Math.round(liveConf * 100)}%`}
                  </span>
                </div>
                {liveConf !== null && liveConf < WEAK_CONFIDENCE && (
                  <p className="text-[11px] text-destructive">
                    Losing the object — you'll likely need to reset and re-pick.
                  </p>
                )}
              </div>
            )}

            {/* Result quality once tracked */}
            {trackingId !== pin.id && pin.track?.length ? (() => {
              const q = trackQuality(pin.track);
              if (!q) return null;
              const tone =
                q.health === "strong"
                  ? "text-emerald-500"
                  : q.health === "shaky"
                    ? "text-amber-500"
                    : "text-destructive";
              return (
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className={cn("font-medium flex items-center gap-1", tone)}>
                      {q.health === "strong" ? (
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      ) : (
                        <AlertTriangle className="h-3.5 w-3.5" />
                      )}
                      {q.health === "strong"
                        ? "Strong lock"
                        : q.health === "shaky"
                          ? "Shaky lock"
                          : "Lost lock"}
                    </span>
                    <span className="text-muted-foreground">
                      avg {Math.round(q.average * 100)}% · low {Math.round(q.worst * 100)}%
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className={cn(
                        "h-full",
                        q.health === "strong"
                          ? "bg-emerald-500"
                          : q.health === "shaky"
                            ? "bg-amber-500"
                            : "bg-destructive"
                      )}
                      style={{ width: `${Math.round(q.average * 100)}%` }}
                    />
                  </div>
                  {q.health !== "strong" && (
                    <p className="text-[11px] text-muted-foreground">
                      {q.lostAt !== null
                        ? `Drifts around ${q.lostAt.toFixed(1)}s — reset and re-pick there for a cleaner lock.`
                        : "Re-track from a frame where the object is bigger and sharper."}
                    </p>
                  )}
                </div>
              );
            })() : null}

            {/* Failure state + restart choice */}
            {trackingId !== pin.id && failedIds[pin.id] && (
              <div className="rounded-md border border-destructive/40 bg-destructive/10 p-2 space-y-2">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-3.5 w-3.5 text-destructive mt-0.5 shrink-0" />
                  <p className="text-[11px] text-destructive">{failedIds[pin.id].message}</p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {failedIds[pin.id].lastGood && (
                    <Button
                      size="sm"
                      variant="secondary"
                      className="h-7 text-xs gap-1"
                      disabled={trackingId !== null}
                      onClick={() => runTracking(pin, "from-last-good")}
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      Restart at {failedIds[pin.id].lastGood!.t.toFixed(1)}s
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs gap-1"
                    disabled={trackingId !== null}
                    onClick={() => runTracking(pin, "fresh")}
                  >
                    <Crosshair className="h-3.5 w-3.5" />
                    Restart from beginning
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs"
                    onClick={() => clearFailure(pin.id)}
                  >
                    Dismiss
                  </Button>
                </div>
              </div>
            )}

          </div>




          {/* Characters */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <User className="h-3 w-3" /> Character Skin
              </p>
              <button
                type="button"
                onClick={requestSkinTier}
                className="text-[10px] font-medium text-primary hover:underline"
              >
                {skinTier === "elite" ? "All skins unlocked" : "Unlock skin packs"}
              </button>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {characters.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => skinGuard(s.id, () => changeStyle(pin, { skin: s.id }))}
                  className={cn(
                    "relative rounded-md border p-2 flex flex-col items-center gap-1 transition-colors",
                    pin.skin === s.id
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50",
                    skinLocked(s.id) && "opacity-70"
                  )}
                >
                  {skinLocked(s.id) && (
                    <span className="absolute top-0.5 right-0.5 flex items-center">
                      <Lock className="h-3 w-3 text-primary" />
                    </span>
                  )}
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
                  onClick={() => skinGuard(s.id, () => changeStyle(pin, { skin: s.id }))}
                  className={cn(
                    "relative rounded-md border p-2 flex flex-col items-center gap-1 transition-colors",
                    pin.skin === s.id
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50",
                    skinLocked(s.id) && "opacity-70"
                  )}
                >
                  {skinLocked(s.id) && (
                    <span className="absolute top-0.5 right-0.5 flex items-center">
                      <Lock className="h-3 w-3 text-primary" />
                    </span>
                  )}
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
                  onClick={() => guard(a, () => changeStyle(pin, { animation: a.id }))}
                  className={cn(
                    "relative rounded-md border p-2 flex flex-col items-center gap-1 transition-colors",
                    pin.animation === a.id
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50",
                    locked(a) && "opacity-70"
                  )}
                >
                  {locked(a) && (
                    <Crown className="absolute top-0.5 right-0.5 h-3 w-3 text-primary" />
                  )}
                  <span className="text-lg">{a.emoji}</span>
                  <span className="text-[10px] truncate w-full">{a.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      ))}

      <UpgradeProModal open={upgradeOpen} onClose={closeUpgrade} />
      <SkinTiersModal open={skinStoreOpen} onClose={closeSkinStore} />

    </div>
  );
};

// ===== Hook =====
export const useCharacterPins = () => {
  const [pins, setPins] = useState<CharacterPin[]>([]);

  const add = (preset?: { skin: CharacterSkinId; animation: CharacterAnimationId }) => {
    setPins((prev) => {
      if (prev.length >= MAX_PINS) return prev;
      return [
        ...prev,
        {
          id: `pin-${Date.now()}`,
          x: 50,
          y: 50,
          skin: preset?.skin ?? "athlete",
          animation: preset?.animation ?? "glow",
        },
      ];
    });
  };

  const addAt = (
    x: number,
    y: number,
    preset?: { skin?: CharacterSkinId; animation?: CharacterAnimationId }
  ) => {
    setPins((prev) => {
      if (prev.length >= MAX_PINS) return prev;
      return [
        ...prev,
        {
          id: `pin-${Date.now()}-${Math.round(Math.random() * 1e4)}`,
          x,
          y,
          skin: preset?.skin ?? "athlete",
          animation: preset?.animation ?? "glow",
        },
      ];
    });
  };


  const update = (id: string, patch: Partial<CharacterPin>) =>
    setPins((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));

  const remove = (id: string) => setPins((prev) => prev.filter((p) => p.id !== id));

  const move = (id: string, x: number, y: number) =>
    setPins((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              x,
              y,
              // Keep the locked path aligned when the pin is nudged by hand
              track: p.track ? shiftTrack(p.track, x - p.x, y - p.y) : undefined,
            }
          : p
      )
    );


  return { pins, add, addAt, update, remove, move };
};
