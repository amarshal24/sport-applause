import { useState } from "react";
import { Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const REASONS = [
  "Prohibited item",
  "Scam or fraud",
  "Abusive or hateful content",
  "Spam",
  "Other",
] as const;

interface ReportButtonProps {
  targetType: "listing" | "post" | "profile";
  targetId: string;
  className?: string;
}

const ReportButton = ({ targetType, targetId, className }: ReportButtonProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<string>(REASONS[0]);
  const [details, setDetails] = useState("");
  const [sending, setSending] = useState(false);

  const submit = async () => {
    if (!user) {
      navigate("/auth");
      return;
    }
    setSending(true);
    const { error } = await supabase.from("content_reports").insert({
      reporter_id: user.id,
      target_type: targetType,
      target_id: targetId,
      reason,
      details: details.trim() || null,
    });
    setSending(false);
    if (error) {
      toast.error("Could not send report");
    } else {
      toast.success("Report sent. Our team will review it.");
      setOpen(false);
      setDetails("");
    }
  };

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className={className}
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
      >
        <Flag className="mr-1 h-4 w-4" /> Report
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm" onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>Report this {targetType}</DialogTitle>
            <DialogDescription>
              Reports are reviewed by our moderation team.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {REASONS.map((r) => (
                <button
                  key={r}
                  onClick={() => setReason(r)}
                  className={`rounded-full px-3 py-1.5 text-sm border transition-colors ${
                    reason === r
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
            <Textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Add details (optional)"
              rows={3}
            />
            <Button className="w-full" onClick={submit} disabled={sending}>
              {sending ? "Sending..." : "Send report"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ReportButton;
