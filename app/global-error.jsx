'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    console.error('Global error:', error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center px-4 py-8">
          <div className="max-w-2xl w-full mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 lg:p-12 border border-gray-200 dark:border-gray-700 text-center">
              {/* Icon */}
              <div className="flex justify-center mb-6">
                <div className="w-24 h-24 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-12 h-12 text-white" />
                </div>
              </div>

              {/* Content */}
              <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Critical Error
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
                We encountered a critical error. Please try refreshing the page or return home.
              </p>

              {/* Actions */}
              <div className="space-y-3">
                <button
                  onClick={reset}
                  className="inline-flex items-center justify-center gap-3 w-full px-6 py-4 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  <RefreshCw className="w-5 h-5" />
                  <span>Try Again</span>
                </button>

                <a
                  href="/"
                  className="inline-flex items-center justify-center gap-2 w-full px-6 py-3 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-xl font-medium transition-all duration-300 border-2 border-gray-200 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-500"
                >
                  <Home className="w-4 h-4" />
                  <span>Back to Home</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}

