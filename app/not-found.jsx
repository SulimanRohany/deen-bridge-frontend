'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Home, 
  ArrowLeft, 
  Search, 
  BookOpen, 
  GraduationCap,
  Sparkles,
  FileQuestion,
  Flag
} from 'lucide-react';

export default function NotFound() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    setMounted(true);
    
    // Countdown timer
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push('/');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center px-4 py-8 overflow-hidden relative">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-200/30 dark:bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-200/30 dark:bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-200/20 dark:bg-pink-500/10 rounded-full blur-3xl animate-pulse delay-500" />
      </div>

      <div className="max-w-5xl w-full mx-auto relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left side - Illustration */}
          <div className={`relative transition-all duration-1000 ${mounted ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'}`}>
            {/* 404 Illustration */}
            <div className="relative">
              {/* Large 404 Text */}
              <div className="text-center mb-8">
                <div className="relative inline-block">
                  <h1 className="text-[180px] lg:text-[220px] font-black text-transparent bg-clip-text bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 leading-none tracking-tighter">
                    404
                  </h1>
                  {/* Floating icons */}
                  <FileQuestion className="absolute -top-4 -right-4 w-16 h-16 text-blue-500 animate-bounce" style={{ animationDelay: '0s' }} />
                  <Sparkles className="absolute top-1/4 -left-8 w-12 h-12 text-purple-500 animate-bounce" style={{ animationDelay: '0.3s' }} />
                  <Search className="absolute bottom-1/4 -right-8 w-14 h-14 text-pink-500 animate-bounce" style={{ animationDelay: '0.6s' }} />
                </div>
              </div>

              {/* Decorative elements */}
              <div className="flex justify-center gap-4 mb-6">
                <div className="w-20 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-pulse" />
                <div className="w-20 h-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
                <div className="w-20 h-2 bg-gradient-to-r from-pink-500 to-blue-500 rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
              </div>
            </div>
          </div>

          {/* Right side - Content */}
          <div className={`space-y-8 transition-all duration-1000 delay-300 ${mounted ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'}`}>
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium">
                <Sparkles className="w-4 h-4" />
                <span>Oops! Page Not Found</span>
              </div>
              
              <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white leading-tight">
                Lost in the
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                  Learning Space?
                </span>
              </h2>
              
              <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
                The page you're looking for doesn't exist or has been moved. 
                Don't worry, we'll help you find your way back to your learning journey!
              </p>

              {/* Auto-redirect notice */}
              <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-700 rounded-lg border border-blue-200 dark:border-gray-600">
                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                    <span className="text-white font-bold text-lg">{countdown}</span>
                  </div>
                  <svg className="absolute top-0 left-0 w-12 h-12 -rotate-90">
                    <circle
                      cx="24"
                      cy="24"
                      r="20"
                      stroke="currentColor"
                      strokeWidth="2"
                      fill="none"
                      className="text-white/30"
                    />
                    <circle
                      cx="24"
                      cy="24"
                      r="20"
                      stroke="currentColor"
                      strokeWidth="2"
                      fill="none"
                      className="text-white transition-all duration-1000"
                      strokeDasharray={`${(countdown / 10) * 125.6} 125.6`}
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Redirecting to home in {countdown} seconds
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Or choose a quick link below
                  </p>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="space-y-3">
              <Link
                href="/"
                className="group flex items-center justify-center gap-3 w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
              >
                <Home className="w-5 h-5 transition-transform group-hover:-translate-y-1" />
                <span>Back to Home</span>
              </Link>

              <div className="grid grid-cols-2 gap-3">
                <Link
                  href="/courses"
                  className="group flex items-center justify-center gap-2 px-4 py-3 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl font-medium transition-all duration-300 border-2 border-gray-200 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-500 hover:scale-105"
                >
                  <GraduationCap className="w-4 h-4 transition-transform group-hover:rotate-12" />
                  <span>Courses</span>
                </Link>

                <Link
                  href="/library"
                  className="group flex items-center justify-center gap-2 px-4 py-3 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl font-medium transition-all duration-300 border-2 border-gray-200 dark:border-gray-600 hover:border-purple-500 dark:hover:border-purple-500 hover:scale-105"
                >
                  <BookOpen className="w-4 h-4 transition-transform group-hover:rotate-12" />
                  <span>Library</span>
                </Link>
              </div>

              <button
                onClick={() => router.back()}
                className="group flex items-center justify-center gap-2 w-full px-6 py-3 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-medium transition-all duration-300"
              >
                <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                <span>Go Back</span>
              </button>
            </div>

            {/* Help text */}
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                Need help? {' '}
                <Link href="/contact" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
                  Contact support
                </Link>
              </p>
              <Link 
                href="/reports"
                className="flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-primary font-medium transition-colors"
              >
                <Flag className="w-4 h-4" />
                Report this issue
              </Link>
            </div>
          </div>
        </div>

        {/* Floating decorative elements */}
        <div className="absolute -z-10 top-10 right-10 w-20 h-20 bg-yellow-300 dark:bg-yellow-500 rounded-full opacity-20 animate-ping" style={{ animationDuration: '3s' }} />
        <div className="absolute -z-10 bottom-10 left-10 w-16 h-16 bg-green-300 dark:bg-green-500 rounded-full opacity-20 animate-ping" style={{ animationDuration: '4s', animationDelay: '1s' }} />
      </div>
    </div>
  );
}

