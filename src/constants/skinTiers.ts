// Skin swap purchase tiers. Each tier unlocks every skin in it *and* all
// lower tiers. Pro FX pack / membership owners get every tier.

export type SkinTier = "free" | "starter" | "pro" | "elite";

export const SKIN_TIER_RANK: Record<SkinTier, number> = {
  free: 0,
  starter: 1,
  pro: 2,
  elite: 3,
};

/** price_id (lookup key) → tier unlocked */
export const SKIN_TIER_PRICE_IDS: Record<string, SkinTier> = {
  skin_starter_onetime: "starter",
  skin_pro_onetime: "pro",
  skin_elite_onetime: "elite",
};

export const SKIN_TIERS = [
  {
    tier: "starter" as SkinTier,
    priceId: "skin_starter_onetime",
    label: "Skin Pack Starter",
    price: "$2.99",
    hint: "19 fantasy & sci-fi skin swaps",
  },
  {
    tier: "pro" as SkinTier,
    priceId: "skin_pro_onetime",
    label: "Skin Pack Pro",
    price: "$5.99",
    hint: "Starter + beast mode skins & elite objects",
  },
  {
    tier: "elite" as SkinTier,
    priceId: "skin_elite_onetime",
    label: "Skin Pack Elite",
    price: "$9.99",
    hint: "Every skin, legends included, plus future drops",
  },
];

const STARTER_SKINS = new Set([
  "dragon", "vampire", "zombie", "cyborg", "genie", "merman", "elf", "astronaut",
  "meteor", "tornado", "crown", "diamond", "moneybag", "explosion", "ufo",
  "portalring", "snowflake", "skull", "guitar",
]);

const PRO_SKINS = new Set([
  "gorilla", "cheetah", "eagle", "bull", "shark", "wolf", "tiger",
  "clock", "cash", "ring", "jet", "comet-obj", "galaxy-orb", "bomb",
]);

const ELITE_SKINS = new Set([
  "phoenix", "samurai", "knight", "pirate", "mecha",
  "wings", "halo", "trident",
]);

export const skinTierOf = (id: string): SkinTier => {
  if (ELITE_SKINS.has(id)) return "elite";
  if (PRO_SKINS.has(id)) return "pro";
  if (STARTER_SKINS.has(id)) return "starter";
  return "free";
};

export const hasSkinTier = (owned: SkinTier, needed: SkinTier) =>
  SKIN_TIER_RANK[owned] >= SKIN_TIER_RANK[needed];
