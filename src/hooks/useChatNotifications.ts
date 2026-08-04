import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

/**
 * Subscribes to incoming chat messages for the signed-in user and
 * surfaces a toast + unread count for reply notifications.
 */
export const useChatNotifications = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

  const refresh = useCallback(async () => {
    if (!user) {
      setUnreadCount(0);
      return;
    }
    const { count } = await supabase
      .from("chat_messages")
      .select("id", { count: "exact", head: true })
      .eq("recipient_id", user.id)
      .eq("read", false);
    setUnreadCount(count ?? 0);
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`chat-notifications-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `recipient_id=eq.${user.id}`,
        },
        async (payload) => {
          setUnreadCount((c) => c + 1);
          const senderId = (payload.new as { sender_id: string }).sender_id;
          const content = (payload.new as { content: string }).content;
          const { data: profile } = await supabase
            .from("profiles")
            .select("username")
            .eq("id", senderId)
            .maybeSingle();
          toast.message(`New message from ${profile?.username ?? "a user"}`, {
            description: content?.slice(0, 90) || "Sent you a photo",
            action: {
              label: "Open",
              onClick: () => navigate(`/messages?chat=${senderId}`),
            },
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "chat_messages", filter: `recipient_id=eq.${user.id}` },
        () => refresh()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, navigate, refresh]);

  return { unreadCount, refresh };
};
