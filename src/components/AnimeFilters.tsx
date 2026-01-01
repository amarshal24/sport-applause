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
  | "retro-anime";

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
    </div>
  );
};

const ShoujoSparkles = () => {
  return (
    <>
      {[...Array(8)].map((_, i) => (
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
            delay: i * 0.25,
            ease: "easeInOut",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5L12 2Z"
              fill="rgba(255, 182, 193, 0.8)"
            />
          </svg>
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
    </>
  );
};

const CelShadedEdges = () => {
  return (
    <div 
      className="absolute inset-0 opacity-30"
      style={{
        boxShadow: "inset 0 0 0 2px rgba(0, 0, 0, 0.5)",
        borderRadius: "inherit",
      }}
    />
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
            className="absolute bottom-full left-0 mb-2 p-2 bg-background/95 backdrop-blur-sm rounded-lg border border-border shadow-lg min-w-[160px] z-50"
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
