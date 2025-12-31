import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Sparkles, Trophy, Gamepad2 } from "lucide-react";
import { motion } from "framer-motion";
import BasketballGame from "./mini-games/BasketballGame";
import SoccerGame from "./mini-games/SoccerGame";
import FootballGame from "./mini-games/FootballGame";
import TennisGame from "./mini-games/TennisGame";

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
];

const SportsAnimator = ({ onBack }: Props) => {
  const [selectedGame, setSelectedGame] = useState<string | null>(null);
  const [highScores, setHighScores] = useState<Record<string, number>>({});

  const updateHighScore = (gameId: string, score: number) => {
    setHighScores(prev => ({
      ...prev,
      [gameId]: Math.max(prev[gameId] || 0, score)
    }));
  };

  const handleBackToMenu = () => {
    setSelectedGame(null);
  };

  const renderGame = () => {
    switch (selectedGame) {
      case "basketball":
        return <BasketballGame onBack={handleBackToMenu} onScore={(s) => updateHighScore("basketball", s)} highScore={highScores.basketball || 0} />;
      case "soccer":
        return <SoccerGame onBack={handleBackToMenu} onScore={(s) => updateHighScore("soccer", s)} highScore={highScores.soccer || 0} />;
      case "football":
        return <FootballGame onBack={handleBackToMenu} onScore={(s) => updateHighScore("football", s)} highScore={highScores.football || 0} />;
      case "tennis":
        return <TennisGame onBack={handleBackToMenu} onScore={(s) => updateHighScore("tennis", s)} highScore={highScores.tennis || 0} />;
      default:
        return null;
    }
  };

  if (selectedGame) {
    return (
      <div className="max-w-4xl mx-auto animate-fade-in">
        <Button 
          variant="ghost" 
          onClick={onBack}
          className="mb-6 hover:bg-primary/10"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Games
        </Button>
        {renderGame()}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      <Button 
        variant="ghost" 
        onClick={onBack}
        className="mb-6 hover:bg-primary/10"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Games
      </Button>

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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {sportGames.map((game, index) => (
              <motion.div
                key={game.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <button
                  onClick={() => setSelectedGame(game.id)}
                  className={`w-full p-6 rounded-2xl bg-gradient-to-br ${game.color} text-white shadow-lg hover:scale-105 transition-transform duration-200 text-left group`}
                >
                  <div className="flex items-center gap-4">
                    <motion.span 
                      className="text-5xl"
                      animate={{ rotate: [0, -10, 10, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      {game.emoji}
                    </motion.span>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold">{game.name}</h3>
                      <p className="text-white/80 text-sm">{game.description}</p>
                      {highScores[game.id] > 0 && (
                        <div className="flex items-center gap-1 mt-2 text-yellow-200">
                          <Trophy className="w-4 h-4" />
                          <span className="text-sm font-medium">Best: {highScores[game.id]}</span>
                        </div>
                      )}
                    </div>
                    <motion.div
                      className="text-2xl opacity-0 group-hover:opacity-100 transition-opacity"
                      animate={{ x: [0, 5, 0] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    >
                      ▶
                    </motion.div>
                  </div>
                </button>
              </motion.div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <p className="text-muted-foreground text-sm">
              🎮 Tap or click to play • 🏆 Beat your high scores!
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SportsAnimator;
