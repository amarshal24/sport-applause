import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Sidebar from "@/components/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Trophy, Upload, Play, Eye, Calendar, MapPin, 
  School, Ruler, Weight, Star, Plus, Filter, 
  Share2, Download, Edit, Trash2, MoreVertical, X, Mail, ArrowUpDown, User
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { SPORTS } from "@/constants/sports";
import ContactAthleteModal from "@/components/ContactAthleteModal";
import AthleteSearch from "@/components/AthleteSearch";
import AthleteComparison from "@/components/AthleteComparison";

interface RecruitingVideo {
  id: string;
  user_id: string;
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
  profiles: {
    username: string;
    avatar_url: string | null;
    full_name: string | null;
  };
}

const Recruiting = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [videos, setVideos] = useState<RecruitingVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showVideoPlayer, setShowVideoPlayer] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<RecruitingVideo | null>(null);
  const [editingVideo, setEditingVideo] = useState<RecruitingVideo | null>(null);
  const [contactAthlete, setContactAthlete] = useState<{
    id: string;
    username: string;
    full_name: string | null;
    avatar_url: string | null;
  } | null>(null);
  
  // Filters & Sorting
  const [selectedSport, setSelectedSport] = useState<string>("all");
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [selectedPosition, setSelectedPosition] = useState<string>("");
  const [selectedLocation, setSelectedLocation] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("featured");
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Form state
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [sport, setSport] = useState("");
  const [position, setPosition] = useState("");
  const [graduationYear, setGraduationYear] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [location, setLocation] = useState("");
  const [school, setSchool] = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchVideos();
  }, [selectedSport, selectedYear, selectedPosition, selectedLocation, sortBy]);

  const fetchVideos = async () => {
    setLoading(true);
    
    let query = supabase
      .from("recruiting_videos")
      .select(`
        *,
        profiles (
          username,
          avatar_url,
          full_name
        )
      `)
      .eq("status", "active");

    // Apply sorting
    switch (sortBy) {
      case "views":
        query = query.order("views_count", { ascending: false });
        break;
      case "newest":
        query = query.order("created_at", { ascending: false });
        break;
      case "oldest":
        query = query.order("created_at", { ascending: true });
        break;
      case "featured":
      default:
        query = query.order("featured", { ascending: false }).order("created_at", { ascending: false });
        break;
    }

    if (selectedSport !== "all") {
      query = query.eq("sport", selectedSport);
    }

    if (selectedYear !== "all") {
      query = query.eq("graduation_year", parseInt(selectedYear));
    }

    if (selectedPosition.trim()) {
      query = query.ilike("position", `%${selectedPosition}%`);
    }

    if (selectedLocation.trim()) {
      query = query.ilike("location", `%${selectedLocation}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching videos:", error);
      toast.error("Failed to load recruiting videos");
    } else {
      setVideos(data || []);
    }
    
    setLoading(false);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file size (200MB max)
      if (file.size > 200 * 1024 * 1024) {
        toast.error("Video must be under 200MB (approximately 3 minutes)");
        return;
      }
      
      // Check video duration (will be done in video element)
      const video = document.createElement("video");
      video.preload = "metadata";
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        if (video.duration > 180) { // 3 minutes
          toast.error("Video must be 3 minutes or less");
          setVideoFile(null);
        } else {
          setVideoFile(file);
          toast.success("Video loaded successfully!");
        }
      };
      video.src = URL.createObjectURL(file);
    }
  };

  const handleUpload = async () => {
    if (!user) {
      toast.error("Please sign in to upload");
      return;
    }

    if (!title || !sport || !graduationYear) {
      toast.error("Please fill in all required fields");
      return;
    }

    // For new uploads, require video file
    if (!editingVideo && !videoFile) {
      toast.error("Please select a video");
      return;
    }

    setUploading(true);

    try {
      let videoUrl = editingVideo?.video_url || "";

      // Upload new video if provided
      if (videoFile) {
        const fileName = `${user.id}/${Date.now()}-${videoFile.name}`;
        const { error: uploadError } = await supabase.storage
          .from("recruiting-videos")
          .upload(fileName, videoFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from("recruiting-videos")
          .getPublicUrl(fileName);

        videoUrl = publicUrl;
      }

      if (editingVideo) {
        // Update existing video
        const { error: updateError } = await supabase
          .from("recruiting_videos")
          .update({
            title,
            description,
            video_url: videoUrl,
            sport,
            position: position || null,
            graduation_year: parseInt(graduationYear),
            height: height || null,
            weight: weight || null,
            location: location || null,
            school: school || null,
          })
          .eq("id", editingVideo.id);

        if (updateError) throw updateError;
        toast.success("Video updated successfully!");
      } else {
        // Create new video
        const { error: insertError } = await supabase
          .from("recruiting_videos")
          .insert({
            user_id: user.id,
            title,
            description,
            video_url: videoUrl,
            sport,
            position: position || null,
            graduation_year: parseInt(graduationYear),
            height: height || null,
            weight: weight || null,
            location: location || null,
            school: school || null,
          });

        if (insertError) throw insertError;
        toast.success("Recruiting video uploaded successfully!");
      }

      setShowUploadModal(false);
      resetForm();
      fetchVideos();
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to save video");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (video: RecruitingVideo) => {
    if (!confirm("Are you sure you want to delete this video?")) return;

    try {
      const { error } = await supabase
        .from("recruiting_videos")
        .delete()
        .eq("id", video.id);

      if (error) throw error;
      toast.success("Video deleted successfully");
      fetchVideos();
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete video");
    }
  };

  const handleEdit = (video: RecruitingVideo) => {
    setEditingVideo(video);
    setTitle(video.title);
    setDescription(video.description || "");
    setSport(video.sport);
    setPosition(video.position || "");
    setGraduationYear(video.graduation_year?.toString() || "");
    setHeight(video.height || "");
    setWeight(video.weight || "");
    setLocation(video.location || "");
    setSchool(video.school || "");
    setShowUploadModal(true);
  };

  const handleShare = async (video: RecruitingVideo) => {
    const shareUrl = `${window.location.origin}/recruiting?video=${video.id}`;
    const shareData = {
      title: video.title,
      text: `Check out ${video.profiles.full_name || video.profiles.username}'s highlight reel!`,
      url: shareUrl,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareUrl);
        toast.success("Link copied to clipboard!");
      }
    } catch (error) {
      console.error("Share error:", error);
    }
  };

  const handleDownload = async (video: RecruitingVideo) => {
    try {
      toast.info("Starting download...");
      const response = await fetch(video.video_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${video.title.replace(/[^a-z0-9]/gi, "_")}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success("Download started!");
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Failed to download video");
    }
  };

  const handlePlayVideo = (video: RecruitingVideo) => {
    setSelectedVideo(video);
    setShowVideoPlayer(true);
    incrementViewCount(video.id);
  };

  const handleContact = (video: RecruitingVideo) => {
    if (!user) {
      toast.error("Please sign in to contact athletes");
      return;
    }
    if (user.id === video.user_id) {
      toast.info("This is your own video");
      return;
    }
    setContactAthlete({
      id: video.user_id,
      username: video.profiles.username,
      full_name: video.profiles.full_name,
      avatar_url: video.profiles.avatar_url,
    });
    setSelectedVideo(video);
    setShowContactModal(true);
  };

  const resetForm = () => {
    setVideoFile(null);
    setTitle("");
    setDescription("");
    setSport("");
    setPosition("");
    setGraduationYear("");
    setHeight("");
    setWeight("");
    setLocation("");
    setSchool("");
    setEditingVideo(null);
  };

  const clearFilters = () => {
    setSelectedSport("all");
    setSelectedYear("all");
    setSelectedPosition("");
    setSelectedLocation("");
  };

  const hasActiveFilters = selectedSport !== "all" || selectedYear !== "all" || selectedPosition || selectedLocation;

  const incrementViewCount = async (videoId: string) => {
    const video = videos.find(v => v.id === videoId);
    if (video) {
      await supabase
        .from("recruiting_videos")
        .update({ views_count: video.views_count + 1 })
        .eq("id", videoId);
    }
  };

  const currentYear = new Date().getFullYear();
  const graduationYears = Array.from({ length: 8 }, (_, i) => currentYear + i);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <Sidebar />
      
      <main className="pt-20 pb-20 lg:pb-6 lg:pl-64">
        <div className="px-4 lg:px-6 py-6">
          {/* Hero Section */}
          <div className="mb-8 text-center relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/20 via-background to-primary/10 p-8 md:p-12">
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 mb-4">
                <Trophy className="w-10 h-10 text-primary" />
                <h1 className="text-4xl md:text-5xl font-display font-bold gradient-text">
                  Take Your Game to the Next Level
                </h1>
              </div>
              <p className="text-lg text-muted-foreground mb-6 max-w-2xl mx-auto">
                Showcase your talent to college recruiters and professional scouts. 
                Upload your highlight reel and get discovered.
              </p>
              {user && (
                <Button 
                  size="lg"
                  onClick={() => {
                    resetForm();
                    setShowUploadModal(true);
                  }}
                  className="shadow-glow"
                >
                  <Plus className="mr-2 h-5 w-5" />
                  Upload Your Highlight Reel
                </Button>
              )}
              {!user && (
                <Button 
                  size="lg"
                  onClick={() => window.location.href = '/auth'}
                >
                  Sign In to Upload
                </Button>
              )}
            </div>
          </div>

          {/* Search & Filters */}
          <Card className="glass-effect mb-6">
            <CardContent className="p-4 space-y-4">
              {/* Athlete Search */}
              <div className="flex items-center gap-4">
                <AthleteSearch 
                  placeholder="Search athletes by name..." 
                  className="flex-1 max-w-md"
                />
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Filter by:</span>
                </div>
                
                <Select value={selectedSport} onValueChange={setSelectedSport}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="All Sports" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sports</SelectItem>
                    {SPORTS.map((s) => (
                      <SelectItem key={s.id} value={s.name}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Grad Year" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Years</SelectItem>
                    {graduationYears.map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        Class of {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Input
                  placeholder="Position..."
                  value={selectedPosition}
                  onChange={(e) => setSelectedPosition(e.target.value)}
                  className="w-[140px]"
                />

                <Input
                  placeholder="Location..."
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className="w-[140px]"
                />

                <div className="flex items-center gap-2 ml-auto">
                  <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="featured">Featured</SelectItem>
                      <SelectItem value="newest">Newest First</SelectItem>
                      <SelectItem value="oldest">Oldest First</SelectItem>
                      <SelectItem value="views">Most Viewed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    <X className="w-4 h-4 mr-1" />
                    Clear
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* NBA Athlete Comparison Tool */}
          <div className="mb-6">
            <AthleteComparison />
          </div>

          {/* Videos Grid */}
          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="glass-effect animate-pulse">
                  <div className="aspect-video bg-muted" />
                  <CardContent className="p-4 space-y-2">
                    <div className="h-4 bg-muted rounded w-3/4" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : videos.length === 0 ? (
            <Card className="glass-effect">
              <CardContent className="p-12 text-center">
                <Trophy className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Videos Yet</h3>
                <p className="text-muted-foreground">
                  {hasActiveFilters ? "No videos match your filters." : "Be the first to upload a recruiting highlight reel!"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {videos.map((video) => (
                <Card 
                  key={video.id} 
                  className="glass-effect hover:shadow-glow transition-all duration-300 group"
                >
                  <div 
                    className="relative aspect-video overflow-hidden rounded-t-xl bg-black cursor-pointer"
                    onClick={() => handlePlayVideo(video)}
                  >
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
                        <Star className="w-3 h-3 mr-1 fill-current" />
                        Featured
                      </Badge>
                    )}
                    
                    {/* Action buttons */}
                    <div className="absolute top-2 right-2 flex gap-1">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="secondary" 
                            size="icon" 
                            className="h-8 w-8 bg-background/80 hover:bg-background"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenuItem onClick={() => navigate(`/athlete/${video.user_id}`)}>
                            <User className="w-4 h-4 mr-2" />
                            View Profile
                          </DropdownMenuItem>
                          {user?.id !== video.user_id && (
                            <DropdownMenuItem onClick={() => handleContact(video)}>
                              <Mail className="w-4 h-4 mr-2" />
                              Contact Athlete
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => handleShare(video)}>
                            <Share2 className="w-4 h-4 mr-2" />
                            Share
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDownload(video)}>
                            <Download className="w-4 h-4 mr-2" />
                            Download
                          </DropdownMenuItem>
                          {user?.id === video.user_id && (
                            <>
                              <DropdownMenuItem onClick={() => handleEdit(video)}>
                                <Edit className="w-4 h-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDelete(video)}
                                className="text-destructive"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <Avatar 
                        className="h-10 w-10 cursor-pointer hover:ring-2 hover:ring-primary transition-all"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/athlete/${video.user_id}`);
                        }}
                      >
                        <AvatarImage src={video.profiles.avatar_url || undefined} />
                        <AvatarFallback>
                          {video.profiles.username[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm line-clamp-2 mb-1">
                          {video.title}
                        </h3>
                        <p 
                          className="text-xs text-muted-foreground hover:text-primary cursor-pointer transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/athlete/${video.user_id}`);
                          }}
                        >
                          {video.profiles.full_name || video.profiles.username}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {video.sport}
                      </Badge>
                      {video.position && (
                        <Badge variant="outline" className="text-xs">
                          {video.position}
                        </Badge>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                      {video.graduation_year && (
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Class of {video.graduation_year}
                        </div>
                      )}
                      {video.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {video.location}
                        </div>
                      )}
                      {video.height && (
                        <div className="flex items-center gap-1">
                          <Ruler className="w-3 h-3" />
                          {video.height}
                        </div>
                      )}
                      {video.weight && (
                        <div className="flex items-center gap-1">
                          <Weight className="w-3 h-3" />
                          {video.weight}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Eye className="w-3 h-3" />
                        {video.views_count} views
                      </div>
                      {video.school && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <School className="w-3 h-3" />
                          {video.school}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Upload/Edit Modal */}
      <Dialog open={showUploadModal} onOpenChange={(open) => {
        setShowUploadModal(open);
        if (!open) resetForm();
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <Trophy className="w-6 h-6 text-primary" />
              {editingVideo ? "Edit Highlight Reel" : "Upload Your Highlight Reel"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Video Upload */}
            <div>
              <Label>Video File {editingVideo ? "(optional - leave empty to keep current)" : "*"}</Label>
              <div 
                className="mt-2 border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                {videoFile ? (
                  <div className="space-y-2">
                    <Play className="w-12 h-12 text-primary mx-auto" />
                    <p className="font-medium">{videoFile.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(videoFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                ) : editingVideo ? (
                  <div className="space-y-2">
                    <Play className="w-12 h-12 text-muted-foreground mx-auto" />
                    <p className="font-medium">Current video will be kept</p>
                    <p className="text-sm text-muted-foreground">
                      Click to upload a new video
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="w-12 h-12 text-muted-foreground mx-auto" />
                    <p className="font-medium">Click to upload video</p>
                    <p className="text-sm text-muted-foreground">
                      Max 3 minutes • Up to 200MB
                    </p>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            </div>

            {/* Title */}
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., John Smith - 2025 Basketball Highlights"
                className="mt-2"
              />
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tell recruiters about your skills, achievements, and goals..."
                className="mt-2"
                rows={4}
              />
            </div>

            {/* Sport & Position */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Sport *</Label>
                <Select value={sport} onValueChange={setSport}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Select sport" />
                  </SelectTrigger>
                  <SelectContent>
                    {SPORTS.map((s) => (
                      <SelectItem key={s.id} value={s.name}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="position">Position</Label>
                <Input
                  id="position"
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  placeholder="e.g., Point Guard, Quarterback"
                  className="mt-2"
                />
              </div>
            </div>

            {/* Physical Stats */}
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="height">Height</Label>
                <Input
                  id="height"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  placeholder="e.g., 6'2&quot;"
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="weight">Weight</Label>
                <Input
                  id="weight"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="e.g., 180 lbs"
                  className="mt-2"
                />
              </div>

              <div>
                <Label>Graduation Year *</Label>
                <Select value={graduationYear} onValueChange={setGraduationYear}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Year" />
                  </SelectTrigger>
                  <SelectContent>
                    {graduationYears.map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* School & Location */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="school">School</Label>
                <Input
                  id="school"
                  value={school}
                  onChange={(e) => setSchool(e.target.value)}
                  placeholder="e.g., Lincoln High School"
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g., Los Angeles, CA"
                  className="mt-2"
                />
              </div>
            </div>

            {/* Upload Button */}
            <Button 
              onClick={handleUpload}
              disabled={uploading || (!editingVideo && !videoFile) || !title || !sport || !graduationYear}
              className="w-full"
              size="lg"
            >
              {uploading ? "Saving..." : editingVideo ? "Save Changes" : "Upload Highlight Reel"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Video Player Modal */}
      <Dialog open={showVideoPlayer} onOpenChange={setShowVideoPlayer}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden">
          {selectedVideo && (
            <div>
              <video
                src={selectedVideo.video_url}
                className="w-full aspect-video"
                controls
                autoPlay
              />
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">{selectedVideo.title}</h3>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleShare(selectedVideo)}>
                      <Share2 className="w-4 h-4 mr-2" />
                      Share
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDownload(selectedVideo)}>
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={selectedVideo.profiles.avatar_url || undefined} />
                    <AvatarFallback>
                      {selectedVideo.profiles.username[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">
                      {selectedVideo.profiles.full_name || selectedVideo.profiles.username}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Badge variant="secondary">{selectedVideo.sport}</Badge>
                      {selectedVideo.graduation_year && (
                        <span>Class of {selectedVideo.graduation_year}</span>
                      )}
                    </div>
                  </div>
                </div>
                {selectedVideo.description && (
                  <p className="text-sm text-muted-foreground">{selectedVideo.description}</p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      {/* Contact Athlete Modal */}
      {contactAthlete && (
        <ContactAthleteModal
          open={showContactModal}
          onOpenChange={setShowContactModal}
          athlete={contactAthlete}
          videoId={selectedVideo?.id}
          videoTitle={selectedVideo?.title}
        />
      )}
    </div>
  );
};

export default Recruiting;
