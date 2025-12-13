import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Navigation from "@/components/Navigation";
import Sidebar from "@/components/Sidebar";
import TopFiveVideos from "@/components/TopFiveVideos";
import ContactAthleteModal from "@/components/ContactAthleteModal";
import { RecruiterInterestScale } from "@/components/RecruiterInterestScale";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  User, Mail, Video, Trophy, Calendar, MapPin, 
  School, Ruler, Weight, Eye, Play, ArrowLeft
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface Profile {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  sports: string[] | null;
  profile_video_url: string | null;
}

interface RecruitingVideo {
  id: string;
  title: string;
  description: string | null;
  video_url: string;
  thumbnail_url: string | null;
  sport: string;
  position: string | null;
  graduation_year: number | null;
  height: string | null;
  weight: string | null;
  location: string | null;
  school: string | null;
  views_count: number;
  featured: boolean;
  created_at: string;
}

const AthleteProfile = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [videos, setVideos] = useState<RecruitingVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showContactModal, setShowContactModal] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<RecruitingVideo | null>(null);
  const [showVideoPlayer, setShowVideoPlayer] = useState(false);

  useEffect(() => {
    if (userId) {
      fetchAthleteData();
    }
  }, [userId]);

  const fetchAthleteData = async () => {
    if (!userId) return;
    setLoading(true);

    try {
      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (profileError) throw profileError;
      
      if (!profileData) {
        toast.error("Athlete not found");
        navigate("/recruiting");
        return;
      }

      setProfile(profileData);

      // Fetch recruiting videos
      const { data: videosData, error: videosError } = await supabase
        .from("recruiting_videos")
        .select("*")
        .eq("user_id", userId)
        .eq("status", "active")
        .order("featured", { ascending: false })
        .order("created_at", { ascending: false });

      if (videosError) throw videosError;
      setVideos(videosData || []);
    } catch (error) {
      console.error("Error fetching athlete data:", error);
      toast.error("Failed to load athlete profile");
    } finally {
      setLoading(false);
    }
  };

  const handlePlayVideo = (video: RecruitingVideo) => {
    setSelectedVideo(video);
    setShowVideoPlayer(true);
    incrementViewCount(video.id);
  };

  const incrementViewCount = async (videoId: string) => {
    const video = videos.find(v => v.id === videoId);
    if (video) {
      await supabase
        .from("recruiting_videos")
        .update({ views_count: video.views_count + 1 })
        .eq("id", videoId);
    }
  };

  // Calculate stats
  const totalViews = videos.reduce((sum, v) => sum + v.views_count, 0);
  const uniqueSports = [...new Set(videos.map(v => v.sport))];
  const latestVideo = videos[0];

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <Sidebar />
        <main className="pt-20 pb-20 lg:pb-6 lg:pl-64">
          <div className="px-4 lg:px-6 py-6">
            <div className="animate-pulse space-y-6">
              <div className="h-48 bg-muted rounded-2xl" />
              <div className="h-32 bg-muted rounded-xl" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <Sidebar />
        <main className="pt-20 pb-20 lg:pb-6 lg:pl-64">
          <div className="px-4 lg:px-6 py-6">
            <Card className="glass-effect">
              <CardContent className="p-12 text-center">
                <User className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Athlete Not Found</h3>
                <p className="text-muted-foreground mb-4">
                  This athlete profile doesn't exist or has been removed.
                </p>
                <Button onClick={() => navigate("/recruiting")}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Recruiting
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  const isOwnProfile = user?.id === profile.id;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <Sidebar />
      
      <main className="pt-20 pb-20 lg:pb-6 lg:pl-64">
        <div className="px-4 lg:px-6 py-6">
          {/* Back button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/recruiting")}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Recruiting
          </Button>

          {/* Profile Header */}
          <Card className="glass-effect mb-6 overflow-hidden">
            <div className="h-32 bg-gradient-to-br from-primary/30 via-primary/10 to-background" />
            <CardContent className="p-6 -mt-16">
              <div className="flex flex-col md:flex-row items-start md:items-end gap-4">
                <Avatar className="h-32 w-32 border-4 border-background shadow-xl">
                  <AvatarImage src={profile.avatar_url || undefined} />
                  <AvatarFallback className="text-4xl">
                    {profile.username[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1">
                  <h1 className="text-3xl font-display font-bold">
                    {profile.full_name || profile.username}
                  </h1>
                  <p className="text-muted-foreground">@{profile.username}</p>
                  
                  {profile.bio && (
                    <p className="mt-2 text-sm max-w-xl">{profile.bio}</p>
                  )}

                  {profile.sports && profile.sports.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {profile.sports.map((sport) => (
                        <Badge key={sport} variant="secondary">
                          {sport}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {!isOwnProfile && user && (
                  <Button onClick={() => setShowContactModal(true)}>
                    <Mail className="w-4 h-4 mr-2" />
                    Contact Athlete
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recruiter Interest Scale - only show to other logged-in users */}
          {!isOwnProfile && userId && (
            <div className="mb-6">
              <RecruiterInterestScale athleteId={userId} />
            </div>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card className="glass-effect">
              <CardContent className="p-4 text-center">
                <Video className="w-8 h-8 text-primary mx-auto mb-2" />
                <p className="text-2xl font-bold">{videos.length}</p>
                <p className="text-sm text-muted-foreground">Videos</p>
              </CardContent>
            </Card>
            <Card className="glass-effect">
              <CardContent className="p-4 text-center">
                <Eye className="w-8 h-8 text-primary mx-auto mb-2" />
                <p className="text-2xl font-bold">{totalViews.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Total Views</p>
              </CardContent>
            </Card>
            <Card className="glass-effect">
              <CardContent className="p-4 text-center">
                <Trophy className="w-8 h-8 text-primary mx-auto mb-2" />
                <p className="text-2xl font-bold">{uniqueSports.length}</p>
                <p className="text-sm text-muted-foreground">Sports</p>
              </CardContent>
            </Card>
            <Card className="glass-effect">
              <CardContent className="p-4 text-center">
                <Calendar className="w-8 h-8 text-primary mx-auto mb-2" />
                <p className="text-2xl font-bold">
                  {latestVideo?.graduation_year || "-"}
                </p>
                <p className="text-sm text-muted-foreground">Grad Year</p>
              </CardContent>
            </Card>
          </div>

          {/* Athlete Details from latest video */}
          {latestVideo && (latestVideo.height || latestVideo.weight || latestVideo.position || latestVideo.school || latestVideo.location) && (
            <Card className="glass-effect mb-6">
              <CardContent className="p-4">
                <h3 className="font-semibold mb-3">Athlete Details</h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {latestVideo.position && (
                    <div className="flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Position</p>
                        <p className="font-medium">{latestVideo.position}</p>
                      </div>
                    </div>
                  )}
                  {latestVideo.height && (
                    <div className="flex items-center gap-2">
                      <Ruler className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Height</p>
                        <p className="font-medium">{latestVideo.height}</p>
                      </div>
                    </div>
                  )}
                  {latestVideo.weight && (
                    <div className="flex items-center gap-2">
                      <Weight className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Weight</p>
                        <p className="font-medium">{latestVideo.weight}</p>
                      </div>
                    </div>
                  )}
                  {latestVideo.school && (
                    <div className="flex items-center gap-2">
                      <School className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">School</p>
                        <p className="font-medium">{latestVideo.school}</p>
                      </div>
                    </div>
                  )}
                  {latestVideo.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Location</p>
                        <p className="font-medium">{latestVideo.location}</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Content Tabs */}
          <Tabs defaultValue="highlights" className="space-y-4">
            <TabsList>
              <TabsTrigger value="highlights" className="flex items-center gap-2">
                <Video className="w-4 h-4" />
                Highlight Reels
              </TabsTrigger>
              <TabsTrigger value="top5" className="flex items-center gap-2">
                <Trophy className="w-4 h-4" />
                Top 5 Plays
              </TabsTrigger>
            </TabsList>

            <TabsContent value="highlights">
              {videos.length === 0 ? (
                <Card className="glass-effect">
                  <CardContent className="p-12 text-center">
                    <Video className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No Highlight Reels</h3>
                    <p className="text-muted-foreground">
                      This athlete hasn't uploaded any highlight reels yet.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {videos.map((video) => (
                    <Card 
                      key={video.id} 
                      className="glass-effect hover:shadow-glow transition-all duration-300 group cursor-pointer"
                      onClick={() => handlePlayVideo(video)}
                    >
                      <div className="relative aspect-video overflow-hidden rounded-t-xl bg-black">
                        <video
                          src={video.video_url}
                          className="w-full h-full object-cover"
                          poster={video.thumbnail_url || undefined}
                        />
                        <div className="absolute inset-0 bg-background/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Play className="w-16 h-16 text-white" />
                        </div>
                        {video.featured && (
                          <Badge className="absolute top-2 left-2 bg-primary">
                            Featured
                          </Badge>
                        )}
                      </div>
                      
                      <CardContent className="p-4 space-y-2">
                        <h3 className="font-semibold line-clamp-2">{video.title}</h3>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="secondary">{video.sport}</Badge>
                          {video.position && (
                            <Badge variant="outline">{video.position}</Badge>
                          )}
                        </div>
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            {video.views_count} views
                          </div>
                          <span>{format(new Date(video.created_at), "MMM d, yyyy")}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="top5">
              <TopFiveVideos userId={profile.id} isOwnProfile={isOwnProfile} />
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Video Player Modal */}
      {selectedVideo && (
        <div 
          className={`fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 ${showVideoPlayer ? 'block' : 'hidden'}`}
          onClick={() => setShowVideoPlayer(false)}
        >
          <Card className="max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
            <video
              src={selectedVideo.video_url}
              className="w-full aspect-video rounded-t-xl"
              controls
              autoPlay
            />
            <CardContent className="p-4">
              <h3 className="text-lg font-semibold">{selectedVideo.title}</h3>
              {selectedVideo.description && (
                <p className="text-sm text-muted-foreground mt-2">{selectedVideo.description}</p>
              )}
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-4"
                onClick={() => setShowVideoPlayer(false)}
              >
                Close
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Contact Modal */}
      {profile && (
        <ContactAthleteModal
          open={showContactModal}
          onOpenChange={setShowContactModal}
          athlete={{
            id: profile.id,
            username: profile.username,
            full_name: profile.full_name,
            avatar_url: profile.avatar_url,
          }}
        />
      )}
    </div>
  );
};

export default AthleteProfile;
