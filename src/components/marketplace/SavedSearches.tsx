import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Bell, BellRing, Trash2, Loader2, Search } from "lucide-react";

export interface SavedSearch {
  id: string;
  name: string;
  query: string | null;
  category: string | null;
  alerts_enabled: boolean;
  last_checked_at: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  matches: Record<string, number>;
  searches: SavedSearch[];
  loading: boolean;
  onRefresh: () => void;
  onApply: (search: SavedSearch) => void;
}

const SavedSearchesDialog = ({
  open,
  onOpenChange,
  matches,
  searches,
  loading,
  onRefresh,
  onApply,
}: Props) => {
  const [busyId, setBusyId] = useState<string | null>(null);

  const toggleAlerts = async (s: SavedSearch) => {
    setBusyId(s.id);
    const { error } = await supabase
      .from("saved_searches")
      .update({ alerts_enabled: !s.alerts_enabled })
      .eq("id", s.id);
    setBusyId(null);
    if (error) return toast.error("Could not update alerts");
    toast.success(s.alerts_enabled ? "Alerts paused" : "Alerts on");
    onRefresh();
  };

  const remove = async (s: SavedSearch) => {
    setBusyId(s.id);
    const { error } = await supabase.from("saved_searches").delete().eq("id", s.id);
    setBusyId(null);
    if (error) return toast.error("Could not delete search");
    toast.success("Saved search removed");
    onRefresh();
  };

  const markSeen = async (s: SavedSearch) => {
    await supabase
      .from("saved_searches")
      .update({ last_checked_at: new Date().toISOString() })
      .eq("id", s.id);
    onApply(s);
    onOpenChange(false);
    onRefresh();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Saved searches & alerts</DialogTitle>
          <DialogDescription>
            Get notified when new memorabilia matches your favorite sports or categories.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="py-8 flex justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : searches.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No saved searches yet. Set a keyword or category, then tap "Save search".
          </p>
        ) : (
          <div className="space-y-3">
            {searches.map((s) => {
              const count = matches[s.id] || 0;
              return (
                <div key={s.id} className="rounded-lg border border-border p-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium flex items-center gap-2">
                        {s.name}
                        {count > 0 && (
                          <Badge className="h-5 px-1.5 text-[10px]">{count} new</Badge>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {[s.category, s.query].filter(Boolean).join(" · ") || "All listings"}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => remove(s)}
                      disabled={busyId === s.id}
                      aria-label="Delete saved search"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      {s.alerts_enabled ? (
                        <BellRing className="h-4 w-4 text-primary" />
                      ) : (
                        <Bell className="h-4 w-4 text-muted-foreground" />
                      )}
                      <Label htmlFor={`alerts-${s.id}`} className="text-sm">Alerts</Label>
                      <Switch
                        id={`alerts-${s.id}`}
                        checked={s.alerts_enabled}
                        onCheckedChange={() => toggleAlerts(s)}
                        disabled={busyId === s.id}
                      />
                    </div>
                    <Button size="sm" variant="outline" onClick={() => markSeen(s)}>
                      <Search className="mr-1 h-3.5 w-3.5" /> View
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SavedSearchesDialog;

export function useSavedSearches(userId: string | undefined) {
  const [searches, setSearches] = useState<SavedSearch[]>([]);
  const [matches, setMatches] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!userId) {
      setSearches([]);
      setMatches({});
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from("saved_searches")
      .select("id,name,query,category,alerts_enabled,last_checked_at")
      .order("created_at", { ascending: false });
    const rows = (data as SavedSearch[]) || [];
    setSearches(rows);

    const counts: Record<string, number> = {};
    await Promise.all(
      rows
        .filter((s) => s.alerts_enabled)
        .map(async (s) => {
          let q = supabase
            .from("marketplace_listings")
            .select("id", { count: "exact", head: true })
            .eq("status", "active")
            .neq("user_id", userId)
            .gt("created_at", s.last_checked_at);
          if (s.category) q = q.eq("category", s.category);
          if (s.query) q = q.ilike("title", `%${s.query}%`);
          const { count } = await q;
          counts[s.id] = count || 0;
        })
    );
    setMatches(counts);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const totalNew = Object.values(matches).reduce((a, b) => a + b, 0);

  return { searches, matches, loading, refresh, totalNew };
}

export function SaveSearchButton({
  userId,
  query,
  category,
  onSaved,
}: {
  userId: string | undefined;
  query: string;
  category: string;
  onSaved: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  const defaultName =
    [category !== "All" ? category : null, query.trim() || null].filter(Boolean).join(" · ") ||
    "All memorabilia";

  const save = async () => {
    if (!userId) return;
    setSaving(true);
    const { error } = await supabase.from("saved_searches").insert({
      user_id: userId,
      name: (name.trim() || defaultName).slice(0, 80),
      query: query.trim() || null,
      category: category === "All" ? null : category,
      alerts_enabled: true,
    });
    setSaving(false);
    if (error) return toast.error("Could not save search");
    toast.success("Search saved — alerts are on");
    setName("");
    setOpen(false);
    onSaved();
  };

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)} disabled={!userId}>
        <BellRing className="mr-1 h-4 w-4" /> Save search
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Save this search</DialogTitle>
            <DialogDescription>
              We'll highlight new matching listings whenever you come back.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="ss-name">Name</Label>
              <Input
                id="ss-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={defaultName}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Matching: {category === "All" ? "All categories" : category}
              {query.trim() ? ` · "${query.trim()}"` : ""}
            </p>
            <Button className="w-full" onClick={save} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save & enable alerts
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export { useSavedSearches as useMarketplaceAlerts };
