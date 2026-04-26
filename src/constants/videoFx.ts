// ============================================================
// Catalog of video FX: color filters, sport animations,
// character transforms. Each item is tagged FREE or PRO.
// ============================================================

export type FxTier = "free" | "pro";

export interface ColorFilterItem {
  id: string;
  label: string;
  // CSS filter string applied to the <video> element
  css: string;
  tier: FxTier;
}

export interface SportAnimationItem {
  id: string;
  label: string;
  emoji: string;
  sport:
    | "basketball"
    | "football"
    | "soccer"
    | "baseball"
    | "tennis"
    | "hockey"
    | "track"
    | "swimming";
  tier: FxTier;
}

export interface TransformItem {
  id: string;
  label: string;
  emoji: string;
  category: "anime" | "cartoon" | "superhero" | "athlete";
  tier: FxTier;
}

// ---------- Color Filters (all FREE) ----------
export const COLOR_FILTERS: ColorFilterItem[] = [
  { id: "original", label: "Original", css: "none", tier: "free" },
  { id: "vintage", label: "Vintage", css: "sepia(0.4) contrast(1.1) brightness(0.95)", tier: "free" },
  { id: "bw", label: "B&W", css: "grayscale(1) contrast(1.15)", tier: "free" },
  { id: "bright", label: "Bright", css: "brightness(1.15) saturate(1.1)", tier: "free" },
  { id: "warm", label: "Warm", css: "saturate(1.2) hue-rotate(-10deg) brightness(1.05)", tier: "free" },
  { id: "cool", label: "Cool", css: "saturate(1.1) hue-rotate(15deg) brightness(1.02)", tier: "free" },
];

// ---------- Sport Animations (mix of FREE and PRO) ----------
export const SPORT_ANIMATIONS: SportAnimationItem[] = [
  // Basketball
  { id: "bb-swish", label: "Swish", emoji: "🏀", sport: "basketball", tier: "free" },
  { id: "bb-dunk", label: "Dunk Slam", emoji: "💥", sport: "basketball", tier: "free" },
  { id: "bb-3pt", label: "3-Pointer", emoji: "🎯", sport: "basketball", tier: "pro" },
  { id: "bb-crossover", label: "Crossover", emoji: "👟", sport: "basketball", tier: "pro" },

  // Football
  { id: "fb-td", label: "Touchdown", emoji: "🏈", sport: "football", tier: "free" },
  { id: "fb-tackle", label: "Big Tackle", emoji: "💢", sport: "football", tier: "free" },
  { id: "fb-spiral", label: "Spiral Pass", emoji: "🌀", sport: "football", tier: "pro" },
  { id: "fb-fieldgoal", label: "Field Goal", emoji: "🥅", sport: "football", tier: "pro" },

  // Soccer
  { id: "sc-goal", label: "GOAL!", emoji: "⚽", sport: "soccer", tier: "free" },
  { id: "sc-bicycle", label: "Bicycle Kick", emoji: "🚴", sport: "soccer", tier: "pro" },
  { id: "sc-freekick", label: "Free Kick", emoji: "🎯", sport: "soccer", tier: "pro" },
  { id: "sc-save", label: "Keeper Save", emoji: "🧤", sport: "soccer", tier: "free" },

  // Baseball
  { id: "bs-homerun", label: "Home Run", emoji: "⚾", sport: "baseball", tier: "free" },
  { id: "bs-strike", label: "Strikeout", emoji: "🔥", sport: "baseball", tier: "pro" },
  { id: "bs-doubleplay", label: "Double Play", emoji: "⚡", sport: "baseball", tier: "pro" },
  { id: "bs-slide", label: "Steal Base", emoji: "💨", sport: "baseball", tier: "free" },

  // Tennis
  { id: "tn-ace", label: "Ace", emoji: "🎾", sport: "tennis", tier: "free" },
  { id: "tn-smash", label: "Smash", emoji: "💥", sport: "tennis", tier: "pro" },
  { id: "tn-rally", label: "Rally", emoji: "🔁", sport: "tennis", tier: "free" },
  { id: "tn-match", label: "Match Point", emoji: "🏆", sport: "tennis", tier: "pro" },

  // Hockey
  { id: "hk-goal", label: "Slap Shot", emoji: "🏒", sport: "hockey", tier: "free" },
  { id: "hk-check", label: "Body Check", emoji: "💢", sport: "hockey", tier: "pro" },
  { id: "hk-save", label: "Glove Save", emoji: "🧤", sport: "hockey", tier: "free" },
  { id: "hk-hattrick", label: "Hat Trick", emoji: "🎩", sport: "hockey", tier: "pro" },

  // Track
  { id: "tr-sprint", label: "Sprint", emoji: "🏃", sport: "track", tier: "free" },
  { id: "tr-finish", label: "Finish Line", emoji: "🏁", sport: "track", tier: "free" },
  { id: "tr-record", label: "World Record", emoji: "⏱️", sport: "track", tier: "pro" },
  { id: "tr-hurdle", label: "Hurdle Jump", emoji: "🚧", sport: "track", tier: "pro" },

  // Swimming
  { id: "sw-dive", label: "Dive", emoji: "🤽", sport: "swimming", tier: "free" },
  { id: "sw-stroke", label: "Power Stroke", emoji: "🏊", sport: "swimming", tier: "free" },
  { id: "sw-butterfly", label: "Butterfly", emoji: "🦋", sport: "swimming", tier: "pro" },
  { id: "sw-touch", label: "Wall Touch", emoji: "🏆", sport: "swimming", tier: "pro" },
];

export const SPORT_CATEGORIES: Array<{ id: SportAnimationItem["sport"] | "all"; label: string }> = [
  { id: "all", label: "All" },
  { id: "basketball", label: "Basketball" },
  { id: "football", label: "Football" },
  { id: "soccer", label: "Soccer" },
  { id: "baseball", label: "Baseball" },
  { id: "tennis", label: "Tennis" },
  { id: "hockey", label: "Hockey" },
  { id: "track", label: "Track" },
  { id: "swimming", label: "Swimming" },
];

// ---------- Character Transforms (12 items, mix) ----------
export const TRANSFORMS: TransformItem[] = [
  // Anime
  { id: "tr-saiyan", label: "Super Saiyan", emoji: "⚡", category: "anime", tier: "pro" },
  { id: "tr-ninja", label: "Ninja Mode", emoji: "🥷", category: "anime", tier: "free" },
  { id: "tr-pirate", label: "Pirate King", emoji: "🏴‍☠️", category: "anime", tier: "pro" },

  // Cartoon
  { id: "tr-looney", label: "Looney Style", emoji: "🐰", category: "cartoon", tier: "free" },
  { id: "tr-springfield", label: "Springfield", emoji: "🍩", category: "cartoon", tier: "pro" },
  { id: "tr-southpark", label: "Mountain Town", emoji: "❄️", category: "cartoon", tier: "pro" },

  // Superhero
  { id: "tr-speedster", label: "Speedster", emoji: "⚡", category: "superhero", tier: "free" },
  { id: "tr-webslinger", label: "Web Slinger", emoji: "🕷️", category: "superhero", tier: "pro" },
  { id: "tr-armored", label: "Armored Hero", emoji: "🤖", category: "superhero", tier: "pro" },

  // Athlete
  { id: "tr-baller", label: "Basketball Legend", emoji: "🏀", category: "athlete", tier: "free" },
  { id: "tr-boxer", label: "Boxing Champion", emoji: "🥊", category: "athlete", tier: "pro" },
  { id: "tr-speed", label: "Speed Demon", emoji: "💨", category: "athlete", tier: "free" },
];

export const TRANSFORM_CATEGORIES: Array<{
  id: TransformItem["category"] | "all";
  label: string;
}> = [
  { id: "all", label: "All" },
  { id: "anime", label: "Anime" },
  { id: "cartoon", label: "Cartoon" },
  { id: "superhero", label: "Superhero" },
  { id: "athlete", label: "Athlete" },
];
