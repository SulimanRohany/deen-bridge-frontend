'use client'
import { 
    Form,
    FormField,
    FormItem,
    FormLabel,
    FormControl,
    FormMessage,
} from "@/components/ui/form"

import { 
    Card,
    CardContent, 
    CardHeader, 
    CardFooter, 
    CardTitle,
    CardDescription,
} from "@/components/ui/card"

import Link from "next/link"
import Image from 'next/image'

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

import { useForm } from "react-hook-form"
import {z} from 'zod'
import { zodResolver } from "@hookform/resolvers/zod"

import { useContext, useEffect, useState } from "react"
import AuthContext from "@/context/AuthContext"
import { IconEye, IconEyeOff, IconCheck, IconAlertCircle, IconSparkles, IconShieldCheck, IconLoader2 } from '@tabler/icons-react'
import { useTheme } from "next-themes"


export default function SignupForm() {
    const [loading, setLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [mounted, setMounted] = useState(false)
    const [focusedField, setFocusedField] = useState(null)
    const {message, registerUser} = useContext(AuthContext)
    const { resolvedTheme } = useTheme()

    useEffect(() => {
        setMounted(true)
    }, [])

    const formSchema = z.object({
        full_name: z.string()
            .min(1, "Full name is required.")
            .min(2, "Name must be at least 2 characters.")
            .max(100, "Name is too long.")
            .regex(/^[a-zA-Z\s]+$/, "Name should only contain letters and spaces."),
        email: z.string()
            .min(1, "Email is required.")
            .email("Please enter a valid email address."),
        password: z.string()
            .min(8, 'Password must be at least 8 characters.')
            .regex(/[A-Z]/, 'Password must contain at least one uppercase letter.')
            .regex(/[a-z]/, 'Password must contain at least one lowercase letter.')
            .regex(/[0-9]/, 'Password must contain at least one number.'),
    })

    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
        full_name: '',
        email: '',
        password: '',
        }
    })

    const handleSubmit = async (data) => {
        setLoading(true)
        await registerUser(data)
        setLoading(false)
    }

    return(
        <div className={`min-h-screen flex transition-opacity duration-700 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
            {/* Left Side - Branding & Decorative */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-secondary via-secondary/90 to-primary p-12 flex-col justify-between">
                {/* Animated Background Elements */}
                <div className="absolute inset-0 overflow-hidden">
                    {/* Geometric Islamic Pattern Overlay */}
                    <div className="absolute inset-0 opacity-10">
                        <div className="absolute top-20 right-20 w-64 h-64 border-2 border-white rounded-full animate-spin-slow"></div>
                        <div className="absolute bottom-20 left-20 w-48 h-48 border-2 border-white rounded-full animate-float"></div>
                        <div className="absolute top-1/2 right-1/3 w-32 h-32 border-2 border-white rotate-45 animate-float-delayed"></div>
                    </div>
                    
                    {/* Gradient Orbs */}
                    <div className="absolute top-0 -right-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse-slow"></div>
                    <div className="absolute bottom-0 -left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse-slow" style={{animationDelay: '2s'}}></div>
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
                            Begin Your Journey
                        </h1>
                        <p className="text-xl text-white/90">
                            Join thousands of students learning Quran worldwide
                        </p>
                    </div>
                    
                    <div className="space-y-4 pt-6">
                        <div className="flex items-start space-x-3 text-white/90">
                            <IconShieldCheck className="w-6 h-6 flex-shrink-0 mt-1" />
                            <p className="text-lg">100% Free to get started</p>
                        </div>
                        <div className="flex items-start space-x-3 text-white/90">
                            <IconCheck className="w-6 h-6 flex-shrink-0 mt-1" />
                            <p className="text-lg">Personalized learning experience</p>
                        </div>
                        <div className="flex items-start space-x-3 text-white/90">
                            <IconCheck className="w-6 h-6 flex-shrink-0 mt-1" />
                            <p className="text-lg">Expert teachers and comprehensive resources</p>
                        </div>
                        <div className="flex items-start space-x-3 text-white/90">
                            <IconCheck className="w-6 h-6 flex-shrink-0 mt-1" />
                            <p className="text-lg">Track progress with detailed analytics</p>
                        </div>
                    </div>
                </div>

                <div className="relative z-10 text-white/70 text-sm">
                    <p>© 2024 Deen Bridge. All rights reserved.</p>
                </div>
            </div>

            {/* Right Side - Signup Form */}
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
                                <CardTitle className="text-3xl font-bold tracking-tight">Create Account</CardTitle>
                                <CardDescription className="text-base">
                                    Sign up to start your Quran learning journey
                                </CardDescription>
                            </div>
                        </CardHeader>

                        <CardContent>
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5">
                                    {/* Full Name Field */}
                                    <FormField
                                        control={form.control}
                                        name="full_name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-sm font-semibold">Full Name</FormLabel>
                                                <FormControl>
                                                    <div className="relative">
                                                        <Input 
                                                            {...field}  
                                                            placeholder="John Doe" 
                                                            className={`h-12 text-base transition-all duration-300 ${
                                                                focusedField === 'full_name' ? 'ring-2 ring-primary/50 border-primary scale-[1.01]' : ''
                                                            } ${form.formState.errors.full_name ? 'border-destructive' : ''}`}
                                                            onFocus={() => setFocusedField('full_name')}
                                                            onBlur={() => setFocusedField(null)}
                                                            aria-label="Full name"
                                                            aria-required="true"
                                                            aria-invalid={!!form.formState.errors.full_name}
                                                        />
                                                        {field.value && !form.formState.errors.full_name && field.value.length >= 2 && (
                                                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500 animate-scale-in">
                                                                <IconCheck className="h-5 w-5" />
                                                            </div>
                                                        )}
                                                    </div>
                                                </FormControl>
                                                <FormMessage className="text-xs flex items-center gap-1 mt-1.5">
                                                    {form.formState.errors.full_name && (
                                                        <>
                                                            <IconAlertCircle className="h-3 w-3" />
                                                            {form.formState.errors.full_name.message}
                                                        </>
                                                    )}
                                                </FormMessage>
                                            </FormItem>
                                        )}
                                    />

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
                                                    {field.value && !form.formState.errors.email && field.value.includes('@') && (
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

                                    {/* Password Field */}
                                    <FormField
                                        control={form.control}
                                        name="password"
                                        render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-sm font-semibold">Password</FormLabel>
                                            <FormControl>
                                                <div className="space-y-3">
                                                    <div className="relative">
                                                        <Input 
                                                            type={showPassword ? 'text' : 'password'} 
                                                            placeholder="Create a strong password" 
                                                            className={`h-12 text-base pr-12 transition-all duration-300 ${
                                                                focusedField === 'password' ? 'ring-2 ring-primary/50 border-primary scale-[1.01]' : ''
                                                            } ${form.formState.errors.password ? 'border-destructive' : ''}`}
                                                            onFocus={() => setFocusedField('password')}
                                                            onBlur={() => setFocusedField(null)}
                                                            aria-label="Password"
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
                                                    
                                                    {/* Password Requirements */}
                                                    {field.value && (
                                                        <div className="text-xs text-muted-foreground space-y-1 animate-scale-in">
                                                            <p className="flex items-center gap-1.5">
                                                                <span className={field.value.length >= 8 ? 'text-green-600' : ''}>
                                                                    {field.value.length >= 8 ? '✓' : '○'}
                                                                </span>
                                                                At least 8 characters
                                                            </p>
                                                            <p className="flex items-center gap-1.5">
                                                                <span className={/[A-Z]/.test(field.value) ? 'text-green-600' : ''}>
                                                                    {/[A-Z]/.test(field.value) ? '✓' : '○'}
                                                                </span>
                                                                One uppercase letter
                                                            </p>
                                                            <p className="flex items-center gap-1.5">
                                                                <span className={/[a-z]/.test(field.value) ? 'text-green-600' : ''}>
                                                                    {/[a-z]/.test(field.value) ? '✓' : '○'}
                                                                </span>
                                                                One lowercase letter
                                                            </p>
                                                            <p className="flex items-center gap-1.5">
                                                                <span className={/[0-9]/.test(field.value) ? 'text-green-600' : ''}>
                                                                    {/[0-9]/.test(field.value) ? '✓' : '○'}
                                                                </span>
                                                                One number
                                                            </p>
                                                        </div>
                                                    )}
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

                                    {/* Error Message */}
                                    {message && (
                                        <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4 animate-scale-in" role="alert" aria-live="polite">
                                            <div className="flex items-start gap-3">
                                                <IconAlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                                                <div className="flex-1">
                                                    <p className="text-sm font-medium text-destructive">Sign Up Failed</p>
                                                    <p className="text-xs text-destructive/90 mt-1">{message}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Submit Button */}
                                    <Button 
                                        className="w-full h-12 text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]" 
                                        type="submit" 
                                        disabled={loading}
                                        aria-label="Create your account"
                                    >
                                        {loading ? (
                                        <div className="flex items-center justify-center space-x-2">
                                            <IconLoader2 className="h-5 w-5 animate-spin" />
                                            <span>Creating account...</span>
                                        </div>
                                        ) : (
                                        <span className="flex items-center justify-center gap-2">
                                            Create Account
                                            <IconSparkles className="h-4 w-4" />
                                        </span>
                                        )}
                                    </Button>

                                    {/* Divider */}
                                    <div className="relative">
                                        <div className="absolute inset-0 flex items-center">
                                            <span className="w-full border-t border-border" />
                                        </div>
                                        <div className="relative flex justify-center text-xs uppercase">
                                            <span className="bg-card px-2 text-muted-foreground">
                                                Already have an account?
                                            </span>
                                        </div>
                                    </div>

                                    {/* Login Link */}
                                    <div className="text-center">
                                        <Link 
                                            href='/login' 
                                            className="inline-flex items-center justify-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors group"
                                        >
                                            Log in to your account
                                            <span className="group-hover:translate-x-1 transition-transform duration-200">→</span>
                                        </Link>
                                    </div>
                                </form>
                            </Form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
