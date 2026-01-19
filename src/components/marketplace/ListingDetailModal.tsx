import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { MessageCircle, MapPin, Eye, ChevronLeft, ChevronRight, Trash2, Edit } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

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

interface ListingDetailModalProps {
  listing: Listing | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRefresh: () => void;
}

const conditionLabels: Record<string, string> = {
  new: "New",
  like_new: "Like New",
  used: "Used",
  fair: "Fair",
};

const categoryLabels: Record<string, string> = {
  shoes: "Shoes",
  apparel: "Apparel",
  equipment: "Equipment",
  accessories: "Accessories",
  electronics: "Electronics",
  other: "Other",
};

export default function ListingDetailModal({ listing, open, onOpenChange, onRefresh }: ListingDetailModalProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (!listing) return null;

  const isOwner = user?.id === listing.user_id;
  const placeholderImage = "/placeholder.svg";
  const images = listing.images.length > 0 ? listing.images : [placeholderImage];

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleContactSeller = () => {
    // Navigate to messages with the seller
    navigate(`/messages?to=${listing.user_id}`);
    onOpenChange(false);
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const { error } = await supabase
        .from("marketplace_listings")
        .delete()
        .eq("id", listing.id);

      if (error) throw error;

      toast.success("Listing deleted successfully");
      onOpenChange(false);
      onRefresh();
    } catch (error) {
      console.error("Error deleting listing:", error);
      toast.error("Failed to delete listing");
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
          {/* Image Gallery */}
          <div className="relative aspect-video bg-muted">
            <img
              src={images[currentImageIndex]}
              alt={listing.title}
              className="w-full h-full object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).src = placeholderImage;
              }}
            />
            {images.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                  {images.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        index === currentImageIndex ? "bg-white" : "bg-white/50"
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="p-6">
            <DialogHeader className="mb-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <DialogTitle className="text-2xl">{listing.title}</DialogTitle>
                  <p className="text-3xl font-bold text-primary mt-2">
                    ${listing.price.toFixed(2)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Badge variant="secondary">
                    {categoryLabels[listing.category] || listing.category}
                  </Badge>
                  <Badge variant="outline">
                    {conditionLabels[listing.condition] || listing.condition}
                  </Badge>
                </div>
              </div>
            </DialogHeader>

            {/* Meta info */}
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-6">
              {listing.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {listing.location}
                </div>
              )}
              <div className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                {listing.views_count} views
              </div>
              <span>
                Posted {formatDistanceToNow(new Date(listing.created_at), { addSuffix: true })}
              </span>
            </div>

            {/* Description */}
            {listing.description && (
              <div className="mb-6">
                <h3 className="font-semibold mb-2">Description</h3>
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {listing.description}
                </p>
              </div>
            )}

            {/* Seller info */}
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg mb-6">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={listing.profiles?.avatar_url || undefined} />
                  <AvatarFallback>
                    {listing.profiles?.username?.[0]?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">
                    {listing.profiles?.full_name || listing.profiles?.username || "Unknown Seller"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    @{listing.profiles?.username || "unknown"}
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              {isOwner ? (
                <>
                  <Button variant="outline" className="flex-1 gap-2" disabled>
                    <Edit className="h-4 w-4" />
                    Edit Listing
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </Button>
                </>
              ) : (
                <Button onClick={handleContactSeller} className="flex-1 gap-2">
                  <MessageCircle className="h-4 w-4" />
                  Contact Seller
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Listing</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this listing? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting}>
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
