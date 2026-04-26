import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Trophy, Plus, Play, Upload, X, Share2, Eye, 
  Trash2, Edit2, ExternalLink, Repeat2, Wand2
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import VideoTrimModal from "@/components/VideoTrimModal";

interface TopFiveVideo {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  video_url: string;
  thumbnail_url: string | null;
  position: number;
  views_count: number;
  created_at: string;
}

interface TopFiveVideosProps {
  userId?: string;
  isOwnProfile?: boolean;
}

const TopFiveVideos = ({ userId, isOwnProfile = true }: TopFiveVideosProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [videos, setVideos] = useState<TopFiveVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showVideoPlayer, setShowVideoPlayer] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<TopFiveVideo | null>(null);
  const [editingPosition, setEditingPosition] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showTrimModal, setShowTrimModal] = useState(false);
  const [trimVideo, setTrimVideo] = useState<TopFiveVideo | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const targetUserId = userId || user?.id;

  useEffect(() => {
    if (targetUserId) {
      fetchVideos();
    }
  }, [targetUserId]);

  const fetchVideos = async () => {
    if (!targetUserId) return;
    
    const { data, error } = await supabase
      .from("top_five_videos")
      .select("*")
      .eq("user_id", targetUserId)
      .order("position", { ascending: true });

    if (error) {
      console.error("Error fetching top 5 videos:", error);
    } else {
      setVideos(data || []);
    }
    setLoading(false);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 100 * 1024 * 1024) {
        toast.error("Video must be under 100MB");
        return;
      }
      setVideoFile(file);
      toast.success("Video loaded!");
    }
  };

  const handleUpload = async () => {
    if (!videoFile || !user || editingPosition === null) {
      toast.error("Please select a video and fill in required fields");
      return;
    }

    if (!title.trim()) {
      toast.error("Please enter a title");
      return;
    }

    setUploading(true);

    try {
      // Check if position already has a video
      const existingVideo = videos.find(v => v.position === editingPosition);
      
      if (existingVideo) {
        // Delete old video from storage
        const oldFileName = existingVideo.video_url.split("/").pop();
        if (oldFileName) {
          await supabase.storage
            .from("top-five-videos")
            .remove([`${user.id}/${oldFileName}`]);
        }
        
        // Delete old record
        await supabase
          .from("top_five_videos")
          .delete()
          .eq("id", existingVideo.id);
      }

      // Upload new video
      const fileName = `${user.id}/${Date.now()}-${videoFile.name}`;
      const { error: uploadError } = await supabase.storage
        .from("top-five-videos")
        .upload(fileName, videoFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("top-five-videos")
        .getPublicUrl(fileName);

      // Insert new record
      const { error: insertError } = await supabase
        .from("top_five_videos")
        .insert({
          user_id: user.id,
          title,
          description: description || null,
          video_url: publicUrl,
          position: editingPosition,
        });

      if (insertError) throw insertError;

      toast.success("Video added to your Top 5!");
      resetForm();
      setShowUploadModal(false);
      fetchVideos();
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload video");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (video: TopFiveVideo) => {
    if (!user) return;

    try {
      const fileName = video.video_url.split("/").pop();
      if (fileName) {
        await supabase.storage
          .from("top-five-videos")
          .remove([`${user.id}/${fileName}`]);
      }

      const { error } = await supabase
        .from("top_five_videos")
        .delete()
        .eq("id", video.id);

      if (error) throw error;

      toast.success("Video removed from Top 5");
      fetchVideos();
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete video");
    }
  };

  const handleShare = async (video: TopFiveVideo) => {
    const shareUrl = `${window.location.origin}/profile?video=${video.id}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: video.title,
          text: `Check out my highlight: ${video.title}`,
          url: shareUrl,
        });
      } catch (error) {
        // User cancelled share
      }
    } else {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Link copied to clipboard!");
    }
  };

  const handlePlayVideo = async (video: TopFiveVideo) => {
    setSelectedVideo(video);
    setShowVideoPlayer(true);

    // Increment view count
    await supabase
      .from("top_five_videos")
      .update({ views_count: video.views_count + 1 })
      .eq("id", video.id);
  };

  const handleEditInEditor = (video: TopFiveVideo) => {
    // Open the full-screen Filters & Animations editor in-place
    if (!user) {
      toast.error("Please sign in to edit");
      return;
    }
    setTrimVideo(video);
    setShowTrimModal(true);
  };

  const handleRepostToFeed = (video: TopFiveVideo) => {
    if (!user) {
      toast.error("Please sign in to repost");
      return;
    }
    setTrimVideo(video);
    setShowTrimModal(true);
  };

  const resetForm = () => {
    setVideoFile(null);
    setTitle("");
    setDescription("");
    setEditingPosition(null);
  };

  const openUploadModal = (position: number) => {
    setEditingPosition(position);
    const existingVideo = videos.find(v => v.position === position);
    if (existingVideo) {
      setTitle(existingVideo.title);
      setDescription(existingVideo.description || "");
    }
    setShowUploadModal(true);
  };

  const positions = [1, 2, 3, 4, 5];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-500" />
          <h2 className="text-lg font-semibold">My Top 5 Highlights</h2>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-5 gap-2">
          {positions.map((pos) => (
            <div key={pos} className="aspect-[9/16] bg-muted/50 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-5 gap-2">
          {positions.map((position) => {
            const video = videos.find(v => v.position === position);
            
            return (
              <div key={position} className="relative group">
                <div className="absolute -top-2 -left-2 z-10 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shadow-lg">
                  {position}
                </div>
                
                {video ? (
                  <Card className="aspect-[9/16] overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary transition-all">
                    <CardContent className="p-0 h-full relative">
                      <video
                        src={video.video_url}
                        className="w-full h-full object-cover"
                        muted
                        playsInline
                      />
                      
                      {/* Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="absolute bottom-0 left-0 right-0 p-2">
                          <p className="text-white text-xs font-medium line-clamp-2 mb-2">
                            {video.title}
                          </p>
                          <div className="flex items-center gap-1 text-white/70 text-xs mb-2">
                            <Eye className="w-3 h-3" />
                            {video.views_count}
                          </div>
                          <div className="flex gap-1">
                            <Button
                              size="icon"
                              variant="secondary"
                              className="h-7 w-7"
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePlayVideo(video);
                              }}
                            >
                              <Play className="w-3 h-3" />
                            </Button>
                            <Button
                              size="icon"
                              variant="secondary"
                              className="h-7 w-7"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleShare(video);
                              }}
                            >
                              <Share2 className="w-3 h-3" />
                            </Button>
                            {isOwnProfile && (
                              <>
                                <Button
                                  size="icon"
                                  variant="secondary"
                                  className="h-7 w-7"
                                  title="Edit filters & animations"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditInEditor(video);
                                  }}
                                >
                                  <Wand2 className="w-3 h-3" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="secondary"
                                  className="h-7 w-7"
                                  title="Repost to feed"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRepostToFeed(video);
                                  }}
                                >
                                  <Repeat2 className="w-3 h-3" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="secondary"
                                  className="h-7 w-7"
                                  title="Replace video"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openUploadModal(position);
                                  }}
                                >
                                  <Edit2 className="w-3 h-3" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="destructive"
                                  className="h-7 w-7"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDelete(video);
                                  }}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Play button center */}
                      <div 
                        className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handlePlayVideo(video)}
                      >
                        <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
                          <Play className="w-6 h-6 text-black fill-black" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : isOwnProfile ? (
                  <Card 
                    className="aspect-[9/16] overflow-hidden cursor-pointer hover:bg-muted/50 transition-colors border-dashed"
                    onClick={() => openUploadModal(position)}
                  >
                    <CardContent className="p-0 h-full flex flex-col items-center justify-center gap-2 text-muted-foreground">
                      <Plus className="w-8 h-8" />
                      <span className="text-xs">Add Video</span>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="aspect-[9/16] overflow-hidden border-dashed">
                    <CardContent className="p-0 h-full flex items-center justify-center text-muted-foreground">
                      <span className="text-xs">Empty</span>
                    </CardContent>
                  </Card>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Upload Modal */}
      <Dialog open={showUploadModal} onOpenChange={(open) => {
        if (!open) resetForm();
        setShowUploadModal(open);
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              Add Highlight #{editingPosition}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label>Video File *</Label>
              <div 
                className="mt-2 border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                {videoFile ? (
                  <div className="space-y-2">
                    <Play className="w-10 h-10 text-primary mx-auto" />
                    <p className="font-medium text-sm">{videoFile.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(videoFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="w-10 h-10 text-muted-foreground mx-auto" />
                    <p className="font-medium text-sm">Click to upload</p>
                    <p className="text-xs text-muted-foreground">Max 100MB</p>
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

            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Game-winning shot"
                maxLength={100}
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe this highlight..."
                rows={3}
                maxLength={500}
              />
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button variant="outline" onClick={() => setShowUploadModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpload} disabled={uploading || !videoFile}>
                {uploading ? "Uploading..." : "Save Highlight"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Video Player Modal */}
      <Dialog open={showVideoPlayer} onOpenChange={setShowVideoPlayer}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden">
          {selectedVideo && (
            <div className="relative">
              <video
                src={selectedVideo.video_url}
                controls
                autoPlay
                className="w-full max-h-[80vh]"
              />
              <div className="p-4 bg-background">
                <h3 className="font-semibold text-lg">{selectedVideo.title}</h3>
                {selectedVideo.description && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {selectedVideo.description}
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-2 mt-3">
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Eye className="w-4 h-4" />
                    {selectedVideo.views_count + 1} views
                  </div>
                  <div className="flex gap-2 ml-auto">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleShare(selectedVideo)}
                    >
                      <Share2 className="w-4 h-4 mr-2" />
                      Share
                    </Button>
                    {isOwnProfile && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setShowVideoPlayer(false);
                            handleEditInEditor(selectedVideo);
                          }}
                        >
                          <Wand2 className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleRepostToFeed(selectedVideo)}
                        >
                          <Repeat2 className="w-4 h-4 mr-2" />
                          Repost
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Video Trim Modal */}
      {trimVideo && (
        <VideoTrimModal
          open={showTrimModal}
          onOpenChange={setShowTrimModal}
          videoUrl={trimVideo.video_url}
          videoTitle={trimVideo.title}
          videoDescription={trimVideo.description || undefined}
          onRepostSuccess={() => setTrimVideo(null)}
        />
      )}
    </div>
  );
};

export default TopFiveVideos;
