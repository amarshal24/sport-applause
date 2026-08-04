import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export type BlockLevel = 'blocked' | 'restricted';

export interface BlockedUser {
  id: string;
  userId: string;
  level: BlockLevel;
  note: string | null;
  createdAt: string;
  profile: {
    id: string;
    username: string;
    fullName: string | null;
    avatarUrl: string | null;
  } | null;
}

export const useUserBlocks = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [blocks, setBlocks] = useState<BlockedUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchBlocks = useCallback(async () => {
    if (!user) {
      setBlocks([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);

    const { data, error } = await supabase
      .from('user_blocks')
      .select('*')
      .eq('blocker_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching blocks:', error);
      setIsLoading(false);
      return;
    }

    const ids = (data || []).map((b) => b.blocked_id);
    const { data: profiles } = ids.length
      ? await supabase.from('profiles').select('id, username, full_name, avatar_url').in('id', ids)
      : { data: [] as any[] };

    const profileMap = new Map((profiles || []).map((p) => [p.id, p]));

    setBlocks(
      (data || []).map((b) => {
        const p = profileMap.get(b.blocked_id);
        return {
          id: b.id,
          userId: b.blocked_id,
          level: b.level as BlockLevel,
          note: b.note,
          createdAt: b.created_at,
          profile: p
            ? { id: p.id, username: p.username, fullName: p.full_name, avatarUrl: p.avatar_url }
            : null,
        };
      })
    );
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    fetchBlocks();
  }, [fetchBlocks]);

  const setAccess = useCallback(
    async (targetId: string, level: BlockLevel) => {
      if (!user) {
        toast({ title: 'Sign in required', variant: 'destructive' });
        return false;
      }
      if (targetId === user.id) return false;

      const { error } = await supabase
        .from('user_blocks')
        .upsert(
          { blocker_id: user.id, blocked_id: targetId, level },
          { onConflict: 'blocker_id,blocked_id' }
        );

      if (error) {
        console.error('Error updating access:', error);
        toast({ title: 'Error', description: 'Could not update access', variant: 'destructive' });
        return false;
      }

      toast({
        title: level === 'blocked' ? 'User blocked' : 'Access restricted',
        description:
          level === 'blocked'
            ? "They can't message you and won't see your activity."
            : 'They stay a friend but have limited access to your content.',
      });
      fetchBlocks();
      return true;
    },
    [user, toast, fetchBlocks]
  );

  const removeAccessControl = useCallback(
    async (targetId: string) => {
      if (!user) return false;
      const { error } = await supabase
        .from('user_blocks')
        .delete()
        .eq('blocker_id', user.id)
        .eq('blocked_id', targetId);

      if (error) {
        console.error('Error removing block:', error);
        toast({ title: 'Error', description: 'Could not remove restriction', variant: 'destructive' });
        return false;
      }
      toast({ title: 'Access restored', description: 'They can interact with you again.' });
      fetchBlocks();
      return true;
    },
    [user, toast, fetchBlocks]
  );

  const levelFor = useCallback(
    (targetId: string): BlockLevel | null => blocks.find((b) => b.userId === targetId)?.level ?? null,
    [blocks]
  );

  return {
    blocks,
    isLoading,
    fetchBlocks,
    blockUser: (id: string) => setAccess(id, 'blocked'),
    restrictUser: (id: string) => setAccess(id, 'restricted'),
    unblockUser: removeAccessControl,
    levelFor,
  };
};
