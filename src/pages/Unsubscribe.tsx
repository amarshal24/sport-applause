import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
export default function Unsubscribe(){
  const token=window.location.hash.slice(1),valid=/^[a-f0-9]{64}$/.test(token);
  const [message,setMessage]=useState(""),[busy,setBusy]=useState(false);
  async function remove(scope:string){setBusy(true);try{const {data,error}=await supabase.functions.invoke("public-subscriptions",{body:{action:"unsubscribe",token,scope}});setMessage(!error&&data?.updated?`${scope==="all"?"All updates":scope==="events"?"Event updates":"Newsletters"} unsubscribed.`:"Could not update preferences. Check your private link and try again.");}catch{setMessage("Could not update preferences. Please try again.");}finally{setBusy(false);}}
  return <main className="min-h-screen bg-background px-5 py-20"><div className="max-w-xl mx-auto space-y-6"><Link to="/welcome" className="text-2xl font-display">U⚡️Sportz</Link><h1 className="text-4xl">Your email preferences</h1>{valid?<div className="flex flex-wrap gap-3"><Button disabled={busy} onClick={()=>void remove("newsletter")} variant="outline">Unsubscribe newsletters</Button><Button disabled={busy} onClick={()=>void remove("events")} variant="outline">Unsubscribe events</Button><Button disabled={busy} onClick={()=>void remove("all")}>Unsubscribe all</Button></div>:<p className="text-muted-foreground">Open your private unsubscribe link to change preferences.</p>}{message&&<p role="status">{message}</p>}</div></main>;
}