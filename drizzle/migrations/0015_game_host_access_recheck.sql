CREATE FUNCTION public.check_creator_game_host_access(_game_id uuid,_host_key text,_user_id uuid,_revision uuid,_preview boolean) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE d public.creator_game_delivery; g public.creator_games;
BEGIN
 SELECT * INTO d FROM public.creator_game_delivery WHERE game_id=_game_id;
 IF NOT FOUND OR d.host_key_hash<>encode(sha256(convert_to(_host_key,'UTF8')),'hex') OR d.revision <> _revision THEN RETURN false; END IF;
 SELECT * INTO g FROM public.creator_games WHERE id=_game_id;
 IF NOT FOUND OR public.is_suspended(_user_id) OR public.is_suspended(g.creator_id) THEN RETURN false; END IF;
 IF _preview THEN RETURN g.creator_id=_user_id OR public.has_role(_user_id,'admin') OR public.has_role(_user_id,'moderator'); END IF;
 RETURN g.status='approved' AND d.reviewed_at IS NOT NULL AND EXISTS(SELECT 1 FROM public.creator_game_orders WHERE game_id=_game_id AND buyer_id=_user_id AND environment='sandbox' AND status='paid' AND refunded_cents<amount_cents AND delivery_revision=_revision);
END $$;
REVOKE ALL ON FUNCTION public.check_creator_game_host_access(uuid,text,uuid,uuid,boolean) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.check_creator_game_host_access(uuid,text,uuid,uuid,boolean) TO service_role;