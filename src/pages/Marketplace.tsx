import { useCallback, useEffect, useMemo, useState } from "react";
import Navigation from "@/components/Navigation";
import Sidebar from "@/components/Sidebar";
import MobileNav from "@/components/MobileNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { SecureImage } from "@/components/SecureMedia";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Search, Plus, MapPin, MessageCircle, Pencil, Trash2, Store, Bell } from "lucide-react";
import ListingFormModal, { MARKETPLACE_CATEGORIES, type Listing } from "@/components/marketplace/ListingFormModal";
import SavedSearchesDialog, { SaveSearchButton, useSavedSearches } from "@/components/marketplace/SavedSearches";

const Marketplace = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [listings, setListings] = useState<Listing[]>([]);
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("All");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Listing | null>(null);
  const [selected, setSelected] = useState<Listing | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const {
    searches,
    matches,
    loading: searchesLoading,
    refresh: refreshSearches,
    totalNew,
  } = useSavedSearches(user?.id);



  const fetchListings = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("marketplace_listings")
      .select("*")
      .eq("status", "active")
      .order("created_at", { ascending: false });
    if (error) toast.error("Could not load listings");
    setListings((data as Listing[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return listings.filter((l) => {
      const matchesCategory = category === "All" || l.category === category;
      const matchesQuery =
        !q ||
        l.title.toLowerCase().includes(q) ||
        (l.description || "").toLowerCase().includes(q) ||
        (l.location || "").toLowerCase().includes(q);
      return matchesCategory && matchesQuery;
    });
  }, [listings, query, category]);

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from("marketplace_listings").delete().eq("id", deleteId);
    if (error) {
      toast.error("Could not delete listing");
    } else {
      toast.success("Listing removed");
      setListings((prev) => prev.filter((l) => l.id !== deleteId));
      setSelected(null);
    }
    setDeleteId(null);
  };

  const openSell = () => {
    if (!user) {
      navigate("/auth");
      return;
    }
    setEditing(null);
    setFormOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <Sidebar />
      <MobileNav />

      <main className="pt-20 pb-24 lg:pb-6 lg:pl-64">
        <div className="mx-auto max-w-5xl px-4 lg:px-6 py-6 space-y-5">
          <header className="flex items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-display font-bold gradient-text flex items-center gap-2">
                <Store className="h-6 w-6 text-primary" />
                Marketplace
              </h1>
              <p className="text-sm text-muted-foreground">Buy and sell sports memorabilia locally.</p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {user && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative"
                  onClick={() => setAlertsOpen(true)}
                  aria-label="Saved searches and alerts"
                >
                  <Bell className="h-5 w-5" />
                  {totalNew > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center px-1">
                      {totalNew > 9 ? "9+" : totalNew}
                    </span>
                  )}
                </Button>
              )}
              <Button onClick={openSell}>
                <Plus className="mr-1 h-4 w-4" /> Sell
              </Button>
            </div>
          </header>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search memorabilia, teams, players..."
              className="pl-9 bg-muted/50"
            />
          </div>

          {user && (
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs text-muted-foreground">
                {totalNew > 0
                  ? `${totalNew} new listing${totalNew > 1 ? "s" : ""} match your saved searches`
                  : "Save this search to get alerts on new matches"}
              </p>
              <SaveSearchButton
                userId={user.id}
                query={query}
                category={category}
                onSaved={refreshSearches}
              />
            </div>
          )}

          <div className="flex gap-2 overflow-x-auto pb-1">
            {["All", ...MARKETPLACE_CATEGORIES].map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`whitespace-nowrap rounded-full px-3 py-1.5 text-sm border transition-colors ${
                  category === c
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border text-muted-foreground hover:bg-muted"
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="aspect-[4/5] rounded-xl bg-muted animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="glass-effect rounded-xl p-10 text-center">
              <Store className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
              <p className="font-medium">No listings yet</p>
              <p className="text-sm text-muted-foreground mb-4">Be the first to sell memorabilia here.</p>
              <Button onClick={openSell}>
                <Plus className="mr-1 h-4 w-4" /> Create listing
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {filtered.map((l) => (
                <button
                  key={l.id}
                  onClick={() => setSelected(l)}
                  className="text-left rounded-xl overflow-hidden border border-border bg-card hover:shadow-steel transition-shadow"
                >
                  <div className="aspect-square bg-muted">
                    {l.images?.[0] && (
                      <SecureImage src={l.images[0]} alt={l.title} className="h-full w-full object-cover" />
                    )}
                  </div>
                  <div className="p-2.5">
                    <p className="font-bold">${Number(l.price).toLocaleString()}</p>
                    <p className="text-sm line-clamp-1">{l.title}</p>
                    {l.location && (
                      <p className="text-xs text-muted-foreground line-clamp-1">{l.location}</p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </main>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="pr-6">{selected.title}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex gap-2 overflow-x-auto">
                  {(selected.images || []).map((img) => (
                    <SecureImage
                      key={img}
                      src={img}
                      alt={selected.title}
                      className="h-52 w-52 shrink-0 rounded-lg object-cover bg-muted"
                    />
                  ))}
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-2xl font-bold">${Number(selected.price).toLocaleString()}</p>
                  <div className="flex gap-2">
                    <Badge variant="secondary">{selected.category}</Badge>
                    <Badge variant="outline">{selected.condition}</Badge>
                  </div>
                </div>
                {(selected.team || selected.league || selected.size) && (
                  <div className="flex flex-wrap gap-2">
                    {selected.team && <Badge variant="outline">Team: {selected.team}</Badge>}
                    {selected.league && <Badge variant="outline">{selected.league}</Badge>}
                    {selected.size && <Badge variant="outline">Size {selected.size}</Badge>}
                  </div>
                )}
                {selected.location && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-4 w-4" /> {selected.location}
                  </p>
                )}
                {selected.description && (
                  <p className="text-sm whitespace-pre-wrap">{selected.description}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  {selected.fulfillment === "shipping"
                    ? `Ships to buyer${selected.shipping_cost != null ? ` — ${Number(selected.shipping_cost) === 0 ? "free shipping" : `$${Number(selected.shipping_cost).toLocaleString()} shipping`}` : ""}.`
                    : selected.fulfillment === "both"
                      ? `Local pickup or shipping${selected.shipping_cost != null ? ` (${Number(selected.shipping_cost) === 0 ? "free shipping" : `$${Number(selected.shipping_cost).toLocaleString()} shipping`})` : ""}. Meet in a safe public place.`
                      : "In-person pickup only. Meet in a safe public place."}
                </p>


                {user?.id === selected.user_id ? (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        setEditing(selected);
                        setSelected(null);
                        setFormOpen(true);
                      }}
                    >
                      <Pencil className="mr-1 h-4 w-4" /> Edit
                    </Button>
                    <Button variant="destructive" className="flex-1" onClick={() => setDeleteId(selected.id)}>
                      <Trash2 className="mr-1 h-4 w-4" /> Delete
                    </Button>
                  </div>
                ) : (
                  <Button
                    className="w-full"
                    onClick={() =>
                      navigate(
                        `/messages?to=${selected.user_id}&listing=${encodeURIComponent(selected.title)}`
                      )
                    }
                  >
                    <MessageCircle className="mr-1 h-4 w-4" /> Message seller
                  </Button>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this listing?</AlertDialogTitle>
            <AlertDialogDescription>This can't be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ListingFormModal
        open={formOpen}
        onOpenChange={setFormOpen}
        listing={editing}
        onSaved={fetchListings}
      />

      <SavedSearchesDialog
        open={alertsOpen}
        onOpenChange={setAlertsOpen}
        searches={searches}
        matches={matches}
        loading={searchesLoading}
        onRefresh={refreshSearches}
        onApply={(s) => {
          setQuery(s.query || "");
          setCategory(s.category || "All");
        }}
      />
    </div>
  );
};

export default Marketplace;
