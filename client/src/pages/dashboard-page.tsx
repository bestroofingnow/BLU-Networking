import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

export default function DashboardPage() {
  const { user } = useAuth();

  const { data: dashboardStats, isLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
    enabled: !!user,
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
          <h1 className="text-3xl font-bold text-gray-800">BLU Networking Platform</h1>
          <p className="text-gray-600 mt-2">Welcome! Please log in to access your dashboard.</p>

          <div className="mt-4 flex items-center gap-4">
            <Link href="/auth">
              <Button>Login/Register</Button>
            </Link>
          </div>
        </header>
      </div>
    );
  }

  const stats = dashboardStats || {
    totalConnections: 0,
    upcomingEventsCount: 0,
    upcomingEvents: [],
    activeLeadsCount: 0,
    needsFollowUpCount: 0,
    totalLeadValue: 0,
    eventsAttended: 0,
  };

  return (
    <div className="container mx-auto p-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">BLU Networking Platform</h1>
        <p className="text-gray-600 mt-2">Welcome back, {user.username}! Here's your business networking dashboard.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Connections</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalConnections}</div>
            <p className="text-xs text-muted-foreground">Members in your organization</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.upcomingEventsCount}</div>
            <p className="text-xs text-muted-foreground">
              {stats.upcomingEvents.length > 0
                ? `Next: ${new Date(stats.upcomingEvents[0].date).toLocaleDateString()}`
                : 'No upcoming events'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Leads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeLeadsCount}</div>
            <p className="text-xs text-muted-foreground">
              {stats.needsFollowUpCount > 0
                ? `${stats.needsFollowUpCount} need follow-up`
                : 'All leads up to date'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Lead Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${stats.totalLeadValue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Total estimated value</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Events</CardTitle>
            </CardHeader>
            <CardContent>
              {stats.upcomingEvents.length > 0 ? (
                <div className="space-y-4">
                  {stats.upcomingEvents.map((event) => (
                    <div key={event.id} className="border-b pb-4 last:border-b-0">
                      <h3 className="font-medium mb-1">{event.title}</h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        {new Date(event.date).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                        {event.startTime && ` at ${event.startTime}`}
                      </p>
                      {event.location && (
                        <p className="text-sm text-muted-foreground mb-2">
                          Location: {event.location}
                        </p>
                      )}
                      <div className="flex items-center gap-2">
                        <Link href={`/events`}>
                          <Button variant="outline" size="sm">View Details</Button>
                        </Link>
                        {!event.isRegistered && (
                          <Button size="sm">Register</Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No upcoming events scheduled</p>
                  <Link href="/admin">
                    <Button variant="link" className="mt-2">Create an event</Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Link href="/leads">
                  <Button className="w-full justify-start" variant="outline">
                    Record New Lead
                  </Button>
                </Link>
                <Link href="/members">
                  <Button className="w-full justify-start" variant="outline">
                    Browse Member Directory
                  </Button>
                </Link>
                <Link href="/events">
                  <Button className="w-full justify-start" variant="outline">
                    View Events
                  </Button>
                </Link>
                <Link href="/profile">
                  <Button className="w-full justify-start" variant="outline">
                    Update Your Profile
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Your Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-sm mb-1">Events Attended</h3>
                  <p className="text-2xl font-bold">{stats.eventsAttended}</p>
                </div>
                <div>
                  <h3 className="font-medium text-sm mb-1">Active Leads</h3>
                  <p className="text-2xl font-bold">{stats.activeLeadsCount}</p>
                </div>
                <div>
                  <h3 className="font-medium text-sm mb-1">Network Size</h3>
                  <p className="text-2xl font-bold">{stats.totalConnections}</p>
                </div>
                <Link href="/networking-tips">
                  <Button variant="outline" className="w-full mt-4">
                    Get Networking Tips
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
