import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/layouts/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Plus, Edit, Trash2, FileText, Users, Crown, Shield, Clock } from "lucide-react";
import { BoardMeetingMinutes, Chapter } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

export default function BoardMinutesPage() {
  const [selectedMinute, setSelectedMinute] = useState<BoardMeetingMinutes | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: boardMinutes = [], isLoading } = useQuery<BoardMeetingMinutes[]>({
    queryKey: ["/api/board-minutes"],
  });

  const { data: chapters = [] } = useQuery<Chapter[]>({
    queryKey: ["/api/chapters"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/board-minutes", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Meeting minutes created",
        description: "Board meeting minutes have been successfully created.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/board-minutes"] });
      setCreateDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create meeting minutes",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const res = await apiRequest("PATCH", `/api/board-minutes/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Meeting minutes updated",
        description: "Board meeting minutes have been successfully updated.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/board-minutes"] });
      setEditDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update meeting minutes",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/board-minutes/${id}`);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Meeting minutes deleted",
        description: "Board meeting minutes have been successfully deleted.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/board-minutes"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete meeting minutes",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getUserLevelIcon = (userLevel: string) => {
    switch (userLevel) {
      case "executive_board":
        return <Crown className="h-4 w-4 text-yellow-600" />;
      case "board_member":
        return <Shield className="h-4 w-4 text-blue-600" />;
      default:
        return null;
    }
  };

  const canCreateMinutes = user && (user.userLevel === "board_member" || user.userLevel === "executive_board");
  const canEditMinutes = (minute: BoardMeetingMinutes) => {
    if (!user) return false;
    if (user.userLevel === "executive_board") return true;
    return user.userLevel === "board_member" && user.id === minute.createdById;
  };

  const canDeleteMinutes = (minute: BoardMeetingMinutes) => {
    if (!user) return false;
    if (user.userLevel === "executive_board") return true;
    return user.id === minute.createdById;
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Board Meeting Minutes">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!user || (user.userLevel !== "board_member" && user.userLevel !== "executive_board")) {
    return (
      <DashboardLayout title="Board Meeting Minutes">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="rounded-full bg-muted p-3 mb-4">
            <Shield className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Access Restricted</h3>
          <p className="text-muted-foreground max-w-sm">
            Board meeting minutes are only accessible to board members and executive board members.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Board Meeting Minutes">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {getUserLevelIcon(user.userLevel)}
            <h1 className="text-2xl font-bold">Board Meeting Minutes</h1>
            <Badge variant="outline" className="text-xs">
              {user.userLevel === "executive_board" ? "Executive Access" : "Board Access"}
            </Badge>
          </div>
          {canCreateMinutes && (
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Minutes
                </Button>
              </DialogTrigger>
              <CreateMinutesDialog 
                onClose={() => setCreateDialogOpen(false)}
                onSubmit={(data) => createMutation.mutate(data)}
                isLoading={createMutation.isPending}
                chapters={chapters}
                userChapterId={user.chapterId}
              />
            </Dialog>
          )}
        </div>

        {/* Minutes List */}
        {boardMinutes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-muted p-3 mb-4">
              <FileText className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No Meeting Minutes</h3>
            <p className="text-muted-foreground max-w-sm mb-4">
              No board meeting minutes have been created yet.
            </p>
            {canCreateMinutes && (
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Minutes
              </Button>
            )}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {boardMinutes.map((minute) => (
              <MinuteCard
                key={minute.id}
                minute={minute}
                chapters={chapters}
                onView={() => {
                  setSelectedMinute(minute);
                  setViewDialogOpen(true);
                }}
                onEdit={canEditMinutes(minute) ? () => {
                  setSelectedMinute(minute);
                  setEditDialogOpen(true);
                } : undefined}
                onDelete={canDeleteMinutes(minute) ? () => deleteMutation.mutate(minute.id) : undefined}
              />
            ))}
          </div>
        )}

        {/* View Dialog */}
        {selectedMinute && (
          <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
            <ViewMinutesDialog 
              minute={selectedMinute}
              chapters={chapters}
              onClose={() => setViewDialogOpen(false)}
            />
          </Dialog>
        )}

        {/* Edit Dialog */}
        {selectedMinute && (
          <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
            <EditMinutesDialog 
              minute={selectedMinute}
              chapters={chapters}
              onClose={() => setEditDialogOpen(false)}
              onSubmit={(data) => updateMutation.mutate({ id: selectedMinute.id, data })}
              isLoading={updateMutation.isPending}
            />
          </Dialog>
        )}
      </div>
    </DashboardLayout>
  );
}

function MinuteCard({ minute, chapters, onView, onEdit, onDelete }: {
  minute: BoardMeetingMinutes;
  chapters: Chapter[];
  onView: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  const chapter = chapters.find(c => c.id === minute.chapterId);
  
  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg font-semibold truncate">
              {minute.title}
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              {format(new Date(minute.meetingDate), 'MMMM d, yyyy')}
            </CardDescription>
            {chapter && (
              <Badge variant="outline" className="mt-2 text-xs">
                {chapter.name}
              </Badge>
            )}
          </div>
          <div className="flex items-center space-x-1 ml-2">
            {minute.isPublished && (
              <Badge variant="default" className="text-xs bg-green-100 text-green-800">
                Published
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2 text-sm text-muted-foreground mb-4">
          <div className="flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <span>{minute.attendees?.length || 0} attendees</span>
          </div>
          {minute.nextMeetingDate && (
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4" />
              <span>Next: {format(new Date(minute.nextMeetingDate), 'MMM d, yyyy')}</span>
            </div>
          )}
        </div>
        
        <div className="flex space-x-2">
          <Button size="sm" variant="outline" className="flex-1" onClick={onView}>
            View
          </Button>
          {onEdit && (
            <Button size="sm" variant="outline" onClick={onEdit}>
              <Edit className="h-4 w-4" />
            </Button>
          )}
          {onDelete && (
            <Button size="sm" variant="outline" onClick={onDelete}>
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function CreateMinutesDialog({ onClose, onSubmit, isLoading, chapters, userChapterId }: {
  onClose: () => void;
  onSubmit: (data: any) => void;
  isLoading: boolean;
  chapters: Chapter[];
  userChapterId?: number;
}) {
  const [formData, setFormData] = useState({
    title: "",
    meetingDate: "",
    attendees: "",
    agenda: "",
    minutes: "",
    actionItems: "",
    nextMeetingDate: "",
    isPublished: false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    onSubmit({
      ...formData,
      attendees: formData.attendees.split('\n').filter(a => a.trim()),
      actionItems: formData.actionItems ? formData.actionItems.split('\n').filter(a => a.trim()) : [],
      nextMeetingDate: formData.nextMeetingDate || null,
    });
  };

  return (
    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Create Board Meeting Minutes</DialogTitle>
        <DialogDescription>
          Create new board meeting minutes for your chapter.
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="title">Meeting Title</Label>
          <Input
            id="title"
            placeholder="e.g., Monthly Board Meeting - January 2025"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            required
          />
        </div>

        <div>
          <Label htmlFor="meetingDate">Meeting Date</Label>
          <Input
            id="meetingDate"
            type="date"
            value={formData.meetingDate}
            onChange={(e) => setFormData(prev => ({ ...prev, meetingDate: e.target.value }))}
            required
          />
        </div>

        <div>
          <Label htmlFor="attendees">Attendees (one per line)</Label>
          <Textarea
            id="attendees"
            placeholder="John Doe&#10;Jane Smith&#10;Bob Johnson"
            value={formData.attendees}
            onChange={(e) => setFormData(prev => ({ ...prev, attendees: e.target.value }))}
            rows={4}
            required
          />
        </div>

        <div>
          <Label htmlFor="agenda">Agenda (optional)</Label>
          <Textarea
            id="agenda"
            placeholder="Meeting agenda items..."
            value={formData.agenda}
            onChange={(e) => setFormData(prev => ({ ...prev, agenda: e.target.value }))}
            rows={3}
          />
        </div>

        <div>
          <Label htmlFor="minutes">Meeting Minutes</Label>
          <Textarea
            id="minutes"
            placeholder="Detailed meeting minutes..."
            value={formData.minutes}
            onChange={(e) => setFormData(prev => ({ ...prev, minutes: e.target.value }))}
            rows={6}
            required
          />
        </div>

        <div>
          <Label htmlFor="actionItems">Action Items (one per line, optional)</Label>
          <Textarea
            id="actionItems"
            placeholder="Follow up with vendors&#10;Schedule next meeting&#10;Review budget"
            value={formData.actionItems}
            onChange={(e) => setFormData(prev => ({ ...prev, actionItems: e.target.value }))}
            rows={3}
          />
        </div>

        <div>
          <Label htmlFor="nextMeetingDate">Next Meeting Date (optional)</Label>
          <Input
            id="nextMeetingDate"
            type="date"
            value={formData.nextMeetingDate}
            onChange={(e) => setFormData(prev => ({ ...prev, nextMeetingDate: e.target.value }))}
          />
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="isPublished"
            checked={formData.isPublished}
            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isPublished: checked }))}
          />
          <Label htmlFor="isPublished">Publish minutes</Label>
        </div>

        <div className="flex space-x-3 pt-4">
          <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" className="flex-1" disabled={isLoading}>
            {isLoading ? "Creating..." : "Create Minutes"}
          </Button>
        </div>
      </form>
    </DialogContent>
  );
}

function EditMinutesDialog({ minute, chapters, onClose, onSubmit, isLoading }: {
  minute: BoardMeetingMinutes;
  chapters: Chapter[];
  onClose: () => void;
  onSubmit: (data: any) => void;
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState({
    title: minute.title,
    meetingDate: minute.meetingDate,
    attendees: minute.attendees?.join('\n') || "",
    agenda: minute.agenda || "",
    minutes: minute.minutes,
    actionItems: minute.actionItems?.join('\n') || "",
    nextMeetingDate: minute.nextMeetingDate || "",
    isPublished: minute.isPublished,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    onSubmit({
      ...formData,
      attendees: formData.attendees.split('\n').filter(a => a.trim()),
      actionItems: formData.actionItems ? formData.actionItems.split('\n').filter(a => a.trim()) : [],
      nextMeetingDate: formData.nextMeetingDate || null,
    });
  };

  return (
    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Edit Board Meeting Minutes</DialogTitle>
        <DialogDescription>
          Update the board meeting minutes.
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="title">Meeting Title</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            required
          />
        </div>

        <div>
          <Label htmlFor="meetingDate">Meeting Date</Label>
          <Input
            id="meetingDate"
            type="date"
            value={formData.meetingDate}
            onChange={(e) => setFormData(prev => ({ ...prev, meetingDate: e.target.value }))}
            required
          />
        </div>

        <div>
          <Label htmlFor="attendees">Attendees (one per line)</Label>
          <Textarea
            id="attendees"
            value={formData.attendees}
            onChange={(e) => setFormData(prev => ({ ...prev, attendees: e.target.value }))}
            rows={4}
            required
          />
        </div>

        <div>
          <Label htmlFor="agenda">Agenda</Label>
          <Textarea
            id="agenda"
            value={formData.agenda}
            onChange={(e) => setFormData(prev => ({ ...prev, agenda: e.target.value }))}
            rows={3}
          />
        </div>

        <div>
          <Label htmlFor="minutes">Meeting Minutes</Label>
          <Textarea
            id="minutes"
            value={formData.minutes}
            onChange={(e) => setFormData(prev => ({ ...prev, minutes: e.target.value }))}
            rows={6}
            required
          />
        </div>

        <div>
          <Label htmlFor="actionItems">Action Items (one per line)</Label>
          <Textarea
            id="actionItems"
            value={formData.actionItems}
            onChange={(e) => setFormData(prev => ({ ...prev, actionItems: e.target.value }))}
            rows={3}
          />
        </div>

        <div>
          <Label htmlFor="nextMeetingDate">Next Meeting Date</Label>
          <Input
            id="nextMeetingDate"
            type="date"
            value={formData.nextMeetingDate}
            onChange={(e) => setFormData(prev => ({ ...prev, nextMeetingDate: e.target.value }))}
          />
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="isPublished"
            checked={formData.isPublished}
            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isPublished: checked }))}
          />
          <Label htmlFor="isPublished">Publish minutes</Label>
        </div>

        <div className="flex space-x-3 pt-4">
          <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" className="flex-1" disabled={isLoading}>
            {isLoading ? "Updating..." : "Update Minutes"}
          </Button>
        </div>
      </form>
    </DialogContent>
  );
}

function ViewMinutesDialog({ minute, chapters, onClose }: {
  minute: BoardMeetingMinutes;
  chapters: Chapter[];
  onClose: () => void;
}) {
  const chapter = chapters.find(c => c.id === minute.chapterId);

  return (
    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="flex items-center space-x-2">
          <span>{minute.title}</span>
          {minute.isPublished && (
            <Badge variant="default" className="bg-green-100 text-green-800">
              Published
            </Badge>
          )}
        </DialogTitle>
        <DialogDescription>
          {format(new Date(minute.meetingDate), 'MMMM d, yyyy')} • {chapter?.name}
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-6">
        <div>
          <h4 className="font-semibold mb-2">Attendees</h4>
          <ul className="list-disc list-inside space-y-1 text-sm">
            {minute.attendees?.map((attendee, index) => (
              <li key={index}>{attendee}</li>
            ))}
          </ul>
        </div>

        {minute.agenda && (
          <div>
            <h4 className="font-semibold mb-2">Agenda</h4>
            <div className="text-sm text-muted-foreground whitespace-pre-wrap">
              {minute.agenda}
            </div>
          </div>
        )}

        <div>
          <h4 className="font-semibold mb-2">Meeting Minutes</h4>
          <div className="text-sm text-muted-foreground whitespace-pre-wrap">
            {minute.minutes}
          </div>
        </div>

        {minute.actionItems && minute.actionItems.length > 0 && (
          <div>
            <h4 className="font-semibold mb-2">Action Items</h4>
            <ul className="list-disc list-inside space-y-1 text-sm">
              {minute.actionItems.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </div>
        )}

        {minute.nextMeetingDate && (
          <div>
            <h4 className="font-semibold mb-2">Next Meeting</h4>
            <p className="text-sm text-muted-foreground">
              {format(new Date(minute.nextMeetingDate), 'MMMM d, yyyy')}
            </p>
          </div>
        )}

        <div className="flex justify-end pt-4">
          <Button onClick={onClose}>Close</Button>
        </div>
      </div>
    </DialogContent>
  );
}