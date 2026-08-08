import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import MobileNav from "@/components/MobileNav";
import Sidebar from "@/components/Sidebar";
import { ShieldBan, MessageSquareOff, Loader2, UserRoundCheck, EyeOff } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useUserBlocks, type BlockLevel } from "@/hooks/useUserBlocks";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ThreadInfo {
  messageCount: number;
  lastMessage: string | null;
  lastMessageAt: string | null;
}

const relative = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${Math.max(mins, 0)}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

const BlockedUsers = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { blocks, isLoading, unblockUser, restrictUser, blockUser } = useUserBlocks();
  const [threads, setThreads] = useState<Record<string, ThreadInfo>>({});
  const [pendingUnblock, setPendingUnblock] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const blocked = useMemo(() => blocks.filter((b) => b.level === "blocked"), [blocks]);
  const restricted = useMemo(() => blocks.filter((b) => b.level === "restricted"), [blocks]);

  // Load affected conversations (existing chat threads with blocked/restricted users)
  useEffect(() => {
    const load = async () => {
      if (!user || blocks.length === 0) {
        setThreads({});
        return;
      }
      const ids = blocks.map((b) => b.userId);
      const { data, error } = await supabase
        .from("chat_messages")
        .select("sender_id, recipient_id, content, image_url, created_at")
        .or(`sender_id.in.(${ids.join(",")}),recipient_id.in.(${ids.join(",")})`)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error loading affected conversations:", error);
        return;
      }

      const map: Record<string, ThreadInfo> = {};
      (data || []).forEach((m) => {
        const other = m.sender_id === user.id ? m.recipient_id : m.sender_id;
        if (!ids.includes(other)) return;
        if (m.sender_id !== user.id && m.recipient_id !== user.id) return;
        if (!map[other]) {
          map[other] = {
            messageCount: 0,
            lastMessage: m.content || (m.image_url ? "Photo" : null),
            lastMessageAt: m.created_at,
          };
        }
        map[other].messageCount += 1;
      });
      setThreads(map);
    };
    load();
  }, [user, blocks]);

  const handleUnblock = async (id: string) => {
    setBusyId(id);
    await unblockUser(id);
    setBusyId(null);
    setPendingUnblock(null);
  };

  const renderList = (list: typeof blocks, level: BlockLevel) => {
    if (list.length === 0) {
      return (
        <div className="text-center py-16">
          {level === "blocked" ? (
            <ShieldBan className="h-14 w-14 mx-auto mb-4 text-muted-foreground/40" />
          ) : (
            <EyeOff className="h-14 w-14 mx-auto mb-4 text-muted-foreground/40" />
          )}
          <p className="text-muted-foreground">
            {level === "blocked" ? "You haven't blocked anyone." : "No restricted users."}
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {list.map((b) => {
          const thread = threads[b.userId];
          const name = b.profile?.fullName || b.profile?.username || "Unknown user";
          return (
            <Card key={b.id} className="p-4">
              <div className="flex items-start gap-3">
                <Avatar className="h-11 w-11">
                  <AvatarImage src={b.profile?.avatarUrl || undefined} alt={name} />
                  <AvatarFallback>{name.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold truncate">{name}</p>
                    <Badge variant={level === "blocked" ? "destructive" : "secondary"}>
                      {level === "blocked" ? "Blocked" : "Restricted"}
                    </Badge>
                  </div>
                  {b.profile?.username && (
                    <p className="text-sm text-muted-foreground truncate">@{b.profile.username}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    Since {new Date(b.createdAt).toLocaleDateString()}
                  </p>

                  {thread ? (
                    <div className="mt-3 rounded-lg bg-muted/50 p-3">
                      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                        <MessageSquareOff className="h-3.5 w-3.5" />
                        Affected conversation · {thread.messageCount} message
                        {thread.messageCount === 1 ? "" : "s"}
                        {thread.lastMessageAt && <span>· {relative(thread.lastMessageAt)}</span>}
                      </div>
                      {thread.lastMessage && (
                        <p className="text-sm mt-1 line-clamp-2 text-foreground/80">
                          {thread.lastMessage}
                        </p>
                      )}
                      {level === "blocked" && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Neither of you can send new messages in this thread.
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground mt-3">No conversation history.</p>
                  )}

                  <div className="flex flex-wrap gap-2 mt-3">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busyId === b.userId}
                      onClick={() => setPendingUnblock(b.userId)}
                    >
                      {busyId === b.userId ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <UserRoundCheck className="h-4 w-4" />
                      )}
                      {level === "blocked" ? "Unblock" : "Remove restriction"}
                    </Button>

                    {level === "blocked" ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={busyId === b.userId}
                        onClick={async () => {
                          setBusyId(b.userId);
                          await restrictUser(b.userId);
                          setBusyId(null);
                        }}
                      >
                        Downgrade to restricted
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={busyId === b.userId}
                        onClick={async () => {
                          setBusyId(b.userId);
                          await blockUser(b.userId);
                          setBusyId(null);
                        }}
                      >
                        Block fully
                      </Button>
                    )}

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => navigate(`/athlete/${b.userId}`)}
                    >
                      View profile
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <Sidebar />
      <MobileNav />

      <main className="pt-20 pb-24 md:pb-8 lg:pl-64 px-4 lg:px-6">
        <div className="max-w-5xl mx-auto py-6">
          <header className="flex items-center gap-3 mb-8">
            <div className="p-3 rounded-xl bg-muted">
              <ShieldBan className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Blocked &amp; Restricted</h1>
              <p className="text-muted-foreground">
                Manage who can reach you and see which conversations are affected
              </p>
            </div>
          </header>

          {!user ? (
            <div className="text-center py-16">
              <p className="text-muted-foreground mb-4">Sign in to manage blocked users</p>
              <Button onClick={() => navigate("/auth")}>Sign In</Button>
            </div>
          ) : isLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Tabs defaultValue="blocked">
              <TabsList className="mb-4">
                <TabsTrigger value="blocked">Blocked ({blocked.length})</TabsTrigger>
                <TabsTrigger value="restricted">Restricted ({restricted.length})</TabsTrigger>
              </TabsList>
              <TabsContent value="blocked">{renderList(blocked, "blocked")}</TabsContent>
              <TabsContent value="restricted">{renderList(restricted, "restricted")}</TabsContent>
            </Tabs>
          )}
        </div>
      </main>

      <AlertDialog open={!!pendingUnblock} onOpenChange={(o) => !o && setPendingUnblock(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restore access?</AlertDialogTitle>
            <AlertDialogDescription>
              They'll be able to message you and see your activity again. Your existing conversation
              stays where it is.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => pendingUnblock && handleUnblock(pendingUnblock)}>
              Restore access
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default BlockedUsers;
