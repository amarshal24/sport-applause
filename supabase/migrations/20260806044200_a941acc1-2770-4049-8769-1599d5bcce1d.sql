ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER TABLE public.payouts REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.payouts;