import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAuth } from '@/hooks/useAuth'
import { Layout } from '@/components/layout/Layout'
import { LoginPage } from '@/pages/auth/LoginPage'
import { SignupPage } from '@/pages/auth/SignupPage'
import { DashboardPage } from '@/pages/dashboard/DashboardPage'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
})

// Protected route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />
  }

  return <>{children}</>
}

// Public route wrapper (redirect if authenticated)
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}

// Placeholder pages
function EventsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Events</h1>
      <p className="text-muted-foreground">Upcoming networking events will be shown here.</p>
    </div>
  )
}

function DirectoryPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Member Directory</h1>
      <p className="text-muted-foreground">Browse and search all BLU members.</p>
    </div>
  )
}

function ConnectionsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Connections</h1>
      <p className="text-muted-foreground">Manage your network connections.</p>
    </div>
  )
}

function MessagesPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Messages</h1>
      <p className="text-muted-foreground">Your conversations with other members.</p>
    </div>
  )
}

function ProfilePage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">My Profile</h1>
      <p className="text-muted-foreground">Edit your profile information.</p>
    </div>
  )
}

function AdminPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>
      <p className="text-muted-foreground">Manage members, events, and settings.</p>
    </div>
  )
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route
            path="/auth/login"
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            }
          />
          <Route
            path="/auth/signup"
            element={
              <PublicRoute>
                <SignupPage />
              </PublicRoute>
            }
          />
          <Route path="/auth/callback" element={<Navigate to="/dashboard" replace />} />

          {/* Protected routes */}
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/events" element={<EventsPage />} />
            <Route path="/events/:id" element={<EventsPage />} />
            <Route path="/directory" element={<DirectoryPage />} />
            <Route path="/connections" element={<ConnectionsPage />} />
            <Route path="/connections/suggestions" element={<ConnectionsPage />} />
            <Route path="/messages" element={<MessagesPage />} />
            <Route path="/messages/:conversationId" element={<MessagesPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/profile/:userId" element={<ProfilePage />} />
            <Route path="/admin/*" element={<AdminPage />} />
          </Route>

          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
