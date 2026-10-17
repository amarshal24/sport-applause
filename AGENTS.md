# Architecture rules

- Dynamically load the app at bootstrap and wrap lazy pages in a load-error boundary; stale or unavailable dependency chunks must show a retry screen instead of blanking the app.

- Keep gaming package definitions in a shared catalog and render them on the Games page; use availability states to avoid selling unfinished game libraries.
- Gaming subscriptions must use their own price-based entitlements and must not grant PRO FX, podcast memberships, or AR Skin Packs; these are separate products.