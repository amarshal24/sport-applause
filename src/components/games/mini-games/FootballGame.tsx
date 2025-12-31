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

const FootballGame = ({ onBack, onScore, highScore }: Props) => {
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [isPlaying, setIsPlaying] = useState(false);
  const [power, setPower] = useState(0);
  const [isPoweringUp, setIsPoweringUp] = useState(false);
  const [receiverPosition, setReceiverPosition] = useState(50);
  const [ballThrown, setBallThrown] = useState(false);
  const [ballPosition, setBallPosition] = useState({ x: 20, y: 80 });
  const [result, setResult] = useState<"touchdown" | "incomplete" | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  
  const sounds = useGameSounds();

  useEffect(() => {
    let timer: NodeJS.Timeout;
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
    return () => clearInterval(timer);
  }, [isPlaying, timeLeft, score, onScore, soundEnabled, sounds]);

  useEffect(() => {
    if (isPlaying && !ballThrown) {
      const moveReceiver = setInterval(() => {
        setReceiverPosition(prev => {
          const direction = Math.random() > 0.5 ? 1 : -1;
          const newPos = prev + direction * (10 + Math.random() * 15);
          return Math.max(30, Math.min(70, newPos));
        });
      }, 800);
      return () => clearInterval(moveReceiver);
    }
  }, [isPlaying, ballThrown]);

  useEffect(() => {
    let powerInterval: NodeJS.Timeout;
    if (isPoweringUp && isPlaying) {
      powerInterval = setInterval(() => {
        setPower(p => {
          const newPower = p >= 100 ? 0 : p + 5;
          if (soundEnabled) sounds.playPowerUp(newPower);
          return newPower;
        });
      }, 50);
    }
    return () => clearInterval(powerInterval);
  }, [isPoweringUp, isPlaying, soundEnabled, sounds]);

  const startGame = () => {
    setScore(0);
    setTimeLeft(30);
    setIsPlaying(true);
    setPower(0);
    setBallThrown(false);
    setResult(null);
    setBallPosition({ x: 20, y: 80 });
    if (soundEnabled) {
      sounds.playGameStart();
      sounds.startBgMusic("fast");
    }
  };

  const startPowerUp = () => {
    if (!isPlaying || ballThrown) return;
    setIsPoweringUp(true);
  };

  const throwBall = useCallback(() => {
    if (!isPlaying || ballThrown || !isPoweringUp) return;
    
    setIsPoweringUp(false);
    setBallThrown(true);
    if (soundEnabled) sounds.playShoot();

    const throwDistance = power;
    const targetX = receiverPosition;
    const accuracy = Math.abs(throwDistance - 50);

    setBallPosition({ x: targetX, y: 20 });

    setTimeout(() => {
      const isCatch = accuracy < 25 && Math.random() > 0.3;
      
      if (isCatch) {
        const points = power >= 40 && power <= 60 ? 7 : 6;
        setScore(s => s + points);
        setResult("touchdown");
        if (soundEnabled) sounds.playScore();
      } else {
        setResult("incomplete");
        if (soundEnabled) sounds.playMiss();
      }

      setTimeout(() => {
        setBallThrown(false);
        setBallPosition({ x: 20, y: 80 });
        setPower(0);
        setResult(null);
      }, 1000);
    }, 600);
  }, [isPlaying, ballThrown, isPoweringUp, power, receiverPosition, soundEnabled, sounds]);

  const toggleSound = () => {
    if (soundEnabled) {
      sounds.stopBgMusic();
    } else if (isPlaying) {
      sounds.startBgMusic("fast");
    }
    setSoundEnabled(prev => !prev);
  };

  const getPowerColor = () => {
    if (power >= 40 && power <= 60) return "bg-green-500";
    if (power >= 25 && power <= 75) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <Card className="glass-effect overflow-hidden">
      <div className="bg-gradient-to-r from-amber-600 to-yellow-500 text-white p-4">
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
              <div className="text-xs text-white/70">Points</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{timeLeft}s</div>
              <div className="text-xs text-white/70">Time</div>
            </div>
          </div>
        </div>
      </div>

      <CardContent className="p-0">
        <div className="relative h-80 bg-gradient-to-b from-green-600 to-green-700 overflow-hidden">
          {[...Array(11)].map((_, i) => (
            <div 
              key={i}
              className="absolute w-full h-0.5 bg-white/30"
              style={{ top: `${i * 10}%` }}
            />
          ))}
          
          <div className="absolute top-0 left-0 right-0 h-16 bg-amber-600/50 flex items-center justify-center">
            <span className="text-white/70 font-bold text-lg">END ZONE</span>
          </div>

          <motion.div
            className="absolute text-4xl"
            style={{ top: "15%" }}
            animate={{ left: `${receiverPosition}%` }}
            transition={{ type: "spring", stiffness: 100 }}
          >
            🏃
          </motion.div>

          <div className="absolute bottom-8 left-16 text-4xl">
            🏈
          </div>

          {ballThrown && (
            <motion.div
              className="absolute text-3xl"
              initial={{ left: "20%", top: "80%" }}
              animate={{ 
                left: `${ballPosition.x}%`, 
                top: `${ballPosition.y}%`,
                rotate: 360
              }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              🏈
            </motion.div>
          )}

          <AnimatePresence>
            {result && (
              <motion.div
                className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-3xl font-bold ${
                  result === "touchdown" ? "text-yellow-300" : "text-red-400"
                }`}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1.5, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
              >
                {result === "touchdown" ? "TOUCHDOWN! 🏈🎉" : "INCOMPLETE!"}
              </motion.div>
            )}
          </AnimatePresence>

          {!isPlaying && timeLeft === 30 && (
            <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="text-center"
              >
                <div className="text-6xl mb-4">🏈</div>
                <h3 className="text-2xl font-bold mb-2">Quarterback Challenge</h3>
                <p className="text-white/70 mb-4">Hold to power up, release to throw!</p>
                {highScore > 0 && (
                  <div className="flex items-center justify-center gap-2 mb-4 text-yellow-400">
                    <Trophy className="w-5 h-5" />
                    <span>High Score: {highScore}</span>
                  </div>
                )}
                <Button onClick={startGame} size="lg" className="bg-amber-600 hover:bg-amber-700">
                  Start Game
                </Button>
              </motion.div>
            </div>
          )}
        </div>

        {isPlaying && !ballThrown && (
          <div className="p-4 bg-muted/30 space-y-3">
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>Power</span>
                <span className={power >= 40 && power <= 60 ? "text-green-500 font-bold" : ""}>
                  {power}% {power >= 40 && power <= 60 && "✓ Perfect!"}
                </span>
              </div>
              <div className="h-4 bg-muted rounded-full overflow-hidden">
                <motion.div 
                  className={`h-full ${getPowerColor()}`}
                  animate={{ width: `${power}%` }}
                  transition={{ duration: 0.05 }}
                />
              </div>
              <p className="text-xs text-muted-foreground text-center">
                Green zone (40-60%) = Perfect throw!
              </p>
            </div>
            <Button 
              size="lg"
              className="w-full bg-amber-600 hover:bg-amber-700 text-white"
              onMouseDown={startPowerUp}
              onMouseUp={throwBall}
              onMouseLeave={() => isPoweringUp && throwBall()}
              onTouchStart={startPowerUp}
              onTouchEnd={throwBall}
            >
              {isPoweringUp ? "RELEASE TO THROW! 🏈" : "HOLD TO POWER UP"}
            </Button>
          </div>
        )}

        {isPlaying && ballThrown && (
          <div className="p-6 text-center">
            <p className="text-muted-foreground">Pass in the air...</p>
          </div>
        )}

        {!isPlaying && timeLeft === 0 && (
          <div className="p-6 text-center">
            <h3 className="text-2xl font-bold mb-2">Game Over!</h3>
            <p className="text-muted-foreground mb-4">
              Final Score: {score} points! {score > highScore && score > 0 && "🎉 New High Score!"}
            </p>
            <div className="flex justify-center gap-3">
              <Button onClick={startGame} className="bg-amber-600 hover:bg-amber-700">
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

export default FootballGame;
