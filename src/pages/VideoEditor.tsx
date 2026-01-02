import { useState, useRef, useEffect } from "react";
import Navigation from "@/components/Navigation";
import Sidebar from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Upload, Download, Play, Pause, Sparkles, Type, 
  Sticker, Music, Scissors, Zap, RotateCcw, Check,
  Share2, Trash2, Send, Image as ImageIcon, Wand2,
  Sun, Contrast, Palette, Volume2, VolumeX, Timer,
  FlipHorizontal, FlipVertical, RotateCw, Layers,
  Blend, Droplets, Focus, Maximize, Move, Star
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

interface TextOverlay {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  color: string;
  fontFamily: string;
  animation?: string;
}

interface DragState {
  overlayId: string;
  startX: number;
  startY: number;
  overlayStartX: number;
  overlayStartY: number;
}

interface MusicTrack {
  id: string;
  name: string;
  genre: string;
  mood: string;
  duration: string;
  bpm: number;
  previewUrl: string;
}

// Royalty-free music from Pixabay (free for commercial use)
const musicTracks: MusicTrack[] = [
  // Energetic / Workout
  { id: "1", name: "Powerful Beat", genre: "Electronic", mood: "Energetic", duration: "2:14", bpm: 140, previewUrl: "https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3" },
  { id: "2", name: "Sport Action", genre: "Hip Hop", mood: "Energetic", duration: "1:51", bpm: 128, previewUrl: "https://cdn.pixabay.com/download/audio/2022/10/25/audio_946cc6d109.mp3" },
  { id: "3", name: "Energy Rock", genre: "Rock", mood: "Energetic", duration: "2:32", bpm: 145, previewUrl: "https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3" },
  { id: "4", name: "EDM Festival", genre: "EDM", mood: "Energetic", duration: "2:20", bpm: 150, previewUrl: "https://cdn.pixabay.com/download/audio/2023/07/30/audio_e6e8d06d17.mp3" },
  // Motivational
  { id: "5", name: "Inspiring Cinematic", genre: "Cinematic", mood: "Motivational", duration: "2:36", bpm: 110, previewUrl: "https://cdn.pixabay.com/download/audio/2022/02/22/audio_d1718ab41b.mp3" },
  { id: "6", name: "Epic Orchestra", genre: "Orchestral", mood: "Motivational", duration: "2:31", bpm: 100, previewUrl: "https://cdn.pixabay.com/download/audio/2022/01/20/audio_3ee85c0e96.mp3" },
  { id: "7", name: "Upbeat Pop", genre: "Pop", mood: "Motivational", duration: "2:17", bpm: 120, previewUrl: "https://cdn.pixabay.com/download/audio/2023/09/04/audio_0f00e95e1f.mp3" },
  { id: "8", name: "Acoustic Uplifting", genre: "Indie", mood: "Motivational", duration: "2:11", bpm: 115, previewUrl: "https://cdn.pixabay.com/download/audio/2022/10/09/audio_f8dcdb2bd8.mp3" },
  // Chill / Focus
  { id: "9", name: "Lofi Study", genre: "Lo-Fi", mood: "Chill", duration: "2:16", bpm: 85, previewUrl: "https://cdn.pixabay.com/download/audio/2022/05/13/audio_257112c82d.mp3" },
  { id: "10", name: "Calm Ambient", genre: "Ambient", mood: "Focus", duration: "3:00", bpm: 90, previewUrl: "https://cdn.pixabay.com/download/audio/2022/03/15/audio_8cb749d484.mp3" },
  { id: "11", name: "Chill Vibes", genre: "Chillhop", mood: "Chill", duration: "2:28", bpm: 80, previewUrl: "https://cdn.pixabay.com/download/audio/2023/04/10/audio_fd5ef7fd86.mp3" },
  { id: "12", name: "Deep Focus", genre: "Electronic", mood: "Focus", duration: "2:45", bpm: 95, previewUrl: "https://cdn.pixabay.com/download/audio/2022/08/02/audio_884fe92c21.mp3" },
  // Intense / Hype
  { id: "13", name: "Trap Beat", genre: "Trap", mood: "Intense", duration: "2:04", bpm: 160, previewUrl: "https://cdn.pixabay.com/download/audio/2022/11/22/audio_4a28ac6a22.mp3" },
  { id: "14", name: "Heavy Bass", genre: "Dubstep", mood: "Intense", duration: "2:18", bpm: 155, previewUrl: "https://cdn.pixabay.com/download/audio/2022/03/10/audio_8e66ab1e41.mp3" },
  { id: "15", name: "Hip Hop Hype", genre: "Hip Hop", mood: "Hype", duration: "1:47", bpm: 135, previewUrl: "https://cdn.pixabay.com/download/audio/2023/06/13/audio_fc3d796bbc.mp3" },
  { id: "16", name: "Party EDM", genre: "EDM", mood: "Hype", duration: "2:33", bpm: 142, previewUrl: "https://cdn.pixabay.com/download/audio/2022/04/27/audio_67bcbab8aa.mp3" },
];

interface Filter {
  id: string;
  name: string;
  cssFilter: string;
  emoji: string;
}

interface Effect {
  id: string;
  name: string;
  icon: React.ReactNode;
  value: number;
  min: number;
  max: number;
  unit: string;
}

const filters: Filter[] = [
  { id: "none", name: "Original", cssFilter: "none", emoji: "✨" },
  { id: "vintage", name: "Vintage", cssFilter: "sepia(0.5) contrast(1.2)", emoji: "📷" },
  { id: "cool", name: "Cool", cssFilter: "saturate(1.5) hue-rotate(-15deg)", emoji: "❄️" },
  { id: "warm", name: "Warm", cssFilter: "saturate(1.3) hue-rotate(15deg)", emoji: "🔥" },
  { id: "vivid", name: "Vivid", cssFilter: "saturate(2) contrast(1.3)", emoji: "🌈" },
  { id: "noir", name: "Noir", cssFilter: "grayscale(1) contrast(1.5)", emoji: "🎬" },
  { id: "neon", name: "Neon", cssFilter: "saturate(3) brightness(1.2) contrast(1.3)", emoji: "💡" },
  { id: "fade", name: "Fade", cssFilter: "brightness(1.1) contrast(0.9)", emoji: "🌫️" },
  { id: "dreamy", name: "Dreamy", cssFilter: "blur(0.5px) saturate(1.5) brightness(1.1)", emoji: "💭" },
  { id: "cinematic", name: "Cinematic", cssFilter: "contrast(1.4) saturate(0.9)", emoji: "🎥" },
  { id: "retro", name: "Retro", cssFilter: "sepia(0.3) saturate(1.4) hue-rotate(-10deg)", emoji: "📼" },
  { id: "pop", name: "Pop", cssFilter: "saturate(2.5) brightness(1.1)", emoji: "🎨" },
];

const stickers = ["⚽", "🏀", "🏈", "⚾", "🎾", "🏐", "🏆", "🥇", "🔥", "⚡", "💪", "👏", "🎯", "🏁", "💯", "🙌", "👑", "💥", "⭐", "🚀"];

interface Transition {
  id: string;
  name: string;
  emoji: string;
  description: string;
}

const transitions: Transition[] = [
  { id: "none", name: "None", emoji: "➖", description: "No transition" },
  { id: "fade", name: "Fade", emoji: "🌫️", description: "Smooth opacity fade" },
  { id: "fade-black", name: "Fade Black", emoji: "🖤", description: "Fade through black" },
  { id: "fade-white", name: "Fade White", emoji: "🤍", description: "Fade through white" },
  { id: "slide-left", name: "Slide Left", emoji: "⬅️", description: "Slide to the left" },
  { id: "slide-right", name: "Slide Right", emoji: "➡️", description: "Slide to the right" },
  { id: "slide-up", name: "Slide Up", emoji: "⬆️", description: "Slide upwards" },
  { id: "slide-down", name: "Slide Down", emoji: "⬇️", description: "Slide downwards" },
  { id: "zoom-in", name: "Zoom In", emoji: "🔍", description: "Zoom into the scene" },
  { id: "zoom-out", name: "Zoom Out", emoji: "🔎", description: "Zoom out of the scene" },
  { id: "spin", name: "Spin", emoji: "🔄", description: "Rotating transition" },
  { id: "blur", name: "Blur", emoji: "💨", description: "Blur transition" },
  { id: "flash", name: "Flash", emoji: "⚡", description: "Quick flash effect" },
  { id: "wipe", name: "Wipe", emoji: "🧹", description: "Horizontal wipe" },
  { id: "glitch", name: "Glitch", emoji: "📺", description: "Digital glitch effect" },
];

const textAnimations = [
  { id: "none", name: "None" },
  { id: "bounce", name: "Bounce" },
  { id: "pulse", name: "Pulse" },
  { id: "shake", name: "Shake" },
  { id: "fade-in", name: "Fade In" },
  { id: "slide-up", name: "Slide Up" },
];

const fontOptions = [
  { id: "Inter", name: "Modern" },
  { id: "Georgia", name: "Classic" },
  { id: "Comic Sans MS", name: "Fun" },
  { id: "Impact", name: "Bold" },
  { id: "Courier New", name: "Retro" },
];

const VideoEditor = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string>("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<Filter>(filters[0]);
  const [textOverlays, setTextOverlays] = useState<TextOverlay[]>([]);
  const [currentText, setCurrentText] = useState("");
  const [currentTextColor, setCurrentTextColor] = useState("#ffffff");
  const [currentTextFont, setCurrentTextFont] = useState("Inter");
  const [currentTextAnimation, setCurrentTextAnimation] = useState("none");
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(100);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [postCaption, setPostCaption] = useState("");
  const [exporting, setExporting] = useState(false);
  
  // Adjustments
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [blur, setBlur] = useState(0);
  const [hueRotate, setHueRotate] = useState(0);
  const [volume, setVolume] = useState(100);
  
  // Transform
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [rotation, setRotation] = useState(0);
  
  // Music
  const [selectedTrack, setSelectedTrack] = useState<MusicTrack | null>(null);
  const [musicVolume, setMusicVolume] = useState(50);
  const [musicFilter, setMusicFilter] = useState<string>("all");
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [previewingTrackId, setPreviewingTrackId] = useState<string | null>(null);
  
  // Transitions
  const [introTransition, setIntroTransition] = useState<Transition>(transitions[0]);
  const [outroTransition, setOutroTransition] = useState<Transition>(transitions[0]);
  const [transitionDuration, setTransitionDuration] = useState(0.5);
  const [isPreviewingTransition, setIsPreviewingTransition] = useState(false);
  const [previewTransitionType, setPreviewTransitionType] = useState<"intro" | "outro" | null>(null);
  
  // Drag and drop
  const [dragState, setDragState] = useState<DragState | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const previewAudioRef = useRef<HTMLAudioElement>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);

  // Check for video passed from highlight reel
  useEffect(() => {
    const storedUrl = sessionStorage.getItem("editorVideoUrl");
    const storedTitle = sessionStorage.getItem("editorVideoTitle");
    
    if (storedUrl) {
      setVideoUrl(storedUrl);
      if (storedTitle) {
        setPostCaption(`🏆 ${storedTitle}`);
      }
      sessionStorage.removeItem("editorVideoUrl");
      sessionStorage.removeItem("editorVideoTitle");
      toast.success("Video loaded from highlights!");
    }
  }, []);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 50 * 1024 * 1024) {
        toast.error("File size must be less than 50MB");
        return;
      }
      setVideoFile(file);
      const url = URL.createObjectURL(file);
      setVideoUrl(url);
      toast.success("Video loaded successfully!");
    }
  };

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume / 100;
      videoRef.current.muted = isMuted;
    }
  }, [volume, isMuted]);

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      const handleLoadedMetadata = () => setDuration(video.duration);
      const handleTimeUpdate = () => setCurrentTime(video.currentTime);
      
      video.addEventListener("loadedmetadata", handleLoadedMetadata);
      video.addEventListener("timeupdate", handleTimeUpdate);
      
      return () => {
        video.removeEventListener("loadedmetadata", handleLoadedMetadata);
        video.removeEventListener("timeupdate", handleTimeUpdate);
      };
    }
  }, [videoUrl]);

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        // Pause background music too
        if (audioRef.current) {
          audioRef.current.pause();
        }
      } else {
        videoRef.current.play();
        // Play background music with video
        if (audioRef.current && selectedTrack) {
          audioRef.current.play();
        }
      }
      setIsPlaying(!isPlaying);
    }
  };

  const togglePreviewTrack = (track: MusicTrack, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (previewingTrackId === track.id) {
      // Stop preview
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
        previewAudioRef.current.currentTime = 0;
      }
      setPreviewingTrackId(null);
    } else {
      // Start preview
      if (previewAudioRef.current) {
        previewAudioRef.current.src = track.previewUrl;
        previewAudioRef.current.volume = 0.5;
        previewAudioRef.current.play().catch(console.error);
      }
      setPreviewingTrackId(track.id);
    }
  };

  const selectTrack = (track: MusicTrack) => {
    // Stop any preview
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current.currentTime = 0;
    }
    setPreviewingTrackId(null);
    
    setSelectedTrack(track);
    
    // Set up background audio
    if (audioRef.current) {
      audioRef.current.src = track.previewUrl;
      audioRef.current.volume = musicVolume / 100;
      audioRef.current.loop = true;
    }
    
    toast.success(`Added "${track.name}" as background music`);
  };

  // Sync music volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = musicVolume / 100;
    }
  }, [musicVolume]);

  const getVideoStyles = () => {
    const filterParts = [];
    
    if (selectedFilter.cssFilter !== "none") {
      filterParts.push(selectedFilter.cssFilter);
    }
    
    if (brightness !== 100) filterParts.push(`brightness(${brightness / 100})`);
    if (contrast !== 100) filterParts.push(`contrast(${contrast / 100})`);
    if (saturation !== 100) filterParts.push(`saturate(${saturation / 100})`);
    if (blur > 0) filterParts.push(`blur(${blur}px)`);
    if (hueRotate !== 0) filterParts.push(`hue-rotate(${hueRotate}deg)`);
    
    const transform = [];
    if (flipH) transform.push("scaleX(-1)");
    if (flipV) transform.push("scaleY(-1)");
    if (rotation !== 0) transform.push(`rotate(${rotation}deg)`);
    
    return {
      filter: filterParts.length ? filterParts.join(" ") : "none",
      transform: transform.length ? transform.join(" ") : "none",
    };
  };

  const addTextOverlay = () => {
    if (!currentText.trim()) {
      toast.error("Please enter text first");
      return;
    }

    const newOverlay: TextOverlay = {
      id: Date.now().toString(),
      text: currentText,
      x: 50,
      y: 50,
      fontSize: 32,
      color: currentTextColor,
      fontFamily: currentTextFont,
      animation: currentTextAnimation,
    };

    setTextOverlays([...textOverlays, newOverlay]);
    setCurrentText("");
    toast.success("Text added!");
  };

  const addStickerOverlay = (sticker: string) => {
    const newOverlay: TextOverlay = {
      id: Date.now().toString(),
      text: sticker,
      x: Math.random() * 50 + 25,
      y: Math.random() * 50 + 25,
      fontSize: 48,
      color: "#ffffff",
      fontFamily: "Arial",
    };

    setTextOverlays([...textOverlays, newOverlay]);
    toast.success("Sticker added!");
  };

  const removeOverlay = (id: string) => {
    setTextOverlays(textOverlays.filter(o => o.id !== id));
  };

  // Drag and drop handlers for overlays
  const handleOverlayMouseDown = (e: React.MouseEvent, overlay: TextOverlay) => {
    e.preventDefault();
    e.stopPropagation();
    
    setDragState({
      overlayId: overlay.id,
      startX: e.clientX,
      startY: e.clientY,
      overlayStartX: overlay.x,
      overlayStartY: overlay.y,
    });
  };

  const handleOverlayMouseMove = (e: React.MouseEvent) => {
    if (!dragState || !videoContainerRef.current) return;
    
    const container = videoContainerRef.current.getBoundingClientRect();
    const deltaX = e.clientX - dragState.startX;
    const deltaY = e.clientY - dragState.startY;
    
    // Convert pixel delta to percentage
    const deltaXPercent = (deltaX / container.width) * 100;
    const deltaYPercent = (deltaY / container.height) * 100;
    
    const newX = Math.max(5, Math.min(95, dragState.overlayStartX + deltaXPercent));
    const newY = Math.max(5, Math.min(95, dragState.overlayStartY + deltaYPercent));
    
    setTextOverlays(prev => 
      prev.map(o => 
        o.id === dragState.overlayId 
          ? { ...o, x: newX, y: newY }
          : o
      )
    );
  };

  const handleOverlayMouseUp = () => {
    setDragState(null);
  };

  const resetEditor = () => {
    setSelectedFilter(filters[0]);
    setTextOverlays([]);
    setPlaybackSpeed(1);
    setTrimStart(0);
    setTrimEnd(100);
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
    setBlur(0);
    setHueRotate(0);
    setFlipH(false);
    setFlipV(false);
    setRotation(0);
    setVolume(100);
    setIsMuted(false);
    setSelectedTrack(null);
    setMusicVolume(50);
    setIsPlayingPreview(false);
    setIntroTransition(transitions[0]);
    setOutroTransition(transitions[0]);
    setTransitionDuration(0.5);
    setDragState(null);
    toast.success("Editor reset!");
  };

  const previewTransition = (type: "intro" | "outro") => {
    const transition = type === "intro" ? introTransition : outroTransition;
    if (transition.id === "none") {
      toast.info("No transition selected");
      return;
    }
    
    setPreviewTransitionType(type);
    setIsPreviewingTransition(true);
    
    // Reset after animation completes
    setTimeout(() => {
      setIsPreviewingTransition(false);
      setPreviewTransitionType(null);
    }, transitionDuration * 1000 + 100);
  };

  const getTransitionStyles = () => {
    if (!isPreviewingTransition || !previewTransitionType) return {};
    
    const transition = previewTransitionType === "intro" ? introTransition : outroTransition;
    const duration = `${transitionDuration}s`;
    
    const baseStyle = {
      transition: `all ${duration} ease-in-out`,
    };

    switch (transition.id) {
      case "fade":
        return { ...baseStyle, animation: `fade-transition ${duration} ease-in-out` };
      case "fade-black":
        return { ...baseStyle, animation: `fade-black-transition ${duration} ease-in-out` };
      case "fade-white":
        return { ...baseStyle, animation: `fade-white-transition ${duration} ease-in-out` };
      case "slide-left":
        return { ...baseStyle, animation: `slide-left-transition ${duration} ease-in-out` };
      case "slide-right":
        return { ...baseStyle, animation: `slide-right-transition ${duration} ease-in-out` };
      case "slide-up":
        return { ...baseStyle, animation: `slide-up-transition ${duration} ease-in-out` };
      case "slide-down":
        return { ...baseStyle, animation: `slide-down-transition ${duration} ease-in-out` };
      case "zoom-in":
        return { ...baseStyle, animation: `zoom-in-transition ${duration} ease-in-out` };
      case "zoom-out":
        return { ...baseStyle, animation: `zoom-out-transition ${duration} ease-in-out` };
      case "spin":
        return { ...baseStyle, animation: `spin-transition ${duration} ease-in-out` };
      case "blur":
        return { ...baseStyle, animation: `blur-transition ${duration} ease-in-out` };
      case "flash":
        return { ...baseStyle, animation: `flash-transition ${duration} ease-in-out` };
      case "wipe":
        return { ...baseStyle, animation: `wipe-transition ${duration} ease-in-out` };
      case "glitch":
        return { ...baseStyle, animation: `glitch-transition ${duration} ease-in-out` };
      default:
        return {};
    }
  };

  const filteredTracks = musicFilter === "all" 
    ? musicTracks 
    : musicTracks.filter(t => t.mood.toLowerCase() === musicFilter || t.genre.toLowerCase() === musicFilter);

  const getMoodColor = (mood: string) => {
    switch (mood.toLowerCase()) {
      case "energetic": return "bg-orange-500/20 text-orange-400 border-orange-500/30";
      case "motivational": return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "chill": return "bg-green-500/20 text-green-400 border-green-500/30";
      case "focus": return "bg-purple-500/20 text-purple-400 border-purple-500/30";
      case "intense": return "bg-red-500/20 text-red-400 border-red-500/30";
      case "hype": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const exportVideo = () => {
    if (!videoFile) {
      toast.error("No video to export");
      return;
    }
    setShowExportDialog(true);
  };

  const handleDownload = () => {
    if (!videoUrl) return;
    
    const link = document.createElement('a');
    link.href = videoUrl;
    link.download = `edited-video-${Date.now()}.${videoFile?.name.split('.').pop() || 'mp4'}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Video downloaded!");
  };

  const handleShare = async () => {
    if (!videoUrl) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My edited sports video',
          text: 'Check out this video I created!',
          url: videoUrl,
        });
        toast.success("Shared successfully!");
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      navigator.clipboard.writeText(videoUrl);
      toast.success("Video link copied to clipboard!");
    }
  };

  const handleDelete = () => {
    setVideoFile(null);
    setVideoUrl("");
    resetEditor();
    toast.success("Video removed");
  };

  const postToFeed = async () => {
    if (!user || !videoFile) {
      toast.error("Please sign in to post");
      return;
    }

    setExporting(true);
    try {
      const fileName = `${user.id}/${Date.now()}-${videoFile.name}`;
      const { error: uploadError } = await supabase.storage
        .from("posts")
        .upload(fileName, videoFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("posts")
        .getPublicUrl(fileName);

      const { error: postError } = await supabase
        .from("posts")
        .insert({
          user_id: user.id,
          content: postCaption || "Check out my edited sports video! 🎬",
          image_url: publicUrl,
        });

      if (postError) throw postError;

      toast.success("Posted to feed!");
      setShowExportDialog(false);
      navigate("/");
    } catch (error) {
      console.error("Error posting:", error);
      toast.error("Failed to post video");
    } finally {
      setExporting(false);
    }
  };

  const postToStory = async () => {
    if (!user || !videoFile) {
      toast.error("Please sign in to post");
      return;
    }

    setExporting(true);
    try {
      const fileName = `${user.id}/${Date.now()}-story-${videoFile.name}`;
      const { error: uploadError } = await supabase.storage
        .from("stories")
        .upload(fileName, videoFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("stories")
        .getPublicUrl(fileName);

      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      const { error: storyError } = await supabase
        .from("stories")
        .insert({
          user_id: user.id,
          image_url: publicUrl,
          expires_at: expiresAt.toISOString(),
        });

      if (storyError) throw storyError;

      toast.success("Posted to story!");
      setShowExportDialog(false);
      navigate("/");
    } catch (error) {
      console.error("Error posting story:", error);
      toast.error("Failed to post story");
    } finally {
      setExporting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const seekTo = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <Sidebar />
      
      <main className="pt-20 pb-20 lg:pb-6 lg:pl-64">
        <div className="px-4 lg:px-6 py-4">
          {/* Compact Header */}
          <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-display font-bold gradient-text">
                Video Editor ⚡
              </h1>
              <p className="text-sm text-muted-foreground">
                Create TikTok-style sports content
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={resetEditor}>
                <RotateCcw className="mr-1 h-4 w-4" />
                Reset
              </Button>
              {videoFile && (
                <>
                  <Button variant="outline" size="sm" onClick={handleShare}>
                    <Share2 className="mr-1 h-4 w-4" />
                    Share
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleDownload}>
                    <Download className="mr-1 h-4 w-4" />
                    Save
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleDelete} className="text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </>
              )}
              <Button size="sm" onClick={exportVideo} disabled={!videoFile}>
                <Send className="mr-1 h-4 w-4" />
                Post
              </Button>
            </div>
          </div>

          {/* Main Editor - Full Width Layout */}
          <div className="space-y-4">
            {/* Video Preview - Full Width */}
            <Card className="glass-effect w-full">
              <CardContent className="p-4">
                {!videoUrl ? (
                  <div 
                    className="aspect-video max-h-[60vh] rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="w-12 h-12 text-muted-foreground mb-4" />
                    <p className="text-lg font-medium mb-2">Upload a video to start editing</p>
                    <p className="text-sm text-muted-foreground">Max 50MB • MP4, WebM, MOV</p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="video/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Video Player */}
                    <div 
                      ref={videoContainerRef}
                      className={cn(
                        "relative aspect-video max-h-[50vh] rounded-xl overflow-hidden bg-black mx-auto",
                        dragState && "cursor-grabbing"
                      )}
                      style={getTransitionStyles()}
                      onMouseMove={handleOverlayMouseMove}
                      onMouseUp={handleOverlayMouseUp}
                      onMouseLeave={handleOverlayMouseUp}
                    >
                      <video
                        ref={videoRef}
                        src={videoUrl}
                        className="w-full h-full object-contain"
                        style={getVideoStyles()}
                        onClick={togglePlayPause}
                      />
                      
                      {/* Text Overlays - Draggable */}
                      {textOverlays.map((overlay) => (
                        <div
                          key={overlay.id}
                          className={cn(
                            "absolute select-none group",
                            overlay.animation === "bounce" && !dragState && "animate-bounce",
                            overlay.animation === "pulse" && !dragState && "animate-pulse",
                            dragState?.overlayId === overlay.id ? "cursor-grabbing z-50" : "cursor-grab"
                          )}
                          style={{
                            left: `${overlay.x}%`,
                            top: `${overlay.y}%`,
                            fontSize: `${overlay.fontSize}px`,
                            color: overlay.color,
                            fontFamily: overlay.fontFamily,
                            textShadow: "2px 2px 4px rgba(0,0,0,0.8)",
                            transform: "translate(-50%, -50%)",
                          }}
                          onMouseDown={(e) => handleOverlayMouseDown(e, overlay)}
                          onDoubleClick={() => removeOverlay(overlay.id)}
                        >
                          {overlay.text}
                          <div className={cn(
                            "absolute -top-8 left-1/2 -translate-x-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity",
                            dragState?.overlayId === overlay.id && "opacity-100"
                          )}>
                            <span className="text-xs bg-background/90 px-2 py-1 rounded flex items-center gap-1 whitespace-nowrap border border-border/50">
                              <Move className="w-3 h-3" />
                              Drag to move
                            </span>
                          </div>
                          <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-[10px] bg-destructive/80 text-destructive-foreground px-1.5 py-0.5 rounded whitespace-nowrap">
                              Double-click to remove
                            </span>
                          </div>
                        </div>
                      ))}

                      {/* Play/Pause Overlay */}
                      {!dragState && (
                        <div 
                          className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer pointer-events-none"
                        >
                          <div 
                            className="w-16 h-16 rounded-full bg-background/80 flex items-center justify-center pointer-events-auto"
                            onClick={togglePlayPause}
                          >
                            {isPlaying ? (
                              <Pause className="w-8 h-8" />
                            ) : (
                              <Play className="w-8 h-8 ml-1" />
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Timeline & Controls */}
                    <div className="space-y-3">
                      {/* Progress Bar */}
                      <div className="space-y-1">
                        <Slider
                          value={[currentTime]}
                          onValueChange={([value]) => seekTo(value)}
                          min={0}
                          max={duration || 100}
                          step={0.1}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{formatTime(currentTime)}</span>
                          <span>{formatTime(duration)}</span>
                        </div>
                      </div>

                      {/* Playback Controls Row */}
                      <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" onClick={togglePlayPause}>
                            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => setIsMuted(!isMuted)}>
                            {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                          </Button>
                        </div>
                        
                        <div className="flex items-center gap-2 flex-1 min-w-[150px] max-w-[200px]">
                          <Timer className="h-4 w-4 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground w-8">{playbackSpeed}x</span>
                          <Slider
                            value={[playbackSpeed]}
                            onValueChange={([value]) => setPlaybackSpeed(value)}
                            min={0.25}
                            max={2}
                            step={0.25}
                            className="flex-1"
                          />
                        </div>

                        <div className="flex items-center gap-2 min-w-[120px] max-w-[150px]">
                          <Volume2 className="h-4 w-4 text-muted-foreground" />
                          <Slider
                            value={[volume]}
                            onValueChange={([value]) => setVolume(value)}
                            min={0}
                            max={100}
                            step={1}
                            className="flex-1"
                          />
                        </div>

                        <div className="flex items-center gap-1">
                          <Button
                            variant={flipH ? "default" : "outline"}
                            size="sm"
                            onClick={() => setFlipH(!flipH)}
                          >
                            <FlipHorizontal className="h-4 w-4" />
                          </Button>
                          <Button
                            variant={flipV ? "default" : "outline"}
                            size="sm"
                            onClick={() => setFlipV(!flipV)}
                          >
                            <FlipVertical className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setRotation((r) => (r + 90) % 360)}
                          >
                            <RotateCw className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Editing Tools - Full Width Tabs */}
            <Card className="glass-effect w-full">
              <CardContent className="p-4">
                <Tabs defaultValue="filters" className="w-full">
                  <TabsList className="w-full grid grid-cols-8 mb-4">
                    <TabsTrigger value="filters" className="flex flex-col sm:flex-row items-center gap-1">
                      <Sparkles className="w-4 h-4" />
                      <span className="hidden sm:inline text-xs">Filters</span>
                    </TabsTrigger>
                    <TabsTrigger value="adjust" className="flex flex-col sm:flex-row items-center gap-1">
                      <Sun className="w-4 h-4" />
                      <span className="hidden sm:inline text-xs">Adjust</span>
                    </TabsTrigger>
                    <TabsTrigger value="effects" className="flex flex-col sm:flex-row items-center gap-1">
                      <Wand2 className="w-4 h-4" />
                      <span className="hidden sm:inline text-xs">Effects</span>
                    </TabsTrigger>
                    <TabsTrigger value="transitions" className="flex flex-col sm:flex-row items-center gap-1">
                      <Layers className="w-4 h-4" />
                      <span className="hidden sm:inline text-xs">Transitions</span>
                    </TabsTrigger>
                    <TabsTrigger value="music" className="flex flex-col sm:flex-row items-center gap-1">
                      <Music className="w-4 h-4" />
                      <span className="hidden sm:inline text-xs">Music</span>
                    </TabsTrigger>
                    <TabsTrigger value="text" className="flex flex-col sm:flex-row items-center gap-1">
                      <Type className="w-4 h-4" />
                      <span className="hidden sm:inline text-xs">Text</span>
                    </TabsTrigger>
                    <TabsTrigger value="stickers" className="flex flex-col sm:flex-row items-center gap-1">
                      <Sticker className="w-4 h-4" />
                      <span className="hidden sm:inline text-xs">Stickers</span>
                    </TabsTrigger>
                    <TabsTrigger value="trim" className="flex flex-col sm:flex-row items-center gap-1">
                      <Scissors className="w-4 h-4" />
                      <span className="hidden sm:inline text-xs">Trim</span>
                    </TabsTrigger>
                  </TabsList>

                  {/* Filters Tab */}
                  <TabsContent value="filters">
                    <ScrollArea className="w-full">
                      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-12 gap-2">
                        {filters.map((filter) => (
                          <Button
                            key={filter.id}
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedFilter(filter)}
                            className={cn(
                              "flex flex-col h-auto py-2 px-2",
                              selectedFilter.id === filter.id && "border-primary bg-primary/10"
                            )}
                          >
                            <span className="text-xl">{filter.emoji}</span>
                            <span className="text-[10px] mt-1">{filter.name}</span>
                          </Button>
                        ))}
                      </div>
                    </ScrollArea>
                  </TabsContent>

                  {/* Adjust Tab */}
                  <TabsContent value="adjust">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-sm flex items-center gap-2">
                            <Sun className="w-4 h-4 text-primary" />
                            Brightness
                          </label>
                          <span className="text-xs text-muted-foreground">{brightness}%</span>
                        </div>
                        <Slider
                          value={[brightness]}
                          onValueChange={([v]) => setBrightness(v)}
                          min={0}
                          max={200}
                          step={1}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-sm flex items-center gap-2">
                            <Contrast className="w-4 h-4 text-primary" />
                            Contrast
                          </label>
                          <span className="text-xs text-muted-foreground">{contrast}%</span>
                        </div>
                        <Slider
                          value={[contrast]}
                          onValueChange={([v]) => setContrast(v)}
                          min={0}
                          max={200}
                          step={1}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-sm flex items-center gap-2">
                            <Palette className="w-4 h-4 text-primary" />
                            Saturation
                          </label>
                          <span className="text-xs text-muted-foreground">{saturation}%</span>
                        </div>
                        <Slider
                          value={[saturation]}
                          onValueChange={([v]) => setSaturation(v)}
                          min={0}
                          max={200}
                          step={1}
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-sm flex items-center gap-2">
                            <Droplets className="w-4 h-4 text-primary" />
                            Blur
                          </label>
                          <span className="text-xs text-muted-foreground">{blur}px</span>
                        </div>
                        <Slider
                          value={[blur]}
                          onValueChange={([v]) => setBlur(v)}
                          min={0}
                          max={10}
                          step={0.5}
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-sm flex items-center gap-2">
                            <Blend className="w-4 h-4 text-primary" />
                            Hue Rotate
                          </label>
                          <span className="text-xs text-muted-foreground">{hueRotate}°</span>
                        </div>
                        <Slider
                          value={[hueRotate]}
                          onValueChange={([v]) => setHueRotate(v)}
                          min={-180}
                          max={180}
                          step={1}
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setBrightness(100);
                            setContrast(100);
                            setSaturation(100);
                            setBlur(0);
                            setHueRotate(0);
                          }}
                          className="w-full"
                        >
                          <RotateCcw className="w-4 h-4 mr-2" />
                          Reset Adjustments
                        </Button>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Effects Tab */}
                  <TabsContent value="effects">
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">Quick effects presets</p>
                      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setContrast(130);
                            setSaturation(120);
                          }}
                          className="flex flex-col h-auto py-3"
                        >
                          <Star className="w-5 h-5 mb-1 text-primary" />
                          <span className="text-xs">Enhance</span>
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setPlaybackSpeed(0.5);
                          }}
                          className="flex flex-col h-auto py-3"
                        >
                          <Timer className="w-5 h-5 mb-1 text-primary" />
                          <span className="text-xs">Slow Mo</span>
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setBrightness(110);
                            setContrast(90);
                            setSaturation(130);
                          }}
                          className="flex flex-col h-auto py-3"
                        >
                          <Layers className="w-5 h-5 mb-1 text-primary" />
                          <span className="text-xs">Dreamy</span>
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setContrast(140);
                            setSaturation(80);
                          }}
                          className="flex flex-col h-auto py-3"
                        >
                          <Focus className="w-5 h-5 mb-1 text-primary" />
                          <span className="text-xs">Cinematic</span>
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setSaturation(0);
                            setContrast(120);
                          }}
                          className="flex flex-col h-auto py-3"
                        >
                          <Maximize className="w-5 h-5 mb-1 text-primary" />
                          <span className="text-xs">B&W</span>
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setSaturation(200);
                            setBrightness(110);
                          }}
                          className="flex flex-col h-auto py-3"
                        >
                          <Zap className="w-5 h-5 mb-1 text-primary" />
                          <span className="text-xs">Vibrant</span>
                        </Button>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Transitions Tab */}
                  <TabsContent value="transitions">
                    <div className="space-y-4">
                      {/* Duration Slider */}
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 flex-1">
                          <Timer className="w-4 h-4 text-primary" />
                          <span className="text-sm">Duration:</span>
                          <Slider
                            value={[transitionDuration]}
                            onValueChange={([v]) => setTransitionDuration(v)}
                            min={0.2}
                            max={2}
                            step={0.1}
                            className="flex-1 max-w-[200px]"
                          />
                          <span className="text-sm text-muted-foreground w-12">{transitionDuration}s</span>
                        </div>
                      </div>

                      {/* Intro Transition */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium flex items-center gap-2">
                            <span className="text-green-400">▶</span> Intro Transition
                          </h4>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => previewTransition("intro")}
                            disabled={introTransition.id === "none" || !videoUrl}
                          >
                            <Play className="w-3 h-3 mr-1" />
                            Preview
                          </Button>
                        </div>
                        <ScrollArea className="w-full">
                          <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-8 gap-2">
                            {transitions.map((t) => (
                              <Button
                                key={t.id}
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setIntroTransition(t);
                                  toast.success(`Intro: ${t.name}`);
                                }}
                                className={cn(
                                  "flex flex-col h-auto py-2 px-2",
                                  introTransition.id === t.id && "border-green-500 bg-green-500/10"
                                )}
                              >
                                <span className="text-lg">{t.emoji}</span>
                                <span className="text-[10px] mt-1">{t.name}</span>
                              </Button>
                            ))}
                          </div>
                        </ScrollArea>
                      </div>

                      {/* Outro Transition */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium flex items-center gap-2">
                            <span className="text-red-400">■</span> Outro Transition
                          </h4>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => previewTransition("outro")}
                            disabled={outroTransition.id === "none" || !videoUrl}
                          >
                            <Play className="w-3 h-3 mr-1" />
                            Preview
                          </Button>
                        </div>
                        <ScrollArea className="w-full">
                          <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-8 gap-2">
                            {transitions.map((t) => (
                              <Button
                                key={t.id}
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setOutroTransition(t);
                                  toast.success(`Outro: ${t.name}`);
                                }}
                                className={cn(
                                  "flex flex-col h-auto py-2 px-2",
                                  outroTransition.id === t.id && "border-red-500 bg-red-500/10"
                                )}
                              >
                                <span className="text-lg">{t.emoji}</span>
                                <span className="text-[10px] mt-1">{t.name}</span>
                              </Button>
                            ))}
                          </div>
                        </ScrollArea>
                      </div>

                      {/* Selected Transitions Summary */}
                      <div className="p-3 rounded-lg bg-muted/50 flex flex-wrap items-center gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-green-400">▶</span>
                          <span>Intro:</span>
                          <span className="font-medium">{introTransition.emoji} {introTransition.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-red-400">■</span>
                          <span>Outro:</span>
                          <span className="font-medium">{outroTransition.emoji} {outroTransition.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Timer className="w-4 h-4" />
                          <span>{transitionDuration}s each</span>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Music Tab */}
                  <TabsContent value="music">
                    <div className="space-y-4">
                      {/* Filter Buttons */}
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant={musicFilter === "all" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setMusicFilter("all")}
                        >
                          All
                        </Button>
                        <Button
                          variant={musicFilter === "energetic" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setMusicFilter("energetic")}
                          className="text-orange-400"
                        >
                          🔥 Energetic
                        </Button>
                        <Button
                          variant={musicFilter === "motivational" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setMusicFilter("motivational")}
                          className="text-blue-400"
                        >
                          💪 Motivational
                        </Button>
                        <Button
                          variant={musicFilter === "chill" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setMusicFilter("chill")}
                          className="text-green-400"
                        >
                          😎 Chill
                        </Button>
                        <Button
                          variant={musicFilter === "focus" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setMusicFilter("focus")}
                          className="text-purple-400"
                        >
                          🎯 Focus
                        </Button>
                        <Button
                          variant={musicFilter === "intense" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setMusicFilter("intense")}
                          className="text-red-400"
                        >
                          ⚡ Intense
                        </Button>
                        <Button
                          variant={musicFilter === "hype" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setMusicFilter("hype")}
                          className="text-yellow-400"
                        >
                          🎉 Hype
                        </Button>
                      </div>

                      {/* Selected Track Display */}
                      {selectedTrack && (
                        <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                              <Music className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium text-sm">{selectedTrack.name}</p>
                              <p className="text-xs text-muted-foreground">{selectedTrack.genre} • {selectedTrack.duration}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 min-w-[120px]">
                              <Volume2 className="w-4 h-4 text-muted-foreground" />
                              <Slider
                                value={[musicVolume]}
                                onValueChange={([v]) => setMusicVolume(v)}
                                min={0}
                                max={100}
                                step={1}
                                className="flex-1"
                              />
                              <span className="text-xs w-8">{musicVolume}%</span>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedTrack(null)}
                              className="text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Music Track List */}
                      <ScrollArea className="h-[200px]">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                          {filteredTracks.map((track) => (
                            <div
                              key={track.id}
                              onClick={() => selectTrack(track)}
                              className={cn(
                                "p-3 rounded-lg border cursor-pointer transition-all hover:border-primary/50 hover:bg-primary/5",
                                selectedTrack?.id === track.id && "border-primary bg-primary/10"
                              )}
                            >
                              <div className="flex items-start gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className={cn(
                                    "w-8 h-8 p-0 rounded shrink-0",
                                    previewingTrackId === track.id && "bg-primary text-primary-foreground"
                                  )}
                                  onClick={(e) => togglePreviewTrack(track, e)}
                                >
                                  {previewingTrackId === track.id ? (
                                    <Pause className="w-4 h-4" />
                                  ) : (
                                    <Play className="w-4 h-4" />
                                  )}
                                </Button>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-sm truncate">{track.name}</p>
                                  <p className="text-xs text-muted-foreground">{track.genre} • {track.bpm} BPM</p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className={cn("text-[10px] px-1.5 py-0.5 rounded border", getMoodColor(track.mood))}>
                                      {track.mood}
                                    </span>
                                    <span className="text-[10px] text-muted-foreground">{track.duration}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>

                      {/* Audio elements for playback */}
                      <audio ref={audioRef} />
                      <audio 
                        ref={previewAudioRef} 
                        onEnded={() => setPreviewingTrackId(null)}
                      />

                      <p className="text-xs text-muted-foreground text-center">
                        🎵 Click ▶ to preview • Click card to add as background music
                      </p>
                    </div>
                  </TabsContent>

                  {/* Text Tab */}
                  <TabsContent value="text">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <Input
                          placeholder="Enter your text..."
                          value={currentText}
                          onChange={(e) => setCurrentText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") addTextOverlay();
                          }}
                        />
                        
                        <div className="flex flex-wrap gap-2">
                          <div className="flex items-center gap-2">
                            <label className="text-xs text-muted-foreground">Color:</label>
                            <input
                              type="color"
                              value={currentTextColor}
                              onChange={(e) => setCurrentTextColor(e.target.value)}
                              className="w-8 h-8 rounded cursor-pointer"
                            />
                          </div>
                          
                          <select
                            value={currentTextFont}
                            onChange={(e) => setCurrentTextFont(e.target.value)}
                            className="px-2 py-1 rounded text-xs bg-muted border-border"
                          >
                            {fontOptions.map((font) => (
                              <option key={font.id} value={font.id}>{font.name}</option>
                            ))}
                          </select>

                          <select
                            value={currentTextAnimation}
                            onChange={(e) => setCurrentTextAnimation(e.target.value)}
                            className="px-2 py-1 rounded text-xs bg-muted border-border"
                          >
                            {textAnimations.map((anim) => (
                              <option key={anim.id} value={anim.id}>{anim.name}</option>
                            ))}
                          </select>
                        </div>

                        <Button onClick={addTextOverlay} className="w-full" disabled={!videoUrl}>
                          <Check className="mr-2 h-4 w-4" />
                          Add Text
                        </Button>
                      </div>
                      
                      {textOverlays.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs text-muted-foreground">
                            Active overlays: {textOverlays.length}
                          </p>
                          <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto">
                            {textOverlays.map((overlay) => (
                              <div 
                                key={overlay.id}
                                className="text-xs p-2 bg-muted/50 rounded flex justify-between items-center"
                              >
                                <span className="truncate">{overlay.text}</span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeOverlay(overlay.id)}
                                  className="h-6 w-6 p-0"
                                >
                                  ×
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  {/* Stickers Tab */}
                  <TabsContent value="stickers">
                    <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2">
                      {stickers.map((sticker, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          className="h-12 text-2xl p-0"
                          onClick={() => addStickerOverlay(sticker)}
                          disabled={!videoUrl}
                        >
                          {sticker}
                        </Button>
                      ))}
                    </div>
                  </TabsContent>

                  {/* Trim Tab */}
                  <TabsContent value="trim">
                    {duration > 0 ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-sm font-medium flex items-center gap-2">
                              Start: {formatTime(duration * trimStart / 100)}
                            </label>
                            <Slider
                              value={[trimStart]}
                              onValueChange={([value]) => setTrimStart(Math.min(value, trimEnd - 1))}
                              min={0}
                              max={100}
                              step={1}
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium flex items-center gap-2">
                              End: {formatTime(duration * trimEnd / 100)}
                            </label>
                            <Slider
                              value={[trimEnd]}
                              onValueChange={([value]) => setTrimEnd(Math.max(value, trimStart + 1))}
                              min={0}
                              max={100}
                              step={1}
                            />
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground text-center">
                          Final duration: {formatTime((duration * (trimEnd - trimStart)) / 100)}
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Upload a video to enable trimming
                      </p>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Export/Post Dialog */}
      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="w-5 h-5 text-primary" />
              Share Your Video
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {videoUrl && (
              <div className="aspect-video rounded-lg overflow-hidden bg-black">
                <video
                  src={videoUrl}
                  className="w-full h-full object-cover"
                  style={getVideoStyles()}
                  controls
                />
              </div>
            )}

            <div>
              <label className="text-sm font-medium mb-2 block">
                Add a caption (optional)
              </label>
              <Textarea
                value={postCaption}
                onChange={(e) => setPostCaption(e.target.value)}
                placeholder="What's happening in this video?"
                rows={3}
                className="resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={postToFeed}
                disabled={exporting}
                className="w-full"
              >
                <ImageIcon className="mr-2 h-4 w-4" />
                {exporting ? "Posting..." : "Post to Feed"}
              </Button>

              <Button
                onClick={postToStory}
                disabled={exporting}
                variant="outline"
                className="w-full"
              >
                <Sparkles className="mr-2 h-4 w-4" />
                {exporting ? "Posting..." : "Post to Story"}
              </Button>
            </div>

            <div className="flex gap-2 pt-2 border-t">
              <Button
                onClick={handleDownload}
                variant="outline"
                size="sm"
                className="flex-1"
              >
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>

              <Button
                onClick={handleShare}
                variant="outline"
                size="sm"
                className="flex-1"
              >
                <Share2 className="mr-2 h-4 w-4" />
                Share Link
              </Button>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              Note: Video processing with effects requires server-side rendering. 
              The original video will be posted.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VideoEditor;
