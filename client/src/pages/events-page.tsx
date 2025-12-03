import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, MapPin, Users, Loader2 } from "lucide-react";
import { Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

export default function EventsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: events, isLoading } = useQuery({
    queryKey: ["/api/events"],
    enabled: !!user,
  });

  const registerMutation = useMutation({
    mutationFn: async (eventId: number) => {
      const response = await fetch("/api/event-registrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ eventId, userId: user?.id }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to register for event");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      toast({
        title: "Success",
        description: "You have been registered for the event",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto p-6">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Events</h1>
          <p className="text-gray-600 mt-2">Please log in to view events</p>
          <div className="mt-4">
            <Link href="/auth">
              <Button>Login/Register</Button>
            </Link>
          </div>
        </header>
      </div>
    );
  }

  const upcomingEvents = events?.filter(
    (event: any) => new Date(event.date) >= new Date()
  ) || [];

  const pastEvents = events?.filter(
    (event: any) => new Date(event.date) < new Date()
  ) || [];

  return (
    <div className="container mx-auto p-6">
      <header className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Events</h1>
            <p className="text-gray-600 mt-2">Connect with other members at our networking events</p>
          </div>

          <div className="mt-4 sm:mt-0 flex gap-2">
            <Link href="/dashboard">
              <Button variant="outline">Back to Dashboard</Button>
            </Link>
            {user?.userLevel === "board_member" || user?.userLevel === "executive_board" ? (
              <Link href="/admin">
                <Button>Create Event</Button>
              </Link>
            ) : null}
          </div>
        </div>
      </header>

      {upcomingEvents.length === 0 && pastEvents.length === 0 ? (
        <Card className="bg-gray-50 border-dashed">
          <CardContent className="p-10 text-center">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <CardTitle className="text-xl mb-2">No Events Yet</CardTitle>
            <p className="text-gray-600 mb-6">
              There are no events scheduled at the moment.
              {user?.userLevel === "board_member" || user?.userLevel === "executive_board"
                ? " Create your first event to get started."
                : " Check back soon for new networking opportunities."}
            </p>
            {user?.userLevel === "board_member" || user?.userLevel === "executive_board" ? (
              <Link href="/admin">
                <Button>Create Your First Event</Button>
              </Link>
            ) : null}
          </CardContent>
        </Card>
      ) : (
        <>
          {upcomingEvents.length > 0 && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Upcoming Events</h2>
              <div className="grid grid-cols-1 gap-6">
                {upcomingEvents.map((event: any) => (
                  <Card key={event.id}>
                    <CardContent className="p-6">
                      <div className="flex flex-col sm:flex-row sm:items-start">
                        <div className="bg-primary-500 text-white rounded text-center py-2 px-4 mb-4 sm:mb-0 sm:mr-6 min-w-[80px]">
                          <div className="text-xs font-medium">
                            {new Date(event.date).toLocaleString('default', { month: 'short' }).toUpperCase()}
                          </div>
                          <div className="text-2xl font-bold">
                            {new Date(event.date).getDate()}
                          </div>
                        </div>

                        <div className="flex-1">
                          <h3 className="text-xl font-semibold text-gray-800 mb-2">{event.title}</h3>

                          <div className="space-y-2 mb-4">
                            {event.startTime && event.endTime && (
                              <div className="flex items-center text-gray-600">
                                <Clock className="mr-2 h-4 w-4" />
                                {event.startTime} - {event.endTime}
                              </div>
                            )}
                            {event.location && (
                              <div className="flex items-center text-gray-600">
                                <MapPin className="mr-2 h-4 w-4" /> {event.location}
                              </div>
                            )}
                            {event.capacity && (
                              <div className="flex items-center text-gray-600">
                                <Users className="mr-2 h-4 w-4" />
                                Capacity: {event.capacity} attendees
                              </div>
                            )}
                          </div>

                          {event.description && (
                            <p className="text-gray-700 mb-4">{event.description}</p>
                          )}

                          <div className="flex flex-wrap items-center gap-4">
                            {event.isRegistered ? (
                              <span className="text-sm text-green-600 bg-green-100 rounded-full px-3 py-1 font-medium">
                                ✓ Registered
                              </span>
                            ) : (
                              <Button
                                onClick={() => registerMutation.mutate(event.id)}
                                disabled={registerMutation.isPending}
                              >
                                {registerMutation.isPending ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Registering...
                                  </>
                                ) : (
                                  "Register Now"
                                )}
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {pastEvents.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Past Events</h2>
              <div className="grid grid-cols-1 gap-6">
                {pastEvents.map((event: any) => (
                  <Card key={event.id} className="opacity-75">
                    <CardContent className="p-6">
                      <div className="flex flex-col sm:flex-row sm:items-start">
                        <div className="bg-gray-500 text-white rounded text-center py-2 px-4 mb-4 sm:mb-0 sm:mr-6 min-w-[80px]">
                          <div className="text-xs font-medium">
                            {new Date(event.date).toLocaleString('default', { month: 'short' }).toUpperCase()}
                          </div>
                          <div className="text-2xl font-bold">
                            {new Date(event.date).getDate()}
                          </div>
                        </div>

                        <div className="flex-1">
                          <h3 className="text-xl font-semibold text-gray-800 mb-2">{event.title}</h3>
                          {event.description && (
                            <p className="text-gray-700 mb-2">{event.description}</p>
                          )}
                          {event.attended && (
                            <span className="text-sm text-blue-600 bg-blue-100 rounded-full px-3 py-1 font-medium">
                              Attended
                            </span>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
