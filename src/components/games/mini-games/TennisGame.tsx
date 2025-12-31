import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, RotateCcw, Trophy, Volume2, VolumeX } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useGameSounds } from "@/hooks/useGameSounds";

interface Props {
  onBack: () => void;
  onScore: (score: number) => void;
  highScore: number;
}

type Position = "left" | "center" | "right";

const TennisGame = ({ onBack, onScore, highScore }: Props) => {
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [ballPosition, setBallPosition] = useState<Position>("center");
  const [ballY, setBallY] = useState(20);
  const [playerPosition, setPlayerPosition] = useState<Position>("center");
  const [isHitting, setIsHitting] = useState(false);
  const [result, setResult] = useState<"hit" | "miss" | null>(null);
  const [speed, setSpeed] = useState(1500);
  const [lives, setLives] = useState(3);
  const [soundEnabled, setSoundEnabled] = useState(true);
  
  const sounds = useGameSounds();

  const checkHit = useCallback((ballPos: Position) => {
    setIsHitting(true);
    
    if (playerPosition === ballPos) {
      setScore(s => s + (streak >= 3 ? 2 : 1));
      setStreak(s => s + 1);
      setResult("hit");
      setSpeed(s => Math.max(800, s - 50));
      if (soundEnabled) {
        sounds.playBounce();
        if (streak >= 3) sounds.playStreak(streak);
      }
    } else {
      setResult("miss");
      setStreak(0);
      setLives(l => l - 1);
      if (soundEnabled) sounds.playMiss();
    }

    setTimeout(() => {
      setResult(null);
      setBallY(20);
      setIsHitting(false);
      
      if (lives <= 1 && playerPosition !== ballPos) {
        setIsPlaying(false);
        if (soundEnabled) sounds.playGameOver();
        sounds.stopBgMusic();
        onScore(score + (playerPosition === ballPos ? 1 : 0));
      }
    }, 800);
  }, [playerPosition, streak, lives, score, onScore, soundEnabled, sounds]);

  useEffect(() => {
    if (!isPlaying || isHitting) return;

    const serveBall = () => {
      const positions: Position[] = ["left", "center", "right"];
      const newPosition = positions[Math.floor(Math.random() * positions.length)];
      setBallPosition(newPosition);
      setBallY(20);

      const interval = setInterval(() => {
        setBallY(prev => {
          if (prev >= 75) {
            clearInterval(interval);
            setTimeout(() => checkHit(newPosition), 100);
            return 75;
          }
          return prev + 5;
        });
      }, speed / 20);

      return () => clearInterval(interval);
    };

    const timeout = setTimeout(serveBall, 500);
    return () => clearTimeout(timeout);
  }, [isPlaying, isHitting, speed, checkHit]);

  const startGame = () => {
    setScore(0);
    setStreak(0);
    setLives(3);
    setSpeed(1500);
    setIsPlaying(true);
    setIsHitting(false);
    setResult(null);
    setBallY(20);
    setPlayerPosition("center");
    if (soundEnabled) {
      sounds.playGameStart();
      sounds.startBgMusic("medium");
    }
  };

  const movePlayer = (position: Position) => {
    if (!isPlaying) return;
    if (soundEnabled) sounds.playClick();
    setPlayerPosition(position);
  };

  const toggleSound = () => {
    if (soundEnabled) {
      sounds.stopBgMusic();
    } else if (isPlaying) {
      sounds.startBgMusic("medium");
    }
    setSoundEnabled(prev => !prev);
  };

  const getBallX = () => {
    switch (ballPosition) {
      case "left": return "25%";
      case "center": return "50%";
      case "right": return "75%";
    }
  };

  const getPlayerX = () => {
    switch (playerPosition) {
      case "left": return "25%";
      case "center": return "50%";
      case "right": return "75%";
    }
  };

  return (
    <Card className="glass-effect overflow-hidden">
      <div className="bg-gradient-to-r from-yellow-400 to-lime-500 text-white p-4">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={onBack} className="text-white hover:bg-white/20">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleSound}
              className="text-white hover:bg-white/20 h-8 w-8"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </Button>
            <div className="text-center">
              <div className="text-2xl font-bold">{score}</div>
              <div className="text-xs text-white/70">Score</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{"❤️".repeat(lives)}</div>
              <div className="text-xs text-white/70">Lives</div>
            </div>
            {streak >= 3 && (
              <div className="text-center bg-orange-400 text-orange-900 px-2 py-1 rounded-full text-sm font-bold animate-pulse">
                🔥 x{streak}
              </div>
            )}
          </div>
        </div>
      </div>

      <CardContent className="p-0">
        <div className="relative h-80 bg-gradient-to-b from-green-600 to-green-700 overflow-hidden">
          <div className="absolute inset-4 border-2 border-white/50" />
          <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-white/50" />
          <div className="absolute top-4 bottom-4 left-1/2 w-0.5 bg-white/30" />
          <div className="absolute top-1/2 left-4 right-4 h-2 bg-white/70 -translate-y-1/2" />

          <motion.div
            className="absolute text-3xl -translate-x-1/2"
            style={{ left: getBallX() }}
            animate={{ top: `${ballY}%` }}
            transition={{ duration: 0.05 }}
          >
            🎾
          </motion.div>

          <motion.div
            className="absolute bottom-8 text-5xl -translate-x-1/2"
            animate={{ left: getPlayerX() }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            🎾🏃
          </motion.div>

          <div className="absolute bottom-24 left-0 right-0 flex justify-around px-8">
            {(["left", "center", "right"] as Position[]).map((pos) => (
              <div
                key={pos}
                className={`w-16 h-1 rounded ${playerPosition === pos ? "bg-yellow-400" : "bg-white/30"}`}
              />
            ))}
          </div>

          <AnimatePresence>
            {result && (
              <motion.div
                className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-4xl font-bold ${
                  result === "hit" ? "text-green-300" : "text-red-400"
                }`}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1.5, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
              >
                {result === "hit" ? (streak >= 3 ? "ACE! +2 🔥" : "HIT! +1") : "MISS!"}
              </motion.div>
            )}
          </AnimatePresence>

          {!isPlaying && lives === 3 && (
            <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="text-center"
              >
                <div className="text-6xl mb-4">🎾</div>
                <h3 className="text-2xl font-bold mb-2">Tennis Rally</h3>
                <p className="text-white/70 mb-4">Move to return the ball!</p>
                {highScore > 0 && (
                  <div className="flex items-center justify-center gap-2 mb-4 text-yellow-400">
                    <Trophy className="w-5 h-5" />
                    <span>High Score: {highScore}</span>
                  </div>
                )}
                <Button onClick={startGame} size="lg" className="bg-lime-500 hover:bg-lime-600">
                  Start Game
                </Button>
              </motion.div>
            </div>
          )}
        </div>

        {isPlaying && (
          <div className="p-4 bg-muted/30">
            <p className="text-center text-sm text-muted-foreground mb-3">Move to intercept the ball!</p>
            <div className="flex justify-center gap-3">
              <Button 
                size="lg"
                variant={playerPosition === "left" ? "default" : "outline"}
                onClick={() => movePlayer("left")}
                className={`flex-1 max-w-24 ${playerPosition === "left" ? "bg-lime-500 hover:bg-lime-600" : ""}`}
              >
                ← Left
              </Button>
              <Button 
                size="lg"
                variant={playerPosition === "center" ? "default" : "outline"}
                onClick={() => movePlayer("center")}
                className={`flex-1 max-w-24 ${playerPosition === "center" ? "bg-lime-500 hover:bg-lime-600" : ""}`}
              >
                Center
              </Button>
              <Button 
                size="lg"
                variant={playerPosition === "right" ? "default" : "outline"}
                onClick={() => movePlayer("right")}
                className={`flex-1 max-w-24 ${playerPosition === "right" ? "bg-lime-500 hover:bg-lime-600" : ""}`}
              >
                Right →
              </Button>
            </div>
          </div>
        )}

        {!isPlaying && lives <= 0 && (
          <div className="p-6 text-center">
            <h3 className="text-2xl font-bold mb-2">Game Over!</h3>
            <p className="text-muted-foreground mb-4">
              Final Score: {score}! {score > highScore && score > 0 && "🎉 New High Score!"}
            </p>
            <div className="flex justify-center gap-3">
              <Button onClick={startGame} className="bg-lime-500 hover:bg-lime-600">
                <RotateCcw className="w-4 h-4 mr-2" />
                Play Again
              </Button>
              <Button variant="outline" onClick={onBack}>
                Back to Menu
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TennisGame;
