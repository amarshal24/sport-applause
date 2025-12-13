import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import Sidebar from "@/components/Sidebar";
import FavoriteVideos from "@/components/FavoriteVideos";
import TopFiveVideos from "@/components/TopFiveVideos";
import ProfileVideoRecorder from "@/components/ProfileVideoRecorder";
import AnimatedAvatar from "@/components/AnimatedAvatar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SportIcon } from "@/components/SportIcon";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Grid3x3, Heart, Bookmark, Video, Music, Radio, Sparkles } from "lucide-react";
import { toast } from "sonner";
import PodcastUploader from "@/components/PodcastUploader";
import LiveStreamManager from "@/components/LiveStreamManager";

const Profile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showVideoRecorder, setShowVideoRecorder] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editForm, setEditForm] = useState({
    full_name: "",
    bio: "",
    username: "",
  });

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchPosts();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();
    setProfile(data);
    if (data) {
      setEditForm({
        full_name: data.full_name || "",
        bio: data.bio || "",
        username: data.username || "",
      });
    }
  };

  const handleEditProfile = () => {
    setShowEditProfile(true);
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: editForm.full_name,
        bio: editForm.bio,
        username: editForm.username,
      })
      .eq("id", user.id);

    if (error) {
      toast.error("Failed to update profile");
      return;
    }

    toast.success("Profile updated successfully");
    setShowEditProfile(false);
    fetchProfile();
  };

  const fetchPosts = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("posts")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setPosts(data || []);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <Sidebar />
        <main className="pt-20 pb-20 lg:pb-6 lg:pl-64">
          <div className="px-4 lg:px-6 py-6">
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
      
      <main className="pt-20 pb-20 lg:pb-6 lg:pl-64">
        <div className="px-4 lg:px-6 py-6 max-w-5xl mx-auto w-full">
          {/* Top 5 Highlights Section */}
          <div className="mb-8">
            <TopFiveVideos isOwnProfile={true} />
          </div>

          {/* Favorite Videos Section */}
          <div className="mb-6">
            <FavoriteVideos />
          </div>

          {/* Profile Header */}
          <div className="flex flex-col items-center py-6 space-y-4 animate-slide-up">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-power rounded-full blur-xl opacity-30 animate-pulse-glow"></div>
              <AnimatedAvatar
                videoUrl={profile?.profile_video_url}
                imageUrl={profile?.avatar_url}
                fallback={profile?.username?.[0]?.toUpperCase() || "U"}
                className="h-24 w-24 md:h-28 md:w-28 border-4 border-primary/30 shadow-glow relative z-10"
                showPlayIcon
              />
              {profile?.sports && profile.sports.length > 0 && (
                <SportIcon 
                  sportId={profile.sports[0]} 
                  className="absolute -bottom-1 -right-1 w-8 h-8 p-1.5 border-2 shadow-steel z-20"
                />
              )}
              {/* Video Upload Button */}
              <Button
                size="icon"
                variant="outline"
                className="absolute top-0 right-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-20"
                onClick={() => setShowVideoRecorder(true)}
              >
                <Video className="w-4 h-4" />
              </Button>
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
            <Button 
              variant="outline" 
              className="w-full max-w-xs hover-lift"
              onClick={handleEditProfile}
            >
              Edit Profile
            </Button>
          </div>

          {/* Tabs Section */}
          <Tabs defaultValue="posts" className="w-full">
            <TabsList className="w-full grid grid-cols-5 h-12 border-y border-border bg-transparent rounded-none glass-effect">
              <TabsTrigger value="posts" className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-glow rounded-none transition-all">
                <Grid3x3 className="h-5 w-5" />
              </TabsTrigger>
              <TabsTrigger value="podcasts" className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-glow rounded-none transition-all">
                <Music className="h-5 w-5" />
              </TabsTrigger>
              <TabsTrigger value="streams" className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-glow rounded-none transition-all">
                <Radio className="h-5 w-5" />
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
                          <Sparkles className="h-5 w-5 fill-current" />
                          <span className="font-semibold">{post.likes_count} claps</span>
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

            <TabsContent value="podcasts" className="mt-6">
              <div className="space-y-6">
                <PodcastUploader onUploadComplete={fetchPosts} />
              </div>
            </TabsContent>

            <TabsContent value="streams" className="mt-6">
              <LiveStreamManager />
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

      {/* Video Recorder Dialog */}
      <Dialog open={showVideoRecorder} onOpenChange={setShowVideoRecorder}>
        <DialogContent className="max-w-2xl p-0 bg-transparent border-none">
          <ProfileVideoRecorder
            onVideoUploaded={fetchProfile}
            onClose={() => setShowVideoRecorder(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Profile Dialog */}
      <Dialog open={showEditProfile} onOpenChange={setShowEditProfile}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={editForm.username}
                onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                placeholder="Your username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name</Label>
              <Input
                id="full_name"
                value={editForm.full_name}
                onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                placeholder="Your full name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={editForm.bio}
                onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                placeholder="Tell us about yourself..."
                rows={4}
              />
            </div>
            <div className="flex gap-2 justify-end pt-4">
              <Button variant="outline" onClick={() => setShowEditProfile(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveProfile}>
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Profile;
