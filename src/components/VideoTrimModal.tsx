import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Play, Pause, Scissors, Repeat2, RotateCcw, X, 
  Type, Sticker, Music, Sparkles, Volume2, VolumeX,
  ChevronLeft, ChevronRight, Timer, Wand2, Download,
  Zap, RefreshCw, ZoomIn
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface VideoTrimModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  videoUrl: string;
  videoTitle: string;
  videoDescription?: string;
  onRepostSuccess?: () => void;
}

interface TextOverlay {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  color: string;
}

const filters = [
  { id: "none", name: "Original", filter: "none", emoji: "✨" },
  { id: "vintage", name: "Vintage", filter: "sepia(0.5) contrast(1.2)", emoji: "📷" },
  { id: "cool", name: "Cool", filter: "saturate(1.5) hue-rotate(-15deg)", emoji: "❄️" },
  { id: "warm", name: "Warm", filter: "saturate(1.3) hue-rotate(15deg)", emoji: "🔥" },
  { id: "vivid", name: "Vivid", filter: "saturate(2) contrast(1.3)", emoji: "🌈" },
  { id: "noir", name: "B&W", filter: "grayscale(1) contrast(1.5)", emoji: "🎬" },
  { id: "neon", name: "Neon", filter: "saturate(3) brightness(1.2)", emoji: "💡" },
  { id: "dreamy", name: "Dreamy", filter: "blur(0.5px) saturate(1.5) brightness(1.1)", emoji: "💭" },
];

const stickers = ["⚽", "🏀", "🏈", "⚾", "🎾", "🏆", "🥇", "🔥", "⚡", "💪", "👏", "🎯", "💯", "🙌", "👑", "💥", "⭐", "🚀"];

const speeds = [0.5, 0.75, 1, 1.25, 1.5, 2];

const videoEffects = [
  { id: "none", name: "None", emoji: "✨", description: "No effect" },
  { id: "slowmo", name: "Slow-Mo", emoji: "🐢", description: "Dramatic slow motion replay" },
  { id: "zoom", name: "Zoom Punch", emoji: "🔍", description: "Dynamic zoom effect" },
  { id: "flash", name: "Flash", emoji: "⚡", description: "Flash transition" },
  { id: "replay", name: "Replay", emoji: "🔄", description: "Instant replay effect" },
  { id: "glitch", name: "Glitch", emoji: "📺", description: "Digital glitch effect" },
];

const VideoTrimModal = ({
  open,
  onOpenChange,
  videoUrl,
  videoTitle,
  videoDescription,
  onRepostSuccess,
}: VideoTrimModalProps) => {
  const { user } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(100);
  const [caption, setCaption] = useState("");
  const [reposting, setReposting] = useState(false);
  
  // TikTok-style features
  const [activePanel, setActivePanel] = useState<"none" | "filters" | "text" | "stickers" | "speed" | "trim" | "effects">("none");
  const [selectedFilter, setSelectedFilter] = useState(filters[0]);
  const [textOverlays, setTextOverlays] = useState<TextOverlay[]>([]);
  const [currentText, setCurrentText] = useState("");
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showCaptionInput, setShowCaptionInput] = useState(false);
  
  // Video effects state
  const [activeEffect, setActiveEffect] = useState<string>("none");
  const [effectPlaying, setEffectPlaying] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [flashOpacity, setFlashOpacity] = useState(0);
  const [glitchActive, setGlitchActive] = useState(false);

  useEffect(() => {
    if (open) {
      setCaption(`🏆 ${videoTitle}${videoDescription ? `\n\n${videoDescription}` : ""}`);
      setTrimStart(0);
      setTrimEnd(100);
      setIsPlaying(false);
      setActivePanel("none");
      setSelectedFilter(filters[0]);
      setTextOverlays([]);
      setPlaybackSpeed(1);
      setActiveEffect("none");
      setEffectPlaying(false);
      setZoomLevel(1);
      setFlashOpacity(0);
      setGlitchActive(false);
    }
  }, [open, videoTitle, videoDescription]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => setDuration(video.duration);
    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      const endTime = (trimEnd / 100) * duration;
      if (video.currentTime >= endTime) {
        video.currentTime = (trimStart / 100) * duration;
        if (isPlaying) video.play();
      }
    };

    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.addEventListener("timeupdate", handleTimeUpdate);
    return () => {
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video.removeEventListener("timeupdate", handleTimeUpdate);
    };
  }, [duration, trimStart, trimEnd, isPlaying]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed]);

  // Apply video effect
  const triggerEffect = (effectId: string) => {
    if (effectPlaying) return;
    setActiveEffect(effectId);
    setEffectPlaying(true);

    switch (effectId) {
      case "slowmo":
        // Slow motion effect
        if (videoRef.current) {
          const originalSpeed = playbackSpeed;
          videoRef.current.playbackRate = 0.25;
          setTimeout(() => {
            if (videoRef.current) videoRef.current.playbackRate = originalSpeed;
            setEffectPlaying(false);
            setActiveEffect("none");
          }, 2000);
        }
        break;

      case "zoom":
        // Zoom punch effect
        setZoomLevel(1);
        const zoomIn = setInterval(() => {
          setZoomLevel(prev => {
            if (prev >= 1.5) {
              clearInterval(zoomIn);
              const zoomOut = setInterval(() => {
                setZoomLevel(prev => {
                  if (prev <= 1) {
                    clearInterval(zoomOut);
                    setEffectPlaying(false);
                    setActiveEffect("none");
                    return 1;
                  }
                  return prev - 0.05;
                });
              }, 30);
              return 1.5;
            }
            return prev + 0.1;
          });
        }, 30);
        break;

      case "flash":
        // Flash transition
        setFlashOpacity(1);
        setTimeout(() => {
          setFlashOpacity(0);
          setEffectPlaying(false);
          setActiveEffect("none");
        }, 300);
        break;

      case "replay":
        // Instant replay effect
        if (videoRef.current) {
          const originalSpeed = playbackSpeed;
          const currentPos = videoRef.current.currentTime;
          videoRef.current.currentTime = Math.max(0, currentPos - 3);
          videoRef.current.playbackRate = 0.5;
          setTimeout(() => {
            if (videoRef.current) {
              videoRef.current.playbackRate = originalSpeed;
            }
            setEffectPlaying(false);
            setActiveEffect("none");
          }, 3000);
        }
        break;

      case "glitch":
        // Glitch effect
        setGlitchActive(true);
        let glitchCount = 0;
        const glitchInterval = setInterval(() => {
          setGlitchActive(prev => !prev);
          glitchCount++;
          if (glitchCount >= 10) {
            clearInterval(glitchInterval);
            setGlitchActive(false);
            setEffectPlaying(false);
            setActiveEffect("none");
          }
        }, 100);
        break;

      default:
        setEffectPlaying(false);
        setActiveEffect("none");
    }
  };

  const getVideoStyles = (): React.CSSProperties => {
    let styles: React.CSSProperties = {
      filter: selectedFilter.filter,
      transform: `scale(${zoomLevel})`,
      transition: "transform 0.03s ease-out",
    };

    if (glitchActive) {
      styles = {
        ...styles,
        filter: `${selectedFilter.filter} hue-rotate(${Math.random() * 360}deg) saturate(2)`,
        transform: `scale(${zoomLevel}) translate(${Math.random() * 10 - 5}px, ${Math.random() * 10 - 5}px)`,
      };
    }

    return styles;
  };

  const togglePlayPause = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      const startTime = (trimStart / 100) * duration;
      const endTime = (trimEnd / 100) * duration;
      if (videoRef.current.currentTime < startTime || videoRef.current.currentTime >= endTime) {
        videoRef.current.currentTime = startTime;
      }
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTrimChange = (values: number[]) => {
    const [start, end] = values;
    setTrimStart(start);
    setTrimEnd(end);
    if (videoRef.current && duration > 0) {
      videoRef.current.currentTime = (start / 100) * duration;
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getTrimmedDuration = () => {
    const startSec = (trimStart / 100) * duration;
    const endSec = (trimEnd / 100) * duration;
    return endSec - startSec;
  };

  const addTextOverlay = () => {
    if (!currentText.trim()) return;
    setTextOverlays([...textOverlays, {
      id: Date.now().toString(),
      text: currentText,
      x: 50,
      y: 50,
      fontSize: 28,
      color: "#ffffff"
    }]);
    setCurrentText("");
    toast.success("Text added!");
  };

  const addSticker = (sticker: string) => {
    setTextOverlays([...textOverlays, {
      id: Date.now().toString(),
      text: sticker,
      x: Math.random() * 40 + 30,
      y: Math.random() * 40 + 30,
      fontSize: 48,
      color: "#ffffff"
    }]);
    toast.success("Sticker added!");
  };

  const handleRepost = async () => {
    if (!user) {
      toast.error("Please sign in to repost");
      return;
    }

    setReposting(true);
    try {
      const trimInfo = trimStart > 0 || trimEnd < 100 
        ? ` (${formatTime((trimStart / 100) * duration)} - ${formatTime((trimEnd / 100) * duration)})`
        : "";

      const { error } = await supabase.from("posts").insert({
        user_id: user.id,
        content: caption + trimInfo,
        video_url: videoUrl,
      });

      if (error) throw error;
      
      toast.success("Reposted to your feed!");
      onOpenChange(false);
      onRepostSuccess?.();
    } catch (error) {
      console.error("Repost error:", error);
      toast.error("Failed to repost video");
    } finally {
      setReposting(false);
    }
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  const ToolButton = ({ icon: Icon, label, active, onClick }: { 
    icon: React.ElementType; 
    label: string; 
    active?: boolean;
    onClick: () => void;
  }) => (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-1 p-2 rounded-xl transition-all",
        active ? "bg-primary text-primary-foreground scale-110" : "text-white hover:bg-white/20"
      )}
    >
      <Icon className="w-6 h-6" />
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[100vw] max-h-[100vh] w-screen h-screen p-0 border-0 rounded-none bg-black">
        {/* TikTok-style Full Screen Editor */}
        <div ref={containerRef} className="relative w-full h-full flex">
          
          {/* Video Area */}
          <div className="flex-1 relative flex items-center justify-center">
            {/* Close Button */}
            <button
              onClick={() => onOpenChange(false)}
              className="absolute top-4 left-4 z-50 w-10 h-10 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Video */}
            <div className="relative w-full h-full max-w-md mx-auto flex items-center justify-center overflow-hidden">
              <video
                ref={videoRef}
                src={videoUrl}
                className="max-w-full max-h-full object-contain rounded-xl"
                style={getVideoStyles()}
                playsInline
                muted={isMuted}
                onClick={togglePlayPause}
              />
              
              {/* Flash Effect Overlay */}
              <AnimatePresence>
                {flashOpacity > 0 && (
                  <motion.div
                    initial={{ opacity: 1 }}
                    animate={{ opacity: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="absolute inset-0 bg-white pointer-events-none rounded-xl"
                  />
                )}
              </AnimatePresence>

              {/* Effect Playing Indicator */}
              <AnimatePresence>
                {effectPlaying && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/70 backdrop-blur-sm px-4 py-2 rounded-full"
                  >
                    <span className="text-white text-sm font-medium flex items-center gap-2">
                      <Zap className="w-4 h-4 text-yellow-400 animate-pulse" />
                      {videoEffects.find(e => e.id === activeEffect)?.name}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Text Overlays */}
              {textOverlays.map((overlay) => (
                <motion.div
                  key={overlay.id}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute cursor-pointer select-none"
                  style={{
                    left: `${overlay.x}%`,
                    top: `${overlay.y}%`,
                    fontSize: overlay.fontSize,
                    color: overlay.color,
                    textShadow: "2px 2px 4px rgba(0,0,0,0.8)",
                    transform: "translate(-50%, -50%)",
                  }}
                  onClick={() => setTextOverlays(prev => prev.filter(t => t.id !== overlay.id))}
                >
                  {overlay.text}
                </motion.div>
              ))}

              {/* Play/Pause Indicator */}
              <AnimatePresence>
                {!isPlaying && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    className="absolute inset-0 flex items-center justify-center pointer-events-none"
                  >
                    <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <Play className="w-10 h-10 text-white ml-1" />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Progress Bar */}
              <div className="absolute bottom-4 left-4 right-4">
                <div className="h-1 bg-white/30 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-white"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <div className="flex justify-between mt-1 text-xs text-white/70">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>
            </div>

            {/* Right Side Tools - TikTok Style */}
            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-3 z-40">
              <ToolButton 
                icon={Sparkles} 
                label="Filters" 
                active={activePanel === "filters"}
                onClick={() => setActivePanel(activePanel === "filters" ? "none" : "filters")} 
              />
              <ToolButton 
                icon={Type} 
                label="Text" 
                active={activePanel === "text"}
                onClick={() => setActivePanel(activePanel === "text" ? "none" : "text")} 
              />
              <ToolButton 
                icon={Sticker} 
                label="Stickers" 
                active={activePanel === "stickers"}
                onClick={() => setActivePanel(activePanel === "stickers" ? "none" : "stickers")} 
              />
              <ToolButton 
                icon={Timer} 
                label={`${playbackSpeed}x`} 
                active={activePanel === "speed"}
                onClick={() => setActivePanel(activePanel === "speed" ? "none" : "speed")} 
              />
              <ToolButton 
                icon={Scissors} 
                label="Trim" 
                active={activePanel === "trim"}
                onClick={() => setActivePanel(activePanel === "trim" ? "none" : "trim")} 
              />
              <ToolButton 
                icon={Zap} 
                label="Effects" 
                active={activePanel === "effects"}
                onClick={() => setActivePanel(activePanel === "effects" ? "none" : "effects")} 
              />
              <ToolButton 
                icon={isMuted ? VolumeX : Volume2} 
                label={isMuted ? "Muted" : "Sound"}
                onClick={() => setIsMuted(!isMuted)} 
              />
            </div>
          </div>

          {/* Bottom Panel - Contextual Tools */}
          <AnimatePresence>
            {activePanel !== "none" && (
              <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
                className="absolute bottom-20 left-0 right-0 bg-black/90 backdrop-blur-md border-t border-white/10 p-4"
              >
                {/* Filters Panel */}
                {activePanel === "filters" && (
                  <div className="space-y-2">
                    <h4 className="text-white text-sm font-medium">Filters</h4>
                    <ScrollArea className="w-full">
                      <div className="flex gap-3 pb-2">
                        {filters.map((filter) => (
                          <button
                            key={filter.id}
                            onClick={() => setSelectedFilter(filter)}
                            className={cn(
                              "flex flex-col items-center gap-1 p-3 rounded-xl transition-all min-w-[70px]",
                              selectedFilter.id === filter.id 
                                ? "bg-primary text-primary-foreground ring-2 ring-primary" 
                                : "bg-white/10 text-white hover:bg-white/20"
                            )}
                          >
                            <span className="text-2xl">{filter.emoji}</span>
                            <span className="text-xs">{filter.name}</span>
                          </button>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                )}

                {/* Text Panel */}
                {activePanel === "text" && (
                  <div className="space-y-3">
                    <h4 className="text-white text-sm font-medium">Add Text</h4>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={currentText}
                        onChange={(e) => setCurrentText(e.target.value)}
                        placeholder="Enter text..."
                        className="flex-1 bg-white/10 border-0 text-white placeholder:text-white/50 rounded-lg px-4 py-2"
                        onKeyDown={(e) => e.key === "Enter" && addTextOverlay()}
                      />
                      <Button onClick={addTextOverlay} size="sm">Add</Button>
                    </div>
                  </div>
                )}

                {/* Stickers Panel */}
                {activePanel === "stickers" && (
                  <div className="space-y-2">
                    <h4 className="text-white text-sm font-medium">Stickers</h4>
                    <div className="flex flex-wrap gap-2">
                      {stickers.map((sticker) => (
                        <button
                          key={sticker}
                          onClick={() => addSticker(sticker)}
                          className="text-3xl p-2 hover:bg-white/20 rounded-lg transition-all hover:scale-110"
                        >
                          {sticker}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Speed Panel */}
                {activePanel === "speed" && (
                  <div className="space-y-2">
                    <h4 className="text-white text-sm font-medium">Playback Speed</h4>
                    <div className="flex gap-2">
                      {speeds.map((speed) => (
                        <button
                          key={speed}
                          onClick={() => setPlaybackSpeed(speed)}
                          className={cn(
                            "px-4 py-2 rounded-lg transition-all font-medium",
                            playbackSpeed === speed 
                              ? "bg-primary text-primary-foreground" 
                              : "bg-white/10 text-white hover:bg-white/20"
                          )}
                        >
                          {speed}x
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Trim Panel */}
                {activePanel === "trim" && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-white text-sm font-medium">Trim Video</h4>
                      <Button variant="ghost" size="sm" onClick={() => { setTrimStart(0); setTrimEnd(100); }} className="text-white/70">
                        <RotateCcw className="w-4 h-4 mr-1" />
                        Reset
                      </Button>
                    </div>
                    <Slider
                      value={[trimStart, trimEnd]}
                      onValueChange={handleTrimChange}
                      min={0}
                      max={100}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-white/70">
                      <span>Start: {formatTime((trimStart / 100) * duration)}</span>
                      <span className="text-primary font-medium">Duration: {formatTime(getTrimmedDuration())}</span>
                      <span>End: {formatTime((trimEnd / 100) * duration)}</span>
                    </div>
                  </div>
                )}

                {/* Effects Panel */}
                {activePanel === "effects" && (
                  <div className="space-y-3">
                    <h4 className="text-white text-sm font-medium">Video Effects</h4>
                    <p className="text-white/60 text-xs">Tap an effect to preview it on your video</p>
                    <div className="flex gap-3 overflow-x-auto pb-2">
                      {videoEffects.map((effect) => (
                        <motion.button
                          key={effect.id}
                          onClick={() => effect.id !== "none" && triggerEffect(effect.id)}
                          disabled={effectPlaying && effect.id !== "none"}
                          whileTap={{ scale: 0.95 }}
                          className={cn(
                            "flex flex-col items-center gap-2 p-3 rounded-xl transition-all min-w-[80px]",
                            effectPlaying && activeEffect === effect.id
                              ? "bg-primary text-primary-foreground ring-2 ring-primary"
                              : effect.id === "none"
                              ? "bg-white/5 text-white/50"
                              : "bg-white/10 text-white hover:bg-white/20",
                            effectPlaying && effect.id !== "none" && activeEffect !== effect.id && "opacity-50"
                          )}
                        >
                          <span className="text-2xl">{effect.emoji}</span>
                          <span className="text-xs font-medium">{effect.name}</span>
                        </motion.button>
                      ))}
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="border-white/30 text-white hover:bg-white/20"
                        onClick={() => triggerEffect("slowmo")}
                        disabled={effectPlaying}
                      >
                        <RefreshCw className="w-4 h-4 mr-1" />
                        Slow-Mo Replay
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="border-white/30 text-white hover:bg-white/20"
                        onClick={() => triggerEffect("zoom")}
                        disabled={effectPlaying}
                      >
                        <ZoomIn className="w-4 h-4 mr-1" />
                        Zoom Punch
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="border-white/30 text-white hover:bg-white/20"
                        onClick={() => triggerEffect("flash")}
                        disabled={effectPlaying}
                      >
                        <Zap className="w-4 h-4 mr-1" />
                        Flash
                      </Button>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Bottom Bar - Caption & Repost */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/90 to-transparent p-4 pt-8">
            {showCaptionInput ? (
              <div className="space-y-3">
                <Textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Write a caption..."
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50 resize-none"
                  rows={3}
                  maxLength={500}
                />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white/50">{caption.length}/500</span>
                  <div className="flex gap-2">
                    <Button variant="ghost" onClick={() => setShowCaptionInput(false)} className="text-white">
                      Cancel
                    </Button>
                    <Button onClick={handleRepost} disabled={reposting}>
                      <Repeat2 className="w-4 h-4 mr-2" />
                      {reposting ? "Posting..." : "Repost"}
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Button 
                  variant="outline" 
                  className="flex-1 border-white/30 text-white hover:bg-white/20"
                  onClick={() => setShowCaptionInput(true)}
                >
                  <Type className="w-4 h-4 mr-2" />
                  Add Caption
                </Button>
                <Button onClick={handleRepost} disabled={reposting} className="flex-1">
                  <Repeat2 className="w-4 h-4 mr-2" />
                  {reposting ? "Posting..." : "Repost to Feed"}
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VideoTrimModal;