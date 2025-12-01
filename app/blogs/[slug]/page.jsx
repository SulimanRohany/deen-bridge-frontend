// app/blog/[slug]/page.jsx
'use client'
import { useState, useEffect, use, useContext } from 'react'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { blogAPI } from '@/lib/api'
import { 
  IconTags, 
  IconArrowLeft,
  IconShare,
  IconHeart,
  IconHeartFilled
} from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import CommentSection from '@/components/blog/CommentSection'
import SocialShare from '@/components/blog/SocialShare'
import RelatedArticleCard from '@/components/blog/RelatedArticleCard'
import BlogContentRenderer from '@/components/blog/BlogContentRenderer'
import { StructuredData } from '@/components/seo/structured-data'
import AuthContext from '@/context/AuthContext'
import { toast } from 'sonner'

export default function BlogPostPage({ params }) {
  // Unwrap the params Promise using React.use()
  const { slug } = use(params)
  const { userData } = useContext(AuthContext)
  
  const [post, setPost] = useState(null)
  const [loading, setLoading] = useState(true)
  const [relatedPosts, setRelatedPosts] = useState([])
  const [isLiked, setIsLiked] = useState(false)
  const [likesCount, setLikesCount] = useState(0)
  const [isLiking, setIsLiking] = useState(false)

  useEffect(() => {
    const fetchPost = async () => {
      try {
        setLoading(true)
        const response = await blogAPI.getPostBySlug(slug)
        setPost(response.data)
        setIsLiked(response.data.is_liked || false)
        setLikesCount(response.data.likes_count || 0)
        
        // Fetch related posts using the new API endpoint
          try {
          const relatedResponse = await blogAPI.getRelatedPosts(slug)
          setRelatedPosts(relatedResponse.data || [])
        } catch (relatedError) {
          // If related posts fetch fails, just show empty state
          setRelatedPosts([])
        }
      } catch (error) {
        notFound()
      } finally {
        setLoading(false)
      }
    }

    fetchPost()
  }, [slug])

  const handleLikeToggle = async () => {
    if (!userData) {
      toast.error('Please log in to like posts')
      return
    }

    if (isLiking || !post) return

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
      // Update post state
      setPost(prev => ({ ...prev, is_liked: response.data.is_liked, likes_count: response.data.likes_count }))
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

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-1/4 mb-4"></div>
            <div className="h-12 bg-muted rounded w-3/4 mb-6"></div>
            <div className="h-96 bg-muted rounded mb-6"></div>
            <div className="space-y-3">
              <div className="h-4 bg-muted rounded w-full"></div>
              <div className="h-4 bg-muted rounded w-full"></div>
              <div className="h-4 bg-muted rounded w-3/4"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!post) {
    notFound()
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Structured Data for SEO */}
      {post && <StructuredData type="blogPost" data={post} />}
      {post && (
        <StructuredData
          type="breadcrumb"
          data={[
            { name: 'Home', url: '/' },
            { name: 'Blog', url: '/blogs' },
            { name: post.title, url: `/blogs/${post.slug}` },
          ]}
        />
      )}
      
      <div className="container mx-auto px-4 py-16 max-w-3xl">
        <article>
          {/* Back Navigation */}
          <div className="mb-12">
            <Link 
              href="/blogs" 
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group"
            >
              <IconArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
              <span>Back to Articles</span>
            </Link>
          </div>

          {/* Article Header */}
          <header className="mb-16">
            {/* Title */}
            <h1 className="text-5xl lg:text-6xl font-bold mb-10 text-foreground leading-[1.1] tracking-tight">
              {post.title}
            </h1>
            
            {/* Author & Meta Info */}
            <div className="flex items-center justify-between pb-6 border-b border-border/50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-gradient-to-br from-muted to-muted/60 rounded-full flex items-center justify-center text-foreground font-medium text-sm shadow-sm">
                  {(post.author_data?.full_name || 'U')[0].toUpperCase()}
                </div>
                <div className="flex flex-col">
                  <p className="font-medium text-foreground text-sm leading-none mb-1">
                    {post.author_data?.full_name || 'Unknown Author'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(post.published_at || post.created_at)}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                {/* Like Button */}
                {userData ? (
                  <button
                    onClick={handleLikeToggle}
                    disabled={isLiking}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-muted transition-colors disabled:opacity-50"
                    aria-label={isLiked ? 'Unlike this post' : 'Like this post'}
                  >
                    {isLiked ? (
                      <IconHeartFilled className="h-5 w-5 text-red-500" />
                    ) : (
                      <IconHeart className="h-5 w-5" />
                    )}
                    <span className="text-sm font-medium">{likesCount}</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-2 px-4 py-2 text-muted-foreground">
                    <IconHeart className="h-5 w-5" />
                    <span className="text-sm font-medium">{likesCount}</span>
                  </div>
                )}
                <SocialShare post={post} />
              </div>
            </div>
          </header>

          {/* Featured Image */}
          {post.featured_image && (
            <div className="relative h-[450px] lg:h-[550px] w-full mb-16 rounded-lg overflow-hidden shadow-sm">
              <Image
                src={post.featured_image}
                alt={post.title}
                fill
                className="object-cover"
                priority
              />
            </div>
          )}

          {/* Article Content */}
          <div className="mb-16">
            <BlogContentRenderer 
              html={post.body}
              className="prose prose-lg dark:prose-invert max-w-none
                prose-headings:font-semibold prose-headings:text-foreground prose-headings:mb-4 prose-headings:mt-8
                prose-p:text-foreground prose-p:leading-relaxed prose-p:mb-6
                prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-a:font-medium hover:prose-a:underline
                prose-strong:text-foreground prose-strong:font-semibold
                prose-code:text-sm prose-code:text-blue-600 dark:prose-code:text-blue-400 prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:font-mono
                prose-pre:bg-muted prose-pre:border prose-pre:border-border
                prose-img:rounded-lg
                prose-blockquote:border-l-2 prose-blockquote:border-border prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-foreground
                prose-ul:my-6 prose-ol:my-6
                prose-li:text-foreground prose-li:my-2"
            />
          </div>

          {/* Article Footer */}
          {post.tags && post.tags.length > 0 && (
            <footer className="pt-8 border-t border-border">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <IconTags size={16} />
                <span>Tags:</span>
                <div className="flex gap-2 flex-wrap">
                  {post.tags.map((tag, index) => (
                    <Link key={index} href={`/blogs?tag=${tag}`}>
                      <span className="hover:text-foreground transition-colors">
                        #{tag}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            </footer>
          )}
        </article>

        {/* Comments Section */}
        <div className="mt-16 pt-12 border-t border-border">
          <CommentSection postId={post.id} comments={post.comments || []} />
        </div>

        {/* Related Articles */}
        {relatedPosts.length > 0 && (
          <section className="mt-16 pt-12 border-t border-border">
            <h2 className="text-2xl font-bold mb-8 text-foreground">Related Articles</h2>
            <div className="grid grid-cols-1 gap-6">
              {relatedPosts.map((relatedPost) => (
                <RelatedArticleCard key={relatedPost.id} post={relatedPost} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}