'use client'

import RoleProtectedRoute from '@/components/RoleProtectedRoute';

/**
 * Parent Layout
 * Protects all parent routes and ensures only parents can access them
 */
export default function ParentLayout({ children }) {
  return (
    <RoleProtectedRoute allowedRoles={['parent']}>
      {children}
    </RoleProtectedRoute>
  );
}


