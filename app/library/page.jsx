'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { 
  Search, 
  SlidersHorizontal, 
  X, 
  BookOpen, 
  Sparkles, 
  Bookmark, 
  BookMarked, 
  Award,
  TrendingUp,
  Download,
  Eye,
  Star,
  Library,
  Globe,
  Users,
  LayoutGrid,
  LayoutList,
  Filter,
  Clock,
  Flame,
  Heart,
  Crown,
  Zap,
  Tag
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import ResourceCard, { ResourceCardSkeleton } from '@/components/library/resource-card'
import ResourceFilters from '@/components/library/resource-filters'
import { libraryAPI } from '@/lib/api'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export default function LibraryPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // State
  const [resources, setResources] = useState([])
  const [featuredResources, setFeaturedResources] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '')
  const [sortBy, setSortBy] = useState('newest')
  const [filters, setFilters] = useState({})
  const [showMobileFilters, setShowMobileFilters] = useState(false)
  const [subjectFilter, setSubjectFilter] = useState(searchParams.get('subject') || '')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [viewMode, setViewMode] = useState('grid') // 'grid', 'list'
  
  // Pagination state
  const [count, setCount] = useState(0)
  const [nextUrl, setNextUrl] = useState(null)
  const [prevUrl, setPrevUrl] = useState(null)
  const [pageSize, setPageSize] = useState(12)
  const [currentPage, setCurrentPage] = useState(1)

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await libraryAPI.getCategories()
        setCategories(response.data || [])
      } catch (err) {
      }
    }
    fetchCategories()
  }, [])

  // Fetch featured resources
  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const response = await libraryAPI.getFeaturedResources()
        setFeaturedResources(response.data || [])
      } catch (err) {
      }
    }
    fetchFeatured()
  }, [])

  // Fetch resources
  useEffect(() => {
    fetchResources()
  }, [searchTerm, filters, sortBy, subjectFilter, selectedCategory, currentPage, pageSize])

  const fetchResources = async (customUrl = null) => {
    setLoading(true)
    setError(null)

    try {
      let response
      
      if (customUrl) {
        // Use the provided URL for next/previous navigation
        response = await libraryAPI.getResourcesByUrl(customUrl)
      } else {
        const params = {
          search: searchTerm || undefined,
          language: filters.languages?.join(',') || undefined,
          min_rating: filters.minRating > 0 ? filters.minRating : undefined,
          ordering: getSortingParam(sortBy),
          subject: subjectFilter || undefined,
          category: selectedCategory !== 'all' ? selectedCategory : undefined,
          page_size: pageSize,
        }

        // Remove undefined params
        Object.keys(params).forEach(key => 
          params[key] === undefined && delete params[key]
        )

        response = await libraryAPI.getResources(params)
      }
      
      const data = response.data
      const results = data.results || data || []
      
      setResources(results)
      setCount(data.count || results.length)
      setNextUrl(data.links?.next || data.next || null)
      setPrevUrl(data.links?.previous || data.previous || null)
    } catch (err) {
      setError('Failed to load resources. Please try again.')
      toast.error('Failed to load resources')
      setResources([])
      setCount(0)
      setNextUrl(null)
      setPrevUrl(null)
    } finally {
      setLoading(false)
    }
  }

  const getSortingParam = (sort) => {
    const sortMap = {
      'newest': '-created_at',
      'oldest': 'created_at',
      'highest-rated': '-average_rating',
      'most-viewed': '-view_count',
      'most-downloaded': '-download_count',
      'title-asc': 'title',
      'title-desc': '-title',
    }
    return sortMap[sort] || '-created_at'
  }

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters)
    setCurrentPage(1)
  }

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value)
    setCurrentPage(1)
  }

  const handleSortChange = (value) => {
    setSortBy(value)
    setCurrentPage(1)
  }

  const clearSearch = () => {
    setSearchTerm('')
    setCurrentPage(1)
  }

  const handleNextPage = () => {
    if (nextUrl) {
      setCurrentPage(prev => prev + 1)
      fetchResources(nextUrl)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handlePrevPage = () => {
    if (prevUrl) {
      setCurrentPage(prev => Math.max(1, prev - 1))
      fetchResources(prevUrl)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const activeFilterCount = useMemo(() => {
    return (
      (filters.languages?.length || 0) +
      (filters.minRating > 0 ? 1 : 0)
    )
  }, [filters])

  // Calculate stats
  const stats = useMemo(() => {
    const totalDownloads = resources.reduce((sum, r) => sum + (r.download_count || 0), 0)
    const totalViews = resources.reduce((sum, r) => sum + (r.view_count || 0), 0)
    const bookmarkedCount = resources.filter(r => r.is_bookmarked).length
    const highRatedCount = resources.filter(r => (r.average_rating || 0) >= 4).length
    
    return {
      totalDownloads,
      totalViews,
      bookmarkedCount,
      highRatedCount
    }
  }, [resources])

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-primary/5 dark:via-primary/5 to-background">

      {/* Modern Clean Hero Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        {/* Simple elegant background pattern */}
        <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] dark:bg-grid-slate-700/25"></div>
        
        {/* Spectacular Library Background */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Animated gradient waves */}
          <div className="absolute inset-0">
            <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-blue-400/20 via-indigo-400/15 to-purple-400/20 dark:from-blue-600/10 dark:via-indigo-600/8 dark:to-purple-600/10 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-gradient-to-bl from-emerald-400/20 via-teal-400/15 to-cyan-400/20 dark:from-emerald-600/10 dark:via-teal-600/8 dark:to-cyan-600/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
            <div className="absolute -bottom-1/2 -left-1/2 w-full h-full bg-gradient-to-tr from-purple-400/20 via-pink-400/15 to-rose-400/20 dark:from-purple-600/10 dark:via-pink-600/8 dark:to-rose-600/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
            <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-amber-400/20 via-orange-400/15 to-yellow-400/20 dark:from-amber-600/10 dark:via-orange-600/8 dark:to-yellow-600/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '3s'}}></div>
          </div>
          
          {/* Floating holographic book cards */}
          <div className="absolute top-16 right-16 w-28 h-36 bg-gradient-to-br from-blue-100/90 via-indigo-100/70 to-purple-100/60 dark:from-blue-900/40 dark:via-indigo-900/30 dark:to-purple-900/20 backdrop-blur-md rounded-lg border border-blue-300/60 dark:border-blue-700/40 shadow-2xl transform rotate-12 hover:rotate-6 transition-all duration-1000 opacity-80">
            <div className="p-3 h-full flex flex-col">
              <div className="flex-1 space-y-1.5">
                <div className="w-full h-2 bg-gradient-to-r from-blue-400/80 to-indigo-400/60 dark:from-blue-500/60 dark:to-indigo-500/40 rounded-sm"></div>
                <div className="w-4/5 h-1.5 bg-gradient-to-r from-blue-300/60 to-indigo-300/40 dark:from-blue-600/40 dark:to-indigo-600/30 rounded-sm"></div>
                <div className="w-3/5 h-1 bg-gradient-to-r from-blue-200/40 to-indigo-200/30 dark:from-blue-700/30 dark:to-indigo-700/20 rounded-sm"></div>
              </div>
              <div className="w-full h-1 bg-gradient-to-r from-blue-500/60 to-indigo-500/40 dark:from-blue-600/40 dark:to-indigo-600/30 rounded-full"></div>
            </div>
          </div>
          
          <div className="absolute top-32 left-12 w-24 h-32 bg-gradient-to-br from-emerald-100/90 via-teal-100/70 to-cyan-100/60 dark:from-emerald-900/40 dark:via-teal-900/30 dark:to-cyan-900/20 backdrop-blur-md rounded-lg border border-emerald-300/60 dark:border-emerald-700/40 shadow-2xl transform -rotate-8 hover:-rotate-4 transition-all duration-1000 opacity-75">
            <div className="p-3 h-full flex flex-col">
              <div className="flex-1 space-y-1.5">
                <div className="w-full h-2 bg-gradient-to-r from-emerald-400/80 to-teal-400/60 dark:from-emerald-500/60 dark:to-teal-500/40 rounded-sm"></div>
                <div className="w-3/4 h-1.5 bg-gradient-to-r from-emerald-300/60 to-teal-300/40 dark:from-emerald-600/40 dark:to-teal-600/30 rounded-sm"></div>
                <div className="w-2/3 h-1 bg-gradient-to-r from-emerald-200/40 to-teal-200/30 dark:from-emerald-700/30 dark:to-teal-700/20 rounded-sm"></div>
              </div>
              <div className="w-full h-1 bg-gradient-to-r from-emerald-500/60 to-teal-500/40 dark:from-emerald-600/40 dark:to-teal-600/30 rounded-full"></div>
            </div>
          </div>
          
          <div className="absolute bottom-28 right-24 w-26 h-34 bg-gradient-to-br from-rose-100/90 via-pink-100/70 to-purple-100/60 dark:from-rose-900/40 dark:via-pink-900/30 dark:to-purple-900/20 backdrop-blur-md rounded-lg border border-rose-300/60 dark:border-rose-700/40 shadow-2xl transform rotate-8 hover:rotate-4 transition-all duration-1000 opacity-70">
            <div className="p-3 h-full flex flex-col">
              <div className="flex-1 space-y-1.5">
                <div className="w-full h-2 bg-gradient-to-r from-rose-400/80 to-pink-400/60 dark:from-rose-500/60 dark:to-pink-500/40 rounded-sm"></div>
                <div className="w-5/6 h-1.5 bg-gradient-to-r from-rose-300/60 to-pink-300/40 dark:from-rose-600/40 dark:to-pink-600/30 rounded-sm"></div>
                <div className="w-4/5 h-1 bg-gradient-to-r from-rose-200/40 to-pink-200/30 dark:from-rose-700/30 dark:to-pink-700/20 rounded-sm"></div>
              </div>
              <div className="w-full h-1 bg-gradient-to-r from-rose-500/60 to-pink-500/40 dark:from-rose-600/40 dark:to-pink-600/30 rounded-full"></div>
            </div>
          </div>
          
          <div className="absolute top-48 left-1/4 w-22 h-30 bg-gradient-to-br from-amber-100/90 via-orange-100/70 to-yellow-100/60 dark:from-amber-900/40 dark:via-orange-900/30 dark:to-yellow-900/20 backdrop-blur-md rounded-lg border border-amber-300/60 dark:border-amber-700/40 shadow-2xl transform -rotate-4 hover:-rotate-2 transition-all duration-1000 opacity-65">
            <div className="p-3 h-full flex flex-col">
              <div className="flex-1 space-y-1.5">
                <div className="w-full h-2 bg-gradient-to-r from-amber-400/80 to-orange-400/60 dark:from-amber-500/60 dark:to-orange-500/40 rounded-sm"></div>
                <div className="w-1/2 h-1.5 bg-gradient-to-r from-amber-300/60 to-orange-300/40 dark:from-amber-600/40 dark:to-orange-600/30 rounded-sm"></div>
                <div className="w-1/3 h-1 bg-gradient-to-r from-amber-200/40 to-orange-200/30 dark:from-amber-700/30 dark:to-orange-700/20 rounded-sm"></div>
              </div>
              <div className="w-full h-1 bg-gradient-to-r from-amber-500/60 to-orange-500/40 dark:from-amber-600/40 dark:to-orange-600/30 rounded-full"></div>
            </div>
          </div>
          
          {/* Dynamic connection network representing knowledge flow */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{opacity: 0.3}}>
            <defs>
              <linearGradient id="bookConnection1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.6"/>
                <stop offset="50%" stopColor="#8b5cf6" stopOpacity="0.4"/>
                <stop offset="100%" stopColor="#ec4899" stopOpacity="0.6"/>
              </linearGradient>
              <linearGradient id="bookConnection2" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.6"/>
                <stop offset="50%" stopColor="#06b6d4" stopOpacity="0.4"/>
                <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.6"/>
              </linearGradient>
            </defs>
            <path d="M 200 100 Q 400 200 600 150" stroke="url(#bookConnection1)" strokeWidth="2" fill="none" className="animate-pulse"/>
            <path d="M 100 300 Q 300 400 500 350" stroke="url(#bookConnection2)" strokeWidth="2" fill="none" className="animate-pulse" style={{animationDelay: '1s'}}/>
            <path d="M 300 50 Q 500 100 700 80" stroke="url(#bookConnection1)" strokeWidth="1.5" fill="none" className="animate-pulse" style={{animationDelay: '2s'}}/>
          </svg>
          
          {/* Floating knowledge particles */}
          <div className="absolute top-20 left-1/3 w-3 h-3 bg-gradient-to-br from-blue-400 to-indigo-400 dark:from-blue-500 dark:to-indigo-500 rounded-full animate-bounce opacity-60"></div>
          <div className="absolute top-40 right-1/3 w-2 h-2 bg-gradient-to-br from-emerald-400 to-teal-400 dark:from-emerald-500 dark:to-teal-500 rounded-full animate-bounce opacity-50" style={{animationDelay: '0.5s'}}></div>
          <div className="absolute bottom-32 left-1/4 w-2.5 h-2.5 bg-gradient-to-br from-rose-400 to-pink-400 dark:from-rose-500 dark:to-pink-500 rounded-full animate-bounce opacity-55" style={{animationDelay: '1s'}}></div>
          <div className="absolute bottom-20 right-1/4 w-1.5 h-1.5 bg-gradient-to-br from-purple-400 to-violet-400 dark:from-purple-500 dark:to-violet-500 rounded-full animate-bounce opacity-45" style={{animationDelay: '1.5s'}}></div>
        </div>
        
        {/* Main Content */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20 lg:py-24 relative">
          <div className="max-w-5xl mx-auto">
            
            {/* Badge */}
            <div className="flex justify-center mb-6">
              <div className="inline-flex items-center gap-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm px-4 py-2 rounded-full border border-gray-200 dark:border-gray-700 shadow-sm">
                <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  📚 Digital Islamic Library
                </span>
                <BookMarked className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            
            {/* Headline */}
            <div className="text-center space-y-4 mb-8">
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black leading-tight tracking-tight">
                <span className="block text-gray-900 dark:text-white">
                  Explore Islamic
                </span>
                <span className="block mt-2 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 dark:from-blue-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
                  Knowledge
                </span>
              </h1>
            </div>
            
            {/* Subtitle */}
            <p className="text-center text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto font-medium leading-relaxed mb-8">
              Access authentic Islamic books and resources • Verified by scholars • Free to read and download
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap justify-center items-center gap-4 mb-10">
              <Button 
                asChild 
                size="lg"
                className="h-12 px-8 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white"
              >
                <Link href="#browse">
                  <BookOpen className="h-5 w-5 mr-2" />
                  Browse Library
                </Link>
              </Button>
              
              <Button 
                asChild 
                variant="outline"
                size="lg"
                className="h-12 px-8 rounded-xl font-semibold border-2 border-gray-300 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-300"
              >
                <Link href="/library/bookmarks">
                  <Bookmark className="h-5 w-5 mr-2" />
                  My Bookmarks
                </Link>
              </Button>
            </div>
            
            {/* Stats Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto">
              <div className="group relative bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-lg transition-all duration-300">
                <div className="flex flex-col items-center gap-3">
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-xl">
                    <BookOpen className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-black text-gray-900 dark:text-white">{count || 0}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 font-medium">Books</div>
                  </div>
                </div>
              </div>
              
              <div className="group relative bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 hover:border-amber-300 dark:hover:border-amber-600 hover:shadow-lg transition-all duration-300">
                <div className="flex flex-col items-center gap-3">
                  <div className="p-3 bg-amber-50 dark:bg-amber-900/30 rounded-xl">
                    <Crown className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-black text-gray-900 dark:text-white">{featuredResources.length}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 font-medium">Featured</div>
                  </div>
                </div>
              </div>
              
              <div className="group relative bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 hover:border-rose-300 dark:hover:border-rose-600 hover:shadow-lg transition-all duration-300">
                <div className="flex flex-col items-center gap-3">
                  <div className="p-3 bg-rose-50 dark:bg-rose-900/30 rounded-xl">
                    <Bookmark className="h-6 w-6 text-rose-600 dark:text-rose-400" />
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-black text-gray-900 dark:text-white">
                      {resources.filter(r => r.is_bookmarked).length}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 font-medium">Saved</div>
                  </div>
                </div>
              </div>
              
              <div className="group relative bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600 hover:shadow-lg transition-all duration-300">
                <div className="flex flex-col items-center gap-3">
                  <div className="p-3 bg-purple-50 dark:bg-purple-900/30 rounded-xl">
                    <Tag className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-black text-gray-900 dark:text-white">{categories.length}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 font-medium">Categories</div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Feature Pills */}
            <div className="flex flex-wrap justify-center items-center gap-3 mt-10">
              <div className="flex items-center gap-2 bg-white dark:bg-gray-800 px-4 py-2 rounded-full border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all">
                <Award className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Verified Sources</span>
              </div>
              <div className="flex items-center gap-2 bg-white dark:bg-gray-800 px-4 py-2 rounded-full border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all">
                <Globe className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Multiple Languages</span>
              </div>
              <div className="flex items-center gap-2 bg-white dark:bg-gray-800 px-4 py-2 rounded-full border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all">
                <Download className="h-4 w-4 text-pink-600 dark:text-pink-400" />
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Free Downloads</span>
              </div>
            </div>
                    
            {/* Social Proof */}
            <div className="text-center pt-8">
              <div className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                <span className="text-sm font-medium">
                  Trusted by <span className="text-gray-900 dark:text-white font-bold">10,000+</span> readers worldwide
                </span>
                <Star className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        
        {/* Featured Resources - MOVED TO TOP */}
        {featuredResources.length > 0 && (
          <div className="mb-10">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Crown className="h-6 w-6 text-amber-500" />
                <h2 className="text-2xl font-bold">Featured Books</h2>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredResources.slice(0, 4).map((resource) => (
                <ResourceCard
                  key={resource.id}
                  resource={resource}
                  onBookmarkChange={() => fetchResources()}
                />
              ))}
            </div>
          </div>
        )}


        {/* Browse by Category - MOVED AFTER QUICK FILTERS */}
        {categories.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-2">
                <Tag className="h-6 w-6 text-primary" />
                <h2 className="text-2xl font-bold">Browse by Category</h2>
              </div>
            </div>
            <ScrollArea className="w-full whitespace-nowrap">
              <div className="flex gap-6 pb-6 px-6">
                {/* All Categories Card */}
                <button
                  onClick={() => {
                    setSelectedCategory('all')
                    setCurrentPage(1)
                  }}
                  className={cn(
                    "group relative flex-shrink-0 w-52 h-36 rounded-2xl border-2 transition-all duration-300 overflow-hidden",
                    selectedCategory === 'all' 
                      ? "border-primary bg-gradient-to-br from-primary/20 to-primary/10 shadow-lg" 
                      : "border-border bg-card hover:border-primary/50 hover:shadow-md"
                  )}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative p-5 h-full flex flex-col justify-between">
                    <div className={cn(
                      "p-3 rounded-xl w-fit transition-colors",
                      selectedCategory === 'all' ? "bg-primary/20" : "bg-muted"
                    )}>
                      <Library className={cn(
                        "h-6 w-6",
                        selectedCategory === 'all' ? "text-primary" : "text-muted-foreground"
                      )} />
                    </div>
                    <div>
                      <p className="font-semibold text-lg">All Books</p>
                      <p className="text-sm text-muted-foreground">{count} items</p>
                    </div>
                  </div>
                </button>

                {/* Category Cards */}
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => {
                      setSelectedCategory(category.id)
                      setCurrentPage(1)
                    }}
                    className={cn(
                      "group relative flex-shrink-0 w-52 h-36 rounded-2xl border-2 transition-all duration-300 overflow-hidden",
                      selectedCategory === category.id 
                        ? "border-primary bg-gradient-to-br from-primary/20 to-primary/10 shadow-lg" 
                        : "border-border bg-card hover:border-primary/50 hover:shadow-md"
                    )}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative p-5 h-full flex flex-col justify-between">
                      <div className={cn(
                        "p-3 rounded-xl w-fit transition-colors",
                        selectedCategory === category.id ? "bg-primary/20" : "bg-muted"
                      )}>
                        <BookOpen className={cn(
                          "h-6 w-6",
                          selectedCategory === category.id ? "text-primary" : "text-muted-foreground"
                        )} />
                      </div>
                      <div>
                        <p className="font-semibold text-lg truncate">{category.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {category.resource_count || 0} items
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </div>
        )}

        {/* Enhanced Search, Sort, and View Controls */}
        <div className="mb-8">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Enhanced Search Bar */}
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground h-5 w-5" />
                <Input
                  placeholder="Search books by title, author, subject, or keywords..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="pl-11 pr-10 h-12 text-base border-2 focus:border-primary rounded-xl shadow-sm"
                />
                {searchTerm && (
                  <button
                    onClick={clearSearch}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg hover:bg-muted transition-colors"
                  >
                    <X className="h-5 w-5 text-muted-foreground hover:text-foreground" />
                  </button>
                )}
              </div>

              {/* Mobile Filter Button */}
              <Sheet open={showMobileFilters} onOpenChange={setShowMobileFilters}>
                <SheetTrigger asChild className="md:hidden">
                  <Button variant="outline" size="lg" className="w-full h-12 rounded-xl border-2">
                    <SlidersHorizontal className="h-5 w-5 mr-2" />
                    Filters
                    {activeFilterCount > 0 && (
                      <Badge variant="secondary" className="ml-2">
                        {activeFilterCount}
                      </Badge>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-80">
                  <SheetHeader>
                    <SheetTitle>Filters</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6">
                    <ResourceFilters
                      onFilterChange={handleFilterChange}
                      initialFilters={filters}
                    />
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            {/* Controls Bar */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3 flex-wrap">
                {/* Results Info */}
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">
                    {loading ? (
                      <span className="text-muted-foreground">Loading...</span>
                    ) : (
                      <>
                        <span className="text-foreground">
                          {((currentPage - 1) * pageSize) + 1}-{Math.min(currentPage * pageSize, count)}
                        </span>
                        <span className="text-muted-foreground"> of {count} books</span>
                      </>
                    )}
                  </p>
                </div>

                {/* Active Search Indicator */}
                {searchTerm && (
                  <Badge variant="secondary" className="gap-1">
                    <Search className="h-3 w-3" />
                    &quot;{searchTerm}&quot;
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-2">
                {/* View Mode Toggle */}
                <div className="hidden md:flex items-center gap-1 p-1 bg-muted rounded-lg">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className="h-8 px-3"
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className="h-8 px-3"
                  >
                    <LayoutList className="h-4 w-4" />
                  </Button>
                </div>

                {/* Sort Dropdown */}
                <Select value={sortBy} onValueChange={handleSortChange}>
                  <SelectTrigger className="w-[180px] h-10 rounded-lg border-2">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Newest First
                      </div>
                    </SelectItem>
                    <SelectItem value="oldest">Oldest First</SelectItem>
                    <SelectItem value="highest-rated">
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4" />
                        Highest Rated
                      </div>
                    </SelectItem>
                    <SelectItem value="most-viewed">
                      <div className="flex items-center gap-2">
                        <Eye className="h-4 w-4" />
                        Most Viewed
                      </div>
                    </SelectItem>
                    <SelectItem value="most-downloaded">
                      <div className="flex items-center gap-2">
                        <Download className="h-4 w-4" />
                        Most Downloaded
                      </div>
                    </SelectItem>
                    <SelectItem value="title-asc">Title (A-Z)</SelectItem>
                    <SelectItem value="title-desc">Title (Z-A)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex gap-8">
          {/* Enhanced Desktop Filters Sidebar */}
          <aside className="hidden md:block w-72 flex-shrink-0">
            <div className="sticky top-4 space-y-4">
              <div className="bg-card border-2 border-border rounded-2xl p-6 shadow-sm">
                <ResourceFilters
                  onFilterChange={handleFilterChange}
                  initialFilters={filters}
                />
              </div>
              
              {/* Quick Stats Card */}
              <div className="bg-gradient-to-br from-primary/10 to-primary/5 border-2 border-primary/20 rounded-2xl p-5 space-y-3">
                <h3 className="font-semibold text-sm uppercase tracking-wider text-primary">
                  Library Stats
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Total Books</span>
                    <span className="font-semibold">{count || 0}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Categories</span>
                    <span className="font-semibold">{categories.length}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Your Saved</span>
                    <span className="font-semibold">{resources.filter(r => r.is_bookmarked).length}</span>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* Resources Display with View Modes */}
          <div className="flex-1 min-w-0">
            {loading ? (
              <div className={cn(
                "grid gap-6",
                viewMode === 'grid' && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
                viewMode === 'list' && "grid-cols-1"
              )}>
                {[...Array(9)].map((_, i) => (
                  <ResourceCardSkeleton key={i} />
                ))}
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-card border-2 border-dashed border-border rounded-2xl">
                <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mb-6">
                  <BookOpen className="h-10 w-10 text-destructive" />
                </div>
                <h3 className="text-2xl font-bold mb-3">Error Loading Books</h3>
                <p className="text-muted-foreground mb-6 max-w-md">{error}</p>
                <Button onClick={fetchResources} size="lg" className="rounded-xl">
                  <TrendingUp className="h-5 w-5 mr-2" />
                  Try Again
                </Button>
              </div>
            ) : resources.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-card border-2 border-dashed border-border rounded-2xl">
                <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-6">
                  <BookOpen className="h-12 w-12 text-muted-foreground" />
                </div>
                <h3 className="text-2xl font-bold mb-3">No books found</h3>
                <p className="text-muted-foreground mb-6 max-w-md">
                  We couldn't find any books matching your criteria. Try adjusting your search or filters.
                </p>
                {(searchTerm || activeFilterCount > 0) && (
                  <Button
                    onClick={() => {
                      setSearchTerm('')
                      setFilters({})
                      setSelectedCategory('all')
                    }}
                    variant="outline"
                    size="lg"
                    className="rounded-xl"
                  >
                    <X className="h-5 w-5 mr-2" />
                    Clear All Filters
                  </Button>
                )}
              </div>
            ) : (
              <>
                {/* Resources Grid/List */}
                <div className={cn(
                  "grid gap-6 transition-all duration-300",
                  viewMode === 'grid' && "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3",
                  viewMode === 'list' && "grid-cols-1"
                )}>
                  {resources.map((resource) => (
                    <ResourceCard
                      key={resource.id}
                      resource={resource}
                      onBookmarkChange={() => fetchResources()}
                    />
                  ))}
                </div>
                
                {/* Enhanced Pagination */}
                <div className="mt-10 pt-8 border-t-2 border-border">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="text-sm text-muted-foreground font-medium">
                          Page <span className="text-foreground font-bold">{currentPage}</span> of{' '}
                          <span className="text-foreground font-bold">{Math.ceil(count / pageSize)}</span>
                        </div>
                        {/* Items per page */}
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground font-medium">Items per page:</span>
                          <Select value={String(pageSize)} onValueChange={(value) => {
                            setPageSize(Number(value))
                            setCurrentPage(1)
                          }}>
                            <SelectTrigger className="w-[80px] h-8 rounded-lg border-2">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="12">12</SelectItem>
                              <SelectItem value="24">24</SelectItem>
                              <SelectItem value="48">48</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="lg"
                          disabled={!prevUrl || loading}
                          onClick={handlePrevPage}
                          className="rounded-xl font-semibold min-w-[120px]"
                        >
                          ← Previous
                        </Button>
                        <div className="hidden sm:flex items-center gap-1">
                          {count > pageSize && Array.from({ length: Math.min(5, Math.ceil(count / pageSize)) }, (_, i) => {
                            const pageNum = i + 1;
                            return (
                              <Button
                                key={pageNum}
                                variant={currentPage === pageNum ? 'default' : 'ghost'}
                                size="sm"
                                onClick={() => {
                                  setCurrentPage(pageNum);
                                  fetchResources();
                                }}
                                className="w-10 h-10 rounded-lg"
                              >
                                {pageNum}
                              </Button>
                            );
                          })}
                        </div>
                        <Button
                          variant="outline"
                          size="lg"
                          disabled={!nextUrl || loading}
                          onClick={handleNextPage}
                          className="rounded-xl font-semibold min-w-[120px]"
                        >
                          Next →
                        </Button>
                      </div>
                    </div>
                  </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

