# Roadmap

## Homepage category visuals (2026-10-27)
- [x] Replace empty app previews with 17 category cards using 16 generated illustrative camera stills; preserve member privacy and existing sample videos.
- [x] All 17 images load with exact CDN-uploaded bytes supplied to local preview; desktop gallery visually checked and Podcasts link opens registration with intended destination; 2 access tests pass and build clean. Local sandbox CDN proxy unavailable; hosted playback not rechecked. Not published.

## Regular website account signup (2026-10-27)
- [x] Correct homepage and application thank-you registration links; open signup directly and show submission errors; confirmation messaging reflects returned session.
- [x] Hosted email signup enabled and registrations allowed; homepage → registration → HTTP 200 account creation → signed-in profile with saved username verified, no runtime errors; 2 access tests pass. Isolated signupcheck test account retained; no existing accounts changed. Not published.

## Subscriber navigation and domain verification (2026-10-27)
- [x] Add newsletter/event subscriber-list links to both application admin pages; keep existing admin-only access.
- [x] Verify usportz.com and www.usportz.com: both connected, routing records match and ownership verified. DNS remains managed at Wix.
- [ ] Verify email sending (blocked: no email domain configured; user must complete email setup for usportz.com).

## Homepage video and signup capture (2026-10-27)
- [x] Add existing 10-second editing sample with MP4/WebM sources and shared Founding 100 application form to public homepage; preserve signed-in home. Hosted video decoded; browser playback verified using hosted file responses (local asset proxy does not serve CDN files).
- [x] Verify public homepage application → thank-you → private application row; admin review loads; delete only test application by ID. Nine validation/consent tests pass; no publication.
- [ ] Turn on owner signup emails to Yousportz25@gmail.com (blocked: sender domain not configured/verified; email setup opened).

## Game purchases and protected-host testing (2026-10-27)
- [x] Prepare approved creator-game/pass readiness rules; dedicated gaming prices $3.99/$7.99, environment/status/library gates and native/live safeguards tested; unfinished libraries stay unavailable. No new live activation or catalog entries.
- [x] Build /admin/game-testing and hosted sandbox reference game/asset session boundary; six hosted authorization checks pass, preview gameplay works, signed-out denial and phone layout verified; fixtures removed (zero remaining runs).
- [ ] Complete sandbox Stripe settlement/refund/dispute and payout-allocation/double-allocation flows in the new harness (blocked: checkout submission did not complete; user must complete all required billing fields with the test card in preview; no settled records fabricated). Server/UI controls exist but success paths are unverified.
- [ ] Implement paid-pass recurring checkout/ledger and promised libraries (blocked: unavailable library categories, recurring billing/entitlement lifecycle and authoritative catalog inventory).
- [ ] Activate ready creator-game sales only after host and payment safeguards pass (blocked: participating production host, external payout validation and separately approved real-charge testing).
- [ ] Review shared-media storage warning without removing user-approved member sharing (blocked: warning is active; owner-only restriction would break intended sharing).

## Production readiness audit (2026-10-27)
- [x] Produce fresh evidence-based readiness report and prioritized release plan; 64 local tests pass, authenticated/public/mobile page checks performed, Stripe setup complete, private buckets/RLS verified; approved sales preserved, no charges/publishing. Signed-out Games exposure and custom-domain DNS blockers reproduced.
- [x] Add /admin/launch, shared signed-out gate, search/email/CSV safety and keyboard game controls after plan approval; 69 tests pass; 33 app-only signed-out URLs denied, public routes preserved, authenticated dashboard/checklist, phone layout and search race/error states verified. No publishing, charges, DNS, database changes or scheduler redeployment.
- [ ] Remediate remaining completed deep-scan findings: friendship/invite authorization, game integrity, public AI access, trusted portal origins and premium audio revocation (blocked: targeted backend verification/design work outside the first-stage release boundary; hosted email settings unverified). Search/CSV changes await fresh security verification.
- [ ] Deploy and verify shared notification-email safety in the hosted payout scheduler (blocked: first-stage no-release-side-effects boundary; email infrastructure unverified).
- [ ] Complete native iOS/Android release preparation (blocked: store accounts, billing policy implementation, signing tools and physical-device testing).
- [ ] Verify backups/restore, current security scans, production commerce lifecycle and safety/legal operations (blocked: hosted backup confirmation, authorized real-charge test and operational/legal review).

## Podcast live activation (2026-10-27)
- [x] Validate podcast inputs/return origin, scope live approval to memberships/unlocks, prevent active membership repurchases; enable live flag. Both live session creation paths verified without charges; tips stay blocked.
- [x] Add /podcasts/thank-you with authenticated session ownership, Stripe settlement and shared ledger reconciliation; unpaid/invalid/missing checkouts verified without success claims; 8 focused tests pass.
- [ ] Verify successful live settlement, renewals/refunds and external creator payout end-to-end (blocked: separately authorized real-charge test; payouts remain manual). Test purchase success page not exercised with a settled checkout.

## Connected commerce (2026-10-27)
- [x] Connect selected Founding 100 membership to confirmed-email accounts with free PRO FX/elite skin benefits; browser-tested selection and waitlist revocation without changing purchase records; temporary application removed.
- [x] Add /admin/revenue with separate test/live Stripe charge pagination, FX/skin purchases, subscriptions, refunds and creator earnings/payout records; authenticated load and signed-out denial verified. Totals explicitly bounded to loaded entries.
- [x] Add /purchases navigation and settlement/ownership confirmation before checkout return success; 21 focused tests pass, invalid podcast confirmation denied, existing FX/skin checkout remains enabled.
- [x] Activate web podcast memberships/premium content on explicit approval; live sessions work, full real-charge lifecycle remains unverified.
- [ ] Activate public game monetization after protected host/payment tests (blocked: external host integration and native billing certification).

## Live payment audit (2026-10-20)
- [x] Enable approved live FX/skin checkout after Stripe readiness completion; authenticated requests created live sessions for all five products, unknown products/foreign returns denied, podcasts remain blocked; 4 safeguard tests pass. No payments submitted; live form/payment/refund flow remains unverified (2026-10-27).
- [x] Check Stripe activation and payment sections without charges or creator-data changes: authenticated pages load, 19 tests pass, live FX/skin/podcast/game refusal paths verified; findings in docs/live-payment-audit-2026-10-20.md.
- [x] Fix FX/skin buyer validation, refund revocation, webhook recording errors, FX subscription separation.
- [x] Stripe live app installed, live keys provisioned, readiness completed; FX/skin approval flag enabled with explicit user approval (2026-10-27).
- [x] Podcast return page confirms authenticated checkout ownership and Stripe settlement before success copy; invalid session cannot claim an unlock (2026-10-27).
- [ ] Successful live payment/renewal/refund/payout checks (blocked: separately approved real-charge test; podcast/game launch safeguards remain separate).

## Complete Video Editor and Sports FX (sections 4–5)
- [x] Fix native AVC profile compatibility (Constrained Baseline, frame-rate-aware levels, even-dimension validation); 23 tests pass, fresh authenticated sports export plays in codec-capable Google Chrome with no player/runtime/independent-decoder errors.
- [ ] Certify exported MP4 playback on physical iPhone/Safari and Android devices (blocked: physical devices unavailable).
- [x] Edit credited Randy Chiu free-throw footage through actual authenticated timeline; trim, separated audio, animated title, timed Rim explosion/synthetic swish; export/reopen/recover verified, 90 frames and visually matching preview/export; H.264 unsupported in test browser so source-compatible VP9 copy used; creator records unchanged
- [x] Replace timeline WebM export with direct H.264/AAC MP4 (lazy on-device fallback encoders); authenticated real sports edit/export and cancellation verified, 90 frames/30 FPS and non-silent AAC independently decoded without warnings or post-export conversion; 19 tests pass. Sandbox lacks MP4 playback codecs; native-device playback remains unverified.
- [x] Add /timeline-editor: unlimited video/audio/text/FX tracks, drag arrangement, 30 FPS frame stepping, transform/opacity/intensity keyframes, PIP/split, masks/blends, green-screen and AI person removal, local autosave/recovery; verified in browser
- [x] Add personal audio, voiceover, audio separation, trim/fades/mix/ducking/normalization/basic noise filter, frame-timed original sport sounds and mixed export; verified separation, voiceover and export
- [x] Add animated titles/stickers, sports labels/stats, editable caption text/style/timing, motion-following overlays and speech captions; verified captions with spoken audio
- [x] Add 25-effect categorized Sports FX library with timing/intensity and shared preview/export
- [ ] Licensed music library (blocked: rights-cleared catalog and license records)
- [ ] Automatic athlete-action sound timing and word-level caption timing (blocked: action-detection model; current captions service returns text only)

## AI Motion FX Studio
- [x] Scope studio to sections 1–3; complete multi-track timeline deferred by user
- [x] Add authenticated /motion-studio from existing editor: on-device click segmentation, independent template tracks, timestamp corrections, scale/visibility keyframes; verified moving local ball, two independent effects and manual fallback
- [x] Add timed particle Flaming Ball/electric/trails, optional timestamped hoop sound, original download and separate audio-preserving export; verified finite duration and audible audio
- [x] Add existing human AR live recording, compatible free-effect switching, lower-resolution composite and edit-recorded-clip handoff; verified fake camera capture, clip reopening, mobile overflow and cleanup paths
- [ ] Robust temporal segmentation, automatic depth/occlusion/re-entry and photoreal flames remain development, not certified by simple template tracking (blocked: advanced tracking engine/model integration)
- [ ] Real-device athlete tracking, camera performance and adaptive real-time quality certification (blocked: physical device/camera testing)
- [x] Implement provided timeline foundation (sections 4–5 above; remaining advanced behavior and external dependencies documented in docs/timeline-editor-validation.md)

## Public subscriptions, review safety, and launch readiness
- [x] Public newsletter/events signup with multiple interests, separate consent/history, hashed private unsubscribe, and admin visibility; signed-out submission, independent/all unsubscribe and private reads tested
- [ ] Verified game review safety: buyer submit/edit, report/hide, spam/direct/live/refund denials tested; non-admin moderation and cross-game duplicate tests await test-account access
- [x] Prepare THE FIRST 100 cinematic concept and reference pack; 30–45 seconds, narrator/music, authentic application screenshot, no desk presenter
- [ ] Render commercial after reference, script/plan and scene-image approvals (blocked: creative approval)
- [x] Deliver evidence-based launch-readiness report; generic real-money checkout server-blocked without explicit approval

## Marketing website (Founding 100)
- [x] Marketing home at signed-out `/` and `/welcome` (hero "YOUR GAME. YOUR PLATFORM.", 7 feature sections, film placeholder, app preview placeholders, download "coming soon" placeholders, newsletter form); signed-in home unchanged
- [x] /founding100 application page (name, email, role, sport, optional social username, beta interest, separate newsletter consent) with real approved counter capped at 100; /updates newsletter page; /thank-you confirmation
- [x] founding100_applications table (statuses applied/selected/waitlisted/rejected, unique email), rate-limited service-only submit function, duplicate-email handling, count-only public RPC; 6 unit tests pass
- [x] Admin /admin/founding100 dashboard with review statuses, remaining spots, subscriber count, CSV export; verified end-to-end (submit → thank-you, duplicate, admin select, counter 1/100, anon reads denied, mobile layout); test rows removed
- [ ] Founding 100 confirmation/welcome emails (blocked: no verified sending domain)
- [ ] Brevo marketing connection for opted-in email (blocked: user must link Brevo account via connect card)
- [ ] Real app screenshots to replace preview placeholders (blocked: needs approved screenshots)
- [ ] Custom domain deployment per docs/deployment-checklist.md (blocked: domain choice + publish approval)

## Founders Club landing page
- [x] Add branded public landing and application form without changing existing signed-in app
- [x] Securely store applications and add admin review; verified public submission, persisted admin acceptance/notes, private reads and denied direct inserts; removed test application
- [ ] Integrate supplied HTML design (blocked: HTML attachment missing)
- [ ] Send applicant confirmation emails (blocked: no verified sending domain)
- [ ] Provide THE FIRST 100 cinematic sports commercial (blocked: reference/script/image approvals; replaces desk-presenter direction)

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
- [ ] Activate paid game sales after protected delivery, reconciliation, refunds, billing compliance and real payout controls pass (blocked: live Lovable app installation/key provisioning/readiness and production controls unverified)

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

## Marketplace memorabilia on landing page (2026-10-27)
- [x] Add dedicated "Own a piece of the game" marketplace memorabilia section to the public homepage with generated illustrative display still, real category chips and signup-gated CTA to /marketplace; update the Marketplace feature card copy. Desktop and mobile screenshots verified, CTA opens registration with marketplace destination, image loads, build clean, no runtime errors. Not published.

## Combine feed and fans homepage cards (2026-10-27)
- [x] Merge "Sports videos, stories & trending" and "Fans & community" into one card ("Sports videos, stories & fans") with two links: Feed (/) and Fans & community (/fans). Card link labels are now data-driven (primaryLabel/secondaryLabel) so the Video editing & Motion FX card keeps its own labels. 14 cards render, both links open registration with the intended destinations, build clean. Not published.

## Remove AR Studio and Purchases homepage cards (2026-10-27)
- [x] Delete the "AR Studio & skins" and "Purchases & memberships" cards from the public homepage grid (12 cards remain); unused ar-studio still import removed. Verified 12 cards render with neither card present, build clean. Not published.

## Remove marketplace showcase section from landing page (2026-10-27)
- [x] Delete the "Own a piece of the game" marketplace memorabilia section from the public homepage and its unused image import; page sections are now hero, features, film, app, Founding 100, updates. The Marketplace card in the feature grid stays. Verified section absent, 12 cards intact, build clean. Not published.
