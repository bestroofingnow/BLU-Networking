import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useAuth } from '@/hooks/useAuth'
import { Calendar, Users, MessageSquare, Sparkles, TrendingUp, Award, MapPin } from 'lucide-react'
import { Link } from 'react-router-dom'

export function DashboardPage() {
  const { profile } = useAuth()

  const getInitials = (name: string | null) => {
    if (!name) return 'U'
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  // Placeholder stats - will be replaced with real data
  const stats = [
    { name: 'Connections', value: '24', icon: Users, color: 'text-blue-500' },
    { name: 'Events Attended', value: '8', icon: Calendar, color: 'text-green-500' },
    { name: 'Messages', value: '12', icon: MessageSquare, color: 'text-purple-500' },
    { name: 'Badges', value: '5', icon: Award, color: 'text-yellow-500' },
  ]

  // Placeholder AI suggestions
  const aiSuggestions = [
    {
      id: '1',
      name: 'Sarah Johnson',
      company: 'Tech Solutions Inc.',
      reason: 'You both specialize in digital marketing and attended the same event last month.',
      image: null,
    },
    {
      id: '2',
      name: 'Michael Chen',
      company: 'Growth Ventures',
      reason: 'Michael is looking for partnerships in your industry.',
      image: null,
    },
    {
      id: '3',
      name: 'Emily Rodriguez',
      company: 'Creative Agency Co.',
      reason: 'Emily offers design services you mentioned needing.',
      image: null,
    },
  ]

  // Placeholder upcoming events
  const upcomingEvents = [
    {
      id: '1',
      title: 'Weekly Networking Breakfast',
      date: 'Tomorrow, 8:00 AM',
      location: 'BLU HQ - Charlotte',
      attendees: 24,
    },
    {
      id: '2',
      title: 'Monthly Business Mixer',
      date: 'Feb 5, 6:00 PM',
      location: 'The Grand Ballroom',
      attendees: 56,
    },
  ]

  return (
    <div className="space-y-6">
      {/* Welcome section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Welcome back, {profile?.full_name?.split(' ')[0] || 'there'}!
          </h1>
          <p className="text-muted-foreground">
            Here's what's happening in your network today.
          </p>
        </div>
        <Button asChild>
          <Link to="/profile">
            Complete Your Profile
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.name}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.name}</CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* AI Suggestions */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <CardTitle>People You Should Meet</CardTitle>
            </div>
            <CardDescription>AI-powered connection suggestions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {aiSuggestions.map((suggestion) => (
              <div key={suggestion.id} className="flex items-start space-x-4">
                <Avatar>
                  <AvatarImage src={suggestion.image || undefined} />
                  <AvatarFallback>{getInitials(suggestion.name)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{suggestion.name}</p>
                  <p className="text-sm text-muted-foreground truncate">{suggestion.company}</p>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{suggestion.reason}</p>
                </div>
                <Button size="sm" variant="outline">Connect</Button>
              </div>
            ))}
            <Button variant="ghost" className="w-full" asChild>
              <Link to="/connections/suggestions">View All Suggestions</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Upcoming Events */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-primary" />
              <CardTitle>Upcoming Events</CardTitle>
            </div>
            <CardDescription>Events you should attend</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {upcomingEvents.map((event) => (
              <div key={event.id} className="flex items-start space-x-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Calendar className="h-6 w-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{event.title}</p>
                  <p className="text-sm text-muted-foreground">{event.date}</p>
                  <div className="flex items-center text-xs text-muted-foreground mt-1">
                    <MapPin className="h-3 w-3 mr-1" />
                    <span className="truncate">{event.location}</span>
                    <span className="mx-2">•</span>
                    <Users className="h-3 w-3 mr-1" />
                    <span>{event.attendees} attending</span>
                  </div>
                </div>
                <Button size="sm">RSVP</Button>
              </div>
            ))}
            <Button variant="ghost" className="w-full" asChild>
              <Link to="/events">View All Events</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Nearby Members */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <MapPin className="h-5 w-5 text-primary" />
              <CardTitle>Nearby Members</CardTitle>
            </div>
            <Button variant="outline" size="sm">
              Enable Location
            </Button>
          </div>
          <CardDescription>
            Members near your current location for coffee or lunch
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Enable location sharing to see nearby members</p>
            <p className="text-sm mt-1">Get notified when connections are nearby for spontaneous meetups</p>
          </div>
        </CardContent>
      </Card>

      {/* Activity & Leaderboard */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <CardTitle>Your Activity</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Profile Completeness</span>
                <span className="text-sm font-medium">{profile?.profile_completeness_score || 20}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all"
                  style={{ width: `${profile?.profile_completeness_score || 20}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Complete your profile to improve your connection matches
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Award className="h-5 w-5 text-primary" />
              <CardTitle>Leaderboard</CardTitle>
            </div>
            <CardDescription>Top networkers this month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { rank: 1, name: 'Alex Thompson', points: 1250 },
                { rank: 2, name: 'Jordan Lee', points: 1100 },
                { rank: 3, name: 'Sam Williams', points: 980 },
              ].map((leader) => (
                <div key={leader.rank} className="flex items-center space-x-3">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full font-bold text-sm ${
                    leader.rank === 1 ? 'bg-yellow-100 text-yellow-700' :
                    leader.rank === 2 ? 'bg-gray-100 text-gray-700' :
                    'bg-orange-100 text-orange-700'
                  }`}>
                    {leader.rank}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{leader.name}</p>
                  </div>
                  <span className="text-sm text-muted-foreground">{leader.points} pts</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
