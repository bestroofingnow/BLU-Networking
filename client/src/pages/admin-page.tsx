import { useState } from "react";
import { DashboardLayout } from "@/layouts/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { insertEventSchema } from "@shared/schema";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Calendar, Users, BookOpenText, BarChart2, Award } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const newEventSchema = insertEventSchema.pick({
  title: true,
  description: true,
  date: true,
  startTime: true,
  endTime: true,
  location: true,
  capacity: true
}).extend({
  capacity: z.coerce.number().min(0, "Capacity cannot be negative").optional(),
});

type NewEventFormValues = z.infer<typeof newEventSchema>;

const newSpotlightSchema = z.object({
  userId: z.number().min(1, "Must select a member"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  achievements: z.string().optional(),
  featuredUntil: z.string().min(1, "End date is required"),
});

type NewSpotlightFormValues = z.infer<typeof newSpotlightSchema>;

export default function AdminPage() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddEventDialog, setShowAddEventDialog] = useState(false);
  const [showAddSpotlightDialog, setShowAddSpotlightDialog] = useState(false);
  
  const { data: users, isLoading: isLoadingUsers } = useQuery({
    queryKey: ["/api/admin/users"],
  });
  
  const { data: events, isLoading: isLoadingEvents } = useQuery({
    queryKey: ["/api/admin/events"],
  });
  
  const { data: spotlights, isLoading: isLoadingSpotlights } = useQuery({
    queryKey: ["/api/admin/spotlights"],
  });
  
  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ["/api/admin/stats"],
  });
  
  const eventForm = useForm<NewEventFormValues>({
    resolver: zodResolver(newEventSchema),
    defaultValues: {
      title: "",
      description: "",
      date: new Date().toISOString().slice(0, 10),
      startTime: "18:00",
      endTime: "20:00",
      location: "",
      capacity: 50
    }
  });
  
  const spotlightForm = useForm<NewSpotlightFormValues>({
    resolver: zodResolver(newSpotlightSchema),
    defaultValues: {
      userId: 0,
      description: "",
      achievements: "",
      featuredUntil: new Date(new Date().setDate(new Date().getDate() + 14)).toISOString().slice(0, 10)
    }
  });
  
  const addEventMutation = useMutation({
    mutationFn: async (data: NewEventFormValues) => {
      return await apiRequest("POST", "/api/events", data);
    },
    onSuccess: () => {
      toast({
        title: "Event Created",
        description: "The event has been successfully created.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/events"] });
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      setShowAddEventDialog(false);
      eventForm.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create event: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  const addSpotlightMutation = useMutation({
    mutationFn: async (data: NewSpotlightFormValues) => {
      return await apiRequest("POST", "/api/member-spotlights", data);
    },
    onSuccess: () => {
      toast({
        title: "Spotlight Created",
        description: "The member spotlight has been successfully created.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/spotlights"] });
      queryClient.invalidateQueries({ queryKey: ["/api/spotlight"] });
      setShowAddSpotlightDialog(false);
      spotlightForm.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create spotlight: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  const onEventSubmit = (values: NewEventFormValues) => {
    addEventMutation.mutate(values);
  };
  
  const onSpotlightSubmit = (values: NewSpotlightFormValues) => {
    addSpotlightMutation.mutate(values);
  };
  
  // Filter users based on search
  const filteredUsers = users
    ? users.filter(user => {
        if (!searchQuery) return true;
        
        const query = searchQuery.toLowerCase();
        return (
          user.fullName.toLowerCase().includes(query) ||
          user.username.toLowerCase().includes(query) ||
          user.email.toLowerCase().includes(query) ||
          user.company.toLowerCase().includes(query)
        );
      })
    : [];
  
  const getInitials = (name) => {
    if (!name) return "";
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };
  
  return (
    <DashboardLayout title="Admin Panel">
      {/* Admin Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard 
          title="Total Members"
          value={stats?.totalMembers || 0}
          icon={<Users className="h-5 w-5 text-primary-500" />}
        />
        
        <StatCard 
          title="Active Events"
          value={stats?.activeEvents || 0}
          icon={<Calendar className="h-5 w-5 text-secondary-500" />}
        />
        
        <StatCard 
          title="Total Leads"
          value={stats?.totalLeads || 0}
          icon={<BookOpenText className="h-5 w-5 text-green-500" />}
        />
        
        <StatCard 
          title="Avg. Lead Value"
          value={`$${stats?.avgLeadValue || 0}`}
          icon={<BarChart2 className="h-5 w-5 text-purple-500" />}
        />
      </div>
      
      <Tabs defaultValue="members" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="members">Member Management</TabsTrigger>
          <TabsTrigger value="events">Event Management</TabsTrigger>
          <TabsTrigger value="spotlights">Member Spotlights</TabsTrigger>
        </TabsList>
        
        <TabsContent value="members">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <CardTitle>BLOC Members</CardTitle>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
                  <Input 
                    placeholder="Search members..." 
                    className="pl-9 w-full md:w-64"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingUsers ? (
                <div className="animate-pulse">
                  <div className="h-10 bg-neutral-100 rounded mb-4"></div>
                  {Array(5).fill(0).map((_, i) => (
                    <div key={i} className="h-16 bg-neutral-50 rounded mb-2"></div>
                  ))}
                </div>
              ) : filteredUsers.length > 0 ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Member</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Joined</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map(user => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div className="flex items-center">
                              <Avatar className="h-9 w-9 mr-3">
                                <AvatarImage src={user.profileImage} alt={user.fullName} />
                                <AvatarFallback>{getInitials(user.fullName)}</AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium">{user.fullName}</div>
                                <div className="text-sm text-muted-foreground">{user.company}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            {new Date(user.joinedAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            {user.isAdmin ? (
                              <Badge variant="default">Admin</Badge>
                            ) : (
                              <Badge variant="outline">Member</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button 
                              variant="outline" 
                              size="sm"
                            >
                              Edit
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-16">
                  <p className="text-neutral-500">No members found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="events">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <CardTitle>Manage Events</CardTitle>
                <Button onClick={() => setShowAddEventDialog(true)}>
                  <Plus className="mr-2 h-4 w-4" /> Create Event
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingEvents ? (
                <div className="animate-pulse">
                  <div className="h-10 bg-neutral-100 rounded mb-4"></div>
                  {Array(5).fill(0).map((_, i) => (
                    <div key={i} className="h-16 bg-neutral-50 rounded mb-2"></div>
                  ))}
                </div>
              ) : events && events.length > 0 ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Event</TableHead>
                        <TableHead>Date & Time</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Attendees</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {events.map(event => (
                        <TableRow key={event.id}>
                          <TableCell>
                            <div className="font-medium">{event.title}</div>
                            <div className="text-sm text-muted-foreground truncate max-w-xs">
                              {event.description}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              {new Date(event.date).toLocaleDateString()}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {new Date(`2000-01-01T${event.startTime}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - 
                              {new Date(`2000-01-01T${event.endTime}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </TableCell>
                          <TableCell>{event.location}</TableCell>
                          <TableCell>
                            {event.attendeeCount || 0}
                            {event.capacity ? ` / ${event.capacity}` : ''}
                          </TableCell>
                          <TableCell className="text-right space-x-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                            >
                              Edit
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="border-red-200 text-red-600 hover:bg-red-50"
                            >
                              Cancel
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-16">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-neutral-500 mb-4">No events found</p>
                  <Button onClick={() => setShowAddEventDialog(true)}>
                    <Plus className="mr-2 h-4 w-4" /> Create First Event
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Add Event Dialog */}
          <Dialog open={showAddEventDialog} onOpenChange={setShowAddEventDialog}>
            <DialogContent className="sm:max-w-[550px]">
              <DialogHeader>
                <DialogTitle>Create New Event</DialogTitle>
                <DialogDescription>
                  Add details for the new networking event.
                </DialogDescription>
              </DialogHeader>
              <Form {...eventForm}>
                <form onSubmit={eventForm.handleSubmit(onEventSubmit)} className="space-y-4">
                  <FormField
                    control={eventForm.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Event Title</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter event title" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={eventForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Enter event description" 
                            className="resize-none" 
                            rows={3}
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={eventForm.control}
                      name="date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={eventForm.control}
                      name="startTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Start Time</FormLabel>
                          <FormControl>
                            <Input type="time" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={eventForm.control}
                      name="endTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>End Time</FormLabel>
                          <FormControl>
                            <Input type="time" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={eventForm.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Location</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter event location" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={eventForm.control}
                      name="capacity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Capacity (Optional)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="0" 
                              placeholder="Maximum attendees" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <DialogFooter>
                    <Button 
                      type="submit" 
                      disabled={addEventMutation.isPending}
                    >
                      {addEventMutation.isPending ? "Creating..." : "Create Event"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </TabsContent>
        
        <TabsContent value="spotlights">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <CardTitle>Member Spotlights</CardTitle>
                <Button onClick={() => setShowAddSpotlightDialog(true)}>
                  <Plus className="mr-2 h-4 w-4" /> Create Spotlight
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingSpotlights ? (
                <div className="animate-pulse">
                  <div className="h-10 bg-neutral-100 rounded mb-4"></div>
                  {Array(3).fill(0).map((_, i) => (
                    <div key={i} className="h-24 bg-neutral-50 rounded mb-2"></div>
                  ))}
                </div>
              ) : spotlights && spotlights.length > 0 ? (
                <div className="space-y-4">
                  {spotlights.map(spotlight => (
                    <div key={spotlight.id} className="border rounded-lg p-4">
                      <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex items-center md:w-1/3">
                          <Avatar className="h-12 w-12 mr-3">
                            <AvatarImage src={spotlight.user.profileImage} alt={spotlight.user.fullName} />
                            <AvatarFallback>{getInitials(spotlight.user.fullName)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{spotlight.user.fullName}</div>
                            <div className="text-sm text-muted-foreground">
                              {spotlight.user.title}, {spotlight.user.company}
                            </div>
                          </div>
                        </div>
                        
                        <div className="md:w-1/3">
                          <p className="text-sm text-neutral-700 mb-2">{spotlight.description}</p>
                          {spotlight.achievements && (
                            <p className="text-sm text-neutral-500">{spotlight.achievements}</p>
                          )}
                        </div>
                        
                        <div className="flex flex-col md:items-end justify-between md:w-1/3">
                          <Badge className={spotlight.active ? 'bg-green-100 text-green-800' : 'bg-neutral-100 text-neutral-800'}>
                            {spotlight.active ? 'Active' : 'Inactive'}
                          </Badge>
                          
                          <div className="text-sm text-neutral-500 mt-2">
                            Featured until: {new Date(spotlight.featuredUntil).toLocaleDateString()}
                          </div>
                          
                          <div className="flex gap-2 mt-2">
                            <Button variant="outline" size="sm">Edit</Button>
                            {spotlight.active ? (
                              <Button 
                                variant="outline"
                                size="sm"
                                className="border-red-200 text-red-600 hover:bg-red-50"
                              >
                                Deactivate
                              </Button>
                            ) : (
                              <Button 
                                variant="outline"
                                size="sm"
                                className="border-green-200 text-green-600 hover:bg-green-50"
                              >
                                Activate
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <Award className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-neutral-500 mb-4">No member spotlights found</p>
                  <Button onClick={() => setShowAddSpotlightDialog(true)}>
                    <Plus className="mr-2 h-4 w-4" /> Create First Spotlight
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Add Spotlight Dialog */}
          <Dialog open={showAddSpotlightDialog} onOpenChange={setShowAddSpotlightDialog}>
            <DialogContent className="sm:max-w-[550px]">
              <DialogHeader>
                <DialogTitle>Create Member Spotlight</DialogTitle>
                <DialogDescription>
                  Feature a member on the BLOC dashboard.
                </DialogDescription>
              </DialogHeader>
              <Form {...spotlightForm}>
                <form onSubmit={spotlightForm.handleSubmit(onSpotlightSubmit)} className="space-y-4">
                  <FormField
                    control={spotlightForm.control}
                    name="userId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Select Member</FormLabel>
                        <Select
                          onValueChange={(value) => field.onChange(parseInt(value))}
                          defaultValue={field.value.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a member to feature" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {users && users.map(user => (
                              <SelectItem key={user.id} value={user.id.toString()}>
                                {user.fullName} - {user.company}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={spotlightForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Spotlight Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Write a description about this member's contributions to BLOC" 
                            className="resize-none" 
                            rows={3}
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={spotlightForm.control}
                    name="achievements"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Achievements (Optional)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="List member's achievements or business wins" 
                            className="resize-none" 
                            rows={2}
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={spotlightForm.control}
                    name="featuredUntil"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Featured Until</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <DialogFooter>
                    <Button 
                      type="submit" 
                      disabled={addSpotlightMutation.isPending}
                    >
                      {addSpotlightMutation.isPending ? "Creating..." : "Create Spotlight"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}

function StatCard({ title, value, icon }) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center">
        <div className="rounded-full bg-primary-100 p-3 mr-4">
          {icon}
        </div>
        <div>
          <p className="text-sm text-neutral-500">{title}</p>
          <h3 className="text-xl font-bold text-neutral-800">{value}</h3>
        </div>
      </CardContent>
    </Card>
  );
}
