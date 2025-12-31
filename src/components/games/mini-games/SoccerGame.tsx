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

type KickDirection = "left" | "center" | "right";

const SoccerGame = ({ onBack, onScore, highScore }: Props) => {
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(0);
  const [maxRounds] = useState(5);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isKicking, setIsKicking] = useState(false);
  const [ballPosition, setBallPosition] = useState<KickDirection | null>(null);
  const [goalkeeperPosition, setGoalkeeperPosition] = useState<KickDirection | null>(null);
  const [result, setResult] = useState<"goal" | "saved" | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  
  const sounds = useGameSounds();

  // Cleanup sounds on unmount or back
  useEffect(() => {
    return () => {
      sounds.stopBgMusic();
    };
  }, [sounds]);

  useEffect(() => {
    if (round >= maxRounds && isPlaying) {
      setIsPlaying(false);
      if (soundEnabled) sounds.playGameOver();
      sounds.stopBgMusic();
      onScore(score);
    }
  }, [round, maxRounds, isPlaying, score, onScore, soundEnabled, sounds]);

  const startGame = () => {
    setScore(0);
    setRound(0);
    setIsPlaying(true);
    setIsKicking(false);
    setBallPosition(null);
    setGoalkeeperPosition(null);
    setResult(null);
    if (soundEnabled) {
      sounds.playGameStart();
      sounds.startBgMusic("medium");
    }
  };

  const kick = useCallback((direction: KickDirection) => {
    if (!isPlaying || isKicking) return;

    setIsKicking(true);
    setBallPosition(direction);
    if (soundEnabled) sounds.playShoot();

    const diveOptions: KickDirection[] = ["left", "center", "right"];
    const goalieDive = diveOptions[Math.floor(Math.random() * diveOptions.length)];
    
    setTimeout(() => {
      setGoalkeeperPosition(goalieDive);
      
      setTimeout(() => {
        const isGoal = direction !== goalieDive;
        if (isGoal) {
          setScore(s => s + 1);
          setResult("goal");
          if (soundEnabled) sounds.playScore();
        } else {
          setResult("saved");
          if (soundEnabled) sounds.playMiss();
        }

        setTimeout(() => {
          setRound(r => r + 1);
          setBallPosition(null);
          setGoalkeeperPosition(null);
          setResult(null);
          setIsKicking(false);
        }, 1000);
      }, 300);
    }, 200);
  }, [isPlaying, isKicking, soundEnabled, sounds]);

  const toggleSound = () => {
    if (soundEnabled) {
      sounds.stopBgMusic();
    } else if (isPlaying) {
      sounds.startBgMusic("medium");
    }
    setSoundEnabled(prev => !prev);
  };

  const getBallTransform = () => {
    if (!ballPosition) return { x: 0, y: 0 };
    switch (ballPosition) {
      case "left": return { x: -80, y: -120 };
      case "center": return { x: 0, y: -130 };
      case "right": return { x: 80, y: -120 };
    }
  };

  const getGoalkeeperTransform = () => {
    if (!goalkeeperPosition) return { x: 0 };
    switch (goalkeeperPosition) {
      case "left": return { x: -60 };
      case "center": return { x: 0, y: -10 };
      case "right": return { x: 60 };
    }
  };

  return (
    <Card className="glass-effect overflow-hidden">
      <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-4">
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
              <div className="text-2xl font-bold">{score}/{round}</div>
              <div className="text-xs text-white/70">Goals</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{maxRounds - round}</div>
              <div className="text-xs text-white/70">Kicks Left</div>
            </div>
          </div>
        </div>
      </div>

      <CardContent className="p-0">
        <div className="relative h-80 bg-gradient-to-b from-sky-400 to-green-500 overflow-hidden">
          <div className="absolute top-4 left-1/2 -translate-x-1/2 w-48 h-24 border-4 border-white rounded-t-lg bg-white/10">
            <div className="absolute inset-0 opacity-30" style={{
              backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 8px, white 8px, white 9px), repeating-linear-gradient(90deg, transparent, transparent 8px, white 8px, white 9px)"
            }} />
            
            <motion.div
              className="absolute bottom-0 left-1/2 -translate-x-1/2 text-5xl"
              animate={goalkeeperPosition ? getGoalkeeperTransform() : { x: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              🧤
            </motion.div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 h-32 border-t-4 border-white/30" />
          <div className="absolute bottom-16 left-1/2 -translate-x-1/2 w-32 h-16 border-2 border-white/30 rounded-t-full" />
          <div className="absolute bottom-20 left-1/2 -translate-x-1/2 w-3 h-3 bg-white rounded-full" />

          <motion.div
            className="absolute bottom-16 left-1/2 -translate-x-1/2 text-5xl"
            animate={ballPosition ? getBallTransform() : { x: 0, y: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
          >
            ⚽
          </motion.div>

          <AnimatePresence>
            {result && (
              <motion.div
                className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-4xl font-bold ${
                  result === "goal" ? "text-green-400" : "text-red-400"
                }`}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1.5, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
              >
                {result === "goal" ? "GOAL! ⚽🎉" : "SAVED! 🧤"}
              </motion.div>
            )}
          </AnimatePresence>

          {!isPlaying && round === 0 && (
            <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="text-center"
              >
                <div className="text-6xl mb-4">⚽</div>
                <h3 className="text-2xl font-bold mb-2">Penalty Shootout</h3>
                <p className="text-white/70 mb-4">Choose where to kick!</p>
                {highScore > 0 && (
                  <div className="flex items-center justify-center gap-2 mb-4 text-yellow-400">
                    <Trophy className="w-5 h-5" />
                    <span>High Score: {highScore}/{maxRounds}</span>
                  </div>
                )}
                <Button onClick={startGame} size="lg" className="bg-green-500 hover:bg-green-600">
                  Start Game
                </Button>
              </motion.div>
            </div>
          )}
        </div>

        {isPlaying && !isKicking && (
          <div className="p-4 bg-muted/30">
            <p className="text-center text-sm text-muted-foreground mb-3">Choose where to kick!</p>
            <div className="flex justify-center gap-3">
              <Button 
                size="lg"
                onClick={() => kick("left")}
                className="bg-green-500 hover:bg-green-600 text-white flex-1 max-w-24"
              >
                ↖️ Left
              </Button>
              <Button 
                size="lg"
                onClick={() => kick("center")}
                className="bg-green-500 hover:bg-green-600 text-white flex-1 max-w-24"
              >
                ⬆️ Center
              </Button>
              <Button 
                size="lg"
                onClick={() => kick("right")}
                className="bg-green-500 hover:bg-green-600 text-white flex-1 max-w-24"
              >
                ↗️ Right
              </Button>
            </div>
          </div>
        )}

        {isPlaying && isKicking && (
          <div className="p-6 text-center">
            <p className="text-muted-foreground">Shooting...</p>
          </div>
        )}

        {!isPlaying && round >= maxRounds && (
          <div className="p-6 text-center">
            <h3 className="text-2xl font-bold mb-2">Game Over!</h3>
            <p className="text-muted-foreground mb-4">
              You scored {score} out of {maxRounds}! {score > highScore && score > 0 && "🎉 New High Score!"}
            </p>
            <div className="flex justify-center gap-3">
              <Button onClick={startGame} className="bg-green-500 hover:bg-green-600">
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

export default SoccerGame;
