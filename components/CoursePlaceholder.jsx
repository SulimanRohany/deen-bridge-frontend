'use client';

import { BookOpen, GraduationCap, Award, BookMarked } from 'lucide-react';

/**
 * Simple Course Image Placeholder Component
 * Clean, minimal design with subtle colors
 */
export default function CoursePlaceholder({ 
  title, 
  category,
  size = 'medium',
  className = '' 
}) {
  // Simple icon selection based on course type
  const getIcon = () => {
    const titleLower = title?.toLowerCase() || '';
    if (titleLower.includes('quran')) return BookMarked;
    if (titleLower.includes('arabic') || titleLower.includes('language')) return GraduationCap;
    if (titleLower.includes('certificate')) return Award;
    return BookOpen;
  };

  // Size configurations
  const sizeConfig = {
    small: {
      icon: 'h-8 w-8',
      title: 'text-sm',
      padding: 'p-4',
    },
    medium: {
      icon: 'h-12 w-12',
      title: 'text-base',
      padding: 'p-6',
    },
    large: {
      icon: 'h-16 w-16',
      title: 'text-lg',
      padding: 'p-8',
    },
  };

  const config = sizeConfig[size] || sizeConfig.medium;
  const Icon = getIcon();

  return (
    <div className={`placeholder-cover absolute inset-0 flex flex-col items-center justify-center ${config.padding} bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 ${className}`}>
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-[0.03]">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)',
          backgroundSize: '24px 24px'
        }} />
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center space-y-3 max-w-full px-4">
        {/* Simple icon */}
        <div className="p-4 bg-white/60 dark:bg-gray-700/60 backdrop-blur-sm rounded-2xl border border-gray-300/50 dark:border-gray-600/50">
          <Icon className={`${config.icon} text-gray-600 dark:text-gray-300`} />
        </div>

        {/* Course title */}
        {title && (
          <h3 className={`${config.title} font-semibold text-gray-700 dark:text-gray-200 line-clamp-2 leading-tight`}>
            {title}
          </h3>
        )}
      </div>
    </div>
  );
}
