import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Share2, MessageSquare, RefreshCw, Play, Music, Pause, Volume2, VolumeX, Heart, Maximize, Wand2, Bookmark, Trash2, FileText } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AnimeFilterSelector, AnimeFilterOverlay, getAnimeFilterStyle, type AnimeFilterType } from "@/components/AnimeFilters";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import FullScreenVideoModal from "@/components/FullScreenVideoModal";
import { SecureImage } from "@/components/SecureMedia";
import PostReactions from "@/components/PostReactions";
import VideoTrimModal from "@/components/VideoTrimModal";
import PostComments from "@/components/PostComments";

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
  const { user } = useAuth();
  const [selectedSport, setSelectedSport] = useState("All");
  const [applausedVideos, setApplausedVideos] = useState<string[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [playingMusic, setPlayingMusic] = useState<string | null>(null);
  const [musicMuted, setMusicMuted] = useState(false);
  const [editPost, setEditPost] = useState<Post | null>(null);
  const [savedPosts, setSavedPosts] = useState<Set<string>>(new Set());
  const [deleteConfirmPost, setDeleteConfirmPost] = useState<Post | null>(null);
  const [openCommentsPostId, setOpenCommentsPostId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
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
    } catch (error) {
      console.error("Error fetching posts:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts, refreshKey]);

  // Load this user's saved (watch later) posts
  useEffect(() => {
    if (!user) {
      setSavedPosts(new Set());
      return;
    }
    supabase
      .from("watch_later")
      .select("post_id")
      .eq("user_id", user.id)
      .then(({ data }) => {
        if (data) setSavedPosts(new Set(data.map((r: any) => r.post_id)));
      });
  }, [user, refreshKey]);

  const handleShare = async (post: Post) => {
    const url = `${window.location.origin}/?post=${post.id}`;
    const title = post.profiles?.username
      ? `Post by @${post.profiles.username} on USportz`
      : "Check out this post on USportz";
    try {
      if (navigator.share) {
        await navigator.share({ title, text: post.content?.slice(0, 120) || title, url });
        toast.success("Shared");
      } else {
        await navigator.clipboard.writeText(url);
        toast.success("Link copied to clipboard");
      }
    } catch (e: any) {
      if (e?.name === "AbortError") return;
      try {
        await navigator.clipboard.writeText(url);
        toast.success("Link copied to clipboard");
      } catch {
        toast.error("Could not share");
      }
    }
  };

  const handleToggleSave = async (postId: string) => {
    if (!user) {
      toast.error("Sign in to save videos");
      return;
    }
    const isSaved = savedPosts.has(postId);
    const next = new Set(savedPosts);
    if (isSaved) {
      next.delete(postId);
      setSavedPosts(next);
      const { error } = await supabase
        .from("watch_later")
        .delete()
        .eq("user_id", user.id)
        .eq("post_id", postId);
      if (error) {
        next.add(postId);
        setSavedPosts(new Set(next));
        toast.error("Failed to remove");
      } else {
        toast.success("Removed from Watch Later");
      }
    } else {
      next.add(postId);
      setSavedPosts(next);
      const { error } = await supabase
        .from("watch_later")
        .insert({ user_id: user.id, post_id: postId });
      if (error && !error.message?.toLowerCase().includes("duplicate")) {
        next.delete(postId);
        setSavedPosts(new Set(next));
        toast.error("Failed to save");
      } else {
        toast.success("Saved to Watch Later");
      }
    }
  };

  const handleSaveAsDraft = async (post: Post) => {
    if (!user || user.id !== post.user_id) return;
    if (!post.video_url) {
      toast.error("Only videos can be saved as drafts");
      return;
    }
    const { error } = await supabase.from("video_drafts").insert({
      user_id: user.id,
      video_url: post.video_url,
      caption: post.content || null,
      video_title: post.content?.slice(0, 80) || null,
      edit_state: {
        music_url: post.music_url,
        music_title: post.music_title,
        music_start_time: post.music_start_time,
        music_end_time: post.music_end_time,
        music_fade_in: post.music_fade_in,
        music_fade_out: post.music_fade_out,
        from_post_id: post.id,
      },
    });
    if (error) {
      toast.error("Failed to save draft");
      console.error(error);
    } else {
      toast.success("Saved to your drafts");
    }
  };

  const handleDeletePost = async (post: Post) => {
    if (!user || user.id !== post.user_id) return;
    const { error } = await supabase.from("posts").delete().eq("id", post.id);
    if (error) {
      toast.error("Failed to delete");
      console.error(error);
      return;
    }
    setPosts((prev) => prev.filter((p) => p.id !== post.id));
    setDeleteConfirmPost(null);
    toast.success("Post deleted");
  };

  const handleRefresh = useCallback(async () => {
    await fetchPosts();
    toast.success("Feed refreshed!");
  }, [fetchPosts]);

  const { containerRef, isRefreshing, pullDistance, pullProgress } = usePullToRefresh({
    onRefresh: handleRefresh,
    threshold: 80,
  });

  const handleApplause = async (postId: string) => {
    if (applausedVideos.includes(postId)) return;
    setApplausedVideos((prev) => [...prev, postId]);
    // Persist a 👏 reaction (idempotent thanks to the unique index)
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase
      .from("post_reactions")
      .insert({ post_id: postId, user_id: user.id, emoji: "👏" })
      .then(({ error }) => {
        // Unique violation just means they already reacted — that's fine
        if (error && !error.message?.toLowerCase().includes("duplicate")) {
          console.warn("Reaction failed:", error.message);
        }
      });
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
      
      const startTime = post.music_start_time || 0;
      const endTime = post.music_end_time;
      const fadeIn = post.music_fade_in || 0;
      const fadeOut = post.music_fade_out || 0;
      const targetVol = musicMuted ? 0 : 0.5;
      
      audio.currentTime = startTime;
      // Native volume only — MediaElementSource mutes cross-origin tracks without CORS.
      audio.volume = fadeIn > 0 ? 0 : targetVol;
      if (fadeIn > 0 && !musicMuted) {
        const started = performance.now();
        const ramp = () => {
          if (audioRef.current !== audio || audio.paused) return;
          const t = (performance.now() - started) / (fadeIn * 1000);
          audio.volume = Math.min(targetVol, t * targetVol);
          if (t < 1) requestAnimationFrame(ramp);
        };
        requestAnimationFrame(ramp);
      }
      
      void audio.play();
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
          } else if (fadeOut > 0 && !musicMuted) {
            const timeUntilEnd = endTime - audio.currentTime;
            if (timeUntilEnd <= fadeOut) {
              audio.volume = Math.max(0, targetVol * (timeUntilEnd / fadeOut));
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
    if (audioRef.current) {
      audioRef.current.volume = newMuted ? 0 : 0.5;
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
    };
  }, []);

  const filteredPosts = selectedSport === "All" 
    ? posts 
    : posts.filter(p => p.profiles?.sports?.some(s => 
        s.toLowerCase().includes(selectedSport.toLowerCase())
      ));

  // Explicit slide height (not h-full): % height inside overflow scroll often collapses to 0.
  const slideHeightClass =
    "h-[calc(100dvh-5rem-5rem)] lg:h-[calc(100dvh-5rem)]";

  return (
    <section
      className={`relative ${slideHeightClass} w-full max-w-lg mx-auto bg-black overflow-hidden`}
    >
      {/* Sport filters overlay */}
      <div className="absolute top-0 inset-x-0 z-30 px-3 pt-3 pointer-events-none">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide pointer-events-auto">
          {SPORTS_CATEGORIES.map((sport) => (
            <Button
              key={sport}
              onClick={() => setSelectedSport(sport)}
              size="sm"
              variant={selectedSport === sport ? "default" : "secondary"}
              className={
                selectedSport === sport
                  ? "bg-primary text-primary-foreground shrink-0 shadow-md"
                  : "bg-background/50 text-foreground backdrop-blur-md border-0 shrink-0 hover:bg-background/70"
              }
            >
              {sport}
            </Button>
          ))}
        </div>
      </div>

      {/* Pull to refresh indicator */}
      <div
        className="absolute left-0 right-0 flex justify-center items-center transition-all duration-200 overflow-hidden z-40 pointer-events-none"
        style={{
          height: pullDistance,
          top: 8,
          opacity: pullProgress,
        }}
      >
        <div
          className={`flex items-center gap-2 text-primary ${isRefreshing ? "animate-spin" : ""}`}
          style={{
            transform: `rotate(${pullProgress * 360}deg)`,
            transition: isRefreshing ? "none" : "transform 0.1s",
          }}
        >
          <RefreshCw className="h-6 w-6" />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="flex items-center justify-center h-full text-muted-foreground px-6 text-center">
          <p>No posts yet. Be the first to share!</p>
        </div>
      ) : (
        <div
          ref={containerRef}
          className="h-full overflow-y-auto overscroll-y-contain snap-y snap-mandatory scrollbar-hide"
          style={{ transform: pullDistance ? `translateY(${pullDistance}px)` : undefined }}
        >
          {filteredPosts.map((post) => (
            <article
              key={post.id}
              className={`relative ${slideHeightClass} w-full snap-start snap-always shrink-0 bg-black overflow-hidden`}
            >
              {/* Full-bleed media */}
              <div className="absolute inset-0">
                {post.video_url ? (
                  <AutoPlayVideo
                    src={post.video_url}
                    postId={post.id}
                    fill
                    onDoubleTap={() => handleApplause(post.id)}
                  />
                ) : post.image_url ? (
                  <SecureImage
                    src={post.image_url}
                    alt="Post media"
                    loading="lazy"
                    className="absolute inset-0 w-full h-full object-contain bg-black"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-card px-6">
                    <p className="text-sm text-muted-foreground text-center line-clamp-6">
                      {post.content || "Text post"}
                    </p>
                  </div>
                )}
              </div>

              {/* Bottom gradient for readability */}
              <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none z-10" />

              {/* Owner actions */}
              {user?.id === post.user_id && (
                <div className="absolute top-14 right-3 z-20 flex flex-col gap-2">
                  {post.video_url && (
                    <Button
                      size="sm"
                      variant="secondary"
                      className="h-9 w-9 p-0 rounded-full bg-background/60 backdrop-blur"
                      onClick={() => setEditPost(post)}
                      aria-label="Edit video"
                    >
                      <Wand2 className="h-4 w-4" />
                    </Button>
                  )}
                  {post.video_url && (
                    <Button
                      size="sm"
                      variant="secondary"
                      className="h-9 w-9 p-0 rounded-full bg-background/60 backdrop-blur"
                      onClick={() => handleSaveAsDraft(post)}
                      aria-label="Save as draft"
                    >
                      <FileText className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="secondary"
                    className="h-9 w-9 p-0 rounded-full bg-background/60 backdrop-blur hover:bg-destructive hover:text-destructive-foreground"
                    onClick={() => setDeleteConfirmPost(post)}
                    aria-label="Delete post"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}

              {/* Right engagement rail */}
              <div className="absolute right-3 bottom-36 z-20 flex flex-col items-center gap-4">
                <button
                  type="button"
                  onClick={() => setOpenCommentsPostId((id) => (id === post.id ? null : post.id))}
                  className="flex flex-col items-center gap-1 text-white drop-shadow-md"
                  aria-label="Comments"
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-background/40 backdrop-blur">
                    <MessageSquare className="h-5 w-5" />
                  </span>
                  <span className="text-xs font-medium">{post.comments_count ?? 0}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleToggleSave(post.id)}
                  className={`flex flex-col items-center gap-1 drop-shadow-md ${
                    savedPosts.has(post.id) ? "text-primary" : "text-white"
                  }`}
                  aria-label={savedPosts.has(post.id) ? "Remove from Watch Later" : "Save to Watch Later"}
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-background/40 backdrop-blur">
                    <Bookmark className={`h-5 w-5 ${savedPosts.has(post.id) ? "fill-current" : ""}`} />
                  </span>
                  <span className="text-xs font-medium">Save</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleShare(post)}
                  className="flex flex-col items-center gap-1 text-white drop-shadow-md"
                  aria-label="Share post"
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-background/40 backdrop-blur">
                    <Share2 className="h-5 w-5" />
                  </span>
                  <span className="text-xs font-medium">Share</span>
                </button>
              </div>

              {/* Bottom caption / meta */}
              <div className="absolute left-3 right-16 bottom-4 z-20 space-y-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 border-2 border-white/30">
                    <AvatarImage src={post.profiles?.avatar_url || undefined} />
                    <AvatarFallback>
                      {post.profiles?.username?.[0]?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm text-white truncate drop-shadow">
                      {post.profiles?.full_name || post.profiles?.username || "Anonymous"}
                    </p>
                    <p className="text-xs text-white/70">
                      {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                      {post.profiles?.sports?.[0] ? ` · ${post.profiles.sports[0]}` : ""}
                    </p>
                  </div>
                </div>

                {post.content && (
                  <p className="text-sm text-white/95 line-clamp-3 drop-shadow">{post.content}</p>
                )}

                {post.music_url && (
                  <button
                    type="button"
                    className={`w-full max-w-xs p-2 rounded-lg flex items-center gap-2 text-left transition-all ${
                      playingMusic === post.id
                        ? "bg-primary/30 border border-primary/40"
                        : "bg-white/10 backdrop-blur hover:bg-white/15"
                    }`}
                    onClick={() => handlePlayMusic(post)}
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-background/40">
                      {playingMusic === post.id ? (
                        <Pause className="h-4 w-4 text-primary" />
                      ) : (
                        <Play className="h-4 w-4 text-white" />
                      )}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <Music className="h-3 w-3 text-primary flex-shrink-0" />
                        <p className="text-xs font-medium text-white truncate">{post.music_title}</p>
                      </div>
                    </div>
                    {playingMusic === post.id && (
                      <span
                        role="button"
                        tabIndex={0}
                        className="h-8 w-8 flex items-center justify-center"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleMute();
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.stopPropagation();
                            toggleMute();
                          }
                        }}
                      >
                        {musicMuted ? (
                          <VolumeX className="h-4 w-4 text-white" />
                        ) : (
                          <Volume2 className="h-4 w-4 text-white" />
                        )}
                      </span>
                    )}
                  </button>
                )}

                <div className="[&_button]:border-white/20 [&_button]:bg-background/30 [&_button]:text-white [&_button]:backdrop-blur">
                  <PostReactions
                    postId={post.id}
                    legacyLikesCount={post.likes_count}
                    compact
                  />
                </div>

                {openCommentsPostId === post.id && (
                  <div className="max-h-[40vh] overflow-y-auto rounded-xl bg-background/90 backdrop-blur-md border border-border p-1">
                    <PostComments
                      postId={post.id}
                      open
                      onCountChange={(delta) => {
                        setPosts((prev) =>
                          prev.map((p) =>
                            p.id === post.id
                              ? { ...p, comments_count: Math.max(0, (p.comments_count ?? 0) + delta) }
                              : p,
                          ),
                        );
                      }}
                    />
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Filters & Animations editor for owner's video posts */}
      {editPost && editPost.video_url && (
        <VideoTrimModal
          open={!!editPost}
          onOpenChange={(open) => {
            if (!open) setEditPost(null);
          }}
          videoUrl={editPost.video_url}
          videoTitle={editPost.content?.slice(0, 80) || "Video post"}
          videoDescription={editPost.content || undefined}
          onRepostSuccess={() => {
            setEditPost(null);
            fetchPosts();
            toast.success("Posted edited version to your feed!");
          }}
        />
      )}

      <AlertDialog
        open={!!deleteConfirmPost}
        onOpenChange={(open) => !open && setDeleteConfirmPost(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this post?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove your post from the feed. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteConfirmPost && handleDeletePost(deleteConfirmPost)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
};

// AutoPlay Video Component with Intersection Observer and Double-Tap to Like
const AutoPlayVideo = ({
  src,
  postId,
  onDoubleTap,
  fill = false,
}: {
  src: string;
  postId: string;
  onDoubleTap?: () => void;
  fill?: boolean;
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [showHeart, setShowHeart] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [animeFilter, setAnimeFilter] = useState<AnimeFilterType>("none");
  const [filterIntensity, setFilterIntensity] = useState(100);
  const [fullscreenOpen, setFullscreenOpen] = useState(false);
  const [resolvedSrc, setResolvedSrc] = useState<string | undefined>(undefined);
  // Default portrait; updated from video metadata so landscape isn't letterboxed into 9:16
  const [aspectRatio, setAspectRatio] = useState("9 / 16");
  const lastTapRef = useRef<number>(0);
  const tapTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let alive = true;
    setAspectRatio("9 / 16");
    import("@/lib/signedMedia").then(({ toSignedUrl }) => {
      toSignedUrl(src).then((u) => { if (alive) setResolvedSrc(u || undefined); });
    });
    return () => { alive = false; };
  }, [src]);

  const SPEED_OPTIONS = [0.5, 1, 1.5, 2];

  // Load user's saved filter preferences
  useEffect(() => {
    const loadFilterPreferences = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("anime_filter_preference, anime_filter_intensity")
          .eq("id", user.id)
          .single();

        if (profile) {
          if (profile.anime_filter_preference) {
            setAnimeFilter(profile.anime_filter_preference as AnimeFilterType);
          }
          if (profile.anime_filter_intensity !== null) {
            setFilterIntensity(profile.anime_filter_intensity);
          }
        }
      }
    };

    loadFilterPreferences();
  }, []);

  // Save filter preference when changed
  const handleFilterChange = async (filter: AnimeFilterType) => {
    setAnimeFilter(filter);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from("profiles")
        .update({ anime_filter_preference: filter })
        .eq("id", user.id);
    }
  };

  // Save intensity preference when changed
  const handleIntensityChange = async (intensity: number) => {
    setFilterIntensity(intensity);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from("profiles")
        .update({ anime_filter_intensity: intensity })
        .eq("id", user.id);
    }
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
            video.play().catch(() => {
              // Autoplay blocked, user interaction needed
            });
            setIsPaused(false);
          } else {
            video.pause();
          }
        });
      },
      { threshold: [0.6, 0.75] }
    );

    observer.observe(video);
    return () => observer.disconnect();
  }, [resolvedSrc]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      if (video.duration) {
        setProgress((video.currentTime / video.duration) * 100);
        setCurrentTime(video.currentTime);
      }
    };

    const applyAspectFromVideo = () => {
      setDuration(video.duration);
      const vw = video.videoWidth;
      const vh = video.videoHeight;
      if (vw > 0 && vh > 0) {
        const ratio = vw / vh;
        const min = 9 / 16;
        const max = 16 / 9;
        const clamped = Math.min(max, Math.max(min, ratio));
        setAspectRatio(String(clamped));
      }
    };

    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("loadedmetadata", applyAspectFromVideo);

    if (video.duration) {
      applyAspectFromVideo();
    }

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("loadedmetadata", applyAspectFromVideo);
    };
  }, [resolvedSrc]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
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

    if (tapTimeoutRef.current) {
      clearTimeout(tapTimeoutRef.current);
      tapTimeoutRef.current = null;
    }

    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      setShowHeart(true);
      onDoubleTap?.();
      setTimeout(() => setShowHeart(false), 1000);
    } else {
      tapTimeoutRef.current = setTimeout(() => {
        togglePlayPause();
      }, DOUBLE_TAP_DELAY);
    }
    lastTapRef.current = now;
  };

  return (
    <div
      className={fill ? "absolute inset-0 w-full h-full" : "relative w-full"}
      style={fill ? undefined : { aspectRatio }}
      onClick={handleTap}
    >
      <video
        ref={videoRef}
        src={resolvedSrc}
        className="absolute inset-0 w-full h-full object-contain cursor-pointer bg-black"
        style={getAnimeFilterStyle(animeFilter, filterIntensity)}
        loop
        muted={isMuted}
        playsInline
        preload={fill ? "auto" : "metadata"}
      />

      <AnimeFilterOverlay type={animeFilter} intensity={filterIntensity} />

      {isPaused && !showHeart && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 bg-black/20">
          <div className="h-16 w-16 rounded-full bg-background/80 flex items-center justify-center">
            <Play className="h-8 w-8 text-foreground ml-1" />
          </div>
        </div>
      )}

      {showHeart && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
          <Heart
            className="h-24 w-24 text-red-500 fill-red-500"
            style={{ animation: "heartPop 1s ease-out forwards" }}
          />
        </div>
      )}

      {!fill && (
        <div className="absolute top-3 left-3 z-10">
          <Badge className="bg-primary/90 text-primary-foreground flex items-center gap-1">
            <Play className="h-3 w-3" />
            Video
          </Badge>
        </div>
      )}

      <div className={`absolute z-10 flex gap-2 ${fill ? "top-14 left-3" : "bottom-3 right-3"}`}>
        {!fill && (
          <Button
            size="sm"
            variant="secondary"
            className="h-8 w-8 p-0 rounded-full bg-background/80 hover:bg-background"
            onClick={(e) => {
              e.stopPropagation();
              setFullscreenOpen(true);
            }}
            aria-label="Open fullscreen"
          >
            <Maximize className="h-4 w-4" />
          </Button>
        )}
        <Button
          size="sm"
          variant="secondary"
          className="h-8 w-8 p-0 rounded-full bg-background/80 hover:bg-background"
          onClick={(e) => {
            e.stopPropagation();
            toggleMute();
          }}
        >
          {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </Button>
        {fill && (
          <>
            <Button
              size="sm"
              variant="secondary"
              className="h-8 px-2 rounded-full bg-background/80 hover:bg-background text-xs font-medium"
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
            <AnimeFilterSelector
              selectedFilter={animeFilter}
              onFilterChange={handleFilterChange}
              intensity={filterIntensity}
              onIntensityChange={handleIntensityChange}
            />
          </>
        )}
      </div>

      {!fill && (
        <div className="absolute top-3 right-3 z-10 px-2 py-1 rounded bg-background/80 text-xs font-medium text-foreground">
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>
      )}

      {!fill && (
        <div className="absolute bottom-3 left-3 z-10 flex gap-2">
          <Button
            size="sm"
            variant="secondary"
            className="h-8 px-2 rounded-full bg-background/80 hover:bg-background text-xs font-medium"
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

          <AnimeFilterSelector
            selectedFilter={animeFilter}
            onFilterChange={handleFilterChange}
            intensity={filterIntensity}
            onIntensityChange={handleIntensityChange}
          />
        </div>
      )}

      <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted/50 z-10">
        <div
          className="h-full bg-primary transition-all duration-100 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>

      <style>{`
        @keyframes heartPop {
          0% { transform: scale(0); opacity: 1; }
          50% { transform: scale(1.2); opacity: 1; }
          100% { transform: scale(1); opacity: 0; }
        }
      `}</style>

      {!fill && (
        <FullScreenVideoModal
          src={resolvedSrc || src}
          open={fullscreenOpen}
          onClose={() => setFullscreenOpen(false)}
        />
      )}
    </div>
  );
};

export default VideoFeed;
