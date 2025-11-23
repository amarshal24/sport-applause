import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Radio, Eye, Trash2, Calendar } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

const LiveStreamManager = () => {
  const { user } = useAuth();
  const [streams, setStreams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    scheduled_at: "",
  });

  useEffect(() => {
    if (user) {
      fetchStreams();
    }
  }, [user]);

  const fetchStreams = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('live_streams')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching streams:', error);
    } else {
      setStreams(data || []);
    }
    setLoading(false);
  };

  const handleCreateStream = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !formData.title) {
      toast.error("Please fill in all required fields");
      return;
    }

    const { error } = await supabase
      .from('live_streams')
      .insert({
        user_id: user.id,
        title: formData.title,
        description: formData.description,
        scheduled_at: formData.scheduled_at || null,
        status: 'scheduled',
      });

    if (error) {
      toast.error("Failed to create stream");
      console.error(error);
    } else {
      toast.success("Stream scheduled successfully!");
      setFormData({ title: "", description: "", scheduled_at: "" });
      setShowCreateForm(false);
      fetchStreams();
    }
  };

  const handleGoLive = async (streamId: string) => {
    const { error } = await supabase
      .from('live_streams')
      .update({
        status: 'live',
        started_at: new Date().toISOString(),
      })
      .eq('id', streamId);

    if (error) {
      toast.error("Failed to start stream");
    } else {
      toast.success("You're now live!");
      fetchStreams();
    }
  };

  const handleEndStream = async (streamId: string) => {
    const { error } = await supabase
      .from('live_streams')
      .update({
        status: 'ended',
        ended_at: new Date().toISOString(),
      })
      .eq('id', streamId);

    if (error) {
      toast.error("Failed to end stream");
    } else {
      toast.success("Stream ended");
      fetchStreams();
    }
  };

  const handleDeleteStream = async (streamId: string) => {
    const { error } = await supabase
      .from('live_streams')
      .delete()
      .eq('id', streamId);

    if (error) {
      toast.error("Failed to delete stream");
    } else {
      toast.success("Stream deleted");
      fetchStreams();
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: any = {
      scheduled: "secondary",
      live: "destructive",
      ended: "outline",
    };
    return (
      <Badge variant={variants[status] || "secondary"}>
        {status === 'live' && <Radio className="h-3 w-3 mr-1 animate-pulse" />}
        {status.toUpperCase()}
      </Badge>
    );
  };

  if (loading) {
    return <div className="text-center py-8">Loading streams...</div>;
  }

  return (
    <div className="space-y-6">
      {!showCreateForm ? (
        <Button onClick={() => setShowCreateForm(true)} className="w-full">
          <Radio className="h-4 w-4 mr-2" />
          Schedule New Stream
        </Button>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Schedule Live Stream</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateStream} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="stream-title">Title *</Label>
                <Input
                  id="stream-title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter stream title"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="stream-description">Description</Label>
                <Textarea
                  id="stream-description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe your stream..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="stream-scheduled">Schedule Date & Time (Optional)</Label>
                <Input
                  id="stream-scheduled"
                  type="datetime-local"
                  value={formData.scheduled_at}
                  onChange={(e) => setFormData({ ...formData, scheduled_at: e.target.value })}
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="flex-1">Create Stream</Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowCreateForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {streams.map((stream) => (
          <Card key={stream.id}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-lg">{stream.title}</h3>
                    {getStatusBadge(stream.status)}
                  </div>
                  
                  {stream.description && (
                    <p className="text-sm text-muted-foreground mb-3">{stream.description}</p>
                  )}
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    {stream.scheduled_at && (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {format(new Date(stream.scheduled_at), 'PPp')}
                      </div>
                    )}
                    {stream.viewers_count > 0 && (
                      <div className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        {stream.viewers_count} viewers
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  {stream.status === 'scheduled' && (
                    <Button 
                      size="sm"
                      onClick={() => handleGoLive(stream.id)}
                    >
                      Go Live
                    </Button>
                  )}
                  
                  {stream.status === 'live' && (
                    <Button 
                      size="sm"
                      variant="destructive"
                      onClick={() => handleEndStream(stream.id)}
                    >
                      End Stream
                    </Button>
                  )}
                  
                  {stream.status === 'ended' && (
                    <Button 
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteStream(stream.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {streams.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Radio className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No streams yet. Schedule your first live stream!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveStreamManager;
