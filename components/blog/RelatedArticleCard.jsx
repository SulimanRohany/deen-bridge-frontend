// components/blog/RelatedArticleCard.jsx
'use client'
import Link from 'next/link'
import Image from 'next/image'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Calendar, 
  User, 
  MessageCircle,
  Heart,
  Clock,
  ChevronRight
} from 'lucide-react'

export default function RelatedArticleCard({ post }) {
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

  // Function to safely strip HTML and get plain text
  const renderSafeHtml = (html) => {
    if (!html) return ''
    // Remove all HTML tags to get plain text
    const safeHtml = html
      .replace(/<script[^>]*>.*?<\/script>/gi, '') // Remove scripts
      .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '') // Remove iframes
      .replace(/<object[^>]*>.*?<\/object>/gi, '') // Remove objects
      .replace(/<embed[^>]*>.*?<\/embed>/gi, '') // Remove embeds
      .replace(/<[^>]+>/g, '') // Remove all HTML tags
    return safeHtml.trim()
  }

  // Calculate reading time (rough estimate: 200 words per minute)
  const getReadingTime = () => {
    const text = renderSafeHtml(post.body || '')
    const wordsPerMinute = 200
    const wordCount = text.split(/\s+/).filter(word => word.length > 0).length
    const minutes = Math.max(1, Math.ceil(wordCount / wordsPerMinute))
    return minutes
  }

  // Get excerpt as plain text
  const getExcerpt = () => {
    const text = renderSafeHtml(post.excerpt || post.body || '')
    return text.substring(0, 200) + (text.length > 200 ? '...' : '')
  }

  const readTime = getReadingTime()
  const excerpt = getExcerpt()

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
                sizes="(max-width: 768px) 100vw, 320px"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="p-8 bg-gradient-to-br from-blue-200/30 to-purple-200/30 dark:from-blue-800/30 dark:to-purple-800/30 rounded-2xl">
                  <div className="text-4xl font-bold text-blue-600 dark:text-blue-400">
                    {(post.title || 'A')[0].toUpperCase()}
                  </div>
                </div>
              </div>
            )}
            
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent"></div>
            
            {/* Reading Time Badge */}
            <div className="absolute bottom-3 right-3">
              <div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-1.5 rounded-full text-xs font-semibold shadow-md border border-gray-200 dark:border-gray-700 flex items-center gap-1.5">
                <Clock className="h-3 w-3" />
                <span>{readTime} min read</span>
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
            </div>

            {/* Title */}
            <h3 className="font-bold text-2xl leading-tight line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300 mb-3">
              {post.title}
            </h3>

            {/* Excerpt */}
            <p className="text-gray-600 dark:text-gray-400 line-clamp-3 mb-4 leading-relaxed">
              {excerpt}
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
              <div className="flex items-center gap-1.5">
                <Heart className="h-4 w-4" />
                <span>{post.likes_count || 0}</span>
              </div>
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

