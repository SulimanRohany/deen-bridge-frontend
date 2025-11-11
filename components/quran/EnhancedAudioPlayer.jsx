'use client'

import React, { useState, useRef, useEffect, useCallback, useContext } from 'react'
import { useRouter } from 'next/navigation'
import { 
  IconPlayerPlay, 
  IconPlayerPause, 
  IconVolume, 
  IconVolumeOff, 
  IconRotateClockwise, 
  IconSettings, 
  IconStar, 
  IconPlayerSkipForward, 
  IconPlayerSkipBack,
  IconLoader2,
  IconAlertCircle,
  IconCheck
} from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Card } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@/components/ui/dropdown-menu'
import { RECITERS, getAudioUrl } from '@/lib/quran-reciters'
import { toast } from 'sonner'
import AuthContext from '@/context/AuthContext'
import { setPendingAction } from '@/lib/pendingActions'

const PLAYBACK_MODES = [
  { id: 'single', name: 'Single Ayah', icon: '1️⃣', description: 'Play one ayah and stop' },
  { id: 'continuous', name: 'Whole Surah', icon: '📖', description: 'Play entire Surah' },
  { id: 'repeat', name: 'Repeat Ayah', icon: '🔁', description: 'Repeat current ayah' },
]

const MAX_FREE_VERSES = 5 // Match the restriction in the reader

export default function EnhancedAudioPlayer({ 
  surahNumber, 
  currentVerse, 
  totalVerses, 
  onVerseChange,
  verses = [],
  triggerPlay = false,
  onPlayStateChange,
  onReciterChange,
  initialReciter = 'alafasy',
  onModeChange,
  initialMode = 'continuous',
  className = ''
}) {
  const { userData } = useContext(AuthContext)
  const router = useRouter()
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(80)
  const [isMuted, setIsMuted] = useState(false)
  const [selectedReciter, setSelectedReciter] = useState(initialReciter)
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0)
  const [currentVerseIndex, setCurrentVerseIndex] = useState(0)
  const [playbackMode, setPlaybackMode] = useState(initialMode)
  const [repeatCount, setRepeatCount] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [audioError, setAudioError] = useState(null)
  const [retryCount, setRetryCount] = useState(0)
  const [buffered, setBuffered] = useState(0)
  
  const audioRef = useRef(null)
  const nextAudioRef = useRef(null) // For preloading
  const maxRetries = 3
  const switchingRef = useRef(false) // Prevent concurrent switches
  const lastVerseRef = useRef(null) // Track last played verse
  const playPromiseRef = useRef(null) // Track pending play promise

  const requireAuthentication = useCallback((actionType, actionData, destination = 'login') => {
    setPendingAction({
      type: actionType,
      data: actionData,
    })
    router.push(`/${destination}`)
  }, [router])

  // Load user preferences from localStorage
  useEffect(() => {
    const savedVolume = localStorage.getItem('quran_volume')
    const savedSpeed = localStorage.getItem('quran_speed')
    const savedMode = localStorage.getItem('quran_mode')
    
    if (savedVolume) setVolume(parseInt(savedVolume))
    if (savedSpeed) setPlaybackSpeed(parseFloat(savedSpeed))
    if (savedMode) setPlaybackMode(savedMode)
  }, [])

  // Save preferences
  useEffect(() => {
    localStorage.setItem('quran_volume', volume.toString())
    localStorage.setItem('quran_speed', playbackSpeed.toString())
    localStorage.setItem('quran_mode', playbackMode)
  }, [volume, playbackSpeed, playbackMode])

  // Set volume on audio element
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100
    }
  }, [volume])

  // Set playback speed on audio element
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackSpeed
    }
  }, [playbackSpeed])

  // Handle audio errors with retry - memoized to prevent infinite loops
  const handleAudioError = useCallback((error) => {
    // Ignore AbortError - it's expected when switching tracks
    if (error?.name === 'AbortError') {
      console.log('⏭️ Play aborted (switching tracks) - ignoring error')
      setIsLoading(false)
      return
    }
    
    console.error('Audio error:', error)
    setIsLoading(false)
    
    if (retryCount < maxRetries) {
      setRetryCount(prev => prev + 1)
      
      setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.load()
          if (!audioRef.current.paused) {
            audioRef.current.play().catch(err => {
              if (err.name !== 'AbortError') {
                console.error('Retry failed:', err)
              }
            })
          }
        }
      }, 1000 * retryCount)
    } else {
      setAudioError('Failed to load audio. Please check your connection.')
    }
  }, [retryCount, maxRetries])

  // Preload next verse audio for smooth transitions
  const preloadNextVerse = useCallback(() => {
    if (playbackMode === 'continuous' && currentVerseIndex < verses.length - 1) {
      const nextVerse = verses[currentVerseIndex + 1]
      const nextUrl = getAudioUrl(surahNumber, nextVerse.number, selectedReciter)
      
      if (nextAudioRef.current) {
        nextAudioRef.current.src = nextUrl
        nextAudioRef.current.load()
        console.log('🔄 Preloading next verse:', nextVerse.number)
      }
    }
  }, [playbackMode, currentVerseIndex, verses, surahNumber, selectedReciter])

  // Update audio source when verse or reciter changes
  useEffect(() => {
    if (verses.length > 0 && currentVerse) {
      // Prevent concurrent switches - CRITICAL for preventing hangs
      if (switchingRef.current) {
        console.log('⏳ Switch already in progress, queuing...')
        return
      }
      
      // Skip if same verse (unless reciter changed)
      if (lastVerseRef.current === currentVerse && audioRef.current?.src) {
        console.log('⏭️ Same ayah, skipping switch')
        return
      }
      
      const verseIndex = verses.findIndex(v => v.number === currentVerse)
      if (verseIndex >= 0) {
        switchingRef.current = true // Lock switching
        lastVerseRef.current = currentVerse
        
        setCurrentVerseIndex(verseIndex)
        setAudioError(null)
        setRetryCount(0)
        setIsTransitioning(false)
        
        const audioUrl = getAudioUrl(surahNumber, currentVerse, selectedReciter)
        
        if (audioUrl && audioRef.current) {
          setIsLoading(true)
          
          // CRITICAL FIX: Store if audio was playing before the switch
          const wasPlaying = !audioRef.current.paused && isPlaying
          
          console.log(`🔄 Switching to ayah ${currentVerse}, wasPlaying: ${wasPlaying}`)
          
          // CRITICAL FIX: Wait for any pending play promise to settle
          if (playPromiseRef.current) {
            playPromiseRef.current
              .then(() => {
                console.log('Previous play promise resolved')
              })
              .catch(() => {
                console.log('Previous play promise rejected')
              })
              .finally(() => {
                playPromiseRef.current = null
              })
          }
          
          // CRITICAL FIX: Immediately pause and reset current audio
          try {
            audioRef.current.pause()
            audioRef.current.currentTime = 0
          } catch (err) {
            console.warn('⚠️ Error pausing audio:', err)
          }
          
          // CRITICAL FIX: Clear any pending operations
          setIsPlaying(false)
          if (onPlayStateChange) onPlayStateChange(false)
          
          // Small delay to ensure clean state before switching
          setTimeout(() => {
            if (audioRef.current && audioUrl) {
              try {
                // Set new source
                audioRef.current.src = audioUrl
                
                // CRITICAL FIX: Wait for audio to be ready before playing
                const handleCanPlay = () => {
                  if (audioRef.current && wasPlaying) {
                    console.log('✅ Audio ready, playing ayah:', currentVerse)
                    
                    // Store the play promise
                    playPromiseRef.current = audioRef.current.play()
                    
                    if (playPromiseRef.current !== undefined) {
                      playPromiseRef.current
                        .then(() => {
                          console.log('✅ Successfully switched to ayah:', currentVerse)
                          playPromiseRef.current = null
                          setIsLoading(false)
                          switchingRef.current = false // Unlock
                        })
                        .catch(err => {
                          // Ignore AbortError - it's expected when switching
                          if (err.name === 'AbortError') {
                            console.log('⏭️ Play aborted (switching tracks)')
                          } else {
                            console.error('❌ Error playing audio after switch:', err)
                            handleAudioError(err)
                          }
                          playPromiseRef.current = null
                          setIsLoading(false)
                          switchingRef.current = false // Unlock
                        })
                    } else {
                      setIsLoading(false)
                      switchingRef.current = false
                    }
                  } else {
                    setIsLoading(false)
                    switchingRef.current = false // Unlock
                  }
                  // Remove event listener after use
                  audioRef.current?.removeEventListener('canplay', handleCanPlay)
                }
                
                // Add event listener for when audio is ready
                audioRef.current.addEventListener('canplay', handleCanPlay, { once: true })
                
                // Start loading
                audioRef.current.load()
                
                // Timeout fallback in case canplay doesn't fire
                setTimeout(() => {
                  if (switchingRef.current) {
                    console.warn('⚠️ Canplay timeout, forcing unlock')
                    setIsLoading(false)
                    switchingRef.current = false
                  }
                }, 5000)
                
              } catch (err) {
                console.error('❌ Critical error during switch:', err)
                setIsLoading(false)
                switchingRef.current = false // Unlock
                setAudioError('Failed to switch ayah. Please try again.')
              }
              
              // Preload next verse
              preloadNextVerse()
            } else {
              switchingRef.current = false // Unlock
            }
          }, 150) // Slightly longer delay for stability
        } else {
          switchingRef.current = false // Unlock if no audio
        }
      }
    }
  }, [currentVerse, verses, surahNumber, selectedReciter])

  // Trigger play from external source
  useEffect(() => {
    if (triggerPlay && audioRef.current && audioRef.current.src) {
      setRepeatCount(0)
      audioRef.current.play().catch(err => {
        console.error('Error playing audio:', err)
        handleAudioError(err)
      })
    }
  }, [triggerPlay, handleAudioError])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      // Only handle if not typing in an input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
      
      // Ignore shortcuts when Ctrl, Alt, or Meta (Cmd) keys are pressed
      // This allows browser shortcuts like Ctrl+R (refresh) to work normally
      if (e.ctrlKey || e.altKey || e.metaKey) return
      
      switch(e.key) {
        case ' ':
          e.preventDefault()
          // Toggle play/pause directly
          if (audioRef.current) {
            if (audioRef.current.paused) {
              if (!audioRef.current.src && verses.length > 0 && currentVerse) {
                const audioUrl = getAudioUrl(surahNumber, currentVerse, selectedReciter)
                if (audioUrl) {
                  audioRef.current.src = audioUrl
                  audioRef.current.load()
                }
              }
              audioRef.current.play().catch(err => {
                console.error('Error playing audio:', err)
              })
            } else {
              audioRef.current.pause()
            }
          }
          break
        case 'ArrowRight':
          e.preventDefault()
          if (currentVerseIndex < verses.length - 1) {
            const nextVerse = verses[currentVerseIndex + 1]
            onVerseChange(nextVerse.number)
            setRepeatCount(0)
          }
          break
        case 'ArrowLeft':
          e.preventDefault()
          if (currentVerseIndex > 0) {
            const prevVerse = verses[currentVerseIndex - 1]
            onVerseChange(prevVerse.number)
            setRepeatCount(0)
          }
          break
        case 'm':
        case 'M':
          e.preventDefault()
          if (audioRef.current) {
            audioRef.current.muted = !audioRef.current.muted
            setIsMuted(audioRef.current.muted)
          }
          break
        case 'r':
        case 'R':
          e.preventDefault()
          if (audioRef.current) {
            audioRef.current.currentTime = 0
            audioRef.current.play().catch(err => {
              console.error('Error replaying:', err)
            })
          }
          break
        default:
          break
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [currentVerseIndex, verses, currentVerse, surahNumber, selectedReciter, onVerseChange])

  const togglePlay = () => {
    if (!audioRef.current) return
    
    // Prevent action during switching
    if (switchingRef.current) {
      console.log('⏳ Audio is switching, please wait...')
      toast.info('Switching ayah, please wait...', { duration: 1000 })
      return
    }
    
    if (audioRef.current.paused) {
      // If no source, set it
      if (!audioRef.current.src && verses.length > 0 && currentVerse) {
        const audioUrl = getAudioUrl(surahNumber, currentVerse, selectedReciter)
        if (audioUrl) {
          audioRef.current.src = audioUrl
          audioRef.current.load()
        }
      }
      
      playPromiseRef.current = audioRef.current.play()
      playPromiseRef.current.catch(err => {
        if (err.name !== 'AbortError') {
          console.error('Error playing audio:', err)
          handleAudioError(err)
        }
        playPromiseRef.current = null
      })
    } else {
      // Wait for play promise to settle before pausing
      if (playPromiseRef.current) {
        playPromiseRef.current.finally(() => {
          if (audioRef.current) {
            audioRef.current.pause()
          }
          playPromiseRef.current = null
        })
      } else {
        audioRef.current.pause()
      }
    }
  }

  const handleVolumeChange = (value) => {
    const newVolume = value[0]
    setVolume(newVolume)
    if (audioRef.current) {
      audioRef.current.volume = newVolume / 100
      audioRef.current.muted = newVolume === 0
    }
    if (newVolume === 0) {
      setIsMuted(true)
    } else if (isMuted) {
      setIsMuted(false)
    }
  }

  const toggleMute = () => {
    if (audioRef.current) {
      const newMutedState = !isMuted
      audioRef.current.muted = newMutedState
      setIsMuted(newMutedState)
    }
  }

  const handleProgressChange = (value) => {
    const newTime = value[0]
    setCurrentTime(newTime)
    if (audioRef.current) {
      audioRef.current.currentTime = newTime
    }
  }

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleSkipNext = () => {
    if (switchingRef.current) {
      console.log('⏳ Switch in progress, skipping...')
      return
    }
    if (currentVerseIndex < verses.length - 1) {
      const nextVerse = verses[currentVerseIndex + 1]
      
      // 🔐 Check if next verse is restricted for unauthenticated users
      if (!userData && nextVerse.number > MAX_FREE_VERSES) {
        console.log('🔒 Next verse restricted - redirecting to auth')
        setIsPlaying(false)
        if (onPlayStateChange) onPlayStateChange(false)
        requireAuthentication('quran_listen', {
          surah: surahNumber,
          verse: nextVerse.number
        })
        toast.info(`Free preview ends at ${MAX_FREE_VERSES} verses. Log in to continue.`)
        return
      }
      
      onVerseChange(nextVerse.number)
      setRepeatCount(0)
    }
  }

  const handleSkipPrevious = () => {
    if (switchingRef.current) {
      console.log('⏳ Switch in progress, skipping...')
      return
    }
    if (currentVerseIndex > 0) {
      const prevVerse = verses[currentVerseIndex - 1]
      onVerseChange(prevVerse.number)
      setRepeatCount(0)
    }
  }

  const handleSpeedChange = (speed) => {
    setPlaybackSpeed(speed)
    if (audioRef.current) {
      audioRef.current.playbackRate = speed
    }
  }

  const handleModeChange = (mode) => {
    console.log('🎯 Changing playback mode to:', mode)
    setPlaybackMode(mode)
    setRepeatCount(0)
    
    // Notify parent component
    if (onModeChange) {
      onModeChange(mode)
    }
    
    // Show toast notification
    const modeData = PLAYBACK_MODES.find(m => m.id === mode)
    if (modeData) {
      toast.success(`${modeData.icon} ${modeData.name}`, {
        description: modeData.description,
        duration: 2000
      })
    }
  }

  const handleReciterChange = (reciterId) => {
    setSelectedReciter(reciterId)
    if (onReciterChange) {
      onReciterChange(reciterId)
    }
  }

  return (
    <>
      {/* Transition Indicator */}
      {isTransitioning && playbackMode === 'continuous' && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] animate-slide-down">
          <div className="bg-gradient-to-r from-primary/95 to-primary/80 backdrop-blur-xl border-2 border-primary rounded-full px-8 py-4 shadow-2xl">
            <div className="text-sm font-semibold flex items-center gap-3 text-primary-foreground">
              <IconPlayerSkipForward className="w-5 h-5 animate-pulse" />
              <span>Moving to Ayah {currentVerse}...</span>
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping block" />
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {audioError && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] animate-slide-down">
          <Card className="p-4 bg-destructive/10 border-destructive">
            <div className="flex items-center gap-3">
              <IconAlertCircle className="w-5 h-5 text-destructive" />
              <div>
                <p className="font-medium text-destructive">{audioError}</p>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => {
                    setAudioError(null)
                    setRetryCount(0)
                    if (audioRef.current) {
                      audioRef.current.load()
                    }
                  }}
                  className="mt-2"
                >
                  Try Again
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Preload audio element */}
      <audio ref={nextAudioRef} preload="auto" style={{ display: 'none' }} />

       <Card className={`audio-player mx-auto w-[95%] max-w-4xl p-2 md:p-6 shadow-2xl border-2 backdrop-blur-xl bg-background/95 ${className}`} style={{ transform: 'translateZ(0)' }}>
        <audio
          ref={audioRef}
          onTimeUpdate={(e) => {
            setCurrentTime(e.target.currentTime)
            // Update buffered
            if (e.target.buffered.length > 0) {
              const bufferedEnd = e.target.buffered.end(e.target.buffered.length - 1)
              setBuffered((bufferedEnd / e.target.duration) * 100)
            }
          }}
          onLoadedMetadata={(e) => {
            setDuration(e.target.duration)
            setIsLoading(false)
            setAudioError(null)
          }}
          onCanPlay={() => {
            setIsLoading(false)
            setAudioError(null)
          }}
          onWaiting={() => setIsLoading(true)}
          onLoadStart={() => setIsLoading(true)}
          onError={(e) => handleAudioError(e.target.error)}
          onEnded={() => {
            console.log('🎵 Audio ended. Mode:', playbackMode)
            
            if (playbackMode === 'single') {
              console.log('✋ Single Ayah mode - stopping after verse', currentVerse)
              setIsPlaying(false)
              if (onPlayStateChange) onPlayStateChange(false)
              toast.success(`Ayah ${currentVerse} completed`, {
                description: 'Press play to continue or select next ayah',
                duration: 2000
              })
              
            } else if (playbackMode === 'repeat') {
              console.log('🔁 Repeat mode - replaying ayah', currentVerse)
              setTimeout(() => {
                if (audioRef.current && audioRef.current.src) {
                  audioRef.current.currentTime = 0
                  audioRef.current.play()
                  setIsPlaying(true)
                  if (onPlayStateChange) onPlayStateChange(true)
                  setRepeatCount(prev => prev + 1)
                }
              }, 500)
              
            } else {
              console.log('📖 Continuous mode - auto-advancing to next ayah')
              if (currentVerseIndex < verses.length - 1) {
                const nextVerse = verses[currentVerseIndex + 1]
                console.log('⏭️ Playing next ayah:', nextVerse.number)
                
                // 🔐 Check if next verse is restricted for unauthenticated users
                if (!userData && nextVerse.number > MAX_FREE_VERSES) {
                  console.log('🔒 Playback restricted - redirecting to auth')
                  setIsPlaying(false)
                  if (onPlayStateChange) onPlayStateChange(false)
                  requireAuthentication('quran_listen', {
                    surah: surahNumber,
                    verse: nextVerse.number
                  })
                  toast.info(`Free preview ends at ${MAX_FREE_VERSES} verses. Log in to continue listening.`)
                  return
                }
                
                // Keep playing state active during continuous playback
                setIsTransitioning(true)
                
                // CRITICAL: Keep playing state TRUE so auto-scroll works
                setIsPlaying(true)
                if (onPlayStateChange) onPlayStateChange(true)
                
                // Update verse immediately for auto-scroll
                onVerseChange(nextVerse.number)
                
                setTimeout(() => {
                  setIsTransitioning(false)
                  const newIndex = currentVerseIndex + 1
                  setCurrentVerseIndex(newIndex)
                  
                  if (audioRef.current) {
                    // Use preloaded audio if available
                    const nextAudioUrl = nextAudioRef.current?.src || getAudioUrl(surahNumber, nextVerse.number, selectedReciter)
                    
                    if (nextAudioUrl) {
                      audioRef.current.src = nextAudioUrl
                      audioRef.current.load()
                      playPromiseRef.current = audioRef.current.play()
                      playPromiseRef.current.then(() => {
                        console.log('✅ Playing ayah', nextVerse.number)
                        playPromiseRef.current = null
                        // Preload next after successful play
                        preloadNextVerse()
                      }).catch(err => {
                        // Ignore AbortError - it's expected when switching tracks
                        if (err.name === 'AbortError') {
                          console.log('⏭️ Play aborted during continuous mode (user switched tracks)')
                        } else {
                          console.error('❌ Error playing next ayah:', err)
                          handleAudioError(err)
                        }
                        playPromiseRef.current = null
                        setIsPlaying(false)
                        if (onPlayStateChange) onPlayStateChange(false)
                      })
                    }
                  }
                }, 600)
              } else {
                // If unauthenticated user has reached the preview limit but more verses exist, redirect
                if (!userData && totalVerses > verses.length && (verses[verses.length - 1]?.number || 0) >= MAX_FREE_VERSES) {
                  console.log('🔒 Playback restricted at end of preview - redirecting to auth')
                  setIsPlaying(false)
                  if (onPlayStateChange) onPlayStateChange(false)
                  requireAuthentication('quran_listen', {
                    surah: surahNumber,
                    verse: (verses[verses.length - 1]?.number || MAX_FREE_VERSES)
                  })
                  toast.info(`Free preview ends at ${MAX_FREE_VERSES} verses. Log in to continue listening.`)
                } else {
                  console.log('🎊 Surah completed!')
                  setIsPlaying(false)
                  if (onPlayStateChange) onPlayStateChange(false)
                }
              }
            }
          }}
          onPlay={() => {
            setIsPlaying(true)
            if (onPlayStateChange) onPlayStateChange(true)
          }}
          onPause={() => {
            setIsPlaying(false)
            if (onPlayStateChange) onPlayStateChange(false)
          }}
        />

        {/* Desktop layout */}
        <div className="hidden md:flex flex-col gap-3">
          {/* Top Row - Reciter Info */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-3">
              <div className="relative w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                {isLoading ? (
                  <IconLoader2 className="w-6 h-6 text-primary animate-spin" />
                ) : (
                  <IconVolume className="w-6 h-6 text-primary" />
                )}
              </div>
              <div>
                <p className="font-semibold">
                  {RECITERS.find(r => r.id === selectedReciter)?.name || 'Reciter'}
                </p>
                <p className="text-xs text-muted-foreground">
                  Surah {surahNumber} • Verse {currentVerse || 1}
                </p>
                <p className="text-xs text-primary font-medium">
                  {PLAYBACK_MODES.find(m => m.id === playbackMode)?.icon} {PLAYBACK_MODES.find(m => m.id === playbackMode)?.name}
                  {playbackMode === 'repeat' && repeatCount > 0 && ` (${repeatCount}x)`}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              {/* Professional Settings Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-9 w-9 rounded-full hover:bg-primary/10 hover:scale-105 transition-all duration-200 group"
                    title="Audio Settings"
                  >
                    <IconSettings className="w-[18px] h-[18px] group-hover:rotate-90 transition-transform duration-300" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent 
                  align="end" 
                  className="w-56 p-1.5 bg-popover border shadow-xl"
                  sideOffset={8}
                >
                  {/* Header */}
                  <div className="px-2 py-2 mb-1">
                    <div className="flex items-center gap-2">
                      <div className="p-1 rounded-md bg-primary/10">
                        <IconSettings className="w-3.5 h-3.5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm">Audio Settings</h3>
                        <p className="text-[10px] text-muted-foreground">Customize playback</p>
                      </div>
                    </div>
                  </div>
                  
                  <DropdownMenuSeparator className="my-1" />
                  
                  {/* Reciter Sub-menu */}
                  <DropdownMenuSub openDelay={0}>
                    <DropdownMenuSubTrigger className="cursor-pointer rounded-md px-2 py-2 hover:bg-primary/5 data-[state=open]:bg-primary/10 transition-colors focus:outline-none">
                      <div className="flex items-center gap-2 w-full pointer-events-none">
                        <div className="p-1.5 rounded-md bg-gradient-to-br from-primary/20 to-primary/10">
                          <IconVolume className="w-3.5 h-3.5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-xs">Reciter</div>
                          <div className="text-[10px] text-muted-foreground truncate">
                            {RECITERS.find(r => r.id === selectedReciter)?.name || 'Select Reciter'}
                          </div>
                        </div>
                      </div>
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent className="w-64 max-h-80 overflow-y-auto p-1.5 bg-popover border shadow-xl">
                      <div className="sticky top-0 bg-popover px-2 py-1.5 mb-1 -mx-1.5 -mt-1.5 border-b">
                        <DropdownMenuLabel className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                          Choose Reciter
                        </DropdownMenuLabel>
                      </div>
                      <div className="space-y-0.5">
                        {[...RECITERS].sort((a, b) => {
                          // Sort by popular first (true before false)
                          if (a.popular && !b.popular) return -1
                          if (!a.popular && b.popular) return 1
                          return 0
                        }).map((reciter, index, sortedArray) => {
                          // Check if we need a separator (transition from popular to non-popular)
                          const showSeparator = index > 0 && sortedArray[index - 1].popular && !reciter.popular
                          
                          return (
                            <React.Fragment key={reciter.id}>
                              {showSeparator && (
                                <div className="px-2 py-1.5 -mx-1">
                                  <div className="border-t border-dashed border-muted-foreground/20" />
                                  <p className="text-[9px] text-muted-foreground uppercase tracking-wider mt-1.5">
                                    Other Reciters
                                  </p>
                                </div>
                              )}
                              <DropdownMenuItem
                                onClick={() => handleReciterChange(reciter.id)}
                                className={`cursor-pointer rounded-md px-2 py-1.5 transition-all duration-200 ${
                                  selectedReciter === reciter.id 
                                    ? 'bg-primary/15 border-l-2 border-primary' 
                                    : 'hover:bg-primary/5 border-l-2 border-transparent'
                                }`}
                              >
                                <div className="flex items-start gap-2 w-full">
                                  <div className={`mt-0.5 transition-all duration-200 ${selectedReciter === reciter.id ? 'scale-110' : 'scale-0 w-0'}`}>
                                    <IconCheck className="w-3 h-3 text-primary" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5 mb-0.5">
                                      <span className="font-semibold text-xs">{reciter.name}</span>
                                      {reciter.popular && (
                                        <span className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded bg-amber-500/10">
                                          <IconStar className="w-2.5 h-2.5 text-amber-600 fill-amber-600" />
                                          <span className="text-[9px] font-medium text-amber-700">Hot</span>
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-[10px] text-muted-foreground mb-0.5 font-arabic">
                                      {reciter.nameArabic}
                                    </div>
                                    <div className="flex items-center gap-1.5 text-[10px]">
                                      <span className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                                        {reciter.style}
                                      </span>
                                      <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">
                                        {reciter.quality}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </DropdownMenuItem>
                            </React.Fragment>
                          )
                        })}
                      </div>
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>

                  <DropdownMenuSeparator className="my-1" />

                  {/* Playback Mode Sub-menu */}
                  <DropdownMenuSub openDelay={0}>
                    <DropdownMenuSubTrigger className="cursor-pointer rounded-md px-2 py-2 hover:bg-primary/5 data-[state=open]:bg-primary/10 transition-colors focus:outline-none">
                      <div className="flex items-center gap-2 w-full pointer-events-none">
                        <div className="p-1.5 rounded-md bg-gradient-to-br from-primary/20 to-primary/10 text-base">
                          {PLAYBACK_MODES.find(m => m.id === playbackMode)?.icon || '📖'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-xs">Playback Mode</div>
                          <div className="text-[10px] text-muted-foreground truncate">
                            {PLAYBACK_MODES.find(m => m.id === playbackMode)?.name || 'Whole Surah'}
                          </div>
                        </div>
                      </div>
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent className="w-56 p-1.5 bg-popover border shadow-xl">
                      <div className="px-2 py-1.5 mb-1">
                        <DropdownMenuLabel className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                          Choose Mode
                        </DropdownMenuLabel>
                      </div>
                      <div className="space-y-0.5">
                        {PLAYBACK_MODES.map((mode) => (
                          <DropdownMenuItem
                            key={mode.id}
                            onClick={() => handleModeChange(mode.id)}
                            className={`cursor-pointer rounded-md px-2 py-1.5 transition-all duration-200 ${
                              playbackMode === mode.id 
                                ? 'bg-primary/15 border-l-2 border-primary' 
                                : 'hover:bg-primary/5 border-l-2 border-transparent'
                            }`}
                          >
                            <div className="flex items-start gap-2 w-full">
                              <div className={`mt-0.5 transition-all duration-200 ${playbackMode === mode.id ? 'scale-110' : 'scale-0 w-0'}`}>
                                <IconCheck className="w-3 h-3 text-primary" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 mb-0.5">
                                  <span className="text-sm">{mode.icon}</span>
                                  <span className="font-semibold text-xs">{mode.name}</span>
                                </div>
                                <p className="text-[10px] text-muted-foreground leading-relaxed">
                                  {mode.description}
                                </p>
                              </div>
                            </div>
                          </DropdownMenuItem>
                        ))}
                      </div>
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>

                  <DropdownMenuSeparator className="my-1" />

                  {/* Playback Speed Sub-menu */}
                  <DropdownMenuSub openDelay={0}>
                    <DropdownMenuSubTrigger className="cursor-pointer rounded-md px-2 py-2 hover:bg-primary/5 data-[state=open]:bg-primary/10 transition-colors focus:outline-none">
                      <div className="flex items-center gap-2 w-full pointer-events-none">
                        <div className="p-1.5 rounded-md bg-gradient-to-br from-primary/20 to-primary/10">
                          <svg className="w-3.5 h-3.5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-xs">Playback Speed</div>
                          <div className="text-[10px] text-muted-foreground">{playbackSpeed}x Normal</div>
                        </div>
                      </div>
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent className="w-44 p-1.5 bg-popover border shadow-xl">
                      <div className="px-2 py-1.5 mb-1">
                        <DropdownMenuLabel className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                          Select Speed
                        </DropdownMenuLabel>
                      </div>
                      <div className="space-y-0.5">
                        {[
                          { value: 0.5, label: '0.5x', desc: 'Very Slow' },
                          { value: 0.75, label: '0.75x', desc: 'Slow' },
                          { value: 1.0, label: '1.0x', desc: 'Normal' },
                          { value: 1.25, label: '1.25x', desc: 'Fast' },
                          { value: 1.5, label: '1.5x', desc: 'Very Fast' },
                          { value: 2.0, label: '2.0x', desc: 'Ultra Fast' },
                        ].map((speed) => (
                          <DropdownMenuItem
                            key={speed.value}
                            onClick={() => handleSpeedChange(speed.value)}
                            className={`cursor-pointer rounded-md px-2 py-1.5 transition-all duration-200 ${
                              playbackSpeed === speed.value 
                                ? 'bg-primary/15 border-l-2 border-primary' 
                                : 'hover:bg-primary/5 border-l-2 border-transparent'
                            }`}
                          >
                            <div className="flex items-center justify-between w-full">
                              <div className="flex items-center gap-2">
                                <div className={`transition-all duration-200 ${playbackSpeed === speed.value ? 'scale-110' : 'scale-0 w-0'}`}>
                                  <IconCheck className="w-3 h-3 text-primary" />
                                </div>
                                <div>
                                  <div className="font-semibold text-xs">{speed.label}</div>
                                  <div className="text-[10px] text-muted-foreground">{speed.desc}</div>
                                </div>
                              </div>
                            </div>
                          </DropdownMenuItem>
                        ))}
                      </div>
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Current Verse Progress Bar */}
          <div className="space-y-2">
            <div className="relative">
              {/* Buffered indicator */}
              <div 
                className="absolute h-2 bg-primary/20 rounded-full"
                style={{ width: `${buffered}%`, top: '50%', transform: 'translateY(-50%)' }}
              />
              <Slider
                value={[currentTime]}
                max={duration || 100}
                step={0.1}
                onValueChange={handleProgressChange}
                className="cursor-pointer relative z-10"
                disabled={isLoading}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{formatTime(currentTime)} / {formatTime(duration)}</span>
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {/* Previous Verse */}
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-full hover:scale-110 transition-transform"
                onClick={handleSkipPrevious}
                disabled={currentVerseIndex === 0}
                title="Previous verse (←)"
                aria-label="Previous verse"
              >
                <IconPlayerSkipBack className="w-5 h-5" />
              </Button>

              {/* Play/Pause Button */}
              <Button
                onClick={togglePlay}
                size="icon"
                className="h-14 w-14 rounded-full bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110"
                disabled={isLoading || !!audioError}
                title={isPlaying ? "Pause (Space)" : "Play (Space)"}
                aria-label={isPlaying ? "Pause" : "Play"}
              >
                {isLoading ? (
                  <IconLoader2 className="w-6 h-6 animate-spin" />
                ) : isPlaying ? (
                  <IconPlayerPause className="w-6 h-6" />
                ) : (
                  <IconPlayerPlay className="w-6 h-6 ml-0.5" />
                )}
              </Button>

              {/* Next Verse */}
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-full hover:scale-110 transition-transform"
                onClick={handleSkipNext}
                disabled={currentVerseIndex === verses.length - 1}
                title="Next verse (→)"
                aria-label="Next verse"
              >
                <IconPlayerSkipForward className="w-5 h-5" />
              </Button>

              {/* Repeat Current Verse */}
              <Button
                variant="ghost"
                size="icon"
                className={`h-10 w-10 rounded-full hover:scale-110 transition-transform ${playbackMode === 'repeat' ? 'bg-primary/20 text-primary' : ''}`}
              onClick={() => {
                if (audioRef.current) {
                  audioRef.current.currentTime = 0
                  audioRef.current.play()
                  setIsPlaying(true)
                  if (onPlayStateChange) onPlayStateChange(true)
                }
              }}
                title={playbackMode === 'repeat' ? 'Repeat mode active (R)' : 'Replay current verse (R)'}
                aria-label="Replay verse"
              >
                <IconRotateClockwise className="w-5 h-5" />
              </Button>
            </div>

            {/* Volume Control */}
            <div className="flex items-center gap-3 w-32">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={toggleMute}
                title={isMuted ? "Unmute (M)" : "Mute (M)"}
                aria-label={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted || volume === 0 ? (
                  <IconVolumeOff className="w-4 h-4" />
                ) : (
                  <IconVolume className="w-4 h-4" />
                )}
              </Button>
              <Slider
                value={[isMuted ? 0 : volume]}
                max={100}
                step={1}
                onValueChange={handleVolumeChange}
                className="flex-1"
                aria-label="Volume"
              />
            </div>
          </div>

        </div>

        {/* Mobile layout - ultra compact */}
        <div className="md:hidden flex flex-col gap-2">
          {/* Top row - Reciter info and Settings */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="relative w-6 h-6 shrink-0 rounded-full bg-primary/20 flex items-center justify-center">
                {isLoading ? (
                  <IconLoader2 className="w-3 h-3 text-primary animate-spin" />
                ) : (
                  <IconVolume className="w-3 h-3 text-primary" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-xs truncate">
                  {RECITERS.find(r => r.id === selectedReciter)?.name || 'Reciter'}
                </p>
                <p className="text-[10px] text-muted-foreground truncate">
                  Surah {surahNumber} • Verse {currentVerse || 1}
                </p>
              </div>
            </div>

            {/* Settings Button */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6 shrink-0 rounded-full hover:bg-primary/10 touch-manipulation"
                  title="Audio Settings"
                >
                  <IconSettings className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                align="end" 
                className="w-64 p-1.5 bg-popover border shadow-xl"
                sideOffset={8}
              >
                {/* Header */}
                <div className="px-2 py-2 mb-1">
                  <div className="flex items-center gap-2">
                    <div className="p-1 rounded-md bg-primary/10">
                      <IconSettings className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm">Audio Settings</h3>
                      <p className="text-[10px] text-muted-foreground">Customize playback</p>
                    </div>
                  </div>
                </div>
                
                <DropdownMenuSeparator className="my-1" />
                
                {/* Reciter Sub-menu */}
                <DropdownMenuSub openDelay={0}>
                  <DropdownMenuSubTrigger className="cursor-pointer rounded-md px-2 py-2 hover:bg-primary/5 data-[state=open]:bg-primary/10 transition-colors focus:outline-none">
                    <div className="flex items-center gap-2 w-full pointer-events-none">
                      <div className="p-1.5 rounded-md bg-gradient-to-br from-primary/20 to-primary/10">
                        <IconVolume className="w-3.5 h-3.5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-xs">Reciter</div>
                        <div className="text-[10px] text-muted-foreground truncate">
                          {RECITERS.find(r => r.id === selectedReciter)?.name || 'Select Reciter'}
                        </div>
                      </div>
                    </div>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="w-64 max-h-80 overflow-y-auto p-1.5 bg-popover border shadow-xl">
                    <div className="sticky top-0 bg-popover px-2 py-1.5 mb-1 -mx-1.5 -mt-1.5 border-b">
                      <DropdownMenuLabel className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Choose Reciter
                      </DropdownMenuLabel>
                    </div>
                    <div className="space-y-0.5">
                      {[...RECITERS].sort((a, b) => {
                        // Sort by popular first (true before false)
                        if (a.popular && !b.popular) return -1
                        if (!a.popular && b.popular) return 1
                        return 0
                      }).map((reciter, index, sortedArray) => {
                        // Check if we need a separator (transition from popular to non-popular)
                        const showSeparator = index > 0 && sortedArray[index - 1].popular && !reciter.popular
                        
                        return (
                          <React.Fragment key={reciter.id}>
                            {showSeparator && (
                              <div className="px-2 py-1.5 -mx-1">
                                <div className="border-t border-dashed border-muted-foreground/20" />
                                <p className="text-[9px] text-muted-foreground uppercase tracking-wider mt-1.5">
                                  Other Reciters
                                </p>
                              </div>
                            )}
                            <DropdownMenuItem
                              onClick={() => handleReciterChange(reciter.id)}
                              className={`cursor-pointer rounded-md px-2 py-1.5 transition-all duration-200 ${
                                selectedReciter === reciter.id 
                                  ? 'bg-primary/15 border-l-2 border-primary' 
                                  : 'hover:bg-primary/5 border-l-2 border-transparent'
                              }`}
                            >
                              <div className="flex items-start gap-2 w-full">
                                <div className={`mt-0.5 transition-all duration-200 ${selectedReciter === reciter.id ? 'scale-110' : 'scale-0 w-0'}`}>
                                  <IconCheck className="w-3 h-3 text-primary" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1.5 mb-0.5">
                                    <span className="font-semibold text-xs">{reciter.name}</span>
                                    {reciter.popular && (
                                      <span className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded bg-amber-500/10">
                                        <IconStar className="w-2.5 h-2.5 text-amber-600 fill-amber-600" />
                                        <span className="text-[9px] font-medium text-amber-700">Hot</span>
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[10px] text-muted-foreground mb-0.5 font-arabic">
                                    {reciter.nameArabic}
                                  </div>
                                  <div className="flex items-center gap-1.5 text-[10px]">
                                    <span className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                                      {reciter.style}
                                    </span>
                                    <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">
                                      {reciter.quality}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </DropdownMenuItem>
                          </React.Fragment>
                        )
                      })}
                    </div>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>

                <DropdownMenuSeparator className="my-1" />

                {/* Playback Mode Sub-menu */}
                <DropdownMenuSub openDelay={0}>
                  <DropdownMenuSubTrigger className="cursor-pointer rounded-md px-2 py-2 hover:bg-primary/5 data-[state=open]:bg-primary/10 transition-colors focus:outline-none">
                    <div className="flex items-center gap-2 w-full pointer-events-none">
                      <div className="p-1.5 rounded-md bg-gradient-to-br from-primary/20 to-primary/10 text-base">
                        {PLAYBACK_MODES.find(m => m.id === playbackMode)?.icon || '📖'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-xs">Playback Mode</div>
                        <div className="text-[10px] text-muted-foreground truncate">
                          {PLAYBACK_MODES.find(m => m.id === playbackMode)?.name || 'Whole Surah'}
                        </div>
                      </div>
                    </div>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="w-56 p-1.5 bg-popover border shadow-xl">
                    <div className="px-2 py-1.5 mb-1">
                      <DropdownMenuLabel className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Choose Mode
                      </DropdownMenuLabel>
                    </div>
                    <div className="space-y-0.5">
                      {PLAYBACK_MODES.map((mode) => (
                        <DropdownMenuItem
                          key={mode.id}
                          onClick={() => handleModeChange(mode.id)}
                          className={`cursor-pointer rounded-md px-2 py-1.5 transition-all duration-200 ${
                            playbackMode === mode.id 
                              ? 'bg-primary/15 border-l-2 border-primary' 
                              : 'hover:bg-primary/5 border-l-2 border-transparent'
                          }`}
                        >
                          <div className="flex items-start gap-2 w-full">
                            <div className={`mt-0.5 transition-all duration-200 ${playbackMode === mode.id ? 'scale-110' : 'scale-0 w-0'}`}>
                              <IconCheck className="w-3 h-3 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 mb-0.5">
                                <span className="text-sm">{mode.icon}</span>
                                <span className="font-semibold text-xs">{mode.name}</span>
                              </div>
                              <p className="text-[10px] text-muted-foreground leading-relaxed">
                                {mode.description}
                              </p>
                            </div>
                          </div>
                        </DropdownMenuItem>
                      ))}
                    </div>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>

                <DropdownMenuSeparator className="my-1" />

                {/* Playback Speed Sub-menu */}
                <DropdownMenuSub openDelay={0}>
                  <DropdownMenuSubTrigger className="cursor-pointer rounded-md px-2 py-2 hover:bg-primary/5 data-[state=open]:bg-primary/10 transition-colors focus:outline-none">
                    <div className="flex items-center gap-2 w-full pointer-events-none">
                      <div className="p-1.5 rounded-md bg-gradient-to-br from-primary/20 to-primary/10">
                        <svg className="w-3.5 h-3.5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-xs">Playback Speed</div>
                        <div className="text-[10px] text-muted-foreground">{playbackSpeed}x Normal</div>
                      </div>
                    </div>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="w-44 p-1.5 bg-popover border shadow-xl">
                    <div className="px-2 py-1.5 mb-1">
                      <DropdownMenuLabel className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Select Speed
                      </DropdownMenuLabel>
                    </div>
                    <div className="space-y-0.5">
                      {[
                        { value: 0.5, label: '0.5x', desc: 'Very Slow' },
                        { value: 0.75, label: '0.75x', desc: 'Slow' },
                        { value: 1.0, label: '1.0x', desc: 'Normal' },
                        { value: 1.25, label: '1.25x', desc: 'Fast' },
                        { value: 1.5, label: '1.5x', desc: 'Very Fast' },
                        { value: 2.0, label: '2.0x', desc: 'Ultra Fast' },
                      ].map((speed) => (
                        <DropdownMenuItem
                          key={speed.value}
                          onClick={() => handleSpeedChange(speed.value)}
                          className={`cursor-pointer rounded-md px-2 py-1.5 transition-all duration-200 ${
                            playbackSpeed === speed.value 
                              ? 'bg-primary/15 border-l-2 border-primary' 
                              : 'hover:bg-primary/5 border-l-2 border-transparent'
                          }`}
                        >
                          <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-2">
                              <div className={`transition-all duration-200 ${playbackSpeed === speed.value ? 'scale-110' : 'scale-0 w-0'}`}>
                                <IconCheck className="w-3 h-3 text-primary" />
                              </div>
                              <div>
                                <div className="font-semibold text-xs">{speed.label}</div>
                                <div className="text-[10px] text-muted-foreground">{speed.desc}</div>
                              </div>
                            </div>
                          </div>
                        </DropdownMenuItem>
                      ))}
                    </div>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Progress bar and times */}
          <div className="space-y-0.5">
            <div className="relative">
              <div 
                className="absolute h-0.5 bg-primary/20 rounded-full"
                style={{ width: `${buffered}%`, top: '50%', transform: 'translateY(-50%)' }}
              />
              <Slider
                value={[currentTime]}
                max={duration || 100}
                step={0.1}
                onValueChange={handleProgressChange}
                className="cursor-pointer relative z-10 touch-manipulation"
                disabled={isLoading}
              />
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Controls row: prev, play, next, repeat */}
          <div className="flex items-center justify-center gap-3 px-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-full hover:scale-110 transition-transform touch-manipulation"
              onClick={handleSkipPrevious}
              disabled={currentVerseIndex === 0}
              title="Previous verse"
              aria-label="Previous verse"
            >
              <IconPlayerSkipBack className="w-4 h-4" />
            </Button>

            <Button
              onClick={togglePlay}
              size="icon"
              className="h-10 w-10 rounded-full bg-primary hover:bg-primary/90 shadow-md hover:scale-110 transition-all duration-200 touch-manipulation"
              disabled={isLoading || !!audioError}
              title={isPlaying ? "Pause" : "Play"}
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isLoading ? (
                <IconLoader2 className="w-4 h-4 animate-spin" />
              ) : isPlaying ? (
                <IconPlayerPause className="w-4 h-4" />
              ) : (
                <IconPlayerPlay className="w-4 h-4 ml-0.5" />
              )}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-full hover:scale-110 transition-transform touch-manipulation"
              onClick={handleSkipNext}
              disabled={currentVerseIndex === verses.length - 1}
              title="Next verse"
              aria-label="Next verse"
            >
              <IconPlayerSkipForward className="w-4 h-4" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className={`h-9 w-9 rounded-full hover:scale-110 transition-transform touch-manipulation ${playbackMode === 'repeat' ? 'bg-primary/20 text-primary' : ''}`}
              onClick={() => {
                if (audioRef.current) {
                  audioRef.current.currentTime = 0
                  audioRef.current.play()
                  setIsPlaying(true)
                  if (onPlayStateChange) onPlayStateChange(true)
                }
              }}
              title={playbackMode === 'repeat' ? 'Repeat mode active' : 'Replay current verse'}
              aria-label="Replay verse"
            >
              <IconRotateClockwise className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <style jsx global>{`
          @keyframes slide-down {
            from {
              opacity: 0;
              transform: translateX(-50%) translateY(-20px);
            }
            to {
              opacity: 1;
              transform: translateX(-50%) translateY(0);
            }
          }

          .animate-slide-down {
            animation: slide-down 0.3s ease-out;
          }

          .audio-player {
            animation: slide-up 0.5s ease-out;
          }

          @keyframes slide-up {
            from {
              opacity: 0;
              transform: translateY(100%);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes fade-scale {
            0% {
              opacity: 0;
              transform: translate(-50%, -50%) scale(0.8);
            }
            100% {
              opacity: 1;
              transform: translate(-50%, -50%) scale(1);
            }
          }

          .animate-fade-scale {
            animation: fade-scale 0.5s ease-out;
          }

          .audio-player::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 2px;
            background: linear-gradient(90deg, transparent, hsl(var(--primary)), transparent);
            animation: shimmer 2s infinite;
          }

          @keyframes shimmer {
            0%, 100% {
              opacity: 0.5;
            }
            50% {
              opacity: 1;
            }
          }

          kbd {
            font-family: ui-monospace, monospace;
            font-size: 0.75em;
            font-weight: 600;
          }

           @media (max-width: 768px) {
             .audio-player {
               padding: 0.5rem;
               border-left: none;
               border-right: none;
               border-radius: 0;
               min-height: auto;
             }
           }
        `}</style>
      </Card>
    </>
  )
}

