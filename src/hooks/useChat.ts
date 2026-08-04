import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface ChatMessage {
  id: string;
  senderId: string;
  recipientId: string;
  content: string;
  imageUrl: string | null;
  read: boolean;
  readAt: string | null;
  deliveredAt: string | null;
  createdAt: string;
  isMine: boolean;
}

export interface MessageReaction {
  id: string;
  messageId: string;
  userId: string;
  emoji: string;
}

export const CHAT_REACTIONS = ['👏', '🔥', '❤️', '😂', '💯', '👍'] as const;

export interface ChatConversation {
  oderId: string;
  odername: string;
  oderAvatar: string | null;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

export const useChat = (recipientId?: string) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [reactions, setReactions] = useState<MessageReaction[]>([]);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const reactionChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Fetch all conversations
  const fetchConversations = useCallback(async () => {
    if (!user) return;

    // Get all messages involving the user
    const { data: allMessages, error } = await supabase
      .from('chat_messages')
      .select('*')
      .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching conversations:', error);
      return;
    }

    // Anything addressed to me that reached this device counts as delivered
    const undeliveredIds =
      allMessages?.filter(m => m.recipient_id === user.id && !m.delivered_at).map(m => m.id) || [];
    if (undeliveredIds.length > 0) {
      await supabase
        .from('chat_messages')
        .update({ delivered_at: new Date().toISOString() })
        .in('id', undeliveredIds);
    }



    // Group by conversation partner
    const conversationMap = new Map<string, {
      oderId: string;
      messages: any[];
      unreadCount: number;
    }>();

    allMessages?.forEach(msg => {
      const oderId = msg.sender_id === user.id ? msg.recipient_id : msg.sender_id;
      
      if (!conversationMap.has(oderId)) {
        conversationMap.set(oderId, {
          oderId,
          messages: [],
          unreadCount: 0
        });
      }
      
      const conv = conversationMap.get(oderId)!;
      conv.messages.push(msg);
      if (!msg.read && msg.recipient_id === user.id) {
        conv.unreadCount++;
      }
    });

    // Fetch profiles for all conversation partners
    const oderIds = Array.from(conversationMap.keys());
    if (oderIds.length === 0) {
      setConversations([]);
      return;
    }

    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username, avatar_url')
      .in('id', oderIds);

    const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

    const conversationsList: ChatConversation[] = [];
    conversationMap.forEach((conv, oderId) => {
      const profile = profileMap.get(oderId);
      if (profile && conv.messages.length > 0) {
        conversationsList.push({
          oderId,
          odername: profile.username,
          oderAvatar: profile.avatar_url,
          lastMessage: conv.messages[0].content,
          lastMessageTime: conv.messages[0].created_at,
          unreadCount: conv.unreadCount
        });
      }
    });

    // Sort by last message time
    conversationsList.sort((a, b) => 
      new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()
    );

    setConversations(conversationsList);
  }, [user]);

  // Fetch messages for a specific conversation
  const fetchMessages = useCallback(async () => {
    if (!user || !recipientId) return;

    setIsLoading(true);
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .or(
        `and(sender_id.eq.${user.id},recipient_id.eq.${recipientId}),and(sender_id.eq.${recipientId},recipient_id.eq.${user.id})`
      )
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
      setIsLoading(false);
      return;
    }

    setMessages(
      (data || []).map(msg => ({
        id: msg.id,
        senderId: msg.sender_id,
        recipientId: msg.recipient_id,
        content: msg.content,
        imageUrl: msg.image_url,
        read: msg.read,
        readAt: msg.read_at,
        deliveredAt: msg.delivered_at ?? null,
        createdAt: msg.created_at,
        isMine: msg.sender_id === user.id
      }))
    );

    // Mark unread messages as read (also implies delivered)
    const unreadIds = data?.filter(m => !m.read && m.recipient_id === user.id).map(m => m.id) || [];
    if (unreadIds.length > 0) {
      const now = new Date().toISOString();
      await supabase
        .from('chat_messages')
        .update({ read: true, read_at: now, delivered_at: now })
        .in('id', unreadIds);
    }
    // Load reactions for this thread
    const messageIds = (data || []).map(m => m.id);
    if (messageIds.length > 0) {
      const { data: reactionRows } = await supabase
        .from('chat_message_reactions')
        .select('*')
        .in('message_id', messageIds);
      setReactions(
        (reactionRows || []).map(r => ({
          id: r.id,
          messageId: r.message_id,
          userId: r.user_id,
          emoji: r.emoji,
        }))
      );
    } else {
      setReactions([]);
    }

    setIsLoading(false);
  }, [user, recipientId]);

  // Add or remove a reaction on a message
  const toggleReaction = useCallback(async (messageId: string, emoji: string) => {
    if (!user) return false;

    const existing = reactions.find(
      r => r.messageId === messageId && r.userId === user.id && r.emoji === emoji
    );

    if (existing) {
      setReactions(prev => prev.filter(r => r.id !== existing.id));
      const { error } = await supabase
        .from('chat_message_reactions')
        .delete()
        .eq('id', existing.id);
      if (error) {
        console.error('Error removing reaction:', error);
        setReactions(prev => [...prev, existing]);
        return false;
      }
      return true;
    }

    const { data, error } = await supabase
      .from('chat_message_reactions')
      .insert({ message_id: messageId, user_id: user.id, emoji })
      .select()
      .maybeSingle();

    if (error || !data) {
      console.error('Error adding reaction:', error);
      return false;
    }

    setReactions(prev =>
      prev.some(r => r.id === data.id)
        ? prev
        : [...prev, { id: data.id, messageId: data.message_id, userId: data.user_id, emoji: data.emoji }]
    );
    return true;
  }, [user, reactions]);


  // Send a message
  const sendMessage = useCallback(async (content: string, imageUrl?: string) => {
    if (!user || !recipientId || (!content.trim() && !imageUrl)) return false;

    const { error } = await supabase
      .from('chat_messages')
      .insert({
        sender_id: user.id,
        recipient_id: recipientId,
        content: content.trim() || '',
        image_url: imageUrl || null
      });

    if (error) {
      console.error('Error sending message:', error);
      return false;
    }

    return true;
  }, [user, recipientId]);

  // Upload image
  const uploadImage = useCallback(async (file: File) => {
    if (!user) return null;

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('chat-images')
      .upload(fileName, file);

    if (uploadError) {
      console.error('Error uploading image:', uploadError);
      return null;
    }

    const { data } = supabase.storage
      .from('chat-images')
      .getPublicUrl(fileName);

    return data.publicUrl;
  }, [user]);

  // Get total unread count
  const getTotalUnread = useCallback(() => {
    return conversations.reduce((sum, c) => sum + c.unreadCount, 0);
  }, [conversations]);

  // Subscribe to new messages
  useEffect(() => {
    if (!user) return;

    // Clean up previous channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const channel = supabase
      .channel(`chat-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `recipient_id=eq.${user.id}`
        },
        (payload) => {
          const now = new Date().toISOString();

          // If we're in a conversation with this sender, add the message
          if (recipientId && payload.new.sender_id === recipientId) {
            const newMsg: ChatMessage = {
              id: payload.new.id,
              senderId: payload.new.sender_id,
              recipientId: payload.new.recipient_id,
              content: payload.new.content,
              imageUrl: payload.new.image_url,
              read: payload.new.read,
              readAt: payload.new.read_at ?? null,
              deliveredAt: payload.new.delivered_at ?? now,
              createdAt: payload.new.created_at,
              isMine: false
            };
            setMessages(prev => [...prev, newMsg]);

            // Thread is open: delivered and read
            supabase
              .from('chat_messages')
              .update({ read: true, read_at: now, delivered_at: now })
              .eq('id', payload.new.id);
          } else if (!payload.new.delivered_at) {
            // Thread not open, but the message reached this device: delivered only
            supabase
              .from('chat_messages')
              .update({ delivered_at: now })
              .eq('id', payload.new.id);
          }

          
          // Update conversations list
          fetchConversations();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `sender_id=eq.${user.id}`
        },
        (payload) => {
          // Add our own sent messages to the list
          if (recipientId && payload.new.recipient_id === recipientId) {
            const newMsg: ChatMessage = {
              id: payload.new.id,
              senderId: payload.new.sender_id,
              recipientId: payload.new.recipient_id,
              content: payload.new.content,
              imageUrl: payload.new.image_url,
              read: payload.new.read,
              readAt: payload.new.read_at ?? null,
              deliveredAt: payload.new.delivered_at ?? null,

              createdAt: payload.new.created_at,
              isMine: true
            };
            setMessages(prev => {
              // Avoid duplicates
              if (prev.some(m => m.id === newMsg.id)) return prev;
              return [...prev, newMsg];
            });
          }
          fetchConversations();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chat_messages',
          filter: `sender_id=eq.${user.id}`
        },
        (payload) => {
          // Delivery / read receipt for a message we sent
          setMessages(prev =>
            prev.map(m =>
              m.id === payload.new.id
                ? {
                    ...m,
                    read: payload.new.read,
                    readAt: payload.new.read_at ?? null,
                    deliveredAt: payload.new.delivered_at ?? m.deliveredAt,
                  }
                : m
            )
          );
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [user, recipientId, fetchConversations]);

  // Subscribe to reaction changes for the open thread
  useEffect(() => {
    if (!user || !recipientId) return;

    if (reactionChannelRef.current) {
      supabase.removeChannel(reactionChannelRef.current);
      reactionChannelRef.current = null;
    }

    const channel = supabase
      .channel(`chat-reactions-${user.id}-${recipientId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_message_reactions' },
        (payload) => {
          const row = payload.new as { id: string; message_id: string; user_id: string; emoji: string };
          setMessages(prev => {
            if (!prev.some(m => m.id === row.message_id)) return prev;
            setReactions(rs =>
              rs.some(r => r.id === row.id)
                ? rs
                : [...rs, { id: row.id, messageId: row.message_id, userId: row.user_id, emoji: row.emoji }]
            );
            return prev;
          });
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'chat_message_reactions' },
        (payload) => {
          const oldId = (payload.old as { id?: string })?.id;
          if (oldId) setReactions(prev => prev.filter(r => r.id !== oldId));
        }
      )
      .subscribe();

    reactionChannelRef.current = channel;

    return () => {
      if (reactionChannelRef.current) {
        supabase.removeChannel(reactionChannelRef.current);
        reactionChannelRef.current = null;
      }
    };
  }, [user, recipientId]);

  // Initial fetch
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    if (recipientId) {
      fetchMessages();
    }
  }, [recipientId, fetchMessages]);

  return {
    messages,
    conversations,
    isLoading,
    reactions,
    toggleReaction,
    sendMessage,
    uploadImage,
    getTotalUnread,
    fetchMessages,
    fetchConversations
  };
};
