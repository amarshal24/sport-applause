import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Video, StopCircle, PlayCircle, Upload, Sparkles, X, SwitchCamera, Maximize2, Minimize2, Scissors, Crop, RotateCcw, AlertCircle, CheckCircle2, Loader2, Camera, Check, SmartphoneCharging } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { trimVideo } from "@/lib/videoTrim";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";



const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;


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
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [orientation, setOrientation] = useState<"portrait" | "landscape">(
    typeof window !== "undefined" && window.innerWidth > window.innerHeight ? "landscape" : "portrait"
  );
  const [rotatedWhileRecording, setRotatedWhileRecording] = useState(false);
  const [fitMode, setFitMode] = useState<"cover" | "contain">("cover");

  const [progress, setProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadDone, setUploadDone] = useState(false);
  const [clipDuration, setClipDuration] = useState(0);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0);
  const [squareCrop, setSquareCrop] = useState(true);
  const [trimming, setTrimming] = useState(false);
  const [trimProgress, setTrimProgress] = useState(0);



  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const xhrRef = useRef<XMLHttpRequest | null>(null);


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
    setUploadError(null);
    setProgress(0);
    setUploadDone(false);
    setClipDuration(0);
    setTrimStart(0);
    setTrimEnd(0);
    setSquareCrop(true);
    startCamera(facingMode);
  };

  const cancelUpload = () => {
    xhrRef.current?.abort();
    xhrRef.current = null;
    setUploading(false);
    setProgress(0);
    setUploadError("Upload canceled.");
  };

  const uploadVideo = async () => {
    if (!recordedBlob || !user) return;

    setUploading(true);
    setUploadError(null);
    setProgress(0);

    try {
      const needsTrim =
        clipDuration > 0 && (trimStart > 0.05 || trimEnd < clipDuration - 0.05 || squareCrop);

      let blobToUpload = recordedBlob;
      if (needsTrim) {
        setTrimming(true);
        try {
          blobToUpload = await trimVideo(recordedBlob, {
            start: trimStart,
            end: trimEnd,
            square: squareCrop,
            onProgress: setTrimProgress,
          });
        } finally {
          setTrimming(false);
          setTrimProgress(0);
        }
      }

      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error("Your session expired. Please sign in again.");

      const path = `${user.id}/profile-video-${Date.now()}.webm`;


      const publicUrl = await new Promise<string>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhrRef.current = xhr;
        xhr.open("POST", `${SUPABASE_URL}/storage/v1/object/profile-videos/${path}`, true);
        xhr.setRequestHeader("Authorization", `Bearer ${token}`);
        xhr.setRequestHeader("apikey", SUPABASE_KEY);
        xhr.setRequestHeader("Content-Type", "video/webm");
        xhr.setRequestHeader("x-upsert", "true");
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 95));
        };
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            setProgress(97);
            resolve(supabase.storage.from("profile-videos").getPublicUrl(path).data.publicUrl);
          } else if (xhr.status === 401 || xhr.status === 403) {
            reject(new Error("You don't have permission to upload. Try signing in again."));
          } else {
            reject(new Error(`Upload failed (${xhr.status}). Please try again.`));
          }
        };
        xhr.onerror = () => reject(new Error("Network error — check your connection and retry."));
        xhr.onabort = () => reject(new Error("Upload canceled."));
        xhr.send(recordedBlob);
      });

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ profile_video_url: publicUrl })
        .eq("id", user.id);

      if (updateError) throw new Error("Video uploaded, but saving it to your profile failed. Retry to finish.");

      setProgress(100);
      setUploadDone(true);
      toast.success("Profile video updated!");
      onVideoUploaded(publicUrl);
      setTimeout(onClose, 600);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to upload video";
      console.error("Upload error:", error);
      setUploadError(message);
      if (message !== "Upload canceled.") toast.error(message);
    } finally {
      xhrRef.current = null;
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
        loop={false}
        src={previewUrl || undefined}
        onLoadedMetadata={(e) => {
          if (!previewUrl) return;
          const d = isFinite(e.currentTarget.duration) ? e.currentTarget.duration : 5;
          setClipDuration(d);
          setTrimStart(0);
          setTrimEnd(d);
        }}
        onTimeUpdate={(e) => {
          if (!previewUrl || !clipDuration) return;
          const v = e.currentTarget;
          if (v.currentTime >= trimEnd || v.currentTime < trimStart - 0.1) {
            v.currentTime = trimStart;
            v.play().catch(() => {});
          }
        }}
        onEnded={(e) => {
          if (!previewUrl) return;
          e.currentTarget.currentTime = trimStart;
          e.currentTarget.play().catch(() => {});
        }}
        className={cn(
          "absolute inset-0 w-full h-full",
          fitMode === "cover" ? "object-cover" : "object-contain"
        )}
        style={{
          filter: selectedFilter.cssFilter,
          transform: mirrored ? "scaleX(-1)" : undefined,
        }}
      />

      {/* Square crop guide */}
      {previewUrl && squareCrop && (
        <div className="absolute inset-0 z-[5] pointer-events-none flex items-center justify-center">
          <div className="aspect-square w-[92vw] max-w-[92vh] border-2 border-white/70 rounded-2xl shadow-[0_0_0_9999px_hsl(0_0%_0%/0.45)]" />
        </div>
      )}


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

        {/* Trim & crop step */}
        {recordedBlob && !uploadDone && (
          <div className="rounded-xl border border-white/20 bg-background/40 backdrop-blur p-3 space-y-3">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-xs font-medium text-primary-foreground">
                <Scissors className="w-3.5 h-3.5 text-primary" />
                Trim clip
              </span>
              <span className="text-xs font-mono text-primary-foreground/80">
                {trimStart.toFixed(1)}s – {trimEnd.toFixed(1)}s ({Math.max(0, trimEnd - trimStart).toFixed(1)}s)
              </span>
            </div>

            <Slider
              value={[trimStart, trimEnd]}
              min={0}
              max={clipDuration || 5}
              step={0.1}
              minStepsBetweenThumbs={5}
              disabled={uploading || trimming || !clipDuration}
              onValueChange={([s, e]) => {
                setTrimStart(s);
                setTrimEnd(e);
                if (videoRef.current && videoRef.current.currentTime < s) {
                  videoRef.current.currentTime = s;
                }
              }}
              aria-label="Trim range"
            />

            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-xs text-primary-foreground">
                <Crop className="w-3.5 h-3.5 text-primary" />
                Square crop (best for avatars)
              </span>
              <Switch
                checked={squareCrop}
                onCheckedChange={setSquareCrop}
                disabled={uploading || trimming}
                aria-label="Square crop"
              />
            </div>
          </div>
        )}


        {/* Upload status */}
        {recordedBlob && (uploading || uploadError || uploadDone) && (
          <div
            className={cn(
              "rounded-xl border p-3 space-y-2 backdrop-blur",
              uploadError
                ? "border-destructive/50 bg-destructive/15"
                : "border-white/20 bg-background/40"
            )}
            role="status"
            aria-live="polite"
          >
            <div className="flex items-center gap-2 text-sm text-primary-foreground">
              {uploadError ? (
                <AlertCircle className="w-4 h-4 text-destructive shrink-0" />
              ) : uploadDone ? (
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
              ) : (
                <Loader2 className="w-4 h-4 animate-spin shrink-0" />
              )}
              <span className="flex-1">
                {uploadError
                  ? uploadError
                  : uploadDone
                  ? "Upload complete"
                  : trimming
                  ? `Trimming clip… ${trimProgress}%`
                  : progress < 95
                  ? `Uploading video… ${progress}%`
                  : "Saving to your profile…"}
              </span>

              {uploading && !trimming && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={cancelUpload}
                  className="h-7 px-2 text-primary-foreground hover:bg-white/20"
                >
                  Cancel
                </Button>
              )}
            </div>
            {!uploadError && <Progress value={trimming ? trimProgress : progress} className="h-1.5" />}

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
              <Button
                onClick={retake}
                variant="outline"
                size="lg"
                disabled={uploading || uploadDone}
                className="flex-1 bg-background/30 backdrop-blur border-white/20 text-primary-foreground"
              >
                Retake
              </Button>
              <Button onClick={uploadVideo} disabled={uploading || uploadDone} size="lg" className="flex-1">
                {trimming ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Trimming</>
                ) : uploading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{progress}%</>

                ) : uploadError ? (
                  <><RotateCcw className="mr-2 h-4 w-4" />Retry</>
                ) : uploadDone ? (
                  <><CheckCircle2 className="mr-2 h-4 w-4" />Done</>
                ) : (
                  <><Upload className="mr-2 h-4 w-4" />Upload</>
                )}
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
