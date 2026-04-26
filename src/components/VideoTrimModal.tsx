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
  Zap, RefreshCw, ZoomIn, Upload, Save, Undo2, Redo2, MapPin
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { MusicTrimmer } from "./MusicTrimmer";
import {
  CharacterPinsOverlay,
  useCharacterPins,
} from "@/components/video-fx/CharacterPins";
import {
  FullscreenFiltersEffectsPanel,
  defaultFxSelection,
  type FxSelection,
} from "@/components/video-fx/FullscreenFiltersEffectsPanel";

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

// Royalty-free sports music tracks (using Pixabay free music)
const musicTracks = [
  { 
    id: "pump-up", 
    name: "Pump Up", 
    genre: "Electronic", 
    bpm: 128,
    emoji: "🔥",
    url: "https://cdn.pixabay.com/download/audio/2022/03/15/audio_8cb749d484.mp3",
    duration: 120
  },
  { 
    id: "victory", 
    name: "Victory March", 
    genre: "Epic", 
    bpm: 140,
    emoji: "🏆",
    url: "https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0c6ff1bab.mp3",
    duration: 90
  },
  { 
    id: "energy", 
    name: "Pure Energy", 
    genre: "Rock", 
    bpm: 120,
    emoji: "⚡",
    url: "https://cdn.pixabay.com/download/audio/2022/10/25/audio_946b0939c8.mp3",
    duration: 150
  },
  { 
    id: "champion", 
    name: "Champion", 
    genre: "Hip Hop", 
    bpm: 95,
    emoji: "👑",
    url: "https://cdn.pixabay.com/download/audio/2023/07/03/audio_e9bae0c2f2.mp3",
    duration: 180
  },
  { 
    id: "intense", 
    name: "Intense Game", 
    genre: "Dubstep", 
    bpm: 150,
    emoji: "💥",
    url: "https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3",
    duration: 100
  },
  { 
    id: "motivation", 
    name: "Motivation", 
    genre: "Cinematic", 
    bpm: 110,
    emoji: "💪",
    url: "https://cdn.pixabay.com/download/audio/2024/11/04/audio_4956b4edd1.mp3",
    duration: 130
  },
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
  const audioRef = useRef<HTMLAudioElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const beatVisualizerRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(100);
  const [caption, setCaption] = useState("");
  const [reposting, setReposting] = useState(false);
  
  // TikTok-style features
  const [activePanel, setActivePanel] = useState<"none" | "filters" | "text" | "stickers" | "speed" | "trim" | "effects" | "music">("none");
  const [selectedFilter, setSelectedFilter] = useState(filters[0]);
  // Filter undo/redo history (stack of filter ids)
  const [filterHistory, setFilterHistory] = useState<string[]>([filters[0].id]);
  const [filterHistoryIndex, setFilterHistoryIndex] = useState(0);
  const [textOverlays, setTextOverlays] = useState<TextOverlay[]>([]);
  const [currentText, setCurrentText] = useState("");
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showCaptionInput, setShowCaptionInput] = useState(false);

  // Draft state
  const [savingDraft, setSavingDraft] = useState(false);
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(null);

  // Fullscreen Filters & Effects panel
  const characterPins = useCharacterPins();
  const [fxPanelOpen, setFxPanelOpen] = useState(false);
  const [fxSelection, setFxSelection] = useState<FxSelection>(defaultFxSelection);
  const [characterPlaceMode, setCharacterPlaceMode] = useState(false);
  
  // Video effects state
  const [activeEffect, setActiveEffect] = useState<string>("none");
  const [effectPlaying, setEffectPlaying] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [flashOpacity, setFlashOpacity] = useState(0);
  const [glitchActive, setGlitchActive] = useState(false);
  
  // Music state
  const [selectedMusic, setSelectedMusic] = useState<typeof musicTracks[0] | null>(null);
  const [musicVolume, setMusicVolume] = useState(0.7);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [beatPulse, setBeatPulse] = useState(false);
  const [musicCurrentTime, setMusicCurrentTime] = useState(0);
  const [customMusic, setCustomMusic] = useState<{ name: string; url: string; bpm: number; duration?: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Music trimming state
  const [showMusicTrimmer, setShowMusicTrimmer] = useState(false);
  const [musicTrimStart, setMusicTrimStart] = useState(0);
  const [musicTrimEnd, setMusicTrimEnd] = useState(0);
  const [musicFadeIn, setMusicFadeIn] = useState(0);
  const [musicFadeOut, setMusicFadeOut] = useState(0);
  const musicGainNodeRef = useRef<GainNode | null>(null);
  const musicAudioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (open) {
      setCaption(`🏆 ${videoTitle}${videoDescription ? `\n\n${videoDescription}` : ""}`);
      setTrimStart(0);
      setTrimEnd(100);
      setIsPlaying(false);
      setActivePanel("none");
      setSelectedFilter(filters[0]);
      setFilterHistory([filters[0].id]);
      setFilterHistoryIndex(0);
      setCurrentDraftId(null);
      setTextOverlays([]);
      setPlaybackSpeed(1);
      setActiveEffect("none");
      setEffectPlaying(false);
      setZoomLevel(1);
      setFlashOpacity(0);
      setGlitchActive(false);
      setSelectedMusic(null);
      setIsMusicPlaying(false);
      setBeatPulse(false);
      setShowMusicTrimmer(false);
      setMusicTrimStart(0);
      setMusicTrimEnd(0);
      setMusicFadeIn(0);
      setMusicFadeOut(0);
      if (customMusic) {
        URL.revokeObjectURL(customMusic.url);
      }
      setCustomMusic(null);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    }
  }, [open, videoTitle, videoDescription]);

  // Sync music with video playback (with trim support)
  useEffect(() => {
    if (audioRef.current && (selectedMusic || customMusic)) {
      if (isPlaying) {
        // Set to trim start if needed
        if (musicTrimStart > 0 && audioRef.current.currentTime < musicTrimStart) {
          audioRef.current.currentTime = musicTrimStart;
        }
        
        // Set up Web Audio API for fade effects
        if (!musicAudioContextRef.current && (musicFadeIn > 0 || musicFadeOut > 0)) {
          musicAudioContextRef.current = new AudioContext();
          const source = musicAudioContextRef.current.createMediaElementSource(audioRef.current);
          musicGainNodeRef.current = musicAudioContextRef.current.createGain();
          source.connect(musicGainNodeRef.current);
          musicGainNodeRef.current.connect(musicAudioContextRef.current.destination);
        }
        
        // Apply fade in
        if (musicGainNodeRef.current && musicFadeIn > 0 && musicAudioContextRef.current) {
          musicGainNodeRef.current.gain.setValueAtTime(0, musicAudioContextRef.current.currentTime);
          musicGainNodeRef.current.gain.linearRampToValueAtTime(musicVolume, musicAudioContextRef.current.currentTime + musicFadeIn);
        }
        
        audioRef.current.play().catch(() => {});
        setIsMusicPlaying(true);
      } else {
        audioRef.current.pause();
        setIsMusicPlaying(false);
      }
    }
  }, [isPlaying, selectedMusic, customMusic, musicTrimStart, musicFadeIn, musicVolume]);

  // Handle music trim end and fade out
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !isMusicPlaying || musicTrimEnd === 0) return;

    const checkTrimEnd = () => {
      if (!audio) return;
      
      // Apply fade out
      if (musicFadeOut > 0 && musicGainNodeRef.current && musicAudioContextRef.current) {
        const timeUntilEnd = musicTrimEnd - audio.currentTime;
        if (timeUntilEnd <= musicFadeOut && timeUntilEnd > 0) {
          const fadeProgress = (timeUntilEnd / musicFadeOut) * musicVolume;
          musicGainNodeRef.current.gain.setValueAtTime(fadeProgress, musicAudioContextRef.current.currentTime);
        }
      }
      
      // Loop back to trim start when reaching trim end
      if (audio.currentTime >= musicTrimEnd) {
        audio.currentTime = musicTrimStart;
        // Reapply fade in
        if (musicGainNodeRef.current && musicFadeIn > 0 && musicAudioContextRef.current) {
          musicGainNodeRef.current.gain.setValueAtTime(0, musicAudioContextRef.current.currentTime);
          musicGainNodeRef.current.gain.linearRampToValueAtTime(musicVolume, musicAudioContextRef.current.currentTime + musicFadeIn);
        }
      }
    };

    const interval = setInterval(checkTrimEnd, 100);
    return () => clearInterval(interval);
  }, [isMusicPlaying, musicTrimStart, musicTrimEnd, musicFadeIn, musicFadeOut, musicVolume]);

  // Music time update
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setMusicCurrentTime(audio.currentTime);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    return () => audio.removeEventListener("timeupdate", handleTimeUpdate);
  }, []);

  // Beat sync visualization
  useEffect(() => {
    const currentBpm = selectedMusic?.bpm || customMusic?.bpm;
    if (!currentBpm || !isMusicPlaying) {
      setBeatPulse(false);
      return;
    }

    const beatInterval = 60000 / currentBpm; // ms per beat
    const interval = setInterval(() => {
      setBeatPulse(true);
      setTimeout(() => setBeatPulse(false), 100);
    }, beatInterval);

    return () => clearInterval(interval);
  }, [selectedMusic, customMusic, isMusicPlaying]);

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
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed]);

  // Update music volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = musicVolume;
    }
  }, [musicVolume]);

  // Keyboard shortcuts: Cmd/Ctrl+Z = undo filter, Shift+Cmd/Ctrl+Z or Cmd/Ctrl+Y = redo
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) return;
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;
      if (e.key.toLowerCase() === "z" && !e.shiftKey) {
        e.preventDefault();
        if (filterHistoryIndex > 0) {
          const newIndex = filterHistoryIndex - 1;
          const f = filters.find((x) => x.id === filterHistory[newIndex]) || filters[0];
          setSelectedFilter(f);
          setFilterHistoryIndex(newIndex);
          toast.success(`Reverted to ${f.name}`);
        }
      } else if ((e.key.toLowerCase() === "z" && e.shiftKey) || e.key.toLowerCase() === "y") {
        e.preventDefault();
        if (filterHistoryIndex < filterHistory.length - 1) {
          const newIndex = filterHistoryIndex + 1;
          const f = filters.find((x) => x.id === filterHistory[newIndex]) || filters[0];
          setSelectedFilter(f);
          setFilterHistoryIndex(newIndex);
          toast.success(`Restored ${f.name}`);
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, filterHistory, filterHistoryIndex]);

  const selectMusic = (track: typeof musicTracks[0] | null) => {
    setSelectedMusic(track);
    setCustomMusic(null);
    // Reset trim settings
    setMusicTrimStart(0);
    setMusicTrimEnd(track?.duration || 0);
    setMusicFadeIn(0);
    setMusicFadeOut(0);
    setShowMusicTrimmer(false);
    if (audioRef.current) {
      if (track) {
        audioRef.current.src = track.url;
        audioRef.current.volume = musicVolume;
        if (isPlaying) {
          audioRef.current.play().catch(() => {});
          setIsMusicPlaying(true);
        }
        toast.success(`Added "${track.name}" as background music`);
      } else {
        audioRef.current.pause();
        audioRef.current.src = "";
        setIsMusicPlaying(false);
        toast.success("Music removed");
      }
    }
  };

  const handleMusicUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ["audio/mpeg", "audio/mp3", "audio/wav", "audio/ogg", "audio/m4a", "audio/aac"];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(mp3|wav|ogg|m4a|aac)$/i)) {
      toast.error("Please upload an audio file (MP3, WAV, OGG, M4A, AAC)");
      return;
    }

    // Create object URL for the uploaded file
    const url = URL.createObjectURL(file);
    const trackName = file.name.replace(/\.[^/.]+$/, ""); // Remove file extension
    
    const custom = {
      name: trackName,
      url: url,
      bpm: 120 // Default BPM for custom tracks
    };
    
    setCustomMusic(custom);
    setSelectedMusic(null);
    // Reset trim settings
    setMusicTrimStart(0);
    setMusicTrimEnd(0);
    setMusicFadeIn(0);
    setMusicFadeOut(0);
    setShowMusicTrimmer(false);
    
    if (audioRef.current) {
      audioRef.current.src = url;
      audioRef.current.volume = musicVolume;
      if (isPlaying) {
        audioRef.current.play().catch(() => {});
        setIsMusicPlaying(true);
      }
    }
    
    toast.success(`Added "${trackName}" as background music`);
    
    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeCustomMusic = () => {
    if (customMusic) {
      URL.revokeObjectURL(customMusic.url);
    }
    setCustomMusic(null);
    setMusicTrimStart(0);
    setMusicTrimEnd(0);
    setMusicFadeIn(0);
    setMusicFadeOut(0);
    setShowMusicTrimmer(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      setIsMusicPlaying(false);
    }
    toast.success("Music removed");
  };

  const handleMusicTrimComplete = (startTime: number, endTime: number, fadeIn: number, fadeOut: number) => {
    setMusicTrimStart(startTime);
    setMusicTrimEnd(endTime);
    setMusicFadeIn(fadeIn);
    setMusicFadeOut(fadeOut);
    setShowMusicTrimmer(false);
    
    // Reset audio to new start position
    if (audioRef.current) {
      audioRef.current.currentTime = startTime;
    }
    
    toast.success(`Music trimmed to ${formatTime(endTime - startTime)}`);
  };

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
  };

  // --- Filter undo/redo ---
  const applyFilter = (filterId: string) => {
    const filter = filters.find((f) => f.id === filterId) || filters[0];
    setSelectedFilter(filter);
    if (filterHistory[filterHistoryIndex] === filterId) return;
    const truncated = filterHistory.slice(0, filterHistoryIndex + 1);
    const next = [...truncated, filterId];
    setFilterHistory(next);
    setFilterHistoryIndex(next.length - 1);
  };

  const undoFilter = () => {
    if (filterHistoryIndex <= 0) return;
    const newIndex = filterHistoryIndex - 1;
    const filterId = filterHistory[newIndex];
    const filter = filters.find((f) => f.id === filterId) || filters[0];
    setSelectedFilter(filter);
    setFilterHistoryIndex(newIndex);
    toast.success(`Reverted to ${filter.name}`);
  };

  const redoFilter = () => {
    if (filterHistoryIndex >= filterHistory.length - 1) return;
    const newIndex = filterHistoryIndex + 1;
    const filterId = filterHistory[newIndex];
    const filter = filters.find((f) => f.id === filterId) || filters[0];
    setSelectedFilter(filter);
    setFilterHistoryIndex(newIndex);
    toast.success(`Restored ${filter.name}`);
  };

  const canUndoFilter = filterHistoryIndex > 0;
  const canRedoFilter = filterHistoryIndex < filterHistory.length - 1;

  // --- Drafts ---
  const handleSaveDraft = async () => {
    if (!user) {
      toast.error("Please sign in to save drafts");
      return;
    }
    setSavingDraft(true);
    try {
      const musicTrack = customMusic ?? selectedMusic;
      const editState = {
        filter_id: selectedFilter.id,
        trim_start: trimStart,
        trim_end: trimEnd,
        playback_speed: playbackSpeed,
        is_muted: isMuted,
        text_overlays: textOverlays,
        active_effect: activeEffect,
        music: musicTrack
          ? {
              name: musicTrack.name,
              url: musicTrack.url,
              bpm: musicTrack.bpm,
              is_custom: !!customMusic,
              trim_start: musicTrimStart,
              trim_end: musicTrimEnd,
              fade_in: musicFadeIn,
              fade_out: musicFadeOut,
              volume: musicVolume,
            }
          : null,
      };

      if (currentDraftId) {
        const { error } = await supabase
          .from("video_drafts")
          .update({
            caption,
            edit_state: editState as any,
          })
          .eq("id", currentDraftId);
        if (error) throw error;
        toast.success("Draft updated");
      } else {
        const { data, error } = await supabase
          .from("video_drafts")
          .insert({
            user_id: user.id,
            video_url: videoUrl,
            video_title: videoTitle,
            video_description: videoDescription || null,
            caption,
            edit_state: editState as any,
          })
          .select("id")
          .single();
        if (error) throw error;
        if (data) setCurrentDraftId(data.id);
        toast.success("Draft saved");
      }
    } catch (err) {
      console.error("Save draft error:", err);
      toast.error("Failed to save draft");
    } finally {
      setSavingDraft(false);
    }
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

      const musicTrack = customMusic ?? selectedMusic;
      const musicPayload = musicTrack
        ? {
            music_url: musicTrack.url,
            music_title: musicTrack.name,
            music_start_time: musicTrimStart || 0,
            music_end_time: musicTrimEnd || null,
            music_fade_in: musicFadeIn || 0,
            music_fade_out: musicFadeOut || 0,
          }
        : {};

      const { error } = await supabase.from("posts").insert({
        user_id: user.id,
        content: caption + trimInfo,
        video_url: videoUrl,
        ...musicPayload,
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

              {/* Character Pins Overlay (preview only, draggable + tap-to-place) */}
              <CharacterPinsOverlay
                pins={characterPins.pins}
                onMove={characterPins.move}
                onRemove={characterPins.remove}
                placeMode={characterPlaceMode}
                onPlace={(x, y) => {
                  characterPins.addAt(x, y);
                  if (characterPins.pins.length + 1 >= 2) {
                    setCharacterPlaceMode(false);
                    toast.success("Character placed! Open FX+ to customize.");
                  } else {
                    toast.success("Character placed! Tap again or open FX+ to customize.");
                  }
                }}
              />

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
                icon={Wand2}
                label="FX+"
                active={false}
                onClick={() => setFxPanelOpen(true)}
              />
              <ToolButton
                icon={MapPin}
                label={characterPlaceMode ? "Tap…" : "Place"}
                active={characterPlaceMode}
                onClick={() => {
                  if (characterPins.pins.length >= 2) {
                    toast.info("Max 2 characters. Remove one first.");
                    return;
                  }
                  setCharacterPlaceMode((v) => !v);
                }}
              />
              <ToolButton 
                icon={Zap} 
                label="Effects" 
                active={activePanel === "effects"}
                onClick={() => setActivePanel(activePanel === "effects" ? "none" : "effects")} 
              />
              <ToolButton 
                icon={Music} 
                label={(selectedMusic || customMusic) ? "🎵" : "Music"} 
                active={activePanel === "music"}
                onClick={() => setActivePanel(activePanel === "music" ? "none" : "music")} 
              />
              <ToolButton 
                icon={isMuted ? VolumeX : Volume2} 
                label={isMuted ? "Muted" : "Sound"}
                onClick={() => setIsMuted(!isMuted)} 
              />
            </div>
          </div>

          {/* Beat Sync Indicator */}
          <AnimatePresence>
            {(selectedMusic || customMusic) && isMusicPlaying && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="absolute top-4 right-20 z-50"
              >
                <motion.div 
                  animate={{ scale: beatPulse ? 1.2 : 1 }}
                  transition={{ duration: 0.1 }}
                  className="flex items-center gap-2 bg-black/70 backdrop-blur-sm px-3 py-2 rounded-full"
                >
                  {customMusic ? (
                    <Upload className="w-4 h-4 text-primary" />
                  ) : (
                    <Music className="w-4 h-4 text-primary" />
                  )}
                  <span className="text-white text-xs font-medium truncate max-w-[120px]">
                    {customMusic?.name || selectedMusic?.name}
                  </span>
                  <div className="flex gap-0.5">
                    {[...Array(4)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="w-1 bg-primary rounded-full"
                        animate={{ 
                          height: beatPulse ? [8, 16, 8] : 8,
                        }}
                        transition={{ 
                          duration: 0.2, 
                          delay: i * 0.05 
                        }}
                      />
                    ))}
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Hidden Audio Element */}
          <audio ref={audioRef} loop />

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
                    <div className="flex items-center justify-between">
                      <h4 className="text-white text-sm font-medium">Filters</h4>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={undoFilter}
                          disabled={!canUndoFilter}
                          className="text-white hover:bg-white/20 disabled:opacity-30 h-8"
                          title="Undo filter"
                        >
                          <Undo2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={redoFilter}
                          disabled={!canRedoFilter}
                          className="text-white hover:bg-white/20 disabled:opacity-30 h-8"
                          title="Redo filter"
                        >
                          <Redo2 className="w-4 h-4" />
                        </Button>
                        <span className="text-white/40 text-[10px] ml-1">
                          {filterHistoryIndex + 1}/{filterHistory.length}
                        </span>
                      </div>
                    </div>
                    <ScrollArea className="w-full">
                      <div className="flex gap-3 pb-2">
                        {filters.map((filter) => (
                          <button
                            key={filter.id}
                            onClick={() => applyFilter(filter.id)}
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

                {/* Music Panel */}
                {activePanel === "music" && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-white text-sm font-medium">Background Music</h4>
                      {(selectedMusic || customMusic) && (
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="text-white/70 h-7"
                          onClick={() => customMusic ? removeCustomMusic() : selectMusic(null)}
                        >
                          <X className="w-4 h-4 mr-1" />
                          Remove
                        </Button>
                      )}
                    </div>
                    <p className="text-white/60 text-xs">Select a track or upload your own music</p>
                    
                    {/* Upload Custom Music */}
                    <div className="flex gap-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="audio/*,.mp3,.wav,.ogg,.m4a,.aac"
                        onChange={handleMusicUpload}
                        className="hidden"
                        id="music-upload"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        className={cn(
                          "flex-1 border-dashed",
                          customMusic 
                            ? "border-primary bg-primary/20 text-primary" 
                            : "border-white/30 text-white hover:bg-white/20"
                        )}
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        {customMusic ? "Change Track" : "Upload Your Music"}
                      </Button>
                    </div>

                    {/* Custom Music Display */}
                    {customMusic && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-primary/20 border border-primary/30 rounded-xl p-3"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-primary/30 flex items-center justify-center">
                            <Upload className="w-5 h-5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-sm font-medium truncate">{customMusic.name}</p>
                            <p className="text-white/50 text-xs">Custom Upload • {customMusic.bpm} BPM</p>
                          </div>
                          <div className="flex gap-1">
                            {[...Array(4)].map((_, i) => (
                              <motion.div
                                key={i}
                                className="w-1 bg-primary rounded-full"
                                animate={{ 
                                  height: beatPulse && isMusicPlaying ? [6, 14, 6] : 6,
                                }}
                                transition={{ 
                                  duration: 0.2, 
                                  delay: i * 0.05 
                                }}
                              />
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Divider */}
                    {!customMusic && (
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-px bg-white/20" />
                        <span className="text-white/40 text-xs">or choose from library</span>
                        <div className="flex-1 h-px bg-white/20" />
                      </div>
                    )}
                    
                    <ScrollArea className="w-full">
                      <div className="flex gap-3 pb-2">
                        {musicTracks.map((track) => (
                          <motion.button
                            key={track.id}
                            onClick={() => selectMusic(track)}
                            whileTap={{ scale: 0.95 }}
                            className={cn(
                              "flex flex-col items-center gap-2 p-3 rounded-xl transition-all min-w-[90px] relative",
                              selectedMusic?.id === track.id 
                                ? "bg-primary text-primary-foreground ring-2 ring-primary" 
                                : "bg-white/10 text-white hover:bg-white/20"
                            )}
                          >
                            <span className="text-2xl">{track.emoji}</span>
                            <span className="text-xs font-medium">{track.name}</span>
                            <span className="text-[10px] opacity-70">{track.genre}</span>
                            <span className="text-[10px] opacity-50">{track.bpm} BPM</span>
                          </motion.button>
                        ))}
                      </div>
                    </ScrollArea>

                    {(selectedMusic || customMusic) && !showMusicTrimmer && (
                      <div className="space-y-3 pt-2 border-t border-white/10">
                        {/* Volume Control */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-white/70 text-xs">Volume</span>
                            <span className="text-white/70 text-xs">{Math.round(musicVolume * 100)}%</span>
                          </div>
                          <Slider
                            value={[musicVolume * 100]}
                            onValueChange={([val]) => setMusicVolume(val / 100)}
                            min={0}
                            max={100}
                            step={5}
                            className="w-full"
                          />
                        </div>

                        {/* Trim Button */}
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full border-white/30 text-white hover:bg-white/20"
                          onClick={() => setShowMusicTrimmer(true)}
                        >
                          <Scissors className="w-4 h-4 mr-2" />
                          Trim Music
                          {musicTrimEnd > 0 && (
                            <span className="ml-2 text-primary text-xs">
                              ({formatTime(musicTrimEnd - musicTrimStart)})
                            </span>
                          )}
                        </Button>

                        {/* Trim Info Display */}
                        {musicTrimEnd > 0 && (
                          <div className="flex items-center justify-between text-xs text-white/60 bg-white/5 rounded-lg p-2">
                            <span>Start: {formatTime(musicTrimStart)}</span>
                            <span className="text-primary font-medium">
                              Duration: {formatTime(musicTrimEnd - musicTrimStart)}
                            </span>
                            <span>End: {formatTime(musicTrimEnd)}</span>
                          </div>
                        )}

                        {/* Fade Info */}
                        {(musicFadeIn > 0 || musicFadeOut > 0) && (
                          <div className="flex items-center gap-4 text-xs text-white/50">
                            {musicFadeIn > 0 && <span>Fade in: {musicFadeIn.toFixed(1)}s</span>}
                            {musicFadeOut > 0 && <span>Fade out: {musicFadeOut.toFixed(1)}s</span>}
                          </div>
                        )}

                        {/* Track Info */}
                        {selectedMusic && (
                          <div className="flex items-center gap-2 pt-2">
                            <div className="flex-1 flex items-center gap-2">
                              <Music className="w-4 h-4 text-primary" />
                              <span className="text-white text-sm">{selectedMusic.name}</span>
                              <span className="text-white/50 text-xs">• {selectedMusic.bpm} BPM</span>
                            </div>
                            <div className="flex gap-1">
                              {[...Array(4)].map((_, i) => (
                                <motion.div
                                  key={i}
                                  className="w-1 bg-primary rounded-full"
                                  animate={{ 
                                    height: beatPulse && isMusicPlaying ? [6, 14, 6] : 6,
                                  }}
                                  transition={{ 
                                    duration: 0.2, 
                                    delay: i * 0.05 
                                  }}
                                />
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Music Trimmer */}
                    {showMusicTrimmer && (selectedMusic || customMusic) && (
                      <div className="pt-2 border-t border-white/10">
                        <MusicTrimmer
                          audioUrl={customMusic?.url || selectedMusic?.url || ""}
                          onTrimComplete={handleMusicTrimComplete}
                          onCancel={() => setShowMusicTrimmer(false)}
                        />
                      </div>
                    )}
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
                    <Button
                      variant="outline"
                      onClick={handleSaveDraft}
                      disabled={savingDraft}
                      className="border-white/30 text-white hover:bg-white/20"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {savingDraft ? "Saving..." : currentDraftId ? "Update Draft" : "Save Draft"}
                    </Button>
                    <Button onClick={handleRepost} disabled={reposting}>
                      <Repeat2 className="w-4 h-4 mr-2" />
                      {reposting ? "Posting..." : "Repost"}
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  className="flex-1 border-white/30 text-white hover:bg-white/20"
                  onClick={() => setShowCaptionInput(true)}
                >
                  <Type className="w-4 h-4 mr-2" />
                  Caption
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 border-white/30 text-white hover:bg-white/20"
                  onClick={handleSaveDraft}
                  disabled={savingDraft}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {savingDraft ? "Saving..." : currentDraftId ? "Update Draft" : "Save Draft"}
                </Button>
                <Button onClick={handleRepost} disabled={reposting} className="flex-1">
                  <Repeat2 className="w-4 h-4 mr-2" />
                  {reposting ? "Posting..." : "Repost"}
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>

      <FullscreenFiltersEffectsPanel
        open={fxPanelOpen}
        onClose={() => setFxPanelOpen(false)}
        selection={fxSelection}
        onChange={setFxSelection}
        pins={characterPins.pins}
        onAddPin={characterPins.add}
        onUpdatePin={characterPins.update}
        onRemovePin={characterPins.remove}
      />
    </Dialog>
  );
};

export default VideoTrimModal;