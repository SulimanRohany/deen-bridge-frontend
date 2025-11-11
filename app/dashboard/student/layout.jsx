'use client'

import RoleProtectedRoute from '@/components/RoleProtectedRoute';

/**
 * Student Layout
 * Protects all student routes and ensures only students can access them
 * Note: Student dashboard is deprecated and redirects to homepage
 */
export default function StudentLayout({ children }) {
  return (
    <RoleProtectedRoute allowedRoles={['student']}>
      {children}
    </RoleProtectedRoute>
  );
}






