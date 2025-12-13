import { useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import Navigation from "@/components/Navigation";
import MobileNav from "@/components/MobileNav";
import Sidebar from "@/components/Sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { Flame, Play, Pause, Heart, MessageCircle, Share2, Eye, TrendingUp, X, ThumbsUp, Bookmark, Volume2, VolumeX, Maximize, SkipBack, SkipForward } from "lucide-react";

const trendingVideos = [
  {
    id: "1",
    title: "Incredible Last-Second Buzzer Beater!",
    thumbnail: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&q=80",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    sport: "Basketball",
    views: "2.4M",
    likes: "156K",
    comments: "8.2K",
    creator: "SportsCenter",
    creatorAvatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&q=80",
    duration: "0:45",
    trending: 1,
  },
  {
    id: "2",
    title: "Unbelievable 60-Yard Touchdown Pass",
    thumbnail: "https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=800&q=80",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    sport: "Football",
    views: "1.8M",
    likes: "98K",
    comments: "5.1K",
    creator: "NFL Highlights",
    creatorAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80",
    duration: "1:12",
    trending: 2,
  },
  {
    id: "3",
    title: "World Record 100m Sprint - Historic Moment",
    thumbnail: "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=800&q=80",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    sport: "Track & Field",
    views: "3.1M",
    likes: "245K",
    comments: "12K",
    creator: "Olympic Channel",
    creatorAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&q=80",
    duration: "0:32",
    trending: 3,
  },
  {
    id: "4",
    title: "Bicycle Kick Goal of the Season",
    thumbnail: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&q=80",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    sport: "Soccer",
    views: "4.2M",
    likes: "320K",
    comments: "18K",
    creator: "Goals & Glory",
    creatorAvatar: "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=100&q=80",
    duration: "0:28",
    trending: 4,
  },
  {
    id: "5",
    title: "Knockout in 12 Seconds - Fastest Ever",
    thumbnail: "https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=800&q=80",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
    sport: "Boxing",
    views: "5.6M",
    likes: "412K",
    comments: "25K",
    creator: "Fight Night",
    creatorAvatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&q=80",
    duration: "0:18",
    trending: 5,
  },
  {
    id: "6",
    title: "Triple Axel Perfection on Ice",
    thumbnail: "https://images.unsplash.com/photo-1551892374-ecf8754cf8b0?w=800&q=80",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
    sport: "Figure Skating",
    views: "890K",
    likes: "67K",
    comments: "3.4K",
    creator: "Winter Sports",
    creatorAvatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&q=80",
    duration: "1:05",
    trending: 6,
  },
];

const Trending = () => {
  const { t } = useTranslation();
  const [likedVideos, setLikedVideos] = useState<string[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<typeof trendingVideos[0] | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const toggleLike = (videoId: string) => {
    setLikedVideos((prev) =>
      prev.includes(videoId)
        ? prev.filter((id) => id !== videoId)
        : [...prev, videoId]
    );
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleSeek = (value: number[]) => {
    if (videoRef.current) {
      videoRef.current.currentTime = value[0];
      setCurrentTime(value[0]);
    }
  };

  const handleVolumeChange = (value: number[]) => {
    if (videoRef.current) {
      const newVolume = value[0];
      videoRef.current.volume = newVolume;
      setVolume(newVolume);
      setIsMuted(newVolume === 0);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const skip = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime += seconds;
    }
  };

  const toggleFullscreen = () => {
    if (videoRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        videoRef.current.requestFullscreen();
      }
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const closeVideo = () => {
    setSelectedVideo(null);
    setIsPlaying(false);
    setCurrentTime(0);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <Sidebar />
      <MobileNav />

      <main className="pt-20 pb-24 md:pb-8 lg:pl-64 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500/20 to-red-500/20">
              <Flame className="h-8 w-8 text-orange-500" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                {t("sidebar.trending")}
              </h1>
              <p className="text-muted-foreground">
                Discover what's hot in sports right now
              </p>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card className="bg-gradient-to-br from-orange-500/10 to-red-500/10 border-orange-500/20">
              <CardContent className="p-4 flex items-center gap-3">
                <TrendingUp className="h-8 w-8 text-orange-500" />
                <div>
                  <p className="text-2xl font-bold text-foreground">17.9M</p>
                  <p className="text-xs text-muted-foreground">Total Views Today</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-pink-500/10 to-rose-500/10 border-pink-500/20">
              <CardContent className="p-4 flex items-center gap-3">
                <Heart className="h-8 w-8 text-pink-500" />
                <div>
                  <p className="text-2xl font-bold text-foreground">1.3M</p>
                  <p className="text-xs text-muted-foreground">Likes Today</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/20">
              <CardContent className="p-4 flex items-center gap-3">
                <MessageCircle className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold text-foreground">71.7K</p>
                  <p className="text-xs text-muted-foreground">Comments Today</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20">
              <CardContent className="p-4 flex items-center gap-3">
                <Share2 className="h-8 w-8 text-green-500" />
                <div>
                  <p className="text-2xl font-bold text-foreground">245K</p>
                  <p className="text-xs text-muted-foreground">Shares Today</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Trending Videos Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trendingVideos.map((video) => (
              <Card
                key={video.id}
                className="overflow-hidden hover-lift bg-card border-border group cursor-pointer"
                onClick={() => setSelectedVideo(video)}
              >
                <div className="relative aspect-video">
                  <img
                    src={video.thumbnail}
                    alt={video.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  
                  {/* Trending Badge */}
                  <Badge className="absolute top-2 left-2 bg-gradient-to-r from-orange-500 to-red-500 text-white border-0">
                    <Flame className="h-3 w-3 mr-1" />
                    #{video.trending} Trending
                  </Badge>
                  
                  {/* Duration */}
                  <span className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
                    {video.duration}
                  </span>
                  
                  {/* Play Button Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="bg-primary/90 rounded-full p-4">
                      <Play className="h-8 w-8 text-primary-foreground fill-current" />
                    </div>
                  </div>
                </div>

                <CardContent className="p-4">
                  <div className="flex gap-3">
                    <img
                      src={video.creatorAvatar}
                      alt={video.creator}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground line-clamp-2 mb-1">
                        {video.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">{video.creator}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {video.views}
                        </span>
                        <Badge variant="secondary" className="text-xs">
                          {video.sport}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
                    <Button
                      variant="ghost"
                      size="sm"
                      className={likedVideos.includes(video.id) ? "text-pink-500" : "text-muted-foreground"}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleLike(video.id);
                      }}
                    >
                      <Heart
                        className={`h-4 w-4 mr-1 ${likedVideos.includes(video.id) ? "fill-current" : ""}`}
                      />
                      {video.likes}
                    </Button>
                    <Button variant="ghost" size="sm" className="text-muted-foreground">
                      <MessageCircle className="h-4 w-4 mr-1" />
                      {video.comments}
                    </Button>
                    <Button variant="ghost" size="sm" className="text-muted-foreground">
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>

      {/* Video Player Modal */}
      <Dialog open={!!selectedVideo} onOpenChange={closeVideo}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden bg-card border-border">
          {selectedVideo && (
            <div className="flex flex-col">
              {/* Video Player Area */}
              <div className="relative aspect-video bg-black group">
                <video
                  ref={videoRef}
                  src={selectedVideo.videoUrl}
                  poster={selectedVideo.thumbnail}
                  className="w-full h-full object-contain"
                  onTimeUpdate={handleTimeUpdate}
                  onLoadedMetadata={handleLoadedMetadata}
                  onEnded={() => setIsPlaying(false)}
                  onClick={togglePlay}
                />
                
                {/* Play/Pause Overlay */}
                {!isPlaying && (
                  <div 
                    className="absolute inset-0 flex items-center justify-center bg-black/40 cursor-pointer"
                    onClick={togglePlay}
                  >
                    <Button
                      size="lg"
                      className="rounded-full h-20 w-20 bg-primary/90 hover:bg-primary"
                    >
                      <Play className="h-10 w-10 fill-current" />
                    </Button>
                  </div>
                )}

                {/* Video Controls */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  {/* Progress Bar */}
                  <Slider
                    value={[currentTime]}
                    max={duration || 100}
                    step={0.1}
                    onValueChange={handleSeek}
                    className="mb-3"
                  />
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-white hover:bg-white/20"
                        onClick={() => skip(-10)}
                      >
                        <SkipBack className="h-5 w-5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-white hover:bg-white/20"
                        onClick={togglePlay}
                      >
                        {isPlaying ? (
                          <Pause className="h-6 w-6" />
                        ) : (
                          <Play className="h-6 w-6 fill-current" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-white hover:bg-white/20"
                        onClick={() => skip(10)}
                      >
                        <SkipForward className="h-5 w-5" />
                      </Button>
                      
                      <div className="flex items-center gap-2 ml-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-white hover:bg-white/20"
                          onClick={toggleMute}
                        >
                          {isMuted ? (
                            <VolumeX className="h-5 w-5" />
                          ) : (
                            <Volume2 className="h-5 w-5" />
                          )}
                        </Button>
                        <Slider
                          value={[isMuted ? 0 : volume]}
                          max={1}
                          step={0.1}
                          onValueChange={handleVolumeChange}
                          className="w-20"
                        />
                      </div>
                      
                      <span className="text-white text-sm ml-3">
                        {formatTime(currentTime)} / {formatTime(duration)}
                      </span>
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-white hover:bg-white/20"
                      onClick={toggleFullscreen}
                    >
                      <Maximize className="h-5 w-5" />
                    </Button>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white"
                  onClick={closeVideo}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Video Info */}
              <div className="p-6">
                <div className="flex items-start gap-4">
                  <img
                    src={selectedVideo.creatorAvatar}
                    alt={selectedVideo.creator}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-foreground mb-1">
                      {selectedVideo.title}
                    </h2>
                    <p className="text-muted-foreground">{selectedVideo.creator}</p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        {selectedVideo.views} views
                      </span>
                      <Badge variant="secondary">{selectedVideo.sport}</Badge>
                      <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white border-0">
                        <Flame className="h-3 w-3 mr-1" />
                        #{selectedVideo.trending} Trending
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-3 mt-6 pt-4 border-t border-border">
                  <Button
                    variant={likedVideos.includes(selectedVideo.id) ? "default" : "outline"}
                    className={likedVideos.includes(selectedVideo.id) ? "bg-pink-500 hover:bg-pink-600" : ""}
                    onClick={() => toggleLike(selectedVideo.id)}
                  >
                    <Heart className={`h-4 w-4 mr-2 ${likedVideos.includes(selectedVideo.id) ? "fill-current" : ""}`} />
                    {selectedVideo.likes}
                  </Button>
                  <Button variant="outline">
                    <ThumbsUp className="h-4 w-4 mr-2" />
                    Like
                  </Button>
                  <Button variant="outline">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    {selectedVideo.comments}
                  </Button>
                  <Button variant="outline">
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                  <Button variant="outline">
                    <Bookmark className="h-4 w-4 mr-2" />
                    Save
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Trending;