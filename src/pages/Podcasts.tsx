import { useTranslation } from "react-i18next";
import Navigation from "@/components/Navigation";
import Sidebar from "@/components/Sidebar";
import MobileNav from "@/components/MobileNav";
import PodcastUploader from "@/components/PodcastUploader";
import MyPodcasts from "@/components/MyPodcasts";
import { useState } from "react";
import { Headphones } from "lucide-react";

const Podcasts = () => {
  const { t } = useTranslation();
  const [refreshKey, setRefreshKey] = useState(0);



  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <MobileNav />
      <main className="pt-20 pb-24 md:pb-8 lg:pl-64 px-4 lg:px-6">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 rounded-xl bg-primary/10">
            <Headphones className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {t("quickNav.podcasts")}
            </h1>
            <p className="text-muted-foreground">
              {t("podcasts.subtitle")}
            </p>
          </div>
        </div>
        
        <PodcastUploader onUploadComplete={() => setRefreshKey((k) => k + 1)} />
        <MyPodcasts key={refreshKey} />
      </main>
      <MobileNav />
    </div>
  );
};

export default Podcasts;
