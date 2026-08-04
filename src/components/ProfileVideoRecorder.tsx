import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Video, StopCircle, PlayCircle, Upload, Sparkles, X, SwitchCamera, Maximize2, Minimize2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Filter {
  id: string;
  name: string;
  cssFilter: string;
  emoji: string;
}

const filters: Filter[] = [
  { id: "none", name: "Original", cssFilter: "none", emoji: "✨" },
  { id: "vintage", name: "Vintage", cssFilter: "sepia(0.5) contrast(1.2)", emoji: "📷" },
  { id: "cool", name: "Cool", cssFilter: "saturate(1.5) hue-rotate(-15deg)", emoji: "❄️" },
  { id: "warm", name: "Warm", cssFilter: "saturate(1.3) hue-rotate(15deg)", emoji: "🔥" },
  { id: "vivid", name: "Vivid", cssFilter: "saturate(2) contrast(1.3)", emoji: "🌈" },
  { id: "noir", name: "Noir", cssFilter: "grayscale(1) contrast(1.5)", emoji: "🎬" },
];

interface Props {
  onVideoUploaded: (url: string) => void;
  onClose: () => void;
}

const ProfileVideoRecorder = ({ onVideoUploaded, onClose }: Props) => {
  const { user } = useAuth();
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<Filter>(filters[0]);
  const [uploading, setUploading] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [fitMode, setFitMode] = useState<"cover" | "contain">("cover");

  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const startCamera = useCallback(async (mode: "user" | "environment") => {
    stopCamera();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: mode, width: { ideal: 1080 }, height: { ideal: 1920 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
    } catch (error) {
      toast.error("Unable to access camera");
      console.error("Camera error:", error);
    }
  }, [stopCamera]);

  useEffect(() => {
    if (!recordedBlob) startCamera(facingMode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facingMode]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
      if (intervalRef.current) clearInterval(intervalRef.current);
      stopCamera();
    };
  }, [stopCamera]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const flipCamera = () => {
    if (isRecording) return;
    setFacingMode((m) => (m === "user" ? "environment" : "user"));
  };

  const startRecording = () => {
    if (!streamRef.current) return;

    chunksRef.current = [];
    const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
      ? "video/webm;codecs=vp9"
      : MediaRecorder.isTypeSupported("video/webm")
      ? "video/webm"
      : "";
    const mediaRecorder = new MediaRecorder(streamRef.current, mimeType ? { mimeType } : undefined);

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunksRef.current.push(event.data);
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "video/webm" });
      setRecordedBlob(blob);
      const url = URL.createObjectURL(blob);
      if (videoRef.current) videoRef.current.srcObject = null;
      setPreviewUrl(url);
      stopCamera();
    };

    mediaRecorderRef.current = mediaRecorder;
    mediaRecorder.start();
    setIsRecording(true);

    let timeLeft = 5;
    setCountdown(timeLeft);
    intervalRef.current = setInterval(() => {
      timeLeft--;
      setCountdown(timeLeft);
      if (timeLeft <= 0) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setCountdown(null);
        stopRecording();
      }
    }, 1000);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const retake = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setRecordedBlob(null);
    setPreviewUrl(null);
    startCamera(facingMode);
  };

  const uploadVideo = async () => {
    if (!recordedBlob || !user) return;

    setUploading(true);
    try {
      const fileName = `${user.id}/profile-video-${Date.now()}.webm`;

      const { error: uploadError } = await supabase.storage
        .from("profile-videos")
        .upload(fileName, recordedBlob, { contentType: "video/webm", upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from("profile-videos").getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ profile_video_url: publicUrl })
        .eq("id", user.id);

      if (updateError) throw updateError;

      toast.success("Profile video updated!");
      onVideoUploaded(publicUrl);
      onClose();
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload video");
    } finally {
      setUploading(false);
    }
  };

  const mirrored = facingMode === "user" && !recordedBlob;

  return createPortal(
    <div className="fixed inset-0 z-[100] bg-black flex flex-col">
      {/* Video fills the screen */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        loop={!!previewUrl}
        src={previewUrl || undefined}
        className={cn(
          "absolute inset-0 w-full h-full",
          fitMode === "cover" ? "object-cover" : "object-contain"
        )}
        style={{
          filter: selectedFilter.cssFilter,
          transform: mirrored ? "scaleX(-1)" : undefined,
        }}
      />

      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between p-4 pt-[max(1rem,env(safe-area-inset-top))] bg-gradient-to-b from-black/70 to-transparent">
        <Button
          size="icon"
          variant="ghost"
          className="rounded-full text-primary-foreground hover:bg-white/20"
          onClick={() => { stopCamera(); onClose(); }}
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </Button>

        <span className="flex items-center gap-2 text-sm font-display text-primary-foreground">
          <Video className="w-4 h-4 text-primary" />
          Profile Video
        </span>

        <div className="flex items-center gap-1">
          <Button
            size="icon"
            variant="ghost"
            className="rounded-full text-primary-foreground hover:bg-white/20"
            onClick={() => setFitMode((m) => (m === "cover" ? "contain" : "cover"))}
            aria-label={fitMode === "cover" ? "Fit video" : "Fill screen"}
          >
            {fitMode === "cover" ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="rounded-full text-primary-foreground hover:bg-white/20 disabled:opacity-40"
            onClick={flipCamera}
            disabled={isRecording || !!recordedBlob}
            aria-label="Flip camera"
          >
            <SwitchCamera className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {countdown !== null && (
        <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
          <div className="text-7xl font-bold text-primary animate-pulse-glow">{countdown}</div>
        </div>
      )}

      <div className="flex-1" />

      {/* Bottom controls */}
      <div className="relative z-10 p-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] space-y-4 bg-gradient-to-t from-black/80 via-black/50 to-transparent">
        {!recordedBlob && (
          <div className="space-y-2">
            <label className="text-xs font-medium flex items-center gap-2 text-primary-foreground/80">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              Filter
            </label>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {filters.map((filter) => (
                <Button
                  key={filter.id}
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedFilter(filter)}
                  className={cn(
                    "flex-shrink-0 bg-background/30 backdrop-blur border-white/20 text-primary-foreground",
                    selectedFilter.id === filter.id && "border-primary bg-primary/20"
                  )}
                >
                  <span className="mr-1">{filter.emoji}</span>
                  {filter.name}
                </Button>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-3">
          {!recordedBlob ? (
            <Button
              onClick={isRecording ? stopRecording : startRecording}
              className="flex-1"
              size="lg"
            >
              {isRecording ? (
                <>
                  <StopCircle className="mr-2 h-5 w-5 animate-pulse" />
                  Stop
                </>
              ) : (
                <>
                  <PlayCircle className="mr-2 h-5 w-5" />
                  Record 5s
                </>
              )}
            </Button>
          ) : (
            <>
              <Button onClick={retake} variant="outline" size="lg" className="flex-1 bg-background/30 backdrop-blur border-white/20 text-primary-foreground">
                Retake
              </Button>
              <Button onClick={uploadVideo} disabled={uploading} size="lg" className="flex-1">
                {uploading ? "Uploading..." : (<><Upload className="mr-2 h-4 w-4" />Upload</>)}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ProfileVideoRecorder;
