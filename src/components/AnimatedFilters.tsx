import { motion } from "framer-motion";

export type FilterType =
  | "none" | "sparkle" | "fire" | "confetti" | "glow" | "victory" | "slowmo" | "replay" | "champion"
  // PRO animations (in-app purchase)
  | "lightning" | "smoke" | "embers" | "snow" | "shockwave" | "spotlight" | "goldrain" | "matrix";
export type ColorFilterType =
  | "none" | "vintage" | "vivid" | "bw" | "sepia" | "cool" | "warm" | "dramatic" | "neon"
  // PRO color looks (in-app purchase)
  | "cyberpunk" | "gold" | "noir" | "vhs" | "dream" | "thermal" | "midnight" | "comic";


interface AnimatedFilterProps {
  type: FilterType;
}

interface ColorFilterProps {
  type: ColorFilterType;
}

export const getColorFilterStyle = (type: ColorFilterType): React.CSSProperties => {
  switch (type) {
    case "vintage":
      return { filter: "sepia(0.3) contrast(1.1) brightness(0.9) saturate(0.8)" };
    case "vivid":
      return { filter: "saturate(1.5) contrast(1.1) brightness(1.05)" };
    case "bw":
      return { filter: "grayscale(1) contrast(1.2)" };
    case "sepia":
      return { filter: "sepia(0.8) contrast(1.1)" };
    case "cool":
      return { filter: "saturate(1.1) hue-rotate(-15deg) brightness(1.05)" };
    case "warm":
      return { filter: "saturate(1.2) hue-rotate(15deg) brightness(1.05)" };
    case "dramatic":
      return { filter: "contrast(1.4) saturate(1.2) brightness(0.9)" };
    case "neon":
      return { filter: "saturate(1.8) contrast(1.3) brightness(1.1) hue-rotate(10deg)" };
    // PRO looks
    case "cyberpunk":
      return { filter: "saturate(2) contrast(1.35) hue-rotate(-35deg) brightness(1.05)" };
    case "gold":
      return { filter: "sepia(0.55) saturate(1.8) contrast(1.15) brightness(1.08) hue-rotate(-10deg)" };
    case "noir":
      return { filter: "grayscale(0.9) contrast(1.6) brightness(0.85)" };
    case "vhs":
      return { filter: "saturate(1.35) contrast(0.92) brightness(1.1) hue-rotate(-8deg) blur(0.3px)" };
    case "dream":
      return { filter: "saturate(1.25) brightness(1.15) contrast(0.9) blur(0.6px)" };
    case "thermal":
      return { filter: "invert(1) hue-rotate(180deg) saturate(2.5) contrast(1.3)" };
    case "midnight":
      return { filter: "brightness(0.75) contrast(1.25) saturate(0.9) hue-rotate(200deg)" };
    case "comic":
      return { filter: "saturate(2.2) contrast(1.8) brightness(1.05)" };
    default:
      return {};
  }
};

export const colorFilters: { type: ColorFilterType; label: string; preview: string; pro?: boolean }[] = [
  { type: "none", label: "None", preview: "bg-gradient-to-br from-gray-400 to-gray-600" },
  { type: "vintage", label: "Vintage", preview: "bg-gradient-to-br from-amber-700 to-orange-900" },
  { type: "vivid", label: "Vivid", preview: "bg-gradient-to-br from-pink-500 to-purple-600" },
  { type: "bw", label: "B&W", preview: "bg-gradient-to-br from-gray-800 to-gray-400" },
  { type: "sepia", label: "Sepia", preview: "bg-gradient-to-br from-amber-600 to-yellow-800" },
  { type: "cool", label: "Cool", preview: "bg-gradient-to-br from-blue-400 to-cyan-600" },
  { type: "warm", label: "Warm", preview: "bg-gradient-to-br from-orange-400 to-red-500" },
  { type: "dramatic", label: "Dramatic", preview: "bg-gradient-to-br from-gray-900 to-purple-900" },
  { type: "neon", label: "Neon", preview: "bg-gradient-to-br from-pink-500 to-cyan-400" },
  // PRO
  { type: "cyberpunk", label: "Cyberpunk", preview: "bg-gradient-to-br from-fuchsia-600 to-cyan-500", pro: true },
  { type: "gold", label: "Gold Hour", preview: "bg-gradient-to-br from-yellow-400 to-amber-700", pro: true },
  { type: "noir", label: "Noir", preview: "bg-gradient-to-br from-zinc-900 to-zinc-500", pro: true },
  { type: "vhs", label: "VHS 90s", preview: "bg-gradient-to-br from-teal-400 to-purple-500", pro: true },
  { type: "dream", label: "Dreamy", preview: "bg-gradient-to-br from-pink-300 to-sky-300", pro: true },
  { type: "thermal", label: "Thermal", preview: "bg-gradient-to-br from-red-500 to-blue-600", pro: true },
  { type: "midnight", label: "Midnight", preview: "bg-gradient-to-br from-slate-900 to-blue-800", pro: true },
  { type: "comic", label: "Comic Pop", preview: "bg-gradient-to-br from-orange-400 to-pink-600", pro: true },
];

export const animatedFilters: { type: FilterType; label: string; icon: string; pro?: boolean }[] = [
  { type: "none", label: "None", icon: "✕" },
  { type: "sparkle", label: "Sparkle", icon: "✨" },
  { type: "fire", label: "Fire", icon: "🔥" },
  { type: "confetti", label: "Confetti", icon: "🎉" },
  { type: "glow", label: "Glow", icon: "💫" },
  { type: "victory", label: "Victory", icon: "🏆" },
  { type: "slowmo", label: "Slow-Mo", icon: "⏱️" },
  { type: "replay", label: "Replay", icon: "🔄" },
  { type: "champion", label: "Champion", icon: "👑" },
  // PRO
  { type: "lightning", label: "Lightning", icon: "⚡", pro: true },
  { type: "smoke", label: "Smoke", icon: "💨", pro: true },
  { type: "embers", label: "Embers", icon: "🌋", pro: true },
  { type: "snow", label: "Snowfall", icon: "❄️", pro: true },
  { type: "shockwave", label: "Shockwave", icon: "💥", pro: true },
  { type: "spotlight", label: "Spotlight", icon: "🔦", pro: true },
  { type: "goldrain", label: "Gold Rain", icon: "🪙", pro: true },
  { type: "matrix", label: "Matrix", icon: "🟩", pro: true },
];

export const PRO_COLOR_FILTERS = new Set<ColorFilterType>(
  colorFilters.filter((f) => f.pro).map((f) => f.type)
);
export const PRO_ANIMATED_FILTERS = new Set<FilterType>(
  animatedFilters.filter((f) => f.pro).map((f) => f.type)
);

export const AnimatedFilter = ({ type }: AnimatedFilterProps) => {
  if (type === "none") return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-lg">
      {type === "sparkle" && <SparkleFilter />}
      {type === "fire" && <FireFilter />}
      {type === "confetti" && <ConfettiFilter />}
      {type === "glow" && <GlowFilter />}
      {type === "victory" && <VictoryFilter />}
      {type === "slowmo" && <SlowMoFilter />}
      {type === "replay" && <ReplayFilter />}
      {type === "champion" && <ChampionFilter />}
      {type === "lightning" && <FlashFilter color="rgba(250,204,21,0.55)" emoji="⚡" />}
      {type === "smoke" && <DriftFilter color="rgba(156,163,175,0.5)" rising />}
      {type === "embers" && <DriftFilter color="rgba(249,115,22,0.7)" rising small />}
      {type === "snow" && <DriftFilter color="rgba(224,242,254,0.9)" small />}
      {type === "shockwave" && <RingFilter color="rgba(59,130,246,0.7)" />}
      {type === "spotlight" && <SpotlightFilter />}
      {type === "goldrain" && <DriftFilter color="rgba(250,204,21,0.9)" small />}
      {type === "matrix" && <MatrixFilter />}
    </div>
  );
};

/* ---------- PRO overlay components ---------- */

const FlashFilter = ({ color, emoji }: { color: string; emoji: string }) => (
  <>
    <motion.div
      className="absolute inset-0"
      style={{ background: `radial-gradient(circle at 50% 30%, ${color}, transparent 70%)` }}
      animate={{ opacity: [0, 1, 0.1, 0.8, 0] }}
      transition={{ duration: 1.6, repeat: Infinity, times: [0, 0.1, 0.2, 0.3, 1] }}
    />
    {[...Array(3)].map((_, i) => (
      <motion.div
        key={i}
        className="absolute text-3xl"
        style={{ left: `${20 + i * 30}%`, top: `${10 + i * 12}%` }}
        animate={{ opacity: [0, 1, 0], scale: [0.7, 1.2, 0.7] }}
        transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.25 }}
      >
        {emoji}
      </motion.div>
    ))}
  </>
);

const DriftFilter = ({
  color,
  rising,
  small,
}: { color: string; rising?: boolean; small?: boolean }) => (
  <>
    {[...Array(18)].map((_, i) => (
      <motion.div
        key={i}
        className="absolute rounded-full"
        style={{
          left: `${(i * 37) % 100}%`,
          width: small ? 6 : 26,
          height: small ? 6 : 26,
          background: small ? color : `radial-gradient(circle, ${color}, transparent 70%)`,
        }}
        animate={
          rising
            ? { y: ["105%", "-10%"], opacity: [0, 0.9, 0], scale: [0.6, 1.3, 0.4] }
            : { y: ["-10%", "105%"], opacity: [0, 1, 0], x: [0, (i % 2 ? 20 : -20)] }
        }
        transition={{ duration: 2.4 + (i % 5) * 0.3, repeat: Infinity, delay: i * 0.12, ease: "linear" }}
      />
    ))}
  </>
);

const RingFilter = ({ color }: { color: string }) => (
  <>
    {[...Array(3)].map((_, i) => (
      <motion.div
        key={i}
        className="absolute left-1/2 top-1/2 rounded-full border-4"
        style={{ borderColor: color, width: 40, height: 40, marginLeft: -20, marginTop: -20 }}
        animate={{ scale: [0.4, 6], opacity: [0.9, 0] }}
        transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.6, ease: "easeOut" }}
      />
    ))}
  </>
);

const SpotlightFilter = () => (
  <motion.div
    className="absolute inset-0"
    style={{
      background:
        "radial-gradient(circle at 50% 45%, transparent 22%, rgba(0,0,0,0.72) 72%)",
    }}
    animate={{ opacity: [0.7, 1, 0.7], scale: [1, 1.04, 1] }}
    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
  />
);

const MatrixFilter = () => (
  <>
    {[...Array(14)].map((_, i) => (
      <motion.div
        key={i}
        className="absolute font-mono text-xs text-green-400"
        style={{ left: `${(i / 14) * 100}%`, textShadow: "0 0 8px #22c55e" }}
        animate={{ y: ["-20%", "110%"], opacity: [0, 1, 0] }}
        transition={{ duration: 2 + (i % 4) * 0.4, repeat: Infinity, delay: i * 0.15, ease: "linear" }}
      >
        {"01\n10\n11\n01"}
      </motion.div>
    ))}
  </>
);


const SparkleFilter = () => {
  return (
    <>
      {[...Array(12)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 bg-primary rounded-full"
          initial={{ 
            x: Math.random() * 100 + "%", 
            y: Math.random() * 100 + "%",
            scale: 0,
            opacity: 0
          }}
          animate={{
            scale: [0, 1, 0],
            opacity: [0, 1, 0],
            rotate: [0, 180, 360]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: i * 0.15,
            ease: "easeInOut"
          }}
        />
      ))}
    </>
  );
};

const FireFilter = () => {
  return (
    <>
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute bottom-0 w-8 h-8"
          style={{
            left: `${(i / 8) * 100}%`,
            background: "radial-gradient(circle, #f97316, transparent)"
          }}
          animate={{
            y: [0, -100],
            scale: [1, 1.5, 0],
            opacity: [0.8, 0.5, 0]
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            delay: i * 0.2,
            ease: "easeOut"
          }}
        />
      ))}
    </>
  );
};

const ConfettiFilter = () => {
  const colors = ["#f43f5e", "#8b5cf6", "#3b82f6", "#10b981", "#f59e0b"];
  return (
    <>
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-3 h-3"
          style={{
            left: `${Math.random() * 100}%`,
            top: "-5%",
            backgroundColor: colors[i % colors.length],
            borderRadius: i % 2 === 0 ? "50%" : "0"
          }}
          animate={{
            y: ["0%", "110%"],
            rotate: [0, 360],
            x: [0, Math.random() * 40 - 20]
          }}
          transition={{
            duration: 2 + Math.random(),
            repeat: Infinity,
            delay: i * 0.1,
            ease: "linear"
          }}
        />
      ))}
    </>
  );
};

const GlowFilter = () => {
  return (
    <motion.div
      className="absolute inset-0 rounded-lg"
      style={{
        background: "radial-gradient(circle at center, rgba(139, 92, 246, 0.3), transparent)",
        boxShadow: "0 0 40px rgba(139, 92, 246, 0.6)"
      }}
      animate={{
        opacity: [0.5, 1, 0.5],
        scale: [0.95, 1.05, 0.95]
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    />
  );
};

const VictoryFilter = () => {
  return (
    <>
      <motion.div
        className="absolute inset-0 rounded-lg border-4 border-green-500"
        style={{
          boxShadow: "0 0 30px rgba(34, 197, 94, 0.5)"
        }}
        animate={{
          borderWidth: ["2px", "4px", "2px"],
          opacity: [0.6, 1, 0.6]
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-8 bg-yellow-400"
          style={{
            left: `${(i / 6) * 100}%`,
            top: "50%"
          }}
          animate={{
            scaleY: [0, 1.5, 0],
            opacity: [0, 1, 0]
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            delay: i * 0.15,
            ease: "easeOut"
          }}
        />
      ))}
    </>
  );
};

const SlowMoFilter = () => {
  return (
    <>
      {/* Motion blur lines */}
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute h-0.5 bg-gradient-to-r from-transparent via-white/50 to-transparent"
          style={{
            top: `${20 + i * 15}%`,
            left: 0,
            right: 0,
          }}
          animate={{
            opacity: [0, 0.6, 0],
            scaleX: [0.5, 1.2, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: i * 0.3,
            ease: "easeInOut"
          }}
        />
      ))}
      <motion.div
        className="absolute top-4 left-4 text-white/80 text-sm font-bold bg-black/40 px-2 py-1 rounded"
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        SLOW-MO
      </motion.div>
    </>
  );
};

const ReplayFilter = () => {
  return (
    <>
      <motion.div
        className="absolute top-4 right-4 flex items-center gap-2 bg-red-500/80 px-3 py-1 rounded-full"
        animate={{ opacity: [0.7, 1, 0.7], scale: [0.95, 1, 0.95] }}
        transition={{ duration: 1, repeat: Infinity }}
      >
        <motion.div
          className="w-2 h-2 bg-white rounded-full"
          animate={{ scale: [1, 1.3, 1] }}
          transition={{ duration: 0.5, repeat: Infinity }}
        />
        <span className="text-white text-xs font-bold">REPLAY</span>
      </motion.div>
      <motion.div
        className="absolute inset-0 border-4 border-red-500/50 rounded-lg"
        animate={{ opacity: [0.3, 0.7, 0.3] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      />
    </>
  );
};

const ChampionFilter = () => {
  return (
    <>
      {/* Crown effect at top */}
      <motion.div
        className="absolute top-2 left-1/2 -translate-x-1/2 text-4xl"
        animate={{ 
          y: [0, -5, 0],
          rotate: [-5, 5, -5],
          scale: [1, 1.1, 1]
        }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        👑
      </motion.div>
      {/* Gold particle effects */}
      {[...Array(10)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 rounded-full"
          style={{
            background: "linear-gradient(135deg, #fbbf24, #f59e0b)",
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            scale: [0, 1, 0],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            delay: i * 0.2,
          }}
        />
      ))}
      {/* Gold border glow */}
      <motion.div
        className="absolute inset-0 rounded-lg"
        style={{
          boxShadow: "inset 0 0 30px rgba(251, 191, 36, 0.4), 0 0 20px rgba(251, 191, 36, 0.3)"
        }}
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
    </>
  );
};
