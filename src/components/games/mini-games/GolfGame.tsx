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

const GolfGame = ({ onBack, onScore, highScore }: Props) => {
  const [score, setScore] = useState(0);
  const [hole, setHole] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [power, setPower] = useState(0);
  const [isPoweringUp, setIsPoweringUp] = useState(false);
  const [ballPosition, setBallPosition] = useState({ x: 50, y: 80 });
  const [holePosition, setHolePosition] = useState({ x: 50, y: 20 });
  const [shotResult, setShotResult] = useState<"hole" | "close" | "miss" | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [strokes, setStrokes] = useState(0);
  
  const sounds = useGameSounds();

  useEffect(() => {
    return () => {
      sounds.stopBgMusic();
    };
  }, [sounds]);

  const startGame = () => {
    setScore(0);
    setHole(1);
    setStrokes(0);
    setIsPlaying(true);
    setBallPosition({ x: 50, y: 80 });
    randomizeHole();
    if (soundEnabled) {
      sounds.playGameStart();
      sounds.startBgMusic("slow");
    }
  };

  const randomizeHole = () => {
    setHolePosition({
      x: 20 + Math.random() * 60,
      y: 15 + Math.random() * 20
    });
  };

  const handleMouseDown = () => {
    if (!isPlaying || isPoweringUp) return;
    setIsPoweringUp(true);
    setPower(0);
  };

  const handleMouseUp = useCallback(() => {
    if (!isPlaying || !isPoweringUp) return;
    setIsPoweringUp(false);
    
    // Calculate shot
    const targetPower = 50; // Optimal power is 50%
    const powerDiff = Math.abs(power - targetPower);
    const accuracy = Math.max(0, 100 - powerDiff * 2);
    
    // Add some randomness
    const finalX = holePosition.x + (Math.random() - 0.5) * (100 - accuracy) * 0.5;
    const finalY = holePosition.y + (Math.random() - 0.5) * (100 - accuracy) * 0.3;
    
    setBallPosition({ x: finalX, y: Math.max(10, finalY) });
    setStrokes(s => s + 1);
    
    const distance = Math.sqrt(
      Math.pow(finalX - holePosition.x, 2) + 
      Math.pow(finalY - holePosition.y, 2)
    );
    
    setTimeout(() => {
      if (distance < 5) {
        // Hole in one or sink putt
        const points = strokes === 0 ? 10 : Math.max(1, 5 - strokes);
        setScore(s => s + points);
        setShotResult("hole");
        if (soundEnabled) sounds.playScore();
        
        setTimeout(() => {
          setShotResult(null);
          if (hole < 9) {
            setHole(h => h + 1);
            setStrokes(0);
            setBallPosition({ x: 50, y: 80 });
            randomizeHole();
          } else {
            setIsPlaying(false);
            if (soundEnabled) sounds.playGameOver();
            sounds.stopBgMusic();
            onScore(score + points);
          }
        }, 1000);
      } else if (distance < 15) {
        setShotResult("close");
        setTimeout(() => setShotResult(null), 500);
      } else {
        setShotResult("miss");
        if (soundEnabled) sounds.playMiss();
        setTimeout(() => setShotResult(null), 500);
      }
    }, 600);
  }, [isPlaying, isPoweringUp, power, holePosition, strokes, hole, score, soundEnabled, sounds, onScore]);

  useEffect(() => {
    if (isPoweringUp) {
      const interval = setInterval(() => {
        setPower(p => {
          if (p >= 100) return 0;
          return p + 3;
        });
      }, 30);
      return () => clearInterval(interval);
    }
  }, [isPoweringUp]);

  useEffect(() => {
    if (isPoweringUp) {
      window.addEventListener("mouseup", handleMouseUp);
      window.addEventListener("touchend", handleMouseUp);
      return () => {
        window.removeEventListener("mouseup", handleMouseUp);
        window.removeEventListener("touchend", handleMouseUp);
      };
    }
  }, [isPoweringUp, handleMouseUp]);

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
          className="relative h-80 rounded-xl overflow-hidden select-none"
          style={{ background: "linear-gradient(180deg, #87CEEB 0%, #228B22 30%, #2d5a27 100%)" }}
          onMouseDown={handleMouseDown}
          onTouchStart={handleMouseDown}
        >
          {/* Hole/Flag */}
          <motion.div
            className="absolute text-3xl"
            style={{ 
              left: `${holePosition.x}%`, 
              top: `${holePosition.y}%`,
              transform: "translate(-50%, -50%)"
            }}
          >
            ⛳
          </motion.div>

          {/* Ball */}
          <motion.div
            className="absolute text-2xl"
            animate={{ 
              left: `${ballPosition.x}%`, 
              top: `${ballPosition.y}%`
            }}
            transition={{ duration: 0.6, type: "spring" }}
            style={{ transform: "translate(-50%, -50%)" }}
          >
            ⚪
          </motion.div>

          {/* Power meter */}
          {isPoweringUp && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-48 h-6 bg-black/40 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{
                  width: `${power}%`,
                  background: power < 40 ? "#22c55e" : power < 60 ? "#eab308" : "#ef4444"
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center text-white text-sm font-bold">
                {Math.round(power)}%
              </div>
            </div>
          )}

          {/* Score display */}
          <div className="absolute top-2 right-2 bg-black/60 px-3 py-1 rounded-lg text-white font-bold">
            Hole {hole}/9 | Score: {score} | Strokes: {strokes}
          </div>

          {/* Result */}
          <AnimatePresence>
            {shotResult && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                className={`absolute inset-0 flex items-center justify-center text-4xl font-bold ${
                  shotResult === "hole" ? "text-yellow-400" : 
                  shotResult === "close" ? "text-green-400" : "text-red-400"
                }`}
              >
                {shotResult === "hole" ? "🎉 IN THE HOLE!" : 
                 shotResult === "close" ? "👍 Nice shot!" : "😬 Keep trying!"}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Start overlay */}
          {!isPlaying && (
            <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center">
              <h3 className="text-2xl font-bold text-white mb-4">
                {hole > 1 ? `Game Over! Final Score: ${score}` : "⛳ Mini Golf"}
              </h3>
              <Button onClick={startGame} size="lg" className="gap-2">
                {hole > 1 ? <RotateCcw className="w-4 h-4" /> : null}
                {hole > 1 ? "Play Again" : "Start Game"}
              </Button>
            </div>
          )}
        </div>

        <p className="text-center text-sm text-muted-foreground mt-3">
          Hold to power up, release to swing! Aim for 50% power.
        </p>
      </CardContent>
    </Card>
  );
};

export default GolfGame;