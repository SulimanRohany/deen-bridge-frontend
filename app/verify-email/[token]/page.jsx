'use client'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { authAPI } from '@/lib/api'
import { IconCheck, IconAlertCircle, IconLoader2 } from '@tabler/icons-react'
import { useTheme } from "next-themes"

export default function VerifyEmailPage() {
    const params = useParams()
    const router = useRouter()
    const [token, setToken] = useState(null)
    const [mounted, setMounted] = useState(false)
    const [loading, setLoading] = useState(true)
    const [verified, setVerified] = useState(false)
    const [error, setError] = useState(null)
    const [isLocked, setIsLocked] = useState(false)
    const [userEmail, setUserEmail] = useState(null)
    const { resolvedTheme } = useTheme()

    const verifyEmail = useCallback(async (verificationToken) => {
        try {
            const response = await authAPI.verifyEmail(verificationToken)
            if (response.status === 200) {
                setVerified(true)
                setTimeout(() => {
                    router.push('/login')
                }, 3000)
            }
        } catch (err) {
            const errorMessage = err.response?.data?.token?.[0] 
                || err.response?.data?.message
                || 'Invalid or expired verification link. Please request a new verification email.'
            setError(errorMessage)
            
            // Check if account is locked
            if (errorMessage.includes('Too many verification attempts') || errorMessage.includes('locked')) {
                setIsLocked(true)
            }
            
            // Try to extract email from error response for resend functionality
            const email = err.response?.data?.email
            if (email) {
                setUserEmail(email)
            }
        } finally {
            setLoading(false)
        }
    }, [router])

    useEffect(() => {
        setMounted(true)
        if (params && params.token) {
            const tokenParam = params.token
            const tokenValue = Array.isArray(tokenParam) ? tokenParam[0] : String(tokenParam)
            if (tokenValue && tokenValue.trim()) {
                setToken(tokenValue.trim())
                verifyEmail(tokenValue.trim())
            } else {
                setError('Invalid verification link.')
                setLoading(false)
            }
        } else {
            setError('Verification link is missing.')
            setLoading(false)
        }
    }, [params, verifyEmail])

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

    return (
        <div className="min-h-screen flex transition-opacity duration-300">
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-primary via-primary/90 to-secondary p-12 flex-col justify-between">
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute inset-0 opacity-10">
                        <div className="absolute top-20 left-20 w-64 h-64 border-2 border-white rounded-full animate-spin-slow"></div>
                        <div className="absolute bottom-20 right-20 w-48 h-48 border-2 border-white rounded-full animate-float"></div>
                        <div className="absolute top-1/2 left-1/3 w-32 h-32 border-2 border-white rotate-45 animate-float-delayed"></div>
                    </div>
                    <div className="absolute top-0 -left-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse-slow"></div>
                    <div className="absolute bottom-0 -right-1/4 w-96 h-96 bg-secondary/20 rounded-full blur-3xl animate-pulse-slow" style={{animationDelay: '2s'}}></div>
                </div>

                <div className="relative z-10">
                    <Link href="/" className="inline-block group">
                        <div className="w-36 h-36 rounded-xl bg-white backdrop-blur-sm flex items-center justify-center border-2 border-white shadow-2xl group-hover:scale-110 transition-transform duration-300">
                            <Image 
                                src="/Transparent Version of Logo.png" 
                                alt="Deen Bridge Logo" 
                                width={144} 
                                height={144}
                                className="object-contain drop-shadow-lg w-full h-full"
                            />
                        </div>
                    </Link>
                </div>

                <div className="relative z-10 space-y-6 animate-fade-in-up" style={{animationDelay: '0.2s'}}>
                    <div className="space-y-2">
                        <h1 className="text-5xl font-bold text-white leading-tight">
                            {verified ? 'Email Verified!' : 'Verifying Email'}
                        </h1>
                        <p className="text-xl text-white/90">
                            {verified 
                                ? 'Your email has been successfully verified'
                                : 'Please wait while we verify your email address'
                            }
                        </p>
                    </div>
                </div>

                <div className="relative z-10 text-white/70 text-sm">
                    <p>© 2024 Deen Bridge. All rights reserved.</p>
                </div>
            </div>

            <div className='flex-1 flex items-center justify-center p-4 sm:p-8 bg-background'>
                <div className="w-full max-w-md">
                    <div className="lg:hidden mb-8 text-center animate-fade-in-down">
                        <Link href="/" className="inline-block">
                            <div className="w-32 h-32 rounded-lg flex items-center justify-center bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 shadow-lg border border-gray-200 dark:border-gray-700">
                                <Image 
                                    src="/Transparent Version of Logo.png" 
                                    alt="Deen Bridge Logo" 
                                    width={128} 
                                    height={128}
                                    className={`object-contain drop-shadow-lg w-full h-full transition-all ${resolvedTheme === 'dark' ? 'brightness-0 invert' : ''}`}
                                />
                            </div>
                        </Link>
                    </div>

                    <div className="border-2 rounded-xl shadow-xl p-8 bg-card">
                        {loading ? (
                            <div className="text-center space-y-6">
                                <div className="flex justify-center">
                                    <IconLoader2 className="h-16 w-16 text-primary animate-spin" />
                                </div>
                                <div className="space-y-2">
                                    <h2 className="text-2xl font-bold tracking-tight">Verifying Email</h2>
                                    <p className="text-muted-foreground">
                                        Please wait while we verify your email address...
                                    </p>
                                </div>
                            </div>
                        ) : verified ? (
                            <div className="text-center space-y-6">
                                <div className="flex justify-center">
                                    <div className="rounded-full bg-green-100 dark:bg-green-900/20 p-4">
                                        <IconCheck className="h-16 w-16 text-green-600 dark:text-green-400" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <h2 className="text-2xl font-bold tracking-tight text-green-600 dark:text-green-400">Email Verified!</h2>
                                    <p className="text-muted-foreground">
                                        Your email address has been successfully verified. You can now log in to your account.
                                    </p>
                                    <p className="text-sm text-muted-foreground mt-4">
                                        Redirecting to login page...
                                    </p>
                                </div>
                            </div>
                        ) : error ? (
                            <div className="text-center space-y-6">
                                <div className="flex justify-center">
                                    <div className="rounded-full bg-destructive/10 p-4">
                                        <IconAlertCircle className="h-16 w-16 text-destructive" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <h2 className="text-2xl font-bold tracking-tight text-destructive">Verification Failed</h2>
                                    <p className="text-muted-foreground">
                                        {error}
                                    </p>
                                </div>
                                <div className="space-y-4 pt-4">
                                    {!isLocked && (
                                        <Link href={userEmail ? `/verify-your-email?email=${encodeURIComponent(userEmail)}` : '/resend-verification'}>
                                            <button className="w-full h-12 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors">
                                                Resend Verification Email
                                            </button>
                                        </Link>
                                    )}
                                    <Link href="/login">
                                        <button className={`w-full h-12 border-2 border-primary text-primary rounded-lg font-semibold hover:bg-primary/10 transition-colors ${isLocked ? 'bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground' : ''}`}>
                                            {isLocked ? 'Back to Login' : 'Go to Login'}
                                        </button>
                                    </Link>
                                    {isLocked && (
                                        <p className="text-xs text-center text-muted-foreground">
                                            If you continue to have issues, please contact support.
                                        </p>
                                    )}
                                </div>
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>
        </div>
    )
}
