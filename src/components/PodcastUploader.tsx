import React, { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Upload, Music, X } from "lucide-react";
import { toast } from "sonner";

interface PodcastUploaderProps {
  onUploadComplete?: () => void;
}

const PodcastUploader: React.FC<PodcastUploaderProps> = ({ onUploadComplete }) => {
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const handleAudioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('audio/')) {
        toast.error("Please select a valid audio file");
        return;
      }
      if (file.size > 100 * 1024 * 1024) { // 100MB limit
        toast.error("Audio file must be less than 100MB");
        return;
      }
      setAudioFile(file);
    }
  };

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error("Please select a valid image file");
        return;
      }
      setThumbnailFile(file);
    }
  };

  const uploadFile = async (file: File, bucket: string, path: string) => {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        upsert: true,
      });

    if (error) throw error;
    
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);
    
    return publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !audioFile || !title) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsUploading(true);

    try {
      // Upload audio file
      const audioPath = `${user.id}/${Date.now()}-${audioFile.name}`;
      const audioUrl = await uploadFile(audioFile, 'podcasts', audioPath);

      // Upload thumbnail if provided
      let thumbnailUrl = null;
      if (thumbnailFile) {
        const thumbnailPath = `${user.id}/thumbnails/${Date.now()}-${thumbnailFile.name}`;
        thumbnailUrl = await uploadFile(thumbnailFile, 'podcasts', thumbnailPath);
      }

      // Get audio duration
      const audio = new Audio(URL.createObjectURL(audioFile));
      await new Promise((resolve) => {
        audio.onloadedmetadata = resolve;
      });
      const duration = Math.floor(audio.duration);

      // Create podcast record
      const { error: insertError } = await supabase
        .from('podcasts')
        .insert({
          user_id: user.id,
          title,
          description,
          audio_url: audioUrl,
          thumbnail_url: thumbnailUrl,
          duration,
        });

      if (insertError) throw insertError;

      toast.success("Podcast uploaded successfully!");
      
      // Reset form
      setAudioFile(null);
      setThumbnailFile(null);
      setTitle("");
      setDescription("");
      
      onUploadComplete?.();
    } catch (error: any) {
      console.error('Error uploading podcast:', error);
      toast.error(error.message || "Failed to upload podcast");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-6 bg-card rounded-lg border">
      <div className="space-y-2">
        <Label htmlFor="title">Podcast Title *</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter podcast title"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe your podcast..."
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label>Audio File *</Label>
        <div className="flex items-center gap-2">
          <Input
            type="file"
            accept="audio/*"
            onChange={handleAudioChange}
            className="hidden"
            id="audio-upload"
          />
          <label htmlFor="audio-upload" className="flex-1">
            <div className="flex items-center gap-2 p-3 border rounded-md cursor-pointer hover:bg-accent">
              <Music className="h-5 w-5" />
              <span className="text-sm">
                {audioFile ? audioFile.name : "Choose audio file"}
              </span>
            </div>
          </label>
          {audioFile && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setAudioFile(null)}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Thumbnail (Optional)</Label>
        <div className="flex items-center gap-2">
          <Input
            type="file"
            accept="image/*"
            onChange={handleThumbnailChange}
            className="hidden"
            id="thumbnail-upload"
          />
          <label htmlFor="thumbnail-upload" className="flex-1">
            <div className="flex items-center gap-2 p-3 border rounded-md cursor-pointer hover:bg-accent">
              <Upload className="h-5 w-5" />
              <span className="text-sm">
                {thumbnailFile ? thumbnailFile.name : "Choose thumbnail"}
              </span>
            </div>
          </label>
          {thumbnailFile && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setThumbnailFile(null)}
            >
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
