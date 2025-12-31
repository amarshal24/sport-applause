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

const BasketballGame = ({ onBack, onScore, highScore }: Props) => {
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [isPlaying, setIsPlaying] = useState(false);
  const [ballPosition, setBallPosition] = useState({ x: 50, y: 80 });
  const [isShot, setIsShot] = useState(false);
  const [shotResult, setShotResult] = useState<"score" | "miss" | null>(null);
  const [hoopPosition, setHoopPosition] = useState(50);
  const [streak, setStreak] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  
  const sounds = useGameSounds();

  // Cleanup sounds on unmount or back
  useEffect(() => {
    return () => {
      sounds.stopBgMusic();
    };
  }, [sounds]);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (isPlaying && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(t => {
          if (soundEnabled && t <= 5 && t > 0) sounds.playTick();
          return t - 1;
        });
      }, 1000);
    } else if (timeLeft === 0 && isPlaying) {
      setIsPlaying(false);
      if (soundEnabled) sounds.playGameOver();
      sounds.stopBgMusic();
      onScore(score);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isPlaying, timeLeft, score, onScore, soundEnabled, sounds]);

  useEffect(() => {
    if (isPlaying) {
      const moveHoop = setInterval(() => {
        setHoopPosition(prev => {
          const newPos = prev + (Math.random() - 0.5) * 20;
          return Math.max(20, Math.min(80, newPos));
        });
      }, 1500);
      return () => clearInterval(moveHoop);
    }
  }, [isPlaying]);

  const startGame = () => {
    setScore(0);
    setTimeLeft(30);
    setIsPlaying(true);
    setStreak(0);
    setBallPosition({ x: 50, y: 80 });
    if (soundEnabled) {
      sounds.playGameStart();
      sounds.startBgMusic("fast");
    }
  };

  const shoot = useCallback(() => {
    if (!isPlaying || isShot) return;

    setIsShot(true);
    if (soundEnabled) sounds.playShoot();
    const accuracy = Math.abs(ballPosition.x - hoopPosition);
    const isScoreResult = accuracy < 15;

    setBallPosition({ x: hoopPosition, y: 25 });

    setTimeout(() => {
      if (isScoreResult) {
        const points = streak >= 2 ? 3 : 2;
        setScore(s => s + points);
        setShotResult("score");
        setStreak(s => s + 1);
        if (soundEnabled) {
          sounds.playScore();
          if (streak >= 2) sounds.playStreak(streak);
        }
      } else {
        setShotResult("miss");
        setStreak(0);
        if (soundEnabled) sounds.playMiss();
      }

      setTimeout(() => {
        setShotResult(null);
        setIsShot(false);
        setBallPosition({ x: 30 + Math.random() * 40, y: 80 });
      }, 500);
    }, 400);
  }, [isPlaying, isShot, ballPosition.x, hoopPosition, streak, soundEnabled, sounds]);

  const moveBall = (direction: "left" | "right") => {
    if (!isPlaying || isShot) return;
    if (soundEnabled) sounds.playClick();
    setBallPosition(prev => ({
      ...prev,
      x: Math.max(10, Math.min(90, prev.x + (direction === "left" ? -10 : 10)))
    }));
  };

  const toggleSound = () => {
    if (soundEnabled) {
      sounds.stopBgMusic();
    } else if (isPlaying) {
      sounds.startBgMusic("fast");
    }
    setSoundEnabled(prev => !prev);
  };

  return (
    <Card className="glass-effect overflow-hidden">
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-4">
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
              <div className="text-2xl font-bold">{timeLeft}s</div>
              <div className="text-xs text-white/70">Time</div>
            </div>
            {streak >= 2 && (
              <div className="text-center bg-yellow-400 text-yellow-900 px-2 py-1 rounded-full text-sm font-bold animate-pulse">
                🔥 x{streak}
              </div>
            )}
          </div>
        </div>
      </div>

      <CardContent className="p-0">
        <div 
          className="relative h-80 bg-gradient-to-b from-blue-400 to-blue-600 overflow-hidden cursor-pointer"
          onClick={shoot}
        >
          <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-orange-700 to-orange-500" />
          
          <motion.div
            className="absolute top-8 w-16 h-12 bg-white border-4 border-red-500 rounded"
            style={{ left: `calc(${hoopPosition}% - 32px)` }}
            animate={{ left: `calc(${hoopPosition}% - 32px)` }}
            transition={{ type: "spring", stiffness: 100 }}
          >
            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-10 h-3 border-4 border-orange-500 rounded-full" />
            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-2xl">🥅</div>
          </motion.div>

          <motion.div
            className="absolute text-5xl"
            style={{ 
              left: `calc(${ballPosition.x}% - 24px)`,
              top: `${ballPosition.y}%`
            }}
            animate={{ 
              left: `calc(${ballPosition.x}% - 24px)`,
              top: `${ballPosition.y}%`,
              rotate: isShot ? 360 : 0
            }}
            transition={{ 
              type: isShot ? "spring" : "tween",
              duration: isShot ? 0.4 : 0.1
            }}
          >
            🏀
          </motion.div>

          <AnimatePresence>
            {shotResult && (
              <motion.div
                className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-4xl font-bold ${
                  shotResult === "score" ? "text-green-400" : "text-red-400"
                }`}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1.5, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
              >
                {shotResult === "score" ? (streak >= 2 ? "+3 🔥" : "+2 ✓") : "Miss!"}
              </motion.div>
            )}
          </AnimatePresence>

          {!isPlaying && (
            <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="text-center"
              >
                <div className="text-6xl mb-4">🏀</div>
                <h3 className="text-2xl font-bold mb-2">Basketball Shootout</h3>
                <p className="text-white/70 mb-4">Tap to shoot! Use arrows to aim.</p>
                {highScore > 0 && (
                  <div className="flex items-center justify-center gap-2 mb-4 text-yellow-400">
                    <Trophy className="w-5 h-5" />
                    <span>High Score: {highScore}</span>
                  </div>
                )}
                <Button onClick={startGame} size="lg" className="bg-orange-500 hover:bg-orange-600">
                  Start Game
                </Button>
              </motion.div>
            </div>
          )}
        </div>

        {isPlaying && (
          <div className="p-4 bg-muted/30 flex justify-center gap-4">
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => moveBall("left")}
              className="text-2xl px-6"
            >
              ←
            </Button>
            <Button 
              size="lg"
              onClick={shoot}
              className="bg-orange-500 hover:bg-orange-600 text-white px-8"
            >
              SHOOT 🏀
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => moveBall("right")}
              className="text-2xl px-6"
            >
              →
            </Button>
          </div>
        )}

        {!isPlaying && timeLeft === 0 && (
          <div className="p-6 text-center">
            <h3 className="text-2xl font-bold mb-2">Game Over!</h3>
            <p className="text-muted-foreground mb-4">
              Final Score: {score} {score > highScore && score > 0 && "🎉 New High Score!"}
            </p>
            <div className="flex justify-center gap-3">
              <Button onClick={startGame} className="bg-orange-500 hover:bg-orange-600">
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

export default BasketballGame;
