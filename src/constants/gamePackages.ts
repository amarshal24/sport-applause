export type GamePackageId = "rookie" | "all_star" | "mvp";

export interface GamePackage {
  id: GamePackageId;
  name: string;
  priceCents: number;
  priceLabel: string;
  tagline: string;
  goal: string;
  includes: string[];
  status: "available" | "coming_soon";
}

export const GAME_PACKAGES: GamePackage[] = [
  {
    id: "rookie",
    name: "Rookie Pass",
    priceCents: 0,
    priceLabel: "FREE",
    tagline: "Casual games for everyone",
    goal: "Play every day",
    includes: ["Basketball shooting", "Soccer penalty kicks", "Football target passing", "Sports trivia", "Daily challenges"],
    status: "available",
  },
  {
    id: "all_star",
    name: "All-Star Pass",
    priceCents: 399,
    priceLabel: "$3.99/mo",
    tagline: "More sports and multiplayer experiences",
    goal: "More variety",
    includes: ["Everything in Rookie", "Multiplayer sports challenges", "Racing and bowling", "Arcade and puzzle games", "Exclusive cosmetics"],
    status: "coming_soon",
  },
  {
    id: "mvp",
    name: "MVP Unlimited",
    priceCents: 799,
    priceLabel: "$7.99/mo",
    tagline: "Full gaming library",
    goal: "For heavy gamers",
    includes: ["Everything in All-Star", "Adventure and strategy games", "Premium multiplayer games", "Seasonal game collections", "Early access to new titles"],
    status: "coming_soon",
  },
];

export const canBuyGamePackage = (pkg: GamePackage) => pkg.priceCents > 0 && pkg.status === "available";