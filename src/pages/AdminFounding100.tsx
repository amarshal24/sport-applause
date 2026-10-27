import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Download, Loader2, RefreshCw, Save, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FOUNDING100_CAP, founding100Roles, founding100Statuses, remainingSpots } from "@/lib/founding100";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type Application = Database["public"]["Tables"]["founding100_applications"]["Row"];

const csvCell = (v: string) => `"${v.replace(/"/g, '""')}"`;

export default function AdminFounding100() {
  const { user, loading: authLoading } = useAuth();
  const [admin, setAdmin] = useState<boolean | null>(null);
  const [rows, setRows] = useState<Application[]>([]);
  const [subscribers, setSubscribers] = useState<number>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("all");
  const [role, setRole] = useState("all");
  const [query, setQuery] = useState("");
  const [saving, setSaving] = useState<string>();
  const [notes, setNotes] = useState<Record<string, string>>({});

  useEffect(() => {
    let alive = true;
    setAdmin(null); setRows([]);
    if (!user) { if (!authLoading) setAdmin(false); return; }
    supabase.rpc("has_role", { _user_id: user.id, _role: "admin" }).then(({ data, error }) => { if (alive) setAdmin(!error && data === true); });
    return () => { alive = false; };
  }, [user, authLoading]);

  const load = useCallback(async () => {
    if (!admin) return;
    setLoading(true); setError("");
    const [apps, subs] = await Promise.all([
      supabase.from("founding100_applications").select("*").order("created_at", { ascending: false }).limit(500),
      supabase.from("public_subscriptions").select("id", { count: "exact", head: true }),
    ]);
    if (apps.error) setError("Applications could not be loaded. Please try again.");
    else { setRows(apps.data || []); setNotes(Object.fromEntries((apps.data || []).map(r => [r.id, r.admin_notes]))); }
    if (!subs.error) setSubscribers(subs.count ?? 0);
    setLoading(false);
  }, [admin]);
  useEffect(() => { void load(); }, [load]);

  const save = async (row: Application, nextStatus = row.status) => {
    setSaving(row.id);
    const admin_notes = notes[row.id] || "";
    const { error } = await supabase.from("founding100_applications").update({ status: nextStatus, admin_notes }).eq("id", row.id);
    if (error) toast.error("Could not save review");
    else { setRows(prev => prev.map(r => r.id === row.id ? { ...r, status: nextStatus, admin_notes } : r)); toast.success("Review saved"); }
    setSaving(undefined);
  };

  const exportCsv = () => {
    const header = ["name", "email", "role", "sport", "social_username", "beta_interest", "newsletter_consent", "status", "created_at"];
    const lines = rows.map(r => [r.name, r.email, r.role, r.sport, r.social_username, String(r.beta_interest), String(r.newsletter_consent), r.status, r.created_at].map(csvCell).join(","));
    const blob = new Blob([[header.join(","), ...lines].join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `founding100-applications-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  if (authLoading || admin === null) return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!admin) return <main className="max-w-5xl mx-auto px-5 py-20"><ShieldCheck className="h-10 w-10 text-primary mb-5" /><h1 className="text-3xl mb-3">Admins only</h1><p className="text-muted-foreground mb-6">You don’t have access to Founding 100 applications.</p><Button asChild><Link to={user ? "/" : "/auth"}>{user ? "Back to app" : "Sign in"}</Link></Button></main>;

  const selected = rows.filter(r => r.status === "selected").length;
  const visible = rows.filter(r => (status === "all" || r.status === status) && (role === "all" || r.role === role) && `${r.name} ${r.email} ${r.social_username}`.toLowerCase().includes(query.toLowerCase()));

  return <main className="max-w-5xl mx-auto px-5 py-10 pb-24">
    <Button variant="ghost" asChild className="mb-6"><Link to="/"><ArrowLeft className="mr-2 h-4 w-4" />Back to app</Link></Button>
    <header className="flex justify-between items-start gap-3 flex-wrap">
      <div><p className="text-sm text-secondary mb-2">U⚡️Sportz · Admin</p><h1 className="text-3xl sm:text-4xl">Founding 100 applications</h1></div>
      <div className="flex gap-2">
        <Button asChild variant="outline"><Link to="/admin/revenue">Revenue</Link></Button>
        <Button variant="outline" size="icon" title="Refresh applications" aria-label="Refresh applications" onClick={load} disabled={loading}><RefreshCw className="h-4 w-4" /></Button>
        <Button variant="outline" onClick={exportCsv} disabled={rows.length === 0}><Download className="mr-2 h-4 w-4" />Export CSV</Button>
      </div>
    </header>
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 py-7 border-b border-border mb-6">
      {[["applied", "Applied"], ["selected", "Selected"], ["waitlisted", "Waitlisted"], ["rejected", "Rejected"]].map(([s, label]) => <div key={s}><p className="text-3xl font-display">{rows.filter(r => r.status === s).length}</p><p className="text-sm text-muted-foreground">{label}</p></div>)}
      <div><p className="text-3xl font-display">{remainingSpots(selected)}</p><p className="text-sm text-muted-foreground">Spots left of {FOUNDING100_CAP}</p></div>
      <div><p className="text-3xl font-display">{subscribers ?? "—"}</p><p className="text-sm text-muted-foreground">Newsletter subscribers</p></div>
    </div>
    <div className="grid sm:grid-cols-3 gap-3 mb-6">
      <Input aria-label="Search applications" placeholder="Search name, email or username" value={query} onChange={e => setQuery(e.target.value)} />
      <Select value={status} onValueChange={setStatus}><SelectTrigger aria-label="Application status"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All statuses</SelectItem>{founding100Statuses.map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent></Select>
      <Select value={role} onValueChange={setRole}><SelectTrigger aria-label="Role filter"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All roles</SelectItem>{founding100Roles.map(r => <SelectItem key={r} value={r} className="capitalize">{r}</SelectItem>)}</SelectContent></Select>
    </div>
    <p className="text-xs text-muted-foreground mb-5">Showing newest {rows.length} applications (up to 500). Confirmation emails are not configured — email sending needs a verified domain.</p>
    {error && <p role="alert" className="text-destructive">{error}</p>}
    {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : !error && visible.length === 0 ? <p className="py-10 text-muted-foreground">No applications found.</p> : <div className="space-y-4">{visible.map(r => <article key={r.id} className="rounded-lg border border-border bg-card p-5 space-y-4">
      <div className="flex flex-wrap gap-3 justify-between">
        <div className="min-w-0"><h2 className="text-xl break-words">{r.name}</h2><p className="text-sm text-muted-foreground break-all">{r.email}{r.social_username ? ` · ${r.social_username}` : ""}</p></div>
        <div className="flex gap-2 items-start flex-wrap"><Badge variant="outline" className="capitalize">{r.role}</Badge><Badge variant="outline" className="capitalize">{r.sport}</Badge>{r.beta_interest && <Badge variant="secondary">Beta interest</Badge>}{r.newsletter_consent && <Badge variant="secondary">Newsletter</Badge>}<Badge variant={r.status === "applied" ? "default" : "secondary"}>{r.status}</Badge></div>
      </div>
      <p className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</p>
      <div className="space-y-2"><Label htmlFor={`notes-${r.id}`}>Private review notes</Label><Textarea id={`notes-${r.id}`} value={notes[r.id] || ""} maxLength={2000} onChange={e => setNotes(prev => ({ ...prev, [r.id]: e.target.value }))} /></div>
      <div className="flex flex-wrap gap-2">
        {founding100Statuses.filter(s => s !== r.status).map(s => <Button key={s} size="sm" variant={s === "selected" ? "default" : "outline"} disabled={saving === r.id} onClick={() => save(r, s)} className="capitalize">{s}</Button>)}
        <Button size="sm" variant="ghost" disabled={saving === r.id} onClick={() => save(r)}><Save className="mr-1 h-4 w-4" />Save notes</Button>
      </div>
    </article>)}</div>}
  </main>;
}
