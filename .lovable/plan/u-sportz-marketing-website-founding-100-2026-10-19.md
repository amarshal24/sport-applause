# U⚡️Sportz marketing website (Founding 100)

Build the uploaded brief as a public marketing layer on top of the existing app. All existing features, data, and the signed-in home stay unchanged.

## Routes
- `/` — signed-out visitors see the new marketing home (signed-in users keep the current app home). `/welcome` shows the same marketing page.
- `/founding100` — application page
- `/updates` — newsletter/updates page
- `/thank-you` — confirmation after applying

## Home (marketing)
- Hero: "YOUR GAME. YOUR PLATFORM." / "Create. Compete. Connect." — black, electric blue, white, cinematic sports imagery, animated transitions
- Feature sections: sports videos, AI object-tracking effects, full video editing, athlete profiles, podcasts, live content, community
- Commercial video placeholder (THE FIRST 100 film slot), app screenshot section, Founding 100 CTA, newsletter form, mobile app download placeholders labeled "coming soon" (no app-store claims)

## Founding 100
- Headline "THE FIRST 100 CHANGE THE GAME."; explains early membership, priority beta consideration, founding badge, feedback opportunities — never claims a spot is confirmed until approved
- Form: name, email, role (athlete, coach, creator, podcaster, fan), sport, optional social username, beta-testing interest, separate optional newsletter consent
- Real approved-member counter (selected count, capped at 100) via a public count-only RPC — no fabricated numbers
- Success → `/thank-you`

## Database (new, separate from existing Founders Club table)
- `public.founding100_applications`: name, email (unique, lowercase), role, sport, social_username, beta_interest, newsletter_consent, status (applied/selected/waitlisted/rejected), admin_notes, timestamps
- Grants + RLS: no public reads; service-role writes only; admin reads via `has_role`
- Rate-limit table + `consume_founding100_limit` (same pattern as Founders Club), public `founding100_approved_count` RPC (count only)
- Edge function `submit-founding100-application`: zod validation, honeypot, size limit, per-IP/per-email rate limits, duplicate-email returns a friendly "already applied" without revealing data; if newsletter consent checked, also creates a public subscription through the existing consent-tracked flow

## Updates page
- Newsletter signup (existing consent-tracked subscription form), plus sections for feature updates, creator spotlights, beta announcements, launch news — clearly labeled, no invented news items

## Admin
- New `/admin/founding100` dashboard (admin-only): applicants with status review (applied/selected/waitlisted/rejected), approved member count, remaining spots, newsletter subscriber count, CSV export of applicants

## Email
- Confirmation/welcome emails and Brevo marketing connection require a verified sending domain and your Brevo account — built as pending steps, not faked. I'll open the Brevo connect card at the end so you can link it when ready.

## Also included
- SEO title/description/og metadata in index.html, accessible responsive layouts, a lightweight analytics event helper (page views, form submits), links to existing Terms/Privacy pages, and `docs/deployment-checklist.md` for the custom domain launch

## Verification
- Unit tests for validation schemas; Playwright end-to-end: apply → thank-you, duplicate email, counter accuracy, admin review + CSV, unsubscribe, mobile layout, signed-in home unchanged
- Nothing is published; real-money and email sending stay off
