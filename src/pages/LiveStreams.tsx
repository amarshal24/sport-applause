import { useTranslation } from "react-i18next";
import Navigation from "@/components/Navigation";
import MobileNav from "@/components/MobileNav";
import LiveStreamManager from "@/components/LiveStreamManager";
import { Radio } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const LiveStreams = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="pt-20 pb-24 md:pb-8 px-4 max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 rounded-xl bg-destructive/10">
            <Radio className="h-8 w-8 text-destructive" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {t("quickNav.liveStreams")}
            </h1>
            <p className="text-muted-foreground">
              {t("liveStreams.subtitle")}
            </p>
          </div>
        </div>
        
        {user ? (
          <LiveStreamManager />
        ) : (
          <div className="text-center py-16">
            <Radio className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
            <h2 className="text-xl font-semibold mb-2">{t("liveStreams.signInRequired")}</h2>
            <p className="text-muted-foreground mb-6">{t("liveStreams.signInMessage")}</p>
            <Button onClick={() => navigate("/auth")}>
              {t("nav.signIn")}
            </Button>
          </div>
        )}
      </main>
      <MobileNav />
    </div>
  );
};

export default LiveStreams;
