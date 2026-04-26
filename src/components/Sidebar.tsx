import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Home, Flame, User, TrendingUp, Heart, Trophy, Gamepad2, MessageCircle, Film, GraduationCap, Mail, ClipboardList } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { Button } from "@/components/ui/button";

const Sidebar = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <aside className="fixed left-0 top-20 h-[calc(100vh-5rem)] w-64 bg-card/50 backdrop-blur-lg border-r border-border p-4 hidden lg:block overflow-y-auto">
      <div className="space-y-1">
        <NavLink 
          to="/" 
          end 
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:bg-muted transition-colors"
          activeClassName="bg-primary/10 text-primary font-medium"
        >
          <Home className="h-5 w-5" />
          <span>{t("sidebar.home")}</span>
        </NavLink>

        <NavLink 
          to="/trending" 
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:bg-muted transition-colors"
          activeClassName="bg-primary/10 text-primary font-medium"
        >
          <Flame className="h-5 w-5" />
          <span>{t("sidebar.trending")}</span>
        </NavLink>

        <NavLink 
          to="/fans" 
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:bg-muted transition-colors"
          activeClassName="bg-primary/10 text-primary font-medium"
        >
          <Heart className="h-5 w-5" />
          <span>{t("sidebar.fans")}</span>
        </NavLink>
      </div>

      <div className="border-t border-border my-4" />

      <div className="space-y-1">
        <p className="px-4 py-2 text-sm font-semibold text-muted-foreground">{t("sidebar.categories")}</p>
        
        <NavLink 
          to="/recruiting" 
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:bg-muted transition-colors"
          activeClassName="bg-primary/10 text-primary font-medium"
        >
          <GraduationCap className="h-5 w-5" />
          <span>{t("sidebar.getRecruited")}</span>
        </NavLink>

        <NavLink 
          to="/recruiter-dashboard" 
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:bg-muted transition-colors"
          activeClassName="bg-primary/10 text-primary font-medium"
        >
          <ClipboardList className="h-5 w-5" />
          <span>Recruiter Dashboard</span>
        </NavLink>

        <NavLink 
          to="/motivation" 
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:bg-muted transition-colors"
          activeClassName="bg-primary/10 text-primary font-medium"
        >
          <MessageCircle className="h-5 w-5" />
          <span>{t("sidebar.dailyMotivation")}</span>
        </NavLink>

        <NavLink 
          to="/games" 
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:bg-muted transition-colors"
          activeClassName="bg-primary/10 text-primary font-medium"
        >
          <Gamepad2 className="h-5 w-5" />
          <span>{t("sidebar.games")}</span>
        </NavLink>

        <NavLink 
          to="/top-plays" 
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:bg-muted transition-colors"
          activeClassName="bg-primary/10 text-primary font-medium"
        >
          <Trophy className="h-5 w-5" />
          <span>{t("sidebar.topPlays")}</span>
        </NavLink>

        <NavLink 
          to="/live" 
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:bg-muted transition-colors"
          activeClassName="bg-primary/10 text-primary font-medium"
        >
          <TrendingUp className="h-5 w-5" />
          <span>{t("sidebar.live")}</span>
        </NavLink>

        
        <NavLink 
          to="/messages" 
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:bg-muted transition-colors"
          activeClassName="bg-primary/10 text-primary font-medium"
        >
          <Mail className="h-5 w-5" />
          <span>{t("sidebar.messages")}</span>
        </NavLink>
      </div>

      <div className="border-t border-border my-4" />

      <NavLink to="/editor">
        <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
          <Film className="mr-2 h-4 w-4" />
          {t("sidebar.createVideo")}
        </Button>
      </NavLink>

      <div className="mt-6 p-4 bg-muted/50 rounded-lg">
        <p className="text-xs text-muted-foreground mb-2">{t("sidebar.joinUs")}</p>
        <p className="text-sm mb-3">{t("sidebar.shareMessage")}</p>
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full"
          onClick={() => navigate("/auth")}
        >
          <User className="mr-2 h-4 w-4" />
          {t("sidebar.signUp")}
        </Button>
      </div>
    </aside>
  );
};

export default Sidebar;
