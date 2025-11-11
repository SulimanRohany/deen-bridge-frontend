'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import ProtectedRoute from "@/components/ProtectedRoute"

/**
 * @deprecated This route is deprecated. Students are redirected to the main homepage.
 * The new student dashboard is now at the root path (/).
 */
export default function StudentDashboard() {
  const router = useRouter()

  useEffect(() => {
    // Redirect students to the new homepage
    router.push('/')
  }, [router])

  return (
    <ProtectedRoute>
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2">Redirecting...</h2>
          <p className="text-muted-foreground">Taking you to your dashboard</p>
        </div>
      </div>
    </ProtectedRoute>
  )
}