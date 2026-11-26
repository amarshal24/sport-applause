# Tracking evaluation harness

Runs the shipped tracker core (`trackFrames`) on real footage decoded by ffmpeg and scores it against
hand-labeled ball positions (`ground-truth.json`).

    ffmpeg -i clip.mp4 -vf "fps=24,scale=288:-2,format=gray" -f rawvideo clip.gray
    tsx scripts/tracking-eval/evalTrack.mts clip.gray 288 <height> <startT> <x%> <y%> '[[t,x%,y%],...]'

Scoring: LOCKED = within half a ball radius, on-ball = within one radius, otherwise MISS.
Also prints max frame-to-frame jump and the number of low-confidence frames.
Not a CI gate yet: labels need human verification and footage is not committed (minors).
