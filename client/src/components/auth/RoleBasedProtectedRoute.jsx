import { useAuth } from '@/hooks/useAuth';
import Login from '@/pages/Login';
import RoleBasedLayout from '@/components/layout/RoleBasedLayout';

export function RoleBasedProtectedRoute({ children, requiredRole = null }) {
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