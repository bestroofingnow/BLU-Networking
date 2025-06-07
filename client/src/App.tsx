import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import DashboardPage from "@/pages/dashboard-page";
import EventsPage from "@/pages/events-page";
import MembersPage from "@/pages/members-page";
import LeadsPage from "@/pages/leads-page";
import AnalyticsPage from "@/pages/analytics-page";
import ProfilePage from "@/pages/profile-page";
import AdminPage from "@/pages/admin-page";
import AuthPage from "@/pages/auth-page";
import NetworkingTipsPage from "@/pages/networking-tips-page";
import BoardMinutesPage from "@/pages/board-minutes-page";
import LandingPage from "@/pages/landing-page";
import { ProtectedRoute } from "./lib/protected-route";

function App() {
  return (
    <>
      <Switch>
        <Route path="/" component={LandingPage} />
        <Route path="/auth" component={AuthPage} />
        <ProtectedRoute path="/dashboard" component={DashboardPage} />
        <ProtectedRoute path="/events" component={EventsPage} />
        <ProtectedRoute path="/members" component={MembersPage} />
        <ProtectedRoute path="/leads" component={LeadsPage} />
        <ProtectedRoute path="/analytics" component={AnalyticsPage} />
        <ProtectedRoute path="/networking-tips" component={NetworkingTipsPage} />
        <ProtectedRoute path="/board-minutes" component={BoardMinutesPage} />
        <ProtectedRoute path="/profile" component={ProfilePage} />
        <ProtectedRoute path="/admin" component={AdminPage} />
        <Route component={NotFound} />
      </Switch>
      <Toaster />
    </>
  );
}

export default App;
