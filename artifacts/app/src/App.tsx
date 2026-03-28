import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
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
import JoinGroup from "@/pages/groups/JoinGroup";
import GroupProfile from "@/pages/groups/GroupProfile";
import SubmitReport from "@/pages/reports/SubmitReport";
import MyReports from "@/pages/reports/MyReports";
import SuperAdmin from "@/pages/admin/SuperAdmin";
import ReportsDashboard from "@/pages/groups/ReportsDashboard";
import ReportDetail from "@/pages/groups/ReportDetail";
import ReportPrint from "@/pages/groups/ReportPrint";
import PublicReport from "@/pages/groups/PublicReport";
import Analytics from "@/pages/groups/Analytics";
import MapBoundaries from "@/pages/groups/MapBoundaries";
import PwaPrompts from "@/components/PwaPrompts";

// Settings sub-pages
import GroupSettingsProfile from "@/pages/groups/settings/GroupSettingsProfile";
import GroupSettingsMembers from "@/pages/groups/settings/GroupSettingsMembers";
import GroupSettingsIncidentTypes from "@/pages/groups/settings/GroupSettingsIncidentTypes";
import GroupSettingsEscalation from "@/pages/groups/settings/GroupSettingsEscalation";
import GroupSettingsBilling from "@/pages/groups/settings/GroupSettingsBilling";
import GroupSettingsWidget from "@/pages/groups/settings/GroupSettingsWidget";
import GroupSettingsApiKeys from "@/pages/groups/settings/GroupSettingsApiKeys";
import GroupSettingsSocial from "@/pages/groups/settings/GroupSettingsSocial";

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
import TidyTowns from "@/pages/pillar/TidyTowns";

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
      <Route path="/for/tidy-towns" component={TidyTowns} />

      {/* /demo → redirect to register */}
      <Route path="/demo" component={Register} />

      {/* Group public pages */}
      <Route path="/g/:slug" component={GroupProfile} />
      <Route path="/report/:slug" component={SubmitReport} />
      <Route path="/r/:slug" component={PublicReport} />

      {/* Group join */}
      <Route path="/groups/join/:token" component={JoinGroup} />

      {/* Protected */}
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/groups/new" component={CreateGroup} />
      <Route path="/g/:slug/reports/:ref/print" component={ReportPrint} />
      <Route path="/g/:slug/reports/:ref" component={ReportDetail} />
      <Route path="/g/:slug/reports" component={ReportsDashboard} />
      <Route path="/g/:slug/analytics" component={Analytics} />
      <Route path="/g/:slug/map" component={MapBoundaries} />

      {/* Settings sub-pages — must come before the catch-all redirect */}
      <Route path="/g/:slug/settings/profile" component={GroupSettingsProfile} />
      <Route path="/g/:slug/settings/members" component={GroupSettingsMembers} />
      <Route path="/g/:slug/settings/incident-types" component={GroupSettingsIncidentTypes} />
      <Route path="/g/:slug/settings/escalation" component={GroupSettingsEscalation} />
      <Route path="/g/:slug/settings/billing" component={GroupSettingsBilling} />
      <Route path="/g/:slug/settings/widget" component={GroupSettingsWidget} />
      <Route path="/g/:slug/settings/api-keys" component={GroupSettingsApiKeys} />
      <Route path="/g/:slug/settings/social" component={GroupSettingsSocial} />

      {/* /g/:slug/settings → redirect to profile sub-page */}
      <Route path="/g/:slug/settings">
        {(params) => <Redirect to={`/g/${params.slug}/settings/profile`} />}
      </Route>

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
