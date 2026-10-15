CREATE UNIQUE INDEX IF NOT EXISTS daily_challenges_game_date_idx ON public.daily_challenges (game_id, challenge_date);

CREATE OR REPLACE FUNCTION public.ensure_daily_challenges()
RETURNS SETOF public.daily_challenges
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  today date := (now() AT TIME ZONE 'utc')::date;
  g record; mult numeric; tgt int; names jsonb := '{"basketball":"Basketball","soccer":"Soccer","football":"Football","tennis":"Tennis","golf":"Golf","hockey":"Hockey","baseball":"Baseball","volleyball":"Volleyball"}';
BEGIN
  IF NOT EXISTS (SELECT 1 FROM daily_challenges WHERE challenge_date = today) THEN
    FOR g IN SELECT * FROM (VALUES ('basketball',50),('soccer',40),('football',35),('tennis',45),('golf',30),('hockey',40),('baseball',50),('volleyball',35)) v(game_id, base) LOOP
      mult := 0.8 + random() * 0.6;
      tgt := GREATEST(5, round(g.base * mult / 5) * 5);
      INSERT INTO daily_challenges (game_id, challenge_type, target_score, description, reward_points, challenge_date)
      VALUES (g.game_id, 'high_score', tgt, 'Score ' || tgt || ' points in ' || (names ->> g.game_id), round(100 * mult / 10) * 10, today)
      ON CONFLICT (game_id, challenge_date) DO NOTHING;
    END LOOP;
  END IF;
  RETURN QUERY SELECT * FROM daily_challenges WHERE challenge_date = today;
END $$;

REVOKE ALL ON FUNCTION public.ensure_daily_challenges() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.ensure_daily_challenges() TO authenticated;