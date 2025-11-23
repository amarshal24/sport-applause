import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import Sidebar from "@/components/Sidebar";
import FavoriteVideos from "@/components/FavoriteVideos";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SportIcon } from "@/components/SportIcon";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Grid3x3, Heart, Bookmark } from "lucide-react";

const Profile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      // Fetch profile
      supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single()
        .then(({ data }) => {
          setProfile(data);
        });

      // Fetch user posts
      supabase
        .from("posts")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .then(({ data }) => {
          setPosts(data || []);
          setLoading(false);
        });
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <Sidebar />
        <main className="pt-20 lg:pl-64">
          <div className="max-w-5xl mx-auto px-4 py-6">
            <div className="animate-pulse">Loading...</div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <Sidebar />
      
      <main className="pt-20 lg:pl-64">
        <div className="max-w-3xl mx-auto px-4 pb-6">
          {/* Favorite Videos Section */}
          <div className="mb-6">
            <FavoriteVideos />
          </div>

          {/* Profile Header */}
          <div className="flex flex-col items-center py-6 space-y-4 animate-slide-up">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-power rounded-full blur-xl opacity-30 animate-pulse-glow"></div>
              <Avatar className="h-24 w-24 md:h-28 md:w-28 border-4 border-primary/30 shadow-glow relative z-10">
                <AvatarImage src={profile?.avatar_url} />
                <AvatarFallback className="text-3xl font-display">
                  {profile?.username?.[0]?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              {profile?.sports && profile.sports.length > 0 && (
                <SportIcon 
                  sportId={profile.sports[0]} 
                  className="absolute -bottom-1 -right-1 w-8 h-8 p-1.5 border-2 shadow-steel"
                />
              )}
            </div>

            <div className="text-center space-y-1">
              <h1 className="text-2xl font-display font-bold text-foreground">
                {profile?.username}
              </h1>
              {profile?.full_name && (
                <p className="text-sm text-muted-foreground">
                  {profile.full_name}
                </p>
              )}
            </div>

            {/* Stats Row */}
            <div className="flex items-center gap-6 py-2">
              <div className="text-center">
                <div className="text-xl font-bold text-foreground">{posts.length}</div>
                <div className="text-xs text-muted-foreground">Posts</div>
              </div>
              <div className="h-4 w-px bg-border" />
              <div className="text-center">
                <div className="text-xl font-bold text-foreground">0</div>
                <div className="text-xs text-muted-foreground">Followers</div>
              </div>
              <div className="h-4 w-px bg-border" />
              <div className="text-center">
                <div className="text-xl font-bold text-foreground">0</div>
                <div className="text-xs text-muted-foreground">Following</div>
              </div>
            </div>

            {/* Bio */}
            {profile?.bio && (
              <p className="text-sm text-foreground text-center max-w-md px-4">
                {profile.bio}
              </p>
            )}

            {/* Edit Profile Button */}
            <Button variant="outline" className="w-full max-w-xs hover-lift">
              Edit Profile
            </Button>
          </div>

          {/* Tabs Section */}
          <Tabs defaultValue="posts" className="w-full">
            <TabsList className="w-full grid grid-cols-3 h-12 border-y border-border bg-transparent rounded-none glass-effect">
              <TabsTrigger value="posts" className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-glow rounded-none transition-all">
                <Grid3x3 className="h-5 w-5" />
              </TabsTrigger>
              <TabsTrigger value="liked" className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-glow rounded-none transition-all">
                <Heart className="h-5 w-5" />
              </TabsTrigger>
              <TabsTrigger value="saved" className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-glow rounded-none transition-all">
                <Bookmark className="h-5 w-5" />
              </TabsTrigger>
            </TabsList>

            <TabsContent value="posts" className="mt-0">
              {posts.length > 0 ? (
                <div className="grid grid-cols-3 gap-1">
                  {posts.map((post) => (
                    <div 
                      key={post.id}
                      className="aspect-square bg-muted/30 relative overflow-hidden group cursor-pointer"
                    >
                      {post.image_url ? (
                        <img 
                          src={post.image_url} 
                          alt="Post" 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-muted/50">
                          <p className="text-xs text-muted-foreground p-2 text-center line-clamp-3">
                            {post.content}
                          </p>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="flex items-center gap-4 text-foreground">
                          <div className="flex items-center gap-1">
                            <Heart className="h-5 w-5 fill-current" />
                            <span className="font-semibold">{post.likes_count}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <Grid3x3 className="h-16 w-16 text-muted-foreground/30 mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">No posts yet</h3>
                  <p className="text-sm text-muted-foreground">When you share posts, they'll appear here</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="liked" className="mt-0">
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Heart className="h-16 w-16 text-muted-foreground/30 mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No liked posts</h3>
                <p className="text-sm text-muted-foreground">Posts you like will appear here</p>
              </div>
            </TabsContent>

            <TabsContent value="saved" className="mt-0">
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Bookmark className="h-16 w-16 text-muted-foreground/30 mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No saved posts</h3>
                <p className="text-sm text-muted-foreground">Posts you save will appear here</p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default Profile;
