import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Play, Pause, Scissors, Repeat2, RotateCcw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface VideoTrimModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  videoUrl: string;
  videoTitle: string;
  videoDescription?: string;
  onRepostSuccess?: () => void;
}

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
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(100);
  const [caption, setCaption] = useState("");
  const [reposting, setReposting] = useState(false);

  useEffect(() => {
    if (open) {
      setCaption(`🏆 Check out my highlight: ${videoTitle}${videoDescription ? `\n\n${videoDescription}` : ""}`);
      setTrimStart(0);
      setTrimEnd(100);
      setIsPlaying(false);
    }
  }, [open, videoTitle, videoDescription]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      
      // Loop within trim range
      const endTime = (trimEnd / 100) * duration;
      if (video.currentTime >= endTime) {
        video.currentTime = (trimStart / 100) * duration;
        if (isPlaying) {
          video.play();
        }
      }
    };

    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.addEventListener("timeupdate", handleTimeUpdate);

    return () => {
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video.removeEventListener("timeupdate", handleTimeUpdate);
    };
  }, [duration, trimStart, trimEnd, isPlaying]);

  const togglePlayPause = () => {
    if (!videoRef.current) return;

    if (isPlaying) {
      videoRef.current.pause();
    } else {
      // Start from trim start if at beginning or past end
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
    
    // Seek to start position
    if (videoRef.current && duration > 0) {
      videoRef.current.currentTime = (start / 100) * duration;
    }
  };

  const resetTrim = () => {
    setTrimStart(0);
    setTrimEnd(100);
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
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

  const handleRepost = async () => {
    if (!user) {
      toast.error("Please sign in to repost");
      return;
    }

    setReposting(true);
    try {
      // Store trim info in the post content (for display purposes)
      // Note: Actual video trimming would require server-side processing
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scissors className="w-5 h-5 text-primary" />
            Trim & Repost Highlight
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Video Preview */}
          <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
            <video
              ref={videoRef}
              src={videoUrl}
              className="w-full h-full object-contain"
              playsInline
            />
            
            {/* Play/Pause Overlay */}
            <button
              onClick={togglePlayPause}
              className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 transition-colors"
            >
              <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center">
                {isPlaying ? (
                  <Pause className="w-8 h-8 text-black" />
                ) : (
                  <Play className="w-8 h-8 text-black ml-1" />
                )}
              </div>
            </button>

            {/* Progress indicator */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/30">
              <div 
                className="h-full bg-primary transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Trim Controls */}
          <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium flex items-center gap-2">
                <Scissors className="w-4 h-4" />
                Trim Range
              </span>
              <Button variant="ghost" size="sm" onClick={resetTrim}>
                <RotateCcw className="w-4 h-4 mr-1" />
                Reset
              </Button>
            </div>
            
            {/* Dual Slider */}
            <div className="relative pt-2">
              <Slider
                value={[trimStart, trimEnd]}
                onValueChange={handleTrimChange}
                min={0}
                max={100}
                step={1}
                className="w-full"
              />
              
              {/* Time labels */}
              <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                <span>Start: {formatTime((trimStart / 100) * duration)}</span>
                <span className="text-primary font-medium">
                  Duration: {formatTime(getTrimmedDuration())}
                </span>
                <span>End: {formatTime((trimEnd / 100) * duration)}</span>
              </div>
            </div>
          </div>

          {/* Caption */}
          <div className="space-y-2">
            <Label htmlFor="caption">Caption</Label>
            <Textarea
              id="caption"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Write a caption for your repost..."
              rows={3}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground text-right">
              {caption.length}/500
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleRepost} disabled={reposting}>
              <Repeat2 className="w-4 h-4 mr-2" />
              {reposting ? "Reposting..." : "Repost to Feed"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VideoTrimModal;