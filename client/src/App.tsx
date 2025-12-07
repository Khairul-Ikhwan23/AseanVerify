import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { authManager } from "@/lib/auth";
import BottomNavigation from "@/components/bottom-navigation";
import Login from "@/pages/login";
import Signup from "@/pages/signup";
import Dashboard from "@/pages/dashboard";
import ProfileForm from "@/pages/profile-form";
import Passport from "@/pages/passport";
import ScanQR from "@/pages/scan-qr";
import Verification from "@/pages/verification";
import Activities from "@/pages/activities";
import AdminApprove from "@/pages/admin-approve";
import AdminBusinesses from "@/pages/admin-businesses";
import AdminManageUsers from "@/pages/admin-manage-users";
import BusinessVerificationPayment from "@/pages/business-verification-payment";
import VerifyBusiness from "@/pages/verify-business";
import NotFound from "@/pages/not-found";

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const isAuthenticated = authManager.isAuthenticated();
  
  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }
  
  return <Component />;
}

function Router() {
  const isAuthenticated = authManager.isAuthenticated();

  return (
    <Switch>
      <Route path="/" component={() => <Redirect to={isAuthenticated ? "/dashboard" : "/login"} />} />
      <Route path="/login" component={Login} />
      <Route path="/signup" component={Signup} />
      <Route path="/dashboard" component={() => <ProtectedRoute component={Dashboard} />} />
      <Route path="/profile-form" component={() => <ProtectedRoute component={ProfileForm} />} />
      <Route path="/passport" component={() => <ProtectedRoute component={Passport} />} />
      <Route path="/scan-qr" component={() => <ProtectedRoute component={ScanQR} />} />
      <Route path="/verification" component={() => <ProtectedRoute component={Verification} />} />
      <Route path="/activities" component={() => <ProtectedRoute component={Activities} />} />
      <Route path="/admin-approve" component={() => <ProtectedRoute component={AdminApprove} />} />
      <Route path="/admin-businesses" component={() => <ProtectedRoute component={AdminBusinesses} />} />
      <Route path="/admin-manage-users" component={() => <ProtectedRoute component={AdminManageUsers} />} />
      <Route path="/business-verification-payment" component={() => <ProtectedRoute component={BusinessVerificationPayment} />} />
      <Route path="/verify-business" component={VerifyBusiness} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
        <BottomNavigation />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
