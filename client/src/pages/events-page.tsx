import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, MapPin } from "lucide-react";
import { Link } from "wouter";

export default function EventsPage() {
  // Mock events data for the simplified page
  const upcomingEvents = [
    {
      id: 1,
      title: "BLU Networking Breakfast",
      date: "2025-05-10",
      startTime: "08:00",
      endTime: "10:00",
      location: "Charlotte Downtown Hotel",
      description: "Join us for our monthly networking breakfast where business leaders connect and share insights.",
      attendeeCount: 42
    },
    {
      id: 2,
      title: "Tech Industry Meetup",
      date: "2025-05-15",
      startTime: "18:00",
      endTime: "21:00",
      location: "Innovation Hub",
      description: "Special focus on emerging technologies and digital transformation opportunities.",
      attendeeCount: 35
    },
    {
      id: 3,
      title: "Small Business Forum",
      date: "2025-05-25",
      startTime: "14:00",
      endTime: "17:00",
      location: "Chamber of Commerce",
      description: "Discussion panels and networking focused on local small business growth strategies.",
      attendeeCount: 28
    }
  ];

  return (
    <div className="container mx-auto p-6">
      <header className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Upcoming Events</h1>
            <p className="text-gray-600 mt-2">Connect with other BLU members at our networking events</p>
          </div>
          
          <div className="mt-4 sm:mt-0">
            <Link href="/">
              <Button variant="outline">Back to Dashboard</Button>
            </Link>
          </div>
        </div>
      </header>
      
      <div className="grid grid-cols-1 gap-6">
        {upcomingEvents.map(event => (
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
                    <div className="flex items-center text-gray-600">
                      <Clock className="mr-2 h-4 w-4" /> 
                      {new Date(`2000-01-01T${event.startTime}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - 
                      {new Date(`2000-01-01T${event.endTime}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div className="flex items-center text-gray-600">
                      <MapPin className="mr-2 h-4 w-4" /> {event.location}
                    </div>
                  </div>
                  
                  <p className="text-gray-700 mb-4">{event.description}</p>
                  
                  <div className="flex flex-wrap items-center gap-4">
                    <span className="text-sm text-gray-600 bg-gray-100 rounded-full px-3 py-1">
                      {event.attendeeCount} Attendees
                    </span>
                    
                    <Button>Register Now</Button>
                    
                    <Button variant="outline">View Details</Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        
        <Card className="bg-gray-50 border-dashed">
          <CardContent className="p-10 text-center">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <CardTitle className="text-xl mb-2">Looking for more?</CardTitle>
            <p className="text-gray-600 mb-6">
              We're constantly adding new networking opportunities.
              Check back regularly or subscribe to event notifications.
            </p>
            <Button variant="outline">Subscribe to Updates</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}