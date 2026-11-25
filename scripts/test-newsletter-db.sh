#!/usr/bin/env bash
# Integration test for the public newsletter/event subscription database layer
# (drizzle/migrations/0020 subscription section + 0033). Throwaway local PostgreSQL, no live data,
# no email is sent anywhere (the app has no email delivery for subscriptions).
set -uo pipefail
PGBIN="${PGBIN:-$(ls -d /usr/lib/postgresql/*/bin 2>/dev/null | sort -V | tail -1)}"
REPO="$(cd "$(dirname "$0")/.." && pwd)"; WORK="$(mktemp -d)"; PORT="${PGPORT_TEST:-54331}"; DB=news_test
RUNAS=(); if [ "$(id -u)" = "0" ]; then RUNAS=(runuser -u postgres --); chown postgres "$WORK"; fi
FAILS=0
q()   { "${RUNAS[@]}" "$PGBIN/psql" -X -q -At -h "$WORK" -p "$PORT" -d "$DB" "$@" 2>&1; }
role(){ local r="$1"; local uid="${2:-}"; shift 2; q -c "SET ROLE $r; SET app.uid='$uid'; $*" | grep -v '^SET$'; }
svc() { role service_role "" "$@"; }
check() { if [ "$2" = "$3" ]; then echo "PASS  $1"; else echo "FAIL  $1 (expected '$2', got '$3')"; FAILS=$((FAILS+1)); fi; }
has() { case "$2" in *"$3"*) check "$1" ok ok;; *) check "$1" "contains '$3'" "$2";; esac; }
cleanup() { "${RUNAS[@]}" "$PGBIN/pg_ctl" -D "$WORK/data" -m immediate stop >/dev/null 2>&1; rm -rf "$WORK"; }; trap cleanup EXIT
h() { printf '%s' "$1" | sha256sum | cut -d' ' -f1; }   # token -> hash, like the edge function

"${RUNAS[@]}" "$PGBIN/initdb" -D "$WORK/data" -A trust >/dev/null || exit 2
"${RUNAS[@]}" "$PGBIN/pg_ctl" -D "$WORK/data" -o "-p $PORT -k $WORK -c listen_addresses=''" -w -l "$WORK/pg.log" start >/dev/null || exit 2
"${RUNAS[@]}" "$PGBIN/createdb" -h "$WORK" -p "$PORT" "$DB"

q -v ON_ERROR_STOP=1 <<'SQL' >/dev/null || exit 2
CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role;
CREATE SCHEMA auth;
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('app.uid', true),'')::uuid $$;
GRANT USAGE ON SCHEMA public, auth TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION auth.uid() TO anon, authenticated, service_role;
CREATE TABLE public.user_roles (user_id uuid, role text);
CREATE FUNCTION public.has_role(_user_id uuid, _role text) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER AS
  $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role) $$;
GRANT SELECT ON public.user_roles TO anon, authenticated, service_role;
SQL
# the REAL original subscription objects (first 27 lines of 0020; the rest of that file is game-review code)
sed -n 1,27p "$REPO/drizzle/migrations/0020_public_subscriptions_and_review_safety.sql" | q -v ON_ERROR_STOP=1 >/dev/null || { echo "could not apply 0020 subscription section"; exit 2; }

ADMIN=aaaaaaaa-0000-0000-0000-00000000000a; USER=bbbbbbbb-0000-0000-0000-00000000000b
q -c "INSERT INTO public.user_roles VALUES ('$ADMIN','admin')" >/dev/null
create() { svc "SELECT public.create_public_subscription('$1', ARRAY[$2]::text[], ${3:-true}, ${4:-false}, '$(h "$5")')"; }

echo "== BEFORE 0033: the two gaps exist =="
OUT="$(create gap1@example.test "'gaming'" true false tok-gap1)"
has "pre-fix: 'gaming' interest is rejected" "$OUT" "Invalid subscription"
create gap2@example.test "'soccer'" true false tok-gap2 >/dev/null
svc "SELECT public.unsubscribe_public_subscription('$(h tok-gap2)','all')" >/dev/null
RES="$(create gap2@example.test "'soccer','fitness'" true false tok-gap2b)"
check "pre-fix: re-subscribing an unsubscribed email does nothing (returns NULL)" "" "$RES"
check "pre-fix: ...and the subscriber stays unsubscribed" "f" "$(q -c "SELECT newsletter_consent FROM public.public_subscriptions WHERE email='gap2@example.test'")"

q -v ON_ERROR_STOP=1 -f "$REPO/drizzle/migrations/0033_public_subscription_preferences.sql" >/dev/null || { echo "FAIL  0033 did not apply"; exit 1; }
q -v ON_ERROR_STOP=1 -f "$REPO/drizzle/migrations/0033_public_subscription_preferences.sql" >/dev/null || { echo "FAIL  0033 not re-runnable"; FAILS=$((FAILS+1)); }

echo "== AFTER 0033: categories =="
TOPICS="$(python3 - "$REPO/supabase/functions/_shared/subscriptionTopics.ts" <<'PY'
import re,sys
s=open(sys.argv[1]).read(); body=s[s.index('export const interests'):s.index('] as const')]
print(' '.join(re.findall(r'"([a-z-]+)"',body)))
PY
)"
N=0; BAD=""
for t in $TOPICS; do N=$((N+1)); R="$(create "topic$N@example.test" "'$t'" true false "tok-topic-$t")"; case "$R" in *-*-*-*-*) ;; *) BAD="$BAD $t";; esac; done
check "every topic in the shared TypeScript list is accepted by the database ($N topics)" "" "$BAD"
has "list includes gaming" " $TOPICS " " gaming "
has "list includes recruiting" " $TOPICS " " recruiting "
for t in sports coaches creator "not-a-topic"; do
  OUT="$(create "bad-$t@example.test" "'$t'" true false "tok-bad-$t")"; has "unknown topic '$t' rejected" "$OUT" "Invalid subscription"
done
has "empty interests rejected" "$(svc "SELECT public.create_public_subscription('e@example.test', ARRAY[]::text[], true,false,'$(h x)')")" "Invalid subscription"
has "no consent choice rejected" "$(create nc@example.test "'media'" false false tok-nc)" "Invalid subscription"
has "malformed email rejected" "$(create 'not-an-email' "'media'" true false tok-me)" "Invalid subscription"

echo "== AFTER 0033: public registration (email alone never changes an existing subscriber) =="
create alice@example.test "'soccer','gaming'" true true tok-alice >/dev/null
check "registration stores interests + both consents" "{soccer,gaming}|t|t" "$(q -c "SELECT interests, newsletter_consent, events_consent FROM public.public_subscriptions WHERE email='alice@example.test'" | tr -d ' ' | sed 's/|/|/g')"
check "registration is recorded in consent history" "subscribe" "$(q -c "SELECT string_agg(action,',' ORDER BY recorded_at) FROM public.subscription_consent_events e JOIN public.public_subscriptions s ON s.id=e.subscription_id WHERE s.email='alice@example.test'")"
RES="$(create ALICE@example.test "'tennis'" false true tok-attacker)"
check "same email again returns NULL (no token issued)" "" "$RES"
check "same email again does not change interests or consent" "{soccer,gaming}|t|t" "$(q -c "SELECT interests, newsletter_consent, events_consent FROM public.public_subscriptions WHERE email='alice@example.test'" | tr -d ' ')"
check "exactly one row for the email (case-insensitive)" "1" "$(q -c "SELECT count(*) FROM public.public_subscriptions WHERE lower(email)='alice@example.test'")"
check "attacker's hash was never stored" "0" "$(q -c "SELECT count(*) FROM public.public_subscriptions WHERE unsubscribe_hash='$(h tok-attacker)'")"
check "only the hash is stored, never the raw token" "0" "$(q -c "SELECT count(*) FROM public.public_subscriptions WHERE unsubscribe_hash='tok-alice'")"

echo "== AFTER 0033: read + update preferences by private token =="
J="$(svc "SELECT public.get_public_subscription('$(h tok-alice)')")"
has "get returns interests" "$J" "gaming"
case "$J" in *email*) check "get never returns the email address" ok "leaked";; *) check "get never returns the email address" ok ok;; esac
check "get with a wrong token returns nothing" "" "$(svc "SELECT public.get_public_subscription('$(h wrong)')")"
check "update by token succeeds" "t" "$(svc "SELECT public.update_public_subscription('$(h tok-alice)', ARRAY['recruiting','fitness','podcasts']::text[], false, true)")"
check "interests + consent changed" "{recruiting,fitness,podcasts}|f|t" "$(q -c "SELECT interests, newsletter_consent, events_consent FROM public.public_subscriptions WHERE email='alice@example.test'" | tr -d ' ')"
check "update with a wrong token returns false and changes nothing" "f" "$(svc "SELECT public.update_public_subscription('$(h wrong)', ARRAY['media']::text[], true, true)")"
check "...row unchanged" "{recruiting,fitness,podcasts}" "$(q -c "SELECT interests FROM public.public_subscriptions WHERE email='alice@example.test'" | tr -d ' ')"
has "update with no consent is rejected (use unsubscribe)" "$(svc "SELECT public.update_public_subscription('$(h tok-alice)', ARRAY['media']::text[], false, false)")" "Invalid subscription"
has "update with an unknown topic is rejected" "$(svc "SELECT public.update_public_subscription('$(h tok-alice)', ARRAY['hacking']::text[], true, false)")" "Invalid subscription"
has "update with a malformed token is rejected" "$(svc "SELECT public.update_public_subscription('xyz', ARRAY['media']::text[], true, false)")" "Invalid subscription"

echo "== AFTER 0033: unsubscribe scopes, then re-subscribe by token =="
svc "SELECT public.update_public_subscription('$(h tok-alice)', ARRAY['media']::text[], true, true)" >/dev/null
svc "SELECT public.unsubscribe_public_subscription('$(h tok-alice)','events')" >/dev/null
check "unsubscribing only events keeps the newsletter and stays subscribed" "t|f|f" "$(q -c "SELECT newsletter_consent, events_consent, unsubscribed_at IS NOT NULL FROM public.public_subscriptions WHERE email='alice@example.test'" | tr -d ' ')"
svc "SELECT public.unsubscribe_public_subscription('$(h tok-alice)','newsletter')" >/dev/null
check "unsubscribing everything sets unsubscribed_at" "t" "$(q -c "SELECT unsubscribed_at IS NOT NULL FROM public.public_subscriptions WHERE email='alice@example.test'")"
check "invalid unsubscribe link returns false" "f" "$(svc "SELECT public.unsubscribe_public_subscription('$(h wrong)','all')")"
check "an unsubscribed subscriber can re-subscribe with their token" "t" "$(svc "SELECT public.update_public_subscription('$(h tok-alice)', ARRAY['soccer']::text[], true, true)")"
check "...and is active again" "t|t|f" "$(q -c "SELECT newsletter_consent, events_consent, unsubscribed_at IS NOT NULL FROM public.public_subscriptions WHERE email='alice@example.test'" | tr -d ' ')"
check "every change is in the consent history, in order" "subscribe,update,update,unsubscribe,unsubscribe,update" "$(q -c "SELECT string_agg(e.action,',' ORDER BY e.recorded_at, e.id) FROM public.subscription_consent_events e JOIN public.public_subscriptions s ON s.id=e.subscription_id WHERE s.email='alice@example.test'")"

echo "== Security: who can do what =="
for fn in "create_public_subscription('x@example.test',ARRAY['media'],true,false,'$(h x)')" "get_public_subscription('$(h tok-alice)')" "update_public_subscription('$(h tok-alice)',ARRAY['media'],true,false)" "unsubscribe_public_subscription('$(h tok-alice)','all')"; do
  for r in anon authenticated; do has "$r cannot call ${fn%%(*}" "$(role $r "$USER" "SELECT public.$fn")" "permission denied"; done
done
has "anon cannot read subscribers" "$(role anon "" "SELECT count(*) FROM public.public_subscriptions")" "permission denied"
check "a signed-in non-admin sees no subscribers" "0" "$(role authenticated "$USER" "SELECT count(*) FROM public.public_subscriptions")"
check "an admin can read subscribers" "t" "$(role authenticated "$ADMIN" "SELECT count(*) > 0 FROM public.public_subscriptions")"
check "a non-admin sees no consent history" "0" "$(role authenticated "$USER" "SELECT count(*) FROM public.subscription_consent_events")"
check "an admin can read consent history" "t" "$(role authenticated "$ADMIN" "SELECT count(*) > 0 FROM public.subscription_consent_events")"
has "admins cannot edit consent history (immutable for app roles)" "$(role authenticated "$ADMIN" "UPDATE public.subscription_consent_events SET action='x'")" "permission denied"
has "admins cannot delete consent history" "$(role authenticated "$ADMIN" "DELETE FROM public.subscription_consent_events")" "permission denied"
has "admins cannot rewrite subscriber consent directly" "$(role authenticated "$ADMIN" "UPDATE public.public_subscriptions SET newsletter_consent=true")" "permission denied"

echo; if [ "$FAILS" -eq 0 ]; then echo "ALL CHECKS PASSED"; else echo "$FAILS CHECK(S) FAILED"; exit 1; fi
