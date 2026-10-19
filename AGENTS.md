# Architecture rules

- Motion FX Studio is an additive authenticated editor; source files remain local and unchanged, shared deterministic source-time effect rendering drives preview/export, and manual corrections/visibility intervals supplement browser tracking without claiming automatic depth occlusion.
- Tap-selected object masks use a disposable on-device MediaPipe legacy interactive segmenter; arbitrary-object temporal tracking remains separate from the human AR pipeline and must expose correction/failure states.
- Repair duration metadata on MediaRecorder WebM outputs before reuse or download so live clips can reopen in the editor; keep browser-selected recording formats and original audio separate from source files.
- The multitrack editor stores per-user local project snapshots and source Blobs in IndexedDB; Mediabunny frame decoding/encoding and a shared compositing renderer drive frame-grid preview/export without changing originals or existing entitlement rules.

- Keep Founders Club public submission in a validated, rate-limited edge function with service-only inserts and admin-only application reads/review; store applications separately so landing changes never alter existing app records.
- Keep the public landing available at /welcome and use it for signed-out home only; preserve the signed-in home experience.
- Public subscriptions use service-only writes, an immutable consent-event history and hashed private unsubscribe tokens; email alone must never change an existing subscriber's consent or expose their unsubscribe link.
- Review safety uses a database spam guard and dedicated report/moderation RPCs; hiding a review excludes it from public summaries and cannot be reversed by buyer edits.
- Generic digital-product live checkout requires a server-side explicit approval flag before any payment-provider call; test checkout remains separate from launch approval.

- Dynamically load the app at bootstrap and wrap lazy pages in a load-error boundary; stale or unavailable dependency chunks must show a retry screen instead of blanking the app.

- Keep gaming package definitions in a shared catalog and render them on the Games page; use availability states to avoid selling unfinished game libraries.
- Game reviews are written only through an authenticated RPC that rechecks settled buyer orders and current reviewed delivery, excludes owner/preview access, and separates test/live ratings; one editable review per buyer/game/environment prevents repeat-rating inflation.
- Gaming subscriptions must use their own price-based entitlements and must not grant PRO FX, podcast memberships, or AR Skin Packs; these are separate products.
- Creator games use moderated listings with separately protected launch URLs and a distinct service-written sales ledger; external games never execute inside the app, and paid launch stays server-blocked until protected delivery and payment readiness pass.
- Paid-game authorization uses hashed host credentials and atomic single-use revision-bound tokens; immutable service-written orders reconcile provider settlement/refunds before access, and purchases stay restricted to explicitly enabled test games and admin buyers until production safeguards pass.
- Shared game payment reconciliation is used by webhooks and buyer confirmation; failed ledger writes throw for retry, so returning from checkout alone never grants access.
- Game payout allocations are atomic, source/environment-scoped and manually recorded; the podcast scheduler must exclude game payouts so it cannot simulate sending game earnings.