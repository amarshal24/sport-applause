import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  MessageCircle,
  Send,
  ArrowLeft,
  Loader2,
  User,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useChat, ChatConversation } from '@/hooks/useChat';
import { useAuth } from '@/hooks/useAuth';
import { useFriends } from '@/hooks/useFriends';
import { formatDistanceToNow } from 'date-fns';

interface FriendChatProps {
  initialRecipientId?: string;
  onClose?: () => void;
}

const FriendChat: React.FC<FriendChatProps> = ({ initialRecipientId, onClose }) => {
  const { user } = useAuth();
  const { friends } = useFriends();
  const [selectedRecipient, setSelectedRecipient] = useState<string | null>(initialRecipientId || null);
  const [recipientProfile, setRecipientProfile] = useState<{ username: string; avatarUrl: string | null } | null>(null);
  
  const { 
    messages, 
    conversations, 
    isLoading, 
    sendMessage, 
    getTotalUnread 
  } = useChat(selectedRecipient || undefined);
  
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Get recipient profile from friends or conversations
  useEffect(() => {
    if (!selectedRecipient) {
      setRecipientProfile(null);
      return;
    }

    const friend = friends.find(f => f.profile.id === selectedRecipient);
    if (friend) {
      setRecipientProfile({
        username: friend.profile.username,
        avatarUrl: friend.profile.avatarUrl
      });
      return;
    }

    const conv = conversations.find(c => c.oderId === selectedRecipient);
    if (conv) {
      setRecipientProfile({
        username: conv.odername,
        avatarUrl: conv.oderAvatar
      });
    }
  }, [selectedRecipient, friends, conversations]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when selecting a conversation
  useEffect(() => {
    if (selectedRecipient) {
      inputRef.current?.focus();
    }
  }, [selectedRecipient]);

  const handleSend = async () => {
    if (!newMessage.trim() || isSending) return;
    
    setIsSending(true);
    const success = await sendMessage(newMessage);
    if (success) {
      setNewMessage('');
    }
    setIsSending(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!user) {
    return (
      <Card className="bg-card/50 backdrop-blur border-border/50">
        <CardContent className="p-8 text-center">
          <MessageCircle className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-xl font-bold mb-2">Sign In Required</h3>
          <p className="text-muted-foreground">
            Please sign in to chat with friends
          </p>
        </CardContent>
      </Card>
    );
  }

  // Show conversation view
  if (selectedRecipient && recipientProfile) {
    return (
      <Card className="bg-card/50 backdrop-blur border-border/50 h-[500px] flex flex-col">
        {/* Chat Header */}
        <CardHeader className="pb-3 border-b border-border/50">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSelectedRecipient(null)}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <Avatar>
              <AvatarImage src={recipientProfile.avatarUrl || undefined} />
              <AvatarFallback>
                {recipientProfile.username[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{recipientProfile.username}</p>
              <p className="text-xs text-muted-foreground">Online</p>
            </div>
          </div>
        </CardHeader>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <MessageCircle className="w-12 h-12 mb-3 opacity-50" />
              <p>No messages yet</p>
              <p className="text-sm">Start the conversation!</p>
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence initial={false}>
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${message.isMine ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[75%] px-4 py-2 rounded-2xl ${
                        message.isMine
                          ? 'bg-primary text-primary-foreground rounded-br-md'
                          : 'bg-muted rounded-bl-md'
                      }`}
                    >
                      <p className="text-sm break-words">{message.content}</p>
                      <p className={`text-xs mt-1 ${
                        message.isMine ? 'text-primary-foreground/70' : 'text-muted-foreground'
                      }`}>
                        {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </div>
          )}
        </ScrollArea>

        {/* Input */}
        <div className="p-4 border-t border-border/50">
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              disabled={isSending}
              className="flex-1"
            />
            <Button
              onClick={handleSend}
              disabled={!newMessage.trim() || isSending}
              size="icon"
            >
              {isSending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  // Show conversations list
  return (
    <Card className="bg-card/50 backdrop-blur border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            Messages
          </div>
          {getTotalUnread() > 0 && (
            <Badge variant="destructive">{getTotalUnread()}</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Friends to message */}
        {friends.length > 0 && (
          <div className="mb-4">
            <p className="text-sm text-muted-foreground mb-2">Friends</p>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {friends.map((friend) => (
                <button
                  key={friend.id}
                  onClick={() => setSelectedRecipient(friend.profile.id)}
                  className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-muted/50 transition-colors min-w-[64px]"
                >
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={friend.profile.avatarUrl || undefined} />
                    <AvatarFallback>
                      {friend.profile.username[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs truncate max-w-[60px]">
                    {friend.profile.username}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Recent conversations */}
        <div>
          <p className="text-sm text-muted-foreground mb-2">Recent Chats</p>
          {conversations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No conversations yet</p>
              <p className="text-sm">Message a friend to start chatting!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {conversations.map((conv) => (
                <motion.button
                  key={conv.oderId}
                  onClick={() => setSelectedRecipient(conv.oderId)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors text-left"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <div className="relative">
                    <Avatar>
                      <AvatarImage src={conv.oderAvatar || undefined} />
                      <AvatarFallback>
                        {conv.odername[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {conv.unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center">
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{conv.odername}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(conv.lastMessageTime), { addSuffix: true })}
                      </p>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {conv.lastMessage}
                    </p>
                  </div>
                </motion.button>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default FriendChat;
