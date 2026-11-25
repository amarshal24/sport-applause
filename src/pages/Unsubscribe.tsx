import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { interests } from "@/lib/publicSubscriptions";

type Prefs = { interests: string[]; newsletter: boolean; events: boolean };

// Private preferences page. The token lives in the URL fragment (never sent to a server in a request line)
// and is the only credential: an email address alone can never read or change a subscription.
export default function Unsubscribe() {
  const token = window.location.hash.slice(1);
  const valid = /^[a-f0-9]{64}$/.test(token);
  const [prefs, setPrefs] = useState<Prefs | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke("public-subscriptions", { body: { action: "get", token } });
      if (!error && data?.preferences) { setPrefs(data.preferences as Prefs); setLoadFailed(false); }
      else setLoadFailed(true);
    } catch { setLoadFailed(true); }
  }, [token]);

  useEffect(() => { if (valid) void load(); }, [valid, load]);

  async function remove(scope: "all" | "newsletter" | "events") {
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("public-subscriptions", { body: { action: "unsubscribe", token, scope } });
      if (!error && data?.updated) {
        setMessage(`${scope === "all" ? "All updates" : scope === "events" ? "Event updates" : "Newsletters"} unsubscribed.`);
        await load();
      } else setMessage("Could not update preferences. Check your private link and try again.");
    } catch { setMessage("Could not update preferences. Please try again."); }
    finally { setBusy(false); }
  }

  async function save() {
    if (!prefs) return;
    if (prefs.interests.length === 0) { setMessage("Choose at least one interest."); return; }
    if (!prefs.newsletter && !prefs.events) { setMessage("Choose newsletters or event updates, or use Unsubscribe all."); return; }
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("public-subscriptions", {
        body: { action: "update", token, interests: prefs.interests, newsletter: prefs.newsletter, events: prefs.events },
      });
      if (!error && data?.updated) { setMessage("Preferences saved."); await load(); }
      else setMessage("Could not save preferences. Check your private link and try again.");
    } catch { setMessage("Could not save preferences. Please try again."); }
    finally { setBusy(false); }
  }

  const toggleInterest = (interest: string, on: boolean) =>
    setPrefs((p) => (p ? { ...p, interests: on ? [...new Set([...p.interests, interest])] : p.interests.filter((i) => i !== interest) } : p));

  const active = prefs ? prefs.newsletter || prefs.events : false;

  return (
    <main className="min-h-screen bg-background px-5 py-20">
      <div className="max-w-xl mx-auto space-y-6">
        <Link to="/welcome" className="text-2xl font-display">U⚡️Sportz</Link>
        <h1 className="text-4xl">Your email preferences</h1>
        {!valid && <p className="text-muted-foreground">Open your private preferences link to change your choices.</p>}
        {valid && loadFailed && <p role="alert" className="text-destructive">We could not load your preferences. Check your private link and try again.</p>}
        {valid && !loadFailed && !prefs && <p className="text-muted-foreground">Loading your preferences…</p>}
        {valid && prefs && (
          <div className="space-y-6">
            {!active && <p className="text-muted-foreground">You are currently unsubscribed. Choose what you want below and save to subscribe again.</p>}
            <fieldset className="space-y-3">
              <legend className="font-medium mb-3">Send me</legend>
              <Label className="flex gap-2 items-center">
                <Checkbox checked={prefs.newsletter} onCheckedChange={(v) => setPrefs({ ...prefs, newsletter: v === true })} />
                U⚡️Sportz newsletters
              </Label>
              <Label className="flex gap-2 items-center">
                <Checkbox checked={prefs.events} onCheckedChange={(v) => setPrefs({ ...prefs, events: v === true })} />
                Event updates
              </Label>
            </fieldset>
            <fieldset>
              <legend className="font-medium mb-3">Your interests</legend>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {interests.map((i) => (
                  <Label key={i} className="flex items-center gap-2 capitalize">
                    <Checkbox checked={prefs.interests.includes(i)} onCheckedChange={(v) => toggleInterest(i, v === true)} />
                    {i.replace(/-/g, " ")}
                  </Label>
                ))}
              </div>
            </fieldset>
            <Button disabled={busy} onClick={() => void save()}>{busy ? "Saving…" : "Save preferences"}</Button>
            <div className="border-t pt-6 space-y-3">
              <p className="text-sm text-muted-foreground">Or stop emails:</p>
              <div className="flex flex-wrap gap-3">
                <Button disabled={busy} onClick={() => void remove("newsletter")} variant="outline">Unsubscribe newsletters</Button>
                <Button disabled={busy} onClick={() => void remove("events")} variant="outline">Unsubscribe events</Button>
                <Button disabled={busy} onClick={() => void remove("all")}>Unsubscribe all</Button>
              </div>
            </div>
          </div>
        )}
        {message && <p role="status">{message}</p>}
      </div>
    </main>
  );
}
