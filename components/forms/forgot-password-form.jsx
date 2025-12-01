'use client'
import {z} from 'zod'
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect } from 'react'

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

import { IconCheck, IconAlertCircle, IconSparkles, IconLoader2, IconMail } from '@tabler/icons-react'
import { useTheme } from "next-themes"
import { authAPI } from '@/lib/api'

const formSchema = z.object({
    email: z.string().min(1, "Email is required.").email("Please enter a valid email address."),
})

export default function ForgotPasswordForm() {
    const [loading, setLoading] = useState(false)
    const [mounted, setMounted] = useState(false)
    const [focusedField, setFocusedField] = useState(null)
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState(null)
    const { resolvedTheme } = useTheme()

    useEffect(() => {
        setMounted(true)
    }, [])

    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            email: ''
        }
    })

    const handleSubmit = async (data) => {
        setLoading(true)
        setError(null)
        try {
            const response = await authAPI.requestPasswordReset(data.email.toLowerCase())
            if (response.status === 200) {
                setSuccess(true)
            }
        } catch (err) {
            setError(err.response?.data?.message || err.response?.data?.email?.[0] || 'An error occurred. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    return( 
        <div className={`min-h-screen flex transition-opacity duration-700 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
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
                            Reset Password
                        </h1>
                        <p className="text-xl text-white/90">
                            We'll help you get back into your account
                        </p>
                    </div>
                    
                    <div className="space-y-4 pt-6">
                        <div className="flex items-start space-x-3 text-white/90">
                            <IconCheck className="w-6 h-6 flex-shrink-0 mt-1" />
                            <p className="text-lg">Secure password reset process</p>
                        </div>
                        <div className="flex items-start space-x-3 text-white/90">
                            <IconCheck className="w-6 h-6 flex-shrink-0 mt-1" />
                            <p className="text-lg">Link expires in 1 hour for security</p>
                        </div>
                        <div className="flex items-start space-x-3 text-white/90">
                            <IconCheck className="w-6 h-6 flex-shrink-0 mt-1" />
                            <p className="text-lg">Quick and easy recovery</p>
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
                                <CardTitle className="text-3xl font-bold tracking-tight">Forgot Password</CardTitle>
                                <CardDescription className="text-base">
                                    {success 
                                        ? "Check your email for reset instructions"
                                        : "Enter your email address and we'll send you a link to reset your password"
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
                                                <p className="text-sm font-medium text-green-800 dark:text-green-200">Email Sent</p>
                                                <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                                                    If an account with that email exists, we've sent you a password reset link. 
                                                    Please check your inbox and follow the instructions.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-center">
                                        <Link 
                                            href="/login" 
                                            className="inline-flex items-center justify-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                                        >
                                            Back to Login
                                            <span className="group-hover:translate-x-1 transition-transform duration-200">→</span>
                                        </Link>
                                    </div>
                                </div>
                            ) : (
                                <Form {...form}>
                                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                                        {/* Email Field */}
                                        <FormField
                                            control={form.control}
                                            name="email"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-sm font-semibold">Email Address</FormLabel>
                                                    <FormControl>
                                                        <div className="relative">
                                                            <Input 
                                                                type="email"
                                                                placeholder="you@example.com" 
                                                                className={`h-12 text-base transition-all duration-300 ${
                                                                    focusedField === 'email' ? 'ring-2 ring-primary/50 border-primary scale-[1.01]' : ''
                                                                } ${form.formState.errors.email ? 'border-destructive' : ''}`}
                                                                onFocus={() => setFocusedField('email')}
                                                                onBlur={() => setFocusedField(null)}
                                                                aria-label="Email address"
                                                                aria-required="true"
                                                                aria-invalid={!!form.formState.errors.email}
                                                                {...field} 
                                                            />
                                                            {field.value && !form.formState.errors.email && (
                                                                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500 animate-scale-in">
                                                                    <IconCheck className="h-5 w-5" />
                                                                </div>
                                                            )}
                                                        </div>
                                                    </FormControl>
                                                    <FormMessage className="text-xs flex items-center gap-1 mt-1.5">
                                                        {form.formState.errors.email && (
                                                            <>
                                                                <IconAlertCircle className="h-3 w-3" />
                                                                {form.formState.errors.email.message}
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
                                            aria-label="Send password reset email"
                                        >
                                            {loading ? (
                                                <div className="flex items-center justify-center space-x-2">
                                                    <IconLoader2 className="h-5 w-5 animate-spin" />
                                                    <span>Sending...</span>
                                                </div>
                                            ) : (
                                                <span className="flex items-center justify-center gap-2">
                                                    Send Reset Link
                                                    <IconMail className="h-4 w-4" />
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


