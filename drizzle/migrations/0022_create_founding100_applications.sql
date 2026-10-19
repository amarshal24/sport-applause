CREATE TABLE public.founding100_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 100),
  email TEXT NOT NULL UNIQUE CHECK (char_length(email) <= 255),
  role TEXT NOT NULL CHECK (role IN ('athlete','coach','creator','podcaster','fan')),
  sport TEXT NOT NULL CHECK (char_length(sport) BETWEEN 1 AND 60),
  social_username TEXT NOT NULL DEFAULT '' CHECK (char_length(social_username) <= 100),
  beta_interest BOOLEAN NOT NULL DEFAULT false,
  newsletter_consent BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'applied' CHECK (status IN ('applied','selected','waitlisted','rejected')),
  admin_notes TEXT NOT NULL DEFAULT '' CHECK (char_length(admin_notes) <= 2000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, UPDATE ON public.founding100_applications TO authenticated;
GRANT ALL ON public.founding100_applications TO service_role;

ALTER TABLE public.founding100_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read founding100 applications"
ON public.founding100_applications FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update founding100 applications"
ON public.founding100_applications FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.founding100_rate_limits (
  key_hash TEXT PRIMARY KEY,
  window_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  attempts INTEGER NOT NULL DEFAULT 1
);

GRANT ALL ON public.founding100_rate_limits TO service_role;

ALTER TABLE public.founding100_rate_limits ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.consume_founding100_limit(_key_hash text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _attempts integer;
BEGIN
  INSERT INTO founding100_rate_limits (key_hash) VALUES (_key_hash)
  ON CONFLICT (key_hash) DO UPDATE SET
    attempts = CASE WHEN founding100_rate_limits.window_start < now() - interval '1 hour' THEN 1 ELSE founding100_rate_limits.attempts + 1 END,
    window_start = CASE WHEN founding100_rate_limits.window_start < now() - interval '1 hour' THEN now() ELSE founding100_rate_limits.window_start END
  RETURNING attempts INTO _attempts;
  RETURN _attempts <= 5;
END;
$$;

REVOKE ALL ON FUNCTION public.consume_founding100_limit(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_founding100_limit(text) TO service_role;

CREATE OR REPLACE FUNCTION public.founding100_approved_count()
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT LEAST(count(*)::integer, 100) FROM public.founding100_applications WHERE status = 'selected';
$$;

GRANT EXECUTE ON FUNCTION public.founding100_approved_count() TO anon, authenticated;