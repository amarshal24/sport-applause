import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  Play, Heart, MessageCircle, Share2, Bookmark, 
  Trophy, Gamepad2, Video, Users, TrendingUp,
  Sparkles, Star, Zap
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const mockVideos = [
  { 
    thumbnail: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=400&q=80",
    username: "hoopstar_23",
    sport: "Basketball",
    likes: "12.4K",
    comments: "847"
  },
  { 
    thumbnail: "https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=400&q=80",
    username: "soccer_elite",
    sport: "Soccer",
    likes: "8.2K",
    comments: "423"
  },
  { 
    thumbnail: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=400&q=80",
    username: "gridiron_king",
    sport: "Football",
    likes: "15.1K",
    comments: "1.2K"
  }
];

const mockStories = [
  { avatar: "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=100&q=80", name: "Mike" },
  { avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80", name: "Sarah" },
  { avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80", name: "James" },
  { avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&q=80", name: "Emily" },
];

const mockGames = [
  { name: "Basketball", icon: "🏀", score: 2450 },
  { name: "Soccer", icon: "⚽", score: 1820 },
  { name: "Football", icon: "🏈", score: 3100 },
];

const LivePreview = () => {
  const navigate = useNavigate();
  const [activeVideo, setActiveVideo] = useState(0);
  const [showLike, setShowLike] = useState(false);
  const [activeTab, setActiveTab] = useState<"feed" | "games" | "recruiting">("feed");

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveVideo((prev) => (prev + 1) % mockVideos.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const likeInterval = setInterval(() => {
      setShowLike(true);
      setTimeout(() => setShowLike(false), 1000);
    }, 5000);
    return () => clearInterval(likeInterval);
  }, []);

  return (
    <section className="py-20 px-6 bg-background relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-mesh opacity-50" />
      
      <div className="container mx-auto relative z-10">
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              See It In Action
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Take a peek at what awaits you inside U⚡️Sportz
            </p>
          </motion.div>
        </div>

        {/* Tab Selector */}
        <div className="flex justify-center gap-2 mb-8">
          {[
            { id: "feed", label: "Video Feed", icon: Video },
            { id: "games", label: "Mini Games", icon: Gamepad2 },
            { id: "recruiting", label: "Get Recruited", icon: Trophy },
          ].map((tab) => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? "default" : "outline"}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className="gap-2"
            >
              <tab.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </Button>
          ))}
        </div>

        {/* Preview Container */}
        <div className="max-w-4xl mx-auto">
          <AnimatePresence mode="wait">
            {activeTab === "feed" && (
              <motion.div
                key="feed"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="grid md:grid-cols-2 gap-6 items-center"
              >
                {/* Phone Mockup */}
                <div className="relative mx-auto">
                  <div className="w-[280px] h-[560px] bg-card rounded-[3rem] p-3 shadow-elevation border-4 border-muted">
                    <div className="w-full h-full bg-background rounded-[2.5rem] overflow-hidden relative">
                      {/* Stories Bar */}
                      <div className="absolute top-0 left-0 right-0 p-3 z-10 bg-gradient-to-b from-background to-transparent">
                        <div className="flex gap-3 overflow-hidden">
                          {mockStories.map((story, i) => (
                            <motion.div
                              key={i}
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ delay: i * 0.1 }}
                              className="flex-shrink-0"
                            >
                              <div className="w-14 h-14 rounded-full bg-gradient-power p-0.5">
                                <img 
                                  src={story.avatar} 
                                  alt={story.name}
                                  className="w-full h-full rounded-full object-cover border-2 border-background"
                                />
                              </div>
                              <p className="text-[10px] text-center mt-1 text-muted-foreground">{story.name}</p>
                            </motion.div>
                          ))}
                        </div>
                      </div>

                      {/* Video Content */}
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={activeVideo}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="absolute inset-0"
                        >
                          <img
                            src={mockVideos[activeVideo].thumbnail}
                            alt="Video preview"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent" />
                        </motion.div>
                      </AnimatePresence>

                      {/* Like Animation */}
                      <AnimatePresence>
                        {showLike && (
                          <motion.div
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 1.5, opacity: 0 }}
                            className="absolute inset-0 flex items-center justify-center pointer-events-none"
                          >
                            <Heart className="w-20 h-20 text-destructive fill-destructive" />
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Video Info */}
                      <div className="absolute bottom-4 left-4 right-16">
                        <p className="font-bold text-foreground">@{mockVideos[activeVideo].username}</p>
                        <p className="text-sm text-muted-foreground">#{mockVideos[activeVideo].sport} highlights 🔥</p>
                      </div>

                      {/* Action Buttons */}
                      <div className="absolute right-3 bottom-20 flex flex-col gap-4">
                        {[
                          { icon: Heart, label: mockVideos[activeVideo].likes },
                          { icon: MessageCircle, label: mockVideos[activeVideo].comments },
                          { icon: Bookmark, label: "" },
                          { icon: Share2, label: "" },
                        ].map((action, i) => (
                          <motion.div
                            key={i}
                            initial={{ x: 20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: i * 0.1 }}
                            className="flex flex-col items-center"
                          >
                            <div className="p-2 rounded-full bg-background/50 backdrop-blur">
                              <action.icon className="w-6 h-6 text-foreground" />
                            </div>
                            {action.label && (
                              <span className="text-xs mt-1 text-foreground">{action.label}</span>
                            )}
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Feature Highlights */}
                <div className="space-y-4">
                  <h3 className="text-2xl font-bold">U⚡️Sportz Highlights Reel</h3>
                  <div className="space-y-3">
                    {[
                      { icon: Play, text: "Endless scrolling sports highlights" },
                      { icon: Heart, text: "Double-tap to like with animations" },
                      { icon: Sparkles, text: "Anime filters & visual effects" },
                      { icon: Users, text: "Follow your favorite athletes" },
                    ].map((feature, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        viewport={{ once: true }}
                        className="flex items-center gap-3"
                      >
                        <div className="p-2 rounded-lg bg-primary/10">
                          <feature.icon className="h-5 w-5 text-primary" />
                        </div>
                        <span className="text-muted-foreground">{feature.text}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "games" && (
              <motion.div
                key="games"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="grid md:grid-cols-2 gap-6 items-center"
              >
                {/* Games Preview */}
                <div className="grid grid-cols-2 gap-4">
                  {mockGames.map((game, i) => (
                    <motion.div
                      key={i}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: i * 0.15 }}
                    >
                      <Card className="p-6 text-center hover:border-primary transition-colors cursor-pointer group">
                        <div className="text-5xl mb-3 group-hover:scale-110 transition-transform">
                          {game.icon}
                        </div>
                        <h4 className="font-semibold mb-1">{game.name}</h4>
                        <p className="text-sm text-muted-foreground">High Score</p>
                        <p className="text-lg font-bold text-primary">{game.score.toLocaleString()}</p>
                      </Card>
                    </motion.div>
                  ))}
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.45 }}
                  >
                    <Card className="p-6 text-center border-dashed border-2 flex flex-col items-center justify-center h-full">
                      <Zap className="h-8 w-8 text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">+ 5 more games</p>
                    </Card>
                  </motion.div>
                </div>

                {/* Games Features */}
                <div className="space-y-4">
                  <h3 className="text-2xl font-bold">Play Sports Mini-Games</h3>
                  <div className="space-y-3">
                    {[
                      { icon: Gamepad2, text: "8 addictive sports games" },
                      { icon: Trophy, text: "Global leaderboards" },
                      { icon: Star, text: "Daily challenges & rewards" },
                      { icon: Users, text: "Multiplayer mode with friends" },
                    ].map((feature, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        viewport={{ once: true }}
                        className="flex items-center gap-3"
                      >
                        <div className="p-2 rounded-lg bg-secondary/10">
                          <feature.icon className="h-5 w-5 text-secondary" />
                        </div>
                        <span className="text-muted-foreground">{feature.text}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "recruiting" && (
              <motion.div
                key="recruiting"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="grid md:grid-cols-2 gap-6 items-center"
              >
                {/* Recruiting Preview */}
                <div className="space-y-4">
                  <Card className="p-4 border-primary/50">
                    <div className="flex gap-4">
                      <div className="w-24 h-32 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                        <img 
                          src="https://images.unsplash.com/photo-1546519638-68e109498ffc?w=200&q=80"
                          alt="Athlete"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold">Marcus Johnson</h4>
                        <p className="text-sm text-muted-foreground">Point Guard • Class of 2026</p>
                        <div className="mt-2 flex flex-wrap gap-1">
                          <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">6'2"</span>
                          <span className="text-xs bg-secondary/20 text-secondary px-2 py-0.5 rounded">180 lbs</span>
                        </div>
                        <div className="mt-2 grid grid-cols-3 gap-2 text-center">
                          <div>
                            <p className="text-lg font-bold text-primary">18.5</p>
                            <p className="text-[10px] text-muted-foreground">PPG</p>
                          </div>
                          <div>
                            <p className="text-lg font-bold text-primary">7.2</p>
                            <p className="text-[10px] text-muted-foreground">APG</p>
                          </div>
                          <div>
                            <p className="text-lg font-bold text-primary">42"</p>
                            <p className="text-[10px] text-muted-foreground">Vert</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <Card className="p-3 bg-muted/50">
                      <div className="flex items-center gap-2 text-sm">
                        <TrendingUp className="h-4 w-4 text-green-500" />
                        <span className="text-muted-foreground">Profile viewed by 12 recruiters this week</span>
                      </div>
                    </Card>
                  </motion.div>
                </div>

                {/* Recruiting Features */}
                <div className="space-y-4">
                  <h3 className="text-2xl font-bold">Get Discovered by Scouts</h3>
                  <div className="space-y-3">
                    {[
                      { icon: Video, text: "Upload 3-min highlight reels" },
                      { icon: Trophy, text: "Compare stats to pro athletes" },
                      { icon: TrendingUp, text: "Track recruiter engagement" },
                      { icon: MessageCircle, text: "Direct messaging with coaches" },
                    ].map((feature, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        viewport={{ once: true }}
                        className="flex items-center gap-3"
                      >
                        <div className="p-2 rounded-lg bg-accent/20">
                          <feature.icon className="h-5 w-5 text-accent-foreground" />
                        </div>
                        <span className="text-muted-foreground">{feature.text}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mt-12"
          >
            <Button 
              size="lg" 
              className="bg-primary hover:bg-primary/90 shadow-glow"
              onClick={() => navigate('/auth')}
            >
              <Zap className="mr-2 h-5 w-5" />
              Join U⚡️Sportz Free
            </Button>
            <p className="text-sm text-muted-foreground mt-3">
              No credit card required • Start in seconds
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default LivePreview;
