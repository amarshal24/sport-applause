#!/usr/bin/env bash
# Integration test for drizzle/migrations/0034 (AI tracked-clip quota). Throwaway local PostgreSQL,
# real migration, stubbed Supabase roles/auth. Never touches a live database.
set -uo pipefail
PGBIN="${PGBIN:-$(ls -d /usr/lib/postgresql/*/bin 2>/dev/null | sort -V | tail -1)}"
REPO="$(cd "$(dirname "$0")/.." && pwd)"; WORK="$(mktemp -d)"; PORT="${PGPORT_TEST:-54331}"; DB=quota_test
RUNAS=(); if [ "$(id -u)" = "0" ]; then RUNAS=(runuser -u postgres --); chown postgres "$WORK"; fi
FAILS=0
q()  { "${RUNAS[@]}" "$PGBIN/psql" -X -q -At -h "$WORK" -p "$PORT" -d "$DB" "$@" 2>&1; }
as() { local uid="$1"; shift; q -c "SET ROLE authenticated; SET app.uid='$uid'; $*" | grep -v '^SET$'; }
svc(){ q -c "SET ROLE service_role; $*" | grep -v '^SET$'; }
check() { if [ "$2" = "$3" ]; then echo "PASS  $1"; else echo "FAIL  $1 (expected '$2', got '$3')"; FAILS=$((FAILS+1)); fi; }
cleanup() { "${RUNAS[@]}" "$PGBIN/pg_ctl" -D "$WORK/data" -m immediate stop >/dev/null 2>&1; rm -rf "$WORK"; }; trap cleanup EXIT
"${RUNAS[@]}" "$PGBIN/initdb" -D "$WORK/data" -A trust >/dev/null || exit 2
"${RUNAS[@]}" "$PGBIN/pg_ctl" -D "$WORK/data" -o "-p $PORT -k $WORK -c listen_addresses='' -c max_connections=100" -w -l "$WORK/pg.log" start >/dev/null || exit 2
"${RUNAS[@]}" "$PGBIN/createdb" -h "$WORK" -p "$PORT" "$DB"
U1=11111111-1111-1111-1111-111111111111; U2=22222222-2222-2222-2222-222222222222; U3=33333333-3333-3333-3333-333333333333; U4=44444444-4444-4444-4444-444444444444
q -v ON_ERROR_STOP=1 <<SQL >/dev/null || exit 2
CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role;
CREATE SCHEMA auth; CREATE TABLE auth.users (id uuid PRIMARY KEY);
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS \$\$ SELECT nullif(current_setting('app.uid', true),'')::uuid \$\$;
GRANT USAGE ON SCHEMA public, auth TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION auth.uid() TO anon, authenticated, service_role;
INSERT INTO auth.users VALUES ('$U1'),('$U2'),('$U3'),('$U4');
SQL
MIG="$REPO/drizzle/migrations/0034_tracking_quota.sql"
q -v ON_ERROR_STOP=1 -f "$MIG" >/dev/null || { echo "FAIL  0034 did not apply"; exit 1; }
q -v ON_ERROR_STOP=1 -f "$MIG" >/dev/null || { echo "FAIL  0034 not re-runnable"; FAILS=$((FAILS+1)); }
C() { svc "SELECT consume_tracking_clip('$1','$2',$3,$4)->>'allowed'" | sed 's/^true$/t/;s/^false$/f/'; }
B() { sed 's/^true$/t/;s/^false$/f/'; }

echo "== free user: 1 per month, then blocked =="
check "free clip 1" t "$(C $U1 a1 1 0)"; check "free clip 2 blocked" f "$(C $U1 a2 1 0)"
echo "== pack owner: 1 monthly then 10 lifetime, then blocked =="
ok=0; for i in $(seq 1 11); do [ "$(C $U2 p$i 1 10)" = t ] && ok=$((ok+1)); done
check "pack owner gets 11 clips (1 monthly + 10 lifetime)" 11 "$ok"; check "12th blocked" f "$(C $U2 p12 1 10)"
check "source split" "monthly=1 lifetime=10" "$(q -At -c "SELECT 'monthly='||count(*) FILTER (WHERE source='monthly')||' lifetime='||count(*) FILTER (WHERE source='lifetime') FROM public.tracking_usage WHERE user_id='$U2'")"
echo "== idempotency + refunds =="
check "same job id twice is one slot" "t|1" "$(C $U3 j1 2 0)|$(q -At -c "SELECT count(*) FROM public.tracking_usage WHERE user_id='$U3'")"
C $U3 j1 2 0 >/dev/null; check "duplicate flagged and still one row" 1 "$(q -At -c "SELECT count(*) FROM public.tracking_usage WHERE user_id='$U3'")"
C $U3 j2 2 0 >/dev/null; check "limit reached" f "$(C $U3 j3 2 0)"
check "refund returns true" t "$(svc "SELECT refund_tracking_clip('$U3','j2')" | B)"
check "second refund is a no-op" f "$(svc "SELECT refund_tracking_clip('$U3','j2')" | B)"
check "slot is free again after refund" t "$(C $U3 j4 2 0)"
check "refund of unknown job is false" f "$(svc "SELECT refund_tracking_clip('$U3','nope')" | B)"
check "retrying a refunded job id re-consumes (limit holds)" f "$(C $U3 j2 2 0)"
echo "== month rollover =="
q -c "UPDATE public.tracking_usage SET period_start = (date_trunc('month', now() AT TIME ZONE 'utc') - interval '1 month')::date WHERE user_id IN ('$U1')" >/dev/null
check "monthly bucket resets with a new month" t "$(C $U1 b1 2 0)"
q -c "UPDATE public.tracking_usage SET period_start = (date_trunc('month', now() AT TIME ZONE 'utc') - interval '2 month')::date WHERE user_id='$U2'" >/dev/null
check "lifetime bucket does NOT reset (pack owner: monthly resets, lifetime still 10 used)" "t|f|f" "$(C $U2 m1 1 10)|$(C $U2 m2 1 10)|$(C $U2 m3 1 10)"
echo "== concurrency: 25 parallel requests, limit 5 =="
for i in $(seq 1 25); do ( svc "SELECT consume_tracking_clip('$U4','race$i',5,0)->>'allowed'" > "$WORK/r$i" ) & done; wait
check "exactly 5 allowed under concurrency" 5 "$(cat "$WORK"/r* | grep -c '^true$')"
check "exactly 5 rows recorded" 5 "$(q -At -c "SELECT count(*) FROM public.tracking_usage WHERE user_id='$U4'")"
echo "== validation =="
case "$(svc "SELECT consume_tracking_clip('$U1','x',-1,0)")" in *TRACKING_QUOTA_BAD_ARGUMENTS*) check "negative limit rejected" ok ok;; *) check "negative limit rejected" ok bad;; esac
case "$(svc "SELECT consume_tracking_clip('$U1','x',NULL,0)")" in *TRACKING_QUOTA_BAD_ARGUMENTS*) check "NULL limit rejected" ok ok;; *) check "NULL limit rejected" ok bad;; esac
echo "== privileges: clients cannot raise their own limit or edit usage =="
for fn in "consume_tracking_clip('$U1','hack',999,999)" "refund_tracking_clip('$U1','a1')"; do
  case "$(as $U1 "SELECT $fn")" in *"permission denied"*) check "authenticated cannot call $fn" ok ok;; *) check "authenticated cannot call $fn" ok bad;; esac
  case "$(q -c "SET ROLE anon; SELECT $fn")" in *"permission denied"*) check "anon cannot call ${fn%%(*}" ok ok;; *) check "anon cannot call ${fn%%(*}" ok bad;; esac
done
for stmt in "INSERT INTO public.tracking_usage (user_id,job_id,source,period_start) VALUES ('$U1','forge','monthly',now())" "UPDATE public.tracking_usage SET refunded_at=now()" "DELETE FROM public.tracking_usage"; do
  case "$(as $U1 "$stmt")" in *"permission denied"*) check "authenticated cannot: ${stmt:0:28}" ok ok;; *) check "authenticated cannot: ${stmt:0:28}" ok bad;; esac
done
check "user sees only own usage rows" "$(q -At -c "SELECT count(*) FROM public.tracking_usage WHERE user_id='$U2'")" "$(as $U2 "SELECT count(*) FROM public.tracking_usage")"
check "stranger sees none of another user's rows" 0 "$(as $U3 "SELECT count(*) FROM public.tracking_usage WHERE user_id='$U2'")"
check "get_my_tracking_usage reports own counts" "1|10" "$(as $U2 "SELECT (get_my_tracking_usage()->>'monthly_used')||'|'||(get_my_tracking_usage()->>'lifetime_used')" | tr -d ' ')"
check "get_my_tracking_usage unusable when signed out" "" "$(q -c "SET ROLE anon; SELECT get_my_tracking_usage()" | grep -c 'permission denied' | sed 's/^1$//')"
echo; if [ "$FAILS" -eq 0 ]; then echo "ALL CHECKS PASSED"; else echo "$FAILS CHECK(S) FAILED"; exit 1; fi
