# Custom domain deployment checklist

Use this when connecting the U⚡️Sportz custom domain and going live with the marketing site.

## Before connecting the domain
- [ ] Publish the app from Lovable (user approval required — do not publish without it).
- [ ] Confirm the published URL loads `/`, `/founding100`, `/updates`, `/thank-you` and `/welcome`.
- [ ] Confirm signed-in users still land on the app home, not the marketing page.

## Domain
- [ ] Connect the custom domain in Lovable (Project Settings → Domains) and complete the DNS step at the registrar.
- [ ] Wait for SSL to provision; verify https loads with no certificate warning.
- [ ] Note: the previous domain `allyousports.org` is tombstoned — a fresh domain or re-verification is required.

## Email (required for confirmation/welcome emails and Brevo marketing)
- [ ] Paid plan active (email sending requires it).
- [ ] Verify a sending domain — a domain bought through Lovable verifies automatically; an external registrar needs the DNS records added.
- [ ] After verification, ask the agent to wire Founding 100 confirmation/welcome emails and newsletter sending.
- [ ] Connect Brevo (connector card) for opted-in marketing email; API key stays server-side.

## Auth & redirects
- [ ] Confirm sign-in works on the custom domain (OAuth redirect URLs include the new origin).

## Analytics
- [ ] Add a tag manager snippet to `index.html` if desired; `src/lib/analytics.ts` already pushes `page_view` and `founding100_application_submitted` events to `window.dataLayer`.

## Final checks
- [ ] Submit a test Founding 100 application on the live domain; confirm it appears in `/admin/founding100` and the counter is accurate.
- [ ] Submit a test newsletter signup; confirm unsubscribe link works.
- [ ] Delete test rows after verification.
- [ ] Real-money purchases remain disabled until separately approved.
