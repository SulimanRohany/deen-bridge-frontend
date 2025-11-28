'use client'

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';

/**
 * Role-based access control component
 * Protects routes based on user roles and prevents unauthorized access
 * 
 * @param {Object} props
 * @param {string[]} props.allowedRoles - Array of roles that can access this route
 * @param {React.ReactNode} props.children - Child components to render if authorized
 * @param {string} props.redirectTo - Optional custom redirect path
 */
const RoleProtectedRoute = ({ children, allowedRoles = [], redirectTo = null }) => {
  const { userData, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      // If user is not logged in, redirect to login
      if (!userData) {
        toast.error('Please login to access this page');
        router.push('/login');
        return;
      }

      // If user doesn't have the required role, redirect appropriately
      if (!allowedRoles.includes(userData.role)) {
        toast.error('You do not have permission to access this page');
        
        // Redirect based on user role if no custom redirect is specified
        if (redirectTo) {
          router.push(redirectTo);
        } else {
          // Redirect to the appropriate dashboard based on user role
          switch (userData.role) {
            case 'super_admin':
              router.push('/dashboard/super-admin');
              break;
            case 'teacher':
              router.push('/dashboard/teacher');
              break;
            case 'student':
              router.push('/');
              break;
            case 'parent':
              router.push('/dashboard/parent');
              break;
            default:
              router.push('/');
          }
        }
      }
    }
  }, [userData, loading, router, allowedRoles, redirectTo]);

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render anything if user is not authenticated or doesn't have permission
  if (!userData || !allowedRoles.includes(userData.role)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2">Access Denied</h2>
          <p className="text-muted-foreground">Redirecting...</p>
        </div>
      </div>
    );
  }

  // User is authenticated and has the correct role
  return children;
};

export default RoleProtectedRoute;

















