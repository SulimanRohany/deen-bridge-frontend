'use client'
import { useSearchParams, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { authAPI } from '@/lib/api'
import { IconMail, IconAlertCircle, IconLoader2, IconCheck, IconClock } from '@tabler/icons-react'
import { useTheme } from "next-themes"

export default function VerifyYourEmailPage() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const [email, setEmail] = useState('')
    const [mounted, setMounted] = useState(false)
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState(null)
    const [error, setError] = useState(null)
    const [isRateLimited, setIsRateLimited] = useState(false)
    const [isLocked, setIsLocked] = useState(false)
    const { resolvedTheme } = useTheme()

    useEffect(() => {
        setMounted(true)
        const emailParam = searchParams.get('email')
        if (emailParam) {
            setEmail(emailParam)
        }
    }, [searchParams])

    const handleResendEmail = async () => {
        if (!email) {
            setError('Please provide your email address.')
            return
        }

        setLoading(true)
        setMessage(null)
        setError(null)
        setIsRateLimited(false)
        setIsLocked(false)

        try {
            const response = await authAPI.resendVerification(email)
            if (response.status === 200) {
                setMessage(response.data.message || 'Verification email has been sent! Please check your inbox.')
            }
        } catch (err) {
            const errorMessage = err.response?.data?.email?.[0] 
                || err.response?.data?.message
                || 'Failed to send verification email. Please try again.'
            
            setError(errorMessage)
            
            // Check for rate limiting
            if (errorMessage.includes('Too many') || errorMessage.includes('wait') || err.response?.data?.rate_limited) {
                setIsRateLimited(true)
            }
            
            // Check for account lock
            if (errorMessage.includes('locked') || errorMessage.includes('Account locked')) {
                setIsLocked(true)
            }
        } finally {
            setLoading(false)
        }
    }

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
            {/* Left Side - Branding */}
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
                            Verify Your Email
                        </h1>
                        <p className="text-xl text-white/90">
                            One more step to activate your account
                        </p>
                    </div>
                </div>

                <div className="relative z-10 text-white/70 text-sm">
                    <p>© 2024 Deen Bridge. All rights reserved.</p>
                </div>
            </div>

            {/* Right Side - Content */}
            <div className='flex-1 flex items-center justify-center p-4 sm:p-8 bg-background'>
                <div className="w-full max-w-md">
                    {/* Mobile Logo */}
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

                    {/* Main Card */}
                    <div className="border-2 rounded-xl shadow-xl p-8 bg-card">
                        <div className="text-center space-y-6">
                            {/* Icon */}
                            <div className="flex justify-center">
                                <div className="rounded-full bg-primary/10 p-4">
                                    <IconMail className="h-16 w-16 text-primary" />
                                </div>
                            </div>

                            {/* Title and Description */}
                            <div className="space-y-2">
                                <h2 className="text-2xl font-bold tracking-tight">Verify Your Email Address</h2>
                                <p className="text-muted-foreground">
                                    We sent a verification email to{' '}
                                    {email ? (
                                        <span className="font-semibold text-foreground">{email}</span>
                                    ) : (
                                        'your email address'
                                    )}
                                </p>
                                <p className="text-sm text-muted-foreground pt-2">
                                    Please check your inbox and click the verification link to activate your account.
                                </p>
                            </div>

                            {/* Success Message */}
                            {message && (
                                <div className="rounded-lg bg-green-100 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4 animate-scale-in" role="alert">
                                    <div className="flex items-start gap-3">
                                        <IconCheck className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-green-600 dark:text-green-400">Success!</p>
                                            <p className="text-xs text-green-600 dark:text-green-400/90 mt-1">{message}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Error Message */}
                            {error && (
                                <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4 animate-scale-in" role="alert">
                                    <div className="flex items-start gap-3">
                                        {isLocked ? (
                                            <IconClock className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                                        ) : (
                                            <IconAlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                                        )}
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-destructive">
                                                {isLocked ? 'Account Temporarily Locked' : 'Error'}
                                            </p>
                                            <p className="text-xs text-destructive/90 mt-1">{error}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Email Input (if not provided) */}
                            {!email && (
                                <div className="space-y-2 text-left">
                                    <label htmlFor="email" className="text-sm font-semibold">
                                        Email Address
                                    </label>
                                    <input
                                        type="email"
                                        id="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="Enter your email"
                                        className="w-full h-12 px-4 rounded-lg border-2 border-input bg-background focus:border-primary focus:outline-none transition-colors"
                                    />
                                </div>
                            )}

                            {/* Resend Button */}
                            <div className="space-y-4 pt-4">
                                <button
                                    onClick={handleResendEmail}
                                    disabled={loading || !email || isLocked}
                                    className="w-full h-12 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {loading ? (
                                        <>
                                            <IconLoader2 className="h-5 w-5 animate-spin" />
                                            Sending...
                                        </>
                                    ) : (
                                        <>
                                            <IconMail className="h-5 w-5" />
                                            Resend Verification Email
                                        </>
                                    )}
                                </button>

                                {isRateLimited && (
                                    <p className="text-xs text-center text-muted-foreground">
                                        You can request a new verification email in a few minutes.
                                    </p>
                                )}

                                {isLocked && (
                                    <p className="text-xs text-center text-muted-foreground">
                                        Your account is temporarily locked. Please try again later or contact support.
                                    </p>
                                )}

                                <Link href="/login">
                                    <button className="w-full h-12 border-2 border-primary text-primary rounded-lg font-semibold hover:bg-primary/10 transition-colors">
                                        Back to Login
                                    </button>
                                </Link>
                            </div>

                            {/* Additional Info */}
                            <div className="pt-4 space-y-2 text-xs text-muted-foreground">
                                <p>
                                    <strong>Didn't receive the email?</strong> Check your spam folder or click the resend button above.
                                </p>
                                <p>
                                    The verification link will expire in 24 hours.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

