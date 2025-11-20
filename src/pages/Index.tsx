import Navigation from "@/components/Navigation";
import Hero from "@/components/Hero";
import VideoFeed from "@/components/VideoFeed";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="pt-20">
        <Hero />
        <VideoFeed />
      </div>
    </div>
  );
};

export default Index;
