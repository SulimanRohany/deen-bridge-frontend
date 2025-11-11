'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Home, 
  ArrowLeft, 
  GraduationCap, 
  Search,
  BookOpen,
  Sparkles
} from 'lucide-react';

export default function CoursesNotFound() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center px-4 py-8">
      <div className="max-w-2xl w-full mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 lg:p-12 border border-gray-200 dark:border-gray-700">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                <GraduationCap className="w-16 h-16 text-white" />
              </div>
              <Sparkles className="absolute -top-2 -right-2 w-10 h-10 text-indigo-500 animate-bounce" />
              <Search className="absolute -bottom-2 -left-2 w-8 h-8 text-blue-500 animate-bounce" style={{ animationDelay: '0.3s' }} />
            </div>
          </div>

          {/* Content */}
          <div className="text-center space-y-4 mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium">
              <GraduationCap className="w-4 h-4" />
              <span>Class Not Found</span>
            </div>

            <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white">
              Class Not Available
            </h1>

            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-md mx-auto">
              The class you're looking for doesn't exist, has been removed, or you don't have access to it.
            </p>
          </div>

          {/* Suggestions */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-600 rounded-lg p-6 mb-8">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
              What would you like to do?
            </h3>
            <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
              <li className="flex items-start gap-2">
                <span className="text-blue-600 dark:text-blue-400">•</span>
                <span>Browse all available classes</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 dark:text-blue-400">•</span>
                <span>Check your enrolled classes</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 dark:text-blue-400">•</span>
                <span>Search for a specific class</span>
              </li>
            </ul>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Link
              href="/courses"
              className="group flex items-center justify-center gap-3 w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
            >
              <BookOpen className="w-5 h-5 transition-transform group-hover:rotate-12" />
              <span>Browse All Classes</span>
            </Link>

            <div className="grid grid-cols-2 gap-3">
              <Link
                href="/"
                className="group flex items-center justify-center gap-2 px-4 py-3 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-xl font-medium transition-all duration-300 border-2 border-gray-200 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-500"
              >
                <Home className="w-4 h-4" />
                <span>Home</span>
              </Link>

              <button
                onClick={() => router.back()}
                className="group flex items-center justify-center gap-2 px-4 py-3 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-xl font-medium transition-all duration-300 border-2 border-gray-200 dark:border-gray-600 hover:border-indigo-500 dark:hover:border-indigo-500"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Go Back</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

