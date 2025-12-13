import { useTranslation } from "react-i18next";
import Navigation from "@/components/Navigation";
import MobileNav from "@/components/MobileNav";
import Sidebar from "@/components/Sidebar";
import { Clock } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const WatchLater = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <Sidebar />
      <MobileNav />
      
      <main className="pt-20 pb-24 md:pb-8 lg:pl-64 px-4 lg:px-6">
        <div className="py-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 rounded-xl bg-muted">
              <Clock className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                {t("sidebar.watchLater")}
              </h1>
              <p className="text-muted-foreground">
                Videos you saved to watch later
              </p>
            </div>
          </div>
          
          {user ? (
            <div className="text-center py-16">
              <Clock className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-muted-foreground mb-4">Your watch later list is empty</p>
              <Button onClick={() => navigate("/")}>
                Browse Videos
              </Button>
            </div>
          ) : (
            <div className="text-center py-16">
              <Clock className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-muted-foreground mb-4">Sign in to save videos for later</p>
              <Button onClick={() => navigate("/auth")}>
                {t("nav.signIn")}
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default WatchLater;
