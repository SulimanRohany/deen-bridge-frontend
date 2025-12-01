'use client'
import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import ResetPasswordForm from "@/components/forms/reset-password-form"

export default function ResetPasswordPage() {
    const params = useParams()
    const [token, setToken] = useState(null)
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
        // Get token from params
        if (params && params.token) {
            // Handle both string and array cases
            const tokenParam = params.token
            const tokenValue = Array.isArray(tokenParam) ? tokenParam[0] : String(tokenParam)
            if (tokenValue && tokenValue.trim()) {
                setToken(tokenValue.trim())
            }
        }
    }, [params])

    // Show loading state while mounting
    if (!mounted) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-background">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-4 text-muted-foreground">Loading...</p>
                </div>
            </div>
        )
    }

    // Show error if no token
    if (!token) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-background">
                <div className="text-center max-w-md p-6">
                    <h1 className="text-2xl font-bold mb-2 text-foreground">Invalid Reset Link</h1>
                    <p className="text-muted-foreground mb-4">The password reset link is invalid or missing.</p>
                    <p className="text-sm text-muted-foreground">
                        Please request a new password reset link from the login page.
                    </p>
                </div>
            </div>
        )
    }

    // Render the form with token
    return <ResetPasswordForm token={token} />
}


