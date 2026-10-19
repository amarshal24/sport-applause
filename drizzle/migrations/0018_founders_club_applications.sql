CREATE TABLE public.founders_club_applications (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 name text NOT NULL CHECK (char_length(btrim(name)) BETWEEN 1 AND 100),
 email text NOT NULL CHECK (char_length(email) <= 255 AND email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'),
 applicant_type text NOT NULL CHECK (applicant_type IN ('athlete','fan','creator','podcaster','gamer','coach')),
 reason text NOT NULL CHECK (char_length(btrim(reason)) BETWEEN 1 AND 2000),
 status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','declined')),
 admin_notes text NOT NULL DEFAULT '' CHECK (char_length(admin_notes) <= 2000),
 confirmation_status text NOT NULL DEFAULT 'not_configured' CHECK (confirmation_status IN ('not_configured','sent','failed')),
 created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.founders_club_applications TO authenticated;
GRANT ALL ON public.founders_club_applications TO service_role;
ALTER TABLE public.founders_club_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read applications" ON public.founders_club_applications FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins review applications" ON public.founders_club_applications FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE INDEX founders_club_applications_created_idx ON public.founders_club_applications (created_at DESC);
CREATE TABLE public.founders_club_rate_limits (key_hash text PRIMARY KEY, window_start timestamptz NOT NULL DEFAULT now(), attempts integer NOT NULL DEFAULT 1);
GRANT ALL ON public.founders_club_rate_limits TO service_role;
ALTER TABLE public.founders_club_rate_limits ENABLE ROW LEVEL SECURITY;
CREATE FUNCTION public.consume_founders_club_limit(_key_hash text) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE n integer;
BEGIN
 INSERT INTO public.founders_club_rate_limits AS r (key_hash) VALUES (_key_hash)
 ON CONFLICT (key_hash) DO UPDATE SET attempts = CASE WHEN r.window_start < now() - interval '1 hour' THEN 1 ELSE r.attempts + 1 END, window_start = CASE WHEN r.window_start < now() - interval '1 hour' THEN now() ELSE r.window_start END
 RETURNING attempts INTO n;
 RETURN n <= 5;
END; $$;
REVOKE ALL ON FUNCTION public.consume_founders_club_limit(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_founders_club_limit(text) TO service_role;