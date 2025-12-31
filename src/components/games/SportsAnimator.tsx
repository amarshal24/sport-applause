import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Sparkles, Trophy, Gamepad2, Award } from "lucide-react";
import { motion } from "framer-motion";
import BasketballGame from "./mini-games/BasketballGame";
import SoccerGame from "./mini-games/SoccerGame";
import FootballGame from "./mini-games/FootballGame";
import TennisGame from "./mini-games/TennisGame";
import HockeyGame from "./mini-games/HockeyGame";
import BaseballGame from "./mini-games/BaseballGame";
import GolfGame from "./mini-games/GolfGame";
import VolleyballGame from "./mini-games/VolleyballGame";
import Leaderboard from "./Leaderboard";
import AchievementsDisplay from "./AchievementsDisplay";
import { useGameProgress } from "@/hooks/useGameProgress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Props {
  onBack: () => void;
}

interface SportGame {
  id: string;
  name: string;
  emoji: string;
  color: string;
  description: string;
}

const sportGames: SportGame[] = [
  { id: "basketball", name: "Basketball", emoji: "🏀", color: "from-orange-400 to-orange-600", description: "Tap to shoot hoops!" },
  { id: "soccer", name: "Soccer", emoji: "⚽", color: "from-green-400 to-green-600", description: "Score penalty kicks!" },
  { id: "football", name: "Football", emoji: "🏈", color: "from-amber-600 to-yellow-500", description: "Throw the perfect pass!" },
  { id: "tennis", name: "Tennis", emoji: "🎾", color: "from-yellow-400 to-lime-500", description: "Return the volley!" },
  { id: "hockey", name: "Hockey", emoji: "🏒", color: "from-blue-400 to-cyan-500", description: "Shoot past the goalie!" },
  { id: "baseball", name: "Baseball", emoji: "⚾", color: "from-red-400 to-red-600", description: "Hit home runs!" },
  { id: "golf", name: "Golf", emoji: "⛳", color: "from-emerald-400 to-green-600", description: "Sink putts in 9 holes!" },
  { id: "volleyball", name: "Volleyball", emoji: "🏐", color: "from-sky-400 to-blue-500", description: "Keep the rally going!" },
];

const SportsAnimator = ({ onBack }: Props) => {
  const [selectedGame, setSelectedGame] = useState<string | null>(null);
  const [localHighScores, setLocalHighScores] = useState<Record<string, number>>({});
  const [maxStreak, setMaxStreak] = useState(0);
  
  const { userScores, userAchievements, submitScore, refreshData } = useGameProgress();

  // Merge local and remote high scores
  const highScores = { ...localHighScores };
  Object.entries(userScores).forEach(([gameId, score]) => {
    highScores[gameId] = Math.max(highScores[gameId] || 0, score);
  });

  const handleGameComplete = async (gameId: string, score: number, streak: number = 0) => {
    // Update local high score
    setLocalHighScores(prev => ({
      ...prev,
      [gameId]: Math.max(prev[gameId] || 0, score)
    }));
    setMaxStreak(Math.max(maxStreak, streak));
    
    // Submit to database
    await submitScore(gameId, score, streak);
  };

  const handleBackToMenu = () => {
    setSelectedGame(null);
    refreshData();
  };

  const renderGame = () => {
    const gameProps = (gameId: string) => ({
      onBack: handleBackToMenu,
      onScore: (score: number, streak?: number) => handleGameComplete(gameId, score, streak || 0),
      highScore: highScores[gameId] || 0,
    });

    switch (selectedGame) {
      case "basketball":
        return <BasketballGame {...gameProps("basketball")} />;
      case "soccer":
        return <SoccerGame {...gameProps("soccer")} />;
      case "football":
        return <FootballGame {...gameProps("football")} />;
      case "tennis":
        return <TennisGame {...gameProps("tennis")} />;
      case "hockey":
        return <HockeyGame {...gameProps("hockey")} />;
      case "baseball":
        return <BaseballGame {...gameProps("baseball")} />;
      case "golf":
        return <GolfGame {...gameProps("golf")} />;
      case "volleyball":
        return <VolleyballGame {...gameProps("volleyball")} />;
      default:
        return null;
    }
  };

  if (selectedGame) {
    return (
      <div className="max-w-4xl mx-auto animate-fade-in">
        <Button 
          variant="ghost" 
          onClick={handleBackToMenu}
          className="mb-6 hover:bg-primary/10"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Menu
        </Button>
        {renderGame()}
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto animate-fade-in space-y-6">
      <Button 
        variant="ghost" 
        onClick={onBack}
        className="hover:bg-primary/10"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Games
      </Button>

      <Tabs defaultValue="games" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="games" className="gap-2">
            <Gamepad2 className="w-4 h-4" />
            Games
          </TabsTrigger>
          <TabsTrigger value="leaderboard" className="gap-2">
            <Trophy className="w-4 h-4" />
            Leaderboard
          </TabsTrigger>
          <TabsTrigger value="achievements" className="gap-2">
            <Award className="w-4 h-4" />
            Achievements
          </TabsTrigger>
        </TabsList>

        <TabsContent value="games">
          <Card className="glass-effect overflow-hidden">
            <CardHeader className="text-center bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-white">
              <CardTitle className="text-3xl font-display flex items-center justify-center gap-3">
                <Gamepad2 className="w-8 h-8" />
                Sports Mini-Games
                <Sparkles className="w-8 h-8" />
              </CardTitle>
              <p className="text-white/80">Choose a sport and play animated mini-games!</p>
            </CardHeader>

            <CardContent className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {sportGames.map((game, index) => (
                  <motion.div
                    key={game.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <button
                      onClick={() => setSelectedGame(game.id)}
                      className={`w-full p-4 rounded-2xl bg-gradient-to-br ${game.color} text-white shadow-lg hover:scale-105 transition-transform duration-200 text-left group`}
                    >
                      <div className="flex flex-col items-center text-center gap-2">
                        <motion.span 
                          className="text-4xl"
                          animate={{ rotate: [0, -10, 10, 0] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          {game.emoji}
                        </motion.span>
                        <h3 className="text-lg font-bold">{game.name}</h3>
                        <p className="text-white/80 text-xs">{game.description}</p>
                        {highScores[game.id] > 0 && (
                          <div className="flex items-center gap-1 text-yellow-200">
                            <Trophy className="w-3 h-3" />
                            <span className="text-xs font-medium">{highScores[game.id]}</span>
                          </div>
                        )}
                      </div>
                    </button>
                  </motion.div>
                ))}
              </div>

              <div className="mt-6 text-center">
                <p className="text-muted-foreground text-sm">
                  🎮 Tap or click to play • 🏆 Beat your high scores • 🎖️ Unlock achievements!
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <Leaderboard compact />
            <AchievementsDisplay unlockedAchievements={userAchievements} compact />
          </div>
        </TabsContent>

        <TabsContent value="leaderboard">
          <Leaderboard />
        </TabsContent>

        <TabsContent value="achievements">
          <AchievementsDisplay unlockedAchievements={userAchievements} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SportsAnimator;