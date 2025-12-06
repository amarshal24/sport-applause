import { useTranslation } from "react-i18next";
import { Home, Gamepad2, GraduationCap, MessageCircle, User } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/hooks/useAuth";

const MobileNav = () => {
  const { t } = useTranslation();
  const { user } = useAuth();

  const navItems = [
    { to: "/", icon: Home, label: t("nav.home"), end: true },
    { to: "/games", icon: Gamepad2, label: t("nav.games") },
    { to: "/recruiting", icon: GraduationCap, label: t("nav.recruit") },
    { to: "/motivation", icon: MessageCircle, label: t("nav.motivate") },
    { to: user ? "/profile" : "/auth", icon: User, label: user ? t("nav.profile") : t("nav.signIn") },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-lg border-t border-border lg:hidden safe-area-bottom">
      <div className="flex items-center justify-around py-2 px-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-muted-foreground transition-colors min-w-[60px]"
            activeClassName="text-primary"
          >
            <item.icon className="h-5 w-5" />
            <span className="text-[10px] font-medium">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default MobileNav;
