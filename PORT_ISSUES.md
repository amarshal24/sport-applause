# Port Plan: `us-sports-carpediem` → `sport-applause`

**Source:** `us-sports-carpediem` (manual work)  
**Target:** `sport-applause` (Lovable / deploy repo, `main`)  
**Branch:** `port/audit-issues` (local commits; **not pushed**)  
**Rule:** Port one issue at a time. No push until explicitly approved.

---

## Status summary

| Status | Issues |
|--------|--------|
| **Done** (committed on `port/audit-issues`) | 003, 004†, 005, 008†, 011†, 012, 014, 016, 017, 018†, 019, 020, 027, 028, 029, 032, 035, 038 |
| **Cannot / skip** | 001 (no Stripe in either repo), 002 (client removed marketplace) |
| **Still open** | 006, 007, 009, 010, 013*, 015, 021, 022, 023*, 024, 025, 026, 030*, 031, 033, 034, 036, 037 |

† Bundled with a related port (not a separate commit).  
\* Source audit claimed fixed / mitigated; not fully verified as a standalone port here. 023 depends on real Stripe (001).

**Commits on branch:**
- `d74ca42` — snap feed, stories, comments, invites, Top Plays, editor bake, podcasts, EN/ES, signed media, package name
- `4510346` — deaf accessibility prefs + Capacitor production bundling
- (latest) — AthleteMatch wired into Games hub (ISSUE-032)

---

## ISSUE-001 — Stripe / payments — CANNOT PORT

**Why:** No working Stripe integration exists in either repo.

| Piece | Manual | Original |
|-------|--------|----------|
| Edge functions (`create-checkout`, etc.) | Missing | Missing |
| `usePremium` live status | Still `isPremium = false` | Same (identical file) |
| `subscribers` migration | SQL only | Missing |
| Upgrade Pro modal | Copy says “coming soon” | Still shows fake $4.99 CTA |

Audit docs claim it was fixed; code does not match. Only optional bring: `subscribers` SQL + “coming soon” modal copy — not a real payment port.

**Action:** Skip. Build Stripe later as new work.

---

## ISSUE-002 — Marketplace UI — SKIPPED

**Status:** Skipped — target repo removed marketplace (`be0a776`); client chose not to keep it.

**Would have brought:** `Marketplace.tsx`, route, nav links, Messages listing deep-link.

**DB:** none new (uses existing `marketplace_listings` / bucket)

---

## ISSUE-003 — Editor bake (Animation Center) — DONE

**Status:** PORTED — committed on `port/audit-issues` (`d74ca42`), not pushed.

**Brought into `sport-applause`:**
- `src/lib/videoBake.ts`
- Bake wiring in `src/pages/VideoEditor.tsx` (download / share / post feed / post story)
- Export progress UI
- Also includes ISSUE-004 field fix: posts use `video_url` (not `image_url`)

**DB:** none  
**Smoke-test:** edit with filter/text → Download or Post → play result

---

## ISSUE-004 — Editor wrong `video_url` field — DONE

**Status:** PORTED with ISSUE-003 (`d74ca42`).

**Fix:** `VideoEditor` inserts baked media into `posts.video_url` (not `image_url`).

---

## ISSUE-005 — Comments (partial) — DONE + DB LIVE

**Status:** PORTED — committed on `port/audit-issues` (`d74ca42`); DB applied via Lovable.

**Brought into `sport-applause` (via ISSUE-017):**
- `src/components/PostComments.tsx` — list / add / delete own comments
- Wired in snap `VideoFeed` (comment button opens panel)
- `supabase/migrations/20260717120000_post_comments.sql` — table + RLS + `comments_count` trigger

**DB:** applied via Lovable — `post_comments` table, policies, count-sync trigger, and grants are live.  
**Smoke-test:** Home feed → comment icon → type + send → appears in list → delete own comment → count updates

---

## ISSUE-008 — Share button — DONE

**Status:** PORTED with ISSUE-017 (`d74ca42`).

**Fix:** Feed share uses Web Share API with clipboard fallback + toast.

---

## ISSUE-011 — Trending mock data — DONE

**Status:** PORTED with ISSUE-017 (`d74ca42`).

**Fix:** `Trending.tsx` replaced mock Unsplash videos with live `VideoFeed`.

---

## ISSUE-012 — Top Plays (real content) — DONE

**Status:** PORTED — committed on `port/audit-issues` (`d74ca42`), not pushed.

**Brought into `sport-applause`:**
- Replaced stub `src/pages/TopPlays.tsx` with real community grid
- Loads `top_five_videos` (by views) + video `posts` (by likes); playable fullscreen

**DB:** none (uses existing tables)  
**Route:** `/top-plays` already wired  
**Smoke-test:** open Top Plays → see grid (or empty state) → play a clip → athlete link works

---

## ISSUE-014 — Friend invite redemption — DONE

**Status:** PORTED — committed on `port/audit-issues` (`d74ca42`), not pushed.

**Brought into `sport-applause`:**
- `src/lib/appInvites.ts`
- `src/pages/Auth.tsx` — reads `?invite=`, banner, redeem after auth
- `src/hooks/useAuth.tsx` — redeem on sign-in / session restore
- `supabase/migrations/20260730120000_app_invite_claim.sql`

**DB (required):** run that SQL in the live Supabase SQL Editor, or redemption will fail under RLS.  
**Smoke-test:** User A creates invite → User B opens `/auth?invite=CODE` → signs up → toast “Invite accepted!” → friends list shows A

---

## ISSUE-016 — Video crop / aspect — DONE

**Status:** PORTED — committed on `port/audit-issues` (`d74ca42`), not pushed.

**Brought into `sport-applause`:**
- `VideoFeed` — adaptive aspect + `object-contain`
- `FullScreenVideoModal` — resets to contain on open
- `TopFiveVideos`, `AthleteProfile`, `Recruiting` — contain / full-frame players
- `VideoEditor` export preview already contain from ISSUE-003

**DB:** none  
**Smoke-test:** play portrait + landscape clips in feed / Top 5 / recruiting — no hard crop; letterboxing OK

---

## ISSUE-017 — TikTok-style snap feed — DONE

**Status:** PORTED — committed on `port/audit-issues` (`d74ca42`), not pushed.

**Brought into `sport-applause`:**
- `src/components/VideoFeed.tsx` — full-viewport vertical snap (`snap-y mandatory`), overlay rail, share
- `src/pages/Index.tsx` — feed outside padded stack so it can fill viewport height
- `src/pages/Trending.tsx` — replaced mock Unsplash videos with live `VideoFeed`
- Also brought `PostComments.tsx` + `20260717120000_post_comments.sql` (feed UI depends on comments panel = ISSUE-005)

**DB:** comments need `post_comments` migration on live Supabase (same as ISSUE-005); snap feed itself needs none  
**Smoke-test:** Home → vertical swipe snaps one post at a time → active video autoplays → mute/share/save work

---

## ISSUE-018 — Story expiry consistency — DONE

**Status:** PORTED with ISSUE-019 (`d74ca42`).

**Fix:** UnifiedComposer story expiry set to **24h** (was inconsistent 8h / 24h).

---

## ISSUE-019 — Story rail create + playback — DONE

**Status:** PORTED — committed on `port/audit-issues` (`d74ca42`), not pushed.

**Brought into `sport-applause`:**
- `Stories.tsx` — “Your story” create control (avatar + plus)
- `Index` already scrolls to composer + sets story mode (from earlier layout work)
- `UnifiedComposer` — `id="unified-composer"`, story title, **24h** expiry (was 8h)
- `StoryViewer` — `SecureImage` / `SecureVideo` playback; hide default dialog X

**DB:** none  
**Smoke-test:** Home → tap Your story → composer “Share a story” → add media → post → rail shows story → open → media plays

---

## ISSUE-020 — Podcast public browse / playback — DONE

**Status:** PORTED — committed on `port/audit-issues` (`d74ca42`), not pushed.

**Brought into `sport-applause`:**
- `PodcastBrowser.tsx` — community list, search, Latest/Most played, signed audio player
- `Podcasts.tsx` — Browse / My Podcasts tabs + `/podcasts?id=` focus/autoplay
- `MyPodcasts.tsx` — play/pause own episodes via SecureAudio
- `SecureAudio` + `storageRefUrl` helper; Search cards deep-link to `?id=`
- Locale keys: `podcasts.browse` / `mine` / `signInMessage` (en + es)

**DB:** none  
**Smoke-test:** `/podcasts` → Browse → play episode; Search podcast → opens with autoplay; My Podcasts → Play

---

## ISSUE-027 — Language switcher (EN / ES only) — DONE

**Status:** PORTED — committed on `port/audit-issues` (`d74ca42`), not pushed.

**Brought into `sport-applause`:**
- `LanguageSwitcher.tsx` — only English + Español
- `i18n.ts` — `supportedLngs: ["en","es"]`, `load: "languageOnly"` (unsupported browser langs → EN)

**DB:** none (locale files were already en/es only)  
**Smoke-test:** Globe icon → only 2 options → Español updates UI strings → English restores

---

## ISSUE-028 — Deaf-specific accessibility — DONE

**Status:** PORTED — committed on `port/audit-issues` (`4510346`), not pushed.

**Brought into `sport-applause`:**
- `src/hooks/useDeafAccessibility.tsx` — prefer captions / visual alerts / haptic prefs (localStorage)
- `src/components/DeafAccessibilityBridge.tsx` — toast → screen flash + vibration
- `AccessibilityToolbar` — “Hearing & Captions” toggles + en/es strings
- Media surfaces honor `preferCaptions`: `VideoFeed`, `StreamReplay`, `FullScreenVideoModal`, `PodcastBrowser`, `TopPlays`
- CSS flash class in `index.css`
- `scripts/smoke-deaf-a11y.mjs`

**DB:** none  
**Smoke-test:** Accessibility toolbar → enable Prefer captions / Visual alerts / Haptics → media shows captions preference; toast triggers flash/vibrate

---

## ISSUE-029 — Capacitor production bundling — DONE (partial)

**Status:** PORTED — committed on `port/audit-issues` (`4510346`), not pushed.

**Brought into `sport-applause`:**
- `capacitor.config.ts` — production loads local `dist/` (`webDir`); remote URL only via optional `CAPACITOR_SERVER_URL` for live-reload
- `cleartext` only when live-reload URL is `http://`
- Related Vite / package tweaks for mobile bundling

**Still out of scope:** committed `android/` / `ios/` native project folders (full offline-native packaging).

**DB:** none  
**Smoke-test:** `npm run build` → `npx cap sync` → native app loads bundled `dist`, not remote live-reload URL

---

## ISSUE-035 — Signed private-bucket media — DONE

**Status:** PORTED — committed on `port/audit-issues` (`d74ca42`), not pushed.

**Brought into `sport-applause`:**
- `signedMedia.ts` — `storageRefUrl`, hash-aware `parseStorageUrl` / `toSignedUrl` (keeps URL fallback on sign fail)
- `SecureMedia` already present (`SecureImage` / `SecureVideo` / `SecureAudio`)
- Publish paths → `storageRefUrl`: UnifiedComposer, PostComposer, VideoEditor, PodcastUploader, LiveStreamManager, TopFiveVideos, Recruiting, ProfileVideoRecorder, useChat
- Playback → Secure* / `toSignedUrl`: Recruiting, TopFive, AthleteProfile, FriendChat, WatchLater, Favorites, LiveNowFeed, StreamReplay, FullScreenVideoModal, AnimatedAvatar, Search thumbs
- `scripts/verify-signed-media.mjs` — all checks pass

**Skipped:** Marketplace upload path (page not in target; client removed it)

**DB:** none  
**Smoke-test:** upload a post/story/chat image → media plays; Network shows `/object/sign/` not bare `/object/public/` for private buckets

---

## ISSUE-032 — AthleteMatch into Games hub — DONE

**Status:** PORTED — committed on `port/audit-issues` (local only; not pushed).

**Brought into `sport-applause`:**
- `src/pages/Games.tsx` — register `AthleteMatch` as a hub card (`athlete-match`)
- Locale keys `games.athleteMatch` / `games.athleteMatchDesc` (en + es)
- Hub grid + summary strip updated for four games

**DB:** none (component already existed; wiring only)  
**Smoke-test:** `/games` → Athlete Match card → play a round → Back to Games

---

## ISSUE-038 — Package name — DONE

**Status:** PORTED — committed on `port/audit-issues` (`d74ca42`), not pushed.

**Brought into `sport-applause`:**
- `package.json` name → `usportz`
- `package-lock.json` root name → `usportz`

**DB:** none  
**Smoke-test:** none (metadata only)

---

## Still open (not ported / not fixed here)

| ID | Title | Notes |
|----|-------|--------|
| 006 | Go Live not real streaming | Needs vendor + ingest; copy mitigation only in source |
| 007 | Roles not enforced | Athlete / Fan / Recruiter |
| 009 | Follow system missing | |
| 010 | Followed / Latest feed missing | Depends on 009 |
| 013 | Biometric misleading | Source mitigated (UI disabled); verify in target if needed |
| 015 | Broad storage RLS | DB policy work |
| 021 | Multiplayer not competitive | |
| 022 | Trivia scores not persisted | |
| 023 | Premium gates cosmetic | Blocked on real Stripe (001) |
| 024 | Profile music missing | |
| 025 | Sport tag not editable after signup | |
| 026 | Motivation Save not persisted | |
| 030 | MCP schema mismatch | Source claimed fixed; re-verify if MCP tools are used |
| 031 | Live Remind Me incomplete | |
| 033 | No global protected routes | Frontend-only candidate |
| 034 | Recruiter dashboard ungated | Frontend-only candidate |
| 036 | Heavy `any` + mock components | Cleanup |
| 037 | Edge CORS `*` | Edge function headers |

---

## Suggested next (no DB)

1. ISSUE-033 — global protected routes  
2. ISSUE-034 — recruiter dashboard role gate  
3. ISSUE-037 — tighten edge CORS (if edge functions are owned here)

---

## Per-issue done checklist

- [x] Files copied / merged into `sport-applause` (for DONE issues above)
- [x] Committed on branch `port/audit-issues` (`d74ca42`, `4510346`)
- [ ] Push branch (only when asked)
- [ ] App builds (`npm run build`) — re-verify before push
- [ ] Feature smoke-tested locally — per-issue notes above
- [x] Migration applied if listed — ISSUE-005 live; ISSUE-014 invite SQL still confirm on live DB
)
