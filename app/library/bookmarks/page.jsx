'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { BookmarkCheck, ArrowLeft, Library, Search, X, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import ResourceCard, { ResourceCardSkeleton } from '@/components/library/resource-card'
import { libraryAPI } from '@/lib/api'
import { toast } from 'sonner'

export default function BookmarksPage() {
  const router = useRouter()

  // State
  const [bookmarks, setBookmarks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchBookmarks()
  }, [])

  const fetchBookmarks = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await libraryAPI.getBookmarks()
      const bookmarksData = response.data.results || response.data || []
      
      // Map bookmarks to use resource_details as resource for easier access
      const mappedBookmarks = bookmarksData.map(bookmark => ({
        ...bookmark,
        resource: bookmark.resource_details || bookmark.resource
      }))
      
      setBookmarks(mappedBookmarks)
    } catch (err) {
      
      if (err.response?.status === 401 || err.response?.status === 403) {
        setError('Please login to view your bookmarks')
        toast.error('Please login to continue')
        setTimeout(() => router.push('/login'), 2000)
      } else {
        setError('Failed to load bookmarks. Please try again.')
        toast.error('Failed to load bookmarks')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveBookmark = async (resourceId) => {
    try {
      await libraryAPI.toggleBookmark(resourceId)
      setBookmarks(bookmarks.filter(b => b.resource?.id !== resourceId))
      toast.success('Removed from bookmarks')
    } catch (error) {
      toast.error('Failed to remove bookmark')
    }
  }

  // Simple search filter
  const filteredBookmarks = bookmarks.filter(bookmark => {
    const resource = bookmark.resource
    if (!resource) return false
    
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      return (
        resource.title?.toLowerCase().includes(searchLower) ||
        resource.author?.toLowerCase().includes(searchLower) ||
        resource.title_arabic?.includes(searchTerm) ||
        resource.author_arabic?.includes(searchTerm)
      )
    }
    return true
  })

  return (
    <div className="min-h-screen bg-background">
      
      {/* Simple Header */}
      <div className="border-b bg-gradient-to-r from-primary/5 to-background">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          
          {/* Back Button */}
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-6 hover:bg-primary/10"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Library
          </Button>

          {/* Header Content */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full border border-primary/20 mb-4">
              <BookmarkCheck className="h-5 w-5 text-primary" />
              <span className="text-primary font-semibold">My Bookmarks</span>
            </div>
            
            <h1 className="text-3xl md:text-4xl font-bold mb-2">
              Saved Books
            </h1>
            
            <p className="text-muted-foreground">
              {bookmarks.length} {bookmarks.length === 1 ? 'book' : 'books'} saved
            </p>
          </div>

          {/* Search Bar */}
          <div className="max-w-md mx-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search your bookmarks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-10 h-10"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        
        {/* Loading State */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <ResourceCardSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="text-center py-20">
            <div className="w-16 h-16 mx-auto bg-destructive/10 rounded-full flex items-center justify-center mb-4">
              <BookmarkCheck className="h-8 w-8 text-destructive" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Error Loading Bookmarks</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={fetchBookmarks}>
              Try Again
            </Button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filteredBookmarks.length === 0 && bookmarks.length === 0 && (
          <div className="text-center py-20">
            <div className="w-20 h-20 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <BookmarkCheck className="h-10 w-10 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No Bookmarks Yet</h3>
            <p className="text-muted-foreground mb-6">
              Start building your personal collection by saving books from the library.
            </p>
            <Button asChild>
              <Link href="/library">
                <Library className="h-4 w-4 mr-2" />
                Browse Library
              </Link>
            </Button>
          </div>
        )}

        {/* No Search Results */}
        {!loading && !error && filteredBookmarks.length === 0 && bookmarks.length > 0 && (
          <div className="text-center py-20">
            <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center mb-4">
              <Search className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No Results Found</h3>
            <p className="text-muted-foreground mb-4">
              No bookmarks match your search
            </p>
            <Button onClick={() => setSearchTerm('')} variant="outline">
              Clear Search
            </Button>
          </div>
        )}

        {/* Bookmarks Grid */}
        {!loading && !error && filteredBookmarks.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredBookmarks.map((bookmark) => (
              <div key={bookmark.id} className="relative group">
                <ResourceCard 
                  resource={bookmark.resource} 
                  onBookmarkChange={() => handleRemoveBookmark(bookmark.resource.id)}
                />

                {/* Remove Button on Hover */}
                <div className="absolute -top-2 -right-2 z-30 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      handleRemoveBookmark(bookmark.resource.id)
                    }}
                    className="rounded-full shadow-lg hover:scale-110 transition-transform"
                    title="Remove from bookmarks"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

