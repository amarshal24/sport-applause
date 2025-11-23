import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Video, StopCircle, PlayCircle, Upload, Sparkles, X } from "lucide-react";
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
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 640, facingMode: "user" },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      toast.error("Unable to access camera");
      console.error("Camera error:", error);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
  };

  const startRecording = () => {
    if (!streamRef.current) return;

    chunksRef.current = [];
    const mediaRecorder = new MediaRecorder(streamRef.current, {
      mimeType: "video/webm",
    });

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunksRef.current.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "video/webm" });
      setRecordedBlob(blob);
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
      stopCamera();
    };

    mediaRecorderRef.current = mediaRecorder;
    mediaRecorder.start();
    setIsRecording(true);

    // Stop recording after 5 seconds
    let timeLeft = 5;
    setCountdown(timeLeft);
    const interval = setInterval(() => {
      timeLeft--;
      setCountdown(timeLeft);
      if (timeLeft <= 0) {
        clearInterval(interval);
        setCountdown(null);
        stopRecording();
      }
    }, 1000);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const retake = () => {
    setRecordedBlob(null);
    setPreviewUrl(null);
    startCamera();
  };

  const uploadVideo = async () => {
    if (!recordedBlob || !user) return;

    setUploading(true);
    try {
      const fileName = `${user.id}/profile-video-${Date.now()}.webm`;
      
      const { error: uploadError } = await supabase.storage
        .from("profile-videos")
        .upload(fileName, recordedBlob, {
          contentType: "video/webm",
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("profile-videos")
        .getPublicUrl(fileName);

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

  return (
    <Card className="glass-effect max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 font-display">
            <Video className="w-5 h-5 text-primary" />
            Record Profile Video
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Video Preview */}
        <div className="relative aspect-square rounded-xl overflow-hidden bg-muted">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            loop={!!previewUrl}
            src={previewUrl || undefined}
            className="w-full h-full object-cover"
            style={{ filter: selectedFilter.cssFilter }}
          />
          
          {countdown !== null && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/50">
              <div className="text-6xl font-bold text-primary animate-pulse-glow">
                {countdown}
              </div>
            </div>
          )}

          {!recordedBlob && !isRecording && (
            <div className="absolute bottom-4 left-4 right-4 text-center text-sm text-white bg-background/80 p-2 rounded-lg">
              5 second video • Position yourself and click record
            </div>
          )}
        </div>

        {/* Filters */}
        {!recordedBlob && (
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              Choose Filter
            </label>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {filters.map((filter) => (
                <Button
                  key={filter.id}
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedFilter(filter)}
                  className={cn(
                    "flex-shrink-0",
                    selectedFilter.id === filter.id && "border-primary bg-primary/10"
                  )}
                >
                  <span className="mr-1">{filter.emoji}</span>
                  {filter.name}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="flex gap-3">
          {!recordedBlob ? (
            <>
              <Button
                onClick={isRecording ? stopRecording : startRecording}
                disabled={isRecording}
                className="flex-1"
                size="lg"
              >
                {isRecording ? (
                  <>
                    <StopCircle className="mr-2 h-5 w-5 animate-pulse" />
                    Recording...
                  </>
                ) : (
                  <>
                    <PlayCircle className="mr-2 h-5 w-5" />
                    Start Recording
                  </>
                )}
              </Button>
            </>
          ) : (
            <>
              <Button onClick={retake} variant="outline" className="flex-1">
                Retake
              </Button>
              <Button
                onClick={uploadVideo}
                disabled={uploading}
                className="flex-1"
              >
                {uploading ? (
                  "Uploading..."
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload
                  </>
                )}
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfileVideoRecorder;
