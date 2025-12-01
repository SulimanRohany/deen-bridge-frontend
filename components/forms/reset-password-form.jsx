'use client'
import {z} from 'zod'
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"

import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"

import { IconEye, IconEyeOff, IconCheck, IconAlertCircle, IconSparkles, IconLoader2, IconLock } from '@tabler/icons-react'
import { useTheme } from "next-themes"
import { authAPI } from '@/lib/api'

const formSchema = z.object({
    password: z.string()
        .min(8, "Password must be at least 8 characters long.")
        .regex(/[A-Z]/, "Password must contain at least one uppercase letter.")
        .regex(/[a-z]/, "Password must contain at least one lowercase letter.")
        .regex(/[0-9]/, "Password must contain at least one number."),
    password_confirm: z.string().min(1, "Please confirm your password."),
}).refine((data) => data.password === data.password_confirm, {
    message: "Passwords do not match.",
    path: ["password_confirm"],
})

export default function ResetPasswordForm({ token }) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [mounted, setMounted] = useState(false)
    const [focusedField, setFocusedField] = useState(null)
    const [showPassword, setShowPassword] = useState(false)
    const [showPasswordConfirm, setShowPasswordConfirm] = useState(false)
    const [error, setError] = useState(null)
    const [success, setSuccess] = useState(false)
    const { resolvedTheme } = useTheme()

    useEffect(() => {
        setMounted(true)
        // Validate token on mount
        if (!token) {
            setError('Invalid reset token. Please request a new password reset link.')
        }
    }, [token])

    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            password: '',
            password_confirm: ''
        }
    })

    const handleSubmit = async (data) => {
        setLoading(true)
        setError(null)
        try {
            const response = await authAPI.confirmPasswordReset({
                token: token,
                password: data.password,
                password_confirm: data.password_confirm
            })
            if (response.status === 200) {
                setSuccess(true)
                // Redirect to login after 2 seconds
                setTimeout(() => {
                    router.push('/login')
                }, 2000)
            }
        } catch (err) {
            const errorMessage = err.response?.data?.token?.[0] 
                || err.response?.data?.password?.[0]
                || err.response?.data?.password_confirm?.[0]
                || err.response?.data?.message
                || 'An error occurred. Please try again.'
            setError(errorMessage)
        } finally {
            setLoading(false)
        }
    }

    // Show error if no token
    if (!token) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-background">
                <div className="text-center max-w-md p-6">
                    <h1 className="text-2xl font-bold mb-2 text-foreground">Invalid Reset Token</h1>
                    <p className="text-muted-foreground mb-4">The password reset token is missing or invalid.</p>
                    <p className="text-sm text-muted-foreground mb-4">
                        Please request a new password reset link from the login page.
                    </p>
                </div>
            </div>
        )
    }

    return( 
        <div className={`min-h-screen flex transition-opacity duration-300 ${mounted ? 'opacity-100' : 'opacity-100'}`}>
            {/* Left Side - Branding & Decorative */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-primary via-primary/90 to-secondary p-12 flex-col justify-between">
                {/* Animated Background Elements */}
                <div className="absolute inset-0 overflow-hidden">
                    {/* Geometric Islamic Pattern Overlay */}
                    <div className="absolute inset-0 opacity-10">
                        <div className="absolute top-20 left-20 w-64 h-64 border-2 border-white rounded-full animate-spin-slow"></div>
                        <div className="absolute bottom-20 right-20 w-48 h-48 border-2 border-white rounded-full animate-float"></div>
                        <div className="absolute top-1/2 left-1/3 w-32 h-32 border-2 border-white rotate-45 animate-float-delayed"></div>
                    </div>
                    
                    {/* Gradient Orbs */}
                    <div className="absolute top-0 -left-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse-slow"></div>
                    <div className="absolute bottom-0 -right-1/4 w-96 h-96 bg-secondary/20 rounded-full blur-3xl animate-pulse-slow" style={{animationDelay: '2s'}}></div>
                </div>

                {/* Content */}
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
                            New Password
                        </h1>
                        <p className="text-xl text-white/90">
                            Create a strong password to secure your account
                        </p>
                    </div>
                    
                    <div className="space-y-4 pt-6">
                        <div className="flex items-start space-x-3 text-white/90">
                            <IconCheck className="w-6 h-6 flex-shrink-0 mt-1" />
                            <p className="text-lg">At least 8 characters long</p>
                        </div>
                        <div className="flex items-start space-x-3 text-white/90">
                            <IconCheck className="w-6 h-6 flex-shrink-0 mt-1" />
                            <p className="text-lg">Mix of uppercase and lowercase</p>
                        </div>
                        <div className="flex items-start space-x-3 text-white/90">
                            <IconCheck className="w-6 h-6 flex-shrink-0 mt-1" />
                            <p className="text-lg">Include numbers for strength</p>
                        </div>
                    </div>
                </div>

                <div className="relative z-10 text-white/70 text-sm">
                    <p>© 2024 Deen Bridge. All rights reserved.</p>
                </div>
            </div>

            {/* Right Side - Form */}
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

                    <Card className="border-2 shadow-xl animate-scale-in hover:shadow-2xl transition-all duration-300">
                        <CardHeader className="space-y-3 pb-6">
                            <div className="space-y-2">
                                <CardTitle className="text-3xl font-bold tracking-tight">Reset Password</CardTitle>
                                <CardDescription className="text-base">
                                    {success 
                                        ? "Password reset successful! Redirecting to login..."
                                        : "Enter your new password below"
                                    }
                                </CardDescription>
                            </div>
                        </CardHeader>

                        <CardContent>
                            {success ? (
                                <div className="space-y-6">
                                    <div className="rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4 animate-scale-in" role="alert">
                                        <div className="flex items-start gap-3">
                                            <IconCheck className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-green-800 dark:text-green-200">Password Reset Successful</p>
                                                <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                                                    Your password has been successfully reset. You will be redirected to the login page shortly.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <Form {...form}>
                                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                                        {/* New Password Field */}
                                        <FormField
                                            control={form.control}
                                            name="password"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-sm font-semibold">New Password</FormLabel>
                                                    <FormControl>
                                                        <div className="relative">
                                                            <Input 
                                                                type={showPassword ? 'text' : 'password'} 
                                                                placeholder="Enter your new password" 
                                                                className={`h-12 text-base pr-12 transition-all duration-300 ${
                                                                    focusedField === 'password' ? 'ring-2 ring-primary/50 border-primary scale-[1.01]' : ''
                                                                } ${form.formState.errors.password ? 'border-destructive' : ''}`}
                                                                onFocus={() => setFocusedField('password')}
                                                                onBlur={() => setFocusedField(null)}
                                                                aria-label="New password"
                                                                aria-required="true"
                                                                aria-invalid={!!form.formState.errors.password}
                                                                {...field} 
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={() => setShowPassword(!showPassword)}
                                                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-md p-1 transition-all duration-200 hover:scale-110"
                                                                aria-label={showPassword ? "Hide password" : "Show password"}
                                                                tabIndex={0}
                                                            >
                                                                {showPassword ? (
                                                                    <IconEyeOff className="h-5 w-5" />
                                                                ) : (
                                                                    <IconEye className="h-5 w-5" />
                                                                )}
                                                            </button>
                                                        </div>
                                                    </FormControl>
                                                    <FormMessage className="text-xs flex items-center gap-1 mt-1.5">
                                                        {form.formState.errors.password && (
                                                            <>
                                                                <IconAlertCircle className="h-3 w-3" />
                                                                {form.formState.errors.password.message}
                                                            </>
                                                        )}
                                                    </FormMessage>
                                                </FormItem>
                                            )}
                                        />

                                        {/* Confirm Password Field */}
                                        <FormField
                                            control={form.control}
                                            name="password_confirm"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-sm font-semibold">Confirm Password</FormLabel>
                                                    <FormControl>
                                                        <div className="relative">
                                                            <Input 
                                                                type={showPasswordConfirm ? 'text' : 'password'} 
                                                                placeholder="Confirm your new password" 
                                                                className={`h-12 text-base pr-12 transition-all duration-300 ${
                                                                    focusedField === 'password_confirm' ? 'ring-2 ring-primary/50 border-primary scale-[1.01]' : ''
                                                                } ${form.formState.errors.password_confirm ? 'border-destructive' : ''}`}
                                                                onFocus={() => setFocusedField('password_confirm')}
                                                                onBlur={() => setFocusedField(null)}
                                                                aria-label="Confirm new password"
                                                                aria-required="true"
                                                                aria-invalid={!!form.formState.errors.password_confirm}
                                                                {...field} 
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                                                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-md p-1 transition-all duration-200 hover:scale-110"
                                                                aria-label={showPasswordConfirm ? "Hide password" : "Show password"}
                                                                tabIndex={0}
                                                            >
                                                                {showPasswordConfirm ? (
                                                                    <IconEyeOff className="h-5 w-5" />
                                                                ) : (
                                                                    <IconEye className="h-5 w-5" />
                                                                )}
                                                            </button>
                                                        </div>
                                                    </FormControl>
                                                    <FormMessage className="text-xs flex items-center gap-1 mt-1.5">
                                                        {form.formState.errors.password_confirm && (
                                                            <>
                                                                <IconAlertCircle className="h-3 w-3" />
                                                                {form.formState.errors.password_confirm.message}
                                                            </>
                                                        )}
                                                    </FormMessage>
                                                </FormItem>
                                            )}
                                        />

                                        {/* Error Message */}
                                        {error && (
                                            <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4 animate-scale-in" role="alert" aria-live="polite">
                                                <div className="flex items-start gap-3">
                                                    <IconAlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                                                    <div className="flex-1">
                                                        <p className="text-sm font-medium text-destructive">Error</p>
                                                        <p className="text-xs text-destructive/90 mt-1">{error}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Submit Button */}
                                        <Button 
                                            className="w-full h-12 text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]" 
                                            type="submit" 
                                            disabled={loading}
                                            aria-label="Reset password"
                                        >
                                            {loading ? (
                                                <div className="flex items-center justify-center space-x-2">
                                                    <IconLoader2 className="h-5 w-5 animate-spin" />
                                                    <span>Resetting...</span>
                                                </div>
                                            ) : (
                                                <span className="flex items-center justify-center gap-2">
                                                    Reset Password
                                                    <IconLock className="h-4 w-4" />
                                                </span>
                                            )}
                                        </Button>

                                        {/* Back to Login Link */}
                                        <div className="text-center">
                                            <Link 
                                                href='/login' 
                                                className="inline-flex items-center justify-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors group"
                                            >
                                                <span className="group-hover:-translate-x-1 transition-transform duration-200">←</span>
                                                Back to Login
                                            </Link>
                                        </div>
                                    </form>
                                </Form>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}


