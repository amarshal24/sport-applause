REVOKE ALL ON FUNCTION public.get_invite_by_code(text) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_invite_by_code(text) TO authenticated;