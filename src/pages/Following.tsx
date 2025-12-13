import { useTranslation } from "react-i18next";
import Navigation from "@/components/Navigation";
import MobileNav from "@/components/MobileNav";
import Sidebar from "@/components/Sidebar";
import { Users } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Following = () => {
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
            <div className="p-3 rounded-xl bg-accent/10">
              <Users className="h-8 w-8 text-accent" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                {t("sidebar.following")}
              </h1>
              <p className="text-muted-foreground">
                Content from creators you follow
              </p>
            </div>
          </div>
          
          {user ? (
            <div className="text-center py-16">
              <Users className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-muted-foreground mb-4">You're not following anyone yet</p>
              <Button onClick={() => navigate("/discover")}>
                Discover Creators
              </Button>
            </div>
          ) : (
            <div className="text-center py-16">
              <Users className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-muted-foreground mb-4">Sign in to see content from people you follow</p>
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

export default Following;
