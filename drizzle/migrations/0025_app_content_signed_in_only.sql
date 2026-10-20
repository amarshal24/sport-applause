ALTER POLICY "Anyone can view daily challenges" ON public.daily_challenges TO authenticated;
ALTER POLICY "Live streams are viewable by everyone" ON public.live_streams TO authenticated;
ALTER POLICY "Podcasts are viewable by everyone" ON public.podcasts TO authenticated;
ALTER POLICY "Reactions viewable by everyone" ON public.post_reactions TO authenticated;
ALTER POLICY "Posts are viewable by everyone" ON public.posts TO authenticated;
ALTER POLICY "Highlights viewable by everyone" ON public.stream_highlights TO authenticated;
ALTER POLICY "Top 5 videos are viewable by everyone" ON public.top_five_videos TO authenticated;