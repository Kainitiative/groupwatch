import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

// Pages
import Landing from "@/pages/Landing";
import Login from "@/pages/auth/Login";
import Register from "@/pages/auth/Register";
import ForgotPassword from "@/pages/auth/ForgotPassword";
import ResetPassword from "@/pages/auth/ResetPassword";
import Dashboard from "@/pages/Dashboard";
import CreateGroup from "@/pages/groups/CreateGroup";
import GroupProfile from "@/pages/groups/GroupProfile";
import GroupSettings from "@/pages/groups/GroupSettings";
import SubmitReport from "@/pages/reports/SubmitReport";
import MyReports from "@/pages/reports/MyReports";
import SuperAdmin from "@/pages/admin/SuperAdmin";
import ReportsDashboard from "@/pages/groups/ReportsDashboard";
import ReportDetail from "@/pages/groups/ReportDetail";
import ReportPrint from "@/pages/groups/ReportPrint";
import Analytics from "@/pages/groups/Analytics";
import MapBoundaries from "@/pages/groups/MapBoundaries";
import PwaPrompts from "@/components/PwaPrompts";
// Public content pages
import Pricing from "@/pages/Pricing";
import Features from "@/pages/Features";
import OfflinePwa from "@/pages/OfflinePwa";
import Help from "@/pages/Help";
import Legal from "@/pages/Legal";
import Contact from "@/pages/Contact";
// Pillar pages
import AnglingClubs from "@/pages/pillar/AnglingClubs";
import EnvironmentalGroups from "@/pages/pillar/EnvironmentalGroups";
import SportsClubs from "@/pages/pillar/SportsClubs";
import NeighbourhoodWatch from "@/pages/pillar/NeighbourhoodWatch";
import HOA from "@/pages/pillar/HOA";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function Router() {
  return (
    <Switch>
      {/* Public */}
      <Route path="/" component={Landing} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/reset-password/:token" component={ResetPassword} />

      {/* Content pages */}
      <Route path="/pricing" component={Pricing} />
      <Route path="/features" component={Features} />
      <Route path="/offline" component={OfflinePwa} />
      <Route path="/help" component={Help} />
      <Route path="/legal" component={Legal} />
      <Route path="/contact" component={Contact} />

      {/* Pillar pages */}
      <Route path="/for/angling" component={AnglingClubs} />
      <Route path="/for/environment" component={EnvironmentalGroups} />
      <Route path="/for/sports" component={SportsClubs} />
      <Route path="/for/neighbourhood-watch" component={NeighbourhoodWatch} />
      <Route path="/for/residents" component={HOA} />

      {/* /demo → redirect to register */}
      <Route path="/demo" component={Register} />

      {/* Group public pages */}
      <Route path="/g/:slug" component={GroupProfile} />
      <Route path="/report/:slug" component={SubmitReport} />

      {/* Protected */}
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/groups/new" component={CreateGroup} />
      <Route path="/g/:slug/reports/:ref/print" component={ReportPrint} />
      <Route path="/g/:slug/reports/:ref" component={ReportDetail} />
      <Route path="/g/:slug/reports" component={ReportsDashboard} />
      <Route path="/g/:slug/analytics" component={Analytics} />
      <Route path="/g/:slug/map" component={MapBoundaries} />
      <Route path="/g/:slug/settings" component={GroupSettings} />
      <Route path="/my-reports" component={MyReports} />
      <Route path="/admin" component={SuperAdmin} />

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider delayDuration={300}>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <PwaPrompts />
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
