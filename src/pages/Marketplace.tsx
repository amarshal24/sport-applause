import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Filter } from "lucide-react";
import { toast } from "sonner";
import Navigation from "@/components/Navigation";
import MarketplaceListingCard from "@/components/marketplace/MarketplaceListingCard";
import CreateListingModal from "@/components/marketplace/CreateListingModal";
import ListingDetailModal from "@/components/marketplace/ListingDetailModal";

interface Listing {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  price: number;
  category: string;
  condition: string;
  location: string | null;
  images: string[];
  status: string;
  views_count: number;
  created_at: string;
  profiles?: {
    username: string;
    avatar_url: string | null;
    full_name: string | null;
  };
}

const CATEGORIES = [
  { value: "all", label: "All Categories" },
  { value: "shoes", label: "Shoes" },
  { value: "apparel", label: "Apparel" },
  { value: "equipment", label: "Equipment" },
  { value: "accessories", label: "Accessories" },
  { value: "electronics", label: "Electronics" },
  { value: "other", label: "Other" },
];

const CONDITIONS = [
  { value: "all", label: "All Conditions" },
  { value: "new", label: "New" },
  { value: "like_new", label: "Like New" },
  { value: "used", label: "Used" },
  { value: "fair", label: "Fair" },
];

export default function Marketplace() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [conditionFilter, setConditionFilter] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    fetchListings();
  }, [user, navigate]);

  const fetchListings = async () => {
    try {
      setLoading(true);
      const { data: listingsData, error: listingsError } = await supabase
        .from("marketplace_listings")
        .select("*")
        .eq("status", "active")
        .order("created_at", { ascending: false });

      if (listingsError) throw listingsError;

      // Fetch profiles separately for each listing
      const listingsWithProfiles = await Promise.all(
        (listingsData || []).map(async (listing) => {
          const { data: profileData } = await supabase
            .from("profiles")
            .select("username, avatar_url, full_name")
            .eq("id", listing.user_id)
            .single();

          return {
            ...listing,
            profiles: profileData || undefined,
          };
        })
      );

      setListings(listingsWithProfiles as Listing[]);
    } catch (error) {
      console.error("Error fetching listings:", error);
      toast.error("Failed to load marketplace listings");
    } finally {
      setLoading(false);
    }
  };

  const filteredListings = listings.filter((listing) => {
    const matchesSearch =
      searchQuery === "" ||
      listing.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      listing.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "all" || listing.category === categoryFilter;
    const matchesCondition = conditionFilter === "all" || listing.condition === conditionFilter;
    return matchesSearch && matchesCategory && matchesCondition;
  });

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 py-8 pt-24">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Marketplace</h1>
            <p className="text-muted-foreground mt-1">
              Buy and sell sporting goods and equipment
            </p>
          </div>
          <Button onClick={() => setShowCreateModal(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Create Listing
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search listings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full md:w-48">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={conditionFilter} onValueChange={setConditionFilter}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Condition" />
            </SelectTrigger>
            <SelectContent>
              {CONDITIONS.map((cond) => (
                <SelectItem key={cond.value} value={cond.value}>
                  {cond.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Listings Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-card rounded-lg h-80 animate-pulse" />
            ))}
          </div>
        ) : filteredListings.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground text-lg">No listings found</p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => setShowCreateModal(true)}
            >
              Create the first listing
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredListings.map((listing) => (
              <MarketplaceListingCard
                key={listing.id}
                listing={listing}
                onClick={() => setSelectedListing(listing)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Create Listing Modal */}
      <CreateListingModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onSuccess={() => {
          setShowCreateModal(false);
          fetchListings();
        }}
      />

      {/* Listing Detail Modal */}
      <ListingDetailModal
        listing={selectedListing}
        open={!!selectedListing}
        onOpenChange={(open) => !open && setSelectedListing(null)}
        onRefresh={fetchListings}
      />
    </div>
  );
}
