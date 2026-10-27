import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { isPublicPath, signInDestination } from '@/lib/appAccess';
export default function AppAccessBoundary() {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (isPublicPath(location.pathname)) return <Outlet />;
  if (loading) return <div role="status" aria-label="Checking sign-in" className="min-h-screen bg-background flex items-center justify-center"><div className="h-10 w-10 animate-spin rounded-full border-b-2 border-primary" /></div>;
  if (!user) return <Navigate replace to={signInDestination(location.pathname + location.search + location.hash)} />;
  return <Outlet />;
}