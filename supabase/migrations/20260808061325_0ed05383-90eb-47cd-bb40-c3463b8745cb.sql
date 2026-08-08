CREATE TABLE IF NOT EXISTS public.post_views (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  viewer_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.post_views TO authenticated;
GRANT ALL ON public.post_views TO service_role;

ALTER TABLE public.post_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can record their own views"
ON public.post_views FOR INSERT TO authenticated
WITH CHECK (viewer_id = auth.uid());

CREATE POLICY "Users can see their own views"
ON public.post_views FOR SELECT TO authenticated
USING (viewer_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_post_views_post_created ON public.post_views (post_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.get_trending_highlights(_days integer DEFAULT 7, _sport text DEFAULT NULL, _limit integer DEFAULT 30)
RETURNS TABLE(
  post_id uuid,
  user_id uuid,
  content text,
  video_url text,
  image_url text,
  created_at timestamp with time zone,
  username text,
  full_name text,
  avatar_url text,
  sports text[],
  views_count bigint,
  applause_count bigint,
  likes_count integer,
  comments_count integer,
  score numeric
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  WITH since AS (SELECT now() - make_interval(days => GREATEST(_days, 1)) AS ts)
  SELECT
    p.id,
    p.user_id,
    p.content,
    p.video_url,
    p.image_url,
    p.created_at,
    pr.username,
    pr.full_name,
    pr.avatar_url,
    pr.sports,
    COALESCE(v.cnt, 0) AS views_count,
    COALESCE(a.cnt, 0) AS applause_count,
    p.likes_count,
    p.comments_count,
    (COALESCE(v.cnt, 0) * 1.0 + COALESCE(a.cnt, 0) * 5.0) AS score
  FROM public.posts p
  JOIN public.profiles pr ON pr.id = p.user_id
  CROSS JOIN since s
  LEFT JOIN LATERAL (
    SELECT count(*) AS cnt FROM public.post_views pv
    WHERE pv.post_id = p.id AND pv.created_at >= s.ts
  ) v ON true
  LEFT JOIN LATERAL (
    SELECT count(*) AS cnt FROM public.post_reactions rx
    WHERE rx.post_id = p.id AND rx.emoji = '👏' AND rx.created_at >= s.ts
  ) a ON true
  WHERE p.created_at >= s.ts - interval '30 days'
    AND (_sport IS NULL OR pr.sports @> ARRAY[_sport]::text[])
  ORDER BY score DESC, p.created_at DESC
  LIMIT GREATEST(_limit, 1);
$$;

GRANT EXECUTE ON FUNCTION public.get_trending_highlights(integer, text, integer) TO authenticated, anon;