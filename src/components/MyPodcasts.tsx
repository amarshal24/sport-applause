import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Pencil, Trash2, RefreshCw, Music, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Podcast {
  id: string;
  title: string;
  description: string | null;
  audio_url: string;
  thumbnail_url: string | null;
  duration: number | null;
  plays_count: number;
  likes_count: number;
  created_at: string;
}

const bucketPathFromUrl = (url: string) => {
  const marker = "/storage/v1/object/public/podcasts/";
  const i = url.indexOf(marker);
  return i >= 0 ? decodeURIComponent(url.slice(i + marker.length)) : null;
};

const MyPodcasts = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<Podcast[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Podcast | null>(null);
  const [deleting, setDeleting] = useState<Podcast | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: "", description: "" });
  const [newThumb, setNewThumb] = useState<File | null>(null);
  const [newAudio, setNewAudio] = useState<File | null>(null);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase.from("podcasts").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setItems((data as Podcast[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user?.id]);

  const openEdit = (p: Podcast) => {
    setEditing(p);
    setForm({ title: p.title, description: p.description ?? "" });
    setNewThumb(null);
    setNewAudio(null);
  };

  const saveEdit = async () => {
    if (!editing || !user) return;
    const title = form.title.trim();
    if (!title) return toast.error("Title is required");
    if (title.length > 200) return toast.error("Title too long");
    if (form.description.length > 2000) return toast.error("Description too long");
    if (newAudio && !newAudio.type.startsWith("audio/")) return toast.error("Invalid audio file");
    if (newAudio && newAudio.size > 100 * 1024 * 1024) return toast.error("Audio must be under 100MB");
    if (newThumb && !newThumb.type.startsWith("image/")) return toast.error("Invalid image file");

    setSaving(true);
    try {
      const update: Record<string, unknown> = { title, description: form.description || null };

      if (newThumb) {
        const path = `${user.id}/thumbnails/${Date.now()}-${newThumb.name}`;
        const { data, error } = await supabase.storage.from("podcasts").upload(path, newThumb, { upsert: true, contentType: newThumb.type });
        if (error) throw error;
        update.thumbnail_url = supabase.storage.from("podcasts").getPublicUrl(data.path).data.publicUrl;
        const oldThumb = editing.thumbnail_url ? bucketPathFromUrl(editing.thumbnail_url) : null;
        if (oldThumb) await supabase.storage.from("podcasts").remove([oldThumb]);
      }

      if (newAudio) {
        const ext = newAudio.name.split(".").pop() || "mp3";
        const path = `${user.id}/${Date.now()}-podcast.${ext}`;
        const { data, error } = await supabase.storage.from("podcasts").upload(path, newAudio, { upsert: true, contentType: newAudio.type });
        if (error) throw error;
        update.audio_url = supabase.storage.from("podcasts").getPublicUrl(data.path).data.publicUrl;
        try {
          const el = new Audio(URL.createObjectURL(newAudio));
          await new Promise<void>((res) => { el.onloadedmetadata = () => res(); });
          update.duration = Math.floor(el.duration);
        } catch { /* ignore */ }
        const oldAudio = bucketPathFromUrl(editing.audio_url);
        if (oldAudio) await supabase.storage.from("podcasts").remove([oldAudio]);
      }

      const { error } = await supabase.from("podcasts").update(update).eq("id", editing.id);
      if (error) throw error;
      toast.success("Podcast updated");
      setEditing(null);
      load();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to update");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    setSaving(true);
    try {
      const paths = [bucketPathFromUrl(deleting.audio_url), deleting.thumbnail_url ? bucketPathFromUrl(deleting.thumbnail_url) : null].filter(Boolean) as string[];
      if (paths.length) await supabase.storage.from("podcasts").remove(paths);
      const { error } = await supabase.from("podcasts").delete().eq("id", deleting.id);
      if (error) throw error;
      toast.success("Podcast deleted");
      setDeleting(null);
      load();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete");
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  return (
    <section className="mt-8">
      <h2 className="text-xl font-semibold mb-4">Your Podcasts</h2>
      {loading ? (
        <div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground">No podcasts yet — upload your first one above.</p>
      ) : (
        <ul className="space-y-3">
          {items.map((p) => (
            <li key={p.id} className="p-4 bg-card border rounded-lg flex flex-col sm:flex-row gap-4 sm:items-center">
              <div className="w-16 h-16 rounded bg-muted flex items-center justify-center overflow-hidden shrink-0">
                {p.thumbnail_url ? <img src={p.thumbnail_url} alt={p.title} className="w-full h-full object-cover" /> : <Music className="h-6 w-6 text-muted-foreground" />}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium truncate">{p.title}</h3>
                {p.description && <p className="text-sm text-muted-foreground line-clamp-2">{p.description}</p>}
                <p className="text-xs text-muted-foreground mt-1">{p.plays_count} plays · {p.likes_count} likes</p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => openEdit(p)} className="gap-1"><Pencil className="h-4 w-4" /> Edit</Button>
                <Button size="sm" variant="destructive" onClick={() => setDeleting(p)} className="gap-1"><Trash2 className="h-4 w-4" /> Delete</Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Edit Podcast</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Title *</Label>
              <Input id="edit-title" value={form.title} maxLength={200} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-desc">Description</Label>
              <Textarea id="edit-desc" rows={3} maxLength={2000} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Replace Thumbnail</Label>
              <Input type="file" accept="image/*" onChange={(e) => setNewThumb(e.target.files?.[0] ?? null)} />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2"><RefreshCw className="h-4 w-4" /> Replace Audio</Label>
              <Input type="file" accept="audio/*" onChange={(e) => setNewAudio(e.target.files?.[0] ?? null)} />
              <p className="text-xs text-muted-foreground">Stats (plays, likes) are preserved.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditing(null)} disabled={saving}>Cancel</Button>
            <Button onClick={saveEdit} disabled={saving}>{saving ? "Saving…" : "Save changes"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this podcast?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes "{deleting?.title}" and its audio & thumbnail files. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={saving} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {saving ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
};

export default MyPodcasts;
