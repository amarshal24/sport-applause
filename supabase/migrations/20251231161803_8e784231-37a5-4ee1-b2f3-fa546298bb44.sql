-- Create friendships table
CREATE TABLE public.friendships (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  friend_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  accepted_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id, friend_id)
);

-- Enable RLS
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

-- Users can view their own friendships
CREATE POLICY "Users can view their own friendships" 
ON public.friendships 
FOR SELECT 
USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Users can send friend requests
CREATE POLICY "Users can send friend requests" 
ON public.friendships 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Users can update friendships they're part of
CREATE POLICY "Users can update their friendships" 
ON public.friendships 
FOR UPDATE 
USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Users can delete their friendships
CREATE POLICY "Users can delete their friendships" 
ON public.friendships 
FOR DELETE 
USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Enable realtime for friendships
ALTER PUBLICATION supabase_realtime ADD TABLE public.friendships;

-- Create app invites table for external invites
CREATE TABLE public.app_invites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  inviter_id UUID NOT NULL,
  invite_code TEXT NOT NULL UNIQUE,
  invitee_email TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  used_at TIMESTAMP WITH TIME ZONE,
  used_by UUID
);

-- Enable RLS
ALTER TABLE public.app_invites ENABLE ROW LEVEL SECURITY;

-- Users can view their own invites
CREATE POLICY "Users can view their own invites" 
ON public.app_invites 
FOR SELECT 
USING (auth.uid() = inviter_id OR auth.uid() = used_by);

-- Users can create invites
CREATE POLICY "Users can create invites" 
ON public.app_invites 
FOR INSERT 
WITH CHECK (auth.uid() = inviter_id);

-- Users can update their invites
CREATE POLICY "Users can update their invites" 
ON public.app_invites 
FOR UPDATE 
USING (auth.uid() = inviter_id OR auth.uid() = used_by);

-- Anyone can view invite by code (for claiming)
CREATE POLICY "Anyone can view invite by code" 
ON public.app_invites 
FOR SELECT 
USING (status = 'pending');