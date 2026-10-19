import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { founding100Roles, founding100Schema, founding100Sports } from "@/lib/founding100";
import { SPORTS } from "@/constants/sports";
import { trackEvent } from "@/lib/analytics";

const sportName = (id: string) => SPORTS.find(s => s.id === id)?.name ?? id;

export default function Founding100Form() {
  const navigate = useNavigate();
  const [role, setRole] = useState("");
  const [sport, setSport] = useState("");
  const [beta, setBeta] = useState(false);
  const [newsletter, setNewsletter] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const parsed = founding100Schema.safeParse({
      name: form.get("name"),
      email: form.get("email"),
      role,
      sport,
      social_username: form.get("social_username") || "",
      beta_interest: beta,
      newsletter_consent: newsletter,
    });
    if (!parsed.success) { setError(parsed.error.issues[0]?.message ?? "Please check the highlighted fields"); return; }
    setBusy(true); setError("");
    try {
      const { data, error: fnError } = await supabase.functions.invoke("submit-founding100-application", {
        body: { ...parsed.data, website: form.get("website") || "" },
      });
      if (fnError || !data) throw new Error();
      trackEvent("founding100_application_submitted", { role: parsed.data.role, sport: parsed.data.sport });
      navigate("/thank-you", { state: { name: parsed.data.name, alreadyApplied: data.alreadyApplied === true, token: data.token ?? null } });
    } catch {
      setError("Your application could not be saved. Please try again.");
    } finally { setBusy(false); }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="space-y-2"><Label htmlFor="f100-name">Name</Label><Input id="f100-name" name="name" required maxLength={100} autoComplete="name" /></div>
      <div className="space-y-2"><Label htmlFor="f100-email">Email</Label><Input id="f100-email" name="email" type="email" required maxLength={255} autoComplete="email" /></div>
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="f100-role">I am a…</Label>
          <Select value={role} onValueChange={setRole}><SelectTrigger id="f100-role" aria-label="Your role"><SelectValue placeholder="Choose your role" /></SelectTrigger><SelectContent>{founding100Roles.map(r => <SelectItem key={r} value={r} className="capitalize">{r}</SelectItem>)}</SelectContent></Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="f100-sport">Your sport</Label>
          <Select value={sport} onValueChange={setSport}><SelectTrigger id="f100-sport" aria-label="Your sport"><SelectValue placeholder="Choose your sport" /></SelectTrigger><SelectContent>{founding100Sports.map(s => <SelectItem key={s} value={s}>{sportName(s)}</SelectItem>)}</SelectContent></Select>
        </div>
      </div>
      <div className="space-y-2"><Label htmlFor="f100-social">Social username <span className="text-muted-foreground font-normal">(optional)</span></Label><Input id="f100-social" name="social_username" maxLength={100} placeholder="@yourhandle" /></div>
      <fieldset className="space-y-3">
        <legend className="font-medium mb-1">Your interests</legend>
        <Label className="flex gap-2 items-start"><Checkbox checked={beta} onCheckedChange={v => setBeta(v === true)} className="mt-0.5" /><span>I want to be considered for beta testing before public launch</span></Label>
        <Label className="flex gap-2 items-start"><Checkbox checked={newsletter} onCheckedChange={v => setNewsletter(v === true)} className="mt-0.5" /><span>Send me the U⚡️Sportz newsletter (optional — separate from my application)</span></Label>
      </fieldset>
      <div className="hidden" aria-hidden="true"><Input name="website" tabIndex={-1} autoComplete="off" /></div>
      <p className="text-xs text-muted-foreground">Applying does not guarantee a founding spot — every application is reviewed, and spots are confirmed only after approval. <Link to="/privacy" className="underline">Privacy policy</Link></p>
      {error && <p role="alert" className="text-destructive text-sm">{error}</p>}
      <Button type="submit" size="lg" disabled={busy} className="w-full sm:w-auto">{busy ? "Submitting…" : "Apply for the Founding 100"}</Button>
    </form>
  );
}
