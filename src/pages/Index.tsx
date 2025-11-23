import Navigation from "@/components/Navigation";
import Sidebar from "@/components/Sidebar";
import Stories from "@/components/Stories";
import MoodSelector from "@/components/MoodSelector";
import VideoFeed from "@/components/VideoFeed";
import Hero from "@/components/Hero";
import { useAuth } from "@/hooks/useAuth";

const Index = () => {
  const { user, loading } = useAuth();

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
      
      <main className="pt-20 lg:pl-64">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <Stories />
          <MoodSelector />
          <VideoFeed />
        </div>
      </main>
    </div>
  );
};

export default Index;
