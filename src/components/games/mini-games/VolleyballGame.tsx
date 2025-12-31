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

const VolleyballGame = ({ onBack, onScore, highScore }: Props) => {
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [isPlaying, setIsPlaying] = useState(false);
  const [ballPosition, setBallPosition] = useState({ x: 50, y: 30 });
  const [ballVelocity, setBallVelocity] = useState({ x: 2, y: 0 });
  const [playerPosition, setPlayerPosition] = useState(50);
  const [hitResult, setHitResult] = useState<"spike" | "bump" | "miss" | null>(null);
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

  // Ball physics
  useEffect(() => {
    if (!isPlaying) return;
    
    const interval = setInterval(() => {
      setBallPosition(prev => {
        let newX = prev.x + ballVelocity.x;
        let newY = prev.y + ballVelocity.y;
        
        // Bounce off walls
        if (newX <= 5 || newX >= 95) {
          setBallVelocity(v => ({ ...v, x: -v.x }));
          newX = Math.max(5, Math.min(95, newX));
        }
        
        // Gravity
        setBallVelocity(v => ({ ...v, y: v.y + 0.3 }));
        
        // Check if ball hit the ground (game continues, point lost)
        if (newY >= 85) {
          setStreak(0);
          setHitResult("miss");
          if (soundEnabled) sounds.playMiss();
          setTimeout(() => setHitResult(null), 300);
          
          // Reset ball
          newY = 30;
          newX = 50;
          setBallVelocity({ x: (Math.random() - 0.5) * 4, y: 0 });
        }
        
        return { x: newX, y: newY };
      });
    }, 50);
    
    return () => clearInterval(interval);
  }, [isPlaying, ballVelocity, soundEnabled, sounds]);

  const startGame = () => {
    setScore(0);
    setTimeLeft(30);
    setIsPlaying(true);
    setStreak(0);
    setBallPosition({ x: 50, y: 30 });
    setBallVelocity({ x: (Math.random() - 0.5) * 4, y: 0 });
    if (soundEnabled) {
      sounds.playGameStart();
      sounds.startBgMusic("fast");
    }
  };

  const handleHit = useCallback((hitX: number) => {
    if (!isPlaying) return;
    
    const distance = Math.abs(ballPosition.x - hitX);
    const verticalOk = ballPosition.y > 50 && ballPosition.y < 85;
    
    if (distance < 20 && verticalOk) {
      // Successful hit!
      const isSpike = distance < 8;
      const points = isSpike ? (streak >= 2 ? 3 : 2) : 1;
      
      setScore(s => s + points);
      setStreak(s => s + 1);
      setHitResult(isSpike ? "spike" : "bump");
      if (soundEnabled) sounds.playScore();
      
      // Send ball up
      setBallVelocity({
        x: (Math.random() - 0.5) * 6,
        y: isSpike ? -8 : -6
      });
      
      setTimeout(() => setHitResult(null), 300);
    }
  }, [isPlaying, ballPosition, streak, soundEnabled, sounds]);

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
          style={{ background: "linear-gradient(180deg, #60a5fa 0%, #3b82f6 50%, #f4a460 100%)" }}
        >
          {/* Net */}
          <div className="absolute left-0 right-0 top-1/2 h-1 bg-white/80" />
          <div className="absolute left-1/2 top-1/3 bottom-1/2 w-1 bg-white/60 -translate-x-1/2" />
          
          {/* Ball */}
          <motion.div
            className="absolute text-3xl"
            animate={{ 
              left: `${ballPosition.x}%`, 
              top: `${ballPosition.y}%`,
              rotate: ballPosition.x * 3
            }}
            transition={{ duration: 0.05 }}
            style={{ transform: "translate(-50%, -50%)" }}
          >
            🏐
          </motion.div>

          {/* Hit zones */}
          {isPlaying && (
            <div className="absolute bottom-0 left-0 right-0 flex">
              {[16.5, 50, 83.5].map((pos) => (
                <button
                  key={pos}
                  onClick={() => handleHit(pos)}
                  className="flex-1 h-20 bg-transparent hover:bg-white/10 transition-colors border-x border-white/20"
                >
                  <span className="text-3xl">🙌</span>
                </button>
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
              🔥 {streak}x Rally!
            </div>
          )}

          {/* Hit result */}
          <AnimatePresence>
            {hitResult && (
              <motion.div
                initial={{ scale: 0, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0, opacity: 0 }}
                className={`absolute top-1/3 left-1/2 -translate-x-1/2 text-2xl font-bold ${
                  hitResult === "spike" ? "text-yellow-400" : 
                  hitResult === "bump" ? "text-green-400" : "text-red-400"
                }`}
              >
                {hitResult === "spike" ? "💥 SPIKE!" : 
                 hitResult === "bump" ? "👍 Bump!" : "❌ Miss!"}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Start overlay */}
          {!isPlaying && (
            <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center">
              <h3 className="text-2xl font-bold text-white mb-4">
                {timeLeft === 0 ? `Game Over! Score: ${score}` : "🏐 Volleyball Rally"}
              </h3>
              <Button onClick={startGame} size="lg" className="gap-2">
                {timeLeft === 0 ? <RotateCcw className="w-4 h-4" /> : null}
                {timeLeft === 0 ? "Play Again" : "Start Game"}
              </Button>
            </div>
          )}
        </div>

        <p className="text-center text-sm text-muted-foreground mt-3">
          Tap below the ball to bump it up! Perfect timing = Spike bonus!
        </p>
      </CardContent>
    </Card>
  );
};

export default VolleyballGame;