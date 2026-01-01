import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Share2, MessageSquare, RefreshCw, Play, Music, Pause, Volume2, VolumeX, Volume1, Heart, Maximize, Minimize } from "lucide-react";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";

const SPORTS_CATEGORIES = [
  "All",
  "Basketball",
  "Football",
  "Soccer",
  "Baseball",
  "Hockey",
  "Tennis",
  "Boxing",
  "MMA",
  "Golf",
  "Cricket",
  "Rugby",
  "Volleyball",
  "Track & Field",
  "Swimming",
  "Fitness",
];

interface Post {
  id: string;
  content: string;
  image_url: string | null;
  video_url: string | null;
  music_url: string | null;
  music_title: string | null;
  music_start_time: number | null;
  music_end_time: number | null;
  music_fade_in: number | null;
  music_fade_out: number | null;
  likes_count: number;
  comments_count: number;
  created_at: string;
  user_id: string;
  profiles?: {
    username: string;
    full_name: string | null;
    avatar_url: string | null;
    sports: string[] | null;
  };
}

const VideoFeed = () => {
  const [selectedSport, setSelectedSport] = useState("All");
  const [applausedVideos, setApplausedVideos] = useState<string[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [playingMusic, setPlayingMusic] = useState<string | null>(null);
  const [musicMuted, setMusicMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const fadeIntervalRef = useRef<number | null>(null);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("posts")
        .select(`
          id,
          content,
          image_url,
          video_url,
          music_url,
          music_title,
          music_start_time,
          music_end_time,
          music_fade_in,
          music_fade_out,
          likes_count,
          comments_count,
          created_at,
          user_id,
          profiles:user_id (
            username,
            full_name,
            avatar_url,
            sports
          )
        `)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      setPosts(data || []);

      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error("Error fetching posts:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts, refreshKey]);

  const handleRefresh = useCallback(async () => {
    await fetchPosts();
    toast.success("Feed refreshed!");
  }, [fetchPosts]);

  const { containerRef, isRefreshing, pullDistance, pullProgress } = usePullToRefresh({
    onRefresh: handleRefresh,
    threshold: 80,
  });

  const handleApplause = (postId: string) => {
    if (applausedVideos.includes(postId)) {
      setApplausedVideos(applausedVideos.filter(id => id !== postId));
    } else {
      setApplausedVideos([...applausedVideos, postId]);
    }
  };

  const handlePlayMusic = (post: Post) => {
    if (!post.music_url) return;

    // Clean up previous playback
    if (fadeIntervalRef.current) {
      clearInterval(fadeIntervalRef.current);
      fadeIntervalRef.current = null;
    }

    if (playingMusic === post.id) {
      audioRef.current?.pause();
      setPlayingMusic(null);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      
      const audio = new Audio(post.music_url);
      audioRef.current = audio;
      
      // Set up Web Audio API for fade effects
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      audioContextRef.current = new AudioContext();
      const source = audioContextRef.current.createMediaElementSource(audio);
      gainNodeRef.current = audioContextRef.current.createGain();
      source.connect(gainNodeRef.current);
      gainNodeRef.current.connect(audioContextRef.current.destination);
      
      const startTime = post.music_start_time || 0;
      const endTime = post.music_end_time;
      const fadeIn = post.music_fade_in || 0;
      const fadeOut = post.music_fade_out || 0;
      
      audio.currentTime = startTime;
      
      // Apply fade in
      if (fadeIn > 0 && gainNodeRef.current) {
        gainNodeRef.current.gain.setValueAtTime(0, audioContextRef.current.currentTime);
        gainNodeRef.current.gain.linearRampToValueAtTime(
          musicMuted ? 0 : 0.5, 
          audioContextRef.current.currentTime + fadeIn
        );
      } else if (gainNodeRef.current) {
        gainNodeRef.current.gain.setValueAtTime(musicMuted ? 0 : 0.5, audioContextRef.current.currentTime);
      }
      
      audio.play();
      setPlayingMusic(post.id);
      
      // Handle end time and fade out
      if (endTime) {
        fadeIntervalRef.current = window.setInterval(() => {
          if (audio.currentTime >= endTime) {
            audio.pause();
            setPlayingMusic(null);
            if (fadeIntervalRef.current) {
              clearInterval(fadeIntervalRef.current);
              fadeIntervalRef.current = null;
            }
          } else if (fadeOut > 0 && gainNodeRef.current && audioContextRef.current) {
            const timeUntilEnd = endTime - audio.currentTime;
            if (timeUntilEnd <= fadeOut) {
              const fadeProgress = (timeUntilEnd / fadeOut) * (musicMuted ? 0 : 0.5);
              gainNodeRef.current.gain.setValueAtTime(fadeProgress, audioContextRef.current.currentTime);
            }
          }
        }, 50);
      }
      
      audio.onended = () => {
        setPlayingMusic(null);
        if (fadeIntervalRef.current) {
          clearInterval(fadeIntervalRef.current);
          fadeIntervalRef.current = null;
        }
      };
    }
  };

  const toggleMute = () => {
    const newMuted = !musicMuted;
    setMusicMuted(newMuted);
    if (gainNodeRef.current && audioContextRef.current) {
      gainNodeRef.current.gain.setValueAtTime(newMuted ? 0 : 0.5, audioContextRef.current.currentTime);
    }
  };

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (fadeIntervalRef.current) {
        clearInterval(fadeIntervalRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const filteredPosts = selectedSport === "All" 
    ? posts 
    : posts.filter(p => p.profiles?.sports?.some(s => 
        s.toLowerCase().includes(selectedSport.toLowerCase())
      ));

  return (
    <section ref={containerRef} className="relative">
      {/* Pull to refresh indicator */}
      <div 
        className="absolute left-0 right-0 flex justify-center items-center transition-all duration-200 overflow-hidden z-10"
        style={{ 
          height: pullDistance,
          top: -pullDistance,
          opacity: pullProgress,
        }}
      >
        <div 
          className={`flex items-center gap-2 text-primary ${isRefreshing ? 'animate-spin' : ''}`}
          style={{ 
            transform: `rotate(${pullProgress * 360}deg)`,
            transition: isRefreshing ? 'none' : 'transform 0.1s',
          }}
        >
          <RefreshCw className="h-6 w-6" />
        </div>
      </div>

      {/* Content wrapper with pull animation */}
      <div 
        className="transition-transform duration-200"
        style={{ 
          transform: `translateY(${pullDistance}px)`,
        }}
      >
        
        <div className="mb-6">
          <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide">
            {SPORTS_CATEGORIES.map((sport) => (
              <Button
                key={sport}
                onClick={() => setSelectedSport(sport)}
                size="sm"
                variant={selectedSport === sport ? "default" : "outline"}
                className={selectedSport === sport ? "bg-primary text-primary-foreground" : ""}
              >
                {sport}
              </Button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>No posts yet. Be the first to share!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4" key={refreshKey}>
            {filteredPosts.map((post) => (
              <div
                key={post.id}
                className="group bg-card rounded-lg overflow-hidden border border-border hover:border-primary transition-all hover:shadow-glow"
              >
                {/* Video or Image */}
                {(post.video_url || post.image_url) && (
                  <div className="relative aspect-video overflow-hidden bg-muted">
                    {post.video_url ? (
                      <AutoPlayVideo 
                        src={post.video_url} 
                        postId={post.id}
                        onDoubleTap={() => handleApplause(post.id)}
                      />
                    ) : post.image_url ? (
                      <img
                        src={post.image_url}
                        alt="Post media"
                        loading="lazy"
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      />
                    ) : null}
                  </div>
                )}

                <div className="p-4">
                  {/* Author info */}
                  <div className="flex items-center gap-3 mb-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={post.profiles?.avatar_url || undefined} />
                      <AvatarFallback>
                        {post.profiles?.username?.[0]?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {post.profiles?.full_name || post.profiles?.username || "Anonymous"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                      </p>
                    </div>
                    {post.profiles?.sports?.[0] && (
                      <Badge variant="outline" className="text-xs">
                        {post.profiles.sports[0]}
                      </Badge>
                    )}
                  </div>

                  {/* Content */}
                  {post.content && (
                    <p className="text-sm mb-3 line-clamp-3">{post.content}</p>
                  )}

                  {/* Music Player */}
                  {post.music_url && (
                    <div 
                      className={`mb-3 p-2 rounded-lg flex items-center gap-2 transition-all cursor-pointer ${
                        playingMusic === post.id 
                          ? "bg-primary/20 border border-primary/30" 
                          : "bg-muted/50 hover:bg-muted"
                      }`}
                      onClick={() => handlePlayMusic(post)}
                    >
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 rounded-full p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePlayMusic(post);
                        }}
                      >
                        {playingMusic === post.id ? (
                          <Pause className="h-4 w-4 text-primary" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                      </Button>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          <Music className="h-3 w-3 text-primary flex-shrink-0" />
                          <p className="text-xs font-medium truncate">{post.music_title}</p>
                        </div>
                        {playingMusic === post.id && (
                          <div className="flex gap-0.5 mt-1">
                            {[...Array(5)].map((_, i) => (
                              <div 
                                key={i}
                                className="w-1 bg-primary rounded-full animate-pulse"
                                style={{ 
                                  height: `${Math.random() * 12 + 4}px`,
                                  animationDelay: `${i * 0.1}s`
                                }}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                      {playingMusic === post.id && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleMute();
                          }}
                        >
                          {musicMuted ? (
                            <VolumeX className="h-4 w-4" />
                          ) : (
                            <Volume2 className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-4 pt-2 border-t border-border">
                    <button
                      onClick={() => handleApplause(post.id)}
                      className={`flex items-center gap-1 transition-colors ${
                        applausedVideos.includes(post.id)
                          ? "text-primary"
                          : "text-muted-foreground hover:text-primary"
                      }`}
                    >
                      <span className="text-lg">👏</span>
                      <span className="text-sm font-medium">
                        {post.likes_count + (applausedVideos.includes(post.id) ? 1 : 0)}
                      </span>
                    </button>

                    <button className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors">
                      <MessageSquare className="h-5 w-5" />
                      <span className="text-sm">{post.comments_count}</span>
                    </button>

                    <button className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors ml-auto">
                      <Share2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

// AutoPlay Video Component with Intersection Observer and Double-Tap to Like
const AutoPlayVideo = ({ 
  src, 
  postId, 
  onDoubleTap 
}: { 
  src: string; 
  postId: string;
  onDoubleTap?: () => void;
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [showHeart, setShowHeart] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const lastTapRef = useRef<number>(0);
  const tapTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const SPEED_OPTIONS = [0.5, 1, 1.5, 2];

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setIsVisible(entry.isIntersecting);
          if (entry.isIntersecting) {
            video.play().catch(() => {
              // Autoplay blocked, user interaction needed
            });
          } else {
            video.pause();
          }
        });
      },
      { threshold: 0.5 }
    );

    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      if (video.duration) {
        setProgress((video.currentTime / video.duration) * 100);
        setCurrentTime(video.currentTime);
      }
    };

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    
    // Set duration if already loaded
    if (video.duration) {
      setDuration(video.duration);
    }
    
    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const togglePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;
    
    if (video.paused) {
      video.play().catch(() => {});
      setIsPaused(false);
    } else {
      video.pause();
      setIsPaused(true);
    }
  };

  const handleTap = () => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;

    // Clear any pending single-tap timeout
    if (tapTimeoutRef.current) {
      clearTimeout(tapTimeoutRef.current);
      tapTimeoutRef.current = null;
    }

    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      // Double tap detected - like
      setShowHeart(true);
      onDoubleTap?.();
      setTimeout(() => setShowHeart(false), 1000);
    } else {
      // Wait to see if this becomes a double tap
      tapTimeoutRef.current = setTimeout(() => {
        togglePlayPause();
      }, DOUBLE_TAP_DELAY);
    }
    lastTapRef.current = now;
  };

  return (
    <div className="relative w-full h-full" onClick={handleTap}>
      <video
        ref={videoRef}
        src={src}
        className="w-full h-full object-cover cursor-pointer"
        loop
        muted={isMuted}
        playsInline
        preload="metadata"
      />
      
      {/* Pause indicator */}
      {isPaused && !showHeart && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 bg-black/20">
          <div className="h-16 w-16 rounded-full bg-background/80 flex items-center justify-center">
            <Play className="h-8 w-8 text-foreground ml-1" />
          </div>
        </div>
      )}
      
      {/* Heart animation on double-tap */}
      {showHeart && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
          <Heart 
            className="h-24 w-24 text-red-500 fill-red-500 animate-scale-in"
            style={{
              animation: 'heartPop 1s ease-out forwards'
            }}
          />
        </div>
      )}
      
      <div className="absolute top-3 left-3 z-10">
        <Badge className="bg-primary/90 text-primary-foreground flex items-center gap-1">
          <Play className="h-3 w-3" />
          Video
        </Badge>
      </div>
      
      {/* Control buttons container - bottom right */}
      <div className="absolute bottom-3 right-3 z-10 flex gap-2">
        <Button
          size="sm"
          variant="secondary"
          className="h-8 w-8 p-0 rounded-full bg-background/80 hover:bg-background"
          onClick={(e) => {
            e.stopPropagation();
            const container = videoRef.current?.parentElement;
            if (!container) return;
            
            if (document.fullscreenElement) {
              document.exitFullscreen();
            } else {
              container.requestFullscreen().catch(() => {});
            }
          }}
        >
          {document.fullscreenElement ? (
            <Minimize className="h-4 w-4" />
          ) : (
            <Maximize className="h-4 w-4" />
          )}
        </Button>
        <Button
          size="sm"
          variant="secondary"
          className="h-8 w-8 p-0 rounded-full bg-background/80 hover:bg-background"
          onClick={(e) => {
            e.stopPropagation();
            toggleMute();
          }}
        >
          {isMuted ? (
            <VolumeX className="h-4 w-4" />
          ) : (
            <Volume2 className="h-4 w-4" />
          )}
        </Button>
      </div>
      
      {/* Time display */}
      <div className="absolute top-3 right-3 z-10 px-2 py-1 rounded bg-background/80 text-xs font-medium text-foreground">
        {formatTime(currentTime)} / {formatTime(duration)}
      </div>
      {/* Playback speed control */}
      <Button
        size="sm"
        variant="secondary"
        className="absolute bottom-3 left-3 z-10 h-8 px-2 rounded-full bg-background/80 hover:bg-background text-xs font-medium"
        onClick={(e) => {
          e.stopPropagation();
          const currentIndex = SPEED_OPTIONS.indexOf(playbackSpeed);
          const nextIndex = (currentIndex + 1) % SPEED_OPTIONS.length;
          const newSpeed = SPEED_OPTIONS[nextIndex];
          setPlaybackSpeed(newSpeed);
          if (videoRef.current) {
            videoRef.current.playbackRate = newSpeed;
          }
        }}
      >
        {playbackSpeed}x
      </Button>
      {/* Progress bar overlay */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted/50 z-10">
        <div 
          className="h-full bg-primary transition-all duration-100 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>
      
      <style>{`
        @keyframes heartPop {
          0% {
            transform: scale(0);
            opacity: 1;
          }
          50% {
            transform: scale(1.2);
            opacity: 1;
          }
          100% {
            transform: scale(1);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default VideoFeed;
