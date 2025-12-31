import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Users,
  UserPlus,
  Search,
  Check,
  X,
  Copy,
  Share2,
  Mail,
  Loader2,
  UserMinus,
  Clock,
  Link as LinkIcon,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFriends, Friend } from '@/hooks/useFriends';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface FriendsPanelProps {
  onChallengeFriend?: (friendId: string) => void;
}

const FriendsPanel: React.FC<FriendsPanelProps> = ({ onChallengeFriend }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const {
    friends,
    pendingRequests,
    sentRequests,
    appInvites,
    isLoading,
    sendFriendRequest,
    acceptFriendRequest,
    declineFriendRequest,
    removeFriend,
    createAppInvite,
    searchUsers,
  } = useFriends();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [isCreatingInvite, setIsCreatingInvite] = useState(false);

  const handleSearch = async () => {
    if (searchQuery.length < 2) return;
    setIsSearching(true);
    const results = await searchUsers(searchQuery);
    setSearchResults(results);
    setIsSearching(false);
  };

  const handleCreateInvite = async () => {
    setIsCreatingInvite(true);
    const code = await createAppInvite(inviteEmail || undefined);
    if (code) {
      const inviteUrl = `${window.location.origin}/auth?invite=${code}`;
      await navigator.clipboard.writeText(inviteUrl);
      toast({
        title: 'Invite link copied!',
        description: 'Share it with your friend',
      });
    }
    setInviteEmail('');
    setIsCreatingInvite(false);
  };

  const copyInviteLink = async (code: string) => {
    const inviteUrl = `${window.location.origin}/auth?invite=${code}`;
    await navigator.clipboard.writeText(inviteUrl);
    toast({
      title: 'Link copied!',
      description: 'Share it with your friend',
    });
  };

  const shareInvite = async (code: string) => {
    const inviteUrl = `${window.location.origin}/auth?invite=${code}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join me on SportHub!',
          text: 'I invite you to join SportHub and play games with me!',
          url: inviteUrl,
        });
      } catch (err) {
        copyInviteLink(code);
      }
    } else {
      copyInviteLink(code);
    }
  };

  if (!user) {
    return (
      <Card className="bg-card/50 backdrop-blur border-border/50">
        <CardContent className="p-8 text-center">
          <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-xl font-bold mb-2">Sign In Required</h3>
          <p className="text-muted-foreground">
            Please sign in to add friends and send invites
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/50 backdrop-blur border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Friends & Invites
          {pendingRequests.length > 0 && (
            <Badge variant="destructive" className="ml-2">
              {pendingRequests.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="friends" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-4">
            <TabsTrigger value="friends" className="text-xs sm:text-sm">
              Friends ({friends.length})
            </TabsTrigger>
            <TabsTrigger value="requests" className="text-xs sm:text-sm relative">
              Requests
              {pendingRequests.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center">
                  {pendingRequests.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="add" className="text-xs sm:text-sm">
              Add
            </TabsTrigger>
            <TabsTrigger value="invite" className="text-xs sm:text-sm">
              Invite
            </TabsTrigger>
          </TabsList>

          {/* Friends List */}
          <TabsContent value="friends" className="space-y-3">
            {isLoading ? (
              <div className="text-center py-8">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
              </div>
            ) : friends.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No friends yet</p>
                <p className="text-sm">Add friends to play together!</p>
              </div>
            ) : (
              <AnimatePresence>
                {friends.map((friend) => (
                  <FriendCard
                    key={friend.id}
                    friend={friend}
                    onRemove={() => removeFriend(friend.id)}
                    onChallenge={onChallengeFriend ? () => onChallengeFriend(friend.profile.id) : undefined}
                  />
                ))}
              </AnimatePresence>
            )}
          </TabsContent>

          {/* Pending Requests */}
          <TabsContent value="requests" className="space-y-4">
            {pendingRequests.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2 text-muted-foreground">
                  Received Requests
                </h4>
                <div className="space-y-2">
                  {pendingRequests.map((request) => (
                    <RequestCard
                      key={request.id}
                      friend={request}
                      onAccept={() => acceptFriendRequest(request.id)}
                      onDecline={() => declineFriendRequest(request.id)}
                    />
                  ))}
                </div>
              </div>
            )}

            {sentRequests.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2 text-muted-foreground">
                  Sent Requests
                </h4>
                <div className="space-y-2">
                  {sentRequests.map((request) => (
                    <motion.div
                      key={request.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-border/50"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={request.profile.avatarUrl || undefined} />
                          <AvatarFallback>
                            {request.profile.username[0]?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{request.profile.username}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Pending
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => declineFriendRequest(request.id)}
                      >
                        Cancel
                      </Button>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {pendingRequests.length === 0 && sentRequests.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Mail className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No pending requests</p>
              </div>
            )}
          </TabsContent>

          {/* Add Friends */}
          <TabsContent value="add" className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Search by username..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button onClick={handleSearch} disabled={isSearching}>
                {isSearching ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
              </Button>
            </div>

            <div className="space-y-2">
              {searchResults.map((result) => (
                <motion.div
                  key={result.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-border/50"
                >
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={result.avatar_url || undefined} />
                      <AvatarFallback>
                        {result.username[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{result.username}</p>
                      {result.full_name && (
                        <p className="text-xs text-muted-foreground">
                          {result.full_name}
                        </p>
                      )}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => sendFriendRequest(result.id)}
                  >
                    <UserPlus className="w-4 h-4 mr-1" />
                    Add
                  </Button>
                </motion.div>
              ))}
            </div>

            {searchQuery && searchResults.length === 0 && !isSearching && (
              <div className="text-center py-6 text-muted-foreground">
                <p>No users found</p>
              </div>
            )}
          </TabsContent>

          {/* Invite Friends */}
          <TabsContent value="invite" className="space-y-4">
            <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Share2 className="w-4 h-4" />
                Invite a Friend to Join
              </h4>
              <p className="text-sm text-muted-foreground mb-3">
                Create an invite link to share with friends who don't have an account yet.
              </p>
              <div className="flex gap-2">
                <Input
                  placeholder="Friend's email (optional)"
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
                <Button onClick={handleCreateInvite} disabled={isCreatingInvite}>
                  {isCreatingInvite ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <LinkIcon className="w-4 h-4 mr-1" />
                      Create
                    </>
                  )}
                </Button>
              </div>
            </div>

            {appInvites.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2 text-muted-foreground">
                  Your Invites
                </h4>
                <div className="space-y-2">
                  {appInvites.map((invite) => (
                    <div
                      key={invite.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-border/50"
                    >
                      <div>
                        <p className="font-mono text-sm">{invite.inviteCode}</p>
                        <p className="text-xs text-muted-foreground">
                          {invite.inviteeEmail || 'No email'} •{' '}
                          <Badge variant={invite.status === 'used' ? 'default' : 'outline'} className="text-xs">
                            {invite.status}
                          </Badge>
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => copyInviteLink(invite.inviteCode)}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => shareInvite(invite.inviteCode)}
                        >
                          <Share2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

const FriendCard: React.FC<{
  friend: Friend;
  onRemove: () => void;
  onChallenge?: () => void;
}> = ({ friend, onRemove, onChallenge }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-border/50"
  >
    <div className="flex items-center gap-3">
      <Avatar>
        <AvatarImage src={friend.profile.avatarUrl || undefined} />
        <AvatarFallback>
          {friend.profile.username[0]?.toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div>
        <p className="font-medium">{friend.profile.username}</p>
        {friend.profile.fullName && (
          <p className="text-xs text-muted-foreground">{friend.profile.fullName}</p>
        )}
      </div>
    </div>
    <div className="flex gap-1">
      {onChallenge && (
        <Button size="sm" variant="outline" onClick={onChallenge}>
          Challenge
        </Button>
      )}
      <Button size="icon" variant="ghost" onClick={onRemove}>
        <UserMinus className="w-4 h-4 text-destructive" />
      </Button>
    </div>
  </motion.div>
);

const RequestCard: React.FC<{
  friend: Friend;
  onAccept: () => void;
  onDecline: () => void;
}> = ({ friend, onAccept, onDecline }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-border/50"
  >
    <div className="flex items-center gap-3">
      <Avatar>
        <AvatarImage src={friend.profile.avatarUrl || undefined} />
        <AvatarFallback>
          {friend.profile.username[0]?.toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div>
        <p className="font-medium">{friend.profile.username}</p>
        <p className="text-xs text-muted-foreground">wants to be your friend</p>
      </div>
    </div>
    <div className="flex gap-1">
      <Button size="icon" variant="default" onClick={onAccept}>
        <Check className="w-4 h-4" />
      </Button>
      <Button size="icon" variant="ghost" onClick={onDecline}>
        <X className="w-4 h-4" />
      </Button>
    </div>
  </motion.div>
);

export default FriendsPanel;
