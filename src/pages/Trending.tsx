import { useTranslation } from "react-i18next";
import Navigation from "@/components/Navigation";
import MobileNav from "@/components/MobileNav";
import Sidebar from "@/components/Sidebar";
import { Flame } from "lucide-react";
import VideoFeed from "@/components/VideoFeed";

/**
 * Trending previously used hardcoded mock videos.
 * Until a real ranking algorithm ships, show the live feed (newest first)
 * so users never see fake Unsplash / sample content.
 */
const Trending = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <Sidebar />
      <MobileNav />

      <main className="pt-20 pb-20 lg:pb-6 lg:pl-64">
        <div className="px-4 lg:px-6 pt-4 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-primary/10">
              <Flame className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                {t("sidebar.trending")}
              </h1>
              <p className="text-muted-foreground">
                Latest posts from the community. Ranked trending is coming soon.
              </p>
            </div>
          </div>
        </div>
        <div className="lg:px-6">
          <VideoFeed />
        </div>
      </main>
    </div>
  );
};

export default Trending;
