import { useEffect, useMemo, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Check, CheckCheck, Loader2, Search, Send, X } from "lucide-react";
import { useChat } from "@/hooks/useChat";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, isToday, isYesterday } from "date-fns";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sellerId: string;
  listingTitle?: string;
}

const ListingChatDialog = ({ open, onOpenChange, sellerId, listingTitle }: Props) => {
  const { user } = useAuth();
  const { messages, isLoading, sendMessage } = useChat(open ? sellerId : undefined);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [seller, setSeller] = useState<{ username: string; avatar_url: string | null } | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [sender, setSender] = useState<"all" | "mine" | "theirs">("all");
  const [period, setPeriod] = useState<"all" | "today" | "week" | "month">("all");

  const isFiltering = query.trim().length > 0 || sender !== "all" || period !== "all";

  const visibleMessages = useMemo(() => {
    const q = query.trim().toLowerCase();
    const now = Date.now();
    const cutoff =
      period === "today"
        ? new Date(new Date().setHours(0, 0, 0, 0)).getTime()
        : period === "week"
          ? now - 7 * 864e5
          : period === "month"
            ? now - 30 * 864e5
            : 0;
    return messages.filter((m) => {
      if (q && !m.content.toLowerCase().includes(q)) return false;
      if (sender === "mine" && !m.isMine) return false;
      if (sender === "theirs" && m.isMine) return false;
      if (cutoff && new Date(m.createdAt).getTime() < cutoff) return false;
      return true;
    });
  }, [messages, query, sender, period]);

  const highlight = (text: string) => {
    const q = query.trim();
    if (!q) return text;
    const parts = text.split(new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "ig"));
    return parts.map((part, i) =>
      part.toLowerCase() === q.toLowerCase() ? (
        <mark key={i} className="rounded bg-accent px-0.5 text-accent-foreground">
          {part}
        </mark>
      ) : (
        <span key={i}>{part}</span>
      ),
    );
  };

  const clearFilters = () => {
    setQuery("");
    setSender("all");
    setPeriod("all");
  };


  const dayLabel = (iso: string) => {
    const d = new Date(iso);
    if (isToday(d)) return "Today";
    if (isYesterday(d)) return "Yesterday";
    return format(d, "MMMM d, yyyy");
  };

  useEffect(() => {
    if (!open) return;
    setDraft(listingTitle ? `Hi! I'm interested in your listing "${listingTitle}". Is it still available?` : "");
    supabase
      .from("profiles")
      .select("username, avatar_url")
      .eq("id", sellerId)
      .maybeSingle()
      .then(({ data }) => setSeller(data ?? null));
  }, [open, sellerId, listingTitle]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const handleSend = async () => {
    const content = draft.trim();
    if (!content) return;
    if (!user) return toast.error("Sign in to message the seller");
    setSending(true);
    const ok = await sendMessage(content.slice(0, 2000));
    setSending(false);
    if (ok) setDraft("");
    else toast.error("Could not send message");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={seller?.avatar_url ?? undefined} alt={seller?.username ?? "Seller"} />
              <AvatarFallback>{(seller?.username ?? "S")[0].toUpperCase()}</AvatarFallback>
            </Avatar>
            <span className="truncate">{seller?.username ?? "Seller"}</span>
          </DialogTitle>
        </DialogHeader>

        {listingTitle && (
          <p className="text-xs text-muted-foreground truncate">About: {listingTitle}</p>
        )}

        <div className="h-72 overflow-y-auto space-y-2 rounded-lg bg-muted/30 p-3">
          {isLoading ? (
            <div className="flex h-full items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : messages.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center pt-10">
              Start the conversation with the seller.
            </p>
          ) : (
            messages.map((m, i) => {
              const prev = messages[i - 1];
              const showDay = !prev || dayLabel(prev.createdAt) !== dayLabel(m.createdAt);
              return (
                <div key={m.id}>
                  {showDay && (
                    <p className="my-2 text-center text-[10px] uppercase tracking-wide text-muted-foreground">
                      {dayLabel(m.createdAt)}
                    </p>
                  )}
                  <div className={`flex ${m.isMine ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${
                        m.isMine ? "bg-primary text-primary-foreground" : "bg-card border border-border"
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words">{m.content}</p>
                      <div className="mt-1 flex items-center justify-end gap-1 text-[10px] opacity-70">
                        <span>{format(new Date(m.createdAt), "p")}</span>
                        {m.isMine &&
                          (m.read ? (
                            <CheckCheck className="h-3 w-3" aria-label="Seen" />
                          ) : (
                            <Check className="h-3 w-3" aria-label="Sent" />
                          ))}
                      </div>
                    </div>
                  </div>
                  {m.isMine && m.id === lastMineId && m.read && (
                    <p className="mt-0.5 pr-1 text-right text-[10px] text-muted-foreground">
                      Seen{m.readAt ? ` ${format(new Date(m.readAt), isToday(new Date(m.readAt)) ? "p" : "MMM d, p")}` : ""}
                    </p>
                  )}
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        <div className="flex items-end gap-2">
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={2}
            placeholder="Write a message..."
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <Button size="icon" onClick={handleSend} disabled={sending || !draft.trim()} aria-label="Send message">
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ListingChatDialog;
