import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Star, Heart, Play } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface FavoritePost {
  id: string;
  content: string;
  image_url: string | null;
  likes_count: number;
  created_at: string;
}

const FavoriteVideos = () => {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<FavoritePost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchFavorites();
    }
  }, [user]);

  const fetchFavorites = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("favorites")
      .select(`
        post_id,
        posts (
          id,
          content,
          image_url,
          likes_count,
          created_at
        )
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5);

    if (error) {
      console.error("Error fetching favorites:", error);
      setLoading(false);
      return;
    }

    // Transform the data to flatten the posts object
    const favoritePosts = data
      ?.map((fav: any) => fav.posts)
      .filter(Boolean) as FavoritePost[];
    
    setFavorites(favoritePosts || []);
    setLoading(false);
  };

  if (loading) {
    return (
      <Card className="glass-effect animate-fade-in">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display">
            <Star className="w-5 h-5 text-primary fill-primary" />
            Top 5 Favorite Highlights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-muted/30 rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (favorites.length === 0) {
    return (
      <Card className="glass-effect animate-fade-in">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display">
            <Star className="w-5 h-5 text-primary fill-primary" />
            Top 5 Favorite Highlights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Star className="w-12 h-12 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">
              No favorite highlights yet. Start favoriting amazing plays!
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-effect animate-fade-in">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-display">
          <Star className="w-5 h-5 text-primary fill-primary" />
          Top 5 Favorite Highlights
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {favorites.map((post, index) => (
            <div
              key={post.id}
              className="group relative flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-all duration-300 cursor-pointer hover-lift"
            >
              {/* Rank Badge */}
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center font-bold text-white text-sm">
                {index + 1}
              </div>

              {/* Thumbnail or Content */}
              <div className="relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-muted">
                {post.image_url ? (
                  <>
                    <img
                      src={post.image_url}
                      alt="Highlight"
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-background/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Play className="w-6 h-6 text-white" />
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Play className="w-6 h-6 text-muted-foreground" />
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground line-clamp-2">
                  {post.content}
                </p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Heart className="w-3 h-3 fill-current" />
                    {post.likes_count}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default FavoriteVideos;
