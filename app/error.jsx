'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { 
  Home, 
  RefreshCw, 
  AlertTriangle,
  Bug,
  ArrowLeft,
  Flag
} from 'lucide-react';

export default function Error({ error, reset }) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center px-4 py-8 overflow-hidden relative">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-200/30 dark:bg-red-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-200/30 dark:bg-orange-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="max-w-2xl w-full mx-auto relative z-10">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 lg:p-12 border border-gray-200 dark:border-gray-700">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="w-24 h-24 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center animate-pulse">
                <AlertTriangle className="w-12 h-12 text-white" />
              </div>
              <Bug className="absolute -top-2 -right-2 w-10 h-10 text-red-600 dark:text-red-400 animate-bounce" />
            </div>
          </div>

          {/* Content */}
          <div className="text-center space-y-4 mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full text-sm font-medium">
              <AlertTriangle className="w-4 h-4" />
              <span>Something Went Wrong</span>
            </div>

            <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white">
              Oops! An Error Occurred
            </h1>

            <p className="text-lg text-gray-600 dark:text-gray-300">
              We encountered an unexpected error. Don't worry, our team has been notified and we're working on it.
            </p>

            {/* Error details (only in development) */}
            {process.env.NODE_ENV === 'development' && error && (
              <details className="mt-6 text-left">
                <summary className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white mb-2">
                  Technical Details (Development Only)
                </summary>
                <div className="bg-gray-100 dark:bg-gray-900 rounded-lg p-4 overflow-auto max-h-60">
                  <pre className="text-xs text-red-600 dark:text-red-400 whitespace-pre-wrap break-words">
                    {error.message}
                    {error.stack && `\n\n${error.stack}`}
                  </pre>
                </div>
              </details>
            )}
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={reset}
              className="group flex items-center justify-center gap-3 w-full px-6 py-4 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
            >
              <RefreshCw className="w-5 h-5 transition-transform group-hover:rotate-180 duration-500" />
              <span>Try Again</span>
            </button>

            <div className="grid grid-cols-2 gap-3">
              <Link
                href="/"
                className="group flex items-center justify-center gap-2 px-4 py-3 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-xl font-medium transition-all duration-300 border-2 border-gray-200 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-500"
              >
                <Home className="w-4 h-4" />
                <span>Home</span>
              </Link>

              <button
                onClick={() => window.history.back()}
                className="group flex items-center justify-center gap-2 px-4 py-3 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-xl font-medium transition-all duration-300 border-2 border-gray-200 dark:border-gray-600 hover:border-purple-500 dark:hover:border-purple-500"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Go Back</span>
              </button>
            </div>
          </div>

          {/* Help text */}
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 space-y-3">
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
              If this problem persists, please {' '}
              <Link href="/contact" className="text-red-600 dark:text-red-400 hover:underline font-medium">
                contact our support team
              </Link>
            </p>
            <Link 
              href="/reports"
              className="flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-primary font-medium transition-colors"
            >
              <Flag className="w-4 h-4" />
              Report this error
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

