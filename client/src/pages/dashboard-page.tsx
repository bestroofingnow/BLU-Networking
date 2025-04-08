import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";

export default function DashboardPage() {
  return (
    <div className="container mx-auto p-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">BLU Networking Platform</h1>
        <p className="text-gray-600 mt-2">Welcome back! Here's your business networking dashboard.</p>
        
        <div className="mt-4 flex items-center gap-4">
          <Link href="/auth">
            <Button>Login/Register</Button>
          </Link>
          <Link href="/events">
            <Button variant="outline">View Events</Button>
          </Link>
        </div>
      </header>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Connections</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">127</div>
            <p className="text-xs text-muted-foreground">+7 from last month</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4</div>
            <p className="text-xs text-muted-foreground">Next: Apr 15 Mixer</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Leads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">3 need follow-up</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Lead Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$24,500</div>
            <p className="text-xs text-muted-foreground">+$3,200 this month</p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border-b pb-4">
                  <h3 className="font-medium mb-1">Charlotte Business Mixer</h3>
                  <p className="text-sm text-muted-foreground mb-2">You registered for this event on April 5, 2025</p>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">View Details</Button>
                    <Button size="sm">Add to Calendar</Button>
                  </div>
                </div>
                <div className="border-b pb-4">
                  <h3 className="font-medium mb-1">Monthly Networking Breakfast</h3>
                  <p className="text-sm text-muted-foreground mb-2">Attending on April 20, 2025 at Downtown Cafe</p>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">View Details</Button>
                  </div>
                </div>
                <div className="border-b pb-4">
                  <h3 className="font-medium mb-1">New Connection: Sarah Johnson</h3>
                  <p className="text-sm text-muted-foreground mb-2">Marketing Director at TechCorp Inc.</p>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">View Profile</Button>
                    <Button size="sm">Send Message</Button>
                  </div>
                </div>
              </div>
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
                <Button className="w-full justify-start" variant="outline">
                  Record New Lead
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  Browse Member Directory
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  Register for an Event
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  Update Your Profile
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Tips & Resources</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-sm mb-1">Networking Best Practices</h3>
                  <p className="text-xs text-muted-foreground">Learn how to make the most of your connections</p>
                </div>
                <div>
                  <h3 className="font-medium text-sm mb-1">Follow-up Templates</h3>
                  <p className="text-xs text-muted-foreground">Email templates for effective lead nurturing</p>
                </div>
                <div>
                  <h3 className="font-medium text-sm mb-1">Digital Business Card</h3>
                  <p className="text-xs text-muted-foreground">Share your info quickly with QR code</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}