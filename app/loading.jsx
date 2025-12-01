'use client';

import { Loader2, BookOpen, GraduationCap, Sparkles } from 'lucide-react';

export default function Loading() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-8">
      <div className="text-center space-y-8">
        {/* Main loader */}
        <div className="relative inline-block">
          {/* Outer rotating ring */}
          <div className="w-32 h-32 rounded-full border-4 border-blue-200 dark:border-blue-900 border-t-blue-600 dark:border-t-blue-400 animate-spin" />
          
          {/* Inner content */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shadow-lg">
              <GraduationCap className="w-12 h-12 text-white animate-pulse" />
            </div>
          </div>

          {/* Orbiting icons */}
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-4">
            <BookOpen className="w-6 h-6 text-blue-600 dark:text-blue-400 animate-bounce" />
          </div>
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-4">
            <Sparkles className="w-6 h-6 text-purple-600 dark:text-purple-400 animate-bounce" style={{ animationDelay: '0.3s' }} />
          </div>
        </div>

        {/* Loading text */}
        <div className="space-y-3">
          <h2 className="text-2xl font-bold text-foreground">
            Loading...
          </h2>
          <p className="text-muted-foreground">
            Preparing your learning experience
          </p>
        </div>

        {/* Animated dots */}
        <div className="flex justify-center gap-2">
          <div className="w-3 h-3 bg-blue-600 dark:bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
          <div className="w-3 h-3 bg-purple-600 dark:bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
          <div className="w-3 h-3 bg-pink-600 dark:bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
        </div>
      </div>
    </div>
  );
}

