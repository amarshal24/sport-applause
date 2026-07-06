import React, { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Upload, Music, X, Scissors } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { MusicTrimmer } from "@/components/MusicTrimmer";
import { trimAudioToWav } from "@/lib/audioTrim";

const podcastSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  description: z.string().trim().max(2000).optional(),
});

interface PodcastUploaderProps {
  onUploadComplete?: () => void;
}

const PodcastUploader: React.FC<PodcastUploaderProps> = ({ onUploadComplete }) => {
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [trimmedBlob, setTrimmedBlob] = useState<Blob | null>(null);
  const [audioObjectUrl, setAudioObjectUrl] = useState<string | null>(null);
  const [showTrimmer, setShowTrimmer] = useState(false);
  const [isTrimming, setIsTrimming] = useState(false);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState<{ title?: string; description?: string }>({});

  const handleAudioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("audio/")) return toast.error("Please select a valid audio file");
    if (file.size > 100 * 1024 * 1024) return toast.error("Audio file must be less than 100MB");
    setAudioFile(file);
    setTrimmedBlob(null);
    if (audioObjectUrl) URL.revokeObjectURL(audioObjectUrl);
    setAudioObjectUrl(URL.createObjectURL(file));
  };

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return toast.error("Please select a valid image file");
    setThumbnailFile(file);
  };

  const uploadFile = async (data: Blob | File, bucket: string, path: string, contentType?: string) => {
    const { data: up, error } = await supabase.storage.from(bucket).upload(path, data, {
      upsert: true,
      contentType: contentType ?? (data as File).type,
    });
    if (error) throw error;
    return supabase.storage.from(bucket).getPublicUrl(up.path).data.publicUrl;
  };

  const applyTrim = async (startTime: number, endTime: number, fadeIn: number, fadeOut: number) => {
    if (!audioFile) return;
    setIsTrimming(true);
    try {
      const wav = await trimAudioToWav(audioFile, startTime, endTime, fadeIn, fadeOut);
      setTrimmedBlob(wav);
      setShowTrimmer(false);
      toast.success(`Trimmed to ${Math.round(endTime - startTime)}s`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to trim audio");
    } finally {
      setIsTrimming(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    const parsed = podcastSchema.safeParse({ title, description });
    if (!parsed.success) {
      const fe: { title?: string; description?: string } = {};
      parsed.error.errors.forEach((err) => {
        if (err.path[0] === "title") fe.title = err.message;
        if (err.path[0] === "description") fe.description = err.message;
      });
      setErrors(fe);
      return toast.error("Please fix the validation errors");
    }
    if (!user || !audioFile) return toast.error("Please fill in all required fields");

    setIsUploading(true);
    try {
      const source: Blob = trimmedBlob ?? audioFile;
      const ext = trimmedBlob ? "wav" : (audioFile.name.split(".").pop() || "mp3");
      const audioPath = `${user.id}/${Date.now()}-podcast.${ext}`;
      const audioUrl = await uploadFile(source, "podcasts", audioPath, trimmedBlob ? "audio/wav" : audioFile.type);

      let thumbnailUrl: string | null = null;
      if (thumbnailFile) {
        const tPath = `${user.id}/thumbnails/${Date.now()}-${thumbnailFile.name}`;
        thumbnailUrl = await uploadFile(thumbnailFile, "podcasts", tPath);
      }

      const audio = new Audio(URL.createObjectURL(source));
      await new Promise((resolve) => { audio.onloadedmetadata = resolve; });
      const duration = Math.floor(audio.duration);

      const { error: insertError } = await supabase.from("podcasts").insert({
        user_id: user.id, title, description, audio_url: audioUrl, thumbnail_url: thumbnailUrl, duration,
      });
      if (insertError) throw insertError;

      toast.success("Podcast uploaded successfully!");
      setAudioFile(null); setTrimmedBlob(null); setThumbnailFile(null);
      setTitle(""); setDescription("");
      if (audioObjectUrl) { URL.revokeObjectURL(audioObjectUrl); setAudioObjectUrl(null); }
      onUploadComplete?.();
    } catch (err: any) {
      console.error("Error uploading podcast:", err);
      toast.error(err.message || "Failed to upload podcast");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-6 bg-card rounded-lg border">
      <div className="space-y-2">
        <Label htmlFor="title">Podcast Title *</Label>
        <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Enter podcast title" maxLength={200} required />
        {errors.title && <p className="text-sm text-destructive">{errors.title}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe your podcast..." rows={3} maxLength={2000} />
        {errors.description && <p className="text-sm text-destructive">{errors.description}</p>}
      </div>

      <div className="space-y-2">
        <Label>Audio File *</Label>
        <div className="flex items-center gap-2">
          <Input type="file" accept="audio/*" onChange={handleAudioChange} className="hidden" id="audio-upload" />
          <label htmlFor="audio-upload" className="flex-1">
            <div className="flex items-center gap-2 p-3 border rounded-md cursor-pointer hover:bg-accent">
              <Music className="h-5 w-5" />
              <span className="text-sm truncate">
                {audioFile ? `${audioFile.name}${trimmedBlob ? " (trimmed)" : ""}` : "Choose audio file"}
              </span>
            </div>
          </label>
          {audioFile && (
            <>
              <Button type="button" variant="outline" size="sm" onClick={() => setShowTrimmer((v) => !v)} className="gap-1">
                <Scissors className="h-4 w-4" /> {showTrimmer ? "Close" : "Trim"}
              </Button>
              <Button type="button" variant="ghost" size="icon" onClick={() => { setAudioFile(null); setTrimmedBlob(null); setShowTrimmer(false); }}>
                <X className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
        {showTrimmer && audioObjectUrl && (
          <div className="p-4 border rounded-md bg-muted/30 mt-2">
            {isTrimming ? (
              <p className="text-sm text-muted-foreground">Rendering trimmed audio…</p>
            ) : (
              <MusicTrimmer audioUrl={audioObjectUrl} onTrimComplete={applyTrim} onCancel={() => setShowTrimmer(false)} />
            )}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label>Thumbnail (Optional)</Label>
        <div className="flex items-center gap-2">
          <Input type="file" accept="image/*" onChange={handleThumbnailChange} className="hidden" id="thumbnail-upload" />
          <label htmlFor="thumbnail-upload" className="flex-1">
            <div className="flex items-center gap-2 p-3 border rounded-md cursor-pointer hover:bg-accent">
              <Upload className="h-5 w-5" />
              <span className="text-sm">{thumbnailFile ? thumbnailFile.name : "Choose thumbnail"}</span>
            </div>
          </label>
          {thumbnailFile && (
            <Button type="button" variant="ghost" size="icon" onClick={() => setThumbnailFile(null)}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <Button type="submit" disabled={isUploading} className="w-full">
        {isUploading ? "Uploading..." : "Upload Podcast"}
      </Button>
    </form>
  );
};

export default PodcastUploader;
