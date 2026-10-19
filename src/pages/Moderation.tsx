import { useCallback, useEffect, useState } from "react";
import Navigation from "@/components/Navigation";
import Sidebar from "@/components/Sidebar";
import MobileNav from "@/components/MobileNav";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ShieldCheck, EyeOff, Check, X, Trash2, Ban } from "lucide-react";
import GameReviewModeration from "@/components/games/GameReviewModeration";

interface Report {
  id: string;
  reporter_id: string;
  target_type: string;
  target_id: string;
  reason: string;
  details: string | null;
  status: "pending" | "reviewed" | "dismissed";
  created_at: string;
}

const Moderation = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [isMod, setIsMod] = useState<boolean | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"pending" | "all">("pending");

  const checkRole = useCallback(async () => {
    if (!user) return;
    const [{ data: admin }, { data: mod }] = await Promise.all([
      supabase.rpc("has_role", { _user_id: user.id, _role: "admin" }),
      supabase.rpc("has_role", { _user_id: user.id, _role: "moderator" }),
    ]);
    setIsMod(Boolean(admin) || Boolean(mod));
  }, [user]);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    let q = supabase
      .from("content_reports")
      .select("*")
      .order("created_at", { ascending: false });
    if (tab === "pending") q = q.eq("status", "pending");
    const { data, error } = await q;
    if (error) toast.error("Could not load reports");
    setReports((data as Report[]) || []);
    setLoading(false);
  }, [tab]);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
    if (user) checkRole();
  }, [user, authLoading, navigate, checkRole]);

  useEffect(() => {
    if (isMod) fetchReports();
  }, [isMod, fetchReports]);

  const updateStatus = async (id: string, status: "reviewed" | "dismissed") => {
    const { error } = await supabase.from("content_reports").update({ status }).eq("id", id);
    if (error) toast.error("Could not update report");
    else setReports((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
  };

  const hideListing = async (report: Report) => {
    const { error } = await supabase
      .from("marketplace_listings")
      .update({ status: "hidden" })
      .eq("id", report.target_id);
    if (error) {
      toast.error("Could not hide listing");
    } else {
      toast.success("Listing hidden");
      updateStatus(report.id, "reviewed");
    }
  };

  const TABLES: Record<string, string> = {
    post: "posts",
    comment: "post_comments",
    recruiting_video: "recruiting_videos",
    highlight: "top_five_videos",
    story: "stories",
  };

  const removeContent = async (report: Report) => {
    const table = TABLES[report.target_type];
    if (!table) return;
    if (!confirm("Permanently remove this content?")) return;
    const { error } = await (supabase as any).from(table).delete().eq("id", report.target_id);
    if (error) toast.error("Could not remove content");
    else {
      toast.success("Content removed");
      updateStatus(report.id, "reviewed");
    }
  };

  const suspendOwner = async (report: Report) => {
    if (!user) return;
    let ownerId: string | null = null;
    if (report.target_type === "profile") ownerId = report.target_id;
    else {
      const table = report.target_type === "listing" ? "marketplace_listings" : TABLES[report.target_type];
      const ownerCol = report.target_type === "listing" ? "user_id" : "user_id";
      const { data } = await (supabase as any).from(table).select(ownerCol).eq("id", report.target_id).maybeSingle();
      ownerId = data?.[ownerCol] ?? null;
    }
    if (!ownerId) return toast.error("Could not find the account (content may be gone)");
    if (!confirm("Suspend this account? They won't be able to post, comment, upload or message.")) return;
    const { error } = await (supabase as any).from("user_suspensions").upsert({
      user_id: ownerId,
      reason: report.reason,
      suspended_by: user.id,
    });
    if (error) toast.error("Could not suspend account");
    else {
      toast.success("Account suspended");
      updateStatus(report.id, "reviewed");
    }
  };

  if (isMod === null) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="pt-20 pb-24 lg:pl-64">
          <div className="mx-auto max-w-5xl px-4 py-6">
            <div className="h-40 rounded-xl bg-muted animate-pulse" />
          </div>
        </main>
      </div>
    );
  }

  if (!isMod) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="pt-20 pb-24 lg:pl-64">
          <div className="mx-auto max-w-5xl px-4 py-10 text-center">
            <ShieldCheck className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
            <p className="font-medium">Moderators only</p>
            <p className="text-sm text-muted-foreground">You don't have access to this page.</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <Sidebar />
      <MobileNav />
      <main className="pt-20 pb-24 lg:pb-6 lg:pl-64">
        <div className="mx-auto max-w-5xl px-4 lg:px-6 py-6 space-y-5">
          <header className="flex items-center justify-between gap-3">
            <h1 className="text-2xl font-display font-bold gradient-text flex items-center gap-2">
              <ShieldCheck className="h-6 w-6 text-primary" />
              Moderation
            </h1>
            <div className="flex gap-2">
              {(["pending", "all"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`rounded-full px-3 py-1.5 text-sm border transition-colors ${
                    tab === t
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {t === "pending" ? "Pending" : "All"}
                </button>
              ))}
            </div>
          </header>

          <GameReviewModeration />
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />
              ))}
            </div>
          ) : reports.length === 0 ? (
            <div className="glass-effect rounded-xl p-10 text-center">
              <ShieldCheck className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
              <p className="font-medium">No reports</p>
              <p className="text-sm text-muted-foreground">Nothing needs review right now.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reports.map((r) => (
                <div key={r.id} className="glass-effect rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{r.target_type}</Badge>
                      <Badge variant={r.reason === "auto_screen" ? "destructive" : "outline"}>
                        {r.reason === "auto_screen" ? "Auto-flagged" : r.reason}
                      </Badge>
                      <Badge
                        variant={
                          r.status === "pending"
                            ? "default"
                            : r.status === "reviewed"
                              ? "secondary"
                              : "outline"
                        }
                      >
                        {r.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(r.created_at).toLocaleString()}
                    </p>
                  </div>
                  {r.details && <p className="text-sm">{r.details}</p>}
                  <p className="text-xs text-muted-foreground break-all">Target: {r.target_id}</p>
                  {r.status === "pending" && (
                    <div className="flex gap-2 flex-wrap">
                      {r.target_type === "listing" && (
                        <Button size="sm" variant="destructive" onClick={() => hideListing(r)}>
                          <EyeOff className="mr-1 h-4 w-4" /> Hide listing
                        </Button>
                      )}
                      {TABLES[r.target_type] && (
                        <Button size="sm" variant="destructive" onClick={() => removeContent(r)}>
                          <Trash2 className="mr-1 h-4 w-4" /> Remove
                        </Button>
                      )}
                      <Button size="sm" variant="outline" onClick={() => suspendOwner(r)}>
                        <Ban className="mr-1 h-4 w-4" /> Suspend user
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => updateStatus(r.id, "reviewed")}>
                        <Check className="mr-1 h-4 w-4" /> Mark reviewed
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => updateStatus(r.id, "dismissed")}>
                        <X className="mr-1 h-4 w-4" /> Dismiss
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Moderation;
