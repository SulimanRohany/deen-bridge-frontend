'use client'

import { useState, useEffect, useRef, useCallback, useContext } from 'react'
import { useRouter } from 'next/navigation'
import { 
  IconPlayerPlay, 
  IconBookmark, 
  IconLanguage, 
  IconCopy, 
  IconShare, 
  IconLoader2,
  IconSearch,
  IconX,
  IconLock
} from '@tabler/icons-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import api, { quranAPI } from '@/lib/api'
import { toast } from 'sonner'
import VerseSkeleton from './VerseSkeleton'
import AuthContext from '@/context/AuthContext'
import { setPendingAction } from '@/lib/pendingActions'

export default function ImprovedQuranReader({ 
  selectedSurah, 
  currentVerse, 
  onVerseChange, 
  onVersesLoad, 
  onVersePlay, 
  isAudioPlaying 
}) {
  const { userData } = useContext(AuthContext)
  const router = useRouter()
  
  // Debug: Log userData state
  useEffect(() => {
    console.log('🔑 Auth State:', {
      isAuthenticated: !!userData,
      userData: userData,
      userDataType: typeof userData
    })
  }, [userData])
  
  const [surahData, setSurahData] = useState(null)
  const [activeVerse, setActiveVerse] = useState(null)
  const [showTranslation, setShowTranslation] = useState(true)
  const [hoveredVerse, setHoveredVerse] = useState(null)
  const [animateVerses, setAnimateVerses] = useState(false)
  const [bookmarkedVerses, setBookmarkedVerses] = useState(new Set())
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredVerses, setFilteredVerses] = useState([])
  const [fontSize, setFontSize] = useState('large') // small, medium, large, xlarge
  const [scrollProgress, setScrollProgress] = useState(0)
  const containerRef = useRef(null)
  const versesContainerRef = useRef(null)
  const hasScrolledToInitialVerse = useRef(false)
  const previousVerse = useRef(null)
  const scrollTimeoutRef = useRef(null)
  const wasPlaying = useRef(false)
  
  const MAX_FREE_VERSES = 5 // Unauthenticated users can only view first 5 ayahs
  const LOCKED_PREVIEW_COUNT = 1 // Show 1 blurred ayah (6)
  
  // Pagination state
  const [allVerses, setAllVerses] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [hasNextPage, setHasNextPage] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [totalVerses, setTotalVerses] = useState(0)
  const PAGE_SIZE = 50

  // Font size classes
  const fontSizes = {
    small: 'text-2xl md:text-3xl',
    medium: 'text-3xl md:text-4xl',
    large: 'text-3xl md:text-4xl lg:text-5xl',
    xlarge: 'text-4xl md:text-5xl lg:text-6xl'
  }

  const requireAuthentication = useCallback((actionType, actionData, destination = 'login') => {
    setPendingAction({
      type: actionType,
      data: actionData,
    })
    router.push(`/${destination}`)
  }, [router])

  // Centralized scroll function for perfect scroll behavior
  const scrollToVerse = useCallback((verseNumber, options = {}) => {
    const { 
      delay = 300, 
      behavior = 'smooth',
      offsetTop = 120, // Account for header and audio player
      reason = 'unknown'
    } = options

    // Clear any pending scroll to prevent conflicts
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current)
    }

    scrollTimeoutRef.current = setTimeout(() => {
      if (!versesContainerRef.current) {
        console.log('⚠️ Verses container not ready')
        return
      }

      const verseElement = versesContainerRef.current.querySelector(`[data-verse="${verseNumber}"]`)
      
      if (verseElement) {
        console.log(`🎯 Scrolling to ayah ${verseNumber} (${reason})`)
        
        // Get the verse element's position relative to the viewport
        const verseRect = verseElement.getBoundingClientRect()
        const absoluteTop = verseRect.top + window.pageYOffset
        
        // Calculate target scroll position with offset
        const targetScrollTop = absoluteTop - offsetTop
        
        // Smooth scroll to calculated position
        window.scrollTo({
          top: Math.max(0, targetScrollTop),
          behavior: behavior
        })
      } else {
        console.log(`⚠️ Verse ${verseNumber} not found in DOM`)
      }
    }, delay)
  }, [])

  // Cleanup scroll timeout on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }
    }
  }, [])

  // Track scroll progress
  useEffect(() => {
    const handleScroll = () => {
      const windowHeight = window.innerHeight
      const documentHeight = document.documentElement.scrollHeight
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop
      const scrollPercentage = (scrollTop / (documentHeight - windowHeight)) * 100
      setScrollProgress(Math.min(100, Math.max(0, scrollPercentage)))
    }

    window.addEventListener('scroll', handleScroll)
    handleScroll() // Initial call
    
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Monitor network status
  useEffect(() => {
    const handleOnline = () => {
      toast.success('Internet connection restored', {
        duration: 3000,
        icon: '✅'
      })
    }
    
    const handleOffline = () => {
      toast.warning('You are offline. Some features may not work.', {
        duration: 5000,
        icon: '⚠️'
      })
    }
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Load preferences
  useEffect(() => {
    const savedShowTranslation = localStorage.getItem('quran_show_translation')
    const savedFontSize = localStorage.getItem('quran_font_size')
    
    if (savedShowTranslation !== null) {
      setShowTranslation(savedShowTranslation === 'true')
    }
    if (savedFontSize) {
      setFontSize(savedFontSize)
    }
  }, [])

  // Save preferences
  useEffect(() => {
    localStorage.setItem('quran_show_translation', showTranslation.toString())
    localStorage.setItem('quran_font_size', fontSize)
  }, [showTranslation, fontSize])

  // Load bookmarks from localStorage
  useEffect(() => {
    const savedBookmarks = localStorage.getItem('quran_bookmarks')
    if (savedBookmarks) {
      const bookmarks = JSON.parse(savedBookmarks)
      const currentSurahBookmarks = bookmarks
        .filter(b => b.surah === selectedSurah)
        .map(b => b.verse)
      setBookmarkedVerses(new Set(currentSurahBookmarks))
    }
  }, [selectedSurah])

  // Fetch surah metadata (without verses)
  useEffect(() => {
    const fetchSurahMetadata = async () => {
      setAnimateVerses(false)
      setLoading(true)
      setSearchQuery('')
      setAllVerses([])
      setCurrentPage(1)
      setHasNextPage(false)
      
      try {
        // Fetch surah info only (no verses)
        const response = await quranAPI.getSurahByNumber(selectedSurah)
        const data = response.data
        
        const transformedData = {
          number: data.number,
          name: data.name_arabic,
          transliteration: data.name_transliteration,
          translation: data.name_translation,
          verses: data.total_verses,
          revelationType: data.revelation_type?.charAt(0).toUpperCase() + data.revelation_type?.slice(1),
        }
        
            setSurahData(transformedData)
        setTotalVerses(data.total_verses)
        
        // Fetch first page of verses
        await fetchVerses(1)
        
      } catch (error) {
        console.error('Error fetching surah data:', error)
        setLoading(false)
        
        // Check if it's a network error
        if (!navigator.onLine || error.message === 'Network Error' || error.code === 'ERR_NETWORK') {
          toast.error('No internet connection. Please check your network and try again.', {
            duration: 5000,
            icon: '🌐'
          })
        } else if (error.response?.status === 404) {
          toast.error('Surah not found. Please select a valid Surah.')
        } else {
          toast.error('Failed to load Surah. Please try again.')
        }
      }
    }
    
    fetchSurahMetadata()
  }, [selectedSurah])
  
  // Fetch verses with pagination
  const fetchVerses = async (page = 1) => {
    if (page === 1) {
      setLoading(true)
    } else {
      setLoadingMore(true)
    }
    
    try {
      const response = await api.get(`/quran/surahs/${selectedSurah}/verses/?page=${page}&page_size=${PAGE_SIZE}`)
      const data = response.data
      
      // Debug logging
      console.log('📡 API Response:', {
        authenticated: data.is_authenticated,
        restricted: data.access_restricted,
        totalCount: data.count,
        resultsCount: data.results?.length,
        hasNext: !!data.next,
        message: data.message
      })
      
      const transformedVerses = data.results.map(v => ({
        number: v.verse_number,
        arabic: v.text_arabic,
        translation: v.text_translation,
        audio_url: v.audio_url
      }))
      
      console.log('📝 Transformed verses:', transformedVerses.length, 'verses')
      console.log('📋 Verse numbers:', transformedVerses.map(v => v.number))
      
      setTotalVerses(data.count)
      setHasNextPage(!!data.next)
      
      if (page === 1) {
        setAllVerses(transformedVerses)
        setFilteredVerses(transformedVerses)
        
        setTimeout(() => {
          setAnimateVerses(true)
          setActiveVerse(null)
          setLoading(false)
          
          if (onVersesLoad) {
            onVersesLoad(transformedVerses)
          }
        }, 300)
      } else {
        const newVerses = [...allVerses, ...transformedVerses]
        setAllVerses(newVerses)
        setFilteredVerses(newVerses)
        
        if (onVersesLoad) {
          onVersesLoad(newVerses)
        }
        setLoadingMore(false)
      }
      
      setCurrentPage(page)
      
    } catch (error) {
      console.error('Error fetching verses:', error)
      setLoading(false)
      setLoadingMore(false)
      
      // Check if it's a network error
      if (!navigator.onLine || error.message === 'Network Error' || error.code === 'ERR_NETWORK') {
        toast.error('No internet connection. Please check your network and try again.', {
          duration: 5000,
          icon: '🌐'
        })
      } else if (error.response?.status === 404) {
        toast.error('Verses not found. Please try a different page.')
      } else {
        toast.error('Failed to load verses. Please try again.')
      }
    }
  }

  // Handle search/filter
  useEffect(() => {
    if (allVerses.length === 0) return
    
    if (!searchQuery.trim()) {
      setFilteredVerses(allVerses)
      return
    }
    
    const query = searchQuery.toLowerCase()
    const filtered = allVerses.filter(verse => 
      verse.arabic.includes(searchQuery) || 
      verse.translation.toLowerCase().includes(query) ||
      verse.number.toString().includes(query)
    )
    
    setFilteredVerses(filtered)
  }, [searchQuery, allVerses])
  
  // Infinite scroll - Load next page when scrolling near bottom (authenticated users only)
  useEffect(() => {
    if (!userData || !hasNextPage || loadingMore || searchQuery) return
    
    const handleScroll = () => {
      if (!hasNextPage || loadingMore) return
      
      // Check if we're near the bottom
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop
      const scrollHeight = document.documentElement.scrollHeight
      const clientHeight = window.innerHeight
      const scrollPercentage = (scrollTop / (scrollHeight - clientHeight)) * 100
      
      // Load next page when 80% scrolled (only loads ONE page at a time)
      if (scrollPercentage > 80) {
        console.log('📄 Loading next page...', currentPage + 1)
        fetchVerses(currentPage + 1)
      }
    }
    
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [userData, hasNextPage, loadingMore, currentPage, searchQuery])

  // Sync with external currentVerse changes and auto-scroll
  useEffect(() => {
    if (currentVerse) {
      // Always update active verse
      setActiveVerse(currentVerse)
      
      // Detect if verse changed
      const verseChanged = previousVerse.current !== currentVerse
      
      // Detect if play was just triggered (was not playing, now playing)
      const playTriggered = !wasPlaying.current && isAudioPlaying
      
      // Scroll conditions:
      // 1. Verse changed (navigation/next/previous)
      // 2. Play was triggered (user clicked play)
      const shouldScroll = verseChanged || playTriggered
      
      if (shouldScroll) {
        if (verseChanged) {
          console.log('🎵 Verse changed from', previousVerse.current, 'to', currentVerse)
        }
        if (playTriggered) {
          console.log('▶️ Play triggered on verse', currentVerse)
        }
        
        // Check if verse exists in current filtered verses
        const verseExists = filteredVerses.some(v => v.number === currentVerse)
        
        if (verseExists) {
          // Scroll to the verse with perfect positioning
          scrollToVerse(currentVerse, { 
            delay: 250, 
            reason: playTriggered ? 'play triggered' : 'verse navigation' 
          })
        } else if (hasNextPage && !loadingMore && currentVerse > filteredVerses.length) {
          // Verse not loaded yet - load more pages
          console.log('📄 Auto-loading more verses to reach ayah:', currentVerse)
          fetchVerses(currentPage + 1)
        }
        
        // Update previous verse ref
        previousVerse.current = currentVerse
      } else if (previousVerse.current === null) {
        // First render - just update the ref
        previousVerse.current = currentVerse
      }
      
      // Update wasPlaying ref for next render
      wasPlaying.current = isAudioPlaying
    }
  }, [currentVerse, isAudioPlaying, filteredVerses, hasNextPage, loadingMore, currentPage, scrollToVerse])

  // Reset scroll flag when surah changes
  useEffect(() => {
    hasScrolledToInitialVerse.current = false
    previousVerse.current = null
    wasPlaying.current = false
    console.log('🔄 Surah changed to:', selectedSurah, '- Resetting scroll tracking')
  }, [selectedSurah])

  // Additional effect: Scroll when verses finish loading (for bookmarks/initial load)
  useEffect(() => {
    if (currentVerse && filteredVerses.length > 0 && !loading && !loadingMore) {
      // Check if the target verse is in the filtered verses
      const targetVerseExists = filteredVerses.some(v => v.number === currentVerse)
      
      if (targetVerseExists && !hasScrolledToInitialVerse.current) {
        console.log('✅ Initial verses loaded, scrolling to ayah:', currentVerse)
        hasScrolledToInitialVerse.current = true
        
        // Use centralized scroll with longer delay for initial load
        scrollToVerse(currentVerse, { 
          delay: 500, 
          offsetTop: 150, // More offset for better initial view
          reason: 'initial page load / bookmark' 
        })
      }
    }
  }, [filteredVerses, loading, loadingMore, currentVerse, scrollToVerse])

  if (loading) {
    return (
      <div>
        {/* Header Skeleton */}
        <Card className="mb-8 p-6 md:p-8 text-center border-2 animate-pulse">
          <div className="mb-6">
            <div className="inline-block p-6 rounded-2xl bg-muted mb-4">
              <div className="h-12 w-48 bg-muted-foreground/20 rounded mx-auto" />
            </div>
            <div className="h-8 w-64 bg-muted rounded mx-auto mb-2" />
            <div className="h-6 w-80 bg-muted/70 rounded mx-auto" />
        </div>
        </Card>
        
        {/* Verses Skeleton */}
        <VerseSkeleton count={5} />
      </div>
    )
  }

  if (!surahData) return null

  const handleVerseClick = (verseNumber) => {
    setActiveVerse(verseNumber)
    if (onVerseChange) {
      onVerseChange(verseNumber)
    }
  }

  const handleBookmark = (verse, event) => {
    event.stopPropagation()
    const savedBookmarks = localStorage.getItem('quran_bookmarks')
    let bookmarks = savedBookmarks ? JSON.parse(savedBookmarks) : []
    
    const bookmarkId = `${selectedSurah}-${verse.number}`
    const existingIndex = bookmarks.findIndex(b => b.id === bookmarkId)
    
    if (existingIndex >= 0) {
      bookmarks.splice(existingIndex, 1)
      setBookmarkedVerses(prev => {
        const newSet = new Set(prev)
        newSet.delete(verse.number)
        return newSet
      })
    } else {
      bookmarks.push({
        id: bookmarkId,
        surah: selectedSurah,
        surahName: surahData.transliteration,
        verse: verse.number,
        text: verse.arabic,
        timestamp: new Date().toISOString()
      })
      setBookmarkedVerses(prev => new Set(prev).add(verse.number))
    }
    
    localStorage.setItem('quran_bookmarks', JSON.stringify(bookmarks))
    
    // Dispatch custom event to notify BookmarkPanel of changes
    window.dispatchEvent(new CustomEvent('bookmarksUpdated', { detail: bookmarks }))
  }

  const handleCopyVerse = (verse, event) => {
    event.stopPropagation()
    const text = `${verse.arabic}\n\n${verse.translation}\n\n— Surah ${surahData.transliteration} (${surahData.number}), Verse ${verse.number}`
    navigator.clipboard.writeText(text)
  }

  const handleShareVerse = (verse, event) => {
    event.stopPropagation()
    const text = `${verse.arabic}\n\n${verse.translation}\n\n— Surah ${surahData.transliteration} (${surahData.number}), Verse ${verse.number}`
    
    if (navigator.share) {
      navigator.share({
        title: `Surah ${surahData.transliteration}, Verse ${verse.number}`,
        text: text
      }).catch(() => {
        // Fallback to copy
        navigator.clipboard.writeText(text)
      })
    } else {
      navigator.clipboard.writeText(text)
    }
  }

  // 🔐 Check if verse is restricted for unauthenticated users
  const isVerseRestricted = (verseNumber) => {
    return !userData && verseNumber > MAX_FREE_VERSES
  }

  // Handle verse click with restriction check
  const handleRestrictedVerseClick = (verseNumber) => {
    if (isVerseRestricted(verseNumber)) {
      requireAuthentication('quran_read', {
        surah: selectedSurah,
        verse: verseNumber
      })
      return
    }
    handleVerseClick(verseNumber)
  }

  // Render a single verse card with optional blur for locked content
  const renderVerseCard = (verse, isLocked = false) => (
    <div key={verse.number} className="relative">
      <Card
        data-verse={verse.number}
        className={`verse-card p-6 md:p-8 border-2 transition-all duration-500 ${
          isLocked ? 'cursor-not-allowed' : 'cursor-pointer'
        } ${
          activeVerse === verse.number && isAudioPlaying ? 'border-primary bg-primary/5 verse-active verse-playing' : ''
        } ${activeVerse === verse.number ? 'border-primary/50 bg-primary/3' : ''} ${
          isLocked ? 'blur-sm opacity-60 pointer-events-none' : ''
        }`}
        onClick={() => !isLocked && handleRestrictedVerseClick(verse.number)}
        onMouseEnter={() => !isLocked && setHoveredVerse(verse.number)}
        onMouseLeave={() => !isLocked && setHoveredVerse(null)}
      >
        {/* Verse Number Badge */}
        <div className="flex items-start justify-between mb-4">
          <div className="verse-number-badge" title={`Verse ${verse.number}`}>
            <span>{verse.number}</span>
          </div>
          
          {/* Verse Actions */}
          <div className={`verse-actions flex gap-1 transition-all duration-300 ${
            hoveredVerse === verse.number || activeVerse === verse.number ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4 pointer-events-none'
          }`}>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 rounded-full hover:bg-primary/20"
              onClick={(e) => {
                e.stopPropagation()
                if (onVersePlay) {
                  const button = e.currentTarget
                  if (button) button.disabled = true
                  onVersePlay(verse.number)
                  setTimeout(() => {
                    if (button) button.disabled = false
                  }, 500)
                }
              }}
              title="Play recitation"
              aria-label={`Play verse ${verse.number}`}
            >
              <IconPlayerPlay className="w-4 h-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className={`h-8 w-8 rounded-full hover:bg-primary/20 ${
                bookmarkedVerses.has(verse.number) ? 'text-primary' : ''
              }`}
              onClick={(e) => handleBookmark(verse, e)}
              title={bookmarkedVerses.has(verse.number) ? 'Remove bookmark' : 'Bookmark verse'}
              aria-label={bookmarkedVerses.has(verse.number) ? 'Remove bookmark' : 'Bookmark verse'}
            >
              <IconBookmark 
                className={`w-4 h-4 ${bookmarkedVerses.has(verse.number) ? 'fill-current' : ''}`}
              />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 rounded-full hover:bg-primary/20"
              onClick={(e) => handleCopyVerse(verse, e)}
              title="Copy verse"
              aria-label="Copy verse"
            >
              <IconCopy className="w-4 h-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 rounded-full hover:bg-primary/20"
              onClick={(e) => handleShareVerse(verse, e)}
              title="Share verse"
              aria-label="Share verse"
            >
              <IconShare className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Arabic Text */}
        <div className="arabic-text text-right mb-4 leading-loose">
          <p className={`${fontSizes[fontSize]}`} style={{ fontFamily: 'serif', lineHeight: '2' }}>
            {verse.arabic}
          </p>
        </div>

        {/* Translation */}
        {showTranslation && (
          <div className="translation-text">
            <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
              {verse.translation}
            </p>
          </div>
        )}
      </Card>
      
      {/* Locked Overlay */}
      {isLocked && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-sky-100/80 via-blue-100/90 to-sky-200/80 backdrop-blur-[2px] rounded-lg border-2 border-sky-300">
          <div className="text-center px-6 py-8 max-w-md">
            <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-sky-500/20 backdrop-blur-sm">
              <IconLock className="w-8 h-8 text-sky-700" />
            </div>
            <h3 className="text-lg md:text-xl font-bold text-sky-900 mb-2">
              Verse Locked
            </h3>
            <p className="text-sm md:text-base text-sky-800/90 mb-5">
              Create a free account or log in to continue reading the full Surah, listen to recitations, and save your progress.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <Button 
                size="sm"
                className="bg-sky-600 hover:bg-sky-700"
                onClick={(e) => {
                  e.stopPropagation()
                  requireAuthentication('quran_read', {
                    surah: selectedSurah,
                    verse: verse.number
                  }, 'login')
                }}
              >
                Log In to Continue
              </Button>
              <Button 
                size="sm"
                variant="outline"
                className="border-sky-600 text-sky-700 hover:bg-sky-50"
                onClick={(e) => {
                  e.stopPropagation()
                  requireAuthentication('quran_read', {
                    surah: selectedSurah,
                    verse: verse.number
                  }, 'signup')
                }}
              >
                Create Account
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )

  return (
    <div ref={containerRef} className="relative pb-32">
      {/* Scroll Progress Indicator */}
      <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-muted/30 pointer-events-none">
        <div 
          className="h-full bg-gradient-to-r from-primary to-primary/70 transition-all duration-300 ease-out"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* Reading Progress Badge - Fixed position */}
      {isAudioPlaying && activeVerse && surahData?.verses > 0 && (
        <div className="fixed top-20 right-4 z-40 bg-primary/90 text-primary-foreground px-4 py-2 rounded-full shadow-lg backdrop-blur-sm animate-pulse-subtle">
          <div className="flex items-center gap-2 text-sm font-medium">
            <div className="w-2 h-2 bg-white rounded-full animate-ping" />
            <span>Reading: {activeVerse}/{surahData.verses}</span>
          </div>
        </div>
      )}

      {/* Surah Header with Bismillah */}
      <Card className={`mb-8 p-6 md:p-8 text-center border-2 transition-all duration-700 ${
        animateVerses ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}>
        <div className="mb-6">
          <div className="inline-block p-6 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 mb-4">
            <h2 className="text-4xl md:text-5xl font-bold mb-2" style={{ fontFamily: 'serif' }}>
              {surahData.name}
            </h2>
          </div>
          <h3 className="text-2xl font-semibold mb-2">{surahData.transliteration}</h3>
          <p className="text-muted-foreground text-lg">{surahData.translation}</p>
          <div className="flex items-center justify-center gap-6 mt-4 text-sm text-muted-foreground flex-wrap">
            <Badge variant="outline">{surahData.revelationType}</Badge>
            <Badge variant="outline">{surahData.verses} Verses</Badge>
            <Badge variant="outline">Surah {surahData.number}</Badge>
          </div>
        </div>

        {/* Bismillah - Animated Calligraphy */}
        {selectedSurah !== 1 && selectedSurah !== 9 && (
          <div className="bismillah-container">
            <p className="text-3xl md:text-4xl font-bold mb-2" style={{ fontFamily: 'serif' }}>
              بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
            </p>
            <p className="text-sm text-muted-foreground">
              In the name of Allah, the Entirely Merciful, the Especially Merciful
            </p>
          </div>
        )}
      </Card>

      {/* Controls Bar */}
      <div className="flex flex-col md:flex-row gap-4 mb-6 items-center justify-between bg-muted/50 p-4 rounded-lg backdrop-blur-sm">
        {/* Search */}
        <div className="relative w-full md:w-auto md:flex-1 md:max-w-md">
          <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search verses..."
            className="pl-10 pr-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
              onClick={() => setSearchQuery('')}
            >
              <IconX className="h-3 w-3" />
            </Button>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Translation Toggle */}
          <Button
            variant={showTranslation ? "default" : "outline"}
            size="sm"
            onClick={() => setShowTranslation(!showTranslation)}
          >
            <IconLanguage className="w-4 h-4 mr-2" />
            Translation
          </Button>

          {/* Font Size */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <span className="mr-2">Aa</span>
                Font Size
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Arabic Text Size</DropdownMenuLabel>
              {['small', 'medium', 'large', 'xlarge'].map((size) => (
                <DropdownMenuItem
                  key={size}
                  onClick={() => setFontSize(size)}
                  className={fontSize === size ? 'bg-primary/10' : ''}
                >
                  <span className="capitalize">{size}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Results Count */}
          {searchQuery && (
            <Badge variant="secondary">
              {filteredVerses.length} {filteredVerses.length === 1 ? 'verse' : 'verses'} found
            </Badge>
          )}
        </div>
      </div>

      {/* Verses */}
      {filteredVerses.length === 0 ? (
        <Card className="p-12 text-center">
          <IconSearch className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No verses found</h3>
          <p className="text-muted-foreground">Try a different search term</p>
        </Card>
      ) : (
        <>
          <div 
            ref={versesContainerRef}
            className={`space-y-6 transition-opacity duration-500 ${animateVerses ? 'opacity-100' : 'opacity-0'}`}
          >
            {/* Render verses based on authentication status */}
            {userData ? (
              // Authenticated: Show all verses normally
              filteredVerses.map((verse, index) => (
                <div 
                  key={verse.number}
                  style={{
                    transitionDelay: `${index * 50}ms`,
                    animationDelay: `${index * 50}ms`
                  }}
                >
                  {renderVerseCard(verse, false)}
                </div>
              ))
            ) : (
              // Unauthenticated: Show first 5 verses + 1 blurred locked verse
              <>
                {console.log('🔒 Unauthenticated view - Total verses:', filteredVerses.length, 'First 5:', filteredVerses.slice(0, MAX_FREE_VERSES).length, 'Locked 1:', filteredVerses.slice(MAX_FREE_VERSES, MAX_FREE_VERSES + LOCKED_PREVIEW_COUNT).length)}
                
                {/* First 5 verses - normal display */}
                {filteredVerses.slice(0, MAX_FREE_VERSES).map((verse, index) => (
                  <div 
                    key={verse.number}
                    style={{
                      transitionDelay: `${index * 50}ms`,
                      animationDelay: `${index * 50}ms`
                    }}
                  >
                    {renderVerseCard(verse, false)}
                  </div>
                ))}
                
                {/* Next 1 verse (6) - blurred with overlay */}
                {filteredVerses.slice(MAX_FREE_VERSES, MAX_FREE_VERSES + LOCKED_PREVIEW_COUNT).map((verse, index) => {
                  console.log('🔐 Rendering locked verse:', verse.number)
                  return (
                    <div 
                      key={verse.number}
                      style={{
                        transitionDelay: `${(MAX_FREE_VERSES + index) * 50}ms`,
                        animationDelay: `${(MAX_FREE_VERSES + index) * 50}ms`
                      }}
                    >
                      {renderVerseCard(verse, true)}
                    </div>
                  )
                })}
              </>
            )}
          </div>
                
          {/* Loading More Indicator - Only for authenticated users */}
          {userData && loadingMore && (
            <div className="flex items-center justify-center py-8 animate-fade-in">
              <Card className="p-6 border-2 border-primary/30 bg-primary/5">
                <div className="flex flex-col items-center gap-3">
                  <IconLoader2 className="w-8 h-8 animate-spin text-primary" />
                  <div className="text-center">
                    <p className="text-sm font-medium mb-1">Loading more verses...</p>
                    <p className="text-xs text-muted-foreground">
                      {allVerses.length} of {totalVerses} verses loaded
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          )}
          
          {/* Progress Indicator (when not loading and has more) - Only for authenticated users */}
          {userData && !loading && !loadingMore && !searchQuery && hasNextPage && allVerses.length > 0 && (
            <div className="flex items-center justify-center py-6 animate-fade-in">
              <Card className="p-4 border border-primary/20 bg-primary/5">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-2">
                    {allVerses.length} of {totalVerses} verses loaded
                  </p>
                  <div className="w-48 h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary rounded-full transition-all duration-500"
                      style={{ width: `${(allVerses.length / totalVerses) * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Scroll down to load more
                  </p>
                </div>
              </Card>
            </div>
          )}
        </>
      )}

      <style jsx global>{`
        .verse-card {
          position: relative;
          overflow: hidden;
        }

        .verse-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(
            90deg,
            transparent,
            hsl(var(--primary) / 0.05),
            transparent
          );
          transition: left 0.5s ease;
        }

        .verse-card:hover::before {
          left: 100%;
        }

        .verse-playing {
          animation: verse-glow 2s ease-in-out infinite;
        }

        @keyframes verse-glow {
          0%, 100% {
            box-shadow: 0 0 20px hsl(var(--primary) / 0.2);
          }
          50% {
            box-shadow: 0 0 30px hsl(var(--primary) / 0.4);
          }
        }

        .verse-card.verse-playing .verse-number-badge {
          animation: pulse-badge 1s ease-in-out infinite;
        }

        @keyframes pulse-badge {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.1);
          }
        }

        .verse-number-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: linear-gradient(135deg, hsl(var(--primary) / 0.2), hsl(var(--primary) / 0.1));
          border: 2px solid hsl(var(--primary) / 0.3);
          font-weight: 600;
          font-size: 0.875rem;
          transition: all 0.3s ease;
        }

        .verse-card:hover .verse-number-badge {
          transform: scale(1.1) rotate(360deg);
          background: linear-gradient(135deg, hsl(var(--primary) / 0.3), hsl(var(--primary) / 0.2));
          border-color: hsl(var(--primary) / 0.5);
        }

        .bismillah-container {
          padding: 1.5rem;
          border-radius: 1rem;
          background: linear-gradient(135deg, hsl(var(--primary) / 0.05), transparent);
          animation: bismillah-fade 1s ease-in-out;
        }

        @keyframes bismillah-fade {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .arabic-text {
          /* Shimmer animation removed for better performance */
        }

        @media (max-width: 768px) {
          .verse-actions {
            opacity: 1 !important;
            transform: translateX(0) !important;
            pointer-events: auto !important;
          }
        }

        .animate-pulse-subtle {
          animation: pulse-subtle 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        @keyframes pulse-subtle {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.85;
          }
        }
      `}</style>
    </div>
  )
}

