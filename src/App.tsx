import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components";
import { AuthProvider, useAuth } from "@/contexts";
import { ProfileProvider } from "@/contexts";
import { MatchesProvider } from "@/contexts";
import { RealtimeProvider } from "@/contexts";
import Landing from "@/pages/landing";
import Home from "@/pages/home";
import FeeldHome from "@/pages/feeld-home";
import Subscribe from "@/pages/subscribe";
import SubscriptionTiers from "@/pages/subscription-tiers";
import Store from "./pages/store";
import Search from "./pages/Search";
import AdminDashboard from "./pages/admin-dashboard";
import AdminConsole from "./pages/admin-console";
import PhotoUpload from "./pages/photo-upload";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isInitializing } = useAuth();

  return (
    <Switch>
      {/* Landing page - always accessible */}
      <Route path="/landing" component={Landing} />
      
      {isInitializing || !isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          <Route path="/" component={FeeldHome} />
          <Route path="/subscribe" component={Subscribe} />
          <Route path="/subscription-tiers" component={SubscriptionTiers} />
          <Route path="/search" component={Search} />
          <Route path="/admin" component={AdminDashboard} />
          <Route path="/admin-console" component={AdminConsole} />
          <Route path="/feeld" component={FeeldHome} />
          <Route path="/store" component={Store} />
          <Route path="/upload" component={PhotoUpload} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ProfileProvider>
          <MatchesProvider>
            <RealtimeProvider>
              <ThemeProvider>
                <TooltipProvider>
                  <Toaster />
                  <Router />
                </TooltipProvider>
              </ThemeProvider>
            </RealtimeProvider>
          </MatchesProvider>
        </ProfileProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;