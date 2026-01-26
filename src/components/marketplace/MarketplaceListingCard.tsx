import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Eye, MapPin } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

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

interface MarketplaceListingCardProps {
  listing: Listing;
  onClick: () => void;
  showStatus?: boolean;
}

const conditionLabels: Record<string, string> = {
  new: "New",
  like_new: "Like New",
  used: "Used",
  fair: "Fair",
};

const conditionColors: Record<string, string> = {
  new: "bg-green-500/20 text-green-400 border-green-500/30",
  like_new: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  used: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  fair: "bg-orange-500/20 text-orange-400 border-orange-500/30",
};

const statusLabels: Record<string, string> = {
  active: "Active",
  sold: "Sold",
  inactive: "Inactive",
};

const statusColors: Record<string, string> = {
  active: "bg-green-500/20 text-green-400 border-green-500/30",
  sold: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  inactive: "bg-gray-500/20 text-gray-400 border-gray-500/30",
};

export default function MarketplaceListingCard({ listing, onClick, showStatus }: MarketplaceListingCardProps) {
  const placeholderImage = "/placeholder.svg";
  const mainImage = listing.images?.[0] || placeholderImage;

  return (
    <Card 
      className="overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-card border-border group"
      onClick={onClick}
    >
      <div className="relative aspect-square overflow-hidden">
        <img
          src={mainImage}
          alt={listing.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            (e.target as HTMLImageElement).src = placeholderImage;
          }}
        />
        <Badge 
          className={`absolute top-2 right-2 ${conditionColors[listing.condition] || conditionColors.used}`}
        >
          {conditionLabels[listing.condition] || listing.condition}
        </Badge>
        {showStatus && (
          <Badge 
            className={`absolute top-2 left-2 ${statusColors[listing.status] || statusColors.active}`}
          >
            {statusLabels[listing.status] || listing.status}
          </Badge>
        )}
        {listing.images.length > 1 && (
          <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
            +{listing.images.length - 1} photos
          </div>
        )}
      </div>

      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-2xl font-bold text-primary">
            ${listing.price.toFixed(2)}
          </span>
          <div className="flex items-center gap-1 text-muted-foreground text-sm">
            <Eye className="h-3.5 w-3.5" />
            {listing.views_count}
          </div>
        </div>

        <h3 className="font-semibold text-foreground line-clamp-2 mb-2 group-hover:text-primary transition-colors">
          {listing.title}
        </h3>

        {listing.location && (
          <div className="flex items-center gap-1 text-muted-foreground text-sm mb-3">
            <MapPin className="h-3.5 w-3.5" />
            <span className="line-clamp-1">{listing.location}</span>
          </div>
        )}

        <div className="flex items-center justify-between pt-3 border-t border-border">
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={listing.profiles?.avatar_url || undefined} />
              <AvatarFallback className="text-xs">
                {listing.profiles?.username?.[0]?.toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm text-muted-foreground line-clamp-1">
              {listing.profiles?.username || "Unknown"}
            </span>
          </div>
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(listing.created_at), { addSuffix: true })}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
