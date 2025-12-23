import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export default function ProtectedRoute({
  children,
  requireAdmin = false,
}: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else if (user.passwordChangeRequired && router.pathname !== '/change-password') {
        router.push('/change-password');
      } else if (requireAdmin && !user.isAdmin) {
        router.push('/');
      }
    }
  }, [user, loading, requireAdmin, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || (requireAdmin && !user.isAdmin)) {
    return null;
  }

  if (user.passwordChangeRequired && router.pathname !== '/change-password') {
    return null;
  }

  return <>{children}</>;
}
