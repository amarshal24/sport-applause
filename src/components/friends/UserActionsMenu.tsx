import { useMemo, useState } from "react";
import {
  MoreHorizontal,
  UserPlus,
  UserMinus,
  UserCheck,
  Ban,
  ShieldAlert,
  ShieldCheck,
  MessageCircle,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useFriends } from "@/hooks/useFriends";
import { useUserBlocks } from "@/hooks/useUserBlocks";
import { useAuth } from "@/hooks/useAuth";

interface Props {
  targetId: string;
  targetName?: string;
  onMessage?: (targetId: string) => void;
  compact?: boolean;
}

/** Add / remove friend, block, restrict and message actions for another user. */
const UserActionsMenu = ({ targetId, targetName, onMessage, compact }: Props) => {
  const { user } = useAuth();
  const {
    friends,
    pendingRequests,
    sentRequests,
    sendFriendRequest,
    acceptFriendRequest,
    removeFriend,
  } = useFriends();
  const { levelFor, blockUser, restrictUser, unblockUser } = useUserBlocks();
  const [busy, setBusy] = useState(false);

  const relation = useMemo(() => {
    const friend = friends.find((f) => f.profile.id === targetId);
    if (friend) return { kind: "friend" as const, id: friend.id };
    const incoming = pendingRequests.find((f) => f.profile.id === targetId);
    if (incoming) return { kind: "incoming" as const, id: incoming.id };
    const sent = sentRequests.find((f) => f.profile.id === targetId);
    if (sent) return { kind: "sent" as const, id: sent.id };
    return { kind: "none" as const, id: null };
  }, [friends, pendingRequests, sentRequests, targetId]);

  const level = levelFor(targetId);

  if (!user || user.id === targetId) return null;

  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    try {
      await fn();
    } finally {
      setBusy(false);
    }
  };

  const primary =
    relation.kind === "friend"
      ? { label: "Friends", icon: UserCheck, action: () => run(() => removeFriend(relation.id!)) }
      : relation.kind === "incoming"
        ? { label: "Accept", icon: UserCheck, action: () => run(() => acceptFriendRequest(relation.id!)) }
        : relation.kind === "sent"
          ? { label: "Pending", icon: Clock, action: () => run(() => removeFriend(relation.id!)) }
          : { label: "Add", icon: UserPlus, action: () => run(() => sendFriendRequest(targetId)) };

  const PrimaryIcon = primary.icon;

  return (
    <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
      <Button
        size="sm"
        variant={relation.kind === "friend" ? "secondary" : "default"}
        className="gap-1"
        disabled={busy || level === "blocked"}
        onClick={primary.action}
      >
        <PrimaryIcon className="h-4 w-4" />
        {!compact && primary.label}
      </Button>

      {onMessage && (
        <Button
          size="icon"
          variant="ghost"
          aria-label={`Message ${targetName || "user"}`}
          disabled={level === "blocked"}
          onClick={() => onMessage(targetId)}
        >
          <MessageCircle className="h-4 w-4" />
        </Button>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="icon" variant="ghost" aria-label="More actions">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52 bg-popover z-50">
          {relation.kind === "friend" && (
            <>
              <DropdownMenuItem onClick={() => run(() => removeFriend(relation.id!))}>
                <UserMinus className="h-4 w-4 mr-2" /> Unfollow / remove
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}
          {level !== "restricted" ? (
            <DropdownMenuItem onClick={() => run(() => restrictUser(targetId))}>
              <ShieldAlert className="h-4 w-4 mr-2" /> Restrict access
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onClick={() => run(() => unblockUser(targetId))}>
              <ShieldCheck className="h-4 w-4 mr-2" /> Remove restriction
            </DropdownMenuItem>
          )}
          {level !== "blocked" ? (
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => run(() => blockUser(targetId))}
            >
              <Ban className="h-4 w-4 mr-2" /> Block
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onClick={() => run(() => unblockUser(targetId))}>
              <ShieldCheck className="h-4 w-4 mr-2" /> Unblock
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default UserActionsMenu;
