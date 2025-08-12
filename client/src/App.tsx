import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import EmployeeDashboard from "@/pages/employee-dashboard";
import TrainingModule from "@/pages/training-module";

import SectionAssessment from "@/pages/section-assessment";
import AdminDashboard from "@/pages/admin-dashboard";
import UserManager from "@/pages/user-manager";
import Navbar from "@/components/navbar";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      {isAuthenticated && <Navbar />}
      <Switch>
        {!isAuthenticated ? (
          <Route path="/" component={Login} />
        ) : (
          <>
            <Route path="/" component={EmployeeDashboard} />
            <Route path="/training/:moduleId" component={TrainingModule} />

            <Route path="/assessment/section/:sectionId" component={SectionAssessment} />
            <Route path="/admin" component={AdminDashboard} />
            <Route path="/admin/users" component={UserManager} />
          </>
        )}
        <Route component={NotFound} />
      </Switch>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
