import { useState, type FormEvent } from "react";
import { ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { applicantTypes, foundersSchema } from "@/lib/foundersClub";

export default function FoundersClubForm() {
  const [type, setType] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [receipt, setReceipt] = useState<string>();
  const [emailSent, setEmailSent] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const parsed = foundersSchema.safeParse({ name: form.get("name"), email: form.get("email"), applicant_type: type, reason: form.get("reason") });
    if (!parsed.success) { setError(parsed.error.issues[0]?.message || "Please check your application."); return; }
    setBusy(true);
    setError("");
    try {
      const { data, error: requestError } = await supabase.functions.invoke("submit-founders-application", { body: { ...parsed.data, website: form.get("website") || "" } });
      if (requestError) {
        let message = "Your application could not be saved. Please try again.";
        if (requestError.context instanceof Response) {
          const body = await requestError.context.json().catch(() => null);
          if (typeof body?.error === "string") message = body.error;
        }
        setError(message);
        return;
      }
      if (!data?.id) { setError("Your application could not be saved. Please try again."); return; }
      setReceipt(data.id);
      setEmailSent(data.confirmationSent === true);
    } catch { setError("Your application could not be saved. Please check your connection and try again."); }
    finally { setBusy(false); }
  };

  if (receipt) return <div role="status" className="py-8 space-y-4">
    <CheckCircle2 className="h-10 w-10 text-primary" />
    <h3 className="text-3xl">Application received.</h3>
    <p className="text-muted-foreground">Thank you for applying to the U⚡️Sportz Founders Club. Your application is ready for review.</p>
    {emailSent && <p className="text-sm text-muted-foreground">A confirmation has been sent to your email.</p>}
    <p className="text-xs text-muted-foreground break-all">Application reference: {receipt}</p>
    <Button asChild variant="outline"><Link to="/auth">Explore U⚡️Sportz <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
  </div>;

  return <form onSubmit={submit} className="space-y-5">
    <div className="grid sm:grid-cols-2 gap-5">
      <div className="space-y-2"><Label htmlFor="founder-name">Name</Label><Input id="founder-name" name="name" autoComplete="name" required maxLength={100} placeholder="Your name" /></div>
      <div className="space-y-2"><Label htmlFor="founder-email">Email</Label><Input id="founder-email" name="email" type="email" autoComplete="email" required maxLength={255} placeholder="you@example.com" /></div>
    </div>
    <div className="space-y-2"><Label htmlFor="founder-type">Applicant type</Label>
      <Select value={type} onValueChange={setType}><SelectTrigger id="founder-type" aria-required="true"><SelectValue placeholder="Choose your role" /></SelectTrigger><SelectContent>{applicantTypes.map(t => <SelectItem key={t} value={t}><span className="capitalize">{t}</span></SelectItem>)}</SelectContent></Select>
    </div>
    <div className="space-y-2"><Label htmlFor="founder-reason">Why do you want to join?</Label><Textarea id="founder-reason" name="reason" rows={5} required maxLength={2000} placeholder="Tell us about your connection to sports and what you’d bring to the club." /><p className="text-xs text-muted-foreground">Please don’t include sensitive personal information.</p></div>
    <div className="hidden" aria-hidden="true"><Label htmlFor="founder-website">Website</Label><Input id="founder-website" name="website" tabIndex={-1} autoComplete="off" /></div>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    <p className="text-xs text-muted-foreground">Your application is private and reviewed by our admins. <Link to="/privacy" className="underline underline-offset-4">Privacy policy</Link></p>
    <Button size="lg" type="submit" disabled={busy} className="w-full sm:w-auto">{busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowRight className="mr-2 h-4 w-4" />}{busy ? "Submitting…" : "Submit application"}</Button>
  </form>;
}