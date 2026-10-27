import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, ArrowLeft, ArrowUpRight, ClipboardCheck, AlertTriangle, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { auditDate, readinessAreas, approvalChecklist } from '@/lib/launchReadiness';
export default function AdminLaunch() {
  const { user, loading } = useAuth();
  const [admin, setAdmin] = useState<boolean | null>(null);
  const [checklist, setChecklist] = useState<string[]>([]);
  useEffect(() => {
    let alive = true; setAdmin(null); setChecklist([]);
    if (!user) { if (!loading) setAdmin(false); return; }
    void supabase.rpc('has_role', { _user_id: user.id, _role: 'admin' }).then(result => { if (alive) setAdmin(!result.error && result.data === true); });
    return () => { alive = false; };
  }, [user, loading]);
  if (loading || admin === null) return <main className="min-h-screen flex items-center justify-center"><Loader2 aria-label="Checking admin access" className="animate-spin text-primary" /></main>;
  if (!admin) return <main className="max-w-5xl mx-auto px-5 py-20"><ShieldCheck className="text-primary mb-4" /><h1 className="text-3xl mb-6">Admins only</h1><Button asChild><Link to="/">Back to app</Link></Button></main>;
  return <main className="max-w-5xl mx-auto px-5 py-8 pb-24 space-y-8">
    <div className="flex gap-2 flex-wrap"><Button asChild variant="ghost"><Link to="/"><ArrowLeft />Back to app</Link></Button><Button asChild variant="outline"><Link to="/admin/game-testing">Game purchase testing</Link></Button></div>
    <header className="border-b border-border pb-6 space-y-4"><p className="text-secondary text-sm">U⚡️Sportz · Admin</p><div className="flex items-start justify-between gap-4 flex-wrap"><div><h1 className="text-4xl font-display">Launch readiness</h1><p className="text-muted-foreground mt-2">Evidence snapshot · {auditDate}</p></div><Badge variant="destructive">Not cleared for launch</Badge></div><nav aria-label="Launch administration" className="flex gap-2 flex-wrap">{[['Revenue', '/admin/revenue'], ['Payouts', '/admin/payouts'], ['Founding 100', '/admin/founding100'], ['Subscribers', '/admin/subscribers'], ['Moderation', '/moderation']].map(([label, path]) => <Button key={path} variant="outline" asChild><Link to={path}>{label}<ArrowUpRight /></Link></Button>)}</nav></header>
    <section className="border-l-4 border-destructive pl-4"><h2 className="text-xl flex gap-2 items-center"><AlertTriangle className="text-destructive shrink-0" />Release held</h2><p className="text-muted-foreground mt-2">No real test charges, publishing, DNS changes or store submissions were performed. Previously approved web sales are unchanged.</p></section>
    <section aria-label="Readiness by area" className="grid md:grid-cols-2 gap-x-8">{readinessAreas.map(area => <article key={area.title} className="py-6 border-b border-border space-y-3"><div className="flex justify-between gap-3 items-start"><h2 className="text-xl font-display">{area.title}</h2><Badge variant={area.status === 'Blocked' ? 'destructive' : 'secondary'} className="shrink-0">{area.status}</Badge></div><p className="text-sm leading-relaxed">{area.evidence}</p><p className="text-sm text-muted-foreground leading-relaxed"><span className="text-foreground font-medium">Next: </span>{area.next}</p></article>)}</section>
    <section className="space-y-4"><h2 className="text-2xl font-display flex items-center gap-2"><ClipboardCheck className="text-primary" />Final approval checklist</h2><p className="text-sm text-muted-foreground">Session-only review notes, not verified evidence or authorization. Checks reset when this page closes.</p><div className="divide-y divide-border">{approvalChecklist.map((item, i) => <div key={item} className="py-4 flex items-start gap-3"><Checkbox id={`release-check-${i}`} checked={checklist.includes(item)} onCheckedChange={checked => setChecklist(previous => checked === true ? [...previous, item] : previous.filter(value => value !== item))} /><label htmlFor={`release-check-${i}`} className="text-sm leading-relaxed cursor-pointer">{item}</label></div>)}</div><p className="text-sm text-muted-foreground">{checklist.length} of {approvalChecklist.length} reviewed this session · Release remains held</p></section>
  </main>;
}