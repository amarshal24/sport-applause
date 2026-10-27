# Architecture rules
- Reference game testing uses isolated admin-owned sandbox runs and service-only short-lived hashed host sessions; every asset/gameplay request rechecks current purchase/revision, and test host evidence never certifies external live hosts.
- Test payout allocation is run/game-scoped and atomic, never creator-wide or a transfer; test cleanup must touch only run-owned rows and retain provider test history.
- Gaming-pass entitlements use dedicated price IDs and require verified library readiness; prepared rules are not billing activation or grants to other product families.
- All routes pass through a shared default-deny authenticated boundary with explicit public paths; callbacks return to public auth before a validated internal destination, and registration CTAs use `/auth?mode=signup` to avoid opening sign-in instead.
- User search text uses the shared quoted PostgREST literal builder and debounced requests discard superseded responses; punctuation must remain data, not filter syntax.
- Launch readiness is an admin-only versioned evidence view, never an automatic release/payment/submission control; static audit statuses must disclose their date and verification scope.
- Notification HTML and applicant CSV use shared escaping/neutralization helpers so untrusted content cannot become markup, unsafe links or spreadsheet formulas.

- Motion FX Studio is an additive authenticated editor; source files remain local and unchanged, shared deterministic source-time effect rendering drives preview/export, and manual corrections/visibility intervals supplement browser tracking without claiming automatic depth occlusion.
- Tap-selected object masks use a disposable on-device MediaPipe legacy interactive segmenter; arbitrary-object temporal tracking remains separate from the human AR pipeline and must expose correction/failure states.
- Repair duration metadata on MediaRecorder WebM outputs before reuse or download so live clips can reopen in the editor; keep browser-selected recording formats and original audio separate from source files.
- The multitrack editor stores per-user local project snapshots and source Blobs in IndexedDB; a shared compositing renderer drives frame-grid preview and MP4 H.264/AAC export, with lazily loaded on-device encoders when browser codecs are absent, so export remains compatible without changing originals or entitlements.
- Timeline AVC capability checks and native encoding share an explicit Constrained Baseline profile with resolution/frame-rate-aware levels and even-dimension validation to avoid browser-selected High-profile compatibility surprises.

- Keep Founders Club public submission in a validated, rate-limited edge function with service-only inserts and admin-only application reads/review; store applications separately so landing changes never alter existing app records.
- Founding 100 applications live in their own table (separate from Founders Club) with statuses applied/selected/waitlisted/rejected, service-only writes, admin-only reads, duplicate-email handling, and a count-only public RPC for the approved counter; marketing pages must never claim a founding spot is confirmed before admin approval.
- Keep the public landing available at /welcome and use it for signed-out home only; preserve the signed-in home experience.
- Homepage applications reuse the Founding 100 form and private submission flow; public category previews use labeled illustrative CDN stills, and sample videos never use member media, preserving privacy.
- Public subscriptions use service-only writes, an immutable consent-event history and hashed private unsubscribe tokens; email alone must never change an existing subscriber's consent or expose their unsubscribe link.
- Review safety uses a database spam guard and dedicated report/moderation RPCs; hiding a review excludes it from public summaries and cannot be reversed by buyer edits.
- Generic digital-product live checkout requires a server-side explicit approval flag before any payment-provider call; test checkout remains separate from launch approval.
- Founding benefits are derived by a self-only RPC matching confirmed Auth email to selected applications; do not create fake purchase ledger rows, and recheck selection so revocation follows admin review.
- Admin revenue is read-only, admin-checked server-side and environment-filtered; Stripe charge pagination and bounded local ledgers must disclose their scope, never imply lifetime totals.
- Pure commerce rules shared by client and edge functions stay in the functions shared directory; checkout return screens verify authenticated session ownership and Stripe settlement before success messaging.
- Podcast confirmations and webhooks share Stripe-backed reconciliation; production audio grants use live settled ledgers only, and renewal payment intents resolve through invoice payments for refund tracking.

- Dynamically load the app at bootstrap and wrap lazy pages in a load-error boundary; stale or unavailable dependency chunks must show a retry screen instead of blanking the app.

- Keep gaming package definitions in a shared catalog and render them on the Games page; use availability states to avoid selling unfinished game libraries.
- Game reviews are written only through an authenticated RPC that rechecks settled buyer orders and current reviewed delivery, excludes owner/preview access, and separates test/live ratings; one editable review per buyer/game/environment prevents repeat-rating inflation.
- Gaming subscriptions must use their own price-based entitlements and must not grant PRO FX, podcast memberships, or AR Skin Packs; these are separate products.
- Creator games use moderated listings with separately protected launch URLs and a distinct service-written sales ledger; external games never execute inside the app, and paid launch stays server-blocked until protected delivery and payment readiness pass.
- Paid-game authorization uses hashed host credentials and atomic single-use revision-bound tokens; immutable service-written orders reconcile provider settlement/refunds before access, and purchases stay restricted to explicitly enabled test games and admin buyers until production safeguards pass.
- Shared game payment reconciliation is used by webhooks and buyer confirmation; failed ledger writes throw for retry, so returning from checkout alone never grants access.
- Game payout allocations are atomic, source/environment-scoped and manually recorded; the podcast scheduler must exclude game payouts so it cannot simulate sending game earnings.