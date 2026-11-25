#!/usr/bin/env bash
# RLS/privilege test for drizzle/migrations/0032 (chat_messages update scope).
# Throwaway local PostgreSQL; applies the REAL original chat_messages DDL + policies, proves the
# pre-fix hole, applies 0032, then re-tests as sender / recipient / stranger. No live database.
set -uo pipefail
PGBIN="${PGBIN:-$(ls -d /usr/lib/postgresql/*/bin 2>/dev/null | sort -V | tail -1)}"
REPO="$(cd "$(dirname "$0")/.." && pwd)"; WORK="$(mktemp -d)"; PORT="${PGPORT_TEST:-54330}"; DB=chat_test
RUNAS=(); if [ "$(id -u)" = "0" ]; then RUNAS=(runuser -u postgres --); chown postgres "$WORK"; fi
FAILS=0
q()  { "${RUNAS[@]}" "$PGBIN/psql" -X -q -At -h "$WORK" -p "$PORT" -d "$DB" "$@" 2>&1; }
# run SQL as an authenticated app user (auth.uid() reads app.uid)
as() { local uid="$1"; shift; q -c "SET ROLE authenticated; SET app.uid='$uid'; $*"; }
check() { if [ "$2" = "$3" ]; then echo "PASS  $1"; else echo "FAIL  $1 (expected '$2', got '$3')"; FAILS=$((FAILS+1)); fi; }
cleanup() { "${RUNAS[@]}" "$PGBIN/pg_ctl" -D "$WORK/data" -m immediate stop >/dev/null 2>&1; rm -rf "$WORK"; }; trap cleanup EXIT
"${RUNAS[@]}" "$PGBIN/initdb" -D "$WORK/data" -A trust >/dev/null || exit 2
"${RUNAS[@]}" "$PGBIN/pg_ctl" -D "$WORK/data" -o "-p $PORT -k $WORK -c listen_addresses=''" -w -l "$WORK/pg.log" start >/dev/null || exit 2
"${RUNAS[@]}" "$PGBIN/createdb" -h "$WORK" -p "$PORT" "$DB"

SENDER=11111111-1111-1111-1111-111111111111; RECIP=22222222-2222-2222-2222-222222222222; OTHER=33333333-3333-3333-3333-333333333333
q -v ON_ERROR_STOP=1 <<'SQL' >/dev/null || exit 2
CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role; CREATE PUBLICATION supabase_realtime;
CREATE SCHEMA auth;
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('app.uid', true),'')::uuid $$;
GRANT USAGE ON SCHEMA public, auth TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION auth.uid() TO anon, authenticated;
SQL
# real original table + policies, plus the columns later migrations added
q -v ON_ERROR_STOP=1 -f "$REPO/supabase/migrations/20251231162231_cc7aabb3-5912-4f92-85e6-7c49a97cbc2d.sql" >/dev/null || exit 2
q -v ON_ERROR_STOP=1 -c "ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS image_url text, ADD COLUMN IF NOT EXISTS read_at timestamptz, ADD COLUMN IF NOT EXISTS delivered_at timestamptz;
  GRANT ALL ON public.chat_messages TO anon, authenticated, service_role;" >/dev/null || exit 2
q -c "INSERT INTO public.chat_messages (id,sender_id,recipient_id,content) VALUES ('aaaaaaaa-0000-0000-0000-000000000001','$SENDER','$RECIP','original text')" >/dev/null
content() { q -c "SELECT content FROM public.chat_messages WHERE id='aaaaaaaa-0000-0000-0000-000000000001'"; }
sender()  { q -c "SELECT sender_id FROM public.chat_messages WHERE id='aaaaaaaa-0000-0000-0000-000000000001'"; }
ID="id='aaaaaaaa-0000-0000-0000-000000000001'"

echo "== BEFORE 0032: the hole exists =="
as "$RECIP" "UPDATE public.chat_messages SET content='tampered by recipient', sender_id='$OTHER' WHERE $ID" >/dev/null
check "pre-fix: recipient CAN rewrite content" "tampered by recipient" "$(content)"
check "pre-fix: recipient CAN forge sender_id" "$OTHER" "$(sender)"
q -c "UPDATE public.chat_messages SET content='original text', sender_id='$SENDER' WHERE $ID" >/dev/null

q -v ON_ERROR_STOP=1 -f "$REPO/drizzle/migrations/0032_chat_messages_receipt_columns_only.sql" >/dev/null || { echo "FAIL  0032 did not apply"; exit 1; }
q -v ON_ERROR_STOP=1 -f "$REPO/drizzle/migrations/0032_chat_messages_receipt_columns_only.sql" >/dev/null || { echo "FAIL  0032 not re-runnable"; FAILS=$((FAILS+1)); }

echo "== AFTER 0032 =="
OUT="$(as "$RECIP" "UPDATE public.chat_messages SET content='tampered' WHERE $ID")"
case "$OUT" in *"permission denied"*) check "recipient cannot edit content" ok ok;; *) check "recipient cannot edit content" ok "$OUT";; esac
OUT="$(as "$RECIP" "UPDATE public.chat_messages SET sender_id='$OTHER' WHERE $ID")"
case "$OUT" in *"permission denied"*) check "recipient cannot forge sender_id" ok ok;; *) check "recipient cannot forge sender_id" ok "$OUT";; esac
OUT="$(as "$RECIP" "UPDATE public.chat_messages SET recipient_id='$OTHER' WHERE $ID")"
case "$OUT" in *"permission denied"*) check "recipient cannot redirect recipient_id" ok ok;; *) check "recipient cannot redirect recipient_id" ok "$OUT";; esac
check "content unchanged after attempts" "original text" "$(content)"
check "sender_id unchanged after attempts" "$SENDER" "$(sender)"

as "$RECIP" "UPDATE public.chat_messages SET read=true, read_at=now(), delivered_at=now() WHERE $ID" >/dev/null
check "recipient CAN still mark read + delivered" "t|t|t" "$(q -c "SELECT read, read_at IS NOT NULL, delivered_at IS NOT NULL FROM public.chat_messages WHERE $ID" | tr -d ' ')"
OUT="$(as "$SENDER" "UPDATE public.chat_messages SET read=false WHERE $ID RETURNING id")"
check "sender cannot touch receipt state of own sent message" "" "$(echo "$OUT" | grep -c aaaaaaaa | sed 's/^0$//')"
OUT="$(as "$OTHER" "UPDATE public.chat_messages SET read=false WHERE $ID RETURNING id")"
check "a stranger cannot update the message" "" "$(echo "$OUT" | grep -c aaaaaaaa | sed 's/^0$//')"
check "sender still reads own message" "original text" "$(as "$SENDER" "SELECT content FROM public.chat_messages WHERE $ID" | tail -1)"
check "stranger cannot read it" "0" "$(as "$OTHER" "SELECT count(*) FROM public.chat_messages WHERE $ID" | tail -1)"
as "$SENDER" "INSERT INTO public.chat_messages (sender_id,recipient_id,content) VALUES ('$SENDER','$RECIP','second')" >/dev/null
check "sending a message still works" "2" "$(q -c "SELECT count(*) FROM public.chat_messages")"
OUT="$(as "$OTHER" "INSERT INTO public.chat_messages (sender_id,recipient_id,content) VALUES ('$SENDER','$RECIP','spoofed')")"
case "$OUT" in *"row-level security"*) check "cannot insert a message as someone else" ok ok;; *) check "cannot insert a message as someone else" ok "$OUT";; esac
echo; if [ "$FAILS" -eq 0 ]; then echo "ALL CHECKS PASSED"; else echo "$FAILS CHECK(S) FAILED"; exit 1; fi
