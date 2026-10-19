# U⚡️Sportz launch readiness — 19 October 2026

## Decision
Not cleared for public paid launch. No real-money purchases were activated. An explicit server approval gate was added to generic digital-product checkout and tested against a live-mode request; the request was refused before a provider checkout could be created. Podcast live checkout remains separately gated, and creator games remain restricted test purchases.

## Fully exercised this session
- Public signup at /welcome: no account, six simultaneous sports/media/coaching/fitness/creator interests, newsletter and events independently recorded. Admin read-back at /admin/subscribers confirmed persisted preferences.
- Private unsubscribe: newsletter-only cancellation retained event consent; all-updates cancellation worked. Consent history recorded subscribe, newsletter cancellation, and all cancellation. Anonymous subscriber reads/direct writes and a forged link were denied.
- Review buyer flow: isolated settled sandbox order allowed five-star written submission and editing; report dialog reached /moderation; admin hid the review; hidden reviews were excluded from visible results and buyer edits could not restore them.
- Server denials: link spam, invalid six-star rating, direct insert, live-environment spoof, signed-out submission, and fully refunded buyer.
- Mobile signup and application capture inspected at 390×844; no horizontal overflow, no floating menu obscuring these public pages.
- 24 unit tests passed, covering subscription choices, review validation, approval flag, package prices, commissions, listing validation, protected URL handling and application validation. Preview build reported OK.
- All isolated game/order/review/report/subscriber fixtures removed; no real payment or creator sales-ledger entry was created.

## Built but not fully cleared
- One editable review per buyer/game/environment prevents rating multiplication. Original-body duplicate checks and duplicate-report uniqueness exist, but cross-game duplicate and concurrent abuse checks were not exercised this session.
- Non-admin report moderation requires a protected role check. A fresh non-admin test-account session could not be minted with current workspace permissions, so non-admin moderation and owner-review denials were not re-run. Do not mark the full review-security suite complete.
- Unsubscribe links currently must be saved from the signup receipt. Existing email addresses cannot overwrite preferences or retrieve another person's link. Email-based link recovery, double opt-in/ownership verification and secure re-subscribe/interest editing await verified sending and additional work.
- Newsletter/event campaign composing, delivery, scheduling, segmentation and analytics are not implemented. This is subscription capture and consent management, not a sending service. Public signup has input validation and a honeypot; no high-volume abuse/load test or standard rate-limit infrastructure is claimed.
- Admin subscriber list shows latest 1,000 records; pagination/export is not implemented.
- Formal age/guardian consent, recruiting safeguarding operations, moderation staffing/response standards and a privacy/legal review need approval before marketing to young athletes. Separate newsletter/event choices are not proof of legal compliance.
- Promotional commercial: cinematic reference pack and creative brief only; no rendered 30–45-second MP4, narration or music exists yet. Await reference approval, then script/plan approval, then scene-image approval before animation.

## Previously tested, not re-certified live today
- Founders Club submission/private admin review and saved decisions/notes.
- Skin packs and PRO FX test-card purchases, separated entitlements, and purchase persistence.
- Podcast tip/episode/membership test payments and private creator earnings; premium audio denial to unpaid users.
- Creator game test checkout settlement, commission, partial/full refunds, and revision-bound protected authorization.
These historical checks do not certify the current published build, live payments, real payouts or every regression path.

## Development remains
- Missing paid game categories and gaming subscription entitlements; paid passes remain unavailable.
- Real external game host unpaid-access denial, delayed settlement/disputes, concurrent payout allocation and production refund reconciliation.
- Full app sweep and AR camera/worker/timer teardown, resize/orientation audit; captured AR clips publishing into the feed; advanced rig retargeting.
- Original supplied HTML integration still awaits the missing HTML attachment.

## Outside services / approvals
1. Email: current email health check confirmed no sending domain. App emails need a paid plan and a verified domain owned by the project; verification alone does not activate newsletters or application confirmations. Use built-in transactional email, then test delivery and suppression/unsubscribe enforcement. Owner-notification destination must be confirmed.
2. Payments: current production approval was not established by a hosted readiness check this session. Earlier Stripe status was account claim step 1; recheck rather than treating it as current. Complete account activation, banking/tax/fraud/refund/dispute controls and request explicit launch approval.
3. Creator payouts: manual reference recording is not a bank transfer. Real transfers need an approved payout process/service and financial reconciliation; built-in Stripe setup does not automatically pay each creator.
4. Native apps: applicable Apple/Google digital-goods billing review and integration before native paid launch.
5. Creative: approve references, narration/script and scene images; validate audio continuity and final seams after rendering. THE FIRST 100 is a creative title, not a confirmed capacity limit, benefits promise or enrollment count.

## Where to review
- Subscribers: /admin/subscribers (admin only).
- Consent audit records: Lovable Cloud Database, public_subscriptions and subscription_consent_events; neither is publicly readable.
- Game reports: /moderation, Game review reports.
- Founders Club: /admin/founders.
- Payout references: /admin/payouts.