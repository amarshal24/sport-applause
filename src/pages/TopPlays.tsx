import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import MobileNav from "@/components/MobileNav";
import Sidebar from "@/components/Sidebar";
import FullScreenVideoModal from "@/components/FullScreenVideoModal";
import { SecureImage, SecureVideo } from "@/components/SecureMedia";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { toSignedUrl } from "@/lib/signedMedia";
import { Trophy, Play, Eye, Heart, Loader2 } from "lucide-react";

/** Force browsers to paint the first frame instead of a black box. */
function videoPreviewSrc(url: string) {
  if (!url) return url;
  const base = url.split("#")[0];
  return `${base}#t=0.1`;
}

interface TopPlay {
  id: string;
  title: string;
  video_url: string;
  thumbnail_url: string | null;
  views_count: number;
  likes_count?: number;
  user_id: string;
  source: "highlight" | "post";
  profiles?: {
    username: string | null;
    full_name: string | null;
    avatar_url: string | null;
    sports: string[] | null;
  } | null;
}

const TopPlays = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [plays, setPlays] = useState<TopPlay[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeVideo, setActiveVideo] = useState<string | null>(null);
  const [activeCaption, setActiveCaption] = useState<string | undefined>(undefined);

  const fetchTopPlays = useCallback(async () => {
    setLoading(true);
    try {
      const [{ data: highlights, error: highlightsError }, { data: posts, error: postsError }] =
        await Promise.all([
          supabase
            .from("top_five_videos")
            .select(
              `
              id,
              title,
              video_url,
              thumbnail_url,
              views_count,
              user_id,
              profiles:user_id (
                username,
                full_name,
                avatar_url,
                sports
              )
            `,
            )
            .order("views_count", { ascending: false })
            .limit(24),
          supabase
            .from("posts")
            .select(
              `
              id,
              content,
              video_url,
              image_url,
              likes_count,
              user_id,
              profiles:user_id (
                username,
                full_name,
                avatar_url,
                sports
              )
            `,
            )
            .not("video_url", "is", null)
            .order("likes_count", { ascending: false })
            .limit(24),
        ]);

      if (highlightsError) throw highlightsError;
      if (postsError) throw postsError;

      const highlightPlays: TopPlay[] = (highlights || []).map((h) => ({
        id: `highlight-${h.id}`,
        title: h.title,
        video_url: h.video_url,
        thumbnail_url: h.thumbnail_url,
        views_count: h.views_count,
        user_id: h.user_id,
        source: "highlight" as const,
        profiles: h.profiles as TopPlay["profiles"],
      }));

      const postPlays: TopPlay[] = (posts || [])
        .filter((p) => typeof p.video_url === "string" && p.video_url.trim().length > 0)
        .map((p) => ({
          id: `post-${p.id}`,
          title: p.content?.trim() || "Community play",
          video_url: p.video_url as string,
          thumbnail_url: p.image_url,
          views_count: 0,
          likes_count: p.likes_count,
          user_id: p.user_id,
          source: "post" as const,
          profiles: p.profiles as TopPlay["profiles"],
        }));

      // Prefer curated Top 5 highlights; fill remaining slots with liked video posts
      const seenUrls = new Set(highlightPlays.map((p) => p.video_url));
      const merged = [
        ...highlightPlays,
        ...postPlays.filter((p) => !seenUrls.has(p.video_url)),
      ].slice(0, 24);

      setPlays(merged);
    } catch (error) {
      console.error("Error fetching top plays:", error);
      setPlays([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTopPlays();
  }, [fetchTopPlays]);

  const handlePlay = async (play: TopPlay) => {
    const signed = await toSignedUrl(play.video_url);
    setActiveVideo(signed || play.video_url);
    setActiveCaption(play.title || undefined);

    if (play.source === "highlight") {
      const realId = play.id.replace("highlight-", "");
      await supabase
        .from("top_five_videos")
        .update({ views_count: play.views_count + 1 })
        .eq("id", realId);
      setPlays((prev) =>
        prev.map((p) =>
          p.id === play.id ? { ...p, views_count: p.views_count + 1 } : p,
        ),
      );
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <Sidebar />
      <MobileNav />

      <main className="pt-20 pb-24 md:pb-8 lg:pl-64 px-4 lg:px-6">
        <div className="py-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 rounded-xl bg-victory-gold/10">
              <Trophy className="h-8 w-8 text-victory-gold" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                {t("sidebar.topPlays")}
              </h1>
              <p className="text-muted-foreground">
                The best plays and highlights from the community
              </p>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-24 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : plays.length === 0 ? (
            <div className="text-center py-16">
              <Trophy className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-muted-foreground">
                No top plays yet. Add highlights to your profile Top 5 or post a video to the feed.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {plays.map((play, index) => {
                const username =
                  play.profiles?.username ||
                  play.profiles?.full_name ||
                  "Athlete";
                const initial = username.charAt(0).toUpperCase();

                return (
                  <div
                    key={play.id}
                    className="group relative aspect-[9/16] rounded-xl overflow-hidden bg-muted cursor-pointer ring-1 ring-border hover:ring-victory-gold/60 transition-all"
                    onClick={() => handlePlay(play)}
                  >
                    <div className="absolute top-2 left-2 z-10 w-7 h-7 rounded-full bg-victory-gold text-background flex items-center justify-center text-xs font-bold shadow">
                      {index + 1}
                    </div>

                    {play.thumbnail_url ? (
                      <SecureImage
                        src={play.thumbnail_url}
                        alt={play.title}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    ) : (
                      <SecureVideo
                        src={videoPreviewSrc(play.video_url)}
                        muted
                        playsInline
                        preload="metadata"
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center shadow-lg opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all">
                        <Play className="w-6 h-6 text-black fill-black" />
                      </div>
                    </div>

                    <div className="absolute bottom-0 left-0 right-0 p-3 space-y-2">
                      <p className="text-white text-sm font-medium line-clamp-2">
                        {play.title}
                      </p>
                      <div className="flex items-center justify-between gap-2">
                        <button
                          type="button"
                          className="flex items-center gap-2 min-w-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/athlete/${play.user_id}`);
                          }}
                        >
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={play.profiles?.avatar_url || undefined} />
                            <AvatarFallback className="text-[10px]">{initial}</AvatarFallback>
                          </Avatar>
                          <span className="text-white/80 text-xs truncate">
                            @{username}
                          </span>
                        </button>
                        <span className="flex items-center gap-1 text-white/70 text-xs shrink-0">
                          {play.source === "highlight" ? (
                            <>
                              <Eye className="w-3 h-3" />
                              {play.views_count}
                            </>
                          ) : (
                            <>
                              <Heart className="w-3 h-3" />
                              {play.likes_count ?? 0}
                            </>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <FullScreenVideoModal
        src={activeVideo || ""}
        caption={activeCaption}
        open={!!activeVideo}
        onClose={() => {
          setActiveVideo(null);
          setActiveCaption(undefined);
        }}
      />
    </div>
  );
};

export default TopPlays;
