# Roadmap

## Public subscriptions, review safety, and launch readiness
- [ ] Public newsletter/events signup with multiple interests, separate consent, secure unsubscribe, and admin visibility
- [ ] Verified game review spam protection, reporting and moderation; test authorized and unauthorized flows
- [ ] Prepare THE FIRST 100 cinematic sports-commercial concept (30–45 seconds, narrator, music, authentic app screenshots; no desk presenter)
- [ ] Deliver evidence-based launch-readiness report; real-money sales remain off without approval

## Founders Club landing page
- [x] Add branded public landing and application form without changing existing signed-in app
- [x] Securely store applications and add admin review; verified public submission, persisted admin acceptance/notes, private reads and denied direct inserts; removed test application
- [ ] Integrate supplied HTML design (blocked: HTML attachment missing)
- [ ] Send applicant confirmation emails (blocked: no verified sending domain)
- [ ] Provide generated-scenes app-explainer sample promotional video (blocked: script/look approval)

## Creator game store
- [x] Add game ratings and written reviews with server-enforced verified-buyer access; tested pending denial, settled submission/edit persistence, direct-write/live spoofing denial, refund and stale-revision denial; removed isolated test records
- [x] Add protected test previews, private host keys, single-use authorization, delivery review, and changed-destination invalidation; test signed-in and clean up test game
- [ ] Complete participating game host integration and verify host-side unpaid access denial (blocked: creator host integration)
- [x] Add admin-only, explicitly enabled test-game checkout and Purchased games; verified $4.99 Stripe test-card settlement, fresh-session persistence, 75-cent commission, partial/full refunds, and host access revocation; removed test records
- [x] Add source-separated atomic game payout allocation and refund/dispute payout holds
- [ ] Validate payout double-allocation, dispute/delayed-payment flows, and actual external-host gameplay gating before production (blocked: production host and payment readiness)
- [x] Add creator listings, price setting, review, and free game launching
- [x] Add private creator sales and earnings views
- [x] Verify signed-in submission, ownership spoof prevention, admin review, disabled paid checkout, persistence, and test cleanup
- [x] Verify non-admin reviewer rejection and admin rejection using the test creator account (completed in earlier test)
- [ ] Activate paid game sales after protected delivery, reconciliation, refunds, billing compliance and real payout controls pass (blocked: Stripe account claim still at step 1 and production controls unverified)

## Game tier packages
- [x] Add Rookie, All-Star, and MVP package comparison with accurate availability
- [x] Preserve playable games while unfinished paid packages remain unavailable
- [x] Test package prices and paid-sales restrictions
- [ ] Build the missing paid game categories and paid-pass entitlements before selling passes

## Real-time AR tracking engine (in progress)
- [x] Shared types / stage contracts (`src/lib/ar/types.ts`)
- [x] Temporal smoothing (One Euro + constant-velocity predictor)
- [x] Multi-target tracker with persistent IDs, coasting, occlusion handling
- [x] Off-main-thread inference worker + main-thread fallback
- [x] Anchor/filter registry (head, face, eyes, hands, torso, hips, feet, full body)
- [x] Full-body skin swap: segmentation mask + skeletal retargeting
- [x] Renderer / compositor + photo & video capture
- [x] AR Studio page (/ar-studio) with debug HUD, filter picker, FPS stats

## Vision layer (requested architecture)
- [x] `src/lib/vision/{poseTracker,faceTracker,segmenter,trackingManager,smoothing}.ts`
- [x] `src/lib/filters/filterRenderer.ts` — anchored filter registry
- [x] AR Studio page: debug mode, head filter, segmentation, skin swap
- [x] Controls: start/stop/switch camera, upload video, filter picker, tracking + debug toggles

## AR camera UI (TikTok/Snapchat-style)
- [x] Full-screen vertical camera, front/back switch, flash, permissions
- [x] Photo/video modes, record button + timer, filter carousel, debug HUD
- [ ] Publish captured AR clips straight into the feed composer

## App-wide audit (requested)
- [x] TypeScript + lint clean for the vision/AR layer
- [ ] Full app sweep (routes, auth, queries, forms, mobile) — pending
- [ ] Runtime audit: cleanup of rAF loops, camera streams, timers, workers
- [ ] Camera/AR audit: single model init, valid frame dims, resize/orientation, unmount teardown

## AR skin mode (requested)
- [x] Live skin editor: pose offset, scale, bulk, head size, lean, glow, opacity, idle animations
- [x] Full-body skin mode via segmentation mask + skeletal retarget
- [x] Face-only skin mode (mask/helmet locked to head pose)
- [x] AI Skin Swap presets wired into AR filter carousel

## Follow-ups
- [ ] Character copies exact movement: skeletal retargeting of animated superhero / athlete / cartoon rigs
- [ ] Additional character skins + premium gating reuse
