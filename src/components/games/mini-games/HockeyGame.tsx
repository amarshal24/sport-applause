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

const HockeyGame = ({ onBack, onScore, highScore }: Props) => {
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [isPlaying, setIsPlaying] = useState(false);
  const [puckPosition, setPuckPosition] = useState({ x: 50, y: 70 });
  const [isShot, setIsShot] = useState(false);
  const [shotResult, setShotResult] = useState<"score" | "miss" | null>(null);
  const [goaliePosition, setGoaliePosition] = useState(50);
  const [streak, setStreak] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  
  const sounds = useGameSounds();

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
      const moveGoalie = setInterval(() => {
        setGoaliePosition(prev => {
          const newPos = prev + (Math.random() - 0.5) * 25;
          return Math.max(25, Math.min(75, newPos));
        });
      }, 800);
      return () => clearInterval(moveGoalie);
    }
  }, [isPlaying]);

  const startGame = () => {
    setScore(0);
    setTimeLeft(30);
    setIsPlaying(true);
    setStreak(0);
    setPuckPosition({ x: 50, y: 70 });
    if (soundEnabled) {
      sounds.playGameStart();
      sounds.startBgMusic("fast");
    }
  };

  const shoot = useCallback((targetX: number) => {
    if (!isPlaying || isShot) return;
    
    setIsShot(true);
    setPuckPosition({ x: targetX, y: 15 });
    
    setTimeout(() => {
      const distance = Math.abs(targetX - goaliePosition);
      const isGoal = distance > 15;
      
      if (isGoal) {
        const points = streak >= 3 ? 3 : streak >= 1 ? 2 : 1;
        setScore(s => s + points);
        setStreak(s => s + 1);
        setShotResult("score");
        if (soundEnabled) sounds.playScore();
      } else {
        setStreak(0);
        setShotResult("miss");
        if (soundEnabled) sounds.playMiss();
      }
      
      setTimeout(() => {
        setShotResult(null);
        setIsShot(false);
        setPuckPosition({ x: 50, y: 70 });
      }, 500);
    }, 400);
  }, [isPlaying, isShot, goaliePosition, streak, soundEnabled, sounds]);

  return (
    <Card className="glass-effect overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-lg font-bold">
              <Trophy className="w-5 h-5 text-yellow-500" />
              {highScore}
            </div>
            <Button variant="ghost" size="icon" onClick={() => setSoundEnabled(!soundEnabled)}>
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        <div 
          className="relative h-80 rounded-xl overflow-hidden"
          style={{ background: "linear-gradient(180deg, #1a365d 0%, #2c5282 50%, #e2e8f0 100%)" }}
        >
          {/* Ice rink markings */}
          <div className="absolute inset-x-0 top-1/2 h-px bg-red-500/50" />
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-red-500/50 -translate-x-1/2" />
          
          {/* Goal */}
          <div className="absolute top-8 left-1/2 -translate-x-1/2 w-32 h-12 border-4 border-red-600 bg-white/20 rounded-t-lg" />
          
          {/* Goalie */}
          <motion.div
            className="absolute top-12 text-4xl"
            animate={{ left: `${goaliePosition}%` }}
            transition={{ duration: 0.3 }}
            style={{ transform: "translateX(-50%)" }}
          >
            🧤
          </motion.div>

          {/* Puck */}
          <motion.div
            className="absolute text-3xl cursor-pointer"
            animate={{ 
              left: `${puckPosition.x}%`, 
              top: `${puckPosition.y}%`,
              scale: isShot ? 0.8 : 1
            }}
            transition={{ duration: 0.4 }}
            style={{ transform: "translate(-50%, -50%)" }}
          >
            🏒
          </motion.div>

          {/* Click targets */}
          {isPlaying && !isShot && (
            <div className="absolute top-8 left-0 right-0 flex justify-around px-8">
              {[25, 50, 75].map((pos) => (
                <button
                  key={pos}
                  onClick={() => shoot(pos)}
                  className="w-16 h-16 rounded-full bg-white/20 hover:bg-white/40 transition-colors border-2 border-dashed border-white/50"
                />
              ))}
            </div>
          )}

          {/* Score display */}
          <div className="absolute top-2 right-2 bg-black/60 px-3 py-1 rounded-lg text-white font-bold">
            {score} pts | {timeLeft}s
          </div>

          {/* Streak indicator */}
          {streak >= 2 && (
            <div className="absolute top-2 left-2 bg-orange-500 px-2 py-1 rounded text-white text-sm font-bold animate-pulse">
              🔥 {streak}x Streak!
            </div>
          )}

          {/* Shot result */}
          <AnimatePresence>
            {shotResult && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                className={`absolute inset-0 flex items-center justify-center text-6xl ${
                  shotResult === "score" ? "text-green-400" : "text-red-400"
                }`}
              >
                {shotResult === "score" ? "🚨 GOAL!" : "❌ Save!"}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Start overlay */}
          {!isPlaying && (
            <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center">
              <h3 className="text-2xl font-bold text-white mb-4">
                {timeLeft === 0 ? `Game Over! Score: ${score}` : "🏒 Hockey Shootout"}
              </h3>
              <Button onClick={startGame} size="lg" className="gap-2">
                {timeLeft === 0 ? <RotateCcw className="w-4 h-4" /> : null}
                {timeLeft === 0 ? "Play Again" : "Start Game"}
              </Button>
            </div>
          )}
        </div>

        <p className="text-center text-sm text-muted-foreground mt-3">
          Click the targets to shoot past the goalie!
        </p>
      </CardContent>
    </Card>
  );
};

export default HockeyGame;