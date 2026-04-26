import { useEffect, useState, lazy, Suspense } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import Sidebar from "@/components/Sidebar";
import MobileNav from "@/components/MobileNav";
import FavoriteVideos from "@/components/FavoriteVideos";
import TopFiveVideos from "@/components/TopFiveVideos";
import ProfileVideoRecorder from "@/components/ProfileVideoRecorder";
import AnimatedAvatar from "@/components/AnimatedAvatar";
import { SportIcon } from "@/components/SportIcon";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Grid3x3, Heart, Bookmark, Video, Music, Radio, Sparkles, Edit, Camera, Clock } from "lucide-react";
import UnifiedComposer from "@/components/UnifiedComposer";
import WatchLaterVideos from "@/components/WatchLaterVideos";
import { toast } from "sonner";

// Lazy load heavy tab components
const PodcastUploader = lazy(() => import("@/components/PodcastUploader"));
const LiveStreamManager = lazy(() => import("@/components/LiveStreamManager"));

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
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    
    const [profileResult, postsResult] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
      supabase.from("posts").select("*").eq("user_id", user.id).order("created_at", { ascending: false })
    ]);
    
    if (profileResult.data) {
      setProfile(profileResult.data);
      setEditForm({
        full_name: profileResult.data.full_name || "",
        bio: profileResult.data.bio || "",
        username: profileResult.data.username || "",
      });
    }
    
    setPosts(postsResult.data || []);
    setLoading(false);
  };

  const fetchProfile = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <Sidebar />
        <MobileNav />
        <main className="pt-20 pb-20 lg:pb-6 lg:pl-64">
          <div className="px-4 lg:px-6 py-6">
            <div className="animate-pulse space-y-4">
              <div className="h-32 bg-muted/30 rounded-xl" />
              <div className="h-48 bg-muted/30 rounded-xl" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <Sidebar />
      <MobileNav />
      
      <main className="pt-20 pb-20 lg:pb-6 lg:pl-64">
        <div className="px-4 lg:px-6 py-4 max-w-4xl mx-auto w-full space-y-6">
          
          {/* Profile Header Card */}
          <Card className="glass-effect border-border/50 overflow-hidden">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                {/* Avatar Section */}
                <div className="relative group shrink-0">
                  <div className="absolute inset-0 bg-gradient-power rounded-full blur-xl opacity-30 animate-pulse-glow"></div>
                  <AnimatedAvatar
                    videoUrl={profile?.profile_video_url}
                    imageUrl={profile?.avatar_url}
                    fallback={profile?.username?.[0]?.toUpperCase() || "U"}
                    className="h-24 w-24 border-4 border-primary/30 shadow-glow relative z-10"
                    showPlayIcon
                  />
                  {profile?.sports && profile.sports.length > 0 && (
                    <SportIcon 
                      sportId={profile.sports[0]} 
                      className="absolute -bottom-1 -right-1 w-7 h-7 p-1 border-2 shadow-steel z-20"
                    />
                  )}
                  <Button
                    size="icon"
                    variant="secondary"
                    className="absolute -top-1 -right-1 rounded-full h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity z-20"
                    onClick={() => setShowVideoRecorder(true)}
                  >
                    <Camera className="w-3.5 h-3.5" />
                  </Button>
                </div>

                {/* Info Section */}
                <div className="flex-1 text-center sm:text-left space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                    <h1 className="text-xl font-display font-bold text-foreground">
                      {profile?.username}
                    </h1>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="hover-lift"
                      onClick={handleEditProfile}
                    >
                      <Edit className="w-3.5 h-3.5 mr-1.5" />
                      Edit Profile
                    </Button>
                  </div>
                  
                  {profile?.full_name && (
                    <p className="text-sm text-muted-foreground font-medium">
                      {profile.full_name}
                    </p>
                  )}

                  {/* Stats Row */}
                  <div className="flex items-center justify-center sm:justify-start gap-6">
                    <div className="text-center sm:text-left">
                      <span className="font-bold text-foreground">{posts.length}</span>
                      <span className="text-sm text-muted-foreground ml-1">Posts</span>
                    </div>
                    <div className="text-center sm:text-left">
                      <span className="font-bold text-foreground">0</span>
                      <span className="text-sm text-muted-foreground ml-1">Followers</span>
                    </div>
                    <div className="text-center sm:text-left">
                      <span className="font-bold text-foreground">0</span>
                      <span className="text-sm text-muted-foreground ml-1">Following</span>
                    </div>
                  </div>

                  {/* Bio */}
                  {profile?.bio && (
                    <p className="text-sm text-foreground/80 max-w-md">
                      {profile.bio}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions - Create Post */}
          <Card className="glass-effect border-border/50">
            <CardContent className="p-4">
              <UnifiedComposer onPostCreated={fetchData} />
            </CardContent>
          </Card>

          {/* Top 5 Highlights */}
          <Card className="glass-effect border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Top 5 Highlights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <TopFiveVideos isOwnProfile={true} />
            </CardContent>
          </Card>

          {/* Favorite Videos */}
          <Card className="glass-effect border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Heart className="w-5 h-5 text-primary" />
                Favorite Videos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FavoriteVideos />
            </CardContent>
          </Card>

          {/* Content Tabs */}
          <Tabs defaultValue="posts" className="w-full">
            <TabsList className="w-full grid grid-cols-6 h-12 bg-muted/30 rounded-lg p-1">
              <TabsTrigger value="posts" className="rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all">
                <Grid3x3 className="h-4 w-4" />
                <span className="hidden sm:inline ml-2">Posts</span>
              </TabsTrigger>
              <TabsTrigger value="podcasts" className="rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all">
                <Music className="h-4 w-4" />
                <span className="hidden sm:inline ml-2">Podcasts</span>
              </TabsTrigger>
              <TabsTrigger value="streams" className="rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all">
                <Radio className="h-4 w-4" />
                <span className="hidden sm:inline ml-2">Streams</span>
              </TabsTrigger>
              <TabsTrigger value="liked" className="rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all">
                <Heart className="h-4 w-4" />
                <span className="hidden sm:inline ml-2">Liked</span>
              </TabsTrigger>
              <TabsTrigger value="watch-later" className="rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all">
                <Clock className="h-4 w-4" />
                <span className="hidden sm:inline ml-2">Watch Later</span>
              </TabsTrigger>
              <TabsTrigger value="saved" className="rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all">
                <Bookmark className="h-4 w-4" />
                <span className="hidden sm:inline ml-2">Saved</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="posts" className="mt-4">
              {posts.length > 0 ? (
                <div className="grid grid-cols-3 gap-1 rounded-lg overflow-hidden">
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
                      ) : post.video_url ? (
                        <video 
                          src={post.video_url}
                          className="w-full h-full object-cover"
                          muted
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-muted/50">
                          <p className="text-xs text-muted-foreground p-2 text-center line-clamp-3">
                            {post.content}
                          </p>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="flex items-center gap-1 text-foreground">
                          <Sparkles className="h-4 w-4 fill-current" />
                          <span className="font-semibold text-sm">{post.likes_count}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Grid3x3 className="h-12 w-12 text-muted-foreground/30 mb-3" />
                  <h3 className="text-base font-semibold text-foreground mb-1">No posts yet</h3>
                  <p className="text-sm text-muted-foreground">Share your first post above!</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="podcasts" className="mt-4">
              <Suspense fallback={<div className="animate-pulse h-40 bg-muted/30 rounded-lg" />}>
                <PodcastUploader onUploadComplete={fetchData} />
              </Suspense>
            </TabsContent>

            <TabsContent value="streams" className="mt-4">
              <Suspense fallback={<div className="animate-pulse h-40 bg-muted/30 rounded-lg" />}>
                <LiveStreamManager />
              </Suspense>
            </TabsContent>

            <TabsContent value="liked" className="mt-4">
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Heart className="h-12 w-12 text-muted-foreground/30 mb-3" />
                <h3 className="text-base font-semibold text-foreground mb-1">No liked posts</h3>
                <p className="text-sm text-muted-foreground">Posts you like will appear here</p>
              </div>
            </TabsContent>

            <TabsContent value="saved" className="mt-4">
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Bookmark className="h-12 w-12 text-muted-foreground/30 mb-3" />
                <h3 className="text-base font-semibold text-foreground mb-1">No saved posts</h3>
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