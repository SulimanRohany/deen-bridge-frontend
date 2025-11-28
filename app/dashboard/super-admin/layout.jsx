'use client'

import RoleProtectedRoute from '@/components/RoleProtectedRoute';

/**
 * Super Admin Layout
 * Protects all super-admin routes and ensures only super admins can access them
 */
export default function SuperAdminLayout({ children }) {
  return (
    <RoleProtectedRoute allowedRoles={['super_admin']}>
      {children}
    </RoleProtectedRoute>
  );
}


















