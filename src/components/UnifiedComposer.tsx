import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Image, Video, ChevronRight, Music } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useMusicRecommendations } from "@/hooks/useMusicRecommendations";
import { getSportIcon } from "@/constants/sports";
import { cn } from "@/lib/utils";
import { z } from "zod";

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
}

const UnifiedComposer = ({ onPostCreated }: UnifiedComposerProps) => {
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [postType, setPostType] = useState<"post" | "story">("post");
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [userSport, setUserSport] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
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

      if (imageFile) {
        imageUrl = await uploadImage(imageFile, postType === "story" ? "stories" : "posts");
      }

      if (videoFile) {
        videoUrl = await uploadVideo(videoFile);
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
          image_url: imageUrl || videoPreview, // Use video thumbnail or video URL for stories
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
        });

        if (error) throw error;

        toast({
          title: "Post created!",
          description: videoUrl ? "Your video post is now live." : "Your post is now live.",
        });
      }

      setContent("");
      setImageFile(null);
      setImagePreview(null);
      setVideoFile(null);
      setVideoPreview(null);
      setUploadProgress(0);
      setSelectedMood(null);
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
              <div className="flex gap-2">
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
