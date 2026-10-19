# Complete Video Editor: validation and limits

## Implemented
- Additive authenticated `/timeline-editor`, linked from Animation Center and Motion FX Studio; no existing database records, original uploads or entitlement code changed.
- Local per-user IndexedDB snapshot includes source Blobs, tracks, trims, transforms, keyframes, text, effects and mix settings. This is device-local recovery, not cloud synchronization or a multi-project library.
- Multiple video/audio/text/effects lanes, drag arrangement, add tracks, duplicate/split/delete, undo/redo, frame-based trims and source offset, 30 FPS integer scrubbing.
- Mediabunny exact source-frame decoding and frame-timestamped H.264/AAC MP4 export with fast-start metadata. Native browser encoders are preferred; AAC and H.264 on-device WASM encoders are loaded only when needed. Software H.264 packets are copied into the final MP4 alongside AAC, not transcoded from WebM. Preview and export share canvas composition. Real-time preview may skip displayed frames under heavy load; export renders every timeline frame.
- Position/scale/rotation/opacity/effect-intensity keyframes; picture-in-picture and clipped left/right split-screen compositions; circle/rectangle masks, blend modes, green-screen keying and MediaPipe person-background segmentation.
- Personal audio, recorded voiceovers, source-audio separation/mute, trims/fades, layered mixing, peak normalization, basic high-pass/noise gate and music ducking under clips named Voiceover. Original synthetic swish/impact/whistle can be placed on exact action frames.
- Text/caption edits, animated fade/slide/pulse, emoji stickers, scoreboard/player/team/stat text templates and local template-based object-following overlays.
- Existing speech caption function reused without changing its model or behavior. Only the selected clip audio is sent as a complete WAV. Timings are estimated from transcript length, not measured word timestamps.
- All 25 requested Sports FX names categorized into basketball/football/soccer/baseball/fitness; stylized procedural families support duration/intensity and shared rendering. These are not photoreal AI-generated sport-specific animations or automatic event detectors.

## Verified
- 15 timing/correction/upload tests pass, including nine timeline rules.
- Browser: real media import, typed sports title, FX application, 30 FPS layered export read-back, project recovery with original local media, 390px layout without horizontal overflow, no runtime errors.
- Browser: separate source audio, capture fake-microphone voiceover, person-background removal on official MediaPipe pose sample, PIP/split composition, mask/blend selection, position keyframes, drag by 30 frames and advanced export.
- Spoken sample returned editable caption clips. The synthetic name was imperfectly recognized; user review remains required.
- All 25 FX families rendered nontransparent pixels at a sample timestamp. Actual mixed audio samples confirmed fades and 0.25 ducking, with regular music level restored outside the voiceover interval.
- Earlier WebM export inspected: VP9 video at 30 FPS and Opus audio; displayed sports title and flame particles present. Superseded by MP4 export below.
- Native MP4 follow-up: signed-in editor imported real Randy Chiu basketball footage, applied title/Rim explosion/timed hoop swish, cancelled and restarted export, and downloaded a directly generated MP4. Independent decoding found H.264 Baseline at 1280×720/30 FPS (90 frames) and stereo AAC-LC at 48 kHz, 3.029s including audio encoder padding, with no warnings. Decoded frame retained footage/title/FX; non-silent audio confirmed. All 19 timing/export tests pass. Originals and creator records unchanged.

## Remaining
- No verified licensed music catalog: no third-party tracks are added or claimed cleared. Requires license evidence covering platform use, redistribution/monetization and territory.
- Sounds require manual sports-action timestamps; automatic action recognition not implemented.
- Word-aligned captions unavailable from the existing transcription response; timings remain editable estimates. Long selected audio must be split manually if WAV exceeds 24MB.
- Person segmentation tested on a still pose sample, not sustained complex moving footage. Background removal inference can be slow. Arbitrary-object/occlusion and robust motion-following remain template-tracker limitations.
- Arbitrary editable vector masks, advanced spectrally adaptive noise removal, LUFS loudness normalization, waveform UI, speed-ramping and semantic muscle anatomy are not implemented by the basic controls.
- Sandbox Chromium lacks H.264/AAC playback codecs, so its HTML video player cannot play the MP4 even though independent decoding succeeds without warnings; native browser playback remains unverified here. Software H.264 export does not require browser H.264 encoding, but long/heavy projects can be slow and use substantial memory. Native Safari/mobile hardware needs device testing. Local storage quota can prevent recovery; errors advise exporting.

Skill used for caption integration: ai-apps-speech-to-text. Existing service/model selection was preserved.