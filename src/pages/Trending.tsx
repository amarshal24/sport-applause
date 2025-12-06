import { useTranslation } from "react-i18next";
import Navigation from "@/components/Navigation";
import MobileNav from "@/components/MobileNav";
import Sidebar from "@/components/Sidebar";
import { Flame } from "lucide-react";

const Trending = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <Sidebar />
      <MobileNav />
      
      <main className="pt-20 pb-24 md:pb-8 lg:pl-64 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 rounded-xl bg-primary/10">
              <Flame className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                {t("sidebar.trending")}
              </h1>
              <p className="text-muted-foreground">
                Discover what's hot in sports right now
              </p>
            </div>
          </div>
          
          <div className="text-center py-16">
            <Flame className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
            <p className="text-muted-foreground">Trending content coming soon!</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Trending;
