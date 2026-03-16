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
import PwaPrompts from "@/components/PwaPrompts";

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

      {/* Group public pages */}
      <Route path="/g/:slug" component={GroupProfile} />
      <Route path="/report/:slug" component={SubmitReport} />

      {/* Protected */}
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/groups/new" component={CreateGroup} />
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
