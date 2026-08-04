import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Send } from "lucide-react";
import { useChat } from "@/hooks/useChat";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";

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
            messages.map((m) => (
              <div key={m.id} className={`flex ${m.isMine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${
                    m.isMine ? "bg-primary text-primary-foreground" : "bg-card border border-border"
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">{m.content}</p>
                  <p className="mt-1 text-[10px] opacity-70">{format(new Date(m.createdAt), "MMM d, p")}</p>
                </div>
              </div>
            ))
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
