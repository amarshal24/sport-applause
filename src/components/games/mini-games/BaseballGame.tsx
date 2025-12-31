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

const BaseballGame = ({ onBack, onScore, highScore }: Props) => {
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [isPlaying, setIsPlaying] = useState(false);
  const [pitchIncoming, setPitchIncoming] = useState(false);
  const [pitchPosition, setPitchPosition] = useState({ x: 50, y: 0 });
  const [swingResult, setSwingResult] = useState<"homerun" | "hit" | "miss" | null>(null);
  const [streak, setStreak] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [canSwing, setCanSwing] = useState(false);
  
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
    if (isPlaying && !pitchIncoming) {
      const delay = 1000 + Math.random() * 1000;
      const timeout = setTimeout(() => {
        throwPitch();
      }, delay);
      return () => clearTimeout(timeout);
    }
  }, [isPlaying, pitchIncoming]);

  const startGame = () => {
    setScore(0);
    setTimeLeft(30);
    setIsPlaying(true);
    setStreak(0);
    if (soundEnabled) {
      sounds.playGameStart();
      sounds.startBgMusic("fast");
    }
  };

  const throwPitch = () => {
    setPitchIncoming(true);
    setPitchPosition({ x: 50, y: 0 });
    setCanSwing(false);
    
    // Animate pitch coming in
    setTimeout(() => {
      setPitchPosition({ x: 45 + Math.random() * 10, y: 75 });
      setCanSwing(true);
    }, 100);
    
    // Miss if not swung in time
    setTimeout(() => {
      if (pitchIncoming) {
        setSwingResult("miss");
        setStreak(0);
        if (soundEnabled) sounds.playMiss();
        setTimeout(() => {
          setSwingResult(null);
          setPitchIncoming(false);
          setCanSwing(false);
        }, 500);
      }
    }, 1200);
  };

  const swing = useCallback(() => {
    if (!isPlaying || !canSwing || !pitchIncoming) return;
    
    setCanSwing(false);
    
    // Timing based scoring
    const timing = Math.random();
    if (timing > 0.7) {
      // Home run!
      setScore(s => s + 4);
      setStreak(s => s + 1);
      setSwingResult("homerun");
      if (soundEnabled) sounds.playScore();
    } else if (timing > 0.3) {
      // Base hit
      const points = streak >= 2 ? 2 : 1;
      setScore(s => s + points);
      setStreak(s => s + 1);
      setSwingResult("hit");
      if (soundEnabled) sounds.playScore();
    } else {
      // Miss
      setStreak(0);
      setSwingResult("miss");
      if (soundEnabled) sounds.playMiss();
    }
    
    setTimeout(() => {
      setSwingResult(null);
      setPitchIncoming(false);
    }, 600);
  }, [isPlaying, canSwing, pitchIncoming, streak, soundEnabled, sounds]);

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
          className="relative h-80 rounded-xl overflow-hidden cursor-pointer"
          style={{ background: "linear-gradient(180deg, #87CEEB 0%, #228B22 60%, #8B4513 100%)" }}
          onClick={swing}
        >
          {/* Baseball diamond */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-32 h-32">
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-8 bg-white rotate-45" />
          </div>

          {/* Pitcher */}
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 text-4xl">
            ⚾
          </div>

          {/* Ball animation */}
          {pitchIncoming && (
            <motion.div
              className="absolute text-3xl"
              animate={{ 
                left: `${pitchPosition.x}%`, 
                top: `${pitchPosition.y}%`,
                scale: pitchPosition.y > 50 ? 1.5 : 0.5
              }}
              transition={{ duration: 0.8, ease: "easeIn" }}
              style={{ transform: "translate(-50%, -50%)" }}
            >
              ⚾
            </motion.div>
          )}

          {/* Bat/Batter */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-5xl">
            🏏
          </div>

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

          {/* Swing indicator */}
          {canSwing && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 0.3, repeat: Infinity }}
              className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-green-500 text-white px-4 py-2 rounded-full font-bold"
            >
              TAP TO SWING!
            </motion.div>
          )}

          {/* Result */}
          <AnimatePresence>
            {swingResult && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                className={`absolute inset-0 flex items-center justify-center text-4xl font-bold ${
                  swingResult === "homerun" ? "text-yellow-400" : 
                  swingResult === "hit" ? "text-green-400" : "text-red-400"
                }`}
              >
                {swingResult === "homerun" ? "🎆 HOME RUN! +4" : 
                 swingResult === "hit" ? "✓ Base Hit!" : "❌ Strike!"}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Start overlay */}
          {!isPlaying && (
            <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center">
              <h3 className="text-2xl font-bold text-white mb-4">
                {timeLeft === 0 ? `Game Over! Score: ${score}` : "⚾ Home Run Derby"}
              </h3>
              <Button onClick={startGame} size="lg" className="gap-2">
                {timeLeft === 0 ? <RotateCcw className="w-4 h-4" /> : null}
                {timeLeft === 0 ? "Play Again" : "Start Game"}
              </Button>
            </div>
          )}
        </div>

        <p className="text-center text-sm text-muted-foreground mt-3">
          Tap when the ball is in the strike zone to swing!
        </p>
      </CardContent>
    </Card>
  );
};

export default BaseballGame;