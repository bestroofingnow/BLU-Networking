import { Link, useLocation } from 'react-router-dom'
import { Bell, Menu, User, MessageSquare, Calendar, Users, LayoutDashboard, LogOut, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useAuth } from '@/hooks/useAuth'
import { useState } from 'react'

export function Header() {
  const { profile, signOut, isAdmin } = useAuth()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Events', href: '/events', icon: Calendar },
    { name: 'Directory', href: '/directory', icon: Users },
    { name: 'Connections', href: '/connections', icon: User },
    { name: 'Messages', href: '/messages', icon: MessageSquare },
  ]

  const getInitials = (name: string | null | undefined) => {
    if (!name) return 'U'
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link to="/dashboard" className="flex items-center space-x-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
            B
          </div>
          <span className="font-bold text-xl hidden sm:inline-block">BLU Networking</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-1">
          {navigation.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.href || location.pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{item.name}</span>
              </Link>
            )
          })}
          {isAdmin && (
            <Link
              to="/admin"
              className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                location.pathname.startsWith('/admin')
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              }`}
            >
              <Settings className="h-4 w-4" />
              <span>Admin</span>
            </Link>
          )}
        </nav>

        {/* Right side */}
        <div className="flex items-center space-x-2">
          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-destructive" />
          </Button>

          {/* Profile dropdown */}
          <Link to="/profile">
            <Avatar className="h-8 w-8 cursor-pointer">
              <AvatarImage src={profile?.profile_image_url || undefined} />
              <AvatarFallback>{getInitials(profile?.full_name)}</AvatarFallback>
            </Avatar>
          </Link>

          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t bg-background">
          <nav className="container px-4 py-2 space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.href || location.pathname.startsWith(item.href + '/')
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </Link>
              )
            })}
            {isAdmin && (
              <Link
                to="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  location.pathname.startsWith('/admin')
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                }`}
              >
                <Settings className="h-5 w-5" />
                <span>Admin</span>
              </Link>
            )}
            <button
              onClick={() => {
                signOut()
                setMobileMenuOpen(false)
              }}
              className="flex w-full items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
            >
              <LogOut className="h-5 w-5" />
              <span>Sign Out</span>
            </button>
          </nav>
        </div>
      )}
    </header>
  )
}
