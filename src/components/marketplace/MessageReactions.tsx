import { useMemo, useState } from "react";
import { SmilePlus } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CHAT_REACTIONS, type MessageReaction } from "@/hooks/useChat";
import { cn } from "@/lib/utils";

interface Props {
  messageId: string;
  reactions: MessageReaction[];
  currentUserId?: string;
  isMine: boolean;
  onToggle: (messageId: string, emoji: string) => void;
}

const MessageReactions = ({ messageId, reactions, currentUserId, isMine, onToggle }: Props) => {
  const [open, setOpen] = useState(false);

  const grouped = useMemo(() => {
    const map = new Map<string, { count: number; mine: boolean }>();
    reactions.forEach((r) => {
      const entry = map.get(r.emoji) ?? { count: 0, mine: false };
      entry.count += 1;
      if (r.userId === currentUserId) entry.mine = true;
      map.set(r.emoji, entry);
    });
    return Array.from(map.entries());
  }, [reactions, currentUserId]);

  const handleToggle = (emoji: string) => {
    onToggle(messageId, emoji);
    setOpen(false);
  };

  return (
    <div className={cn("mt-0.5 flex items-center gap-1", isMine ? "justify-end pr-1" : "justify-start pl-1")}>
      {grouped.map(([emoji, { count, mine }]) => (
        <button
          key={emoji}
          type="button"
          onClick={() => handleToggle(emoji)}
          aria-label={`${emoji} reaction, ${count}${mine ? ", added by you" : ""}`}
          className={cn(
            "flex items-center gap-0.5 rounded-full border px-1.5 py-0.5 text-[11px] leading-none transition-colors",
            mine
              ? "border-primary bg-primary/15 text-foreground"
              : "border-border bg-card text-muted-foreground hover:bg-muted",
          )}
        >
          <span>{emoji}</span>
          {count > 1 && <span>{count}</span>}
        </button>
      ))}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-label="Add a reaction"
            className="rounded-full border border-transparent p-0.5 text-muted-foreground opacity-70 transition-opacity hover:opacity-100"
          >
            <SmilePlus className="h-3.5 w-3.5" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-1" align={isMine ? "end" : "start"}>
          <div className="flex items-center gap-0.5">
            {CHAT_REACTIONS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => handleToggle(emoji)}
                aria-label={`React with ${emoji}`}
                className="rounded-md px-1.5 py-1 text-base transition-transform hover:scale-125 hover:bg-muted"
              >
                {emoji}
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default MessageReactions;
