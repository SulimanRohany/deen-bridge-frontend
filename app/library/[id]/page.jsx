'use client'

import { useState, useEffect, useRef, useContext, useCallback } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  IconBook, IconFileTypePdf, IconDownload, IconEye, IconShare,
  IconChevronRight, IconStar, IconArrowLeft, IconCalendar, IconWorld,
  IconBuilding, IconHash, IconChartBar, IconBookmarkFilled, IconBookmark,
  IconClock, IconLanguage, IconTrendingUp, IconAward, IconSparkles,
  IconHeart, IconMessageCircle, IconCheck, IconExternalLink, IconAlertCircle,
  IconUser, IconRocket
} from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { RatingDisplay } from '@/components/library/rating-stars'
import ReviewCard from '@/components/library/review-card'
import ReviewForm from '@/components/library/review-form'
import ResourceCard from '@/components/library/resource-card'
import { libraryAPI } from '@/lib/api'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import AuthContext from '@/context/AuthContext'
import { setPendingAction } from '@/lib/pendingActions'

export default function ResourceDetailPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const resourceId = params.id
  const { userData } = useContext(AuthContext)

  // State
  const [resource, setResource] = useState(null)
  const [relatedResources, setRelatedResources] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [bookmarkLoading, setBookmarkLoading] = useState(false)
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [editingReview, setEditingReview] = useState(null)
  const [expandDescription, setExpandDescription] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)
  // 🎯 UX Enhancement: Reading Progress Tracking
  const [readingProgress, setReadingProgress] = useState(0)
  const [showStickyActions, setShowStickyActions] = useState(false)
  const contentRef = useRef(null)
  
  const [downloadTriggered, setDownloadTriggered] = useState(false)

  const redirectToAuth = useCallback((actionType, actionData, destination = 'login') => {
    if (actionType && actionData) {
      setPendingAction({
        type: actionType,
        data: actionData,
      })
    }
    router.push(`/${destination}`)
  }, [router])
  
  // 🎯 UX Enhancement: Scroll-based interactions
  useEffect(() => {
    const handleScroll = () => {
      if (!contentRef.current) return
      
      const scrollTop = window.scrollY
      const docHeight = contentRef.current.offsetHeight
      const windowHeight = window.innerHeight
      
      // Calculate reading progress
      const scrollPercent = (scrollTop / (docHeight - windowHeight)) * 100
      setReadingProgress(Math.min(100, Math.max(0, scrollPercent)))
      
      // Show sticky actions after scrolling past hero
      setShowStickyActions(scrollTop > 300)
    }
    
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])
  
  // 🎯 UX Enhancement: Track time spent on page
  useEffect(() => {
    const startTime = Date.now()
    
    return () => {
      const timeSpent = Math.round((Date.now() - startTime) / 1000) // in seconds
      // You can send analytics here
    }
  }, [])

  useEffect(() => {
    fetchResource()
    fetchRelatedResources()
  }, [resourceId])
  
  // 🔐 Auto-download after successful login
  useEffect(() => {
    const autoDownload = searchParams.get('autoDownload')
    if (autoDownload === 'true' && userData && resource && !downloadTriggered) {
      setDownloadTriggered(true)
      // Small delay to ensure everything is loaded
      setTimeout(() => {
        handleDownload()
        // Clear the URL parameter
        router.replace(`/library/${resourceId}`, { scroll: false })
      }, 500)
    }
  }, [searchParams, userData, resource, downloadTriggered])

  const fetchResource = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await libraryAPI.getResourceById(resourceId)
      setResource(response.data)
      setIsBookmarked(response.data.is_bookmarked)
    } catch (err) {
      setError('Failed to load resource. Please try again.')
      toast.error('Failed to load resource')
    } finally {
      setLoading(false)
    }
  }

  const fetchRelatedResources = async () => {
    try {
      const response = await libraryAPI.getRelatedResources(resourceId)
      setRelatedResources(response.data || [])
    } catch (err) {
    }
  }

  const handleBookmarkToggle = async () => {
    // 🔐 Check if user is authenticated
    if (!userData) {
      toast.info('Please log in to bookmark resources')
      redirectToAuth('library_view', { resourceId }, 'login')
      return
    }
    
    setBookmarkLoading(true)
    try {
      const response = await libraryAPI.toggleBookmark(resourceId)
      setIsBookmarked(response.data.bookmarked)
      toast.success(response.data.bookmarked ? 'Added to bookmarks' : 'Removed from bookmarks')
    } catch (error) {
      toast.error('Failed to update bookmark')
    } finally {
      setBookmarkLoading(false)
    }
  }

  const handleDownload = async () => {
    try {
      // 🔐 Check if user is authenticated
      if (!userData) {
        toast.info('Please log in to download this resource')
        redirectToAuth('download_book', {
          resourceId: resourceId,
          resourceTitle: resource?.title || 'Unknown'
        }, 'login')
        return
      }

      const response = await libraryAPI.downloadResource(resourceId)
      
      // Backend returns { message, pdf_url }
      if (response.data.pdf_url) {
        // Fetch the PDF as a blob to force download
        const pdfResponse = await fetch(response.data.pdf_url)
        const blob = await pdfResponse.blob()
        
        // Create a blob URL and download link
        const blobUrl = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = blobUrl
        link.download = `${resource.title}.pdf`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        
        // Clean up the blob URL
        window.URL.revokeObjectURL(blobUrl)
        
        toast.success('Download started successfully')
        
        // Update download count locally without refreshing the page
        setResource(prevResource => ({
          ...prevResource,
          download_count: (prevResource.download_count || 0) + 1
        }))
      } else {
        toast.error('No PDF file available for this resource')
      }
    } catch (error) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        toast.error('Please login to download resources')
      } else if (error.response?.status === 404) {
        toast.error('PDF file not found')
      } else {
        toast.error('Failed to download resource. Please try again.')
      }
    }
  }

  const handleShare = async () => {
    const url = window.location.href
    try {
      if (navigator.share) {
        await navigator.share({
          title: resource.title,
          text: resource.description,
          url: url
        })
      } else {
        await navigator.clipboard.writeText(url)
        toast.success('Link copied to clipboard')
      }
    } catch (error) {
    }
  }

  const handleReviewSuccess = () => {
    setShowReviewForm(false)
    setEditingReview(null)
    fetchResource()
  }

  const handleEditReview = (review) => {
    setEditingReview(review)
    setShowReviewForm(true)
  }

  const handleDeleteReview = () => {
    fetchResource()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-muted border-t-emerald-600 mx-auto"></div>
          <p className="text-sm text-muted-foreground">Loading resource...</p>
        </div>
      </div>
    )
  }

  if (error || !resource) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="p-8 text-center space-y-6">
            <div className="w-16 h-16 mx-auto rounded-full bg-muted/50 flex items-center justify-center">
              <IconBook className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">Resource Not Found</h3>
              <p className="text-muted-foreground text-sm">{error || 'The resource you are looking for does not exist.'}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => router.back()} className="flex-1">
                <IconArrowLeft className="h-4 w-4 mr-2" />
                Go Back
              </Button>
              <Button onClick={() => router.push('/library')} className="flex-1">
                Browse Library
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const getRatingBreakdown = () => {
    if (!resource.rating_breakdown) return []
    return Object.entries(resource.rating_breakdown)
      .sort(([a], [b]) => Number(b) - Number(a))
      .map(([stars, data]) => ({ stars: Number(stars), ...data }))
  }

  return (
    <div ref={contentRef} className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background">
      
      {/* 🎯 PROFESSIONAL HERO BANNER - Clean Business Design */}
      <div className="relative bg-gradient-to-br from-slate-50 via-white to-blue-50/30 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        {/* Subtle professional pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#f8fafc_1px,transparent_1px),linear-gradient(to_bottom,#f8fafc_1px,transparent_1px)] bg-[size:24px_24px] dark:bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)]"></div>
        
        {/* Minimal accent elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 dark:bg-blue-400/5 rounded-full blur-3xl"></div>
        
        {/* Main Content */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 lg:py-16 relative max-w-7xl">
          
          {/* Breadcrumb Navigation */}
          <nav className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-8">
            <Link href="/" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Home</Link>
            <IconChevronRight className="h-4 w-4" />
            <Link href="/library" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Library</Link>
            <IconChevronRight className="h-4 w-4" />
            <span className="text-gray-900 dark:text-white font-medium truncate">{resource.title}</span>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
            {/* Left: Resource Overview */}
            <div className="lg:col-span-2 space-y-8">
              
              {/* Professional Resource Header */}
              <div className="space-y-6">
                {/* Professional Badges */}
                <div className="flex flex-wrap gap-2">
                  {resource.category && (
                    <div className="inline-flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-md border border-slate-200 dark:border-slate-700">
                      <IconBook className="h-3.5 w-3.5 text-slate-600 dark:text-slate-400" />
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{resource.category.name}</span>
                    </div>
                  )}
                  {resource.is_featured && (
                    <div className="inline-flex items-center gap-1.5 bg-blue-600 px-3 py-1.5 rounded-md">
                      <IconStar className="h-3.5 w-3.5 text-white" />
                      <span className="text-sm font-semibold text-white">Featured</span>
                    </div>
                  )}
                </div>
                
                {/* Professional Title */}
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight text-slate-900 dark:text-white">
                {resource.title}
                </h1>
                
                {/* Arabic Title */}
                {resource.title_arabic && (
                  <h2 className="text-2xl sm:text-3xl font-bold text-slate-700 dark:text-slate-300 leading-tight" style={{ fontFamily: 'Amiri, serif' }}>
                    {resource.title_arabic}
                  </h2>
                )}
                
                {/* Professional Description */}
                <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-3xl">
                  {resource.description || 'Professional resource designed to provide comprehensive knowledge and practical insights through expert content and detailed analysis.'}
                </p>

                {/* Resource Statistics */}
                <div className="flex flex-wrap items-center gap-6">
                  {/* Author */}
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                      <IconUser className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                    </div>
                    <div>
                      <span className="text-sm text-slate-600 dark:text-slate-400">Author</span>
                      <p className="font-semibold text-slate-900 dark:text-white">{resource.author || 'Unknown'}</p>
                    </div>
            </div>
            
                  {/* Views */}
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                      <IconEye className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                    </div>
                    <div>
                      <span className="text-xl font-semibold text-slate-900 dark:text-white">{resource.view_count || 0}</span>
                      <span className="text-sm text-slate-600 dark:text-slate-400 ml-1">views</span>
                    </div>
                  </div>

                  {/* Downloads */}
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                      <IconDownload className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                    </div>
                    <div>
                      <span className="text-xl font-semibold text-slate-900 dark:text-white">{resource.download_count || 0}</span>
                      <span className="text-sm text-slate-600 dark:text-slate-400 ml-1">downloads</span>
                    </div>
                  </div>

                  {/* Rating */}
                  {resource.average_rating > 0 && (
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                        <IconStar className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                      </div>
                      <div>
                        <span className="text-xl font-semibold text-slate-900 dark:text-white">{resource.average_rating.toFixed(1)}</span>
                        <span className="text-sm text-slate-600 dark:text-slate-400 ml-1">rating</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Professional Feature Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6">
                  <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex flex-col items-center text-center gap-2">
                      <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                        <IconFileTypePdf className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-slate-900 dark:text-white">PDF</p>
                        <p className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">Format</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex flex-col items-center text-center gap-2">
                      <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                        <IconBook className="h-5 w-5 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-slate-900 dark:text-white">{resource.pages || 'N/A'}</p>
                        <p className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">Pages</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex flex-col items-center text-center gap-2">
                      <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                        <IconLanguage className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-slate-900 dark:text-white">{resource.language || 'EN'}</p>
                        <p className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">Language</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex flex-col items-center text-center gap-2">
                      <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                        <IconCalendar className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-slate-900 dark:text-white">{resource.publication_year || 'N/A'}</p>
                        <p className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">Year</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Professional Value Proposition */}
              <Card className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="shrink-0">
                      <div className="p-3 bg-slate-100 dark:bg-slate-700 rounded-lg">
                        <IconRocket className="h-6 w-6 text-slate-600 dark:text-slate-400" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
                        Why Choose This Resource?
                      </h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5">
                            <div className="p-1 bg-green-100 dark:bg-green-900/30 rounded-full">
                              <IconCheck className="h-4 w-4 text-green-600 dark:text-green-400" />
                            </div>
                          </div>
                          <div>
                            <p className="font-medium text-sm text-slate-900 dark:text-white">Expert Content</p>
                            <p className="text-xs text-slate-600 dark:text-slate-400">Comprehensive and authoritative information</p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <div className="mt-0.5">
                            <div className="p-1 bg-green-100 dark:bg-green-900/30 rounded-full">
                              <IconCheck className="h-4 w-4 text-green-600 dark:text-green-400" />
                            </div>
                          </div>
                          <div>
                            <p className="font-medium text-sm text-slate-900 dark:text-white">Easy Access</p>
                            <p className="text-xs text-slate-600 dark:text-slate-400">Download and read at your convenience</p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <div className="mt-0.5">
                            <div className="p-1 bg-green-100 dark:bg-green-900/30 rounded-full">
                              <IconCheck className="h-4 w-4 text-green-600 dark:text-green-400" />
                            </div>
                          </div>
                          <div>
                            <p className="font-medium text-sm text-slate-900 dark:text-white">High Quality</p>
                            <p className="text-xs text-slate-600 dark:text-slate-400">Well-formatted and professionally presented</p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <div className="mt-0.5">
                            <div className="p-1 bg-green-100 dark:bg-green-900/30 rounded-full">
                              <IconCheck className="h-4 w-4 text-green-600 dark:text-green-400" />
                            </div>
                          </div>
                          <div>
                            <p className="font-medium text-sm text-slate-900 dark:text-white">Trusted Source</p>
                            <p className="text-xs text-slate-600 dark:text-slate-400">Reliable and verified information</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right: Sticky Action Card (Desktop) */}
            <div className="lg:block hidden">
              <Card className="sticky top-4 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-2xl shadow-md overflow-hidden hover:shadow-xl transition-shadow">
                {/* Resource Cover Image - Full Width */}
                <div className="relative h-64 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 overflow-hidden">
                  {resource.cover_image_url ? (
                    <>
                      <img 
                        src={resource.cover_image_url}
                        alt={resource.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="text-center p-6">
                        <IconBook className="h-20 w-20 text-white/80 mx-auto mb-3" />
                        <p className="text-white/80 font-medium text-lg">Resource Cover</p>
                        <p className="text-white/60 text-sm">No image available</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Featured Badge */}
                  {resource.is_featured && (
                    <div className="absolute top-4 right-4">
                      <div className="bg-blue-600 text-white px-3 py-1.5 rounded-full font-bold text-sm shadow-lg">
                        Featured
                      </div>
                    </div>
                  )}
                  
                  {/* Format Badge */}
                  <div className="absolute bottom-4 left-4">
                    <div className="bg-white/90 dark:bg-gray-800/90 text-gray-900 dark:text-white px-3 py-1.5 rounded-full font-bold text-sm shadow-lg">
                      PDF
                    </div>
                  </div>
                </div>

                {/* Action Buttons Section */}
                <div className="p-6 space-y-4">
                  {/* Title */}
                  <div className="text-center">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Ready to Read?</h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">Access this valuable resource</p>
                  </div>
                  
                  {/* Primary Action Buttons */}
                  <div className="space-y-3">
                    <Button
                      onClick={() => window.open(resource.pdf_file_url, '_blank')}
                      size="lg"
                      className="w-full bg-primary hover:bg-primary/90 text-white font-bold shadow-lg"
                    >
                      <IconFileTypePdf className="h-5 w-5 mr-2" />
                      Read Now
                    </Button>
                    
                    <Button 
                      onClick={handleDownload}
                      variant="outline"
                      size="lg"
                      className="w-full border-2 border-primary text-primary hover:bg-primary hover:text-white font-semibold"
                    >
                      <IconDownload className="h-5 w-5 mr-2" />
                      Download PDF
                    </Button>
                  </div>
                </div>

                {/* Quick Actions */}
                <CardContent className="p-6 space-y-4">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                size="sm"
                onClick={handleShare}
                      className="flex-1 hover:bg-primary/10"
              >
                <IconShare className="h-4 w-4 mr-2" />
                Share
              </Button>
                    
              <Button
                variant={isBookmarked ? "default" : "outline"}
                size="sm"
                onClick={handleBookmarkToggle}
                disabled={bookmarkLoading}
                      className="flex-1 font-semibold"
              >
                {isBookmarked ? (
                  <IconBookmarkFilled className="h-4 w-4 mr-2" />
                ) : (
                  <IconBookmark className="h-4 w-4 mr-2" />
                )}
                  {isBookmarked ? 'Saved' : 'Save'}
              </Button>
            </div>
                  
                  {/* Resource Stats */}
                  <div className="space-y-3 pt-4 border-t">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Views</span>
                      <span className="font-semibold">{resource.view_count || 0}</span>
          </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Downloads</span>
                      <span className="font-semibold">{resource.download_count || 0}</span>
                    </div>
                    {resource.average_rating > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Rating</span>
                        <span className="font-semibold">{resource.average_rating.toFixed(1)} ⭐</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 md:py-10 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
          
          {/* 🎯 UX: Main Content Area - 2/3 Width for Better Reading */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Comprehensive Tabs Section */}
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="reviews">Reviews</TabsTrigger>
              </TabsList>

              {/* OVERVIEW TAB */}
              <TabsContent value="overview" className="space-y-6">
                
                {/* About This Resource */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <IconBook className="h-5 w-5 text-primary" />
                      About This Resource
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">Description</h4>
                      <div className={cn(
                        "text-muted-foreground leading-relaxed",
                        !expandDescription && "line-clamp-4"
                      )}>
                        {resource.description || 'This resource provides comprehensive knowledge and insights on the subject matter. It has been carefully curated to provide valuable information for students, researchers, and anyone interested in deepening their understanding of this topic.'}
                      </div>
                      {resource.description && resource.description.length > 200 && (
                        <Button 
                          variant="link" 
                          onClick={() => setExpandDescription(!expandDescription)}
                          className="px-0 mt-2"
                        >
                          {expandDescription ? 'Show less' : 'Read more'}
                        </Button>
                      )}
                    </div>

                    {resource.title_arabic && (
                      <div className="pt-4 border-t">
                        <h4 className="font-semibold mb-2">عنوان بالعربية</h4>
                        <p className="text-2xl" style={{ fontFamily: 'Amiri, serif', direction: 'rtl' }}>
                          {resource.title_arabic}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>



              </TabsContent>

              {/* DETAILS TAB */}
              <TabsContent value="details" className="space-y-6">
                
                {/* Resource Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <IconBook className="h-5 w-5 text-primary" />
                      Resource Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-4">
                      
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Title</p>
                        <p className="font-semibold">{resource.title}</p>
                      </div>

                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Author</p>
                        <p className="font-semibold">{resource.author || 'Unknown'}</p>
                      </div>

                      {resource.publisher && (
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">Publisher</p>
                          <p className="font-semibold">{resource.publisher}</p>
                        </div>
                      )}

                      {resource.publication_year && (
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">Publication Year</p>
                          <p className="font-semibold">{resource.publication_year}</p>
                        </div>
                      )}

                      {resource.isbn && (
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">ISBN</p>
                          <p className="font-semibold font-mono">{resource.isbn}</p>
                        </div>
                      )}

                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Language</p>
                        <p className="font-semibold">{resource.language || 'English'}</p>
                      </div>

                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Pages</p>
                        <p className="font-semibold">{resource.pages || 'N/A'}</p>
                      </div>

                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Format</p>
                        <p className="font-semibold">PDF</p>
                      </div>

                      {resource.category && (
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">Category</p>
                          <p className="font-semibold">{resource.category.name}</p>
                        </div>
                      )}

                      {resource.edition && (
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">Edition</p>
                          <p className="font-semibold">{resource.edition}</p>
                        </div>
                      )}

                    </div>
                  </CardContent>
                </Card>

                {/* Statistics */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <IconChartBar className="h-5 w-5 text-primary" />
                      Resource Statistics
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      
                      <div className="text-center p-4 bg-muted/50 rounded-lg">
                        <IconEye className="h-8 w-8 text-primary mx-auto mb-2" />
                        <p className="text-2xl font-bold">{resource.view_count || 0}</p>
                        <p className="text-sm text-muted-foreground">Views</p>
                        {process.env.NODE_ENV === 'development' && (
                          <p className="text-xs text-muted-foreground">Raw: {resource.view_count}</p>
                        )}
                      </div>

                      <div className="text-center p-4 bg-muted/50 rounded-lg">
                        <IconDownload className="h-8 w-8 text-primary mx-auto mb-2" />
                        <p className="text-2xl font-bold">{resource.download_count || 0}</p>
                        <p className="text-sm text-muted-foreground">Downloads</p>
                        {process.env.NODE_ENV === 'development' && (
                          <p className="text-xs text-muted-foreground">Raw: {resource.download_count}</p>
                        )}
                      </div>

                      <div className="text-center p-4 bg-muted/50 rounded-lg">
                        <IconStar className="h-8 w-8 text-primary mx-auto mb-2" />
                        <p className="text-2xl font-bold">{resource.average_rating?.toFixed(1) || 'N/A'}</p>
                        <p className="text-sm text-muted-foreground">Rating</p>
                        {process.env.NODE_ENV === 'development' && (
                          <p className="text-xs text-muted-foreground">Raw: {resource.average_rating}</p>
                        )}
                      </div>

                      <div className="text-center p-4 bg-muted/50 rounded-lg">
                        <IconMessageCircle className="h-8 w-8 text-primary mx-auto mb-2" />
                        <p className="text-2xl font-bold">{resource.ratings?.length || 0}</p>
                        <p className="text-sm text-muted-foreground">Reviews</p>
                        {process.env.NODE_ENV === 'development' && (
                          <p className="text-xs text-muted-foreground">Raw: {resource.ratings?.length}</p>
                        )}
                      </div>

                    </div>
                  </CardContent>
                </Card>


              </TabsContent>

              {/* REVIEWS TAB */}
              <TabsContent value="reviews" className="space-y-6">
                
                {/* Rating Overview */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <IconStar className="h-5 w-5 text-primary" />
                        Ratings & Reviews
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {resource.ratings?.length || 0} {resource.ratings?.length === 1 ? 'review' : 'reviews'}
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-8">
                      
                      {/* Overall Rating */}
                      <div className="text-center space-y-4">
                        <div>
                          <p className="text-5xl font-bold text-primary">
                            {resource.average_rating ? resource.average_rating.toFixed(1) : 'N/A'}
                          </p>
                          <div className="flex justify-center my-2">
                            <RatingDisplay rating={resource.average_rating || 0} size="lg" />
                          </div>
                          <p className="text-muted-foreground">
                            Based on {resource.ratings?.length || 0} reviews
                          </p>
                        </div>
                        
                        {!showReviewForm && !resource.user_review && (
                          <Button 
                            onClick={() => setShowReviewForm(true)}
                            className="w-full"
                          >
                            <IconMessageCircle className="h-4 w-4 mr-2" />
                            Write a Review
                          </Button>
                        )}
                        {!showReviewForm && resource.user_review && (
                          <Button 
                            onClick={() => {
                              setEditingReview(resource.user_review)
                              setShowReviewForm(true)
                            }}
                            variant="outline"
                            className="w-full"
                          >
                            <IconMessageCircle className="h-4 w-4 mr-2" />
                            Edit Your Review
                          </Button>
                        )}
                      </div>

                      {/* Rating Breakdown */}
                      <div className="space-y-3">
                        {getRatingBreakdown().length > 0 ? (
                          getRatingBreakdown().map((item) => (
                            <div key={item.stars} className="flex items-center gap-3">
                              <div className="flex items-center gap-1 w-20">
                                <span className="text-sm font-medium">{item.stars}</span>
                                <IconStar className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                              </div>
                              <Progress 
                                value={item.percentage} 
                                className="flex-1"
                              />
                              <span className="text-sm text-muted-foreground w-12 text-right">
                                {item.count}
                              </span>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-8 text-muted-foreground">
                            <p>No ratings yet</p>
                            <p className="text-sm mt-1">Be the first to review this resource!</p>
                          </div>
                        )}
                      </div>

                    </div>
                  </CardContent>
                </Card>

                {/* Reviews Section */}
                {resource.ratings && resource.ratings.length > 0 ? (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <IconMessageCircle className="h-5 w-5 text-primary" />
                          User Reviews
                        </div>
                        {resource.user_review && (
                          <Badge variant="outline" className="text-xs">
                            <IconAlertCircle className="h-3 w-3 mr-1" />
                            You can only submit one review
                          </Badge>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        {resource.ratings.map((review, index) => {
                          const isUserReview = resource.user_review && review.id === resource.user_review.id
                          return (
                            <div key={review.id} className={cn(
                              "border-b border-muted pb-6 last:border-b-0 last:pb-0",
                              isUserReview && "bg-primary/5 -mx-4 px-4 py-4 rounded-lg border-primary/20"
                            )}>
                              {isUserReview && (
                                <div className="mb-2">
                                  <Badge variant="secondary" className="bg-primary/10 text-primary">
                                    Your Review
                                  </Badge>
                                </div>
                              )}
                              <ReviewCard
                                review={review}
                                onEdit={handleEditReview}
                                onDelete={handleDeleteReview}
                              />
                            </div>
                          )
                        })}
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <div className="space-y-4">
                        <div className="w-16 h-16 mx-auto rounded-full bg-muted/50 flex items-center justify-center">
                          <IconMessageCircle className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold mb-2">No reviews yet</h3>
                          <p className="text-muted-foreground mb-6">
                            Be the first to share your thoughts about this resource
                          </p>
                          {!resource.user_review ? (
                            <Button onClick={() => setShowReviewForm(true)} size="lg">
                              <IconMessageCircle className="h-4 w-4 mr-2" />
                              Write the First Review
                            </Button>
                          ) : (
                            <Button 
                              onClick={() => {
                                setEditingReview(resource.user_review)
                                setShowReviewForm(true)
                              }} 
                              variant="outline"
                              size="lg"
                            >
                              <IconMessageCircle className="h-4 w-4 mr-2" />
                              Edit Your Review
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

              </TabsContent>


            </Tabs>


          </div>
        </div>

        {/* More Related Resources */}
        {relatedResources.length > 3 && (
          <div className="mt-16 pt-8 border-t">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold mb-1">More Books You'll Love</h2>
                <p className="text-muted-foreground text-sm">
                  Discover similar books based on your interests
                </p>
              </div>
              <Button variant="outline" asChild className="hidden sm:flex">
                <Link href="/library">
                  Browse All
                  <IconChevronRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedResources.slice(3, 7).map((related) => (
                <ResourceCard key={related.id} resource={related} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Review Form Modal */}
      <ReviewForm
        open={showReviewForm}
        onOpenChange={setShowReviewForm}
        resourceId={resourceId}
        existingReview={editingReview || resource.user_review}
        onSuccess={handleReviewSuccess}
      />
    </div>
  )
}
