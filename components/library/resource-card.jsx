'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import {
  IconBook, IconExternalLink, IconBookmark, IconBookmarkFilled,
  IconEye, IconDownload, IconStar, IconShare, IconUser, IconSparkles
} from '@tabler/icons-react'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { RatingDisplay } from './rating-stars'
import { libraryAPI } from '@/lib/api'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

/**
 * Professional ResourceCard Component
 * 
 * Features:
 * - Clean, professional design
 * - Proper image handling and display
 * - Excellent typography and spacing
 * - Minimal, focused layout
 * - High contrast and readability
 */

export default function ResourceCard({ resource, onBookmarkChange }) {
  const [isBookmarked, setIsBookmarked] = useState(resource.is_bookmarked || false)
  const [bookmarkLoading, setBookmarkLoading] = useState(false)
  const [imageLoading, setImageLoading] = useState(true)
  const [imageError, setImageError] = useState(false)

  // Get language label
  const getLanguageLabel = (lang) => {
    const labels = {
      'arabic': 'العربية',
      'english': 'English',
      'urdu': 'اردو',
      'farsi': 'فارسی',
      'pashto': 'پښتو',
      'turkish': 'Türkçe',
    }
    return labels[lang] || lang
  }

  // Handle bookmark toggle
  const handleBookmarkToggle = async (e) => {
    e.preventDefault()
    e.stopPropagation()

    setBookmarkLoading(true)
    try {
      const response = await libraryAPI.toggleBookmark(resource.id)
      const newBookmarkedState = response.data.bookmarked
      setIsBookmarked(newBookmarkedState)
      
      toast.success(
        newBookmarkedState ? 'Added to bookmarks' : 'Removed from bookmarks'
      )

      if (onBookmarkChange) {
        onBookmarkChange(resource.id, newBookmarkedState)
      }
    } catch (error) {
      toast.error('Failed to update bookmark. Please try again.')
    } finally {
      setBookmarkLoading(false)
    }
  }

  // Format numbers
  const formatNumber = (num) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  return (
    <Card className="group flex flex-col h-full overflow-hidden bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 hover:shadow-lg hover:border-primary/30 transition-all duration-300">
      {/* Professional Cover Image Section */}
      <Link href={`/library/${resource.id}`} className="block">
        <div className="relative h-48 bg-gray-100 dark:bg-slate-800 overflow-hidden">
          {/* Show placeholder if no image URL or if image failed to load */}
          {(!resource.cover_image_url || imageError) ? (
            <div className="flex items-center justify-center h-full p-6">
              <div className="text-center space-y-3">
                <div className="w-16 h-16 mx-auto rounded-lg bg-primary/10 flex items-center justify-center">
                  <IconBook className="h-8 w-8 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground font-medium line-clamp-2">
                  {resource.title_arabic || resource.title}
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Loading Placeholder */}
              {imageLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-slate-800">
                  <div className="text-center space-y-2">
                    <div className="w-12 h-12 mx-auto rounded-lg bg-primary/10 flex items-center justify-center">
                      <IconBook className="h-6 w-6 text-primary animate-pulse" />
                    </div>
                    <p className="text-xs text-muted-foreground">Loading...</p>
                  </div>
                </div>
              )}
              
              {/* Actual Image */}
              <Image
                src={resource.cover_image_url}
                alt={resource.title}
                fill
                className={cn(
                  "object-cover transition-all duration-300 group-hover:scale-105",
                  imageLoading && "opacity-0"
                )}
                onLoad={() => setImageLoading(false)}
                onError={() => {
                  setImageLoading(false)
                  setImageError(true)
                }}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                priority={false}
              />
            </>
          )}

          {/* Professional Bookmark Button - Only show if not in bookmarks page */}
          {!resource.is_bookmarked && (
            <button
              onClick={handleBookmarkToggle}
              disabled={bookmarkLoading}
              className={cn(
                "absolute top-3 right-3 p-2 rounded-lg bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm shadow-md z-10",
                "transition-all duration-200 hover:scale-105",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                "text-gray-600 dark:text-gray-400 hover:text-primary"
              )}
            >
              <IconBookmark className="h-4 w-4" />
            </button>
          )}

          {/* Professional Featured Badge */}
          {resource.is_featured && (
            <div className="absolute top-3 left-3 z-10">
              <Badge className="bg-amber-500 text-white border-0 shadow-sm text-xs font-medium px-2 py-1">
                <IconStar className="h-3 w-3 mr-1 fill-white" />
                Featured
              </Badge>
            </div>
          )}
        </div>
      </Link>

      {/* Professional Content Section */}
      <CardHeader className="pb-3 pt-4 px-4">
        <Link href={`/library/${resource.id}`} className="block space-y-2">
          {/* Title */}
          <CardTitle className="text-lg font-semibold leading-tight line-clamp-2 group-hover:text-primary transition-colors">
            {resource.title}
          </CardTitle>
          
          {/* Arabic Title */}
          {resource.title_arabic && (
            <p className="text-sm text-muted-foreground font-arabic line-clamp-1">
              {resource.title_arabic}
            </p>
          )}

          {/* Author */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <IconUser className="h-4 w-4 flex-shrink-0" />
            <span className="line-clamp-1">
              {resource.author}
              {resource.author_arabic && (
                <span className="font-arabic ml-1">({resource.author_arabic})</span>
              )}
            </span>
          </div>
        </Link>

        {/* Professional Badges */}
        <div className="flex flex-wrap gap-2 mt-3">
          <Badge 
            variant="outline" 
            className="text-xs font-medium border-primary/30 text-primary"
          >
            {getLanguageLabel(resource.language)}
          </Badge>
          
          {resource.pages && (
            <Badge 
              variant="secondary" 
              className="text-xs font-medium"
            >
              {resource.pages} pages
            </Badge>
          )}
        </div>
      </CardHeader>

      {/* Professional Description */}
      <CardContent className="flex-1 pb-3 px-4">
        <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
          {resource.description || 'Explore this authentic Islamic book and enrich your knowledge with trusted content.'}
        </p>
      </CardContent>

      {/* Professional Footer */}
      <CardFooter className="pt-3 px-4 pb-4 border-t border-gray-100 dark:border-slate-700">
        <div className="w-full space-y-3">
          {/* Rating and Stats */}
          <div className="flex items-center justify-between">
            <RatingDisplay
              rating={resource.average_rating || 0}
              count={resource.total_ratings || 0}
              size="sm"
            />
            
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <IconEye className="h-3.5 w-3.5" />
                <span>{formatNumber(resource.view_count || 0)}</span>
              </div>
              <div className="flex items-center gap-1">
                <IconDownload className="h-3.5 w-3.5" />
                <span>{formatNumber(resource.download_count || 0)}</span>
              </div>
            </div>
          </div>

          {/* Professional Action Button */}
          <Button 
            asChild 
            className="w-full font-medium"
            size="sm"
          >
            <Link href={`/library/${resource.id}`} className="flex items-center justify-center gap-2">
              View Details
              <IconExternalLink className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}

/**
 * Professional ResourceCardSkeleton Component
 */
export function ResourceCardSkeleton() {
  return (
    <Card className="flex flex-col h-full overflow-hidden animate-pulse bg-white dark:bg-slate-900">
      {/* Image Skeleton */}
      <div className="h-48 bg-gray-200 dark:bg-slate-700" />
      
      {/* Content Skeleton */}
      <CardHeader className="pb-3 pt-4 px-4 space-y-3">
        <div className="space-y-2">
          <div className="h-5 bg-gray-200 dark:bg-slate-700 rounded w-4/5" />
          <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-3/5" />
        </div>
        
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-200 dark:bg-slate-700 rounded" />
          <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-2/3" />
        </div>
        
        <div className="flex gap-2">
          <div className="h-5 bg-gray-200 dark:bg-slate-700 rounded w-16" />
          <div className="h-5 bg-gray-200 dark:bg-slate-700 rounded w-12" />
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 pb-3 px-4 space-y-2">
        <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-full" />
        <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-4/5" />
        <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-3/5" />
      </CardContent>
      
      <CardFooter className="pt-3 px-4 pb-4 space-y-3">
        <div className="flex justify-between items-center">
          <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-20" />
          <div className="flex gap-3">
            <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-8" />
            <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-8" />
          </div>
        </div>
        <div className="h-8 bg-gray-200 dark:bg-slate-700 rounded w-full" />
      </CardFooter>
    </Card>
  )
}