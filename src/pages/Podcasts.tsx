import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Sidebar from "@/components/Sidebar";
import MobileNav from "@/components/MobileNav";
import PodcastUploader from "@/components/PodcastUploader";
import MyPodcasts from "@/components/MyPodcasts";
import PodcastBrowser from "@/components/PodcastBrowser";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Headphones } from "lucide-react";

const Podcasts = () => {
  const { t } = useTranslation();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeTab, setActiveTab] = useState("browse");
  const [focusId, setFocusId] = useState<string | null>(null);

  useEffect(() => {
    const id = searchParams.get("id");
    if (id) {
      setFocusId(id);
      setActiveTab("browse");
    }
  }, [searchParams]);

  const clearFocus = useCallback(() => {
    setFocusId(null);
    if (searchParams.has("id")) {
      const next = new URLSearchParams(searchParams);
      next.delete("id");
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <Sidebar />
        <MobileNav />
        <main className="pt-20 pb-24 md:pb-8 lg:pl-64 px-4 lg:px-6">
          <div className="animate-pulse h-40 bg-muted/30 rounded-lg max-w-4xl mx-auto" />
        </main>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <Sidebar />
        <MobileNav />
        <main className="pt-20 pb-24 md:pb-8 lg:pl-64 px-4 lg:px-6">
          <div className="text-center py-16 max-w-md mx-auto">
            <Headphones className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
            <h1 className="text-2xl font-bold mb-2">{t("quickNav.podcasts")}</h1>
            <p className="text-muted-foreground mb-4">
              {t("podcasts.signInMessage")}
            </p>
            <Button onClick={() => navigate("/auth")}>{t("nav.signIn")}</Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <Sidebar />
      <MobileNav />
      <main className="pt-20 pb-24 md:pb-8 lg:pl-64 px-4 lg:px-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 rounded-xl bg-primary/10">
              <Headphones className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                {t("quickNav.podcasts")}
              </h1>
              <p className="text-muted-foreground">{t("podcasts.subtitle")}</p>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="browse">{t("podcasts.browse")}</TabsTrigger>
              <TabsTrigger value="mine">{t("podcasts.mine")}</TabsTrigger>
            </TabsList>

            <TabsContent value="browse" className="mt-0">
              <PodcastBrowser focusId={focusId} onFocusConsumed={clearFocus} />
            </TabsContent>

            <TabsContent value="mine" className="mt-0 space-y-8">
              <PodcastUploader onUploadComplete={() => setRefreshKey((k) => k + 1)} />
              <MyPodcasts key={refreshKey} />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default Podcasts;
