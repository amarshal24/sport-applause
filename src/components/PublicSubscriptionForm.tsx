import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { interests, subscriptionSchema } from "@/lib/publicSubscriptions";
export default function PublicSubscriptionForm() {
  const [selected,setSelected]=useState<string[]>([]),[newsletter,setNewsletter]=useState(false),[events,setEvents]=useState(false);
  const [busy,setBusy]=useState(false),[error,setError]=useState(""),[saved,setSaved]=useState(false),[token,setToken]=useState<string>();
  async function submit(e:FormEvent<HTMLFormElement>) {
    e.preventDefault(); const form=new FormData(e.currentTarget);
    const parsed=subscriptionSchema.safeParse({email:form.get("email"),interests:selected,newsletter,events});
    if(!parsed.success){setError(parsed.error.issues[0]?.message??"Check your preferences");return;}
    setBusy(true);setError("");
    try {const {data,error}=await supabase.functions.invoke("public-subscriptions",{body:{action:"subscribe",...parsed.data,website:form.get("website")||""}});
      if(error||!data?.saved) throw new Error(); setSaved(true);setToken(data.token??undefined);
    }catch{setError("Could not save your subscription. Please try again.");}finally{setBusy(false);}
  }
  if(saved)return <div role="status" className="space-y-4"><h3 className="text-2xl">Thank you.</h3><p className="text-muted-foreground">New subscriptions have been saved. Existing subscriptions are unchanged.</p>{token?<><p className="text-sm text-muted-foreground">Keep this private link to unsubscribe. Email delivery is not available yet.</p><Input aria-label="Private unsubscribe link" readOnly value={`${window.location.origin}/unsubscribe#${token}`} /><Button asChild variant="outline"><Link to={`/unsubscribe#${token}`}>Manage unsubscribe preferences</Link></Button></>:<p className="text-sm text-muted-foreground">For an existing subscription, use the private link saved when you subscribed.</p>}</div>;
  return <form onSubmit={submit} className="space-y-5">
    <div className="space-y-2"><Label htmlFor="subscriber-email">Email for updates</Label><Input id="subscriber-email" name="email" type="email" required maxLength={255} autoComplete="email" /></div>
    <fieldset><legend className="font-medium mb-3">Your interests</legend><div className="grid grid-cols-2 sm:grid-cols-3 gap-3">{interests.map(i=><Label key={i} className="flex items-center gap-2 capitalize"><Checkbox checked={selected.includes(i)} onCheckedChange={v=>setSelected(s=>v?[...s,i]:s.filter(x=>x!==i))} />{i.replace(/-/g," ")}</Label>)}</div></fieldset>
    <fieldset className="space-y-3"><legend className="font-medium mb-3">Send me</legend><Label className="flex gap-2 items-center"><Checkbox checked={newsletter} onCheckedChange={v=>setNewsletter(v===true)} />U⚡️Sportz newsletters</Label><Label className="flex gap-2 items-center"><Checkbox checked={events} onCheckedChange={v=>setEvents(v===true)} />Event announcements and invitations</Label></fieldset>
    <div className="hidden" aria-hidden="true"><Input name="website" tabIndex={-1} autoComplete="off" /></div>
    <p className="text-xs text-muted-foreground">I consent only to the updates selected above. Unsubscribe anytime. <Link to="/privacy" className="underline">Privacy policy</Link></p>
    {error&&<p role="alert" className="text-destructive text-sm">{error}</p>}<Button type="submit" disabled={busy}>{busy?"Saving…":"Subscribe"}</Button>
  </form>;
}