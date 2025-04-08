import { useAuth } from "@/hooks/use-auth";
import { DashboardLayout } from "@/layouts/dashboard-layout";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Progress } from "@/components/ui/progress";
import { Users, ArrowLeftRight, Calendar, DollarSign, PlusCircle, UserPlus, CalendarCheck, MessageSquare, BookOpen } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { insertLeadSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const newLeadSchema = insertLeadSchema.pick({
  name: true,
  company: true,
  email: true,
  phoneNumber: true,
  notes: true,
  type: true,
  status: true,
  value: true,
  followUpDate: true
}).extend({
  value: z.coerce.number().min(0, "Value cannot be negative"),
  followUpDate: z.string().optional()
});

type NewLeadFormValues = z.infer<typeof newLeadSchema>;

export default function DashboardPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [addLeadOpen, setAddLeadOpen] = useState(false);
  
  const { data: stats } = useQuery({
    queryKey: ["/api/stats"],
  });
  
  const { data: events } = useQuery({
    queryKey: ["/api/events"],
  });
  
  const { data: leads } = useQuery({
    queryKey: ["/api/leads"],
  });
  
  const { data: goals } = useQuery({
    queryKey: ["/api/goals"],
  });
  
  const { data: memberSpotlight } = useQuery({
    queryKey: ["/api/spotlight"],
  });
  
  const leadForm = useForm<NewLeadFormValues>({
    resolver: zodResolver(newLeadSchema),
    defaultValues: {
      name: "",
      company: "",
      email: "",
      phoneNumber: "",
      notes: "",
      type: "Referral",
      status: "Initial Contact",
      value: 0,
      followUpDate: new Date().toISOString().slice(0, 10)
    }
  });
  
  const onSubmitLead = async (values: NewLeadFormValues) => {
    try {
      await apiRequest("POST", "/api/leads", {
        ...values,
        userId: user?.id
      });
      
      toast({
        title: "Lead Added",
        description: "Your new lead has been successfully recorded.",
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      setAddLeadOpen(false);
      leadForm.reset();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add lead. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };
  
  return (
    <DashboardLayout title="Dashboard">
      {/* Welcome Section */}
      <div className="bg-white rounded-lg shadow-sm p-5 mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-neutral-800">
              {user ? `Welcome back, ${user.fullName.split(' ')[0]}!` : 'Welcome!'}
            </h2>
            <p className="mt-1 text-neutral-600">Your networking stats for this month are looking great</p>
          </div>
          <div className="mt-4 md:mt-0">
            <Dialog open={addLeadOpen} onOpenChange={setAddLeadOpen}>
              <DialogTrigger asChild>
                <Button variant="default" className="bg-secondary-500 hover:bg-secondary-600">
                  <PlusCircle className="mr-2 h-4 w-4" /> Record New Lead
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[525px]">
                <DialogHeader>
                  <DialogTitle>Add New Lead</DialogTitle>
                  <DialogDescription>
                    Enter the details of your new business lead.
                  </DialogDescription>
                </DialogHeader>
                <Form {...leadForm}>
                  <form onSubmit={leadForm.handleSubmit(onSubmitLead)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={leadForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Contact name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={leadForm.control}
                        name="company"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Company</FormLabel>
                            <FormControl>
                              <Input placeholder="Company name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={leadForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="Email address" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={leadForm.control}
                        name="phoneNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone</FormLabel>
                            <FormControl>
                              <Input placeholder="Phone number" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={leadForm.control}
                        name="type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Lead Type</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select lead type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Referral">Referral</SelectItem>
                                <SelectItem value="Event Connection">Event Connection</SelectItem>
                                <SelectItem value="Direct Outreach">Direct Outreach</SelectItem>
                                <SelectItem value="Online">Online</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={leadForm.control}
                        name="status"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Status</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Initial Contact">Initial Contact</SelectItem>
                                <SelectItem value="Follow-up Scheduled">Follow-up Scheduled</SelectItem>
                                <SelectItem value="Needs Follow-up">Needs Follow-up</SelectItem>
                                <SelectItem value="Converted">Converted</SelectItem>
                                <SelectItem value="Lost">Lost</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={leadForm.control}
                        name="value"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Potential Value ($)</FormLabel>
                            <FormControl>
                              <Input type="number" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={leadForm.control}
                        name="followUpDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Follow-up Date</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={leadForm.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Notes</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Additional details about this lead" 
                              className="resize-none" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <DialogFooter>
                      <Button type="submit">Add Lead</Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4 flex items-center">
            <div className="rounded-full bg-primary-100 p-3 mr-4">
              <Users className="h-5 w-5 text-primary-500" />
            </div>
            <div>
              <p className="text-sm text-neutral-500">Connections</p>
              <h3 className="text-xl font-bold text-neutral-800">{stats?.connections || 0}</h3>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 flex items-center">
            <div className="rounded-full bg-secondary-100 p-3 mr-4">
              <ArrowLeftRight className="h-5 w-5 text-secondary-500" />
            </div>
            <div>
              <p className="text-sm text-neutral-500">Leads Exchanged</p>
              <h3 className="text-xl font-bold text-neutral-800">{stats?.leadsExchanged || 0}</h3>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 flex items-center">
            <div className="rounded-full bg-green-100 p-3 mr-4">
              <Calendar className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-neutral-500">Events Attended</p>
              <h3 className="text-xl font-bold text-neutral-800">{stats?.eventsAttended || 0}</h3>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 flex items-center">
            <div className="rounded-full bg-purple-100 p-3 mr-4">
              <DollarSign className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <p className="text-sm text-neutral-500">Lead Value</p>
              <h3 className="text-xl font-bold text-neutral-800">${stats?.leadValue || 0}</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Column 1 (Upcoming Events) */}
        <div className="lg:col-span-2">
          <Card className="mb-6">
            <CardHeader className="px-5 py-4 border-b border-neutral-200 flex flex-row justify-between items-center">
              <CardTitle className="text-lg font-semibold">Upcoming Events</CardTitle>
              <Link href="/events">
                <Button variant="link" className="text-primary-500 p-0">View All</Button>
              </Link>
            </CardHeader>
            <CardContent className="p-0 divide-y divide-neutral-200">
              {events && events.length > 0 ? (
                events.map((event) => (
                  <div key={event.id} className="p-5 hover:bg-neutral-50">
                    <div className="flex items-start">
                      <div className="bg-primary-500 text-white rounded text-center py-1 px-3 mr-4">
                        <div className="text-xs font-medium">
                          {new Date(event.date).toLocaleString('default', { month: 'short' }).toUpperCase()}
                        </div>
                        <div className="text-xl font-bold">
                          {new Date(event.date).getDate()}
                        </div>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-neutral-800 mb-1">{event.title}</h4>
                        <div className="text-sm text-neutral-600 mb-2">
                          <span className="inline-flex items-center">
                            <Clock className="mr-1 h-4 w-4" /> 
                            {new Date(`2000-01-01T${event.startTime}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - 
                            {new Date(`2000-01-01T${event.endTime}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span className="inline-flex items-center ml-3">
                            <MapPin className="mr-1 h-4 w-4" /> {event.location}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center space-x-2">
                          <span className="text-xs font-medium text-neutral-600 bg-neutral-100 rounded-full px-2 py-1">
                            {event.attendeeCount || 0} Attendees
                          </span>
                          {event.isRegistered ? (
                            <span className="text-xs font-medium text-green-700 bg-green-100 rounded-full px-2 py-1">
                              You're Registered
                            </span>
                          ) : (
                            <Button variant="link" className="text-xs font-medium text-primary-700 bg-primary-100 rounded-full px-2 py-1 h-auto">
                              Register Now
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center">
                  <Calendar className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                  <h3 className="text-lg font-medium text-neutral-800 mb-1">No upcoming events</h3>
                  <p className="text-sm text-muted-foreground mb-4">There are no events scheduled at this time.</p>
                  <Link href="/events">
                    <Button variant="outline">View All Events</Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Recent Lead Activity */}
          <Card>
            <CardHeader className="px-5 py-4 border-b border-neutral-200 flex flex-row justify-between items-center">
              <CardTitle className="text-lg font-semibold">Recent Lead Activity</CardTitle>
              <Link href="/leads">
                <Button variant="link" className="text-primary-500 p-0">View All</Button>
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                {leads && leads.length > 0 ? (
                  <table className="min-w-full divide-y divide-neutral-200">
                    <thead className="bg-neutral-50">
                      <tr>
                        <th scope="col" className="px-5 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Contact</th>
                        <th scope="col" className="px-5 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Type</th>
                        <th scope="col" className="px-5 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Status</th>
                        <th scope="col" className="px-5 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Value</th>
                        <th scope="col" className="px-5 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Date</th>
                        <th scope="col" className="relative px-5 py-3">
                          <span className="sr-only">Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-neutral-200">
                      {leads.map((lead) => (
                        <tr key={lead.id} className="hover:bg-neutral-50">
                          <td className="px-5 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <Avatar className="flex-shrink-0 h-10 w-10">
                                <AvatarFallback>{getInitials(lead.name)}</AvatarFallback>
                              </Avatar>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-neutral-900">{lead.name}</div>
                                <div className="text-sm text-neutral-500">{lead.company}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs rounded-full 
                              ${lead.type === 'Referral' ? 'bg-blue-100 text-blue-800' : 
                              lead.type === 'Event Connection' ? 'bg-purple-100 text-purple-800' : 
                              lead.type === 'Direct Outreach' ? 'bg-orange-100 text-orange-800' : 
                              'bg-gray-100 text-gray-800'}`}>
                              {lead.type}
                            </span>
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs rounded-full 
                              ${lead.status === 'Initial Contact' ? 'bg-yellow-100 text-yellow-800' : 
                              lead.status === 'Follow-up Scheduled' ? 'bg-green-100 text-green-800' : 
                              lead.status === 'Needs Follow-up' ? 'bg-red-100 text-red-800' : 
                              lead.status === 'Converted' ? 'bg-blue-100 text-blue-800' : 
                              'bg-gray-100 text-gray-800'}`}>
                              {lead.status}
                            </span>
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap text-sm text-neutral-700">${lead.value}</td>
                          <td className="px-5 py-4 whitespace-nowrap text-sm text-neutral-500">
                            {new Date(lead.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <Button variant="link" className="text-primary-500">
                              Details
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="p-8 text-center">
                    <BookContact className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                    <h3 className="text-lg font-medium text-neutral-800 mb-1">No leads yet</h3>
                    <p className="text-sm text-muted-foreground mb-4">Start by adding your first business lead.</p>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline">Add Your First Lead</Button>
                      </DialogTrigger>
                      <DialogContent>
                        {/* Same content as the add lead dialog above */}
                      </DialogContent>
                    </Dialog>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Column 2 (Right Sidebar Components) */}
        <div>
          {/* My Goals */}
          <Card className="mb-6">
            <CardHeader className="px-5 py-4 border-b border-neutral-200">
              <CardTitle className="text-lg font-semibold">My Goals</CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              {goals ? (
                <>
                  <div className="mb-4">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium text-neutral-700">New Connections</span>
                      <span className="text-sm font-medium text-neutral-700">
                        {goals.connectionsAchieved}/{goals.connectionsGoal}
                      </span>
                    </div>
                    <Progress 
                      value={(goals.connectionsAchieved / goals.connectionsGoal) * 100} 
                      className="h-2 bg-neutral-200" 
                    />
                  </div>
                  
                  <div className="mb-4">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium text-neutral-700">Leads Generated</span>
                      <span className="text-sm font-medium text-neutral-700">
                        {goals.leadsAchieved}/{goals.leadsGoal}
                      </span>
                    </div>
                    <Progress 
                      value={(goals.leadsAchieved / goals.leadsGoal) * 100} 
                      className="h-2 bg-neutral-200" 
                    />
                  </div>
                  
                  <div className="mb-4">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium text-neutral-700">Event Attendance</span>
                      <span className="text-sm font-medium text-neutral-700">
                        {goals.eventsAchieved}/{goals.eventsGoal}
                      </span>
                    </div>
                    <Progress 
                      value={(goals.eventsAchieved / goals.eventsGoal) * 100} 
                      className="h-2 bg-neutral-200" 
                    />
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium text-neutral-700">Follow-ups Completed</span>
                      <span className="text-sm font-medium text-neutral-700">
                        {goals.followUpsAchieved}/{goals.followUpsGoal}
                      </span>
                    </div>
                    <Progress 
                      value={(goals.followUpsAchieved / goals.followUpsGoal) * 100} 
                      className="h-2 bg-neutral-200" 
                    />
                  </div>
                </>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground">No goals set yet</p>
                  <Button variant="outline" className="mt-2">Set Goals</Button>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Quick Links */}
          <Card className="mb-6">
            <CardHeader className="px-5 py-4 border-b border-neutral-200">
              <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="p-3">
              <Link href="#add-lead">
                <Button variant="ghost" className="w-full justify-start text-left py-2 h-auto">
                  <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center mr-3">
                    <UserPlus className="h-4 w-4 text-primary-500" />
                  </div>
                  <span className="text-neutral-700">Add New Lead</span>
                </Button>
              </Link>
              
              <Link href="/events">
                <Button variant="ghost" className="w-full justify-start text-left py-2 h-auto">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center mr-3">
                    <CalendarCheck className="h-4 w-4 text-green-500" />
                  </div>
                  <span className="text-neutral-700">Register for Events</span>
                </Button>
              </Link>
              
              <Link href="#schedule-meeting">
                <Button variant="ghost" className="w-full justify-start text-left py-2 h-auto">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                    <MessageSquare className="h-4 w-4 text-blue-500" />
                  </div>
                  <span className="text-neutral-700">Schedule 1:1 Meeting</span>
                </Button>
              </Link>
              
              <Link href="/members">
                <Button variant="ghost" className="w-full justify-start text-left py-2 h-auto">
                  <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center mr-3">
                    <BookOpen className="h-4 w-4 text-purple-500" />
                  </div>
                  <span className="text-neutral-700">Browse Member Directory</span>
                </Button>
              </Link>
            </CardContent>
          </Card>
          
          {/* Member Spotlight */}
          <Card>
            <CardHeader className="px-5 py-4 border-b border-neutral-200">
              <CardTitle className="text-lg font-semibold">Member Spotlight</CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              {memberSpotlight ? (
                <>
                  <div className="flex flex-col items-center text-center mb-4">
                    <Avatar className="w-20 h-20 mb-3">
                      <AvatarImage src={memberSpotlight.user.profileImage} alt={memberSpotlight.user.fullName} />
                      <AvatarFallback>{getInitials(memberSpotlight.user.fullName)}</AvatarFallback>
                    </Avatar>
                    <h4 className="font-semibold text-neutral-800">{memberSpotlight.user.fullName}</h4>
                    <p className="text-sm text-neutral-600">{memberSpotlight.user.title}, {memberSpotlight.user.company}</p>
                  </div>
                  <p className="text-sm text-neutral-700 mb-4">
                    {memberSpotlight.description}
                  </p>
                  <div className="flex justify-center">
                    <Button className="bg-primary-500">
                      Connect with {memberSpotlight.user.fullName.split(' ')[0]}
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-center py-6">
                  <Users className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                  <h3 className="text-lg font-medium text-neutral-800 mb-1">No Member Spotlight</h3>
                  <p className="text-sm text-muted-foreground">Check back later for featured members</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
