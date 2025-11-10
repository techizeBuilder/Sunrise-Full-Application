import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { AuthProvider } from "@/contexts/AuthContext";
import NotFound from "@/pages/not-found";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";

import Manufacturing from "@/pages/Manufacturing";
import Dispatches from "@/pages/Dispatches";
import Sales from "@/pages/Sales";
import Accounts from "@/pages/Accounts";
import ModernInventoryUI from "@/components/inventory/ModernInventoryUI";
import Customers from "@/pages/Customers";
import Suppliers from "@/pages/Suppliers";
import Purchases from "@/pages/Purchases";
import Settings from "@/pages/Settings";
import RolePermissionManagement from "@/pages/RolePermissionManagement";
import { useAuth } from "@/hooks/useAuth";
import MainLayout from "@/components/layout/MainLayout";
import Profile from "@/pages/Profile";
import Companies from "@/pages/Companies";
import MyOrders from "@/pages/sales/MyIndent";
import MyCustomers from "@/pages/sales/MyCustomers";
import MyDeliveries from "@/pages/sales/MyDeliveries";
import MyInvoices from "@/pages/sales/MyInvoices";

import RefundDamage from "@/pages/sales/RefundDamage";
import SalesDashboard from "@/pages/SalesDashboard";
import NewProductionPage from "@/pages/NewProductionPage";
import ProductionHistoryPage from "@/pages/ProductionHistoryPage";
import RoleBasedDashboard from "@/components/layout/RoleBasedDashboard";
import NotificationsPage from "@/pages/NotificationsPage";
import UnitHeadDashboard from "@/pages/UnitHeadDashboard";
import UnitHeadOrders from "@/pages/UnitHeadOrders";
import UnitHeadSales from "@/pages/UnitHeadSales";
import UnitHeadCustomers from "@/pages/UnitHeadCustomers";
import UnitManagerDashboard from "@/pages/UnitManagerDashboard";
import ProductionDashboard from "@/pages/ProductionDashboard";
import PackingDashboard from "@/pages/PackingDashboard";
import DispatchDashboard from "@/pages/DispatchDashboard";
import AccountsDashboard from "@/pages/AccountsDashboard";
import SalesApproval from "@/pages/SalesApproval";
import SalesOrderList from "@/pages/SalesOrderList";
import UnitManagerLayout from "@/components/layout/UnitManagerLayout";
import RoleBasedLayout from "@/components/layout/RoleBasedLayout";
function ProtectedRoute({ children, requiredRole = null }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  // Check role restriction if specified - STRICT role checking
  // Exception: Super User can access all pages regardless of role restriction
  if (requiredRole && user.role !== requiredRole && user.role !== 'Super User') {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Access Denied</h2>
            <p className="text-gray-600 dark:text-gray-400">
              You don't have permission to access this page. Required role: {requiredRole}
            </p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return <MainLayout>{children}</MainLayout>;
}

// Separate protected route for Unit Manager with their own layout
function UnitManagerProtectedRoute({ children, requiredRole = null }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  // Check role restriction if specified - STRICT role checking
  // Exception: Super User can access all pages regardless of role restriction
  if (requiredRole && user.role !== requiredRole && user.role !== 'Super User') {
    return (
      <UnitManagerLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Access Denied</h2>
            <p className="text-gray-600 dark:text-gray-400">
              You don't have permission to access this page. Required role: {requiredRole}
            </p>
          </div>
        </div>
      </UnitManagerLayout>
    );
  }

  return <UnitManagerLayout>{children}</UnitManagerLayout>;
}

// Protected route that uses appropriate layout based on user role
function RoleBasedProtectedRoute({ children, requiredRole = null }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return <RoleBasedLayout requiredRole={requiredRole}>{children}</RoleBasedLayout>;
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/">
        <ProtectedRoute>
          <RoleBasedDashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/dashboard">
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      </Route>

      <Route path="/manufacturing">
        <RoleBasedProtectedRoute>
          <Manufacturing />
        </RoleBasedProtectedRoute>
      </Route>
      <Route path="/production">
        <ProtectedRoute requiredRole="Production">
          <NewProductionPage />
        </ProtectedRoute>
      </Route>
      <Route path="/production/history">
        <ProtectedRoute requiredRole="Production">
          <ProductionHistoryPage />
        </ProtectedRoute>
      </Route>
      <Route path="/dispatches">
        <RoleBasedProtectedRoute>
          <Dispatches />
        </RoleBasedProtectedRoute>
      </Route>
      {/* Sales Submodules - specific routes first */}
      <Route path="/sales/orders">
        <ProtectedRoute>
          <MyOrders />
        </ProtectedRoute>
      </Route>
      <Route path="/sales/my-customers">
        <ProtectedRoute>
          <MyCustomers />
        </ProtectedRoute>
      </Route>
      <Route path="/sales/my-deliveries">
        <ProtectedRoute>
          <MyDeliveries />
        </ProtectedRoute>
      </Route>
      <Route path="/sales/my-invoices">
        <ProtectedRoute>
          <MyInvoices />
        </ProtectedRoute>
      </Route>

      <Route path="/sales/refund-return">
        <ProtectedRoute>
          <RefundDamage />
        </ProtectedRoute>
      </Route>
      
      {/* Main Sales route */}
      <Route path="/sales">
        <ProtectedRoute>
          <Sales />
        </ProtectedRoute>
      </Route>
      
      {/* Sales Dashboard route */}
      <Route path="/sales-dashboard">
        <ProtectedRoute>
          <SalesDashboard />
        </ProtectedRoute>
      </Route>
      
      <Route path="/accounts">
        <ProtectedRoute>
          <Accounts />
        </ProtectedRoute>
      </Route>
      <Route path="/inventory">
        <RoleBasedProtectedRoute>
          <ModernInventoryUI />
        </RoleBasedProtectedRoute>
      </Route>
      <Route path="/customers">
        <ProtectedRoute>
          <Customers />
        </ProtectedRoute>
      </Route>
      <Route path="/suppliers">
        <ProtectedRoute>
          <Suppliers />
        </ProtectedRoute>
      </Route>
      <Route path="/purchases">
        <ProtectedRoute>
          <Purchases />
        </ProtectedRoute>
      </Route>
      <Route path="/settings">
        <ProtectedRoute>
          <Settings />
        </ProtectedRoute>
      </Route>
      <Route path="/companies">
        <ProtectedRoute>
          <Companies />
        </ProtectedRoute>
      </Route>
      <Route path="/role-permission-management">
        <ProtectedRoute>
          <RolePermissionManagement />
        </ProtectedRoute>
      </Route>
      <Route path="/profile">
        <ProtectedRoute>
          <Profile />
        </ProtectedRoute>
      </Route>
      <Route path="/notifications">
        <ProtectedRoute>
          <NotificationsPage />
        </ProtectedRoute>
      </Route>
      
      {/* Role-specific Dashboard routes */}
      <Route path="/unit-head-dashboard">
        <ProtectedRoute requiredRole="Unit Head">
          <UnitHeadDashboard />
        </ProtectedRoute>
      </Route>
      
      {/* Unit Head specific routes */}
      <Route path="/unit-head/orders">
        <ProtectedRoute requiredRole="Unit Head">
          <UnitHeadOrders />
        </ProtectedRoute>
      </Route>
      <Route path="/unit-head/sales">
        <ProtectedRoute requiredRole="Unit Head">
          <UnitHeadSales />
        </ProtectedRoute>
      </Route>
      <Route path="/unit-head/customers">
        <ProtectedRoute requiredRole="Unit Head">
          <UnitHeadCustomers />
        </ProtectedRoute>
      </Route>
      
      {/* Unit Manager specific routes with dedicated layout */}
      <Route path="/unit-manager-dashboard">
        <UnitManagerProtectedRoute requiredRole="Unit Manager">
          <UnitManagerDashboard />
        </UnitManagerProtectedRoute>
      </Route>
      
      <Route path="/sales-approval">
        <UnitManagerProtectedRoute requiredRole="Unit Manager">
          <SalesApproval />
        </UnitManagerProtectedRoute>
      </Route>
      
      <Route path="/sales-order-list">
        <UnitManagerProtectedRoute requiredRole="Unit Manager">
          <SalesOrderList />
        </UnitManagerProtectedRoute>
      </Route>
      <Route path="/production-dashboard">
        <ProtectedRoute requiredRole="Production">
          <ProductionDashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/packing-dashboard">
        <ProtectedRoute requiredRole="Packing">
          <PackingDashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/dispatch-dashboard">
        <ProtectedRoute requiredRole="Dispatch">
          <DispatchDashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/accounts-dashboard">
        <ProtectedRoute requiredRole="Accounts">
          <AccountsDashboard />
        </ProtectedRoute>
      </Route>
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
