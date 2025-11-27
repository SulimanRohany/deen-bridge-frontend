'use client'

import RoleProtectedRoute from '@/components/RoleProtectedRoute';

/**
 * Teacher Layout
 * Protects all teacher routes and ensures only teachers can access them
 */
export default function TeacherLayout({ children }) {
  return (
    <RoleProtectedRoute allowedRoles={['teacher']}>
      {children}
    </RoleProtectedRoute>
  );
}















