// app/blog/page.jsx
'use client'
import { useState, useEffect, useMemo } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { blogAPI } from '@/lib/api'
import { 
  Search,
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
      {/* Elegant Header */}
      <div className="border-b border-border/50">
        <div className="container mx-auto px-4 py-12 max-w-6xl">
          {/* Breadcrumb */}
          <div className="mb-8">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                    Home
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="text-muted-foreground" />
                <BreadcrumbItem>
                  <BreadcrumbPage className="text-foreground text-sm">Blog</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          
          {/* Title & Stats */}
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-3 leading-tight tracking-tight">
                Blog Articles
              </h1>
              <p className="text-muted-foreground text-base">
                Explore Islamic knowledge and insights
              </p>
            </div>
            
            {/* Stats */}
            <div className="flex items-center gap-8">
              <div className="text-right">
                <div className="text-2xl font-semibold text-foreground leading-none mb-1">
                  {stats.totalPosts}
                </div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide">Articles</div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-semibold text-foreground leading-none mb-1">
                  {stats.totalViews > 1000 ? `${(stats.totalViews / 1000).toFixed(1)}K` : stats.totalViews}
                </div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide">Views</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="container mx-auto px-4 py-12 max-w-6xl">

        {/* Search & Controls Section */}
        <div className="mb-10">
          <div className="flex flex-col md:flex-row gap-3 mb-6">
            {/* Search Bar */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search articles..."
                value={searchQuery}
                onChange={handleSearch}
                className="pl-10 pr-10 h-10 border-border/50 focus:border-border"
              />
              {searchQuery && (
                <button
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-muted transition-colors"
                >
                  <X className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              )}
            </div>

            {/* Sort Dropdown */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full md:w-[180px] h-10 border-border/50">
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
          </div>

          {/* Active Filters & Results Count */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{filteredPosts.length}</span> articles
            </p>
            {searchQuery && (
              <Badge variant="secondary" className="gap-1.5 text-xs font-normal px-2.5 py-0.5">
                <Search className="h-3 w-3" />
                &quot;{searchQuery}&quot;
                <button
                  onClick={clearSearch}
                  className="ml-1 hover:text-foreground transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {selectedTag && (
              <Badge variant="secondary" className="gap-1.5 text-xs font-normal px-2.5 py-0.5">
                <Tag className="h-3 w-3" />
                {selectedTag}
                <button
                  onClick={() => {
                    setSelectedTag('')
                    router.push('/blogs')
                  }}
                  className="ml-1 hover:text-foreground transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
          </div>
        </div>

        {/* Tags Section */}
        {!loading && allTags.length > 0 && (
          <div className="mb-10">
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Filter by Topic</h3>
            <div className="flex flex-wrap gap-2">
              {allTags.slice(0, 12).map((tag) => (
                <button
                  key={tag}
                  onClick={() => {
                    setSelectedTag(tag)
                    router.push(`/blogs?tag=${tag}`)
                  }}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                    selectedTag === tag
                      ? "bg-foreground text-background shadow-sm"
                      : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                  )}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Articles List */}
        <div className="mb-12">
          {loading ? (
            <div className="grid grid-cols-1 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="border border-border rounded-lg p-4 bg-card">
                  <Skeleton className="h-48 w-full mb-4 rounded" />
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              ))}
            </div>
          ) : filteredPosts.length > 0 ? (
            <div className="grid grid-cols-1 gap-6">
              {filteredPosts.map((post) => (
                <BlogPostCard key={post.id} post={post} viewMode="list" />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="h-7 w-7 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-foreground">No articles found</h3>
              <p className="text-muted-foreground mb-6 text-sm">
                Try adjusting your search or filters
              </p>
              {(searchQuery || selectedTag) && (
                <Button onClick={clearSearch} variant="outline" size="sm">
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