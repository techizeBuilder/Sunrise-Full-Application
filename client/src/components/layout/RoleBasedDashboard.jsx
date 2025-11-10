import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { useLocation } from "wouter";
import Dashboard from "@/pages/Dashboard";
import SalesDashboard from "@/pages/SalesDashboard";
import UnitHeadDashboard from "@/pages/UnitHeadDashboard";
import UnitManagerDashboard from "@/pages/UnitManagerDashboard";
import ProductionDashboard from "@/pages/ProductionDashboard";
import PackingDashboard from "@/pages/PackingDashboard";
import DispatchDashboard from "@/pages/DispatchDashboard";
import AccountsDashboard from "@/pages/AccountsDashboard";

export default function RoleBasedDashboard() {
  const { user } = useAuth();
  const [location, setLocation] = useLocation();

  useEffect(() => {
    // If user has specific role, redirect to their dashboard
    if (user && location === '/') {
      switch (user.role) {
        case 'Unit Head':
          setLocation('/unit-head-dashboard');
          return;
        case 'Unit Manager':
          setLocation('/unit-manager-dashboard');
          return;
        case 'Sales':
          setLocation('/sales-dashboard');
          return;
        case 'Production':
          setLocation('/production-dashboard');
          return;
        case 'Packing':
          setLocation('/packing-dashboard');
          return;
        case 'Dispatch':
          setLocation('/dispatch-dashboard');
          return;
        case 'Accounts':
          setLocation('/accounts-dashboard');
          return;
        default:
          // Super User and others stay on main dashboard
          break;
      }
    }
  }, [user, location, setLocation]);

  // For direct dashboard access, show appropriate dashboard based on role
  switch (user?.role) {
    case 'Unit Head':
      return <UnitHeadDashboard />;
    case 'Unit Manager':
      return <UnitManagerDashboard />;
    case 'Sales':
      return <SalesDashboard />;
    case 'Production':
      return <ProductionDashboard />;
    case 'Packing':
      return <PackingDashboard />;
    case 'Dispatch':
      return <DispatchDashboard />;
    case 'Accounts':
      return <AccountsDashboard />;
    default:
      // Default to main dashboard for Super User and others
      return <Dashboard />;
  }
}