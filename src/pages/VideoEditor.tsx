import { useState, useRef, useEffect } from "react";
import Navigation from "@/components/Navigation";
import Sidebar from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  Upload, Download, Play, Pause, Sparkles, Type, 
  Sticker, Music, Scissors, Zap, RotateCcw, Check,
  Share2, Trash2, Send, Image as ImageIcon
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

interface TextOverlay {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  color: string;
  fontFamily: string;
}

interface Filter {
  id: string;
  name: string;
  cssFilter: string;
  emoji: string;
}

const filters: Filter[] = [
  { id: "none", name: "Original", cssFilter: "none", emoji: "✨" },
  { id: "vintage", name: "Vintage", cssFilter: "sepia(0.5) contrast(1.2)", emoji: "📷" },
  { id: "cool", name: "Cool", cssFilter: "saturate(1.5) hue-rotate(-15deg)", emoji: "❄️" },
  { id: "warm", name: "Warm", cssFilter: "saturate(1.3) hue-rotate(15deg)", emoji: "🔥" },
  { id: "vivid", name: "Vivid", cssFilter: "saturate(2) contrast(1.3)", emoji: "🌈" },
  { id: "noir", name: "Noir", cssFilter: "grayscale(1) contrast(1.5)", emoji: "🎬" },
  { id: "neon", name: "Neon", cssFilter: "saturate(3) brightness(1.2) contrast(1.3)", emoji: "💡" },
  { id: "fade", name: "Fade", cssFilter: "brightness(1.1) contrast(0.9)", emoji: "🌫️" },
];

const stickers = ["⚽", "🏀", "🏈", "⚾", "🎾", "🏐", "🏆", "🥇", "🔥", "⚡", "💪", "👏", "🎯", "🏁"];

const VideoEditor = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string>("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<Filter>(filters[0]);
  const [textOverlays, setTextOverlays] = useState<TextOverlay[]>([]);
  const [currentText, setCurrentText] = useState("");
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(100);
  const [duration, setDuration] = useState(0);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [postCaption, setPostCaption] = useState("");
  const [exporting, setExporting] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 50 * 1024 * 1024) {
        toast.error("File size must be less than 50MB");
        return;
      }
      setVideoFile(file);
      const url = URL.createObjectURL(file);
      setVideoUrl(url);
      toast.success("Video loaded successfully!");
    }
  };

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed]);

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.addEventListener("loadedmetadata", () => {
        setDuration(video.duration);
      });
    }
  }, [videoUrl]);

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const addTextOverlay = () => {
    if (!currentText.trim()) {
      toast.error("Please enter text first");
      return;
    }

    const newOverlay: TextOverlay = {
      id: Date.now().toString(),
      text: currentText,
      x: 50,
      y: 50,
      fontSize: 32,
      color: "#ffffff",
      fontFamily: "Inter",
    };

    setTextOverlays([...textOverlays, newOverlay]);
    setCurrentText("");
    toast.success("Text added!");
  };

  const addStickerOverlay = (sticker: string) => {
    const newOverlay: TextOverlay = {
      id: Date.now().toString(),
      text: sticker,
      x: Math.random() * 50 + 25,
      y: Math.random() * 50 + 25,
      fontSize: 48,
      color: "#ffffff",
      fontFamily: "Arial",
    };

    setTextOverlays([...textOverlays, newOverlay]);
    toast.success("Sticker added!");
  };

  const removeOverlay = (id: string) => {
    setTextOverlays(textOverlays.filter(o => o.id !== id));
  };

  const resetEditor = () => {
    setSelectedFilter(filters[0]);
    setTextOverlays([]);
    setPlaybackSpeed(1);
    setTrimStart(0);
    setTrimEnd(100);
    toast.success("Editor reset!");
  };

  const exportVideo = () => {
    if (!videoFile) {
      toast.error("No video to export");
      return;
    }
    setShowExportDialog(true);
  };

  const handleDownload = () => {
    if (!videoUrl) return;
    
    const link = document.createElement('a');
    link.href = videoUrl;
    link.download = `edited-video-${Date.now()}.${videoFile?.name.split('.').pop() || 'mp4'}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Video downloaded!");
  };

  const handleShare = async () => {
    if (!videoUrl) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My edited sports video',
          text: 'Check out this video I created!',
          url: videoUrl,
        });
        toast.success("Shared successfully!");
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(videoUrl);
      toast.success("Video link copied to clipboard!");
    }
  };

  const handleDelete = () => {
    setVideoFile(null);
    setVideoUrl("");
    resetEditor();
    toast.success("Video removed");
  };

  const postToFeed = async () => {
    if (!user || !videoFile) {
      toast.error("Please sign in to post");
      return;
    }

    setExporting(true);
    try {
      // Upload video to storage
      const fileName = `${user.id}/${Date.now()}-${videoFile.name}`;
      const { error: uploadError } = await supabase.storage
        .from("posts")
        .upload(fileName, videoFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("posts")
        .getPublicUrl(fileName);

      // Create post
      const { error: postError } = await supabase
        .from("posts")
        .insert({
          user_id: user.id,
          content: postCaption || "Check out my edited sports video! 🎬",
          image_url: publicUrl,
        });

      if (postError) throw postError;

      toast.success("Posted to feed!");
      setShowExportDialog(false);
      navigate("/");
    } catch (error) {
      console.error("Error posting:", error);
      toast.error("Failed to post video");
    } finally {
      setExporting(false);
    }
  };

  const postToStory = async () => {
    if (!user || !videoFile) {
      toast.error("Please sign in to post");
      return;
    }

    setExporting(true);
    try {
      // Upload to stories storage
      const fileName = `${user.id}/${Date.now()}-story-${videoFile.name}`;
      const { error: uploadError } = await supabase.storage
        .from("stories")
        .upload(fileName, videoFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("stories")
        .getPublicUrl(fileName);

      // Create story (expires in 24 hours)
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      const { error: storyError } = await supabase
        .from("stories")
        .insert({
          user_id: user.id,
          image_url: publicUrl,
          expires_at: expiresAt.toISOString(),
        });

      if (storyError) throw storyError;

      toast.success("Posted to story!");
      setShowExportDialog(false);
      navigate("/");
    } catch (error) {
      console.error("Error posting story:", error);
      toast.error("Failed to post story");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <Sidebar />
      
      <main className="pt-20 lg:pl-64">
        <div className="max-w-7xl mx-auto px-4 py-6">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-display font-bold gradient-text mb-2">
                Video Editor ⚡
              </h1>
              <p className="text-muted-foreground">
                Create amazing sports content with filters, text, and effects
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={resetEditor}>
                <RotateCcw className="mr-2 h-4 w-4" />
                Reset
              </Button>
              {videoFile && (
                <>
                  <Button variant="outline" onClick={handleShare}>
                    <Share2 className="mr-2 h-4 w-4" />
                    Share
                  </Button>
                  <Button variant="outline" onClick={handleDownload}>
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                  <Button variant="outline" onClick={handleDelete} className="text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </>
              )}
              <Button onClick={exportVideo} disabled={!videoFile}>
                <Send className="mr-2 h-4 w-4" />
                Post
              </Button>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Video Preview */}
            <div className="lg:col-span-2 space-y-4">
              <Card className="glass-effect">
                <CardContent className="p-6">
                  {!videoUrl ? (
                    <div 
                      className="aspect-video rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="w-12 h-12 text-muted-foreground mb-4" />
                      <p className="text-lg font-medium mb-2">Upload a video to start editing</p>
                      <p className="text-sm text-muted-foreground">Max 50MB • MP4, WebM, MOV</p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="video/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Video Player */}
                      <div className="relative aspect-video rounded-xl overflow-hidden bg-black">
                        <video
                          ref={videoRef}
                          src={videoUrl}
                          className="w-full h-full object-contain"
                          style={{ filter: selectedFilter.cssFilter }}
                          onClick={togglePlayPause}
                        />
                        
                        {/* Text Overlays */}
                        {textOverlays.map((overlay) => (
                          <div
                            key={overlay.id}
                            className="absolute cursor-move group"
                            style={{
                              left: `${overlay.x}%`,
                              top: `${overlay.y}%`,
                              fontSize: `${overlay.fontSize}px`,
                              color: overlay.color,
                              fontFamily: overlay.fontFamily,
                              textShadow: "2px 2px 4px rgba(0,0,0,0.8)",
                              transform: "translate(-50%, -50%)",
                            }}
                            onClick={() => removeOverlay(overlay.id)}
                          >
                            {overlay.text}
                            <span className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 text-xs bg-background/80 px-2 py-1 rounded whitespace-nowrap">
                              Click to remove
                            </span>
                          </div>
                        ))}

                        {/* Play/Pause Overlay */}
                        <div 
                          className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
                          onClick={togglePlayPause}
                        >
                          <div className="w-20 h-20 rounded-full bg-background/80 flex items-center justify-center">
                            {isPlaying ? (
                              <Pause className="w-10 h-10" />
                            ) : (
                              <Play className="w-10 h-10 ml-1" />
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Playback Controls */}
                      <div className="flex items-center gap-4">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={togglePlayPause}
                        >
                          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                        </Button>
                        
                        <div className="flex-1">
                          <label className="text-xs text-muted-foreground mb-1 block">
                            Speed: {playbackSpeed}x
                          </label>
                          <Slider
                            value={[playbackSpeed]}
                            onValueChange={([value]) => setPlaybackSpeed(value)}
                            min={0.25}
                            max={2}
                            step={0.25}
                            className="w-full"
                          />
                        </div>
                      </div>

                      {/* Trim Controls */}
                      {duration > 0 && (
                        <div className="space-y-2">
                          <label className="text-sm font-medium flex items-center gap-2">
                            <Scissors className="w-4 h-4 text-primary" />
                            Trim Video: {(duration * trimStart / 100).toFixed(1)}s - {(duration * trimEnd / 100).toFixed(1)}s
                          </label>
                          <div className="flex gap-4">
                            <div className="flex-1">
                              <Slider
                                value={[trimStart]}
                                onValueChange={([value]) => setTrimStart(Math.min(value, trimEnd - 1))}
                                min={0}
                                max={100}
                                step={1}
                              />
                            </div>
                            <div className="flex-1">
                              <Slider
                                value={[trimEnd]}
                                onValueChange={([value]) => setTrimEnd(Math.max(value, trimStart + 1))}
                                min={0}
                                max={100}
                                step={1}
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Editing Tools */}
            <div className="space-y-4">
              <Card className="glass-effect">
                <CardContent className="p-4">
                  <Tabs defaultValue="filters" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="filters">
                        <Sparkles className="w-4 h-4" />
                      </TabsTrigger>
                      <TabsTrigger value="text">
                        <Type className="w-4 h-4" />
                      </TabsTrigger>
                      <TabsTrigger value="stickers">
                        <Sticker className="w-4 h-4" />
                      </TabsTrigger>
                    </TabsList>

                    {/* Filters Tab */}
                    <TabsContent value="filters" className="space-y-3 mt-4">
                      <h3 className="font-semibold text-sm">Filters</h3>
                      <div className="grid grid-cols-2 gap-2">
                        {filters.map((filter) => (
                          <Button
                            key={filter.id}
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedFilter(filter)}
                            className={cn(
                              "flex flex-col h-auto py-3",
                              selectedFilter.id === filter.id && "border-primary bg-primary/10"
                            )}
                          >
                            <span className="text-2xl mb-1">{filter.emoji}</span>
                            <span className="text-xs">{filter.name}</span>
                          </Button>
                        ))}
                      </div>
                    </TabsContent>

                    {/* Text Tab */}
                    <TabsContent value="text" className="space-y-3 mt-4">
                      <h3 className="font-semibold text-sm">Add Text</h3>
                      <div className="space-y-2">
                        <Input
                          placeholder="Enter your text..."
                          value={currentText}
                          onChange={(e) => setCurrentText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") addTextOverlay();
                          }}
                        />
                        <Button 
                          onClick={addTextOverlay} 
                          className="w-full"
                          disabled={!videoUrl}
                        >
                          <Check className="mr-2 h-4 w-4" />
                          Add Text
                        </Button>
                      </div>
                      
                      {textOverlays.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs text-muted-foreground">
                            Active overlays: {textOverlays.length}
                          </p>
                          {textOverlays.map((overlay) => (
                            <div 
                              key={overlay.id}
                              className="text-xs p-2 bg-muted/50 rounded flex justify-between items-center"
                            >
                              <span className="truncate">{overlay.text}</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeOverlay(overlay.id)}
                                className="h-6 w-6 p-0"
                              >
                                ×
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </TabsContent>

                    {/* Stickers Tab */}
                    <TabsContent value="stickers" className="space-y-3 mt-4">
                      <h3 className="font-semibold text-sm">Add Stickers</h3>
                      <div className="grid grid-cols-4 gap-2">
                        {stickers.map((sticker, index) => (
                          <Button
                            key={index}
                            variant="outline"
                            className="h-14 text-3xl p-0"
                            onClick={() => addStickerOverlay(sticker)}
                            disabled={!videoUrl}
                          >
                            {sticker}
                          </Button>
                        ))}
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>

              {/* Quick Tips */}
              <Card className="glass-effect">
                <CardContent className="p-4 space-y-2">
                  <h3 className="font-semibold text-sm flex items-center gap-2">
                    <Zap className="w-4 h-4 text-primary" />
                    Quick Tips
                  </h3>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• Click text/stickers to remove them</li>
                    <li>• Use speed slider for slow-mo or fast effects</li>
                    <li>• Trim sliders cut your video duration</li>
                    <li>• Try combining filters with text overlays</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      {/* Export/Post Dialog */}
      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="w-5 h-5 text-primary" />
              Share Your Video
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Preview */}
            {videoUrl && (
              <div className="aspect-video rounded-lg overflow-hidden bg-black">
                <video
                  src={videoUrl}
                  className="w-full h-full object-cover"
                  style={{ filter: selectedFilter.cssFilter }}
                  controls
                />
              </div>
            )}

            {/* Caption */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                Add a caption (optional)
              </label>
              <Textarea
                value={postCaption}
                onChange={(e) => setPostCaption(e.target.value)}
                placeholder="What's happening in this video?"
                rows={3}
                className="resize-none"
              />
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={postToFeed}
                disabled={exporting}
                className="w-full"
              >
                <ImageIcon className="mr-2 h-4 w-4" />
                {exporting ? "Posting..." : "Post to Feed"}
              </Button>

              <Button
                onClick={postToStory}
                disabled={exporting}
                variant="outline"
                className="w-full"
              >
                <Sparkles className="mr-2 h-4 w-4" />
                {exporting ? "Posting..." : "Post to Story"}
              </Button>
            </div>

            <div className="flex gap-2 pt-2 border-t">
              <Button
                onClick={handleDownload}
                variant="outline"
                size="sm"
                className="flex-1"
              >
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>

              <Button
                onClick={handleShare}
                variant="outline"
                size="sm"
                className="flex-1"
              >
                <Share2 className="mr-2 h-4 w-4" />
                Share Link
              </Button>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              Note: Video processing with effects requires server-side rendering. 
              The original video will be posted.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VideoEditor;
