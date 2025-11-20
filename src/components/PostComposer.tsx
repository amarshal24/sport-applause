import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Image, Video, Smile } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const postSchema = z.object({
  content: z.string().trim().min(1, { message: "Post cannot be empty" }).max(5000, { message: "Post is too long" }),
});

interface PostComposerProps {
  onPostCreated?: () => void;
}

const PostComposer = ({ onPostCreated }: PostComposerProps) => {
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [postType, setPostType] = useState<"post" | "story">("post");
  const { toast } = useToast();

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 20 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Image must be less than 20MB",
          variant: "destructive",
        });
        return;
      }

      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (file: File, bucketName: string) => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${user!.id}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from(bucketName)
      .getPublicUrl(fileName);

    return publicUrl;
  };

  const handleSubmit = async () => {
    if (!user) {
      toast({
        title: "Not authenticated",
        description: "Please sign in to post",
        variant: "destructive",
      });
      return;
    }

    const validation = postSchema.safeParse({ content });
    if (!validation.success) {
      toast({
        title: "Invalid post",
        description: validation.error.errors[0].message,
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      let imageUrl: string | null = null;

      if (imageFile) {
        imageUrl = await uploadImage(imageFile, postType === "story" ? "stories" : "posts");
      }

      if (postType === "story") {
        if (!imageUrl) {
          toast({
            title: "Image required",
            description: "Stories must include an image",
            variant: "destructive",
          });
          setIsSubmitting(false);
          return;
        }

        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24);

        const { error } = await supabase.from("stories").insert({
          user_id: user.id,
          image_url: imageUrl,
          expires_at: expiresAt.toISOString(),
        });

        if (error) throw error;

        toast({
          title: "Story posted!",
          description: "Your story is now live for 24 hours.",
        });
      } else {
        const { error } = await supabase.from("posts").insert({
          user_id: user.id,
          content: content.trim(),
          image_url: imageUrl,
        });

        if (error) throw error;

        toast({
          title: "Post created!",
          description: "Your post is now live.",
        });
      }

      setContent("");
      setImageFile(null);
      setImagePreview(null);
      onPostCreated?.();
    } catch (error: any) {
      toast({
        title: "Failed to post",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) return null;

  return (
    <Card className="p-4 mb-6">
      <div className="flex gap-3">
        <Avatar>
          <AvatarImage src={user.user_metadata?.avatar_url} />
          <AvatarFallback>{user.user_metadata?.username?.[0] || "U"}</AvatarFallback>
        </Avatar>

        <div className="flex-1">
          <Textarea
            placeholder="What's on your mind today?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="mb-3 resize-none"
            rows={3}
            maxLength={5000}
          />

          {imagePreview && (
            <div className="relative mb-3">
              <img
                src={imagePreview}
                alt="Preview"
                className="rounded-lg max-h-64 w-full object-cover"
              />
              <Button
                size="sm"
                variant="destructive"
                className="absolute top-2 right-2"
                onClick={() => {
                  setImageFile(null);
                  setImagePreview(null);
                }}
              >
                Remove
              </Button>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => document.getElementById("image-upload")?.click()}
              >
                <Image className="h-4 w-4 mr-2" />
                Photo
              </Button>
              <input
                id="image-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageSelect}
              />
              <Button variant="ghost" size="sm" disabled>
                <Video className="h-4 w-4 mr-2" />
                Video
              </Button>
              <Button variant="ghost" size="sm" disabled>
                <Smile className="h-4 w-4 mr-2" />
                Feeling
              </Button>
            </div>

            <div className="flex gap-2">
              <Button
                variant={postType === "post" ? "default" : "outline"}
                size="sm"
                onClick={() => setPostType("post")}
              >
                Post
              </Button>
              <Button
                variant={postType === "story" ? "default" : "outline"}
                size="sm"
                onClick={() => setPostType("story")}
              >
                Story
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || (!content.trim() && !imageFile)}
                size="sm"
              >
                {isSubmitting ? "Posting..." : "Share"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default PostComposer;
