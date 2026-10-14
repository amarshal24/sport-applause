CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('admin', 'moderator')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE POLICY "Users read own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.content_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL,
  target_type text NOT NULL CHECK (target_type IN ('listing', 'post', 'profile')),
  target_id uuid NOT NULL,
  reason text NOT NULL,
  details text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'dismissed')),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.content_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users file reports" ON public.content_reports FOR INSERT TO authenticated WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "Users read own reports" ON public.content_reports FOR SELECT TO authenticated USING (auth.uid() = reporter_id);
CREATE POLICY "Moderators read all reports" ON public.content_reports FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));
CREATE POLICY "Moderators update reports" ON public.content_reports FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));
CREATE POLICY "Moderators hide listings" ON public.marketplace_listings FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));

CREATE OR REPLACE FUNCTION public.screen_marketplace_listing()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  banned text[] := ARRAY['gun','guns','firearm','ammo','ammunition','weapon','knife','knives','drugs','cocaine','heroin','meth','steroids','weed','marijuana','fake id','counterfeit','stolen'];
  haystack text := lower(coalesce(NEW.title, '') || ' ' || coalesce(NEW.description, ''));
  term text;
BEGIN
  FOREACH term IN ARRAY banned LOOP
    IF haystack LIKE '%' || term || '%' THEN
      NEW.status := 'hidden';
      INSERT INTO public.content_reports (reporter_id, target_type, target_id, reason, details)
      VALUES (NEW.user_id, 'listing', NEW.id, 'auto_screen', 'Automatically flagged for containing: ' || term);
      RETURN NEW;
    END IF;
  END LOOP;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS screen_listing_on_write ON public.marketplace_listings;
CREATE TRIGGER screen_listing_on_write BEFORE INSERT OR UPDATE OF title, description ON public.marketplace_listings FOR EACH ROW EXECUTE FUNCTION public.screen_marketplace_listing();