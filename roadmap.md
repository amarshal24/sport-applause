# Roadmap

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
