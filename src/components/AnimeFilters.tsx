import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export type AnimeFilterType = 
  | "none" 
  | "anime-classic" 
  | "anime-soft" 
  | "manga" 
  | "cel-shaded" 
  | "cyberpunk" 
  | "studio-ghibli" 
  | "shoujo" 
  | "retro-anime"
  | "speed-lines"
  | "dramatic-zoom"
  | "sakura";

interface AnimeFilterProps {
  selectedFilter: AnimeFilterType;
  onFilterChange: (filter: AnimeFilterType) => void;
}

export const animeFilters: { type: AnimeFilterType; label: string; icon: string; description: string }[] = [
  { type: "none", label: "Original", icon: "🎬", description: "No filter" },
  { type: "anime-classic", label: "Anime", icon: "🎌", description: "Classic anime style" },
  { type: "anime-soft", label: "Soft Anime", icon: "🌸", description: "Soft pastel anime" },
  { type: "manga", label: "Manga", icon: "📖", description: "Black & white manga" },
  { type: "cel-shaded", label: "Cel-Shaded", icon: "🎨", description: "Bold cel-shaded" },
  { type: "cyberpunk", label: "Cyberpunk", icon: "🌆", description: "Neon cyberpunk" },
  { type: "studio-ghibli", label: "Ghibli", icon: "🏔️", description: "Studio Ghibli style" },
  { type: "shoujo", label: "Shoujo", icon: "💖", description: "Sparkly shoujo" },
  { type: "retro-anime", label: "Retro", icon: "📺", description: "80s/90s anime" },
  { type: "sakura", label: "Sakura", icon: "🌸", description: "Falling cherry blossoms" },
  { type: "speed-lines", label: "Speed Lines", icon: "💨", description: "Action speed lines" },
  { type: "dramatic-zoom", label: "Dramatic", icon: "⚡", description: "Intense zoom effect" },
];

export const getAnimeFilterStyle = (type: AnimeFilterType): React.CSSProperties => {
  switch (type) {
    case "anime-classic":
      return { 
        filter: "saturate(1.4) contrast(1.15) brightness(1.05)",
      };
    case "anime-soft":
      return { 
        filter: "saturate(1.2) contrast(1.05) brightness(1.1) blur(0.3px)",
      };
    case "manga":
      return { 
        filter: "grayscale(1) contrast(1.5) brightness(1.1)",
      };
    case "cel-shaded":
      return { 
        filter: "saturate(1.6) contrast(1.4) brightness(1.0)",
      };
    case "cyberpunk":
      return { 
        filter: "saturate(1.8) contrast(1.3) hue-rotate(-10deg) brightness(0.95)",
      };
    case "studio-ghibli":
      return { 
        filter: "saturate(1.3) contrast(1.1) brightness(1.08) sepia(0.1)",
      };
    case "shoujo":
      return { 
        filter: "saturate(1.25) contrast(1.05) brightness(1.15) hue-rotate(5deg)",
      };
    case "retro-anime":
      return { 
        filter: "saturate(1.1) contrast(1.2) brightness(0.95) sepia(0.15)",
      };
    case "sakura":
      return { 
        filter: "saturate(1.2) contrast(1.05) brightness(1.1) hue-rotate(3deg)",
      };
    case "speed-lines":
      return { 
        filter: "saturate(1.3) contrast(1.2) brightness(1.0)",
      };
    case "dramatic-zoom":
      return { 
        filter: "saturate(1.4) contrast(1.25) brightness(0.95)",
      };
    default:
      return {};
  }
};

// Overlay effects for each anime filter type
export const AnimeFilterOverlay = ({ type }: { type: AnimeFilterType }) => {
  if (type === "none") return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-5">
      {type === "shoujo" && <ShoujoSparkles />}
      {type === "cyberpunk" && <CyberpunkScanlines />}
      {type === "retro-anime" && <RetroVHS />}
      {type === "cel-shaded" && <CelShadedEdges />}
      {type === "sakura" && <SakuraPetals />}
      {type === "speed-lines" && <SpeedLines />}
      {type === "dramatic-zoom" && <DramaticZoom />}
      {type === "studio-ghibli" && <GhibliDust />}
      {type === "anime-soft" && <SoftGlow />}
    </div>
  );
};

const SakuraPetals = () => {
  return (
    <>
      {[...Array(15)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{
            left: `${Math.random() * 120 - 10}%`,
            top: "-20px",
          }}
          animate={{
            y: ["0vh", "120vh"],
            x: [0, Math.sin(i) * 100],
            rotate: [0, 360 * (Math.random() > 0.5 ? 1 : -1)],
          }}
          transition={{
            duration: 4 + Math.random() * 3,
            repeat: Infinity,
            delay: i * 0.3,
            ease: "linear",
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <ellipse
              cx="12"
              cy="12"
              rx="6"
              ry="10"
              fill="rgba(255, 183, 197, 0.7)"
              transform="rotate(45 12 12)"
            />
            <ellipse
              cx="12"
              cy="12"
              rx="4"
              ry="8"
              fill="rgba(255, 218, 225, 0.8)"
              transform="rotate(45 12 12)"
            />
          </svg>
        </motion.div>
      ))}
    </>
  );
};

const SpeedLines = () => {
  return (
    <>
      {/* Radial speed lines from center */}
      {[...Array(24)].map((_, i) => {
        const angle = (i / 24) * 360;
        return (
          <motion.div
            key={i}
            className="absolute left-1/2 top-1/2 origin-left"
            style={{
              width: "150%",
              height: "2px",
              background: `linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.6) 30%, transparent 100%)`,
              transform: `rotate(${angle}deg)`,
            }}
            animate={{
              opacity: [0, 0.8, 0],
              scaleX: [0.3, 1, 0.3],
            }}
            transition={{
              duration: 0.8,
              repeat: Infinity,
              delay: (i % 8) * 0.1,
              ease: "easeOut",
            }}
          />
        );
      })}
      {/* Center focus effect */}
      <motion.div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full"
        style={{
          background: "radial-gradient(circle, transparent 40%, rgba(0,0,0,0.3) 100%)",
        }}
        animate={{
          scale: [0.8, 1.2, 0.8],
          opacity: [0.5, 0.8, 0.5],
        }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </>
  );
};

const DramaticZoom = () => {
  return (
    <>
      {/* Zoom lines from edges */}
      {[...Array(20)].map((_, i) => {
        const isTop = i < 5;
        const isBottom = i >= 5 && i < 10;
        const isLeft = i >= 10 && i < 15;
        const isRight = i >= 15;
        
        const position = (i % 5) * 20 + 10;
        
        return (
          <motion.div
            key={i}
            className="absolute"
            style={{
              ...(isTop && { top: 0, left: `${position}%`, width: "3px", height: "40%" }),
              ...(isBottom && { bottom: 0, left: `${position}%`, width: "3px", height: "40%" }),
              ...(isLeft && { left: 0, top: `${position}%`, height: "3px", width: "40%" }),
              ...(isRight && { right: 0, top: `${position}%`, height: "3px", width: "40%" }),
              background: isTop || isBottom 
                ? "linear-gradient(to bottom, rgba(255,255,255,0.8), transparent)"
                : "linear-gradient(to right, rgba(255,255,255,0.8), transparent)",
              transformOrigin: isTop ? "top" : isBottom ? "bottom" : isLeft ? "left" : "right",
            }}
            animate={{
              scaleY: isTop || isBottom ? [0, 1, 0] : undefined,
              scaleX: isLeft || isRight ? [0, 1, 0] : undefined,
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 0.6,
              repeat: Infinity,
              delay: (i % 5) * 0.08,
              ease: "easeOut",
            }}
          />
        );
      })}
      {/* Dramatic vignette pulse */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(circle at center, transparent 30%, rgba(0,0,0,0.6) 100%)",
        }}
        animate={{
          opacity: [0.3, 0.7, 0.3],
        }}
        transition={{
          duration: 0.8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      {/* Impact flash */}
      <motion.div
        className="absolute inset-0 bg-white"
        animate={{
          opacity: [0, 0.3, 0],
        }}
        transition={{
          duration: 0.4,
          repeat: Infinity,
          repeatDelay: 2,
          ease: "easeOut",
        }}
      />
    </>
  );
};

const GhibliDust = () => {
  return (
    <>
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: `${Math.random() * 4 + 2}px`,
            height: `${Math.random() * 4 + 2}px`,
            background: "rgba(255, 248, 220, 0.6)",
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            boxShadow: "0 0 4px rgba(255, 248, 220, 0.8)",
          }}
          animate={{
            y: [0, -30, 0],
            x: [0, Math.random() * 20 - 10, 0],
            opacity: [0.3, 0.8, 0.3],
            scale: [0.8, 1.2, 0.8],
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            repeat: Infinity,
            delay: i * 0.2,
            ease: "easeInOut",
          }}
        />
      ))}
    </>
  );
};

const SoftGlow = () => {
  return (
    <motion.div
      className="absolute inset-0"
      style={{
        background: "radial-gradient(ellipse at 30% 20%, rgba(255, 182, 193, 0.2), transparent 50%), radial-gradient(ellipse at 70% 80%, rgba(173, 216, 230, 0.2), transparent 50%)",
      }}
      animate={{
        opacity: [0.5, 0.8, 0.5],
      }}
      transition={{
        duration: 3,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
  );
};

const ShoujoSparkles = () => {
  return (
    <>
      {[...Array(12)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{
            scale: [0, 1, 0],
            opacity: [0, 1, 0],
            rotate: [0, 180],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: i * 0.2,
            ease: "easeInOut",
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5L12 2Z"
              fill="rgba(255, 182, 193, 0.9)"
            />
          </svg>
        </motion.div>
      ))}
      {/* Additional heart sparkles */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={`heart-${i}`}
          className="absolute text-pink-300/70"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            fontSize: `${Math.random() * 10 + 10}px`,
          }}
          animate={{
            scale: [0, 1.2, 0],
            opacity: [0, 0.8, 0],
            y: [0, -20],
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            delay: i * 0.4,
            ease: "easeOut",
          }}
        >
          ♥
        </motion.div>
      ))}
    </>
  );
};

const CyberpunkScanlines = () => {
  return (
    <>
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 255, 255, 0.1) 2px, rgba(0, 255, 255, 0.1) 4px)",
        }}
      />
      <motion.div
        className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent"
        animate={{
          top: ["0%", "100%"],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "linear",
        }}
      />
      {/* Glitch effect */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(90deg, rgba(255,0,128,0.1) 0%, transparent 50%, rgba(0,255,255,0.1) 100%)",
        }}
        animate={{
          x: ["-5px", "5px", "-5px"],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 0.15,
          repeat: Infinity,
          ease: "linear",
        }}
      />
    </>
  );
};

const RetroVHS = () => {
  return (
    <>
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          background: "repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(255, 255, 255, 0.05) 1px, rgba(255, 255, 255, 0.05) 2px)",
        }}
      />
      <motion.div
        className="absolute inset-0 opacity-5"
        style={{
          background: "linear-gradient(90deg, rgba(255, 0, 0, 0.1), rgba(0, 255, 0, 0.1), rgba(0, 0, 255, 0.1))",
        }}
        animate={{
          x: ["-2px", "2px", "-2px"],
        }}
        transition={{
          duration: 0.1,
          repeat: Infinity,
          ease: "linear",
        }}
      />
      {/* VHS tracking lines */}
      <motion.div
        className="absolute left-0 right-0 h-4 bg-gradient-to-b from-transparent via-white/10 to-transparent"
        animate={{
          top: ["-10%", "110%"],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "linear",
        }}
      />
    </>
  );
};

const CelShadedEdges = () => {
  return (
    <>
      <div 
        className="absolute inset-0 opacity-30"
        style={{
          boxShadow: "inset 0 0 0 2px rgba(0, 0, 0, 0.5)",
          borderRadius: "inherit",
        }}
      />
      {/* Highlight effect */}
      <motion.div
        className="absolute top-0 left-0 right-0 h-1/3"
        style={{
          background: "linear-gradient(to bottom, rgba(255,255,255,0.1), transparent)",
        }}
        animate={{
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </>
  );
};

export const AnimeFilterSelector = ({ selectedFilter, onFilterChange }: AnimeFilterProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const currentFilter = animeFilters.find(f => f.type === selectedFilter) || animeFilters[0];

  return (
    <div className="relative">
      <Button
        size="sm"
        variant="secondary"
        className="h-8 px-2 rounded-full bg-background/80 hover:bg-background text-xs font-medium flex items-center gap-1"
        onClick={(e) => {
          e.stopPropagation();
          setIsExpanded(!isExpanded);
        }}
      >
        <Sparkles className="h-3 w-3" />
        <span>{currentFilter.icon}</span>
        {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
      </Button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full left-0 mb-2 p-2 bg-background/95 backdrop-blur-sm rounded-lg border border-border shadow-lg min-w-[160px] max-h-[280px] overflow-y-auto z-50"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-xs font-semibold text-muted-foreground mb-2 px-1 flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              Anime Filters
            </div>
            <div className="grid gap-1">
              {animeFilters.map((filter) => (
                <button
                  key={filter.type}
                  className={`flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-left text-xs transition-colors ${
                    selectedFilter === filter.type
                      ? "bg-primary/20 text-primary"
                      : "hover:bg-muted"
                  }`}
                  onClick={() => {
                    onFilterChange(filter.type);
                    setIsExpanded(false);
                  }}
                >
                  <span className="text-sm">{filter.icon}</span>
                  <div className="flex-1">
                    <div className="font-medium">{filter.label}</div>
                  </div>
                  {selectedFilter === filter.type && (
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AnimeFilterSelector;
