# Roadmap

## Real-time AR tracking engine (in progress)
- [x] Shared types / stage contracts (`src/lib/ar/types.ts`)
- [ ] Temporal smoothing (One Euro + constant-velocity predictor)
- [ ] Multi-target tracker with persistent IDs, coasting, occlusion handling
- [ ] Off-main-thread inference worker (person detect, pose, face, hands, segmentation)
- [ ] Attachment/anchor system (sprites, sequences, vector FX) — extensible registry
- [ ] Full-body skin swap: segmentation mask + skeletal retargeting to a character rig
- [ ] Renderer / compositor + final output stream
- [ ] AR Studio page with live camera, filter picker, FPS stats

## Vision layer (requested architecture)
- [ ] `src/lib/vision/{poseTracker,faceTracker,segmenter,trackingManager,smoothing}.ts`
- [ ] `src/lib/filters/filterRenderer.ts` — anchored filter registry
- [ ] AR Studio page: debug mode first (skeleton + boxes + FPS), then head filter, then segmentation, then skin swap
- [ ] Controls: start/stop/switch camera, upload video, filter picker, tracking toggle, debug toggle

## AR camera UI (TikTok/Snapchat-style)
- [x] Full-screen vertical camera, front/back switch, flash, permissions
- [x] Photo/video modes, record button + timer, filter carousel, debug HUD
- [ ] Publish captured AR clips straight into the feed composer

## App-wide audit (requested)
- [ ] TypeScript/lint/build clean
- [ ] Runtime audit: cleanup of rAF loops, camera streams, timers, workers
- [ ] Camera/AR audit: single model init, valid frame dims, resize/orientation, unmount teardown

## Follow-ups
- [ ] Character copies exact movement: skeletal retargeting of animated superhero / athlete / cartoon rigs
- [ ] Additional character skins + premium gating reuse
