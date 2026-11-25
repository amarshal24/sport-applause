-- Enforce the 100-member Founding 100 cap inside the database.
--
-- Before this migration the cap was only a display counter: the admin screen set
-- status = 'selected' with a plain UPDATE, so two admins (or one double-click
-- racing another tab) could select a 101st member. This trigger serialises every
-- change INTO the 'selected' state behind one transaction-scoped advisory lock and
-- re-counts under that lock, so the limit holds under concurrency.
--
-- Rows that are already 'selected' are never touched, so existing members, their
-- benefits (get_my_founder_benefits) and any historical over-cap rows are preserved.

CREATE OR REPLACE FUNCTION public.founding100_enforce_cap()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _cap constant integer := 100;
  _selected integer;
BEGIN
  IF NEW.status IS DISTINCT FROM 'selected' THEN
    RETURN NEW;
  END IF;
  -- Not a new selection (already selected, unrelated column edit): nothing to check.
  IF TG_OP = 'UPDATE' AND OLD.status IS NOT DISTINCT FROM 'selected' THEN
    RETURN NEW;
  END IF;

  -- One lock for the whole table; released automatically at commit/rollback.
  PERFORM pg_advisory_xact_lock(hashtext('founding100_selected_cap'));

  SELECT count(*) INTO _selected
  FROM public.founding100_applications
  WHERE status = 'selected' AND id IS DISTINCT FROM NEW.id;

  IF _selected >= _cap THEN
    RAISE EXCEPTION 'FOUNDING100_CAP_REACHED: all % founding spots are taken', _cap
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.founding100_enforce_cap() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS founding100_enforce_cap ON public.founding100_applications;
CREATE TRIGGER founding100_enforce_cap
  BEFORE INSERT OR UPDATE OF status ON public.founding100_applications
  FOR EACH ROW EXECUTE FUNCTION public.founding100_enforce_cap();
