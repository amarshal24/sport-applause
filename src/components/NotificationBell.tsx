import { Bell, CalendarClock, CheckCheck, CircleAlert, CircleCheck, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNotifications } from "@/hooks/useNotifications";
import { useNavigate } from "react-router-dom";

const iconFor = (type: string) => {
  if (type === "payout_paid") return CircleCheck;
  if (type === "payout_failed") return CircleAlert;
  if (type === "payout_scheduled") return CalendarClock;
  return Bell;
};

const NotificationBell = () => {
  const { notifications, unreadCount, markRead, markAllRead, remove } = useNotifications();
  const navigate = useNavigate();

  const open = (link: string | null, id: string) => {
    markRead(id);
    if (!link) return;
    try {
      const url = new URL(link, window.location.origin);
      if (url.origin === window.location.origin) navigate(url.pathname + url.search);
      else window.open(link, "_blank", "noopener");
    } catch {
      /* ignore malformed links */
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0 bg-popover border-border z-50">
        <div className="flex items-center justify-between px-3 py-2 border-b border-border">
          <span className="text-sm font-semibold">Notifications</span>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={markAllRead}>
              <CheckCheck className="h-3.5 w-3.5" />
              Mark all read
            </Button>
          )}
        </div>
        <ScrollArea className="max-h-80">
          {notifications.length === 0 ? (
            <p className="px-3 py-8 text-center text-sm text-muted-foreground">
              No notifications yet.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {notifications.map((n) => {
                const Icon = iconFor(n.type);
                return (
                  <li
                    key={n.id}
                    className={`flex gap-2 px-3 py-2.5 group ${n.read ? "" : "bg-muted/50"}`}
                  >
                    <Icon
                      className={`h-4 w-4 mt-0.5 shrink-0 ${
                        n.type === "payout_failed" ? "text-destructive" : "text-primary"
                      }`}
                    />
                    <button
                      className="flex-1 text-left"
                      onClick={() => open(n.link, n.id)}
                    >
                      <p className="text-sm font-medium leading-snug">{n.title}</p>
                      {n.body && (
                        <p className="text-xs text-muted-foreground mt-0.5">{n.body}</p>
                      )}
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {new Date(n.created_at).toLocaleString()}
                      </p>
                    </button>
                    <button
                      aria-label="Dismiss notification"
                      className="opacity-0 group-hover:opacity-100 transition-opacity self-start text-muted-foreground hover:text-foreground"
                      onClick={() => remove(n.id)}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationBell;
