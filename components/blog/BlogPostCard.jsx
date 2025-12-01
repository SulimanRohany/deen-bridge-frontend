// components/blog/BlogPostCard.jsx
'use client'
import { useState, useContext } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Calendar, 
  User, 
  Tag, 
  Eye,
  MessageCircle,
  Clock,
  ChevronRight,
  Star,
  TrendingUp,
  Award,
  Heart
} from 'lucide-react'
import { IconHeart, IconHeartFilled } from '@tabler/icons-react'
import { cn } from '@/lib/utils'
import AuthContext from '@/context/AuthContext'
import { blogAPI } from '@/lib/api'
import { toast } from 'sonner'

export default function BlogPostCard({ post, isAdmin = false, featured = false, viewMode = 'grid' }) {
  const { userData } = useContext(AuthContext)
  const [isLiked, setIsLiked] = useState(post.is_liked || false)
  const [likesCount, setLikesCount] = useState(post.likes_count || 0)
  const [isLiking, setIsLiking] = useState(false)
  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now - date)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  // Function to safely render HTML content
  const renderSafeHtml = (html) => {
    if (!html) return ''
    // Keep safe formatting tags, remove potentially dangerous ones
    const safeHtml = html
      .replace(/<script[^>]*>.*?<\/script>/gi, '') // Remove scripts
      .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '') // Remove iframes
      .replace(/<object[^>]*>.*?<\/object>/gi, '') // Remove objects
      .replace(/<embed[^>]*>.*?<\/embed>/gi, '') // Remove embeds
      .replace(/<[^>]+>/g, '') // Remove all HTML tags for card preview
    return safeHtml
  }

  // Extract plain text for excerpt
  const getExcerpt = () => {
    const text = renderSafeHtml(post.excerpt || post.body)
    return text.substring(0, viewMode === 'list' ? 200 : 120) + (text.length > 120 ? '...' : '')
  }

  // Calculate reading time (approximate)
  const getReadingTime = () => {
    const text = renderSafeHtml(post.body || '')
    const wordsPerMinute = 200
    const wordCount = text.split(/\s+/).length
    const minutes = Math.ceil(wordCount / wordsPerMinute)
    return minutes
  }

  const handleLikeToggle = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!userData) {
      toast.error('Please log in to like posts')
      return
    }

    if (isLiking) return

    // Optimistic update
    const previousLiked = isLiked
    const previousCount = likesCount
    setIsLiked(!isLiked)
    setLikesCount(prev => previousLiked ? prev - 1 : prev + 1)
    setIsLiking(true)

    try {
      const response = await blogAPI.togglePostLike(post.id)
      setIsLiked(response.data.is_liked)
      setLikesCount(response.data.likes_count)
    } catch (error) {
      // Rollback on error
      setIsLiked(previousLiked)
      setLikesCount(previousCount)
      if (error.response?.status === 401) {
        toast.error('Please log in to like posts')
      } else {
        toast.error('Failed to update like. Please try again.')
      }
    } finally {
      setIsLiking(false)
    }
  }

  if (viewMode === 'list') {
    return (
      <Card className="overflow-hidden transition-all duration-500 hover:shadow-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-2xl group">
        <div className="flex flex-col md:flex-row">
          {/* Image Section */}
          <Link href={`/blogs/${post.slug || post.id}`} className="block md:w-80 flex-shrink-0">
            <div className="relative h-64 md:h-full w-full bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700">
              {post.featured_image ? (
                <Image
                  src={post.featured_image}
                  alt={post.title}
                  fill
                  className="object-cover transition-all duration-500 group-hover:scale-105"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="p-8 bg-gradient-to-br from-blue-200/30 to-purple-200/30 dark:from-blue-800/30 dark:to-purple-800/30 rounded-2xl">
                    <Award className="h-16 w-16 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              )}
              
              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent"></div>
              
              {/* Featured Badge */}
              {featured && (
                <div className="absolute top-3 left-3">
                  <div className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg">
                    <Star className="h-3 w-3" />
                    <span>FEATURED</span>
                  </div>
                </div>
              )}
              
              {/* Reading Time Badge */}
              <div className="absolute bottom-3 right-3">
                <div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-1.5 rounded-full text-xs font-semibold shadow-md border border-gray-200 dark:border-gray-700">
                  {getReadingTime()} min read
                </div>
              </div>
            </div>
          </Link>

          {/* Content Section */}
          <div className="flex-1 flex flex-col p-6">
            <Link href={`/blogs/${post.slug || post.id}`}>
              {/* Meta Info */}
              <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400 mb-3">
                <div className="flex items-center gap-1.5">
                  <User className="h-4 w-4" />
                  <span className="font-medium">{post.author_data?.full_name || 'Unknown Author'}</span>
                </div>
                <span>•</span>
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  <span>{formatDate(post.published_at || post.created_at)}</span>
                </div>
                {post.views && post.views > 0 && (
                  <>
                    <span>•</span>
                    <div className="flex items-center gap-1.5">
                      <Eye className="h-4 w-4" />
                      <span>{post.views > 1000 ? `${(post.views / 1000).toFixed(1)}K` : post.views} views</span>
                    </div>
                  </>
                )}
              </div>

              {/* Title */}
              <h3 className="font-bold text-2xl leading-tight line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300 mb-3">
                {isAdmin && post.status === 'draft' && (
                  <Badge variant="secondary" className="mr-2">Draft</Badge>
                )}
                {post.title}
              </h3>

              {/* Excerpt */}
              <p className="text-gray-600 dark:text-gray-400 line-clamp-3 mb-4 leading-relaxed">
                {getExcerpt()}
              </p>

              {/* Tags */}
              {post.tags && post.tags.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap mb-4">
                  {post.tags.slice(0, 3).map((tag, index) => (
                    <Badge key={index} variant="outline" className="text-xs font-medium px-2.5 py-1">
                      {tag}
                    </Badge>
                  ))}
                  {post.tags.length > 3 && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">+{post.tags.length - 3} more</span>
                  )}
                </div>
              )}
            </Link>

            {/* Footer */}
            <div className="mt-auto flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                {userData && (
                  <button
                    onClick={handleLikeToggle}
                    disabled={isLiking}
                    className="flex items-center gap-1.5 hover:text-red-500 transition-colors disabled:opacity-50"
                    aria-label={isLiked ? 'Unlike this post' : 'Like this post'}
                  >
                    {isLiked ? (
                      <IconHeartFilled className="h-4 w-4 text-red-500" />
                    ) : (
                      <IconHeart className="h-4 w-4" />
                    )}
                    <span>{likesCount}</span>
                  </button>
                )}
                {!userData && (
                  <div className="flex items-center gap-1.5">
                    <IconHeart className="h-4 w-4" />
                    <span>{likesCount}</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <MessageCircle className="h-4 w-4" />
                  <span>{post.comments_count || 0}</span>
                </div>
              </div>

              <Button asChild variant="ghost" className="group/btn">
                <Link href={`/blogs/${post.slug || post.id}`} className="flex items-center gap-2">
                  <span>Read Article</span>
                  <ChevronRight className="h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </Card>
    )
  }

  // Grid View (Default)
  return (
    <Card className={cn(
      "relative flex flex-col h-full overflow-hidden transition-all duration-500 hover:-translate-y-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-2xl shadow-md hover:shadow-xl group",
      featured && "ring-2 ring-amber-500 dark:ring-amber-400"
    )}>
      {/* Image Section */}
      <Link href={`/blogs/${post.slug || post.id}`} className="block">
        <div className="relative h-52 overflow-hidden rounded-t-2xl bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700">
          {post.featured_image ? (
            <Image
              src={post.featured_image}
              alt={post.title}
              fill
              className="object-cover transition-all duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="p-6 bg-gradient-to-br from-blue-200/30 to-purple-200/30 dark:from-blue-800/30 dark:to-purple-800/30 rounded-2xl">
                <Award className="h-12 w-12 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          )}
          
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent"></div>
          
          {/* Status Badges */}
          <div className="absolute top-3 left-3 flex items-center gap-2">
            {featured && (
              <div className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg">
                <Star className="h-3 w-3" />
                <span>FEATURED</span>
              </div>
            )}
            {isAdmin && post.status === 'draft' && (
              <Badge variant="secondary" className="shadow-md">Draft</Badge>
            )}
          </div>
          
          {/* Reading Time */}
          <div className="absolute bottom-3 right-3">
            <div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-1.5 rounded-full text-xs font-semibold shadow-md border border-gray-200 dark:border-gray-700">
              {getReadingTime()} min read
            </div>
          </div>
        </div>
      </Link>

      {/* Card Content */}
      <Link href={`/blogs/${post.slug || post.id}`} className="flex flex-1 flex-col">
        <div className="flex-1 flex flex-col p-5 space-y-3">
          {/* Meta Info */}
          <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-1">
              <User className="h-3 w-3" />
              <span className="truncate max-w-[150px]">{post.author_data?.full_name || 'Unknown'}</span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{formatDate(post.published_at || post.created_at)}</span>
            </div>
          </div>

          {/* Title */}
          <h3 className="font-bold text-lg leading-tight line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300 min-h-[3.5rem]">
            {post.title}
          </h3>

          {/* Excerpt */}
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3 leading-relaxed flex-1">
            {getExcerpt()}
          </p>

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              {post.tags.slice(0, 2).map((tag, index) => (
                <Badge key={index} variant="outline" className="text-xs px-2 py-0.5">
                  {tag}
                </Badge>
              ))}
              {post.tags.length > 2 && (
                <span className="text-xs text-gray-500 dark:text-gray-400">+{post.tags.length - 2}</span>
              )}
            </div>
          )}
        </div>
      </Link>

      {/* Card Footer */}
      <div className="p-5 pt-0 space-y-3">
        <div className="flex items-center justify-between text-xs pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-1">
              <Eye className="h-3.5 w-3.5" />
              <span>{post.views ? (post.views > 1000 ? `${(post.views / 1000).toFixed(1)}K` : post.views) : '0'}</span>
            </div>
            {userData && (
              <button
                onClick={handleLikeToggle}
                disabled={isLiking}
                className="flex items-center gap-1 hover:text-red-500 transition-colors disabled:opacity-50"
                aria-label={isLiked ? 'Unlike this post' : 'Like this post'}
              >
                {isLiked ? (
                  <IconHeartFilled className="h-3.5 w-3.5 text-red-500" />
                ) : (
                  <IconHeart className="h-3.5 w-3.5" />
                )}
                <span>{likesCount}</span>
              </button>
            )}
            {!userData && (
              <div className="flex items-center gap-1">
                <IconHeart className="h-3.5 w-3.5" />
                <span>{likesCount}</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <MessageCircle className="h-3.5 w-3.5" />
              <span>{post.comments_count || 0}</span>
            </div>
          </div>
        </div>

        <Button asChild className="w-full h-11 font-semibold rounded-xl shadow-md hover:shadow-lg transition-all duration-300 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white group/btn">
          <Link href={`/blogs/${post.slug || post.id}`} className="flex items-center justify-center gap-2">
            Read Article
            <ChevronRight className="h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
          </Link>
        </Button>
      </div>
    </Card>
  )
}