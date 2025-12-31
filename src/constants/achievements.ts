// Achievement definitions for mini games
export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  condition: (stats: GameStats) => boolean;
  rarity: "common" | "rare" | "epic" | "legendary";
}

export interface GameStats {
  gamesPlayed: number;
  totalScore: number;
  highScore: number;
  streakMax: number;
  perfectGames: number;
  gameId: string;
}

export const ACHIEVEMENTS: Achievement[] = [
  // Score-based achievements
  {
    id: "first_point",
    name: "First Point",
    description: "Score your first point in any game",
    icon: "⭐",
    condition: (stats) => stats.totalScore >= 1,
    rarity: "common",
  },
  {
    id: "score_50",
    name: "Half Century",
    description: "Score 50 points in a single game",
    icon: "🎯",
    condition: (stats) => stats.highScore >= 50,
    rarity: "rare",
  },
  {
    id: "score_100",
    name: "Century Club",
    description: "Score 100 points in a single game",
    icon: "💯",
    condition: (stats) => stats.highScore >= 100,
    rarity: "epic",
  },
  {
    id: "score_200",
    name: "Legendary Score",
    description: "Score 200 points in a single game",
    icon: "👑",
    condition: (stats) => stats.highScore >= 200,
    rarity: "legendary",
  },
  
  // Games played achievements
  {
    id: "rookie",
    name: "Rookie",
    description: "Play 5 games",
    icon: "🎮",
    condition: (stats) => stats.gamesPlayed >= 5,
    rarity: "common",
  },
  {
    id: "dedicated",
    name: "Dedicated Player",
    description: "Play 25 games",
    icon: "🏅",
    condition: (stats) => stats.gamesPlayed >= 25,
    rarity: "rare",
  },
  {
    id: "veteran",
    name: "Veteran",
    description: "Play 100 games",
    icon: "🎖️",
    condition: (stats) => stats.gamesPlayed >= 100,
    rarity: "epic",
  },
  
  // Streak achievements
  {
    id: "streak_3",
    name: "On Fire",
    description: "Get a 3x streak",
    icon: "🔥",
    condition: (stats) => stats.streakMax >= 3,
    rarity: "common",
  },
  {
    id: "streak_5",
    name: "Unstoppable",
    description: "Get a 5x streak",
    icon: "⚡",
    condition: (stats) => stats.streakMax >= 5,
    rarity: "rare",
  },
  {
    id: "streak_10",
    name: "Legendary Streak",
    description: "Get a 10x streak",
    icon: "🌟",
    condition: (stats) => stats.streakMax >= 10,
    rarity: "legendary",
  },
  
  // Game-specific achievements
  {
    id: "basketball_master",
    name: "Basketball Master",
    description: "Score 75+ in Basketball",
    icon: "🏀",
    condition: (stats) => stats.gameId === "basketball" && stats.highScore >= 75,
    rarity: "epic",
  },
  {
    id: "soccer_star",
    name: "Soccer Star",
    description: "Score 60+ in Soccer",
    icon: "⚽",
    condition: (stats) => stats.gameId === "soccer" && stats.highScore >= 60,
    rarity: "epic",
  },
  {
    id: "football_pro",
    name: "Football Pro",
    description: "Score 80+ in Football",
    icon: "🏈",
    condition: (stats) => stats.gameId === "football" && stats.highScore >= 80,
    rarity: "epic",
  },
  {
    id: "tennis_ace",
    name: "Tennis Ace",
    description: "Score 50+ in Tennis",
    icon: "🎾",
    condition: (stats) => stats.gameId === "tennis" && stats.highScore >= 50,
    rarity: "epic",
  },
  {
    id: "hockey_legend",
    name: "Hockey Legend",
    description: "Score 70+ in Hockey",
    icon: "🏒",
    condition: (stats) => stats.gameId === "hockey" && stats.highScore >= 70,
    rarity: "epic",
  },
  {
    id: "baseball_champ",
    name: "Baseball Champ",
    description: "Score 60+ in Baseball",
    icon: "⚾",
    condition: (stats) => stats.gameId === "baseball" && stats.highScore >= 60,
    rarity: "epic",
  },
  {
    id: "golf_master",
    name: "Golf Master",
    description: "Score 40+ in Golf",
    icon: "⛳",
    condition: (stats) => stats.gameId === "golf" && stats.highScore >= 40,
    rarity: "epic",
  },
  {
    id: "volleyball_king",
    name: "Volleyball King",
    description: "Score 80+ in Volleyball",
    icon: "🏐",
    condition: (stats) => stats.gameId === "volleyball" && stats.highScore >= 80,
    rarity: "epic",
  },
  
  // Multi-game achievements
  {
    id: "all_rounder",
    name: "All-Rounder",
    description: "Accumulate 500 total points",
    icon: "🏆",
    condition: (stats) => stats.totalScore >= 500,
    rarity: "rare",
  },
  {
    id: "sports_legend",
    name: "Sports Legend",
    description: "Accumulate 2000 total points",
    icon: "🌟",
    condition: (stats) => stats.totalScore >= 2000,
    rarity: "legendary",
  },
];

export const RARITY_COLORS = {
  common: "from-gray-400 to-gray-600",
  rare: "from-blue-400 to-blue-600",
  epic: "from-purple-400 to-purple-600",
  legendary: "from-yellow-400 to-orange-500",
};

export const RARITY_BORDERS = {
  common: "border-gray-400",
  rare: "border-blue-400",
  epic: "border-purple-400",
  legendary: "border-yellow-400 animate-pulse",
};