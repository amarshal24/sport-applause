import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import AthleteSearch from "@/components/AthleteSearch";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search as SearchIcon, Users, Video, Mic, Hash, Play, Eye, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SecureImage } from "@/components/SecureMedia";
import { searchOr, searchPattern } from "@/lib/searchSafety";
import { useDebouncedSearch } from "@/hooks/useDebouncedSearch";

interface VideoResult {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  sport: string;
  views_count: number;
  user_id: string;
  created_at: string;
}

interface PodcastResult {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  duration: number | null;
  plays_count: number;
  user_id: string;
  created_at: string;
}

const Search = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  const [videoQuery, setVideoQuery] = useState("");
  const [podcastQuery, setPodcastQuery] = useState("");
  const [tagQuery, setTagQuery] = useState("");
  
  const videos = useDebouncedSearch<VideoResult>(videoQuery, async (query, signal) => {
    const { data, error } = await supabase.from('recruiting_videos')
      .select('id, title, description, thumbnail_url, sport, views_count, user_id, created_at')
      .eq('status', 'active').or(searchOr(['title', 'description', 'sport'], query))
      .order('views_count', { ascending: false }).limit(20).abortSignal(signal);
    if (error) throw error; return data || [];
  });
  const podcasts = useDebouncedSearch<PodcastResult>(podcastQuery, async (query, signal) => {
    const { data, error } = await supabase.from('podcasts')
      .select('id, title, description, thumbnail_url, duration, plays_count, user_id, created_at')
      .or(searchOr(['title', 'description'], query)).order('plays_count', { ascending: false }).limit(20).abortSignal(signal);
    if (error) throw error; return data || [];
  });
  const tags = useDebouncedSearch<VideoResult>(tagQuery, async (query, signal) => {
    const { data, error } = await supabase.from('recruiting_videos')
      .select('id, title, description, thumbnail_url, sport, views_count, user_id, created_at')
      .eq('status', 'active').ilike('sport', searchPattern(query))
      .order('views_count', { ascending: false }).limit(20).abortSignal(signal);
    if (error) throw error; return data || [];
  });
  const { results: videoResults, loading: videoLoading } = videos;
  const { results: podcastResults, loading: podcastLoading } = podcasts;
  const { results: tagResults, loading: tagLoading } = tags;

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const VideoCard = ({ video }: { video: VideoResult }) => (
    <Card 
      className="cursor-pointer hover:bg-muted/50 transition-colors"
      onClick={() => navigate(`/athlete/${video.user_id}`)}
    >
      <CardContent className="p-3 flex gap-3">
        <div className="relative w-32 h-20 flex-shrink-0 rounded-md overflow-hidden bg-muted">
          {video.thumbnail_url ? (
            <SecureImage src={video.thumbnail_url} alt={video.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Play className="h-8 w-8 text-muted-foreground" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-sm line-clamp-2">{video.title}</h3>
          <Badge variant="secondary" className="mt-1 text-xs">{video.sport}</Badge>
          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              {video.views_count}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const PodcastCard = ({ podcast }: { podcast: PodcastResult }) => (
    <Card 
      className="cursor-pointer hover:bg-muted/50 transition-colors"
      onClick={() => navigate(`/podcasts?id=${podcast.id}`)}
    >
      <CardContent className="p-3 flex gap-3">
        <div className="relative w-16 h-16 flex-shrink-0 rounded-md overflow-hidden bg-muted">
          {podcast.thumbnail_url ? (
            <SecureImage src={podcast.thumbnail_url} alt={podcast.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Mic className="h-6 w-6 text-muted-foreground" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-sm line-clamp-2">{podcast.title}</h3>
          {podcast.description && (
            <p className="text-xs text-muted-foreground line-clamp-1 mt-1">{podcast.description}</p>
          )}
          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatDuration(podcast.duration)}
            </span>
            <span className="flex items-center gap-1">
              <Play className="h-3 w-3" />
              {podcast.plays_count} plays
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const LoadingState = () => (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="animate-pulse h-20 bg-muted/50 rounded-lg" />
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 pt-20 pb-24">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-display font-bold mb-2">Search</h1>
          <p className="text-muted-foreground mb-8">Find athletes, videos, podcasts, and more</p>

          <Tabs defaultValue="athletes" className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-6">
              <TabsTrigger value="athletes" aria-label="Athletes" className="gap-2">
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Athletes</span>
              </TabsTrigger>
              <TabsTrigger value="videos" aria-label="Videos" className="gap-2">
                <Video className="h-4 w-4" />
                <span className="hidden sm:inline">Videos</span>
              </TabsTrigger>
              <TabsTrigger value="podcasts" aria-label="Podcasts" className="gap-2">
                <Mic className="h-4 w-4" />
                <span className="hidden sm:inline">Podcasts</span>
              </TabsTrigger>
              <TabsTrigger value="tags" aria-label="Sports" className="gap-2">
                <Hash className="h-4 w-4" />
                <span className="hidden sm:inline">Sports</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="athletes" className="space-y-4">
              <AthleteSearch 
                placeholder="Search athletes by name or username..."
                className="w-full"
              />
              <p className="text-sm text-muted-foreground text-center mt-8">
                Search for athletes to view their profiles and recruiting videos
              </p>
            </TabsContent>

            <TabsContent value="videos" className="space-y-4">
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search recruiting videos by title, description, or sport..."
                  maxLength={200}
                  aria-label="Search videos"
                  value={videoQuery}
                  onChange={(e) => setVideoQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              {videos.error ? <p role="alert" className="text-destructive">{videos.error}</p> : videoLoading ? (
                <LoadingState />
              ) : videoResults.length > 0 ? (
                <div className="space-y-3">
                  {videoResults.map((video) => (
                    <VideoCard key={video.id} video={video} />
                  ))}
                </div>
              ) : videoQuery ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No videos found for "{videoQuery}"
                </p>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Search recruiting videos, highlights, and top plays
                </p>
              )}
            </TabsContent>

            <TabsContent value="podcasts" className="space-y-4">
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search podcasts by title or description..."
                  maxLength={200}
                  aria-label="Search podcasts"
                  value={podcastQuery}
                  onChange={(e) => setPodcastQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              {podcasts.error ? <p role="alert" className="text-destructive">{podcasts.error}</p> : podcastLoading ? (
                <LoadingState />
              ) : podcastResults.length > 0 ? (
                <div className="space-y-3">
                  {podcastResults.map((podcast) => (
                    <PodcastCard key={podcast.id} podcast={podcast} />
                  ))}
                </div>
              ) : podcastQuery ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No podcasts found for "{podcastQuery}"
                </p>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Discover sports podcasts and audio content
                </p>
              )}
            </TabsContent>

            <TabsContent value="tags" className="space-y-4">
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by sport (e.g., basketball, football, soccer)..."
                  maxLength={200}
                  aria-label="Search tags"
                  value={tagQuery}
                  onChange={(e) => setTagQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              {tags.error ? <p role="alert" className="text-destructive">{tags.error}</p> : tagLoading ? (
                <LoadingState />
              ) : tagResults.length > 0 ? (
                <div className="space-y-3">
                  {tagResults.map((video) => (
                    <VideoCard key={video.id} video={video} />
                  ))}
                </div>
              ) : tagQuery ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No videos found for sport "{tagQuery}"
                </p>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Browse content by sport category
                </p>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default Search;
