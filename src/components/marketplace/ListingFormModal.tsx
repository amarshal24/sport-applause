import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { ImagePlus, Loader2, X } from "lucide-react";
import { SecureImage } from "@/components/SecureMedia";

export const MARKETPLACE_CATEGORIES = [
  "Memorabilia",
  "Jerseys",
  "Trading Cards",
  "Signed Items",
  "Game-Worn",
  "Equipment",
  "Collectibles",
  "Other",
];

export const CONDITIONS = ["New", "Like New", "Good", "Fair", "Used"];

export const LEAGUES = ["NFL", "NBA", "MLB", "NHL", "MLS", "NCAA", "Olympic", "Other"];

export const FULFILLMENT_OPTIONS = [
  { value: "pickup", label: "Local pickup only" },
  { value: "shipping", label: "Shipping only" },
  { value: "both", label: "Pickup or shipping" },
];

const MAX_IMAGES = 5;

export interface Listing {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  price: number;
  category: string;
  condition: string;
  location: string | null;
  images: string[] | null;
  status: string;
  views_count: number;
  created_at: string;
  team?: string | null;
  league?: string | null;
  size?: string | null;
  fulfillment?: string | null;
  shipping_cost?: number | null;
}


interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  listing?: Listing | null;
  onSaved: () => void;
}

const ListingFormModal = ({ open, onOpenChange, listing, onSaved }: Props) => {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState(MARKETPLACE_CATEGORIES[0]);
  const [condition, setCondition] = useState(CONDITIONS[0]);
  const [location, setLocation] = useState("");
  const [team, setTeam] = useState("");
  const [league, setLeague] = useState("");
  const [size, setSize] = useState("");
  const [fulfillment, setFulfillment] = useState("pickup");
  const [shippingCost, setShippingCost] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTitle(listing?.title ?? "");
    setDescription(listing?.description ?? "");
    setPrice(listing ? String(listing.price) : "");
    setCategory(listing?.category ?? MARKETPLACE_CATEGORIES[0]);
    setCondition(listing?.condition ?? CONDITIONS[0]);
    setLocation(listing?.location ?? "");
    setTeam(listing?.team ?? "");
    setLeague(listing?.league ?? "");
    setSize(listing?.size ?? "");
    setFulfillment(listing?.fulfillment ?? "pickup");
    setShippingCost(
      listing?.shipping_cost !== null && listing?.shipping_cost !== undefined
        ? String(listing.shipping_cost)
        : ""
    );
    setImages(listing?.images ?? []);
  }, [open, listing]);


  const handleFiles = async (files: FileList | null) => {
    if (!files || !user) return;
    const remaining = MAX_IMAGES - images.length;
    if (remaining <= 0) {
      toast.error(`You can upload up to ${MAX_IMAGES} photos`);
      return;
    }
    setUploading(true);
    try {
      const picked = Array.from(files).slice(0, remaining);
      const uploaded: string[] = [];
      for (const file of picked) {
        if (file.size > 10 * 1024 * 1024) {
          toast.error(`${file.name} is larger than 10MB`);
          continue;
        }
        const ext = file.name.split(".").pop() || "jpg";
        const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
        const { error } = await supabase.storage.from("marketplace").upload(path, file);
        if (error) throw error;
        const { data } = supabase.storage.from("marketplace").getPublicUrl(path);
        uploaded.push(data.publicUrl);
      }
      setImages((prev) => [...prev, ...uploaded]);
    } catch (e: any) {
      toast.error(e?.message || "Photo upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!user) return;
    if (!title.trim()) return toast.error("Add a title");
    const numericPrice = Number(price);
    if (!Number.isFinite(numericPrice) || numericPrice < 0) return toast.error("Add a valid price");
    if (images.length === 0) return toast.error("Add at least one photo");

    setSaving(true);
    try {
      const parsedShipping = Number(shippingCost);
      const payload = {
        title: title.trim().slice(0, 120),
        description: description.trim().slice(0, 2000) || null,
        price: numericPrice,
        category,
        condition,
        location: location.trim() || null,
        team: team.trim().slice(0, 80) || null,
        league: league || null,
        size: size.trim().slice(0, 40) || null,
        fulfillment,
        shipping_cost:
          fulfillment !== "pickup" && shippingCost.trim() !== "" && Number.isFinite(parsedShipping) && parsedShipping >= 0
            ? parsedShipping
            : null,
        images,
      };

      if (listing) {
        const { error } = await supabase
          .from("marketplace_listings")
          .update(payload)
          .eq("id", listing.id);
        if (error) throw error;
        toast.success("Listing updated");
      } else {
        const { error } = await supabase
          .from("marketplace_listings")
          .insert({ ...payload, user_id: user.id, status: "active" });
        if (error) throw error;
        toast.success("Listing posted");
      }
      onOpenChange(false);
      onSaved();
    } catch (e: any) {
      toast.error(e?.message || "Could not save listing");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{listing ? "Edit listing" : "Sell memorabilia"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Photos ({images.length}/{MAX_IMAGES})</Label>
            <div className="grid grid-cols-3 gap-2">
              {images.map((url) => (
                <div key={url} className="relative aspect-square rounded-lg overflow-hidden bg-muted">
                  <SecureImage src={url} alt="Listing photo" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setImages((p) => p.filter((i) => i !== url))}
                    className="absolute top-1 right-1 rounded-full bg-background/80 p-1"
                    aria-label="Remove photo"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {images.length < MAX_IMAGES && (
                <label className="aspect-square rounded-lg border-2 border-dashed border-border flex items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors">
                  {uploading ? (
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  ) : (
                    <ImagePlus className="h-5 w-5 text-muted-foreground" />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => handleFiles(e.target.files)}
                  />
                </label>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ml-title">Title</Label>
            <Input id="ml-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Signed rookie jersey" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="ml-price">Price ($)</Label>
              <Input id="ml-price" type="number" min="0" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0" />
            </div>
            <div className="space-y-2">
              <Label>Condition</Label>
              <Select value={condition} onValueChange={setCondition}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  {CONDITIONS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  {MARKETPLACE_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ml-loc">Location</Label>
              <Input id="ml-loc" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="City, State" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label htmlFor="ml-team">Team</Label>
              <Input id="ml-team" value={team} onChange={(e) => setTeam(e.target.value)} placeholder="Lakers" />
            </div>
            <div className="space-y-2">
              <Label>League</Label>
              <Select value={league || "none"} onValueChange={(v) => setLeague(v === "none" ? "" : v)}>
                <SelectTrigger><SelectValue placeholder="League" /></SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  <SelectItem value="none">Not specified</SelectItem>
                  {LEAGUES.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ml-size">Size</Label>
              <Input id="ml-size" value={size} onChange={(e) => setSize(e.target.value)} placeholder="XL / 10.5" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Shipping / pickup</Label>
              <Select value={fulfillment} onValueChange={setFulfillment}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  {FULFILLMENT_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {fulfillment !== "pickup" && (
              <div className="space-y-2">
                <Label htmlFor="ml-ship">Shipping cost ($)</Label>
                <Input
                  id="ml-ship"
                  type="number"
                  min="0"
                  value={shippingCost}
                  onChange={(e) => setShippingCost(e.target.value)}
                  placeholder="0 for free shipping"
                />
              </div>
            )}
          </div>


          <div className="space-y-2">
            <Label htmlFor="ml-desc">Description</Label>
            <Textarea
              id="ml-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell buyers about the item, authenticity, and pickup details"
              rows={4}
            />
          </div>

          <p className="text-xs text-muted-foreground">All sales are arranged in person between buyer and seller.</p>

          <Button className="w-full" onClick={handleSubmit} disabled={saving || uploading}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {listing ? "Save changes" : "Post listing"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ListingFormModal;
