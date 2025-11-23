import { useAuth } from "@/hooks/useAuth";
import Navigation from "@/components/Navigation";
import Sidebar from "@/components/Sidebar";
import Stories from "@/components/Stories";
import PostComposer from "@/components/PostComposer";
import VideoFeed from "@/components/VideoFeed";
import Landing from "@/components/Landing";

const Index = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Landing />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <Sidebar />
      
      <main className="pt-20 lg:pl-64">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <Stories />
          <PostComposer />
          <VideoFeed />
        </div>
      </main>
    </div>
  );
};

export default Index;
