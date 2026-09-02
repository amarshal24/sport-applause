// ============================================================
// AI Skin Swap presets → AR character rig styles.
// Mirrors the character skins offered in the Animation Center so
// the same superhero / athlete / beast skins can be rendered live
// on the AR camera (full-body via segmentation, or face-only).
// ============================================================

import type { CharacterStyle } from "@/lib/ar/characterRig";
import { skinTierOf } from "@/constants/skinTiers";

export interface ARSkinPreset extends CharacterStyle {
  emoji: string;
  /** Source id shared with the Animation Center skin swap list. */
  swapId: string;
}

type Raw = Omit<ARSkinPreset, "premium">;

const raw: Raw[] = [
  { swapId: "athlete", id: "athlete", label: "Athlete", emoji: "🏃", suit: "#0f172a", accent: "#22d3ee", skin: "#c98c5f", outline: "#020617" },
  { swapId: "baller", id: "baller", label: "Baller", emoji: "🏀", suit: "#7c2d12", accent: "#f97316", skin: "#b3743f", outline: "#1c0a03" },
  { swapId: "footballer", id: "footballer", label: "Footballer", emoji: "🏈", suit: "#14532d", accent: "#facc15", skin: "#d19a6a", outline: "#052e16", helmet: true },
  { swapId: "soccer", id: "soccer", label: "Soccer Pro", emoji: "⚽", suit: "#1e40af", accent: "#f8fafc", skin: "#e0b088", outline: "#0b1220" },
  { swapId: "boxer", id: "boxer", label: "Boxer", emoji: "🥊", suit: "#991b1b", accent: "#fbbf24", skin: "#c48551", outline: "#280505", mask: true },
  { swapId: "ninja", id: "ninja", label: "Ninja", emoji: "🥷", suit: "#111827", accent: "#ef4444", skin: "#8b5e3c", outline: "#000000", mask: true },
  { swapId: "hero", id: "hero", label: "Superhero", emoji: "🦸", suit: "#1d4ed8", accent: "#f97316", skin: "#f2c39b", outline: "#0b1220", glow: "#60a5fa", cape: true, mask: true },
  { swapId: "champ", id: "champ", label: "Champion", emoji: "🏆", suit: "#a16207", accent: "#fde68a", skin: "#d8a171", outline: "#3f2a03", glow: "#fbbf24" },
  { swapId: "wizard", id: "wizard", label: "Wizard", emoji: "🧙", suit: "#4c1d95", accent: "#c4b5fd", skin: "#e7c7a5", outline: "#1e1b4b", glow: "#a78bfa", cape: true },
  { swapId: "robot", id: "robot", label: "Robot", emoji: "🤖", suit: "#94a3b8", accent: "#38bdf8", skin: "#cbd5e1", outline: "#0f172a", glow: "#7dd3fc", helmet: true },
  { swapId: "alien", id: "alien", label: "Alien", emoji: "👽", suit: "#065f46", accent: "#a3e635", skin: "#86efac", outline: "#022c22", glow: "#4ade80" },
  { swapId: "ghost", id: "ghost", label: "Ghost", emoji: "👻", suit: "#7c3aed", accent: "#22d3ee", skin: "#ddd6fe", outline: "#1e1b4b", glow: "#a78bfa" },
  { swapId: "cowboy", id: "cowboy", label: "Cowboy", emoji: "🤠", suit: "#78350f", accent: "#fcd34d", skin: "#d9a066", outline: "#291003" },
  { swapId: "king", id: "king", label: "King", emoji: "👑", suit: "#581c87", accent: "#facc15", skin: "#e2ac7d", outline: "#2e1065", glow: "#fde68a", cape: true },
  { swapId: "dragon", id: "dragon", label: "Dragon", emoji: "🐲", suit: "#166534", accent: "#f97316", skin: "#4ade80", outline: "#052e16", glow: "#fb923c" },
  { swapId: "vampire", id: "vampire", label: "Vampire", emoji: "🧛", suit: "#111827", accent: "#dc2626", skin: "#e5e7eb", outline: "#000000", cape: true },
  { swapId: "zombie", id: "zombie", label: "Zombie", emoji: "🧟", suit: "#3f6212", accent: "#84cc16", skin: "#a3b18a", outline: "#1a2e05" },
  { swapId: "cyborg", id: "cyborg", label: "Cyborg", emoji: "🦾", suit: "#334155", accent: "#f43f5e", skin: "#cbd5e1", outline: "#020617", glow: "#fb7185", helmet: true },
  { swapId: "astronaut", id: "astronaut", label: "Astronaut", emoji: "🧑‍🚀", suit: "#e2e8f0", accent: "#2563eb", skin: "#f1f5f9", outline: "#1e293b", glow: "#93c5fd", helmet: true },
  { swapId: "gorilla", id: "gorilla", label: "Gorilla", emoji: "🦍", suit: "#1f2937", accent: "#4b5563", skin: "#374151", outline: "#030712", chibi: true },
  { swapId: "cheetah", id: "cheetah", label: "Cheetah", emoji: "🐆", suit: "#d97706", accent: "#1c1917", skin: "#fbbf24", outline: "#3b2005" },
  { swapId: "shark", id: "shark", label: "Shark", emoji: "🦈", suit: "#475569", accent: "#e2e8f0", skin: "#94a3b8", outline: "#0f172a" },
  { swapId: "wolf", id: "wolf", label: "Wolf", emoji: "🐺", suit: "#334155", accent: "#cbd5e1", skin: "#64748b", outline: "#020617" },
  { swapId: "tiger", id: "tiger", label: "Tiger", emoji: "🐯", suit: "#ea580c", accent: "#1c1917", skin: "#fdba74", outline: "#431407" },
  { swapId: "phoenix", id: "phoenix", label: "Phoenix", emoji: "🔥", suit: "#b91c1c", accent: "#facc15", skin: "#fdba74", outline: "#450a0a", glow: "#fb923c", cape: true },
  { swapId: "samurai", id: "samurai", label: "Samurai", emoji: "🗡️", suit: "#7f1d1d", accent: "#0f172a", skin: "#e0b088", outline: "#1c0505", helmet: true },
  { swapId: "knight", id: "knight", label: "Knight", emoji: "🛡️", suit: "#9ca3af", accent: "#1d4ed8", skin: "#d1d5db", outline: "#111827", helmet: true },
  { swapId: "pirate", id: "pirate", label: "Pirate", emoji: "🏴‍☠️", suit: "#1c1917", accent: "#dc2626", skin: "#d8a077", outline: "#0c0a09" },
  { swapId: "mecha", id: "mecha", label: "Mecha Suit", emoji: "🤖", suit: "#1e3a8a", accent: "#22d3ee", skin: "#cbd5e1", outline: "#020617", glow: "#67e8f9", helmet: true },
];

/** Every AI Skin Swap character available to the live AR camera. */
export const AR_SKIN_PRESETS: ARSkinPreset[] = raw.map((s) => ({
  ...s,
  premium: skinTierOf(s.swapId) !== "free",
}));

export const getARSkinPreset = (swapId: string) =>
  AR_SKIN_PRESETS.find((s) => s.swapId === swapId);
