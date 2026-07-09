import React, { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Radio, Eye, Trash2, Calendar, Upload, Pencil, Video, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { SecureVideo } from "@/components/SecureMedia";

const BUCKET = "podcasts"; // reused: podcasts bucket holds this user's video podcasts too
const MAX_VIDEO_MB = 200;

const pathFromUrl = (url: string | null) => {
  if (!url) return null;
  const m = url.match(/\/storage\/v1\/object\/(?:public|sign)\/podcasts\/(.+?)(?:\?|$)/);
  return m ? decodeURIComponent(m[1]) : null;
};

const LiveStreamManager = () => {
  const { user } = useAuth();
  const [streams, setStreams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({ title: "", description: "", scheduled_at: "" });

  // Upload podcast video
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadDesc, setUploadDesc] = useState("");
  const [uploadVideo, setUploadVideo] = useState<File | null>(null);
  const [uploadThumb, setUploadThumb] = useState<File | null>(null);
  const uploadRef = useRef<HTMLInputElement>(null);

  // Edit
  const [editing, setEditing] = useState<any | null>(null);
  const [editForm, setEditForm] = useState({ title: "", description: "" });
  const [editVideo, setEditVideo] = useState<File | null>(null);
  const [editThumb, setEditThumb] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  // Delete
  const [deleting, setDeleting] = useState<any | null>(null);

  useEffect(() => { if (user) fetchStreams(); }, [user]);

  const fetchStreams = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("live_streams").select("*").eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (error) console.error(error); else setStreams(data || []);
    setLoading(false);
  };

  const handleCreateStream = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !formData.title) return toast.error("Please fill in all required fields");
    const { error } = await supabase.from("live_streams").insert({
      user_id: user.id, title: formData.title, description: formData.description,
      scheduled_at: formData.scheduled_at || null, status: "scheduled",
    });
    if (error) { toast.error("Failed to create stream"); return; }
    toast.success("Stream scheduled successfully!");
    setFormData({ title: "", description: "", scheduled_at: "" });
    setShowCreateForm(false);
    fetchStreams();
  };

  const handleGoLive = async (id: string) => {
    const { error } = await supabase.from("live_streams")
      .update({ status: "live", started_at: new Date().toISOString() }).eq("id", id);
    if (error) toast.error("Failed to start stream"); else { toast.success("You're now live!"); fetchStreams(); }
  };

  const handleEndStream = async (id: string) => {
    const { error } = await supabase.from("live_streams")
      .update({ status: "ended", ended_at: new Date().toISOString() }).eq("id", id);
    if (error) toast.error("Failed to end stream"); else { toast.success("Stream ended"); fetchStreams(); }
  };

  const uploadFile = async (file: File, kind: "video" | "thumb") => {
    if (!user) throw new Error("Not authenticated");
    const ext = file.name.split(".").pop() || (kind === "video" ? "mp4" : "jpg");
    const path = `${user.id}/${kind === "video" ? "videos" : "thumbnails"}/${Date.now()}.${ext}`;
    const { data, error } = await supabase.storage.from(BUCKET).upload(path, file, {
      upsert: true, contentType: file.type,
    });
    if (error) throw error;
    return supabase.storage.from(BUCKET).getPublicUrl(data.path).data.publicUrl;
  };

  const handleUploadPodcastVideo = async () => {
    if (!user) return toast.error("Please sign in");
    if (!uploadTitle.trim()) return toast.error("Title is required");
    if (!uploadVideo) return toast.error("Choose a video file");
    if (!uploadVideo.type.startsWith("video/")) return toast.error("Invalid video file");
    if (uploadVideo.size > MAX_VIDEO_MB * 1024 * 1024) return toast.error(`Video must be under ${MAX_VIDEO_MB}MB`);
    if (uploadThumb && !uploadThumb.type.startsWith("image/")) return toast.error("Invalid thumbnail");

    setUploading(true);
    setUploadProgress(10);
    try {
      const replay_url = await uploadFile(uploadVideo, "video");
      setUploadProgress(70);
      let thumbnail_url: string | null = null;
      if (uploadThumb) thumbnail_url = await uploadFile(uploadThumb, "thumb");
      setUploadProgress(90);
      const { error } = await supabase.from("live_streams").insert({
        user_id: user.id,
        title: uploadTitle.trim(),
        description: uploadDesc.trim() || null,
        status: "ended",
        started_at: new Date().toISOString(),
        ended_at: new Date().toISOString(),
        replay_url,
        thumbnail_url,
      });
      if (error) throw error;
      toast.success("Podcast video uploaded");
      setUploadTitle(""); setUploadDesc(""); setUploadVideo(null); setUploadThumb(null);
      if (uploadRef.current) uploadRef.current.value = "";
      setUploadProgress(100);
      fetchStreams();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Upload failed");
    } finally {
      setUploading(false);
      setTimeout(() => setUploadProgress(0), 500);
    }
  };

  const openEdit = (s: any) => {
    setEditing(s);
    setEditForm({ title: s.title, description: s.description ?? "" });
    setEditVideo(null); setEditThumb(null);
  };

  const saveEdit = async () => {
    if (!editing || !user) return;
    if (!editForm.title.trim()) return toast.error("Title is required");
    if (editVideo && !editVideo.type.startsWith("video/")) return toast.error("Invalid video");
    if (editVideo && editVideo.size > MAX_VIDEO_MB * 1024 * 1024) return toast.error(`Video must be under ${MAX_VIDEO_MB}MB`);
    if (editThumb && !editThumb.type.startsWith("image/")) return toast.error("Invalid thumbnail");

    setSaving(true);
    try {
      const update: any = { title: editForm.title.trim(), description: editForm.description || null };
      if (editVideo) {
        update.replay_url = await uploadFile(editVideo, "video");
        const oldPath = pathFromUrl(editing.replay_url);
        if (oldPath) await supabase.storage.from(BUCKET).remove([oldPath]);
      }
      if (editThumb) {
        update.thumbnail_url = await uploadFile(editThumb, "thumb");
        const oldPath = pathFromUrl(editing.thumbnail_url);
        if (oldPath) await supabase.storage.from(BUCKET).remove([oldPath]);
      }
      const { error } = await supabase.from("live_streams").update(update).eq("id", editing.id);
      if (error) throw error;
      toast.success("Updated");
      setEditing(null);
      fetchStreams();
    } catch (err: any) {
      toast.error(err.message || "Failed to update");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    setSaving(true);
    try {
      const paths = [pathFromUrl(deleting.replay_url), pathFromUrl(deleting.thumbnail_url)].filter(Boolean) as string[];
      if (paths.length) await supabase.storage.from(BUCKET).remove(paths);
      const { error } = await supabase.from("live_streams").delete().eq("id", deleting.id);
      if (error) throw error;
      toast.success("Deleted");
      setDeleting(null);
      fetchStreams();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete");
    } finally {
      setSaving(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: any = { scheduled: "secondary", live: "destructive", ended: "outline" };
    return (
      <Badge variant={variants[status] || "secondary"}>
        {status === "live" && <Radio className="h-3 w-3 mr-1 animate-pulse" />}
        {status.toUpperCase()}
      </Badge>
    );
  };

  if (loading) return <div className="text-center py-8">Loading streams...</div>;

  return (
    <div className="space-y-6">
      {/* Upload Podcast Video */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Video className="h-5 w-5" /> Upload Podcast Video</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="pv-title">Title *</Label>
            <Input id="pv-title" value={uploadTitle} maxLength={200}
              onChange={(e) => setUploadTitle(e.target.value)} placeholder="Podcast episode title" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pv-desc">Description</Label>
            <Textarea id="pv-desc" rows={2} value={uploadDesc} maxLength={2000}
              onChange={(e) => setUploadDesc(e.target.value)} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Video file (max {MAX_VIDEO_MB}MB) *</Label>
              <Input ref={uploadRef} type="file" accept="video/*"
                onChange={(e) => setUploadVideo(e.target.files?.[0] ?? null)} />
            </div>
            <div className="space-y-2">
              <Label>Thumbnail (optional)</Label>
              <Input type="file" accept="image/*"
                onChange={(e) => setUploadThumb(e.target.files?.[0] ?? null)} />
            </div>
          </div>
          {uploading && (
            <div className="w-full bg-muted rounded h-2 overflow-hidden">
              <div className="bg-primary h-full transition-all" style={{ width: `${uploadProgress}%` }} />
            </div>
          )}
          <Button onClick={handleUploadPodcastVideo} disabled={uploading} className="w-full">
            {uploading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Uploading…</> : <><Upload className="h-4 w-4 mr-2" /> Upload video</>}
          </Button>
        </CardContent>
      </Card>

      {/* Schedule Stream */}
      {!showCreateForm ? (
        <Button onClick={() => setShowCreateForm(true)} className="w-full" variant="outline">
          <Radio className="h-4 w-4 mr-2" />
          Schedule New Live Stream
        </Button>
      ) : (
        <Card>
          <CardHeader><CardTitle>Schedule Live Stream</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleCreateStream} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="stream-title">Title *</Label>
                <Input id="stream-title" value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stream-description">Description</Label>
                <Textarea id="stream-description" value={formData.description} rows={3}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stream-scheduled">Schedule Date & Time (Optional)</Label>
                <Input id="stream-scheduled" type="datetime-local" value={formData.scheduled_at}
                  onChange={(e) => setFormData({ ...formData, scheduled_at: e.target.value })} />
              </div>
              <div className="flex gap-2">
                <Button type="submit" className="flex-1">Create Stream</Button>
                <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* List */}
      <div className="space-y-4">
        {streams.map((stream) => (
          <Card key={stream.id}>
            <CardContent className="pt-6 space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <h3 className="font-semibold text-lg truncate">{stream.title}</h3>
                    {getStatusBadge(stream.status)}
                  </div>
                  {stream.description && <p className="text-sm text-muted-foreground mb-3">{stream.description}</p>}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                    {stream.scheduled_at && (
                      <div className="flex items-center gap-1"><Calendar className="h-4 w-4" />{format(new Date(stream.scheduled_at), "PPp")}</div>
                    )}
                    {stream.viewers_count > 0 && (
                      <div className="flex items-center gap-1"><Eye className="h-4 w-4" />{stream.viewers_count} viewers</div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap justify-end">
                  {stream.status === "scheduled" && (
                    <Button size="sm" onClick={() => handleGoLive(stream.id)}>Go Live</Button>
                  )}
                  {stream.status === "live" && (
                    <Button size="sm" variant="destructive" onClick={() => handleEndStream(stream.id)}>End Stream</Button>
                  )}
                  <Button size="sm" variant="outline" onClick={() => openEdit(stream)} className="gap-1">
                    <Pencil className="h-4 w-4" /> Edit
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setDeleting(stream)} aria-label="Delete">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {stream.replay_url && (
                <div className="rounded-lg overflow-hidden bg-black">
                  <SecureVideo src={stream.replay_url} controls playsInline
                    preload="metadata" className="w-full max-h-96" />
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {streams.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Radio className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No streams yet. Upload a podcast video or schedule a live stream!</p>
          </div>
        )}
      </div>

      {/* Edit dialog */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Edit</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="e-title">Title *</Label>
              <Input id="e-title" value={editForm.title} maxLength={200}
                onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="e-desc">Description</Label>
              <Textarea id="e-desc" rows={3} value={editForm.description} maxLength={2000}
                onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Replace Video (optional)</Label>
              <Input type="file" accept="video/*" onChange={(e) => setEditVideo(e.target.files?.[0] ?? null)} />
            </div>
            <div className="space-y-2">
              <Label>Replace Thumbnail (optional)</Label>
              <Input type="file" accept="image/*" onChange={(e) => setEditThumb(e.target.files?.[0] ?? null)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditing(null)} disabled={saving}>Cancel</Button>
            <Button onClick={saveEdit} disabled={saving}>{saving ? "Saving…" : "Save changes"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this stream?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes "{deleting?.title}" and its uploaded video & thumbnail. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={saving}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {saving ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default LiveStreamManager;
