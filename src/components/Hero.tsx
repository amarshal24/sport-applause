import { Button } from "@/components/ui/button";
import { Play, TrendingUp, Users } from "lucide-react";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-hero">
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=1920&q=80')] bg-cover bg-center opacity-20" />
      
      <div className="container relative z-10 px-6 py-20 text-center">
        <div className="animate-slide-up">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            All Sports, All the Time
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Watch. Share. Applaud. The ultimate platform for sports highlights, 
            live action, and connecting with fans worldwide.
          </p>
          
          <div className="flex flex-wrap gap-4 justify-center mb-12">
            <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-glow">
              <Play className="mr-2 h-5 w-5" />
              Start Watching
            </Button>
            <Button size="lg" variant="outline" className="border-primary text-foreground hover:bg-primary/10">
              <Users className="mr-2 h-5 w-5" />
              Join as Creator
            </Button>
          </div>
          
          <p className="text-sm text-muted-foreground mb-8">
            Athletes • Commentators • Media • Fitness Coaches • Entertainment
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="bg-card/80 backdrop-blur-sm p-6 rounded-lg border border-border shadow-card">
              <TrendingUp className="h-8 w-8 text-primary mx-auto mb-3" />
              <h3 className="text-lg font-semibold mb-2">Trending Content</h3>
              <p className="text-sm text-muted-foreground">Discover what's hot in every sport</p>
            </div>
            
            <div className="bg-card/80 backdrop-blur-sm p-6 rounded-lg border border-border shadow-card">
              <Play className="h-8 w-8 text-secondary mx-auto mb-3" />
              <h3 className="text-lg font-semibold mb-2">Short Highlights</h3>
              <p className="text-sm text-muted-foreground">Quick clips of the best moments</p>
            </div>
            
            <div className="bg-card/80 backdrop-blur-sm p-6 rounded-lg border border-border shadow-card">
              <Users className="h-8 w-8 text-accent mx-auto mb-3" />
              <h3 className="text-lg font-semibold mb-2">Build Your Fanbase</h3>
              <p className="text-sm text-muted-foreground">Connect with fans, not just followers</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
