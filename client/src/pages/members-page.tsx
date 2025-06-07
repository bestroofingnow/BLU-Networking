import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/layouts/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Search, MapPin, Building, Mail, Phone, MessageCircle, Calendar, Users, Crown, Shield, User as UserIcon } from "lucide-react";
import { User, Chapter } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function MembersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMember, setSelectedMember] = useState<User | null>(null);
  const [messageDialogOpen, setMessageDialogOpen] = useState(false);
  const [messageContent, setMessageContent] = useState({ subject: "", message: "" });
  
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: members = [], isLoading } = useQuery<User[]>({
    queryKey: ["/api/members"],
  });

  const { data: chapters = [] } = useQuery<Chapter[]>({
    queryKey: ["/api/chapters"],
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (data: { toUserId: number; subject: string; message: string }) => {
      const res = await apiRequest("POST", "/api/messages", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Message sent",
        description: "Your message has been sent successfully.",
      });
      setMessageDialogOpen(false);
      setMessageContent({ subject: "", message: "" });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to send message",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const filteredMembers = members.filter(member =>
    member.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.industry?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <DashboardLayout title="Members">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  const handleSendMessage = (member: User) => {
    setSelectedMember(member);
    setMessageDialogOpen(true);
  };

  const handleViewProfile = (member: User) => {
    setSelectedMember(member);
  };

  const handleSubmitMessage = () => {
    if (!selectedMember || !messageContent.subject.trim() || !messageContent.message.trim()) {
      toast({
        title: "Missing information",
        description: "Please fill in both subject and message.",
        variant: "destructive",
      });
      return;
    }

    sendMessageMutation.mutate({
      toUserId: selectedMember.id,
      subject: messageContent.subject,
      message: messageContent.message,
    });
  };

  const getUserLevelIcon = (userLevel: string) => {
    switch (userLevel) {
      case "executive_board":
        return <Crown className="h-4 w-4 text-yellow-600" />;
      case "board_member":
        return <Shield className="h-4 w-4 text-blue-600" />;
      default:
        return <UserIcon className="h-4 w-4 text-gray-600" />;
    }
  };

  const getUserLevelLabel = (userLevel: string) => {
    switch (userLevel) {
      case "executive_board":
        return "Executive Board";
      case "board_member":
        return "Board Member";
      default:
        return "Member";
    }
  };

  if (members.length === 0) {
    return (
      <DashboardLayout title="Members">
        <EmptyState 
          icon={Users}
          title="No members found"
          description="There are currently no members in your network."
        />
      </DashboardLayout>
    );
  }

  // Group members by chapter for better organization
  const membersByChapter = chapters.reduce((acc, chapter) => {
    acc[chapter.id] = {
      chapter,
      members: filteredMembers.filter(member => member.chapterId === chapter.id)
    };
    return acc;
  }, {} as Record<number, { chapter: Chapter; members: User[] }>);

  return (
    <DashboardLayout title="Members">
      <div className="space-y-6">
        {/* Search and Filters */}
        <div className="flex items-center space-x-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search members by name, company, or industry..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Display user's permission level */}
        {user && (
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            {getUserLevelIcon(user.userLevel)}
            <span>Your access level: {getUserLevelLabel(user.userLevel)}</span>
            {user.userLevel === "member" && (
              <span className="text-xs">• You can see and communicate with members in your chapter</span>
            )}
          </div>
        )}

        {/* Members by Chapter */}
        {Object.entries(membersByChapter).map(([chapterId, { chapter, members: chapterMembers }]) => {
          if (chapterMembers.length === 0) return null;
          
          return (
            <div key={chapterId} className="space-y-4">
              <div className="flex items-center space-x-2">
                <MapPin className="h-5 w-5 text-muted-foreground" />
                <h2 className="text-lg font-semibold">{chapter.name}</h2>
                <Badge variant="outline">{chapter.location}</Badge>
                <span className="text-sm text-muted-foreground">({chapterMembers.length} members)</span>
              </div>
              
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {chapterMembers.map((member) => (
                  <MemberCard
                    key={member.id}
                    member={member}
                    onSendMessage={handleSendMessage}
                    onViewProfile={handleViewProfile}
                    currentUser={user}
                  />
                ))}
              </div>
            </div>
          );
        })}

        {/* Member Profile Modal */}
        {selectedMember && !messageDialogOpen && (
          <MemberProfileDialog
            member={selectedMember}
            onClose={() => setSelectedMember(null)}
            onSendMessage={handleSendMessage}
            currentUser={user}
          />
        )}

        {/* Message Dialog */}
        {messageDialogOpen && selectedMember && (
          <Dialog open={messageDialogOpen} onOpenChange={setMessageDialogOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Send Message to {selectedMember.fullName}</DialogTitle>
                <DialogDescription>
                  Send a message to connect and network with this member.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    placeholder="Enter message subject"
                    value={messageContent.subject}
                    onChange={(e) => setMessageContent(prev => ({ ...prev, subject: e.target.value }))}
                  />
                </div>
                
                <div>
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    placeholder="Write your message here..."
                    value={messageContent.message}
                    onChange={(e) => setMessageContent(prev => ({ ...prev, message: e.target.value }))}
                    rows={4}
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setMessageDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={handleSubmitMessage}
                    disabled={sendMessageMutation.isPending}
                  >
                    {sendMessageMutation.isPending ? "Sending..." : "Send Message"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </DashboardLayout>
  );
}

function MemberCard({ member, onSendMessage, onViewProfile, currentUser }: {
  member: User;
  onSendMessage: (member: User) => void;
  onViewProfile: (member: User) => void;
  currentUser: User | null;
}) {
  const initials = member.fullName
    .split(' ')
    .map(name => name[0])
    .join('')
    .toUpperCase();

  const getUserLevelIcon = (userLevel: string) => {
    switch (userLevel) {
      case "executive_board":
        return <Crown className="h-4 w-4 text-yellow-600" />;
      case "board_member":
        return <Shield className="h-4 w-4 text-blue-600" />;
      default:
        return <UserIcon className="h-4 w-4 text-gray-600" />;
    }
  };

  const getUserLevelBadge = (userLevel: string) => {
    switch (userLevel) {
      case "executive_board":
        return <Badge variant="default" className="bg-yellow-100 text-yellow-800 border-yellow-300">Executive</Badge>;
      case "board_member":
        return <Badge variant="default" className="bg-blue-100 text-blue-800 border-blue-300">Board</Badge>;
      default:
        return null;
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="pb-4">
        <div className="flex items-start space-x-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={member.profileImage || undefined} />
            <AvatarFallback className="text-lg font-semibold bg-primary/10 text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <CardTitle className="text-lg font-semibold truncate">
                {member.fullName}
              </CardTitle>
              {getUserLevelIcon(member.userLevel)}
            </div>
            <CardDescription className="text-sm text-muted-foreground">
              {member.title} at {member.company}
            </CardDescription>
            <div className="flex items-center space-x-2 mt-2">
              {member.industry && (
                <Badge variant="secondary" className="text-xs">
                  {member.industry}
                </Badge>
              )}
              {getUserLevelBadge(member.userLevel)}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2 text-sm text-muted-foreground">
          {member.expertise && (
            <div className="flex items-center space-x-2">
              <span className="font-medium">Expertise:</span>
              <span className="truncate">{member.expertise}</span>
            </div>
          )}
        </div>
        <div className="flex space-x-2 mt-4">
          <Button
            size="sm"
            variant="outline"
            className="flex-1"
            onClick={() => onViewProfile(member)}
          >
            View Profile
          </Button>
          {currentUser && member.id !== currentUser.id && (
            <Button
              size="sm"
              className="flex-1"
              onClick={() => onSendMessage(member)}
            >
              <MessageCircle className="h-4 w-4 mr-1" />
              Message
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function MemberProfileDialog({ member, onClose, onSendMessage, currentUser }: {
  member: User;
  onClose: () => void;
  onSendMessage: (member: User) => void;
  currentUser: User | null;
}) {
  const initials = member.fullName
    .split(' ')
    .map(name => name[0])
    .join('')
    .toUpperCase();

  const getUserLevelIcon = (userLevel: string) => {
    switch (userLevel) {
      case "executive_board":
        return <Crown className="h-4 w-4 text-yellow-600" />;
      case "board_member":
        return <Shield className="h-4 w-4 text-blue-600" />;
      default:
        return <UserIcon className="h-4 w-4 text-gray-600" />;
    }
  };

  const getUserLevelLabel = (userLevel: string) => {
    switch (userLevel) {
      case "executive_board":
        return "Executive Board Member";
      case "board_member":
        return "Board Member";
      default:
        return "Member";
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center space-x-4 mb-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={member.profileImage || undefined} />
              <AvatarFallback className="text-2xl font-semibold bg-primary/10 text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center space-x-2">
                <DialogTitle className="text-xl">{member.fullName}</DialogTitle>
                {getUserLevelIcon(member.userLevel)}
              </div>
              <DialogDescription className="text-base">
                {member.title} at {member.company}
              </DialogDescription>
              <div className="flex items-center space-x-1 mt-1">
                <span className="text-sm text-muted-foreground">{getUserLevelLabel(member.userLevel)}</span>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {member.bio && (
            <div>
              <h4 className="font-semibold mb-2">About</h4>
              <p className="text-sm text-muted-foreground">{member.bio}</p>
            </div>
          )}

          <div className="space-y-3">
            {member.industry && (
              <div className="flex items-center space-x-2">
                <Building className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{member.industry}</span>
              </div>
            )}
            {member.expertise && (
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium">Expertise:</span>
                <span className="text-sm text-muted-foreground">{member.expertise}</span>
              </div>
            )}
            {member.email && (
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{member.email}</span>
              </div>
            )}
            {member.phoneNumber && (
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{member.phoneNumber}</span>
              </div>
            )}
          </div>

          <div className="flex space-x-3 pt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={onClose}
            >
              Close
            </Button>
            {currentUser && member.id !== currentUser.id && (
              <Button
                className="flex-1"
                onClick={() => {
                  onSendMessage(member);
                  onClose();
                }}
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Send Message
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function EmptyState({ icon: Icon, title, description }: {
  icon: any;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="rounded-full bg-muted p-3 mb-4">
        <Icon className="h-6 w-6 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground max-w-sm">{description}</p>
    </div>
  );
}