'use client'

import { useState, useEffect } from 'react'
import { IconBookmark, IconTrash } from '@tabler/icons-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

export default function BookmarkPanel({ onNavigate }) {
  const [bookmarks, setBookmarks] = useState([])

  // Function to load bookmarks from localStorage
  const loadBookmarks = () => {
    const savedBookmarks = localStorage.getItem('quran_bookmarks')
    if (savedBookmarks) {
      setBookmarks(JSON.parse(savedBookmarks))
    } else {
      setBookmarks([])
    }
  }

  // Load bookmarks on mount
  useEffect(() => {
    loadBookmarks()
  }, [])

  // Listen for bookmark updates
  useEffect(() => {
    const handleBookmarksUpdated = (event) => {
      console.log('📚 Bookmarks updated, reloading...', event.detail)
      loadBookmarks()
    }

    window.addEventListener('bookmarksUpdated', handleBookmarksUpdated)
    
    return () => {
      window.removeEventListener('bookmarksUpdated', handleBookmarksUpdated)
    }
  }, [])

  const removeBookmark = (id) => {
    const updated = bookmarks.filter(b => b.id !== id)
    setBookmarks(updated)
    localStorage.setItem('quran_bookmarks', JSON.stringify(updated))
    
    // Dispatch event to notify other components
    window.dispatchEvent(new CustomEvent('bookmarksUpdated', { detail: updated }))
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-12 w-12 rounded-full hover:bg-primary/10 relative">
          <IconBookmark className="w-5 h-5" />
          {bookmarks.length > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center animate-pulse">
              {bookmarks.length}
            </span>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="text-2xl">My Bookmarked Verses</DialogTitle>
          <DialogDescription>
            Quick access to your saved verses
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Bookmarks Section */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <IconBookmark className="w-5 h-5 text-primary" />
              Bookmarked Verses
            </h3>
            {bookmarks.length > 0 ? (
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {bookmarks.map((bookmark, index) => (
                    <Card
                      key={bookmark.id}
                      className="p-4 hover:border-primary/50 transition-all cursor-pointer group"
                      style={{ animationDelay: `${index * 50}ms` }}
                      onClick={() => {
                        // Open in new tab
                        const url = `/quran?surah=${bookmark.surah}&verse=${bookmark.verse}`
                        window.open(url, '_blank')
                      }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-semibold mb-1">
                            Surah {bookmark.surahName} • Verse {bookmark.verse}
                          </p>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {bookmark.text}
                          </p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {new Date(bookmark.timestamp).toLocaleDateString()}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation()
                            removeBookmark(bookmark.id)
                          }}
                        >
                          <IconTrash className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <Card className="p-8 text-center border-dashed">
                <IconBookmark className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">No bookmarks yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Click the bookmark icon on any verse to save it
                </p>
              </Card>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

