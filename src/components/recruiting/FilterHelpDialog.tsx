import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useEffect, useRef, useState } from "react";
import { Sparkles, RotateCcw, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import tutorialVideo from "@/assets/videos/recruiting-editing-tutorial.mp4.asset.json";
import captions from "./tutorialCaptions.json";

const timestamp = (seconds: number) => new Date(seconds * 1000).toISOString().slice(11, 23);
const captionText = "WEBVTT\n\n" + captions.map(cue =>
  `${timestamp(cue.start)} --> ${timestamp(cue.end)}\n${cue.text}\n`
).join("\n");
const labelTime = (seconds: number) => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;

interface FilterHelpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FilterHelpDialog({ open, onOpenChange }: FilterHelpDialogProps) {
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [captionUrl, setCaptionUrl] = useState("");
  const [showTranscript, setShowTranscript] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  useEffect(() => {
    if (!open) return;
    const url = URL.createObjectURL(new Blob([captionText], { type: "text/vtt" }));
    setCaptionUrl(url);
    setCurrentTime(0);
    return () => URL.revokeObjectURL(url);
  }, [open]);
  const activeCue = captions.find(cue => currentTime >= cue.start && currentTime < cue.end);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-4xl max-h-[85dvh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 pr-6 text-xl sm:text-2xl">
            <Sparkles className="w-6 h-6 shrink-0 text-primary" />
            How to add filters & animations
          </DialogTitle>
          <DialogDescription>
            Video tutorial · 12 minutes · Illustrated editing walkthrough
          </DialogDescription>
        </DialogHeader>

        <div className="aspect-video w-full overflow-hidden rounded-lg bg-muted">
          {open && !failed && (
            <video
              key={attempt}
              ref={videoRef}
              src={tutorialVideo.url}
              controls
              playsInline
              preload="metadata"
              aria-label="Filters and animations video tutorial"
              className="h-full w-full object-contain"
              onError={() => setFailed(true)}
              onTimeUpdate={event => setCurrentTime(event.currentTarget.currentTime)}
              onSeeked={event => setCurrentTime(event.currentTarget.currentTime)}
            >
              {captionUrl && <track kind="captions" src={captionUrl} srcLang="en" label="English" default />}
            </video>
          )}
          {failed && (
            <div className="flex h-full flex-col items-center justify-center gap-3 p-4 text-center" role="alert">
              <p className="text-sm text-muted-foreground">The video couldn’t load.</p>
              <Button variant="outline" onClick={() => { setFailed(false); setAttempt(value => value + 1); }}>
                <RotateCcw className="mr-2 h-4 w-4" /> Retry video
              </Button>
            </div>
          )}
        </div>
        <p className="min-h-12 text-center text-sm leading-relaxed" aria-label="Current caption">
          {activeCue?.text ?? ""}
        </p>
        <Button variant="outline" className="justify-start" aria-expanded={showTranscript} aria-controls="editing-tutorial-transcript" onClick={() => setShowTranscript(value => !value)}>
          <FileText className="mr-2 h-4 w-4" />{showTranscript ? "Hide transcript" : "Read transcript"}
        </Button>
        {showTranscript && (
          <section id="editing-tutorial-transcript" aria-label="Video transcript" className="border-t border-border pt-4">
            <h3 className="mb-3 font-semibold">Transcript</h3>
            <div className="space-y-3">
              {captions.map(cue => (
                <div key={cue.start} className="flex items-start gap-3" aria-current={activeCue === cue ? "true" : undefined}>
                  <Button variant="ghost" size="sm" className="shrink-0 font-mono text-primary" aria-label={`Jump to ${labelTime(cue.start)}`} onClick={() => {
                    const video = videoRef.current;
                    if (!video) return;
                    video.currentTime = cue.start;
                    setCurrentTime(cue.start);
                  }}>{labelTime(cue.start)}</Button>
                  <p className="min-w-0 py-2 text-sm leading-relaxed">{cue.text}</p>
                </div>
              ))}
            </div>
          </section>
        )}
      </DialogContent>
    </Dialog>
  );
}
