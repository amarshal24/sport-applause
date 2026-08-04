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
import { ImagePlus, Loader2, X, Video as VideoIcon, GripVertical } from "lucide-react";
import { SecureImage, SecureVideo } from "@/components/SecureMedia";
import SafetyDisclaimer from "@/components/marketplace/SafetyDisclaimer";

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

// In-person pickup is the only allowed fulfillment method on the app.
export const FULFILLMENT_OPTIONS = [{ value: "pickup", label: "Local pickup only" }];

const MAX_IMAGES = 6;
const MAX_VIDEO_BYTES = 100 * 1024 * 1024;

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
  video_url?: string | null;
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
  const [images, setImages] = useState<string[]>([]);
  const [videoUrl, setVideoUrl] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [previewIndex, setPreviewIndex] = useState(0);

  const moveImage = (from: number | null, to: number) => {
    if (from === null || from === to) return;
    setImages((prev) => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
    setPreviewIndex(to);
  };

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
    setImages(listing?.images ?? []);
    setPreviewIndex(0);
    setVideoUrl(listing?.video_url ?? "");
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

  const handleVideo = async (file: File | null | undefined) => {
    if (!file || !user) return;
    if (!file.type.startsWith("video/")) return toast.error("Please choose a video file");
    if (file.size > MAX_VIDEO_BYTES) return toast.error("Video must be under 100MB");
    setUploadingVideo(true);
    try {
      const ext = file.name.split(".").pop() || "mp4";
      const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("marketplace").upload(path, file);
      if (error) throw error;
      const { data } = supabase.storage.from("marketplace").getPublicUrl(path);
      setVideoUrl(data.publicUrl);
    } catch (e: any) {
      toast.error(e?.message || "Video upload failed");
    } finally {
      setUploadingVideo(false);
    }
  };

  const handleSubmit = async () => {
    if (!user) return;
    if (!title.trim()) return toast.error("Add a title");
    const numericPrice = Number(price);
    if (!Number.isFinite(numericPrice) || numericPrice < 0) return toast.error("Add a valid price");
    if (images.length === 0) return toast.error("Add at least one photo");
    if (!videoUrl) return toast.error("A video of the item is required");

    setSaving(true);
    try {
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
        fulfillment: "pickup",
        shipping_cost: null,
        images,
        video_url: videoUrl,
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
            <Label>Photos ({images.length}/{MAX_IMAGES}) — different angles</Label>
            {images.length > 0 && (
              <div className="space-y-2">
                <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-muted">
                  <SecureImage
                    src={images[Math.min(previewIndex, images.length - 1)]}
                    alt={`Angle ${Math.min(previewIndex, images.length - 1) + 1} preview`}
                    className="h-full w-full object-contain"
                  />
                  <span className="absolute bottom-1 left-1 rounded bg-background/80 px-2 py-0.5 text-xs">
                    {Math.min(previewIndex, images.length - 1) === 0
                      ? "Cover photo"
                      : `Angle ${Math.min(previewIndex, images.length - 1) + 1}`}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Drag photos to reorder — the first photo is the cover.
                </p>
              </div>
            )}
            <div className="grid grid-cols-3 gap-2">
              {images.map((url, index) => (
                <div
                  key={url}
                  draggable
                  onDragStart={() => setDragIndex(index)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    moveImage(dragIndex, index);
                    setDragIndex(null);
                  }}
                  onDragEnd={() => setDragIndex(null)}
                  onClick={() => setPreviewIndex(index)}
                  className={`relative aspect-square rounded-lg overflow-hidden bg-muted cursor-grab active:cursor-grabbing ring-2 transition-opacity ${
                    previewIndex === index ? "ring-primary" : "ring-transparent"
                  } ${dragIndex === index ? "opacity-50" : ""}`}
                >
                  <SecureImage src={url} alt={`Angle ${index + 1}`} className="h-full w-full object-cover" />
                  {index === 0 && (
                    <span className="absolute bottom-1 left-1 rounded bg-background/80 px-1.5 text-[10px]">
                      Cover
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setImages((p) => p.filter((i) => i !== url));
                    }}
                    className="absolute top-1 right-1 rounded-full bg-background/80 p-1"
                    aria-label="Remove photo"
                  >
                    <X className="h-3 w-3" />
                  </button>
                  <div className="absolute top-1 left-1 rounded bg-background/80 p-0.5">
                    <GripVertical className="h-3 w-3 text-muted-foreground" />
                  </div>
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
            <Label>Item video (required)</Label>
            {videoUrl ? (
              <div className="relative rounded-lg overflow-hidden bg-muted">
                <SecureVideo src={videoUrl} controls className="w-full max-h-56 object-contain" />
                <button
                  type="button"
                  onClick={() => setVideoUrl("")}
                  className="absolute top-1 right-1 rounded-full bg-background/80 p-1"
                  aria-label="Remove video"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <label className="flex h-24 items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border cursor-pointer hover:bg-muted/50 transition-colors text-sm text-muted-foreground">
                {uploadingVideo ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <VideoIcon className="h-5 w-5" />
                    Upload a video (max 100MB)
                  </>
                )}
                <input
                  type="file"
                  accept="video/*"
                  className="hidden"
                  onChange={(e) => handleVideo(e.target.files?.[0])}
                />
              </label>
            )}
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

          <SafetyDisclaimer />

          <Button className="w-full" onClick={handleSubmit} disabled={saving || uploading || uploadingVideo}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {listing ? "Save changes" : "Post listing"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ListingFormModal;
