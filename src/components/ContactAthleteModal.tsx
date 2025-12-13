import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Mail, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { z } from "zod";

const messageSchema = z.object({
  subject: z.string().trim().min(1, "Subject is required").max(200, "Subject must be less than 200 characters"),
  content: z.string().trim().min(1, "Message is required").max(2000, "Message must be less than 2000 characters"),
});

interface ContactAthleteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  athlete: {
    id: string;
    username: string;
    full_name: string | null;
    avatar_url: string | null;
  };
  videoId?: string;
  videoTitle?: string;
}

const ContactAthleteModal = ({
  open,
  onOpenChange,
  athlete,
  videoId,
  videoTitle,
}: ContactAthleteModalProps) => {
  const { user } = useAuth();
  const [subject, setSubject] = useState(videoTitle ? `Re: ${videoTitle}` : "");
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const [errors, setErrors] = useState<{ subject?: string; content?: string }>({});

  const handleSend = async () => {
    if (!user) {
      toast.error("Please sign in to send messages");
      return;
    }

    // Validate input
    const result = messageSchema.safeParse({ subject, content });
    if (!result.success) {
      const fieldErrors: { subject?: string; content?: string } = {};
      result.error.errors.forEach((err) => {
        if (err.path[0] === "subject") fieldErrors.subject = err.message;
        if (err.path[0] === "content") fieldErrors.content = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    setSending(true);

    try {
      const { error } = await supabase.from("messages").insert({
        sender_id: user.id,
        recipient_id: athlete.id,
        recruiting_video_id: videoId || null,
        subject: result.data.subject,
        content: result.data.content,
      });

      if (error) throw error;

      toast.success("Message sent successfully!");
      setSubject("");
      setContent("");
      onOpenChange(false);
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const handleClose = () => {
    setSubject(videoTitle ? `Re: ${videoTitle}` : "");
    setContent("");
    setErrors({});
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-primary" />
            Contact Athlete
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Recipient info */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <Avatar className="h-12 w-12">
              <AvatarImage src={athlete.avatar_url || undefined} />
              <AvatarFallback>
                {athlete.username[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">
                {athlete.full_name || athlete.username}
              </p>
              <p className="text-sm text-muted-foreground">@{athlete.username}</p>
            </div>
          </div>

          {/* Subject */}
          <div>
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Enter subject..."
              className="mt-2"
              maxLength={200}
            />
            {errors.subject && (
              <p className="text-sm text-destructive mt-1">{errors.subject}</p>
            )}
          </div>

          {/* Message */}
          <div>
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Introduce yourself and explain why you're reaching out..."
              className="mt-2"
              rows={6}
              maxLength={2000}
            />
            <div className="flex justify-between mt-1">
              {errors.content ? (
                <p className="text-sm text-destructive">{errors.content}</p>
              ) : (
                <span />
              )}
              <span className="text-xs text-muted-foreground">
                {content.length}/2000
              </span>
            </div>
          </div>

          {/* Send button */}
          <Button
            onClick={handleSend}
            disabled={sending || !subject.trim() || !content.trim()}
            className="w-full"
          >
            {sending ? (
              "Sending..."
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Send Message
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ContactAthleteModal;
