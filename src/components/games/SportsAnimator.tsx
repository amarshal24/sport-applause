import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Sparkles, RotateCcw, Play, Pause } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  onBack: () => void;
}

interface Character {
  sport: string;
  emoji: string;
  color: string;
  equipment: string;
}

const characters: Character[] = [
  { sport: "Basketball", emoji: "🏀", color: "from-orange-400 to-orange-600", equipment: "🎽" },
  { sport: "Soccer", emoji: "⚽", color: "from-green-400 to-green-600", equipment: "👟" },
  { sport: "Baseball", emoji: "⚾", color: "from-red-400 to-red-600", equipment: "🧢" },
  { sport: "Tennis", emoji: "🎾", color: "from-yellow-400 to-lime-500", equipment: "🎾" },
  { sport: "Swimming", emoji: "🏊", color: "from-blue-400 to-cyan-500", equipment: "🥽" },
  { sport: "Football", emoji: "🏈", color: "from-amber-600 to-yellow-500", equipment: "🏈" },
];

const animations = [
  { id: "bounce", name: "Bounce", icon: "⬆️" },
  { id: "spin", name: "Spin", icon: "🔄" },
  { id: "wiggle", name: "Wiggle", icon: "〰️" },
  { id: "pulse", name: "Pulse", icon: "💓" },
  { id: "flip", name: "Flip", icon: "🔃" },
  { id: "wave", name: "Wave", icon: "👋" },
];

const backgrounds = [
  { id: "stadium", name: "Stadium", emoji: "🏟️", gradient: "from-emerald-500 to-emerald-700" },
  { id: "beach", name: "Beach", emoji: "🏖️", gradient: "from-amber-300 to-blue-400" },
  { id: "snow", name: "Snow", emoji: "❄️", gradient: "from-blue-100 to-blue-300" },
  { id: "sunset", name: "Sunset", emoji: "🌅", gradient: "from-orange-400 to-pink-500" },
  { id: "night", name: "Night", emoji: "🌙", gradient: "from-indigo-900 to-purple-800" },
  { id: "rainbow", name: "Rainbow", emoji: "🌈", gradient: "from-red-400 via-yellow-400 to-blue-400" },
];

const getAnimationVariants = (animationId: string) => {
  switch (animationId) {
    case "bounce":
      return {
        y: [0, -40, 0],
        transition: { duration: 0.6, repeat: Infinity, ease: "easeInOut" as const }
      };
    case "spin":
      return {
        rotate: [0, 360],
        transition: { duration: 1, repeat: Infinity, ease: "linear" as const }
      };
    case "wiggle":
      return {
        rotate: [-10, 10, -10],
        transition: { duration: 0.3, repeat: Infinity, ease: "easeInOut" as const }
      };
    case "pulse":
      return {
        scale: [1, 1.3, 1],
        transition: { duration: 0.5, repeat: Infinity, ease: "easeInOut" as const }
      };
    case "flip":
      return {
        rotateY: [0, 180, 360],
        transition: { duration: 1, repeat: Infinity, ease: "easeInOut" as const }
      };
    case "wave":
      return {
        x: [-20, 20, -20],
        y: [-10, 10, -10],
        transition: { duration: 0.8, repeat: Infinity, ease: "easeInOut" as const }
      };
    default:
      return {};
  }
};

const SportsAnimator = ({ onBack }: Props) => {
  const [selectedCharacter, setSelectedCharacter] = useState<Character>(characters[0]);
  const [selectedAnimation, setSelectedAnimation] = useState<string>("bounce");
  const [selectedBackground, setSelectedBackground] = useState(backgrounds[0]);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);

  const handlePlay = () => {
    setIsPlaying(!isPlaying);
    if (!isPlaying) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 2000);
    }
  };

  const handleReset = () => {
    setSelectedCharacter(characters[0]);
    setSelectedAnimation("bounce");
    setSelectedBackground(backgrounds[0]);
    setIsPlaying(true);
  };

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
            <Sparkles className="w-8 h-8" />
            Sports Animator
            <Sparkles className="w-8 h-8" />
          </CardTitle>
          <p className="text-white/80">Create your own animated sports character!</p>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* Animation Preview */}
          <div 
            className={`relative h-64 rounded-2xl bg-gradient-to-br ${selectedBackground.gradient} flex items-center justify-center overflow-hidden shadow-xl`}
          >
            {/* Confetti effect */}
            <AnimatePresence>
              {showConfetti && (
                <>
                  {[...Array(20)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute text-2xl"
                      initial={{ 
                        x: "50%", 
                        y: "50%", 
                        opacity: 1 
                      }}
                      animate={{ 
                        x: `${Math.random() * 100}%`, 
                        y: `${Math.random() * 100}%`,
                        opacity: 0,
                        rotate: Math.random() * 360
                      }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 2 }}
                    >
                      {["⭐", "🎉", "✨", "🌟", "💫"][i % 5]}
                    </motion.div>
                  ))}
                </>
              )}
            </AnimatePresence>

            {/* Character */}
            <motion.div
              className="text-8xl cursor-pointer select-none"
              animate={isPlaying ? getAnimationVariants(selectedAnimation) : {}}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handlePlay}
            >
              {selectedCharacter.emoji}
            </motion.div>

            {/* Equipment floating around */}
            <motion.div
              className="absolute top-4 right-4 text-4xl"
              animate={{ 
                y: [0, -10, 0],
                rotate: [0, 10, -10, 0]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {selectedCharacter.equipment}
            </motion.div>

            {/* Background emoji */}
            <div className="absolute bottom-4 left-4 text-3xl opacity-50">
              {selectedBackground.emoji}
            </div>
          </div>

          {/* Controls */}
          <div className="flex justify-center gap-4">
            <Button
              onClick={handlePlay}
              className={`${isPlaying ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`}
            >
              {isPlaying ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
              {isPlaying ? 'Pause' : 'Play'}
            </Button>
            <Button variant="outline" onClick={handleReset}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
          </div>

          {/* Character Selection */}
          <div>
            <h3 className="text-lg font-semibold mb-3 text-center">Choose Your Sport</h3>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
              {characters.map((char) => (
                <motion.button
                  key={char.sport}
                  onClick={() => setSelectedCharacter(char)}
                  className={`p-4 rounded-xl bg-gradient-to-br ${char.color} text-4xl transition-all ${
                    selectedCharacter.sport === char.sport 
                      ? 'ring-4 ring-primary ring-offset-2 ring-offset-background scale-105' 
                      : 'opacity-70 hover:opacity-100'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {char.emoji}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Animation Selection */}
          <div>
            <h3 className="text-lg font-semibold mb-3 text-center">Choose Animation</h3>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
              {animations.map((anim) => (
                <motion.button
                  key={anim.id}
                  onClick={() => setSelectedAnimation(anim.id)}
                  className={`p-3 rounded-xl border-2 transition-all ${
                    selectedAnimation === anim.id 
                      ? 'border-primary bg-primary/20 shadow-lg' 
                      : 'border-border hover:border-primary/50'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <div className="text-2xl mb-1">{anim.icon}</div>
                  <div className="text-xs font-medium">{anim.name}</div>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Background Selection */}
          <div>
            <h3 className="text-lg font-semibold mb-3 text-center">Choose Background</h3>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
              {backgrounds.map((bg) => (
                <motion.button
                  key={bg.id}
                  onClick={() => setSelectedBackground(bg)}
                  className={`p-3 rounded-xl bg-gradient-to-br ${bg.gradient} transition-all ${
                    selectedBackground.id === bg.id 
                      ? 'ring-4 ring-primary ring-offset-2 ring-offset-background scale-105' 
                      : 'opacity-70 hover:opacity-100'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <div className="text-2xl mb-1">{bg.emoji}</div>
                  <div className="text-xs font-medium text-white drop-shadow-md">{bg.name}</div>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Fun tip */}
          <div className="text-center p-4 bg-primary/10 rounded-xl">
            <p className="text-sm text-muted-foreground">
              💡 <span className="font-medium">Tip:</span> Tap the character to see confetti! Mix different sports, animations, and backgrounds to create fun combinations!
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SportsAnimator;
