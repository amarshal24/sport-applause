# Architecture rules

- Dynamically load the app at bootstrap and wrap lazy pages in a load-error boundary; stale or unavailable dependency chunks must show a retry screen instead of blanking the app.

- Keep gaming package definitions in a shared catalog and render them on the Games page; use availability states to avoid selling unfinished game libraries.
- Gaming subscriptions must use their own price-based entitlements and must not grant PRO FX, podcast memberships, or AR Skin Packs; these are separate products.
- Creator games use moderated listings with separately protected launch URLs and a distinct service-written sales ledger; external games never execute inside the app, and paid launch stays server-blocked until protected delivery and payment readiness pass.
- Paid-game host previews use hashed host credentials and atomic single-use, revision-bound launch authorization; production purchase authorization stays disabled until checkout and financial safeguards pass, because a shared external URL is not protected delivery.