import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import Sidebar from "@/components/Sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { 
  Mail, Inbox, Send, Trash2, ArrowLeft, 
  Reply, Clock, CheckCheck, Video
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { format } from "date-fns";

interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  recruiting_video_id: string | null;
  subject: string;
  content: string;
  read: boolean;
  created_at: string;
  sender?: {
    username: string;
    full_name: string | null;
    avatar_url: string | null;
  };
  recipient?: {
    username: string;
    full_name: string | null;
    avatar_url: string | null;
  };
  recruiting_video?: {
    title: string;
  } | null;
}

const Messages = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("inbox");
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (user) {
      fetchMessages();
    }
  }, [user, activeTab]);

  const fetchMessages = async () => {
    if (!user) return;
    setLoading(true);

    try {
      let query = supabase
        .from("messages")
        .select(`
          *,
          sender:profiles!messages_sender_id_fkey(username, full_name, avatar_url),
          recipient:profiles!messages_recipient_id_fkey(username, full_name, avatar_url),
          recruiting_video:recruiting_videos(title)
        `)
        .order("created_at", { ascending: false });

      if (activeTab === "inbox") {
        query = query.eq("recipient_id", user.id);
      } else {
        query = query.eq("sender_id", user.id);
      }

      const { data, error } = await query;

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error("Error fetching messages:", error);
      toast.error("Failed to load messages");
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (messageId: string) => {
    try {
      await supabase
        .from("messages")
        .update({ read: true })
        .eq("id", messageId);
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };

  const handleOpenMessage = async (message: Message) => {
    setSelectedMessage(message);
    if (!message.read && message.recipient_id === user?.id) {
      await markAsRead(message.id);
      setMessages(msgs => 
        msgs.map(m => m.id === message.id ? { ...m, read: true } : m)
      );
    }
  };

  const handleDelete = async (messageId: string) => {
    if (!confirm("Are you sure you want to delete this message?")) return;

    try {
      const { error } = await supabase
        .from("messages")
        .delete()
        .eq("id", messageId);

      if (error) throw error;
      toast.success("Message deleted");
      setSelectedMessage(null);
      fetchMessages();
    } catch (error) {
      console.error("Error deleting message:", error);
      toast.error("Failed to delete message");
    }
  };

  const handleReply = async () => {
    if (!user || !selectedMessage || !replyContent.trim()) return;

    setSending(true);
    try {
      const recipientId = selectedMessage.sender_id === user.id 
        ? selectedMessage.recipient_id 
        : selectedMessage.sender_id;

      const { error } = await supabase.from("messages").insert({
        sender_id: user.id,
        recipient_id: recipientId,
        recruiting_video_id: selectedMessage.recruiting_video_id,
        subject: `Re: ${selectedMessage.subject.replace(/^Re: /, "")}`,
        content: replyContent.trim(),
      });

      if (error) throw error;
      toast.success("Reply sent!");
      setReplyContent("");
      setShowReplyModal(false);
      fetchMessages();
    } catch (error) {
      console.error("Error sending reply:", error);
      toast.error("Failed to send reply");
    } finally {
      setSending(false);
    }
  };

  const unreadCount = messages.filter(m => !m.read && m.recipient_id === user?.id).length;

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <Sidebar />
        <main className="pt-20 pb-20 lg:pb-6 lg:pl-64">
          <div className="px-4 lg:px-6 py-6">
            <Card className="glass-effect">
              <CardContent className="p-12 text-center">
                <Mail className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Sign In Required</h3>
                <p className="text-muted-foreground mb-4">
                  Please sign in to view your messages.
                </p>
                <Button onClick={() => window.location.href = "/auth"}>
                  Sign In
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <Sidebar />
      
      <main className="pt-20 pb-20 lg:pb-6 lg:pl-64">
        <div className="px-4 lg:px-6 py-6">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-display font-bold flex items-center gap-2">
              <Mail className="w-8 h-8 text-primary" />
              Messages
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {unreadCount} new
                </Badge>
              )}
            </h1>
            <p className="text-muted-foreground mt-1">
              Connect with recruiters and athletes
            </p>
          </div>

          {selectedMessage ? (
            /* Message Detail View */
            <Card className="glass-effect">
              <CardContent className="p-6">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedMessage(null)}
                  className="mb-4"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to messages
                </Button>

                <div className="space-y-4">
                  {/* Message header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage 
                          src={
                            (selectedMessage.sender_id === user.id 
                              ? selectedMessage.recipient?.avatar_url 
                              : selectedMessage.sender?.avatar_url) || undefined
                          } 
                        />
                        <AvatarFallback>
                          {(selectedMessage.sender_id === user.id 
                            ? selectedMessage.recipient?.username 
                            : selectedMessage.sender?.username)?.[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">
                          {selectedMessage.sender_id === user.id ? "To: " : "From: "}
                          {selectedMessage.sender_id === user.id 
                            ? selectedMessage.recipient?.full_name || selectedMessage.recipient?.username
                            : selectedMessage.sender?.full_name || selectedMessage.sender?.username}
                        </p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {format(new Date(selectedMessage.created_at), "PPp")}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowReplyModal(true)}
                      >
                        <Reply className="w-4 h-4 mr-2" />
                        Reply
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(selectedMessage.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Subject */}
                  <div>
                    <h2 className="text-xl font-semibold">{selectedMessage.subject}</h2>
                    {selectedMessage.recruiting_video && (
                      <div className="flex items-center gap-1 text-sm text-primary mt-1">
                        <Video className="w-4 h-4" />
                        Related to: {selectedMessage.recruiting_video.title}
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-4 rounded-lg bg-muted/30 whitespace-pre-wrap">
                    {selectedMessage.content}
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            /* Messages List View */
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="inbox" className="flex items-center gap-2">
                  <Inbox className="w-4 h-4" />
                  Inbox
                  {unreadCount > 0 && (
                    <Badge variant="secondary" className="ml-1">
                      {unreadCount}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="sent" className="flex items-center gap-2">
                  <Send className="w-4 h-4" />
                  Sent
                </TabsTrigger>
              </TabsList>

              <TabsContent value="inbox" className="space-y-2">
                {loading ? (
                  <Card className="glass-effect animate-pulse">
                    <CardContent className="p-4 space-y-2">
                      <div className="h-4 bg-muted rounded w-3/4" />
                      <div className="h-3 bg-muted rounded w-1/2" />
                    </CardContent>
                  </Card>
                ) : messages.length === 0 ? (
                  <Card className="glass-effect">
                    <CardContent className="p-12 text-center">
                      <Inbox className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold mb-2">No Messages</h3>
                      <p className="text-muted-foreground">
                        Your inbox is empty
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  messages.map((message) => (
                    <Card
                      key={message.id}
                      className={`glass-effect cursor-pointer hover:shadow-glow transition-all ${
                        !message.read ? "border-primary/50 bg-primary/5" : ""
                      }`}
                      onClick={() => handleOpenMessage(message)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={message.sender?.avatar_url || undefined} />
                            <AvatarFallback>
                              {message.sender?.username[0].toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-medium truncate">
                                {message.sender?.full_name || message.sender?.username}
                              </p>
                              {!message.read && (
                                <Badge variant="default" className="text-xs">New</Badge>
                              )}
                            </div>
                            <p className="text-sm font-medium truncate">
                              {message.subject}
                            </p>
                            <p className="text-sm text-muted-foreground truncate">
                              {message.content}
                            </p>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {format(new Date(message.created_at), "MMM d")}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>

              <TabsContent value="sent" className="space-y-2">
                {loading ? (
                  <Card className="glass-effect animate-pulse">
                    <CardContent className="p-4 space-y-2">
                      <div className="h-4 bg-muted rounded w-3/4" />
                      <div className="h-3 bg-muted rounded w-1/2" />
                    </CardContent>
                  </Card>
                ) : messages.length === 0 ? (
                  <Card className="glass-effect">
                    <CardContent className="p-12 text-center">
                      <Send className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold mb-2">No Sent Messages</h3>
                      <p className="text-muted-foreground">
                        You haven't sent any messages yet
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  messages.map((message) => (
                    <Card
                      key={message.id}
                      className="glass-effect cursor-pointer hover:shadow-glow transition-all"
                      onClick={() => handleOpenMessage(message)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={message.recipient?.avatar_url || undefined} />
                            <AvatarFallback>
                              {message.recipient?.username[0].toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">
                              To: {message.recipient?.full_name || message.recipient?.username}
                            </p>
                            <p className="text-sm font-medium truncate">
                              {message.subject}
                            </p>
                            <p className="text-sm text-muted-foreground truncate">
                              {message.content}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <CheckCheck className="w-4 h-4" />
                            {format(new Date(message.created_at), "MMM d")}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>
            </Tabs>
          )}
        </div>
      </main>

      {/* Reply Modal */}
      <Dialog open={showReplyModal} onOpenChange={setShowReplyModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Reply className="w-5 h-5" />
              Reply to Message
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="Type your reply..."
              rows={6}
              maxLength={2000}
            />
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">
                {replyContent.length}/2000
              </span>
              <Button
                onClick={handleReply}
                disabled={sending || !replyContent.trim()}
              >
                {sending ? "Sending..." : "Send Reply"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Messages;
