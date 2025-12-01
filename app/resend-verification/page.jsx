'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useForm } from "react-hook-form"
import {z} from 'zod'
import { zodResolver } from "@hookform/resolvers/zod"
import { IconMail, IconLoader2, IconAlertCircle, IconCheck } from '@tabler/icons-react'
import { useTheme } from "next-themes"
import { authAPI } from '@/lib/api'
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

const formSchema = z.object({
    email: z.string()
        .min(1, "Email is required.")
        .email("Please enter a valid email address."),
})

export default function ResendVerificationPage() {
    const router = useRouter()
    const [mounted, setMounted] = useState(false)
    const [loading, setLoading] = useState(false)
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
        setSuccess(false)
        try {
            await authAPI.resendVerification(data.email)
            setSuccess(true)
            // Redirect to check-email page after 2 seconds
            setTimeout(() => {
                router.push(`/check-email?email=${encodeURIComponent(data.email)}`)
            }, 2000)
        } catch (err) {
            // Even on error, show success to prevent email enumeration
            setSuccess(true)
            setTimeout(() => {
                router.push(`/check-email?email=${encodeURIComponent(data.email)}`)
            }, 2000)
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

                <div className="relative z-10 space-y-6">
                    <div className="space-y-2">
                        <h1 className="text-5xl font-bold text-white leading-tight">
                            Resend Verification
                        </h1>
                        <p className="text-xl text-white/90">
                            Request a new verification email
                        </p>
                    </div>
                </div>

                <div className="relative z-10 text-white/70 text-sm">
                    <p>© 2024 Deen Bridge. All rights reserved.</p>
                </div>
            </div>

            {/* Right Side - Form */}
            <div className='flex-1 flex items-center justify-center p-4 sm:p-8 bg-background'>
                <div className="w-full max-w-md">
                    <div className="lg:hidden mb-8 text-center">
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

                    <div className="border-2 rounded-xl shadow-xl p-8 bg-card space-y-6">
                        <div className="text-center space-y-2">
                            <div className="flex justify-center">
                                <div className="rounded-full bg-primary/10 p-4">
                                    <IconMail className="h-12 w-12 text-primary" />
                                </div>
                            </div>
                            <h2 className="text-2xl font-bold tracking-tight">Resend Verification Email</h2>
                            <p className="text-muted-foreground text-sm">
                                Enter your email address and we'll send you a new verification link.
                            </p>
                        </div>

                        {success ? (
                            <div className="rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4">
                                <div className="flex items-start gap-3">
                                    <IconCheck className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-green-800 dark:text-green-200">
                                            Email sent successfully!
                                        </p>
                                        <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                                            Redirecting to check email page...
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                                    <FormField
                                        control={form.control}
                                        name="email"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-sm font-semibold">Email Address</FormLabel>
                                                <FormControl>
                                                    <Input 
                                                        type="email"
                                                        placeholder="you@example.com" 
                                                        className="h-12 text-base"
                                                        {...field} 
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    {error && (
                                        <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4">
                                            <div className="flex items-start gap-3">
                                                <IconAlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                                                <p className="text-sm text-destructive">{error}</p>
                                            </div>
                                        </div>
                                    )}

                                    <Button 
                                        className="w-full h-12 text-base font-semibold" 
                                        type="submit" 
                                        disabled={loading}
                                    >
                                        {loading ? (
                                            <>
                                                <IconLoader2 className="h-5 w-5 animate-spin mr-2" />
                                                Sending...
                                            </>
                                        ) : (
                                            'Send Verification Email'
                                        )}
                                    </Button>
                                </form>
                            </Form>
                        )}

                        <div className="pt-4 border-t">
                            <Link href="/login" className="block text-center text-sm text-primary hover:text-primary/80 transition-colors">
                                Back to Login
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}


