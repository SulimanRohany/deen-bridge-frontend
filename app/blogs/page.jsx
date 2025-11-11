// app/blog/page.jsx
'use client'
import { useState, useEffect, useMemo } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { blogAPI } from '@/lib/api'
import { 
  Search,
  LayoutGrid,
  LayoutList,
  Tag,
  X
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import BlogPostCard from '@/components/blog/BlogPostCard'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { 
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'

/** Debounce helper */
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(handler)
  }, [value, delay])

  return debouncedValue
}

export default function BlogPage() {
  const [posts, setPosts] = useState([])
  const [featuredPosts, setFeaturedPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('newest')
  const [selectedTag, setSelectedTag] = useState('')
  const searchParams = useSearchParams()
  const router = useRouter()

  const debouncedSearch = useDebounce(searchQuery, 300)

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true)
        const params = {
          status: 'published' // Only published posts
        }

        if (debouncedSearch) {
          params.search = debouncedSearch
        }

        const tag = searchParams.get('tag') || selectedTag
        if (tag) {
          params.tag = tag
          setSelectedTag(tag)
        }

        const response = await blogAPI.getPosts(params)
        const publishedPosts = (response.data || []).filter(post => post.status === 'published')
        setPosts(publishedPosts)
        
        // Set featured posts (first 3 or posts with featured flag if available)
        const featured = publishedPosts.filter(post => post.is_featured).slice(0, 3)
        if (featured.length === 0) {
          setFeaturedPosts(publishedPosts.slice(0, 3))
        } else {
          setFeaturedPosts(featured)
        }
      } catch (error) {
        console.error('Error fetching posts:', error)
        setPosts([])
        setFeaturedPosts([])
      } finally {
        setLoading(false)
      }
    }

    fetchPosts()
  }, [debouncedSearch, searchParams, selectedTag])

  const handleSearch = (e) => {
    setSearchQuery(e.target.value)
  }

  const clearSearch = () => {
    setSearchQuery('')
    setSelectedTag('')
    if (searchParams.get('tag')) {
      router.push('/blogs')
    }
  }

  // Extract all unique tags
  const allTags = useMemo(() => {
    const tags = new Set()
    posts.forEach(post => {
      if (post.tags && Array.isArray(post.tags)) {
        post.tags.forEach(tag => tags.add(tag))
      }
    })
    return Array.from(tags).sort()
  }, [posts])

  // Filter and sort posts
  const filteredPosts = useMemo(() => {
    let filtered = [...posts]

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.published_at || b.created_at) - new Date(a.published_at || a.created_at)
        case 'oldest':
          return new Date(a.published_at || a.created_at) - new Date(b.published_at || b.created_at)
        case 'popular':
          return (b.views || 0) - (a.views || 0)
        case 'title-asc':
          return a.title.localeCompare(b.title)
        case 'title-desc':
          return b.title.localeCompare(a.title)
        default:
          return 0
      }
    })

    return filtered
  }, [posts, sortBy])

  // Calculate stats
  const stats = useMemo(() => {
    const totalPosts = posts.length
    const totalViews = posts.reduce((sum, post) => sum + (post.views || 0), 0)
    const totalComments = posts.reduce((sum, post) => sum + (post.comments_count || 0), 0)
    const featuredCount = featuredPosts.length

    return { totalPosts, totalViews, totalComments, featuredCount }
  }, [posts, featuredPosts])

  return (
    <div className="min-h-screen bg-background">
      
      {/* Simple Header */}
      <div className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="flex items-center justify-between mb-2">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                    Home
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage className="text-gray-900 dark:text-white">Blog</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
                Blog Articles
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Explore Islamic knowledge and insights
              </p>
            </div>
            
            <div className="hidden md:flex items-center gap-6 text-sm">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalPosts}</div>
                <div className="text-gray-600 dark:text-gray-400">Articles</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.totalViews > 1000 ? `${Math.floor(stats.totalViews / 1000)}K+` : stats.totalViews}
                </div>
                <div className="text-gray-600 dark:text-gray-400">Views</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="container mx-auto px-4 py-8 max-w-7xl">

        {/* Search & Controls Section */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            {/* Search Bar */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                placeholder="Search articles..."
                value={searchQuery}
                onChange={handleSearch}
                className="pl-10 pr-10 h-11"
              />
              {searchQuery && (
                <button
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <X className="h-4 w-4 text-gray-400" />
                </button>
              )}
            </div>

            {/* Sort Dropdown */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full md:w-[200px] h-11">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="popular">Most Popular</SelectItem>
                <SelectItem value="title-asc">Title (A-Z)</SelectItem>
                <SelectItem value="title-desc">Title (Z-A)</SelectItem>
              </SelectContent>
            </Select>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="h-9 px-3"
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="h-9 px-3"
              >
                <LayoutList className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Active Filters & Results Count */}
          <div className="flex items-center gap-3 flex-wrap">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              <span className="font-semibold text-gray-900 dark:text-white">{filteredPosts.length}</span> articles
            </p>
            {searchQuery && (
              <Badge variant="secondary" className="gap-1">
                <Search className="h-3 w-3" />
                &quot;{searchQuery}&quot;
              </Badge>
            )}
            {selectedTag && (
              <Badge variant="secondary" className="gap-1">
                <Tag className="h-3 w-3" />
                {selectedTag}
                <X
                  className="h-3 w-3 cursor-pointer hover:text-destructive"
                  onClick={() => {
                    setSelectedTag('')
                    router.push('/blogs')
                  }}
                />
              </Badge>
            )}
          </div>
        </div>

        {/* Tags Section */}
        {!loading && allTags.length > 0 && (
          <div className="mb-8">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Filter by Topic</h3>
            <div className="flex flex-wrap gap-2">
              {allTags.slice(0, 12).map((tag) => (
                <button
                  key={tag}
                  onClick={() => {
                    setSelectedTag(tag)
                    router.push(`/blogs?tag=${tag}`)
                  }}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                    selectedTag === tag
                      ? "bg-primary text-primary-foreground"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                  )}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Articles Grid */}
        <div className="mb-8">
          {loading ? (
            <div className={cn(
              "grid gap-6",
              viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'
            )}>
              {[...Array(6)].map((_, i) => (
                <div key={i} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800">
                  <Skeleton className="h-48 w-full mb-4 rounded" />
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              ))}
            </div>
          ) : filteredPosts.length > 0 ? (
            <div className={cn(
              "grid gap-6",
              viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'
            )}>
              {filteredPosts.map((post) => (
                <BlogPostCard key={post.id} post={post} viewMode={viewMode} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">No articles found</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Try adjusting your search or filters
              </p>
              {(searchQuery || selectedTag) && (
                <Button onClick={clearSearch} variant="outline">
                  <X className="h-4 w-4 mr-2" />
                  Clear Filters
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}