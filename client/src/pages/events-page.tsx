import { useAuth } from "@/hooks/use-auth";
import { DashboardLayout } from "@/layouts/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { insertEventRegistrationSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, MapPin, CalendarClock, Search, Calendar, Filter } from "lucide-react";
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";

export default function EventsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTab, setSelectedTab] = useState("upcoming");
  
  const { data: events, isLoading } = useQuery({
    queryKey: ["/api/events"],
  });
  
  const registerForm = useForm({
    resolver: zodResolver(insertEventRegistrationSchema),
    defaultValues: {
      eventId: 0,
      userId: user?.id || 0
    }
  });
  
  const onRegister = async (eventId: number) => {
    try {
      const values = {
        eventId,
        userId: user?.id || 0
      };
      
      await apiRequest("POST", "/api/event-registrations", values);
      
      toast({
        title: "Registration Successful",
        description: "You have been registered for this event.",
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
    } catch (error) {
      toast({
        title: "Registration Failed",
        description: "Could not register for this event. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  // Filter and sort events
  const filteredEvents = events
    ? events.filter(event => {
        // Filter by search query
        if (searchQuery && !event.title.toLowerCase().includes(searchQuery.toLowerCase())) {
          return false;
        }
        
        // Filter by tab
        const eventDate = new Date(event.date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (selectedTab === "upcoming" && eventDate < today) {
          return false;
        }
        
        if (selectedTab === "past" && eventDate >= today) {
          return false;
        }
        
        if (selectedTab === "registered" && !event.isRegistered) {
          return false;
        }
        
        return true;
      })
    : [];
  
  // Sort events by date (most recent first for past, soonest first for upcoming)
  filteredEvents.sort((a, b) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    return selectedTab === "past" 
      ? dateB.getTime() - dateA.getTime() 
      : dateA.getTime() - dateB.getTime();
  });
  
  return (
    <DashboardLayout title="Events">
      <div className="mb-6">
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <CardTitle>BLOC Events</CardTitle>
              
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
                  <Input 
                    placeholder="Search events..." 
                    className="pl-9 w-full sm:w-64"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                
                {user?.isAdmin && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button>Create Event</Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[550px]">
                      <DialogHeader>
                        <DialogTitle>Create New Event</DialogTitle>
                        <DialogDescription>
                          Add details for the new networking event.
                        </DialogDescription>
                      </DialogHeader>
                      <form className="space-y-4">
                        <div className="grid grid-cols-1 gap-4">
                          <div className="grid grid-cols-1 gap-2">
                            <Label htmlFor="title">Event Title</Label>
                            <Input id="title" placeholder="Enter event title" />
                          </div>
                          
                          <div className="grid grid-cols-1 gap-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea id="description" placeholder="Enter event description" />
                          </div>
                          
                          <div className="grid grid-cols-3 gap-4">
                            <div className="grid grid-cols-1 gap-2">
                              <Label htmlFor="date">Date</Label>
                              <Input id="date" type="date" />
                            </div>
                            
                            <div className="grid grid-cols-1 gap-2">
                              <Label htmlFor="startTime">Start Time</Label>
                              <Input id="startTime" type="time" />
                            </div>
                            
                            <div className="grid grid-cols-1 gap-2">
                              <Label htmlFor="endTime">End Time</Label>
                              <Input id="endTime" type="time" />
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 gap-2">
                            <Label htmlFor="location">Location</Label>
                            <Input id="location" placeholder="Enter event location" />
                          </div>
                          
                          <div className="grid grid-cols-1 gap-2">
                            <Label htmlFor="capacity">Capacity (Optional)</Label>
                            <Input id="capacity" type="number" min="0" placeholder="Maximum attendees" />
                          </div>
                        </div>
                        
                        <DialogFooter>
                          <Button type="submit">Create Event</Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                <TabsTrigger value="past">Past Events</TabsTrigger>
                <TabsTrigger value="registered">My Registrations</TabsTrigger>
              </TabsList>
              
              <TabsContent value="upcoming" className="space-y-4">
                {filteredEvents.length > 0 ? (
                  filteredEvents.map((event) => (
                    <EventCard 
                      key={event.id}
                      event={event}
                      onRegister={() => onRegister(event.id)}
                    />
                  ))
                ) : (
                  <EmptyState 
                    icon={<Calendar className="h-12 w-12 text-muted-foreground" />}
                    title="No upcoming events"
                    description="There are no upcoming events scheduled at this time."
                  />
                )}
              </TabsContent>
              
              <TabsContent value="past" className="space-y-4">
                {filteredEvents.length > 0 ? (
                  filteredEvents.map((event) => (
                    <EventCard 
                      key={event.id}
                      event={event}
                      isPast
                    />
                  ))
                ) : (
                  <EmptyState 
                    icon={<CalendarClock className="h-12 w-12 text-muted-foreground" />}
                    title="No past events"
                    description="There are no past events in the system."
                  />
                )}
              </TabsContent>
              
              <TabsContent value="registered" className="space-y-4">
                {filteredEvents.length > 0 ? (
                  filteredEvents.map((event) => (
                    <EventCard 
                      key={event.id}
                      event={event}
                      onRegister={() => onRegister(event.id)}
                    />
                  ))
                ) : (
                  <EmptyState 
                    icon={<Filter className="h-12 w-12 text-muted-foreground" />}
                    title="No registrations"
                    description="You haven't registered for any events yet."
                  />
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

function EventCard({ event, onRegister, isPast = false }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex flex-col sm:flex-row sm:items-start">
          <div className="bg-primary-500 text-white rounded text-center py-2 px-4 mb-4 sm:mb-0 sm:mr-4 sm:py-1 sm:px-3">
            <div className="text-xs font-medium">
              {new Date(event.date).toLocaleString('default', { month: 'short' }).toUpperCase()}
            </div>
            <div className="text-xl font-bold">
              {new Date(event.date).getDate()}
            </div>
          </div>
          
          <div className="flex-1">
            <h3 className="font-semibold text-neutral-800 text-lg mb-1">{event.title}</h3>
            
            <div className="text-sm text-neutral-600 mb-3">
              <div className="flex items-center mb-1">
                <Clock className="mr-2 h-4 w-4" /> 
                {new Date(`2000-01-01T${event.startTime}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - 
                {new Date(`2000-01-01T${event.endTime}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
              <div className="flex items-center">
                <MapPin className="mr-2 h-4 w-4" /> {event.location}
              </div>
            </div>
            
            <p className="text-sm text-neutral-700 mb-4">{event.description}</p>
            
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-neutral-600 bg-neutral-100 rounded-full px-2 py-1">
                {event.attendeeCount || 0} Attendees
              </span>
              
              {event.capacity && (
                <span className="text-xs font-medium text-neutral-600 bg-neutral-100 rounded-full px-2 py-1">
                  {event.capacity - (event.attendeeCount || 0)} Spots Left
                </span>
              )}
              
              {!isPast && (
                event.isRegistered ? (
                  <span className="text-xs font-medium text-green-700 bg-green-100 rounded-full px-2 py-1">
                    You're Registered
                  </span>
                ) : (
                  <Button 
                    size="sm" 
                    className="ml-auto" 
                    onClick={onRegister}
                  >
                    Register
                  </Button>
                )
              )}
              
              {isPast && event.attended && (
                <span className="text-xs font-medium text-blue-700 bg-blue-100 rounded-full px-2 py-1">
                  You Attended
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
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

// These components are only used in this file, so defining them here
const Label = ({ htmlFor, children }) => (
  <label 
    htmlFor={htmlFor} 
    className="text-sm font-medium text-neutral-900"
  >
    {children}
  </label>
);
