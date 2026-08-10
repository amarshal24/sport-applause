import Navigation from "@/components/Navigation";
import Sidebar from "@/components/Sidebar";
import MobileNav from "@/components/MobileNav";
import Stories from "@/components/Stories";
import VideoFeed from "@/components/VideoFeed";
import Hero from "@/components/Hero";
import MusicRecommendations from "@/components/MusicRecommendations";
import UnifiedComposer from "@/components/UnifiedComposer";
import LiveNowFeed from "@/components/LiveNowFeed";
import MarketplaceHighlights from "@/components/MarketplaceHighlights";
import { useAuth } from "@/hooks/useAuth";
import { useMusicRecommendations } from "@/hooks/useMusicRecommendations";
import { useState } from "react";

const Index = () => {
  const { user, loading } = useAuth();
  const { recommendations, loading: musicLoading } = useMusicRecommendations();
  const [refreshKey, setRefreshKey] = useState(0);
  const [composerMode, setComposerMode] = useState<"post" | "story">("post");
  const [storyFocusKey, setStoryFocusKey] = useState(0);

  const handlePostCreated = () => {
    setRefreshKey(prev => prev + 1);
    setComposerMode("post");
  };

  const handleCreateStory = () => {
    // Always bump focus key so composer re-enters story mode even if
    // parent mode was already "story" (local Post tab desync).
    setComposerMode("story");
    setStoryFocusKey((k) => k + 1);
  };

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
      
      <main className="pt-20 pb-20 lg:pb-6 lg:pl-64 w-full">
        <div className="px-4 lg:px-6 pt-4 pb-3 space-y-3 w-full">
          <Stories onCreateStory={handleCreateStory} refreshKey={refreshKey} />
          <div className="mt-3">
            <LiveNowFeed compact />
          </div>
          <UnifiedComposer
            onPostCreated={handlePostCreated}
            initialMode={composerMode}
            storyFocusKey={storyFocusKey}
          />
          <MarketplaceHighlights />
          <MusicRecommendations recommendations={recommendations} loading={musicLoading} />
        </div>
        <div className="lg:px-6 mt-2">
          <p className="px-4 lg:px-0 mb-2 text-sm text-muted-foreground">
            For You — scroll inside the player; swipe up for the next clip
          </p>
          <VideoFeed key={refreshKey} />
        </div>
      </main>
    </div>
  );
};

export default Index;
