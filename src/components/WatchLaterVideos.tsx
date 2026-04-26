import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Clock, X, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface WatchLaterItem {
  id: string;
  post_id: string;
  created_at: string;
  posts: {
    id: string;
    content: string;
    image_url: string | null;
    video_url: string | null;
  } | null;
}

const WatchLaterVideos = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<WatchLaterItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchItems();
  }, [user]);

  const fetchItems = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("watch_later")
      .select("id, post_id, created_at, posts(id, content, image_url, video_url)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to load watch later");
    } else {
      setItems((data as any) || []);
    }
    setLoading(false);
  };

  const handleRemove = async (id: string) => {
    const { error } = await supabase.from("watch_later").delete().eq("id", id);
    if (error) {
      toast.error("Failed to remove");
      return;
    }
    setItems((prev) => prev.filter((i) => i.id !== id));
    toast.success("Removed from Watch Later");
  };

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="aspect-square bg-muted/30 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Clock className="h-12 w-12 text-muted-foreground/30 mb-3" />
        <h3 className="text-base font-semibold text-foreground mb-1">Nothing saved yet</h3>
        <p className="text-sm text-muted-foreground">Save posts to watch later and they'll appear here</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
      {items.map((item) => (
        <div
          key={item.id}
          className="aspect-square bg-muted/30 relative overflow-hidden rounded-lg group"
        >
          {item.posts?.video_url ? (
            <video src={item.posts.video_url} className="w-full h-full object-cover" muted />
          ) : item.posts?.image_url ? (
            <img src={item.posts.image_url} alt="Saved" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-muted/50 p-2">
              <p className="text-xs text-muted-foreground line-clamp-4 text-center">
                {item.posts?.content || "Post unavailable"}
              </p>
            </div>
          )}
          {item.posts?.video_url && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <Play className="h-8 w-8 text-foreground/80 fill-current drop-shadow-lg" />
            </div>
          )}
          <Button
            size="icon"
            variant="secondary"
            className="absolute top-1.5 right-1.5 h-7 w-7 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => handleRemove(item.id)}
            aria-label="Remove from Watch Later"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      ))}
    </div>
  );
};

export default WatchLaterVideos;
