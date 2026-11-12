import { useEffect, useRef, useState } from "react";
import { FileText, Headphones, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export interface PodcastTutorialCue {
  start: number;
  end: number;
  text: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  videoUrl: string;
  cues: PodcastTutorialCue[];
}

const timestamp = (seconds: number) => new Date(seconds * 1000).toISOString().slice(11, 23);
const labelTime = (seconds: number) => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;

export default function PodcastTutorialDialog({ open, onOpenChange, videoUrl, cues }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [captionUrl, setCaptionUrl] = useState("");
  const [currentTime, setCurrentTime] = useState(0);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [showTranscript, setShowTranscript] = useState(false);

  useEffect(() => {
    if (!open) return;
    const vtt = "WEBVTT\n\n" + cues.map(cue =>
      `${timestamp(cue.start)} --> ${timestamp(cue.end)}\n${cue.text}\n`
    ).join("\n");
    const url = URL.createObjectURL(new Blob([vtt], { type: "text/vtt" }));
    setCaptionUrl(url);
    setCurrentTime(0);
    setFailed(false);
    return () => URL.revokeObjectURL(url);
  }, [open, cues]);

  const activeCue = cues.find(cue => currentTime >= cue.start && currentTime < cue.end);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="block w-[calc(100%-2rem)] max-w-4xl max-h-[85dvh] space-y-4 overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 pr-6 text-xl sm:text-2xl">
            <Headphones className="h-6 w-6 shrink-0 text-primary" /> Podcast tutorial
          </DialogTitle>
          <DialogDescription>Upload, trim & edit · Illustrated walkthrough</DialogDescription>
        </DialogHeader>
        <div className="aspect-video w-full overflow-hidden rounded-lg bg-muted">
          {open && !failed && (
            <video key={attempt} ref={videoRef} src={videoUrl} controls playsInline preload="metadata"
              aria-label="Podcast upload, trim and edit video tutorial" className="h-full w-full object-contain"
              onError={() => setFailed(true)}
              onTimeUpdate={event => setCurrentTime(event.currentTarget.currentTime)}
              onSeeked={event => setCurrentTime(event.currentTarget.currentTime)}>
              {captionUrl && <track kind="captions" src={captionUrl} srcLang="en" label="English" default />}
            </video>
          )}
          {failed && (
            <div role="alert" className="flex h-full flex-col items-center justify-center gap-3 p-4 text-center">
              <p className="text-sm text-muted-foreground">The video couldn’t load. You can still read the transcript below.</p>
              <Button variant="outline" onClick={() => { setFailed(false); setAttempt(value => value + 1); }}>
                <RotateCcw className="mr-2 h-4 w-4" /> Retry video
              </Button>
            </div>
          )}
        </div>
        <p aria-label="Current caption" className="min-h-12 text-center text-sm leading-relaxed">{activeCue?.text ?? ""}</p>
        <Button variant="outline" aria-expanded={showTranscript} aria-controls="podcast-tutorial-transcript"
          onClick={() => setShowTranscript(value => !value)}>
          <FileText className="mr-2 h-4 w-4" />{showTranscript ? "Hide transcript" : "Read transcript"}
        </Button>
        {showTranscript && (
          <section id="podcast-tutorial-transcript" aria-label="Video transcript" className="border-t border-border pt-4">
            <h3 className="mb-3 font-semibold">Transcript</h3>
            <div className="max-h-64 space-y-3 overflow-y-auto">
              {cues.map(cue => (
                <div key={cue.start} className="flex items-start gap-3" aria-current={activeCue === cue ? "true" : undefined}>
                  <Button variant="ghost" size="sm" className="shrink-0 font-mono text-primary"
                    aria-label={`Jump to ${labelTime(cue.start)}`} disabled={failed}
                    onClick={() => {
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