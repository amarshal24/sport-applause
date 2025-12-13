import { useTranslation } from "react-i18next";
import Navigation from "@/components/Navigation";
import MobileNav from "@/components/MobileNav";
import Sidebar from "@/components/Sidebar";
import { Compass } from "lucide-react";

const Discover = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <Sidebar />
      <MobileNav />
      
      <main className="pt-20 pb-24 md:pb-8 lg:pl-64 px-4 lg:px-6">
        <div className="py-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 rounded-xl bg-secondary/10">
              <Compass className="h-8 w-8 text-secondary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                {t("sidebar.discover")}
              </h1>
              <p className="text-muted-foreground">
                Explore new sports content and creators
              </p>
            </div>
          </div>
          
          <div className="text-center py-16">
            <Compass className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
            <p className="text-muted-foreground">Discovery features coming soon!</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Discover;
