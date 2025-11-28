'use client'

import { useState, useEffect, useRef, useContext } from 'react'
import { useSearchParams } from 'next/navigation'
import { IconBook, IconBookmark, IconVolume, IconChevronDown, IconHelp } from '@tabler/icons-react'
import AuthContext from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import ImprovedQuranReader from '@/components/quran/ImprovedQuranReader'
import SurahSelector from '@/components/quran/SurahSelector'
import IslamicPattern from '@/components/quran/IslamicPattern'
import EnhancedAudioPlayer from '@/components/quran/EnhancedAudioPlayer'
import BookmarkPanel from '@/components/quran/BookmarkPanel'
import QuickTips from '@/components/quran/QuickTips'

export default function QuranPage() {
  const { userData } = useContext(AuthContext)
  const searchParams = useSearchParams()
  const [selectedSurah, setSelectedSurah] = useState(1)
  const [showSurahSelector, setShowSurahSelector] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [currentVerse, setCurrentVerse] = useState(1)
  const [showAudioPlayer, setShowAudioPlayer] = useState(true)
  const [verses, setVerses] = useState([])
  const [totalVerses, setTotalVerses] = useState(0)
  const [triggerPlay, setTriggerPlay] = useState(false)
  const [isAudioPlaying, setIsAudioPlaying] = useState(false)
  const [selectedReciter, setSelectedReciter] = useState('alafasy')
  const [playbackMode, setPlaybackMode] = useState('continuous')
  const [showTips, setShowTips] = useState(false)

  useEffect(() => {
    setMounted(true)
    
    // Load saved playback mode
    const savedMode = localStorage.getItem('quran_mode')
    if (savedMode) {
      setPlaybackMode(savedMode)
    }
    
    // Check if tips should be shown (first time users)
    const tipsShown = localStorage.getItem('quran_tips_shown')
    if (!tipsShown) {
      // Show tips after 2 seconds for better UX
      setTimeout(() => setShowTips(true), 2000)
    }
  }, [])

  // Handle URL query parameters (e.g., from bookmarks)
  useEffect(() => {
    if (!mounted) return
    
    const surahParam = searchParams.get('surah')
    const verseParam = searchParams.get('verse')
    
    if (surahParam) {
      const surahNum = parseInt(surahParam, 10)
      if (surahNum >= 1 && surahNum <= 114) {
        setSelectedSurah(surahNum)
        
        if (verseParam) {
          const verseNum = parseInt(verseParam, 10)
          if (verseNum >= 1) {
            setCurrentVerse(verseNum)
          }
        }
      }
    }
  }, [searchParams, mounted])

  // Load user-specific reciter preference
  useEffect(() => {
    if (userData?.id) {
      // User-specific reciter preference
      const savedReciter = localStorage.getItem(`quran_reciter_user_${userData.id}`)
      if (savedReciter) {
        setSelectedReciter(savedReciter)
      }
    } else {
      // Guest user - use general preference
      const savedReciter = localStorage.getItem('quran_reciter')
      if (savedReciter) {
        setSelectedReciter(savedReciter)
      }
    }
  }, [userData])

  // Load last read position
  useEffect(() => {
    const savedPosition = localStorage.getItem('quran_last_position')
    if (savedPosition) {
      const { surah, verse } = JSON.parse(savedPosition)
      setSelectedSurah(surah)
      setCurrentVerse(verse)
    }
  }, [])

  // Save current position
  useEffect(() => {
    if (selectedSurah && currentVerse) {
      localStorage.setItem('quran_last_position', JSON.stringify({
        surah: selectedSurah,
        verse: currentVerse,
        timestamp: new Date().toISOString()
      }))
    }
  }, [selectedSurah, currentVerse])

  // Save user-specific reciter preference
  useEffect(() => {
    if (selectedReciter && mounted) {
      if (userData?.id) {
        // Save user-specific preference
        localStorage.setItem(`quran_reciter_user_${userData.id}`, selectedReciter)
      } else {
        // Save general preference for guest users
        localStorage.setItem('quran_reciter', selectedReciter)
      }
    }
  }, [selectedReciter, userData, mounted])

  const handleNavigate = (surah, verse = 1) => {
    setSelectedSurah(surah)
    setCurrentVerse(verse)
    setShowSurahSelector(false)
  }

  const handleVersePlay = (verseNumber) => {
    
    // Prevent rapid clicks
    if (currentVerse === verseNumber && isAudioPlaying) {
      return
    }
    
    // Update verse and trigger play
    setCurrentVerse(verseNumber)
    setShowAudioPlayer(true)
    
    // Small delay to ensure state updates before triggering play
    setTimeout(() => {
      setTriggerPlay(true)
      setTimeout(() => setTriggerPlay(false), 100)
    }, 50)
  }

  const handleModeChange = (mode) => {
    setPlaybackMode(mode)
    localStorage.setItem('quran_mode', mode)
  }

  if (!mounted) return null

  return (
    <>
      <div className="relative min-h-screen bg-background overflow-hidden pb-32">
        {/* Subtle Islamic Pattern Background */}
        <IslamicPattern />

        {/* Main Container */}
        <div className="relative z-10 container mx-auto px-4 py-8 max-w-7xl">
          {/* Header Section */}
          <div className="text-center mb-12 animate-fade-in">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 mb-6 animate-glow">
              <IconBook className="w-12 h-12 text-primary" />
            </div>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-4 text-foreground leading-tight">
              القرآن الكريم
            </h1>
            <p className="text-muted-foreground text-xl">
              The Noble Quran - Listen, Read, and Reflect
            </p>
          </div>

          {/* Navigation Controls */}
          <div className="flex flex-col md:flex-row gap-4 mb-8 items-center justify-between animate-slide-up">
            {/* Left Side - Surah Selector Button */}
            <Button
              variant="outline"
              className="w-full md:w-auto min-w-[200px] h-12 text-base border-2 hover:border-primary/50 transition-all duration-300 hover:scale-105"
              onClick={() => setShowSurahSelector(!showSurahSelector)}
            >
              <IconChevronDown className={`w-5 h-5 mr-2 transition-transform duration-300 ${showSurahSelector ? 'rotate-180' : ''}`} />
              Select Surah
            </Button>

            {/* Right Side - Quick Actions */}
            <div className="flex gap-2">
              <BookmarkPanel onNavigate={handleNavigate} />

              {/* Quick Tips Dialog */}
              <Dialog open={showTips} onOpenChange={setShowTips}>
                <DialogTrigger asChild>
                  <Button 
                    variant="outline"
                    size="icon" 
                    className="h-12 w-12 rounded-full border-2 hover:border-primary/50 transition-all duration-300 hover:scale-110"
                    title="Quick tips & shortcuts"
                  >
                    <IconHelp className="w-5 h-5" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg max-h-[75vh] overflow-y-auto p-0 border-0" showCloseButton={false}>
                  <DialogTitle className="sr-only">
                    Quick Tips and Keyboard Shortcuts
                  </DialogTitle>
                  <QuickTips onClose={() => setShowTips(false)} forceShow={true} />
                </DialogContent>
              </Dialog>

              <Button 
                variant={showAudioPlayer ? "default" : "ghost"}
                size="icon" 
                className="h-12 w-12 rounded-full hover:bg-primary/10 transition-all duration-300 hover:scale-110"
                onClick={() => setShowAudioPlayer(!showAudioPlayer)}
                title={showAudioPlayer ? "Hide audio player" : "Show audio player"}
              >
                <IconVolume className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Surah Selector Panel */}
          <div className={`mb-8 overflow-hidden transition-all duration-500 ease-out ${
            showSurahSelector ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'
          }`}>
            <SurahSelector
              selectedSurah={selectedSurah}
              onSelectSurah={(surahNumber) => {
                setSelectedSurah(surahNumber)
                setShowSurahSelector(false)
              }}
            />
          </div>

          {/* Quran Reader */}
          <ImprovedQuranReader 
            selectedSurah={selectedSurah} 
            currentVerse={currentVerse}
            onVerseChange={setCurrentVerse}
            onVersePlay={handleVersePlay}
            isAudioPlaying={isAudioPlaying}
            onVersesLoad={(loadedVerses) => {
              setVerses(loadedVerses)
              setTotalVerses(loadedVerses.length)
            }}
          />
        </div>

        {/* Enhanced Audio Player - Fixed at bottom */}
        {showAudioPlayer && verses.length > 0 && (
          <div className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none">
            <div className="pointer-events-auto pb-6">
              <EnhancedAudioPlayer
                surahNumber={selectedSurah}
                currentVerse={currentVerse}
                totalVerses={totalVerses}
                verses={verses}
                onVerseChange={setCurrentVerse}
                triggerPlay={triggerPlay}
                onPlayStateChange={setIsAudioPlaying}
                onReciterChange={setSelectedReciter}
                initialReciter={selectedReciter}
                onModeChange={handleModeChange}
                initialMode={playbackMode}
              />
            </div>
          </div>
        )}



        <style jsx>{`
          @keyframes fade-in {
            from {
              opacity: 0;
              transform: translateY(-10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes slide-up {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes slide-in-right {
            from {
              opacity: 0;
              transform: translateX(100%);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }

          @keyframes glow {
            0%, 100% {
              box-shadow: 0 0 20px hsl(var(--primary) / 0.3);
            }
            50% {
              box-shadow: 0 0 40px hsl(var(--primary) / 0.5);
            }
          }

          .animate-fade-in {
            animation: fade-in 0.8s ease-out;
          }

          .animate-slide-up {
            animation: slide-up 0.8s ease-out 0.2s backwards;
          }

          .animate-slide-in-right {
            animation: slide-in-right 0.5s ease-out;
          }

          .animate-glow {
            animation: glow 3s ease-in-out infinite;
          }

          kbd {
            font-family: ui-monospace, monospace;
            font-size: 0.7em;
          }
        `}</style>
      </div>
    </>
  )
}
