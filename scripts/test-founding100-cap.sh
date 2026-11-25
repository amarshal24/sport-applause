#!/usr/bin/env bash
# Integration test for the Founding 100 cap (drizzle/migrations/0031).
# Starts a throwaway local PostgreSQL, applies the REAL migrations 0022 + 0031 on top of
# minimal stubs for the Supabase pieces they reference, then races concurrent approvals.
# Never touches any real/live database. Usage: scripts/test-founding100-cap.sh
set -uo pipefail

PGBIN="${PGBIN:-$(ls -d /usr/lib/postgresql/*/bin 2>/dev/null | sort -V | tail -1)}"
REPO="$(cd "$(dirname "$0")/.." && pwd)"
WORK="$(mktemp -d)"
PORT="${PGPORT_TEST:-54329}"
DB=cap_test
RUNAS=()
if [ "$(id -u)" = "0" ]; then RUNAS=(runuser -u postgres --); chown postgres "$WORK"; fi
psqlq() { "${RUNAS[@]}" "$PGBIN/psql" -X -q -h "$WORK" -p "$PORT" -d "$DB" -v ON_ERROR_STOP=1 "$@"; }
FAILS=0
check() { # name expected actual
  if [ "$2" = "$3" ]; then echo "PASS  $1 (=$3)"; else echo "FAIL  $1 (expected $2, got $3)"; FAILS=$((FAILS+1)); fi
}
cleanup() { "${RUNAS[@]}" "$PGBIN/pg_ctl" -D "$WORK/data" -m immediate stop >/dev/null 2>&1; rm -rf "$WORK"; }
trap cleanup EXIT

"${RUNAS[@]}" "$PGBIN/initdb" -D "$WORK/data" -A trust >/dev/null || exit 2
"${RUNAS[@]}" "$PGBIN/pg_ctl" -D "$WORK/data" -o "-p $PORT -k $WORK -c listen_addresses=''" -w -l "$WORK/pg.log" start >/dev/null || { cat "$WORK/pg.log"; exit 2; }
"${RUNAS[@]}" "$PGBIN/createdb" -h "$WORK" -p "$PORT" "$DB"

psqlq <<'SQL'
CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role;
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE SCHEMA auth;
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS $$ SELECT NULL::uuid $$;
CREATE TABLE public.user_roles (user_id uuid, role text);
CREATE FUNCTION public.has_role(_user_id uuid, _role text) RETURNS boolean LANGUAGE sql STABLE AS
  $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role) $$;
SQL
psqlq -f "$REPO/drizzle/migrations/0022_create_founding100_applications.sql" || exit 2
psqlq -f "$REPO/drizzle/migrations/0031_founding100_atomic_cap.sql" || exit 2
# idempotent re-apply must succeed
psqlq -f "$REPO/drizzle/migrations/0031_founding100_atomic_cap.sql" || { echo "FAIL  0031 is not re-runnable"; FAILS=$((FAILS+1)); }

# zero-padded so ORDER BY email is numeric order (a0001..a0150)
em() { printf 'a%04d@example.test' "$1"; }
seed() { psqlq -c "TRUNCATE public.founding100_applications;
  INSERT INTO public.founding100_applications (name,email,role,sport)
  SELECT 'Applicant '||g, 'a'||lpad(g::text,4,'0')||'@example.test', 'athlete', 'basketball' FROM generate_series(1,$1) g;"; }
selected() { psqlq -At -c "SELECT count(*) FROM public.founding100_applications WHERE status='selected'"; }
select_one() { psqlq -c "UPDATE public.founding100_applications SET status='selected' WHERE email='$(em $1)'" 2>&1; }

echo "== 1. sequential: exactly 100 can be selected, the 101st is refused =="
seed 120
psqlq -c "UPDATE public.founding100_applications SET status='selected' WHERE email IN (SELECT email FROM public.founding100_applications ORDER BY created_at, email LIMIT 100)"
check "100 selected in one statement" 100 "$(selected)"
OUT="$(select_one 120 || true)"
case "$OUT" in *FOUNDING100_CAP_REACHED*) check "101st refused with cap error" ok ok;; *) check "101st refused with cap error" ok "$OUT";; esac
check "still 100 after refusal" 100 "$(selected)"

echo "== 2. already-selected rows stay editable and count is stable at the cap =="
psqlq -c "UPDATE public.founding100_applications SET admin_notes='welcome' WHERE status='selected'"
psqlq -c "UPDATE public.founding100_applications SET status='selected' WHERE status='selected'"
check "re-saving selected rows at cap does not error or change count" 100 "$(selected)"

echo "== 3. freeing a spot lets exactly one more in =="
psqlq -c "UPDATE public.founding100_applications SET status='rejected' WHERE email='a0001@example.test'"
check "99 after rejecting one" 99 "$(selected)"
select_one 120 >/dev/null
check "100 after selecting a waiting applicant" 100 "$(selected)"

echo "== 4. CONCURRENT approvals from 98: 12 sessions race for 2 spots =="
seed 120
psqlq -c "UPDATE public.founding100_applications SET status='selected' WHERE email IN (SELECT email FROM public.founding100_applications ORDER BY email LIMIT 98)"
check "98 pre-selected" 98 "$(selected)"
PIDS=()
for i in $(seq 100 111); do
  ( psqlq -c "UPDATE public.founding100_applications SET status='selected' WHERE email='$(em $i)'" >/dev/null 2>&1 ) &
  PIDS+=($!)
done
for p in "${PIDS[@]}"; do wait "$p"; done
check "exactly 100 selected after 12 concurrent approvals" 100 "$(selected)"

echo "== 5. CONCURRENT approvals into an EMPTY club: 150 sessions, 40 at a time =="
seed 150
for batch in 0 1 2 3; do
  PIDS=()
  for i in $(seq $((batch*40+1)) $((batch*40+40))); do
    [ "$i" -le 150 ] || continue
    ( psqlq -c "UPDATE public.founding100_applications SET status='selected' WHERE email='$(em $i)'" >/dev/null 2>&1 ) &
    PIDS+=($!)
  done
  for p in "${PIDS[@]}"; do wait "$p"; done
done
check "never above 100 after 150 concurrent approvals" 100 "$(selected)"

echo "== 6. concurrent INSERT of already-selected rows cannot bypass the cap =="
seed 0
PIDS=()
for i in $(seq 1 130); do
  ( psqlq -c "INSERT INTO public.founding100_applications (name,email,role,sport,status) VALUES ('n$i','n$i@example.test','fan','soccer','selected')" >/dev/null 2>&1 ) &
  PIDS+=($!)
  if [ $((i % 40)) -eq 0 ]; then for p in "${PIDS[@]}"; do wait "$p"; done; PIDS=(); fi
done
for p in "${PIDS[@]}"; do wait "$p"; done
check "130 concurrent selected inserts yield 100" 100 "$(selected)"

echo "== 7. CONTROL: without the trigger the same race exceeds the cap (proves the test is meaningful) =="
psqlq -c "DROP TRIGGER founding100_enforce_cap ON public.founding100_applications"
seed 150
PIDS=()
for i in $(seq 1 150); do
  ( psqlq -c "UPDATE public.founding100_applications SET status='selected' WHERE email='$(em $i)'" >/dev/null 2>&1 ) &
  PIDS+=($!)
  if [ $((i % 40)) -eq 0 ]; then for p in "${PIDS[@]}"; do wait "$p"; done; PIDS=(); fi
done
for p in "${PIDS[@]}"; do wait "$p"; done
check "control (no trigger) selects all 150" 150 "$(selected)"

echo
if [ "$FAILS" -eq 0 ]; then echo "ALL CHECKS PASSED"; else echo "$FAILS CHECK(S) FAILED"; exit 1; fi
