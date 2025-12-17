import Navigation from "@/components/Navigation";
import Sidebar from "@/components/Sidebar";
import MobileNav from "@/components/MobileNav";
import Stories from "@/components/Stories";
import MoodSelector from "@/components/MoodSelector";
import VideoFeed from "@/components/VideoFeed";
import Hero from "@/components/Hero";
import MusicRecommendations from "@/components/MusicRecommendations";
import { useAuth } from "@/hooks/useAuth";
import { useMusicRecommendations } from "@/hooks/useMusicRecommendations";

const Index = () => {
  const { user, loading } = useAuth();
  const { recommendations, loading: musicLoading } = useMusicRecommendations();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Hero />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <Sidebar />
      <MobileNav />
      
      <main className="pt-20 pb-20 lg:pb-6 lg:pl-64">
        <div className="px-4 lg:px-6 py-6">
          <MoodSelector />
          <Stories />
          <MusicRecommendations recommendations={recommendations} loading={musicLoading} />
          <VideoFeed />
        </div>
      </main>
    </div>
  );
};

export default Index;
