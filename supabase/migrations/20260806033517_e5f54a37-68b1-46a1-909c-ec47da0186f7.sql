REVOKE EXECUTE ON FUNCTION public.has_fx_access(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_fx_access(uuid, text) TO authenticated, service_role;