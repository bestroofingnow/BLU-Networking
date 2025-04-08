import { useState } from "react";
import { DashboardLayout } from "@/layouts/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Search, Users, Filter } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function MembersPage() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [industryFilter, setIndustryFilter] = useState("");
  const [selectedMember, setSelectedMember] = useState(null);
  
  const { data: members, isLoading } = useQuery({
    queryKey: ["/api/members"],
  });
  
  const handleConnect = (memberId) => {
    toast({
      title: "Connection Request Sent",
      description: "Your connection request has been sent successfully.",
    });
  };
  
  // Filter members based on search and industry
  const filteredMembers = members
    ? members.filter(member => {
        // Filter by search query (name, company, title)
        if (searchQuery && !(
          member.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          member.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
          member.title.toLowerCase().includes(searchQuery.toLowerCase())
        )) {
          return false;
        }
        
        // Filter by industry
        if (industryFilter && member.industry !== industryFilter) {
          return false;
        }
        
        return true;
      })
    : [];
  
  const industries = members
    ? Array.from(new Set(members.map(member => member.industry))).filter(Boolean)
    : [];
  
  const getInitials = (name) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };
  
  return (
    <DashboardLayout title="Member Directory">
      <div className="mb-6">
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <CardTitle>BLOC Members Directory</CardTitle>
              
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
                  <Input 
                    placeholder="Search members..." 
                    className="pl-9 w-full sm:w-64"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                
                <Select
                  value={industryFilter}
                  onValueChange={setIndustryFilter}
                >
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="Filter by industry" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Industries</SelectItem>
                    {industries.map(industry => (
                      <SelectItem key={industry} value={industry}>
                        {industry}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array(6).fill(0).map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-5">
                      <div className="flex items-center space-x-4">
                        <div className="h-12 w-12 rounded-full bg-neutral-200"></div>
                        <div className="space-y-2 flex-1">
                          <div className="h-4 bg-neutral-200 rounded w-3/4"></div>
                          <div className="h-3 bg-neutral-200 rounded w-1/2"></div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredMembers.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredMembers.map(member => (
                  <MemberCard 
                    key={member.id}
                    member={member}
                    onConnect={() => handleConnect(member.id)}
                    onViewProfile={() => setSelectedMember(member)}
                  />
                ))}
              </div>
            ) : (
              <EmptyState 
                icon={<Users className="h-12 w-12 text-muted-foreground" />}
                title="No members found"
                description={searchQuery || industryFilter 
                  ? "Try adjusting your search or filters"
                  : "There are no members in the directory yet"
                }
              />
            )}
          </CardContent>
        </Card>
      </div>
      
      {selectedMember && (
        <MemberProfileDialog 
          member={selectedMember} 
          onClose={() => setSelectedMember(null)}
          onConnect={() => handleConnect(selectedMember.id)}
        />
      )}
    </DashboardLayout>
  );
}

function MemberCard({ member, onConnect, onViewProfile }) {
  const getInitials = (name) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };
  
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-center">
          <Avatar className="h-12 w-12">
            <AvatarImage src={member.profileImage} alt={member.fullName} />
            <AvatarFallback>{getInitials(member.fullName)}</AvatarFallback>
          </Avatar>
          
          <div className="ml-4 flex-1">
            <h3 className="font-medium text-neutral-800">{member.fullName}</h3>
            <p className="text-sm text-neutral-500">{member.title}, {member.company}</p>
          </div>
        </div>
        
        <div className="mt-4">
          {member.industry && (
            <Badge variant="outline" className="mr-2 mb-2">
              {member.industry}
            </Badge>
          )}
          {member.expertise && (
            <Badge variant="outline" className="mr-2 mb-2">
              {member.expertise}
            </Badge>
          )}
        </div>
        
        <div className="mt-4 flex items-center justify-between">
          <Button variant="outline" size="sm" onClick={onViewProfile}>
            View Profile
          </Button>
          
          <Button size="sm" onClick={onConnect}>
            Connect
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function MemberProfileDialog({ member, onClose, onConnect }) {
  const getInitials = (name) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };
  
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Member Profile</DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col sm:flex-row gap-6">
          <div className="flex flex-col items-center">
            <Avatar className="h-24 w-24 mb-3">
              <AvatarImage src={member.profileImage} alt={member.fullName} />
              <AvatarFallback>{getInitials(member.fullName)}</AvatarFallback>
            </Avatar>
            
            <Button className="w-full" onClick={onConnect}>
              Connect
            </Button>
            
            <Button variant="outline" className="w-full mt-2">
              Message
            </Button>
          </div>
          
          <div className="flex-1">
            <h2 className="text-xl font-semibold mb-1">{member.fullName}</h2>
            <p className="text-neutral-500 mb-4">{member.title}, {member.company}</p>
            
            {member.bio && (
              <div className="mb-4">
                <h3 className="text-sm font-medium text-neutral-700 mb-1">About</h3>
                <p className="text-sm text-neutral-600">{member.bio}</p>
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <h3 className="text-sm font-medium text-neutral-700 mb-1">Industry</h3>
                <p className="text-sm text-neutral-600">{member.industry || "Not specified"}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-neutral-700 mb-1">Expertise</h3>
                <p className="text-sm text-neutral-600">{member.expertise || "Not specified"}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-neutral-700 mb-1">Email</h3>
                <p className="text-sm text-neutral-600">{member.email}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-neutral-700 mb-1">Phone</h3>
                <p className="text-sm text-neutral-600">{member.phoneNumber || "Not provided"}</p>
              </div>
            </div>
            
            <div className="mt-4">
              <h3 className="text-sm font-medium text-neutral-700 mb-1">Member Since</h3>
              <p className="text-sm text-neutral-600">
                {new Date(member.joinedAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function EmptyState({ icon, title, description }) {
  return (
    <div className="text-center py-16 flex flex-col items-center">
      <div className="mb-4">{icon}</div>
      <h3 className="text-lg font-medium text-neutral-800 mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
