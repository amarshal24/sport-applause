import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Play,
  X,
  ChevronLeft,
  ChevronRight,
  Film,
  GraduationCap,
  Heart,
  Sparkles,
  Globe,
  Zap,
  Mic,
  Video as VideoIcon,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

interface DemoVideoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Feature = {
  icon: typeof Film;
  title: string;
  description: string;
  accent: string;
  image: string;
  cta: { label: string; path: string };
};

const FEATURES: Feature[] = [
  {
    icon: Film,
    title: "Animation Center",
    description:
      "Turn raw clips into cinematic highlight reels with filters, anime skins, text overlays, and beat-synced effects.",
    accent: "from-primary/40 via-primary/10 to-transparent",
    image:
      "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1200&q=70&auto=format&fit=crop",
    cta: { label: "Open Animation Center", path: "/animation-center" },
  },
  {
    icon: GraduationCap,
    title: "Recruiting Platform",
    description:
      "Athletes upload 3-minute reels with stats and position info. Recruiters filter and contact talent directly.",
    accent: "from-secondary/40 via-secondary/10 to-transparent",
    image:
      "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=1200&q=70&auto=format&fit=crop",
    cta: { label: "Explore Recruiting", path: "/recruiting" },
  },
  {
    icon: Heart,
    title: "Mood-Based Feed",
    description:
      "Filter highlights by emotion — motivational, epic, or chill — so your feed matches how you feel.",
    accent: "from-accent/40 via-accent/10 to-transparent",
    image:
      "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=1200&q=70&auto=format&fit=crop",
    cta: { label: "Browse Feed", path: "/" },
  },
  {
    icon: Sparkles,
    title: "Stories & Live Now",
    description:
      "Share behind-the-scenes moments that expire in hours, or jump straight into live streams as they happen.",
    accent: "from-primary/40 via-secondary/10 to-transparent",
    image:
      "https://images.unsplash.com/photo-1526676037777-05a232554f77?w=1200&q=70&auto=format&fit=crop",
    cta: { label: "Watch Live", path: "/live-streams" },
  },
  {
    icon: Zap,
    title: "Mini Games & Leaderboards",
    description:
      "Play sport-specific mini games, take on daily challenges, and climb global leaderboards with friends.",
    accent: "from-accent/40 via-primary/10 to-transparent",
    image:
      "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=1200&q=70&auto=format&fit=crop",
    cta: { label: "Play Games", path: "/games" },
  },
  {
    icon: Mic,
    title: "Podcasts & Motivation",
    description:
      "Long-form audio from athletes and coaches, plus daily AI-generated motivation to keep you locked in.",
    accent: "from-secondary/40 via-accent/10 to-transparent",
    image:
      "https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=1200&q=70&auto=format&fit=crop",
    cta: { label: "Listen In", path: "/podcasts" },
  },
];

const AUTO_ADVANCE_MS = 4500;

const DemoVideoModal = ({ open, onOpenChange }: DemoVideoModalProps) => {
  const navigate = useNavigate();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (!open) {
      setIndex(0);
      setPaused(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open || paused) return;
    const timer = window.setTimeout(() => {
      setIndex((i) => (i + 1) % FEATURES.length);
    }, AUTO_ADVANCE_MS);
    return () => window.clearTimeout(timer);
  }, [open, paused, index]);

  const handleClose = () => onOpenChange(false);
  const next = () => setIndex((i) => (i + 1) % FEATURES.length);
  const prev = () => setIndex((i) => (i - 1 + FEATURES.length) % FEATURES.length);

  const feature = FEATURES[index];
  const Icon = feature.icon;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden bg-card border-border">
        <DialogTitle className="sr-only">U⚡️Sportz Feature Tour</DialogTitle>

        <div
          className="relative aspect-video bg-background"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 z-30 bg-background/50 backdrop-blur hover:bg-background/80"
            onClick={handleClose}
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </Button>

          {/* Slide */}
          <AnimatePresence mode="wait">
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 1.02 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="absolute inset-0"
            >
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url('${feature.image}')` }}
              />
              <div className={`absolute inset-0 bg-gradient-to-t ${feature.accent}`} />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/20" />

              <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 pb-24">
                <motion.div
                  initial={{ y: 12, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1, duration: 0.4 }}
                  className="mb-4 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/15 border border-primary/30"
                >
                  <Icon className="h-4 w-4 text-primary" />
                  <span className="text-xs uppercase tracking-wider text-primary font-semibold">
                    Feature {index + 1} of {FEATURES.length}
                  </span>
                </motion.div>

                <motion.h3
                  initial={{ y: 12, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.15, duration: 0.4 }}
                  className="text-3xl md:text-4xl font-bold mb-3"
                >
                  {feature.title}
                </motion.h3>

                <motion.p
                  initial={{ y: 12, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.4 }}
                  className="text-muted-foreground max-w-lg mb-6"
                >
                  {feature.description}
                </motion.p>

                <motion.div
                  initial={{ y: 12, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.25, duration: 0.4 }}
                  className="flex flex-wrap gap-3 justify-center"
                >
                  <Button
                    className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-glow"
                    onClick={() => {
                      handleClose();
                      navigate(feature.cta.path);
                    }}
                  >
                    <Play className="mr-2 h-4 w-4" />
                    {feature.cta.label}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      handleClose();
                      navigate("/auth");
                    }}
                  >
                    <VideoIcon className="mr-2 h-4 w-4" />
                    Get Started
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Prev / Next */}
          <Button
            variant="ghost"
            size="icon"
            onClick={prev}
            aria-label="Previous feature"
            className="absolute left-3 top-1/2 -translate-y-1/2 z-20 bg-background/40 backdrop-blur hover:bg-background/70"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={next}
            aria-label="Next feature"
            className="absolute right-3 top-1/2 -translate-y-1/2 z-20 bg-background/40 backdrop-blur hover:bg-background/70"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>

          {/* Progress dots */}
          <div className="absolute bottom-4 left-0 right-0 z-20 flex items-center justify-center gap-2">
            {FEATURES.map((f, i) => (
              <button
                key={f.title}
                onClick={() => setIndex(i)}
                aria-label={`Go to ${f.title}`}
                className={`h-1.5 rounded-full transition-all ${
                  i === index ? "w-8 bg-primary" : "w-2 bg-muted-foreground/40 hover:bg-muted-foreground/70"
                }`}
              />
            ))}
          </div>

          {/* Auto-advance bar */}
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-muted/30 z-10 overflow-hidden">
            <motion.div
              key={`${index}-${paused}`}
              className="h-full bg-gradient-to-r from-primary to-secondary"
              initial={{ width: "0%" }}
              animate={{ width: paused ? "0%" : "100%" }}
              transition={{ duration: paused ? 0 : AUTO_ADVANCE_MS / 1000, ease: "linear" }}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DemoVideoModal;
