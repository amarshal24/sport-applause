import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  User,
  Gamepad2,
  Video,
  Trophy,
  Quote,
  Headphones,
  Radio,
  Menu,
  X,
  Search,
  Flame,
  Heart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const menuItems = [
  { path: "/", icon: Home, labelKey: "quickNav.home" },
  { path: "/profile", icon: User, labelKey: "quickNav.profile" },
  { path: "/trending", icon: Flame, labelKey: "quickNav.trending" },
  { path: "/trending?tab=top-plays", icon: Trophy, labelKey: "quickNav.topPlays" },
  { path: "/fans", icon: Heart, labelKey: "quickNav.fans" },
  { path: "/games", icon: Gamepad2, labelKey: "quickNav.games" },
  { path: "/editor", icon: Video, labelKey: "quickNav.videoEditor" },
  { path: "/recruiting", icon: Trophy, labelKey: "quickNav.recruiting" },
  { path: "/motivation", icon: Quote, labelKey: "quickNav.motivation" },
  { path: "/podcasts", icon: Headphones, labelKey: "quickNav.podcasts" },
  { path: "/live", icon: Radio, labelKey: "quickNav.liveStreams" },
];

const QuickNavMenu = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
    if (!isOpen) {
      setSearchQuery("");
    }
  }, [isOpen]);

  const handleNavigate = (path: string) => {
    navigate(path);
    setIsOpen(false);
  };

  const filteredItems = menuItems.filter((item) => {
    const label = t(item.labelKey).toLowerCase();
    return label.includes(searchQuery.toLowerCase());
  });

  return (
    <div className="fixed bottom-20 right-4 z-[90] md:bottom-6">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-16 right-0 mb-2 min-w-[200px] rounded-xl border border-border bg-card p-2 shadow-xl"
          >
            <div className="relative mb-2">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                ref={searchInputRef}
                type="text"
                placeholder={t("quickNav.searchPlaceholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-9 text-sm bg-muted/50"
              />
            </div>
            <nav className="flex flex-col gap-1 max-h-[300px] overflow-y-auto">
              {filteredItems.length > 0 ? (
                filteredItems.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <button
                      key={item.path}
                      onClick={() => handleNavigate(item.path)}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{t(item.labelKey)}</span>
                    </button>
                  );
                })
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {t("quickNav.noResults")}
                </p>
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      <Button
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "h-12 w-12 rounded-full shadow-lg transition-all",
          isOpen
            ? "bg-destructive hover:bg-destructive/90"
            : "bg-primary hover:bg-primary/90"
        )}
      >
        <motion.div
          animate={{ rotate: isOpen ? 90 : 0 }}
          transition={{ duration: 0.2 }}
        >
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </motion.div>
      </Button>
    </div>
  );
};

export default QuickNavMenu;
