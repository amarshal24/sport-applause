import { useTranslation } from "react-i18next";
import Navigation from "@/components/Navigation";
import MobileNav from "@/components/MobileNav";
import PodcastUploader from "@/components/PodcastUploader";
import { Headphones } from "lucide-react";

const Podcasts = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="pt-20 pb-24 md:pb-8 px-4 max-w-4xl mx-auto">
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
        
        <PodcastUploader />
      </main>
      <MobileNav />
    </div>
  );
};

export default Podcasts;
