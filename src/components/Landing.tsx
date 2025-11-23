import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  Trophy, 
  Users, 
  Video, 
  Zap, 
  Heart,
  MessageCircle,
  Share2,
  TrendingUp
} from "lucide-react";

const Landing = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Video,
      title: "Share Your Moments",
      description: "Post photos and videos of your best sports highlights"
    },
    {
      icon: Users,
      title: "Connect with Athletes",
      description: "Follow and interact with athletes from all sports"
    },
    {
      icon: Trophy,
      title: "Multi-Sport Community",
      description: "From basketball to soccer, all sports in one place"
    },
    {
      icon: TrendingUp,
      title: "Grow Your Presence",
      description: "Build your sports profile and gain followers"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-power opacity-20 animate-shimmer"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center space-y-8 animate-fade-in">
            <div className="space-y-4">
              <h1 className="text-5xl md:text-7xl font-display font-bold text-foreground">
                Your Sports
                <span className="block bg-gradient-power bg-clip-text text-transparent">
                  Community Awaits
                </span>
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto">
                Share your athletic journey, connect with fellow athletes, and celebrate every victory
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button 
                size="lg"
                onClick={() => navigate("/auth")}
                className="glass-effect hover-lift text-lg px-8 py-6 shadow-glow"
              >
                Get Started
                <Zap className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                size="lg"
                variant="outline"
                onClick={() => navigate("/auth")}
                className="glass-effect hover-lift text-lg px-8 py-6"
              >
                Sign In
              </Button>
            </div>
          </div>

          {/* Preview Image/Mockup */}
          <div className="mt-16 relative">
            <div className="absolute inset-0 bg-gradient-radial from-primary/20 to-transparent blur-3xl"></div>
            <div className="relative glass-effect rounded-2xl p-4 shadow-steel animate-slide-up">
              <div className="aspect-video bg-muted/30 rounded-lg overflow-hidden border border-border/50">
                <div className="h-full flex items-center justify-center space-x-8 p-8">
                  <div className="flex flex-col items-center space-y-2">
                    <Video className="h-12 w-12 text-primary animate-pulse-glow" />
                    <p className="text-sm text-muted-foreground">Video Feed</p>
                  </div>
                  <div className="flex flex-col items-center space-y-2">
                    <Heart className="h-12 w-12 text-primary animate-pulse-glow" />
                    <p className="text-sm text-muted-foreground">Like & Share</p>
                  </div>
                  <div className="flex flex-col items-center space-y-2">
                    <MessageCircle className="h-12 w-12 text-primary animate-pulse-glow" />
                    <p className="text-sm text-muted-foreground">Comment</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-display font-bold text-foreground mb-4">
            Everything You Need
          </h2>
          <p className="text-xl text-muted-foreground">
            Built for athletes, by athletes
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div 
                key={index}
                className="glass-effect p-6 rounded-xl hover-lift animate-fade-in group cursor-pointer"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="bg-gradient-power p-3 rounded-lg w-fit mb-4 shadow-glow group-hover:scale-110 transition-transform">
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-display font-semibold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* CTA Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="glass-effect rounded-2xl p-12 text-center space-y-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-power opacity-10 animate-shimmer"></div>
          <div className="relative">
            <h2 className="text-4xl font-display font-bold text-foreground mb-4">
              Ready to Join?
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Create your account and start sharing your sports journey today
            </p>
            <Button 
              size="lg"
              onClick={() => navigate("/auth")}
              className="glass-effect hover-lift text-lg px-8 py-6 shadow-glow"
            >
              Sign Up Now
              <Share2 className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Landing;
