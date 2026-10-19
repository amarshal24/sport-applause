import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
export default function GameReviewModeration(){
 const [reports,setReports]=useState<(Tables<"creator_game_review_reports"> & {review?:Tables<"creator_game_reviews">})[]>([]),[error,setError]=useState("");
 const load=useCallback(async()=>{const r=await supabase.from("creator_game_review_reports").select("*").eq("status","pending").order("created_at",{ascending:false});if(r.error){setError("Could not load game review reports");return;}const ids=(r.data??[]).map(x=>x.review_id);const reviews=ids.length?await supabase.from("creator_game_reviews").select("*").in("id",ids):{data:[],error:null};setReports((r.data??[]).map(x=>({...x,review:reviews.data?.find(v=>v.id===x.review_id)})));},[]);
 useEffect(()=>{void load();},[load]);
 async function act(id:string,action:string){const r=await supabase.rpc("moderate_creator_game_review",{_report_id:id,_action:action});if(r.error){setError(r.error.message);return;}setError("");await load();}
 return <section className="border-y border-border py-6 space-y-4"><h2 className="text-2xl">Game review reports</h2>{error&&<p role="alert" className="text-destructive">{error}</p>}{reports.length===0?<p className="text-muted-foreground">No pending game review reports</p>:reports.map(r=><article key={r.id} className="border-b border-border py-4 space-y-3"><p className="font-semibold">{r.reason}</p><p className="whitespace-pre-wrap break-words">{r.review?.body??"Review unavailable"}</p><p className="text-sm text-muted-foreground">{r.review?.rating} / 5 · {r.details}</p><div className="flex gap-2"><Button variant="destructive" onClick={()=>void act(r.id,"hide")}>Hide review</Button><Button variant="outline" onClick={()=>void act(r.id,"dismiss")}>Dismiss report</Button></div></article>)}</section>;
}