import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SecureImage } from "@/components/SecureMedia";
import { Button } from "@/components/ui/button";
import { Store, ChevronRight } from "lucide-react";

interface MiniListing {
  id: string;
  title: string;
  price: number;
  location: string | null;
  images: string[] | null;
}

const MarketplaceHighlights = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<MiniListing[]>([]);

  useEffect(() => {
    supabase
      .from("marketplace_listings")
      .select("id,title,price,location,images")
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(8)
      .then(({ data }) => setItems((data as MiniListing[]) || []));
  }, []);

  return (
    <section className="mt-4 glass-effect rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-display font-bold flex items-center gap-2">
          <Store className="h-4 w-4 text-primary" />
          Marketplace
        </h2>
        <Button variant="ghost" size="sm" onClick={() => navigate("/marketplace")}>
          See all <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </div>

      {items.length === 0 ? (
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">Sell your sports memorabilia to local fans.</p>
          <Button size="sm" onClick={() => navigate("/marketplace")}>Sell</Button>
        </div>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-1">
          {items.map((l) => (
            <button
              key={l.id}
              onClick={() => navigate("/marketplace")}
              className="w-32 shrink-0 text-left rounded-lg overflow-hidden border border-border bg-card"
            >
              <div className="aspect-square bg-muted">
                {l.images?.[0] && (
                  <SecureImage src={l.images[0]} alt={l.title} className="h-full w-full object-cover" />
                )}
              </div>
              <div className="p-2">
                <p className="text-sm font-bold">${Number(l.price).toLocaleString()}</p>
                <p className="text-xs text-muted-foreground line-clamp-1">{l.title}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </section>
  );
};

export default MarketplaceHighlights;
