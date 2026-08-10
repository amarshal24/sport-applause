REVOKE ALL ON FUNCTION public.has_podcast_access(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_podcast_access(uuid, uuid) TO authenticated, service_role;