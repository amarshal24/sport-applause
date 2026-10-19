import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Check, Loader2, RefreshCw, Save, ShieldCheck, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { applicantTypes } from "@/lib/foundersClub";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type Application = Database["public"]["Tables"]["founders_club_applications"]["Row"];

export default function AdminFounders() {
  const { user, loading: authLoading } = useAuth();
  const [admin, setAdmin] = useState<boolean | null>(null);
  const [rows, setRows] = useState<Application[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("all");
  const [type, setType] = useState("all");
  const [query, setQuery] = useState("");
  const [saving, setSaving] = useState<string>();
  const [notes, setNotes] = useState<Record<string, string>>({});

  useEffect(() => {
    let alive = true;
    setAdmin(null);
    setRows([]);
    if (!user) { if (!authLoading) setAdmin(false); return; }
    supabase.rpc("has_role", { _user_id: user.id, _role: "admin" }).then(({data, error}) => { if (alive) setAdmin(!error && data === true); });
    return () => { alive = false; };
  }, [user, authLoading]);
  const load = useCallback(async () => {
    if (!admin) return;
    setLoading(true); setError("");
    const { data, error } = await supabase.from("founders_club_applications").select("*").order("created_at", { ascending: false }).limit(500);
    if (error) setError("Applications could not be loaded. Please try again.");
    else { setRows(data || []); setNotes(Object.fromEntries((data || []).map(r => [r.id, r.admin_notes]))); }
    setLoading(false);
  }, [admin]);
  useEffect(() => { void load(); }, [load]);
  const save = async (row: Application, nextStatus = row.status) => {
    setSaving(row.id);
    const admin_notes = notes[row.id] || "";
    const { error } = await supabase.from("founders_club_applications").update({ status: nextStatus, admin_notes }).eq("id", row.id);
    if (error) toast.error("Could not save review");
    else { setRows(prev => prev.map(r => r.id === row.id ? {...r, status: nextStatus, admin_notes} : r)); toast.success("Review saved"); }
    setSaving(undefined);
  };
  if (authLoading || admin === null) return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!admin) return <main className="max-w-5xl mx-auto px-5 py-20"><ShieldCheck className="h-10 w-10 text-primary mb-5" /><h1 className="text-3xl mb-3">Admins only</h1><p className="text-muted-foreground mb-6">You don’t have access to Founders Club applications.</p><Button asChild><Link to={user ? "/" : "/auth"}>{user ? "Back to app" : "Sign in"}</Link></Button></main>;
  const visible = rows.filter(r => (status === "all" || r.status === status) && (type === "all" || r.applicant_type === type) && `${r.name} ${r.email} ${r.reason}`.toLowerCase().includes(query.toLowerCase()));
  return <main className="max-w-5xl mx-auto px-5 py-10 pb-24">
    <Button variant="ghost" asChild className="mb-6"><Link to="/"><ArrowLeft className="mr-2 h-4 w-4" />Back to app</Link></Button>
    <header className="flex justify-between items-start gap-3"><div><p className="text-sm text-secondary mb-2">U⚡️Sportz · Admin</p><h1 className="text-3xl sm:text-4xl">Founders Club applications</h1></div><Button variant="outline" size="icon" title="Refresh applications" aria-label="Refresh applications" onClick={load} disabled={loading}><RefreshCw className="h-4 w-4" /></Button></header>
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-7 border-b border-border mb-6">{["all", "pending", "accepted", "declined"].map(s => <div key={s}><p className="text-3xl font-display">{rows.filter(r => s === "all" || r.status === s).length}</p><p className="text-sm text-muted-foreground capitalize">{s === "all" ? "Applications" : s}</p></div>)}</div>
    <div className="grid sm:grid-cols-3 gap-3 mb-6"><Input aria-label="Search applications" placeholder="Search name, email or reason" value={query} onChange={e => setQuery(e.target.value)} /><Select value={status} onValueChange={setStatus}><SelectTrigger aria-label="Application status"><SelectValue /></SelectTrigger><SelectContent>{["all", "pending", "accepted", "declined"].map(s => <SelectItem key={s} value={s}>{s === "all" ? "All statuses" : s}</SelectItem>)}</SelectContent></Select><Select value={type} onValueChange={setType}><SelectTrigger aria-label="Applicant type filter"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All applicant types</SelectItem>{applicantTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
    <p className="text-xs text-muted-foreground mb-5">Showing newest {rows.length} applications (up to 500). Email confirmations are not configured.</p>
    {error && <p role="alert" className="text-destructive">{error}</p>}
    {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : !error && visible.length === 0 ? <p className="py-10 text-muted-foreground">No applications found.</p> : <div className="space-y-4">{visible.map(r => <article key={r.id} className="rounded-lg border border-border bg-card p-5 space-y-4">
      <div className="flex flex-wrap gap-3 justify-between"><div className="min-w-0"><h2 className="text-xl break-words">{r.name}</h2><p className="text-sm text-muted-foreground break-all">{r.email}</p></div><div className="flex gap-2 items-start"><Badge variant="outline" className="capitalize">{r.applicant_type}</Badge><Badge variant={r.status === "pending" ? "default" : "secondary"}>{r.status}</Badge></div></div>
      <p className="text-sm whitespace-pre-wrap break-words">{r.reason}</p><p className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()} · Confirmation: {r.confirmation_status.replaceAll("_", " ")}</p>
      <div className="space-y-2"><Label htmlFor={`notes-${r.id}`}>Private review notes</Label><Textarea id={`notes-${r.id}`} value={notes[r.id] || ""} maxLength={2000} onChange={e => setNotes(prev => ({ ...prev, [r.id]: e.target.value }))} /></div>
      <div className="flex flex-wrap gap-2"><Button size="sm" disabled={saving === r.id} onClick={() => save(r, "accepted")}><Check className="mr-1 h-4 w-4" />Accept</Button><Button size="sm" variant="outline" disabled={saving === r.id} onClick={() => save(r, "declined")}><X className="mr-1 h-4 w-4" />Decline</Button><Button size="sm" variant="ghost" disabled={saving === r.id} onClick={() => save(r)}><Save className="mr-1 h-4 w-4" />Save notes</Button>{r.status !== "pending" && <Button size="sm" variant="ghost" disabled={saving === r.id} onClick={() => save(r, "pending")}>Return to pending</Button>}</div>
    </article>)}</div>}
  </main>;
}