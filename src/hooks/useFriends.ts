import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface Friend {
  id: string;
  oderId: string;
  friendId: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
  acceptedAt: string | null;
  profile: {
    id: string;
    username: string;
    fullName: string | null;
    avatarUrl: string | null;
  };
  isRequester: boolean;
}

export interface AppInvite {
  id: string;
  inviteCode: string;
  inviteeEmail: string | null;
  status: string;
  createdAt: string;
}

export const useFriends = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pendingRequests, setPendingRequests] = useState<Friend[]>([]);
  const [sentRequests, setSentRequests] = useState<Friend[]>([]);
  const [appInvites, setAppInvites] = useState<AppInvite[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchFriends = useCallback(async () => {
    if (!user) {
      setFriends([]);
      setPendingRequests([]);
      setSentRequests([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const { data: friendships, error } = await supabase
      .from('friendships')
      .select('*')
      .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`);

    if (error) {
      console.error('Error fetching friendships:', error);
      setIsLoading(false);
      return;
    }

    // Get all unique user IDs to fetch profiles
    const userIds = new Set<string>();
    friendships?.forEach(f => {
      userIds.add(f.user_id);
      userIds.add(f.friend_id);
    });
    userIds.delete(user.id);

    // Fetch profiles
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username, full_name, avatar_url')
      .in('id', Array.from(userIds));

    const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

    const processedFriends: Friend[] = [];
    const processedPending: Friend[] = [];
    const processedSent: Friend[] = [];

    friendships?.forEach(f => {
      const isRequester = f.user_id === user.id;
      const otherId = isRequester ? f.friend_id : f.user_id;
      const profile = profileMap.get(otherId);

      if (!profile) return;

      const friendData: Friend = {
        id: f.id,
        oderId: f.user_id,
        friendId: f.friend_id,
        status: f.status as 'pending' | 'accepted' | 'declined',
        createdAt: f.created_at,
        acceptedAt: f.accepted_at,
        profile: {
          id: profile.id,
          username: profile.username,
          fullName: profile.full_name,
          avatarUrl: profile.avatar_url,
        },
        isRequester,
      };

      if (f.status === 'accepted') {
        processedFriends.push(friendData);
      } else if (f.status === 'pending') {
        if (isRequester) {
          processedSent.push(friendData);
        } else {
          processedPending.push(friendData);
        }
      }
    });

    setFriends(processedFriends);
    setPendingRequests(processedPending);
    setSentRequests(processedSent);
    setIsLoading(false);
  }, [user]);

  const fetchAppInvites = useCallback(async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('app_invites')
      .select('*')
      .eq('inviter_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching app invites:', error);
      return;
    }

    setAppInvites(
      (data || []).map(invite => ({
        id: invite.id,
        inviteCode: invite.invite_code,
        inviteeEmail: invite.invitee_email,
        status: invite.status,
        createdAt: invite.created_at,
      }))
    );
  }, [user]);

  const sendFriendRequest = useCallback(async (friendId: string) => {
    if (!user) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to send friend requests',
        variant: 'destructive',
      });
      return false;
    }

    if (friendId === user.id) {
      toast({
        title: 'Invalid request',
        description: "You can't add yourself as a friend",
        variant: 'destructive',
      });
      return false;
    }

    const { error } = await supabase.from('friendships').insert({
      user_id: user.id,
      friend_id: friendId,
      status: 'pending',
    });

    if (error) {
      if (error.code === '23505') {
        toast({
          title: 'Already sent',
          description: 'Friend request already exists',
          variant: 'destructive',
        });
      } else {
        console.error('Error sending friend request:', error);
        toast({
          title: 'Error',
          description: 'Failed to send friend request',
          variant: 'destructive',
        });
      }
      return false;
    }

    toast({
      title: 'Request sent!',
      description: 'Friend request has been sent',
    });
    fetchFriends();
    return true;
  }, [user, toast, fetchFriends]);

  const acceptFriendRequest = useCallback(async (friendshipId: string) => {
    const { error } = await supabase
      .from('friendships')
      .update({
        status: 'accepted',
        accepted_at: new Date().toISOString(),
      })
      .eq('id', friendshipId);

    if (error) {
      console.error('Error accepting friend request:', error);
      toast({
        title: 'Error',
        description: 'Failed to accept friend request',
        variant: 'destructive',
      });
      return false;
    }

    toast({
      title: 'Friend added!',
      description: 'You are now friends',
    });
    fetchFriends();
    return true;
  }, [toast, fetchFriends]);

  const declineFriendRequest = useCallback(async (friendshipId: string) => {
    const { error } = await supabase
      .from('friendships')
      .delete()
      .eq('id', friendshipId);

    if (error) {
      console.error('Error declining friend request:', error);
      toast({
        title: 'Error',
        description: 'Failed to decline friend request',
        variant: 'destructive',
      });
      return false;
    }

    toast({
      title: 'Request declined',
      description: 'Friend request has been declined',
    });
    fetchFriends();
    return true;
  }, [toast, fetchFriends]);

  const removeFriend = useCallback(async (friendshipId: string) => {
    const { error } = await supabase
      .from('friendships')
      .delete()
      .eq('id', friendshipId);

    if (error) {
      console.error('Error removing friend:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove friend',
        variant: 'destructive',
      });
      return false;
    }

    toast({
      title: 'Friend removed',
      description: 'Friend has been removed',
    });
    fetchFriends();
    return true;
  }, [toast, fetchFriends]);

  const createAppInvite = useCallback(async (email?: string) => {
    if (!user) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to create invites',
        variant: 'destructive',
      });
      return null;
    }

    const inviteCode = Math.random().toString(36).substring(2, 10).toUpperCase();

    const { data, error } = await supabase
      .from('app_invites')
      .insert({
        inviter_id: user.id,
        invite_code: inviteCode,
        invitee_email: email || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating invite:', error);
      toast({
        title: 'Error',
        description: 'Failed to create invite',
        variant: 'destructive',
      });
      return null;
    }

    toast({
      title: 'Invite created!',
      description: 'Share the invite link with your friend',
    });
    fetchAppInvites();
    return data.invite_code;
  }, [user, toast, fetchAppInvites]);

  const searchUsers = useCallback(async (query: string) => {
    if (!query || query.length < 2) return [];

    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, full_name, avatar_url')
      .or(`username.ilike.%${query}%,full_name.ilike.%${query}%`)
      .neq('id', user?.id || '')
      .limit(10);

    if (error) {
      console.error('Error searching users:', error);
      return [];
    }

    return data || [];
  }, [user]);

  useEffect(() => {
    fetchFriends();
    fetchAppInvites();
  }, [fetchFriends, fetchAppInvites]);

  // Subscribe to friendship updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('friendships-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'friendships',
        },
        () => {
          fetchFriends();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchFriends]);

  return {
    friends,
    pendingRequests,
    sentRequests,
    appInvites,
    isLoading,
    sendFriendRequest,
    acceptFriendRequest,
    declineFriendRequest,
    removeFriend,
    createAppInvite,
    searchUsers,
    fetchFriends,
  };
};
