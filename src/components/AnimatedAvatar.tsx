import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";

interface Props {
  videoUrl?: string | null;
  imageUrl?: string | null;
  fallback: string;
  className?: string;
  showPlayIcon?: boolean;
}

const AnimatedAvatar = ({ videoUrl, imageUrl, fallback, className, showPlayIcon = false }: Props) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoUrl && videoRef.current) {
      videoRef.current.load();
    }
  }, [videoUrl]);

  const handleMouseEnter = () => {
    if (videoUrl && videoRef.current) {
      setShowVideo(true);
      videoRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(err => {
        console.error("Error playing video:", err);
      });
    }
  };

  const handleMouseLeave = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
      setIsPlaying(false);
      // Delay hiding video to allow smooth transition
      setTimeout(() => setShowVideo(false), 100);
    }
  };

  if (videoUrl) {
    return (
      <div 
        className={cn("relative", className)}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Static image - always visible */}
        <Avatar className={cn("transition-opacity", showVideo && isPlaying ? "opacity-0" : "opacity-100")}>
          <AvatarImage src={imageUrl || undefined} />
          <AvatarFallback>{fallback}</AvatarFallback>
        </Avatar>

        {/* Video overlay - only visible when playing */}
        {showVideo && (
          <video
            ref={videoRef}
            muted
            loop
            playsInline
            className={cn(
              "absolute inset-0 w-full h-full object-cover rounded-full transition-opacity",
              isPlaying ? "opacity-100" : "opacity-0"
            )}
          >
            <source src={videoUrl} type="video/webm" />
          </video>
        )}

        {/* Play indicator */}
        {showPlayIcon && !isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/20 rounded-full opacity-0 hover:opacity-100 transition-opacity">
            <div className="w-6 h-6 rounded-full bg-primary/80 flex items-center justify-center">
              <div className="w-0 h-0 border-l-[6px] border-l-white border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent ml-0.5" />
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <Avatar className={className}>
      <AvatarImage src={imageUrl || undefined} />
      <AvatarFallback>{fallback}</AvatarFallback>
    </Avatar>
  );
};

export default AnimatedAvatar;
