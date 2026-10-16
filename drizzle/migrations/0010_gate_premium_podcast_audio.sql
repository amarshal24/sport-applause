CREATE OR REPLACE FUNCTION public.can_read_podcast_object(_user_id uuid, _name text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT
    _user_id IS NOT NULL AND (
      split_part(_name, '/', 1) = _user_id::text
      OR NOT EXISTS (
        SELECT 1 FROM public.podcasts p
        WHERE p.is_premium AND p.audio_url LIKE '%/podcasts/' || _name
      )
      OR EXISTS (
        SELECT 1 FROM public.podcasts p
        WHERE p.audio_url LIKE '%/podcasts/' || _name
          AND public.has_podcast_access(_user_id, p.id)
      )
    );
$$;

CREATE OR REPLACE FUNCTION public.has_podcast_access(_user_id uuid, _podcast_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.podcasts p
    WHERE p.id = _podcast_id AND (p.is_premium = false OR p.user_id = _user_id)
  )
  OR EXISTS (
    SELECT 1 FROM public.podcast_payments pay
    WHERE pay.podcast_id = _podcast_id AND pay.payer_id = _user_id
      AND pay.kind = 'unlock' AND pay.refunded_cents < pay.amount_cents
  )
  OR EXISTS (
    SELECT 1 FROM public.creator_memberships m
    JOIN public.podcasts p2 ON p2.id = _podcast_id
    WHERE m.fan_id = _user_id AND m.creator_id = p2.user_id
      AND m.status IN ('active','trialing','past_due')
      AND (m.current_period_end IS NULL OR m.current_period_end > now())
  );
$$;

DROP POLICY IF EXISTS "Podcast files are publicly accessible" ON storage.objects;
CREATE POLICY "Podcast files readable with access" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'podcasts' AND public.can_read_podcast_object(auth.uid(), name));