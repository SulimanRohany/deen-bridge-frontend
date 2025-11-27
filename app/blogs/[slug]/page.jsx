// app/blog/[slug]/page.jsx
'use client'
import { useState, useEffect, use } from 'react'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { blogAPI } from '@/lib/api'
import { 
  IconCalendar, 
  IconUser, 
  IconTags, 
  IconArrowLeft,
  IconShare
} from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import CommentSection from '@/components/blog/CommentSection'
import SocialShare from '@/components/blog/SocialShare'
import BlogPostCard from '@/components/blog/BlogPostCard'
import { StructuredData } from '@/components/seo/structured-data'

export default function BlogPostPage({ params }) {
  // Unwrap the params Promise using React.use()
  const { slug } = use(params)
  
  const [post, setPost] = useState(null)
  const [loading, setLoading] = useState(true)
  const [relatedPosts, setRelatedPosts] = useState([])

  useEffect(() => {
    const fetchPost = async () => {
      try {
        setLoading(true)
        console.log('Fetching post with slug:', slug)
        const response = await blogAPI.getPostBySlug(slug)
        console.log('Post response:', response.data)
        setPost(response.data)
        
        // Fetch related posts
        if (response.data.tags && response.data.tags.length > 0) {
          console.log('Fetching related posts for tag:', response.data.tags[0])
          try {
            const tagResponse = await blogAPI.getPosts({ tag: response.data.tags[0], limit: 3 })
            console.log('Related posts response:', tagResponse.data)
            setRelatedPosts(tagResponse.data.filter(p => p.id !== response.data.id))
          } catch (tagError) {
            console.error('Error fetching related posts:', tagError)
            setRelatedPosts([])
          }
        } else {
          console.log('No tags found for post, skipping related posts')
          setRelatedPosts([])
        }
      } catch (error) {
        console.error('Error fetching post:', error)
        console.error('Error details:', error.response?.data || error.message)
        notFound()
      } finally {
        setLoading(false)
      }
    }

    fetchPost()
  }, [slug])

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-12 bg-gray-200 rounded w-3/4 mb-6"></div>
            <div className="h-96 bg-gray-200 rounded mb-6"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
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
    <div className="min-h-screen bg-white dark:bg-gray-900">
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
      
      {/* Simple Header */}
      <div className="border-b border-gray-200 dark:border-gray-800">
        <div className="container mx-auto px-4 py-4 max-w-4xl">
          <Button asChild variant="ghost" size="sm">
            <Link href="/blogs" className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
              <IconArrowLeft className="h-4 w-4" />
              Back to Articles
            </Link>
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <article>
          {/* Article Header */}
          <header className="mb-12">
            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="flex gap-2 mb-6">
                {post.tags.map((tag, index) => (
                  <Link key={index} href={`/blogs?tag=${tag}`}>
                    <Badge variant="secondary" className="text-xs font-medium">
                      {tag}
                    </Badge>
                  </Link>
                ))}
              </div>
            )}
            
            {/* Title */}
            <h1 className="text-4xl lg:text-5xl font-bold mb-8 text-gray-900 dark:text-white leading-tight">
              {post.title}
            </h1>
            
            {/* Author & Meta Info */}
            <div className="flex items-center justify-between pb-8 border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center text-gray-700 dark:text-gray-300 font-semibold">
                  {(post.author_data?.full_name || 'U')[0].toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white text-sm">
                    {post.author_data?.full_name || 'Unknown Author'}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                    <span>{formatDate(post.published_at || post.created_at)}</span>
                    {post.views && post.views > 0 && (
                      <>
                        <span>•</span>
                        <span>{post.views > 1000 ? `${(post.views / 1000).toFixed(1)}K` : post.views} views</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              
              <SocialShare post={post} />
            </div>
          </header>

          {/* Featured Image */}
          {post.featured_image && (
            <div className="relative h-[400px] lg:h-[500px] w-full mb-12 rounded-lg overflow-hidden">
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
          <div className="mb-12">
            <div 
              className="prose prose-lg dark:prose-invert max-w-none
                prose-headings:font-semibold prose-headings:text-gray-900 dark:prose-headings:text-white prose-headings:mb-4 prose-headings:mt-8
                prose-p:text-gray-700 dark:prose-p:text-gray-300 prose-p:leading-relaxed prose-p:mb-6
                prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-a:font-medium hover:prose-a:underline
                prose-strong:text-gray-900 dark:prose-strong:text-white prose-strong:font-semibold
                prose-code:text-sm prose-code:text-blue-600 dark:prose-code:text-blue-400 prose-code:bg-gray-100 dark:prose-code:bg-gray-800 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:font-mono
                prose-pre:bg-gray-100 dark:prose-pre:bg-gray-800 prose-pre:border prose-pre:border-gray-200 dark:prose-pre:border-gray-700
                prose-img:rounded-lg
                prose-blockquote:border-l-2 prose-blockquote:border-gray-300 dark:prose-blockquote:border-gray-600 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-gray-700 dark:prose-blockquote:text-gray-300
                prose-ul:my-6 prose-ol:my-6
                prose-li:text-gray-700 dark:prose-li:text-gray-300 prose-li:my-2"
              dangerouslySetInnerHTML={{ __html: post.body }}
            />
          </div>

          {/* Article Footer */}
          {post.tags && post.tags.length > 0 && (
            <footer className="pt-8 border-t border-gray-200 dark:border-gray-800">
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <IconTags size={16} />
                <span>Tags:</span>
                <div className="flex gap-2 flex-wrap">
                  {post.tags.map((tag, index) => (
                    <Link key={index} href={`/blogs?tag=${tag}`}>
                      <span className="hover:text-gray-900 dark:hover:text-white transition-colors">
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
        <div className="mt-16 pt-12 border-t border-gray-200 dark:border-gray-800">
          <CommentSection postId={post.id} comments={post.comments || []} />
        </div>

        {/* Related Articles */}
        {relatedPosts.length > 0 && (
          <section className="mt-16 pt-12 border-t border-gray-200 dark:border-gray-800">
            <h2 className="text-2xl font-bold mb-8 text-gray-900 dark:text-white">Related Articles</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedPosts.map((relatedPost) => (
                <BlogPostCard key={relatedPost.id} post={relatedPost} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}