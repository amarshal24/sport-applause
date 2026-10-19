# Motion FX Studio validation

The Motion FX Studio is additive at `/motion-studio`, accessible from Animation Center. No accounts, stored originals, creator records or entitlement logic were modified. Uploaded sources are held locally; exports are separate files. The live selection excludes skins and paid filters rather than granting them outside existing entitlement checks.

## Verified
- Six unit tests cover selected effect timestamps, independent source paths, correction offsets/size interpolation, hidden/visible intervals, same-time correction replacement, the existing 100MB video limit and reversed effect ranges.
- Authenticated browser flow: upload, click-select mask, track, position correction, hide/show, a second independent electric effect, selected sound timestamp and edited export read-back.
- Segmentation model is a verified TFL3 binary registered as an app asset. The localhost test supplied the identical registered binary to the asset request because localhost serves the asset path as app HTML; the hosted asset URL returned the correct 6.2MB binary. Asset delivery on the final published studio has not been exercised.
- Magic Touch selected mask category is 0; 255 is background, confirmed against the running model. Model initialization failures expose manual selection instead of claiming success.
- A moving synthetic ball tracked from x=23.44% to x=50% over 1.9 seconds using a local Blob; this tests motion rather than only a static image. Complex real footage not certified.
- Edited export contains VP9 video and Opus audio, repaired duration 2.008 seconds; measured non-silent audio and viewed a rendered effect frame.
- Fake-device camera stream recorded, read back, and reopened through Edit clip with known duration. No page runtime errors in the successful run. This does not validate real human landmarks or physical mobile hardware.
- Desktop and 390px mobile layouts inspected; no horizontal overflow. Accessibility control repositioned clear of object editing tools.

## Limitations
- AI selection isolates one paused frame. Temporal movement uses the existing local grayscale template tracker, not a video segmentation model. Object rotation, perspective, obstruction and re-entry are not robustly solved automatically.
- Flames are deterministic stylized particles, not photoreal simulation. Size/perspective and occlusion use explicit correction/visibility keyframes. No automatic hoop recognition: hoop sound uses a chosen timestamp.
- Live mode reuses human face/body AR effects. Real-time arbitrary equipment selection, live color/background editing and full device-adaptive inference fallback remain incomplete. Lower resolution changes compositing size, not model input resolution. No-effect capture can be edited afterward.
- Export runs in real time, at up to 1280px longest edge, and uses browser-supported recording codecs. Background-tab throttling, long-video load and cross-browser/device performance need further testing.
- Complete multi-track timeline deferred because the supplied brief ends at section 4 “Trim,” and the user selected starting sections 1–3.