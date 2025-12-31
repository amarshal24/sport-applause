import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Image, Video, ChevronRight, Music, X, Play, Pause, Upload, Scissors } from "lucide-react";
import MusicTrimmer from "@/components/MusicTrimmer";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useMusicRecommendations } from "@/hooks/useMusicRecommendations";
import { getSportIcon } from "@/constants/sports";
import { cn } from "@/lib/utils";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const postSchema = z.object({
  content: z.string().trim().min(1, { message: "Post cannot be empty" }).max(5000, { message: "Post is too long" }),
});

interface Mood {
  id: string;
  emoji: string;
  label: string;
  color: string;
  gradient: string;
}

// Royalty-free music library
interface MusicTrack {
  id: string;
  title: string;
  artist: string;
  duration: string;
  mood: string;
  url: string;
  isCustom?: boolean;
  trimStart?: number;
  trimEnd?: number;
  fadeIn?: number;
  fadeOut?: number;
}

const musicLibrary: MusicTrack[] = [
  { id: "1", title: "Victory Anthem", artist: "Sports Beats", duration: "2:45", mood: "energetic", url: "https://cdn.pixabay.com/audio/2024/11/01/audio_06bc1f4e85.mp3" },
  { id: "2", title: "Champion's Rise", artist: "Athletic Sounds", duration: "3:12", mood: "motivated", url: "https://cdn.pixabay.com/audio/2024/09/14/audio_2e31a36ffb.mp3" },
  { id: "3", title: "Warm Up Flow", artist: "Gym Vibes", duration: "2:30", mood: "chill", url: "https://cdn.pixabay.com/audio/2024/08/08/audio_c51be6afe9.mp3" },
  { id: "4", title: "Focus Mode", artist: "Zen Athletics", duration: "3:00", mood: "focused", url: "https://cdn.pixabay.com/audio/2024/05/16/audio_166af04339.mp3" },
  { id: "5", title: "Game Day Energy", artist: "Sports Beats", duration: "2:55", mood: "pumped", url: "https://cdn.pixabay.com/audio/2024/11/04/audio_e4c0ce3e27.mp3" },
  { id: "6", title: "Winning Moment", artist: "Victory Lane", duration: "2:20", mood: "victorious", url: "https://cdn.pixabay.com/audio/2024/10/22/audio_c9e6b2bf6f.mp3" },
  { id: "7", title: "Training Montage", artist: "Workout Mix", duration: "3:30", mood: "energetic", url: "https://cdn.pixabay.com/audio/2024/09/22/audio_e67bcb74e9.mp3" },
  { id: "8", title: "Cool Down", artist: "Relaxed Beats", duration: "2:40", mood: "chill", url: "https://cdn.pixabay.com/audio/2024/07/30/audio_9ade1be24e.mp3" },
];

const moods: Mood[] = [
  {
    id: "energetic",
    emoji: "⚡",
    label: "Energetic",
    color: "text-yellow-500",
    gradient: "from-yellow-400 to-orange-500"
  },
  {
    id: "chill",
    emoji: "😌",
    label: "Chill",
    color: "text-blue-500",
    gradient: "from-blue-400 to-cyan-500"
  },
  {
    id: "motivated",
    emoji: "💪",
    label: "Motivated",
    color: "text-red-500",
    gradient: "from-red-400 to-pink-500"
  },
  {
    id: "focused",
    emoji: "🎯",
    label: "Focused",
    color: "text-purple-500",
    gradient: "from-purple-400 to-indigo-500"
  },
  {
    id: "victorious",
    emoji: "🏆",
    label: "Victorious",
    color: "text-green-500",
    gradient: "from-green-400 to-emerald-500"
  },
  {
    id: "pumped",
    emoji: "🔥",
    label: "Pumped Up",
    color: "text-orange-500",
    gradient: "from-orange-400 to-red-500"
  },
];

interface UnifiedComposerProps {
  onPostCreated?: () => void;
  initialMode?: "post" | "story";
}

const UnifiedComposer = ({ onPostCreated, initialMode = "post" }: UnifiedComposerProps) => {
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [postType, setPostType] = useState<"post" | "story">(initialMode);

  useEffect(() => {
    setPostType(initialMode);
  }, [initialMode]);
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [userSport, setUserSport] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [selectedMusic, setSelectedMusic] = useState<MusicTrack | null>(null);
  const [musicDialogOpen, setMusicDialogOpen] = useState(false);
  const [previewingTrack, setPreviewingTrack] = useState<string | null>(null);
  const [customMusicFile, setCustomMusicFile] = useState<File | null>(null);
  const [customMusicPreview, setCustomMusicPreview] = useState<string | null>(null);
  const [musicUploadProgress, setMusicUploadProgress] = useState<number>(0);
  const [showTrimmer, setShowTrimmer] = useState(false);
  const [pendingTrimTrack, setPendingTrimTrack] = useState<MusicTrack | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();
  const { fetchRecommendations, loading: musicLoading } = useMusicRecommendations();

  useEffect(() => {
    const fetchUserSport = async () => {
      if (!user) return;
      
      const { data } = await supabase
        .from("profiles")
        .select("sports")
        .eq("id", user.id)
        .single();
      
      if (data?.sports && data.sports.length > 0) {
        setUserSport(data.sports[0]);
      }
    };

    fetchUserSport();
  }, [user]);

  const SportIcon = userSport ? getSportIcon(userSport) : Music;

  const handlePreviewTrack = (track: MusicTrack) => {
    if (previewingTrack === track.id) {
      audioRef.current?.pause();
      setPreviewingTrack(null);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      audioRef.current = new Audio(track.url);
      audioRef.current.volume = 0.5;
      audioRef.current.play();
      setPreviewingTrack(track.id);
      audioRef.current.onended = () => setPreviewingTrack(null);
    }
  };

  const handleSelectMusic = (track: MusicTrack) => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setPreviewingTrack(null);
    
    // For library tracks, allow optional trimming
    setPendingTrimTrack(track);
    setShowTrimmer(true);
    setMusicDialogOpen(false);
  };

  const handleTrimComplete = (startTime: number, endTime: number, fadeIn: number, fadeOut: number) => {
    if (pendingTrimTrack) {
      const trimmedTrack = {
        ...pendingTrimTrack,
        trimStart: startTime,
        trimEnd: endTime,
        fadeIn,
        fadeOut,
      };
      setSelectedMusic(trimmedTrack);
      setShowTrimmer(false);
      setPendingTrimTrack(null);
      
      const duration = Math.round(endTime - startTime);
      const fadeInfo = fadeIn > 0 || fadeOut > 0 
        ? ` with ${fadeIn > 0 ? `${fadeIn.toFixed(1)}s fade in` : ''}${fadeIn > 0 && fadeOut > 0 ? ' and ' : ''}${fadeOut > 0 ? `${fadeOut.toFixed(1)}s fade out` : ''}`
        : '';
      toast({
        title: "Music trimmed!",
        description: `"${trimmedTrack.title}" (${duration}s)${fadeInfo} will play when others view your post.`,
      });
    }
  };

  const handleTrimCancel = () => {
    // If canceling trim, still add the music but without trim
    if (pendingTrimTrack) {
      setSelectedMusic(pendingTrimTrack);
      toast({
        title: "Music attached!",
        description: `"${pendingTrimTrack.title}" will play when others view your post.`,
      });
    }
    setShowTrimmer(false);
    setPendingTrimTrack(null);
  };

  const handleRemoveMusic = () => {
    setSelectedMusic(null);
    if (customMusicPreview) {
      URL.revokeObjectURL(customMusicPreview);
    }
    setCustomMusicFile(null);
    setCustomMusicPreview(null);
  };

  const handleCustomMusicSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 20 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Music file must be less than 20MB",
          variant: "destructive",
        });
        return;
      }

      const validTypes = ["audio/mpeg", "audio/mp3", "audio/wav", "audio/ogg", "audio/m4a", "audio/aac"];
      if (!validTypes.includes(file.type) && !file.name.match(/\.(mp3|wav|ogg|m4a|aac)$/i)) {
        toast({
          title: "Invalid file type",
          description: "Please upload an MP3, WAV, OGG, M4A, or AAC file",
          variant: "destructive",
        });
        return;
      }

      // Stop any previewing audio
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setPreviewingTrack(null);

      const audioUrl = URL.createObjectURL(file);
      setCustomMusicFile(file);
      setCustomMusicPreview(audioUrl);

      // Get duration
      const audio = new Audio(audioUrl);
      audio.addEventListener("loadedmetadata", () => {
        const minutes = Math.floor(audio.duration / 60);
        const seconds = Math.floor(audio.duration % 60);
        const duration = `${minutes}:${seconds.toString().padStart(2, "0")}`;
        
        const fileName = file.name.replace(/\.[^/.]+$/, "");
        const customTrack: MusicTrack = {
          id: `custom-${Date.now()}`,
          title: fileName,
          artist: "Your Upload",
          duration,
          mood: "custom",
          url: audioUrl,
          isCustom: true,
        };
        
        // Show trimmer for custom uploads
        setPendingTrimTrack(customTrack);
        setShowTrimmer(true);
        setMusicDialogOpen(false);
      });
    }
  };

  const uploadMusic = async (file: File): Promise<string> => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${user!.id}/${Date.now()}.${fileExt}`;

    setMusicUploadProgress(10);

    const { error: uploadError } = await supabase.storage
      .from("post-music")
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
      });

    setMusicUploadProgress(80);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from("post-music")
      .getPublicUrl(fileName);

    setMusicUploadProgress(100);
    return publicUrl;
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 20 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Image must be less than 20MB",
          variant: "destructive",
        });
        return;
      }

      // Clear video if selecting image
      setVideoFile(null);
      setVideoPreview(null);

      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 100 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Video must be less than 100MB",
          variant: "destructive",
        });
        return;
      }

      if (!file.type.startsWith("video/")) {
        toast({
          title: "Invalid file type",
          description: "Please select a video file",
          variant: "destructive",
        });
        return;
      }

      // Clear image if selecting video
      setImageFile(null);
      setImagePreview(null);

      setVideoFile(file);
      const videoUrl = URL.createObjectURL(file);
      setVideoPreview(videoUrl);
    }
  };

  const uploadVideo = async (file: File) => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${user!.id}/${Date.now()}.${fileExt}`;

    setUploadProgress(10);

    const { error: uploadError } = await supabase.storage
      .from("post-videos")
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
      });

    setUploadProgress(80);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from("post-videos")
      .getPublicUrl(fileName);

    setUploadProgress(100);
    return publicUrl;
  };

  const uploadImage = async (file: File, bucketName: string) => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${user!.id}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from(bucketName)
      .getPublicUrl(fileName);

    return publicUrl;
  };

  const handleSubmit = async () => {
    if (!user) {
      toast({
        title: "Not authenticated",
        description: "Please sign in to post",
        variant: "destructive",
      });
      return;
    }

    const validation = postSchema.safeParse({ content });
    if (!validation.success) {
      toast({
        title: "Invalid post",
        description: validation.error.errors[0].message,
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      let imageUrl: string | null = null;
      let videoUrl: string | null = null;
      let musicUrl: string | null = null;

      if (imageFile) {
        imageUrl = await uploadImage(imageFile, postType === "story" ? "stories" : "posts");
      }

      if (videoFile) {
        videoUrl = await uploadVideo(videoFile);
      }

      // Upload custom music if selected
      if (selectedMusic?.isCustom && customMusicFile) {
        musicUrl = await uploadMusic(customMusicFile);
      } else if (selectedMusic) {
        musicUrl = selectedMusic.url;
      }

      if (postType === "story") {
        if (!imageUrl && !videoFile) {
          toast({
            title: "Media required",
            description: "Stories must include an image or video",
            variant: "destructive",
          });
          setIsSubmitting(false);
          return;
        }

        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24);

        const { error } = await supabase.from("stories").insert({
          user_id: user.id,
          image_url: imageUrl || videoPreview,
          expires_at: expiresAt.toISOString(),
        });

        if (error) throw error;

        toast({
          title: "Story posted!",
          description: "Your story is now live for 24 hours.",
        });
      } else {
        const { error } = await supabase.from("posts").insert({
          user_id: user.id,
          content: content.trim() || (videoFile ? "Check out this video!" : ""),
          image_url: imageUrl,
          video_url: videoUrl,
          music_url: musicUrl,
          music_title: selectedMusic ? `${selectedMusic.title} - ${selectedMusic.artist}` : null,
          music_start_time: selectedMusic?.trimStart ?? 0,
          music_end_time: selectedMusic?.trimEnd ?? null,
          music_fade_in: selectedMusic?.fadeIn ?? 0,
          music_fade_out: selectedMusic?.fadeOut ?? 0,
        });

        if (error) throw error;

        toast({
          title: "Post created!",
          description: selectedMusic 
            ? `Your post with "${selectedMusic.title}" is now live.` 
            : videoUrl 
              ? "Your video post is now live." 
              : "Your post is now live.",
        });
      }

      setContent("");
      setImageFile(null);
      setImagePreview(null);
      setVideoFile(null);
      setVideoPreview(null);
      setUploadProgress(0);
      setSelectedMood(null);
      setSelectedMusic(null);
      setCustomMusicFile(null);
      if (customMusicPreview) {
        URL.revokeObjectURL(customMusicPreview);
      }
      setCustomMusicPreview(null);
      setMusicUploadProgress(0);
      onPostCreated?.();
    } catch (error: any) {
      toast({
        title: "Failed to post",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGetMusic = () => {
    if (selectedMood) {
      fetchRecommendations(selectedMood);
    }
  };

  if (!user) return null;

  return (
    <Card className="glass-effect animate-fade-in mb-6 max-w-5xl mx-auto w-full">
      <CardContent className="pt-6">
        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <SportIcon className="w-5 h-5 text-primary" />
          <h3 className="font-display font-semibold text-lg">What's on your mind today?</h3>
        </div>

        {/* Post Composer Section */}
        <div className="flex gap-3 mb-6">
          <Avatar>
            <AvatarImage src={user.user_metadata?.avatar_url} />
            <AvatarFallback>{user.user_metadata?.username?.[0] || "U"}</AvatarFallback>
          </Avatar>

          <div className="flex-1">
            <Textarea
              placeholder="Share your thoughts, training updates, or achievements..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="mb-3 resize-none bg-muted/30 border-muted"
              rows={3}
              maxLength={5000}
            />

            {imagePreview && (
              <div className="relative mb-3">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="rounded-lg max-h-64 w-full object-cover"
                />
                <Button
                  size="sm"
                  variant="destructive"
                  className="absolute top-2 right-2"
                  onClick={() => {
                    setImageFile(null);
                    setImagePreview(null);
                  }}
                >
                  Remove
                </Button>
              </div>
            )}

            {videoPreview && (
              <div className="relative mb-3">
                <video
                  src={videoPreview}
                  className="rounded-lg max-h-64 w-full object-cover"
                  controls
                  preload="metadata"
                />
                <Button
                  size="sm"
                  variant="destructive"
                  className="absolute top-2 right-2"
                  onClick={() => {
                    if (videoPreview) {
                      URL.revokeObjectURL(videoPreview);
                    }
                    setVideoFile(null);
                    setVideoPreview(null);
                  }}
                >
                  Remove
                </Button>
              </div>
            )}

            {/* Music Trimmer Dialog */}
            {showTrimmer && pendingTrimTrack && (
              <div className="mb-3 p-4 bg-card border border-border rounded-lg animate-fade-in">
                <MusicTrimmer
                  audioUrl={pendingTrimTrack.url}
                  onTrimComplete={handleTrimComplete}
                  onCancel={handleTrimCancel}
                />
              </div>
            )}

            {/* Selected Music Preview */}
            {selectedMusic && !showTrimmer && (
              <div className="mb-3 p-3 bg-primary/10 rounded-lg flex items-center justify-between animate-fade-in">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                    <Music className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{selectedMusic.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {selectedMusic.artist} • {selectedMusic.duration}
                      {selectedMusic.trimStart !== undefined && selectedMusic.trimEnd !== undefined && (
                        <span className="ml-1 text-primary">
                          (trimmed: {Math.round(selectedMusic.trimEnd - selectedMusic.trimStart)}s)
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setPendingTrimTrack(selectedMusic);
                      setShowTrimmer(true);
                    }}
                    title="Edit trim"
                  >
                    <Scissors className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleRemoveMusic}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {isSubmitting && uploadProgress > 0 && (
              <div className="mb-3">
                <div className="flex items-center justify-between text-sm text-muted-foreground mb-1">
                  <span>Uploading...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => document.getElementById("unified-image-upload")?.click()}
                  disabled={isSubmitting}
                >
                  <Image className="h-4 w-4 mr-2" />
                  Photo
                </Button>
                <input
                  id="unified-image-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageSelect}
                />
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => document.getElementById("unified-video-upload")?.click()}
                  disabled={isSubmitting}
                >
                  <Video className="h-4 w-4 mr-2" />
                  Video
                </Button>
                <input
                  id="unified-video-upload"
                  type="file"
                  accept="video/*"
                  className="hidden"
                  onChange={handleVideoSelect}
                />
                
                {/* Music Selection Dialog */}
                <Dialog open={musicDialogOpen} onOpenChange={setMusicDialogOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      variant={selectedMusic ? "secondary" : "ghost"} 
                      size="sm"
                      disabled={isSubmitting || postType === "story"}
                    >
                      <Music className="h-4 w-4 mr-2" />
                      {selectedMusic ? "Change Music" : "Add Music"}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md max-h-[80vh] overflow-hidden flex flex-col">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <Music className="h-5 w-5 text-primary" />
                        Add Music to Your Post
                      </DialogTitle>
                    </DialogHeader>
                    <div className="overflow-y-auto flex-1 -mx-6 px-6">
                      {/* Upload Custom Music Section */}
                      <div className="mb-4 p-4 border-2 border-dashed border-border rounded-lg hover:border-primary transition-colors">
                        <input
                          id="custom-music-upload"
                          type="file"
                          accept="audio/*,.mp3,.wav,.ogg,.m4a,.aac"
                          className="hidden"
                          onChange={handleCustomMusicSelect}
                        />
                        <label 
                          htmlFor="custom-music-upload"
                          className="flex flex-col items-center gap-2 cursor-pointer"
                        >
                          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                            <Upload className="h-6 w-6 text-primary" />
                          </div>
                          <div className="text-center">
                            <p className="font-medium text-sm">Upload Your Own Music</p>
                            <p className="text-xs text-muted-foreground">
                              MP3, WAV, OGG, M4A, AAC • Max 20MB
                            </p>
                          </div>
                        </label>
                      </div>

                      <div className="relative mb-4">
                        <div className="absolute inset-0 flex items-center">
                          <span className="w-full border-t border-border" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                          <span className="bg-background px-2 text-muted-foreground">
                            Or choose from library
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        {musicLibrary.map((track) => (
                          <div
                            key={track.id}
                            className={cn(
                              "p-3 rounded-lg border transition-all cursor-pointer hover:border-primary",
                              selectedMusic?.id === track.id 
                                ? "border-primary bg-primary/5" 
                                : "border-border"
                            )}
                            onClick={() => handleSelectMusic(track)}
                          >
                            <div className="flex items-center gap-3">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-10 w-10 rounded-full p-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handlePreviewTrack(track);
                                }}
                              >
                                {previewingTrack === track.id ? (
                                  <Pause className="h-4 w-4" />
                                ) : (
                                  <Play className="h-4 w-4" />
                                )}
                              </Button>
                              <div className="flex-1">
                                <p className="font-medium text-sm">{track.title}</p>
                                <p className="text-xs text-muted-foreground">
                                  {track.artist} • {track.duration}
                                </p>
                              </div>
                              <span className="text-xs text-muted-foreground capitalize px-2 py-1 bg-muted rounded">
                                {track.mood}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="flex gap-2">
                <Button
                  variant={postType === "post" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPostType("post")}
                >
                  Post
                </Button>
                <Button
                  variant={postType === "story" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPostType("story")}
                >
                  Story
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting || (!content.trim() && !imageFile && !videoFile)}
                  size="sm"
                >
                  {isSubmitting ? "Posting..." : "Share"}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Mood Selector Section */}
        <div className="border-t border-border pt-4">
          <p className="text-sm text-muted-foreground mb-3">Or set your vibe for music recommendations:</p>
          
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
            {moods.map((mood) => (
              <Button
                key={mood.id}
                variant="outline"
                onClick={() => setSelectedMood(mood.id)}
                className={cn(
                  "h-auto py-3 px-2 flex flex-col items-center gap-1 transition-all duration-300 hover-lift relative overflow-hidden group",
                  selectedMood === mood.id && "border-primary shadow-glow"
                )}
              >
                {selectedMood === mood.id && (
                  <div className={cn(
                    "absolute inset-0 bg-gradient-to-br opacity-10",
                    mood.gradient
                  )} />
                )}
                <span className="text-2xl group-hover:scale-110 transition-transform">
                  {mood.emoji}
                </span>
                <span className={cn(
                  "text-xs font-medium",
                  selectedMood === mood.id ? mood.color : "text-muted-foreground"
                )}>
                  {mood.label}
                </span>
              </Button>
            ))}
          </div>

          {selectedMood && (
            <div className="mt-4 p-3 bg-primary/10 rounded-lg flex items-center justify-between animate-fade-in">
              <div className="flex items-center gap-2">
                <Music className="w-4 h-4 text-primary animate-pulse-glow" />
                <span className="text-sm font-medium">
                  Feeling {moods.find(m => m.id === selectedMood)?.label.toLowerCase()}!
                </span>
              </div>
              <Button 
                size="sm" 
                variant="ghost"
                className="gap-1 text-primary hover:text-primary/90"
                onClick={handleGetMusic}
                disabled={musicLoading}
              >
                {musicLoading ? "Loading..." : "Get Music"}
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default UnifiedComposer;
