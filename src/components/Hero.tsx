import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Play, TrendingUp, Users, Video, GraduationCap, Zap, Heart, Sparkles, Film, Globe, Mic } from "lucide-react";
import { useNavigate } from "react-router-dom";
import LivePreview from "./LivePreview";
import DemoVideoModal from "./DemoVideoModal";

const Hero = () => {
  const navigate = useNavigate();
  const [showDemo, setShowDemo] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-hero">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=1200&q=50&fm=webp&auto=format&fit=crop')] bg-cover bg-center opacity-20" />
        
        <div className="container relative z-10 px-6 py-20 text-center">
          <div className="animate-slide-up">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              All Sports, All the Time
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              The only platform where athletes showcase talent, fans discover moments, 
              and recruiters find the next generation of champions.
            </p>
            
            <div className="flex flex-wrap gap-4 justify-center mb-6">
              <Button 
                size="lg" 
                className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-glow"
                onClick={() => navigate('/auth')}
              >
                <Play className="mr-2 h-5 w-5" />
                Start Watching
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-primary text-foreground hover:bg-primary/10"
                onClick={() => navigate('/auth')}
              >
                <Users className="mr-2 h-5 w-5" />
                Join as Creator
              </Button>
            </div>

            <Button
              variant="ghost"
              size="lg"
              className="mb-8 text-muted-foreground hover:text-foreground"
              onClick={() => setShowDemo(true)}
            >
              <Video className="mr-2 h-5 w-5" />
              Watch Demo
            </Button>
            
            <p className="text-sm text-muted-foreground mb-8">
              Athletes • Commentators • Media • Fitness Coaches • Entertainment
            </p>
          </div>
        </div>
      </section>

      {/* Live Preview Section */}
      <LivePreview />

      {/* What Makes Us Different Section */}
      <section className="py-20 px-6 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">What Makes U⚡️Sportz Different?</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              We're not just another social media app. We're a complete sports ecosystem built for athletes, 
              fans, and recruiters with features you won't find anywhere else.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            <Card className="border-2 hover:border-primary transition-colors">
              <CardHeader>
                <Film className="h-12 w-12 text-primary mb-4" />
                <CardTitle>Professional Video Editor</CardTitle>
                <CardDescription>
                  Built-in video editing tools to create highlight reels with filters, text overlays, 
                  and effects. Export to your feed, stories, or download instantly.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-secondary transition-colors">
              <CardHeader>
                <GraduationCap className="h-12 w-12 text-secondary mb-4" />
                <CardTitle>Recruiting Platform</CardTitle>
                <CardDescription>
                  Athletes can upload 3-minute highlight reels with stats, position info, and contact details. 
                  College recruiters and pro scouts view profiles designed for talent discovery.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-accent transition-colors">
              <CardHeader>
                <Heart className="h-12 w-12 text-accent mb-4" />
                <CardTitle>Mood-Based Content</CardTitle>
                <CardDescription>
                  Filter your feed by emotion—watch motivational clips when you need inspiration, 
                  epic moments for energy, or relaxing content to wind down.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-primary transition-colors">
              <CardHeader>
                <Sparkles className="h-12 w-12 text-primary mb-4" />
                <CardTitle>24-Hour Stories</CardTitle>
                <CardDescription>
                  Share behind-the-scenes training, game day preparation, or quick updates that 
                  disappear after 24 hours—just like your favorite social apps.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-secondary transition-colors">
              <CardHeader>
                <Globe className="h-12 w-12 text-secondary mb-4" />
                <CardTitle>All Sports, One Platform</CardTitle>
                <CardDescription>
                  From football to swimming, basketball to soccer—every sport has a home here. 
                  Filter by sport, follow your favorites, discover new ones.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-accent transition-colors">
              <CardHeader>
                <Zap className="h-12 w-12 text-accent mb-4" />
                <CardTitle>Interactive Games</CardTitle>
              <CardDescription>
                Test your sports knowledge with trivia, guess the sport challenges, and athlete 
                matching games. Compete with fans and climb the leaderboards.
              </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-primary transition-colors">
              <CardHeader>
                <Mic className="h-12 w-12 text-primary mb-4" />
                <CardTitle>Podcasts & Live Streams</CardTitle>
                <CardDescription>
                  Share your sports insights through podcasts or broadcast live. Athletes, coaches, 
                  and commentators can engage audiences with long-form audio content and real-time streaming.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Grid Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Everything You Need</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              From creation to connection, we've built the ultimate sports platform
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="text-center">
              <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Trending Content</h3>
              <p className="text-muted-foreground">
                Discover what's hot across all sports with real-time trending highlights
              </p>
            </div>

            <div className="text-center">
              <div className="bg-secondary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Video className="h-8 w-8 text-secondary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Quick Clips</h3>
              <p className="text-muted-foreground">
                Short, snackable highlights perfect for mobile viewing on the go
              </p>
            </div>

            <div className="text-center">
              <div className="bg-accent/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-accent" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Community First</h3>
              <p className="text-muted-foreground">
                Build genuine connections with fans who share your passion for sports
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-gradient-to-r from-primary/20 via-secondary/20 to-accent/20">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">Ready to Join the Action?</h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Whether you're an athlete looking to get recruited, a fan chasing the best moments, 
            or a creator building your brand—U⚡️Sportz is your platform.
          </p>
          <Button 
            size="lg" 
            className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-glow"
            onClick={() => navigate('/auth')}
          >
            Get Started Free
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-border">
        <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} USportz. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <button 
              onClick={() => navigate('/terms')}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Terms of Service
            </button>
            <button 
              onClick={() => navigate('/privacy')}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Privacy Policy
            </button>
          </div>
        </div>
      </footer>

      {/* Demo Video Modal */}
      <DemoVideoModal open={showDemo} onOpenChange={setShowDemo} />
    </div>
  );
};

export default Hero;
