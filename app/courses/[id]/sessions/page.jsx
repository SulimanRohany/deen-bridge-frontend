'use client'

import { useEffect, useMemo, useState, useCallback } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import api from '@/lib/api'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import ResourceList from '@/components/live-session/resource-list'
import { 
  IconArrowLeft, 
  IconCalendar, 
  IconClock, 
  IconVideo, 
  IconFilter,
  IconSearch,
  IconX,
  IconRefresh,
  IconCircleCheck,
  IconCircleDot,
  IconCircleX,
  IconCalendarEvent,
  IconPlayerPlay,
  IconUsers,
  IconChartBar,
  IconSparkles,
  IconLayoutGrid,
  IconLayoutList,
  IconDownload,
  IconInfoCircle,
  IconBookmark,
  IconStar,
  IconChevronRight,
  IconHome,
  IconBook,
  IconAlertCircle,
  IconClockHour4,
  IconCalendarTime,
  IconDeviceDesktop,
  IconPhotoVideo,
  IconBolt,
  IconTrophy,
  IconShare,
  IconDots,
  IconEye,
  IconCalendarStats,
  IconCertificate,
  IconSchool,
  IconFolderOpen
} from '@tabler/icons-react'

function toArray(v) {
  if (Array.isArray(v)) return v
  if (v && Array.isArray((v).results)) return (v).results
  return []
}

// Utility function to get relative time
function getRelativeTime(dateString) {
  const date = new Date(dateString)
  const now = new Date()
  const diffInMs = date - now
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60))
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))

  if (diffInHours < 0) {
    return 'Past'
  } else if (diffInHours < 1) {
    const diffInMins = Math.floor(diffInMs / (1000 * 60))
    return diffInMins > 0 ? `In ${diffInMins} mins` : 'Starting now'
  } else if (diffInHours < 24) {
    return `In ${diffInHours} hour${diffInHours !== 1 ? 's' : ''}`
  } else if (diffInDays < 7) {
    return `In ${diffInDays} day${diffInDays !== 1 ? 's' : ''}`
  } else {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }
}

// Countdown component
function CountdownTimer({ targetDate }) {
  const [timeLeft, setTimeLeft] = useState('')

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = new Date(targetDate) - new Date()
      
      if (difference > 0) {
        const hours = Math.floor((difference / (1000 * 60 * 60)) % 24)
        const minutes = Math.floor((difference / 1000 / 60) % 60)
        const seconds = Math.floor((difference / 1000) % 60)
        
        if (difference < 60 * 60 * 1000) { // Less than 1 hour
          setTimeLeft(`${minutes}m ${seconds}s`)
        } else {
          setTimeLeft(`${hours}h ${minutes}m`)
        }
      } else {
        setTimeLeft('Live now!')
      }
    }

    calculateTimeLeft()
    const timer = setInterval(calculateTimeLeft, 1000)

    return () => clearInterval(timer)
  }, [targetDate])

  return <span className="font-mono font-semibold">{timeLeft}</span>
}

export default function CourseSessionsPage() {
  // Get current user id from JWT if possible, fallback to localStorage
  let userId = null
  try {
    if (typeof window !== 'undefined') {
      const authTokens = localStorage.getItem('authTokens')
      if (authTokens) {
        try {
          const tokens = JSON.parse(authTokens)
          if (tokens.access) {
            const base64Url = tokens.access.split('.')[1]
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
            const jsonPayload = decodeURIComponent(
              atob(base64)
                .split('')
                .map(function (c) {
                  return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
                })
                .join('')
            )
            const payload = JSON.parse(jsonPayload)
            userId = payload.user_id || payload.id || localStorage.getItem('user_id')
          } else {
            userId = localStorage.getItem('user_id')
          }
        } catch (e) {
          userId = localStorage.getItem('user_id')
        }
      } else {
        userId = localStorage.getItem('user_id')
      }
    }
  } catch {}
  
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const courseId = Number(params?.id)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [courseLoading, setCourseLoading] = useState(true)
  const [course, setCourse] = useState(null)
  const [joiningSessionId, setJoiningSessionId] = useState(null)

  const [records, setRecords] = useState([])
  const [count, setCount] = useState(0)
  const [nextUrl, setNextUrl] = useState(null)
  const [prevUrl, setPrevUrl] = useState(null)

  // filters
  const [dateFrom, setDateFrom] = useState(searchParams.get('date_from') ?? undefined)
  const [dateTo, setDateTo] = useState(searchParams.get('date_to') ?? undefined)
  const [status, setStatus] = useState(searchParams.get('status') ?? 'all')
  const [title, setTitle] = useState(searchParams.get('title') ?? '')

  // pagination
  const [limit, setLimit] = useState(Number(searchParams.get('limit') ?? 12))
  const [offset, setOffset] = useState(Number(searchParams.get('offset') ?? 0))

  // view mode
  const [viewMode, setViewMode] = useState('grid')
  const [activeTab, setActiveTab] = useState('all') // all, upcoming, past
  
  // resources dialog
  const [resourcesDialogOpen, setResourcesDialogOpen] = useState(false)
  const [selectedSessionForResources, setSelectedSessionForResources] = useState(null)

  const queryString = useMemo(() => {
    const q = new URLSearchParams()
    q.set('course', String(courseId))
    q.set('ordering', '-created_at')
    q.set('limit', String(limit))
    q.set('offset', String(offset))
    if (dateFrom) q.set('date_from', dateFrom)
    if (dateTo) q.set('date_to', dateTo)
    if (title) q.set('title', title)
    if (status && status !== 'all') q.set('status', status)
    return q.toString()
  }, [courseId, dateFrom, dateTo, title, status, limit, offset])

  // Fetch course details
  useEffect(() => {
    const fetchCourse = async () => {
      if (!courseId) return
      try {
        setCourseLoading(true)
        const res = await api.get(`course/${courseId}/`)
        setCourse(res.data)
      } catch (e) {
        console.error('Failed to load course:', e)
      } finally {
        setCourseLoading(false)
      }
    }
    fetchCourse()
  }, [courseId])

  const fetchSessions = async (fullUrl) => {
    if (!courseId) return
    try {
      setLoading(true)
      setError(null)

      const url = fullUrl ? fullUrl : `course/live_session/?${queryString}`
      const res = await api.get(url)
      const data = res.data

      setRecords(toArray(data))
      setCount(data.count ?? toArray(data).length)
      setNextUrl(data.next ?? null)
      setPrevUrl(data.previous ?? null)
    } catch (e) {
      console.error(e)
      setError('Failed to load sessions.')
      setRecords([])
      setCount(0)
      setNextUrl(null)
      setPrevUrl(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSessions()
    // reflect filters in URL
    const q = new URLSearchParams()
    if (dateFrom) q.set('date_from', dateFrom)
    if (dateTo) q.set('date_to', dateTo)
    if (status && status !== 'all') q.set('status', status)
    if (title) q.set('title', title)
    q.set('limit', String(limit))
    q.set('offset', String(offset))
    const qs = q.toString()
    const base = `/courses/${courseId}/sessions`
    router.replace(qs ? `${base}?${qs}` : base)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryString])

  const resetFilters = () => {
    setDateFrom(undefined)
    setDateTo(undefined)
    setStatus('all')
    setTitle('')
    setOffset(0)
    setActiveTab('all')
  }

  const handleJoinSession = (sessionId) => {
    setJoiningSessionId(sessionId)
    router.push(`/courses/${courseId}/sessions/${sessionId}/join`)
  }

  const hasActiveFilters = dateFrom || dateTo || (status && status !== 'all') || title

  const getStatusIcon = (sessionStatus) => {
    switch (sessionStatus) {
      case 'live':
        return <IconCircleDot className="h-4 w-4" />
      case 'completed':
        return <IconCircleCheck className="h-4 w-4" />
      case 'cancelled':
        return <IconCircleX className="h-4 w-4" />
      default:
        return <IconCalendarEvent className="h-4 w-4" />
    }
  }

  const getStatusVariant = (sessionStatus) => {
    switch (sessionStatus) {
      case 'live':
        return 'default'
      case 'completed':
        return 'secondary'
      case 'cancelled':
        return 'destructive'
      default:
        return 'outline'
    }
  }

  // Count sessions by status
  const sessionStats = useMemo(() => {
    const stats = {
      total: records.length,
      live: 0,
      scheduled: 0,
      completed: 0,
      cancelled: 0,
      upcoming: 0
    }
    const now = new Date()
    records.forEach(s => {
      if (s.status === 'live') stats.live++
      else if (s.status === 'scheduled') {
        stats.scheduled++
        if (s.created_at && new Date(s.created_at) > now) {
          stats.upcoming++
        }
      }
      else if (s.status === 'completed') stats.completed++
      else if (s.status === 'cancelled') stats.cancelled++
    })
    return stats
  }, [records])

  // Group sessions by date
  const groupedSessions = useMemo(() => {
    const groups = {}
    records.forEach(session => {
      if (!session.created_at) return
      const date = new Date(session.created_at)
      const dateKey = date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })
      if (!groups[dateKey]) {
        groups[dateKey] = []
      }
      groups[dateKey].push(session)
    })
    return groups
  }, [records])

  // Filter sessions by tab
  const filteredRecords = useMemo(() => {
    const now = new Date()
    if (activeTab === 'upcoming') {
      return records.filter(s => 
        (s.status === 'scheduled' || s.status === 'live') && 
        (!s.created_at || new Date(s.created_at) >= now)
      )
    } else if (activeTab === 'past') {
      return records.filter(s => 
        s.status === 'completed' || 
        (s.created_at && new Date(s.created_at) < now && s.status !== 'live')
      )
    }
    return records
  }, [records, activeTab])

  return (
    <div className="min-h-screen bg-background">
      {/* Full-page Loading Overlay */}
      {joiningSessionId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <Card className="w-full max-w-md p-8 space-y-6 text-center shadow-2xl">
            <div className="flex justify-center">
              <div className="relative">
                <div className="w-20 h-20 border-4 border-red-200 dark:border-red-900 rounded-full"></div>
                <div className="absolute inset-0 w-20 h-20 border-4 border-red-600 dark:border-red-400 rounded-full animate-spin border-t-transparent"></div>
              </div>
            </div>
            <div className="space-y-3">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Joining Live Session</h2>
              <p className="text-gray-600 dark:text-gray-300">
                Please wait while we connect you to the session...
              </p>
            </div>
          </Card>
        </div>
      )}
      
      {/* 🚨 LIVE SESSION ALERT - Top Priority */}
                  {sessionStats.live > 0 && (() => {
        const firstLiveSession = records.find(s => s.status === 'live')
        return (
        <div className="bg-gradient-to-r from-red-600 via-red-500 to-red-600 text-white px-4 py-3 shadow-lg">
          <div className="container mx-auto flex items-center justify-between max-w-7xl">
            <div className="flex items-center gap-3">
              <IconCircleDot className="h-5 w-5 animate-pulse" />
              <span className="font-bold text-sm md:text-base">🔴 LIVE SESSION IN PROGRESS</span>
              </div>
              <Button 
                size="sm" 
                variant="secondary" 
                className="bg-white text-red-600 hover:bg-white/90 font-bold disabled:opacity-70"
                onClick={() => firstLiveSession && handleJoinSession(firstLiveSession.id)}
                disabled={joiningSessionId === firstLiveSession?.id}
              >
                {joiningSessionId === firstLiveSession?.id ? 'Joining...' : 'Join Now'}
              </Button>
            </div>
          </div>
        )
      })()}

      {/* Professional Hero Banner */}
      <div className="relative bg-gradient-to-br from-slate-50 via-white to-blue-50/30 dark:from-slate-900 dark:via-slate-800 dark:to-blue-900/20 border-b border-slate-200 dark:border-slate-800">
        {/* Professional Pattern Overlay */}
        <div className="absolute inset-0 opacity-5 dark:opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23334155' fill-opacity='0.1'%3E%3Cpath d='M30 30c0-8.3-6.7-15-15-15s-15 6.7-15 15 6.7 15 15 15 15-6.7 15-15zm15 0c0-8.3-6.7-15-15-15s-15 6.7-15 15 6.7 15 15 15 15-6.7 15-15z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: '60px 60px'
          }}></div>
        </div>
        
        {/* Subtle geometric accents */}
        <div className="absolute top-8 right-8 hidden lg:block opacity-20">
          <div className="w-20 h-20 border-2 border-slate-300 dark:border-slate-600 rounded-2xl"></div>
        </div>
        <div className="absolute bottom-12 right-20 hidden lg:block opacity-15">
          <div className="w-16 h-16 border-2 border-blue-300 dark:border-blue-600 rounded-full"></div>
        </div>
        <div className="absolute top-20 left-12 hidden lg:block opacity-25">
          <div className="w-18 h-18 border-2 border-slate-300 dark:border-slate-600 rounded-2xl"></div>
        </div>

        {/* Spectacular Session Background */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Animated gradient waves */}
          <div className="absolute inset-0">
            <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-violet-400/20 via-purple-400/15 to-fuchsia-400/20 dark:from-violet-600/10 dark:via-purple-600/8 dark:to-fuchsia-600/10 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-gradient-to-bl from-cyan-400/20 via-blue-400/15 to-indigo-400/20 dark:from-cyan-600/10 dark:via-blue-600/8 dark:to-indigo-600/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
            <div className="absolute -bottom-1/2 -left-1/2 w-full h-full bg-gradient-to-tr from-emerald-400/20 via-teal-400/15 to-cyan-400/20 dark:from-emerald-600/10 dark:via-teal-600/8 dark:to-cyan-600/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
            <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-rose-400/20 via-pink-400/15 to-orange-400/20 dark:from-rose-600/10 dark:via-pink-600/8 dark:to-orange-600/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '3s'}}></div>
          </div>
          
          {/* Floating holographic session cards */}
          <div className="absolute top-16 right-16 w-28 h-20 bg-gradient-to-br from-red-100/90 via-pink-100/70 to-rose-100/60 dark:from-red-900/40 dark:via-pink-900/30 dark:to-rose-900/20 backdrop-blur-md rounded-xl border border-red-300/60 dark:border-red-700/40 shadow-2xl transform rotate-12 hover:rotate-6 transition-all duration-1000 opacity-80">
            <div className="p-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse" style={{animationDelay: '0.5s'}}></div>
                <div className="w-1 h-1 bg-red-300 rounded-full animate-pulse" style={{animationDelay: '1s'}}></div>
              </div>
              <div className="space-y-1">
                <div className="w-full h-1.5 bg-gradient-to-r from-red-400/80 to-pink-400/60 dark:from-red-500/60 dark:to-pink-500/40 rounded-full"></div>
                <div className="w-4/5 h-1 bg-gradient-to-r from-red-300/60 to-pink-300/40 dark:from-red-600/40 dark:to-pink-600/30 rounded-full"></div>
                <div className="w-3/5 h-0.5 bg-gradient-to-r from-red-200/40 to-pink-200/30 dark:from-red-700/30 dark:to-pink-700/20 rounded-full"></div>
              </div>
            </div>
          </div>
          
          <div className="absolute top-32 left-12 w-24 h-18 bg-gradient-to-br from-green-100/90 via-emerald-100/70 to-teal-100/60 dark:from-green-900/40 dark:via-emerald-900/30 dark:to-teal-900/20 backdrop-blur-md rounded-xl border border-green-300/60 dark:border-green-700/40 shadow-2xl transform -rotate-8 hover:-rotate-4 transition-all duration-1000 opacity-75">
            <div className="p-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <div className="w-1 h-1 bg-green-300 rounded-full"></div>
              </div>
              <div className="space-y-1">
                <div className="w-full h-1.5 bg-gradient-to-r from-green-400/80 to-emerald-400/60 dark:from-green-500/60 dark:to-emerald-500/40 rounded-full"></div>
                <div className="w-3/4 h-1 bg-gradient-to-r from-green-300/60 to-emerald-300/40 dark:from-green-600/40 dark:to-emerald-600/30 rounded-full"></div>
                <div className="w-2/3 h-0.5 bg-gradient-to-r from-green-200/40 to-emerald-200/30 dark:from-green-700/30 dark:to-emerald-700/20 rounded-full"></div>
              </div>
            </div>
          </div>
          
          <div className="absolute bottom-28 right-24 w-26 h-19 bg-gradient-to-br from-blue-100/90 via-cyan-100/70 to-sky-100/60 dark:from-blue-900/40 dark:via-cyan-900/30 dark:to-sky-900/20 backdrop-blur-md rounded-xl border border-blue-300/60 dark:border-blue-700/40 shadow-2xl transform rotate-8 hover:rotate-4 transition-all duration-1000 opacity-70">
            <div className="p-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <div className="w-1 h-1 bg-blue-300 rounded-full"></div>
              </div>
              <div className="space-y-1">
                <div className="w-full h-1.5 bg-gradient-to-r from-blue-400/80 to-cyan-400/60 dark:from-blue-500/60 dark:to-cyan-500/40 rounded-full"></div>
                <div className="w-5/6 h-1 bg-gradient-to-r from-blue-300/60 to-cyan-300/40 dark:from-blue-600/40 dark:to-cyan-600/30 rounded-full"></div>
                <div className="w-4/5 h-0.5 bg-gradient-to-r from-blue-200/40 to-cyan-200/30 dark:from-blue-700/30 dark:to-cyan-700/20 rounded-full"></div>
              </div>
            </div>
          </div>
          
          <div className="absolute top-48 left-1/4 w-22 h-16 bg-gradient-to-br from-purple-100/90 via-violet-100/70 to-indigo-100/60 dark:from-purple-900/40 dark:via-violet-900/30 dark:to-indigo-900/20 backdrop-blur-md rounded-xl border border-purple-300/60 dark:border-purple-700/40 shadow-2xl transform -rotate-4 hover:-rotate-2 transition-all duration-1000 opacity-65">
            <div className="p-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                <div className="w-1 h-1 bg-purple-300 rounded-full"></div>
              </div>
              <div className="space-y-1">
                <div className="w-full h-1.5 bg-gradient-to-r from-purple-400/80 to-violet-400/60 dark:from-purple-500/60 dark:to-violet-500/40 rounded-full"></div>
                <div className="w-1/2 h-1 bg-gradient-to-r from-purple-300/60 to-violet-300/40 dark:from-purple-600/40 dark:to-violet-600/30 rounded-full"></div>
                <div className="w-1/3 h-0.5 bg-gradient-to-r from-purple-200/40 to-violet-200/30 dark:from-purple-700/30 dark:to-violet-700/20 rounded-full"></div>
              </div>
            </div>
          </div>
          
          {/* Dynamic connection network */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{opacity: 0.3}}>
            <defs>
              <linearGradient id="connection1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ec4899" stopOpacity="0.6"/>
                <stop offset="50%" stopColor="#8b5cf6" stopOpacity="0.4"/>
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.6"/>
              </linearGradient>
              <linearGradient id="connection2" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.6"/>
                <stop offset="50%" stopColor="#06b6d4" stopOpacity="0.4"/>
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.6"/>
              </linearGradient>
            </defs>
            <path d="M 200 100 Q 400 200 600 150" stroke="url(#connection1)" strokeWidth="2" fill="none" className="animate-pulse"/>
            <path d="M 100 300 Q 300 400 500 350" stroke="url(#connection2)" strokeWidth="2" fill="none" className="animate-pulse" style={{animationDelay: '1s'}}/>
            <path d="M 300 50 Q 500 100 700 80" stroke="url(#connection1)" strokeWidth="1.5" fill="none" className="animate-pulse" style={{animationDelay: '2s'}}/>
          </svg>
          
          {/* Floating particles */}
          <div className="absolute top-20 left-1/3 w-3 h-3 bg-gradient-to-br from-yellow-400 to-orange-400 dark:from-yellow-500 dark:to-orange-500 rounded-full animate-bounce opacity-60"></div>
          <div className="absolute top-40 right-1/3 w-2 h-2 bg-gradient-to-br from-teal-400 to-cyan-400 dark:from-teal-500 dark:to-cyan-500 rounded-full animate-bounce opacity-50" style={{animationDelay: '0.5s'}}></div>
          <div className="absolute bottom-32 left-1/4 w-2.5 h-2.5 bg-gradient-to-br from-rose-400 to-pink-400 dark:from-rose-500 dark:to-pink-500 rounded-full animate-bounce opacity-55" style={{animationDelay: '1s'}}></div>
          <div className="absolute bottom-20 right-1/4 w-1.5 h-1.5 bg-gradient-to-br from-indigo-400 to-purple-400 dark:from-indigo-500 dark:to-purple-500 rounded-full animate-bounce opacity-45" style={{animationDelay: '1.5s'}}></div>
          
          {/* Holographic grid overlay */}
          <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.04]">
            <div className="w-full h-full" style={{
              backgroundImage: `
                radial-gradient(circle at 1px 1px, rgb(147 51 234) 1px, transparent 0),
                radial-gradient(circle at 20px 20px, rgb(59 130 246) 1px, transparent 0),
                radial-gradient(circle at 40px 40px, rgb(236 72 153) 1px, transparent 0)
              `,
              backgroundSize: '60px 60px'
            }}></div>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 lg:py-16 relative max-w-7xl">
          
          {/* Breadcrumb Navigation */}
          <nav className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-8">
            <Link href="/" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Home</Link>
            <IconChevronRight className="h-4 w-4" />
            <Link href="/courses" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Courses</Link>
            <IconChevronRight className="h-4 w-4" />
            {courseLoading ? (
              <Skeleton className="h-4 w-40" />
            ) : (
              <Link href={`/courses/${courseId}`} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  {course?.title || 'Course'}
              </Link>
            )}
            <IconChevronRight className="h-4 w-4" />
            <span className="text-gray-900 dark:text-white font-medium">Live Sessions</span>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
            {/* Left: Course Overview */}
            <div className="lg:col-span-2 space-y-8">
              
              {/* Professional Course Header */}
              <div className="space-y-6">
                {/* Professional Status Indicators */}
                <div className="flex flex-wrap gap-3">
                  {sessionStats.live > 0 && (
                    <div className="inline-flex items-center gap-2 bg-gradient-to-r from-red-600 to-red-700 px-4 py-2.5 rounded-xl text-sm font-bold shadow-xl border border-red-500/20">
                      <div className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                      </div>
                      <span className="text-white tracking-wide">{sessionStats.live} LIVE SESSIONS</span>
                    </div>
                  )}
                  {sessionStats.scheduled > 0 && (
                    <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-2.5 rounded-xl text-sm font-bold shadow-xl border border-blue-500/20">
                      <IconCalendarEvent className="h-4 w-4 text-white" />
                      <span className="text-white tracking-wide">{sessionStats.scheduled} SCHEDULED</span>
                    </div>
                  )}
                  {sessionStats.completed > 0 && (
                    <div className="inline-flex items-center gap-2 bg-gradient-to-r from-green-600 to-green-700 px-4 py-2.5 rounded-xl text-sm font-bold shadow-xl border border-green-500/20">
                      <IconCircleCheck className="h-4 w-4 text-white" />
                      <span className="text-white tracking-wide">{sessionStats.completed} COMPLETED</span>
                    </div>
                  )}
                </div>
                    
                {/* Professional Title Section */}
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl shadow-lg">
                      <IconVideo className="h-6 w-6 text-white" />
                    </div>
                    <div className="h-8 w-px bg-gradient-to-b from-slate-300 to-slate-500 dark:from-slate-600 dark:to-slate-400"></div>
                    <div>
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Live Learning Platform</span>
                      <div className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-widest">Interactive Session Management</div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h1 className="text-4xl sm:text-5xl md:text-6xl font-black leading-tight text-slate-900 dark:text-white">
                      Professional
                      <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600">
                        Live Sessions
                      </span>
                    </h1>
                    <div className="flex items-center gap-4">
                      <div className="h-1 w-32 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full"></div>
                      <div className="h-1 w-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full"></div>
                    </div>
                  </div>
                </div>


                {/* Simple Statistics Dashboard */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  {/* Total Sessions */}
                  <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 shadow-sm hover:shadow-lg hover:border-slate-300 dark:hover:border-slate-600 transition-all duration-300">
                    <div className="flex items-center justify-between">
                      <div className="p-3 bg-slate-100 dark:bg-slate-700 rounded-lg">
                        <IconVideo className="h-5 w-5 text-slate-600 dark:text-slate-300" />
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">Total Sessions</p>
                        <p className="text-2xl font-bold text-slate-900 dark:text-white">{count}</p>
                      </div>
                    </div>
                  </div>
                    
                  {/* Live Sessions */}
                  <div className="bg-white dark:bg-slate-800 border border-red-200 dark:border-red-800/50 rounded-xl p-6 shadow-sm hover:shadow-lg hover:border-red-300 dark:hover:border-red-600 transition-all duration-300">
                    <div className="flex items-center justify-between">
                      <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-lg">
                        <IconCircleDot className="h-5 w-5 text-red-600 dark:text-red-400" />
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-medium text-red-600 dark:text-red-400 uppercase tracking-wide mb-1">Live Now</p>
                        <p className="text-2xl font-bold text-red-600 dark:text-red-400">{sessionStats.live}</p>
                      </div>
                    </div>
                  </div>
                
                  {/* Scheduled Sessions */}
                  <div className="bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-800/50 rounded-xl p-6 shadow-sm hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-300">
                    <div className="flex items-center justify-between">
                      <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                        <IconCalendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-1">Scheduled</p>
                        <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{sessionStats.scheduled}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Corporate Quick Actions Panel */}
            <div className="lg:block">
              <Card className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm">
                <CardHeader className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-900 dark:bg-slate-100 rounded-md">
                      <IconBolt className="h-4 w-4 text-white dark:text-slate-900" />
                    </div>
                    <div>
                      <CardTitle className="text-base font-bold text-slate-900 dark:text-white">Quick Actions</CardTitle>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">Session Management</p>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="p-4 space-y-3">
                  <Button asChild className="w-full gap-2 h-10 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 text-white dark:text-slate-900">
                <Link href={`/courses/${courseId}`}>
                      <IconBook className="h-4 w-4" />
                      Course Details
                </Link>
              </Button>
                    
                  {sessionStats.live > 0 && (() => {
                    const firstLiveSession = records.find(s => s.status === 'live')
                    return (
                      <Button 
                        className="w-full gap-2 h-10 bg-red-600 hover:bg-red-700 text-white justify-center disabled:opacity-70"
                        onClick={() => firstLiveSession && handleJoinSession(firstLiveSession.id)}
                        disabled={joiningSessionId === firstLiveSession?.id}
                      >
                        <IconCircleDot className="h-4 w-4" />
                        {joiningSessionId === firstLiveSession?.id ? 'Joining...' : 'Join Live Session'}
                        {joiningSessionId !== firstLiveSession?.id && (
                          <span className="relative flex h-1.5 w-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white"></span>
                          </span>
                        )}
                      </Button>
                    )
                  })()}
                  
                  {/* Session Stats Summary */}
                  <div className="pt-3 mt-3 border-t border-slate-200 dark:border-slate-700">
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">Session Overview</p>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between py-1.5 px-2 rounded bg-slate-50 dark:bg-slate-900/50">
                        <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Total</span>
                        <span className="text-sm font-bold text-slate-900 dark:text-white">{count}</span>
            </div>
                      <div className="flex items-center justify-between py-1.5 px-2 rounded bg-red-50 dark:bg-red-900/20">
                        <span className="text-xs font-medium text-red-600 dark:text-red-400">Live</span>
                        <span className="text-sm font-bold text-red-600 dark:text-red-400">{sessionStats.live}</span>
          </div>
                      <div className="flex items-center justify-between py-1.5 px-2 rounded bg-green-50 dark:bg-green-900/20">
                        <span className="text-xs font-medium text-green-600 dark:text-green-400">Completed</span>
                        <span className="text-sm font-bold text-green-600 dark:text-green-400">{sessionStats.completed}</span>
        </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Left Sidebar - Filters & Quick Stats */}
          <aside className="w-full lg:w-80 shrink-0">
            <div className="lg:sticky lg:top-4 space-y-6">
              
              {/* Filter Card */}
              <Card className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm">
                <CardHeader className="pb-4">
                    <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      <IconFilter className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <CardTitle className="text-base font-bold">Filters</CardTitle>
                        <p className="text-xs text-muted-foreground mt-0.5">Refine your search</p>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-5">
                  {/* Search Bar */}
                  <div className="space-y-2.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide flex items-center gap-2">
                      <IconSearch className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                      Search Sessions
                    </label>
                    <div className="relative group">
                      <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-600 dark:group-focus-within:text-blue-400 transition-colors" />
                      <Input
                        placeholder="Type session name..."
                        value={title}
                        onChange={(e) => { setOffset(0); setTitle(e.target.value) }}
                        className="h-11 pl-10 pr-10 border-2 border-slate-200 dark:border-slate-700 focus:border-blue-500 dark:focus:border-blue-400 transition-all duration-200 bg-background"
                      />
                      {title && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setTitle('')}
                          className="absolute right-1.5 top-1/2 -translate-y-1/2 h-7 w-7 p-0 hover:bg-destructive/10 hover:text-destructive transition-colors"
                        >
                          <IconX className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />

                  {/* Date Range Section */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide flex items-center gap-2">
                      <IconCalendar className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                      Date Range
                    </h4>
                    
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                          <IconCalendarTime className="h-3 w-3" />
                          From Date
                        </label>
                        <Input
                          type="date"
                          value={dateFrom ?? ''}
                          onChange={(e) => { setOffset(0); setDateFrom(e.target.value || undefined) }}
                          className="h-10 border-2 border-slate-200 dark:border-slate-700 focus:border-blue-500 dark:focus:border-blue-400 transition-all duration-200"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                          <IconCalendarTime className="h-3 w-3" />
                          To Date
                        </label>
                        <Input
                          type="date"
                          value={dateTo ?? ''}
                          onChange={(e) => { setOffset(0); setDateTo(e.target.value || undefined) }}
                          className="h-10 border-2 border-slate-200 dark:border-slate-700 focus:border-blue-500 dark:focus:border-blue-400 transition-all duration-200"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />

                  {/* Status Filter */}
                  <div className="space-y-2.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide flex items-center gap-2">
                      <IconCircleDot className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                      Status
                    </label>
                    <Select value={status} onValueChange={(v) => { setOffset(0); setStatus(v) }}>
                      <SelectTrigger className="h-11 border-2 border-slate-200 dark:border-slate-700 focus:border-blue-500 dark:focus:border-blue-400 transition-all duration-200">
                        <SelectValue placeholder="All Statuses" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">
                          <div className="flex items-center gap-2">
                            <IconLayoutGrid className="h-4 w-4" />
                            All Statuses
                          </div>
                        </SelectItem>
                        <SelectItem value="scheduled">
                          <div className="flex items-center gap-2">
                            <IconCalendarEvent className="h-4 w-4 text-amber-500" />
                            Scheduled
                          </div>
                        </SelectItem>
                        <SelectItem value="live">
                          <div className="flex items-center gap-2">
                            <IconCircleDot className="h-4 w-4 text-red-500 animate-pulse" />
                            Live
                          </div>
                        </SelectItem>
                        <SelectItem value="completed">
                          <div className="flex items-center gap-2">
                            <IconCircleCheck className="h-4 w-4 text-green-500" />
                            Completed
                          </div>
                        </SelectItem>
                        <SelectItem value="cancelled">
                          <div className="flex items-center gap-2">
                            <IconCircleX className="h-4 w-4 text-gray-500" />
                            Cancelled
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />


                  {hasActiveFilters && (
                    <>
                      <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />
                      <Button
                        variant="outline"
                        onClick={resetFilters}
                        className="w-full gap-2 h-11 border-2 border-slate-200 dark:border-slate-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-200 font-medium group"
                      >
                        <IconRefresh className="h-4 w-4 group-hover:rotate-180 transition-transform duration-300" />
                        Clear All Filters
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Active Filters Summary */}
              {hasActiveFilters && (
                <Card className="border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-2.5">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                        <IconSparkles className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white mb-1">Active Filters</p>
                        <div className="flex flex-wrap gap-1.5">
                          {title && (
                            <Badge variant="secondary" className="text-xs gap-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                              <IconSearch className="h-3 w-3" />
                              Search: {title}
                            </Badge>
                          )}
                          {dateFrom && (
                            <Badge variant="secondary" className="text-xs gap-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                              <IconCalendar className="h-3 w-3" />
                              From: {dateFrom}
                            </Badge>
                          )}
                          {dateTo && (
                            <Badge variant="secondary" className="text-xs gap-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                              <IconCalendar className="h-3 w-3" />
                              To: {dateTo}
                            </Badge>
                          )}
                          {status !== 'all' && (
                            <Badge variant="secondary" className="text-xs gap-1 capitalize bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                              <IconCircleDot className="h-3 w-3" />
                              {status}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </aside>

          {/* Right Content Area - Enhanced Sessions List */}
          <main className="flex-1 min-w-0">
            
            {/* Tab Navigation + View Toggle */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              {/* Quick Filter Tabs */}
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant={activeTab === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveTab('all')}
                  className="gap-2 transition-all"
                >
                  <IconLayoutGrid className="h-4 w-4" />
                  All Sessions
                  <Badge variant="default" className="ml-1">{records.length}</Badge>
                </Button>
                <Button
                  variant={activeTab === 'upcoming' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveTab('upcoming')}
                  className="gap-2 transition-all"
                >
                  <IconBolt className="h-4 w-4" />
                  Upcoming
                  <Badge variant="default" className="ml-1">{sessionStats.upcoming}</Badge>
                </Button>
                <Button
                  variant={activeTab === 'past' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveTab('past')}
                  className="gap-2 transition-all"
                >
                  <IconCircleCheck className="h-4 w-4" />
                  Past
                </Button>
              </div>

              {/* View Mode Toggle */}
              <div className="flex gap-2 bg-muted/50 p-1.5 rounded-xl border border-border/50">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="gap-2 transition-all"
                >
                  <IconLayoutGrid className="h-4 w-4" />
                  <span className="hidden sm:inline">Grid</span>
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="gap-2 transition-all"
                >
                  <IconLayoutList className="h-4 w-4" />
                  <span className="hidden sm:inline">List</span>
                </Button>
              </div>
            </div>

            {/* Session Count & Info */}
            <div className="mb-6">
              {loading ? (
                <div className="flex items-center gap-3">
                  <IconRefresh className="h-6 w-6 animate-spin text-primary" />
                  <div>
                    <Skeleton className="h-8 w-48 mb-2" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                </div>
              ) : (
                <div>
                  <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-3">
                    <span className="text-blue-600 dark:text-blue-400">
                      {filteredRecords.length}
                    </span>
                    <span className="text-2xl text-slate-600 dark:text-slate-400">
                      {filteredRecords.length === 1 ? 'Session' : 'Sessions'}
                    </span>
                  </h2>
                  {!loading && filteredRecords.length > 0 && (
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <IconInfoCircle className="h-4 w-4" />
                      Showing {offset + 1}–{Math.min(offset + limit, count)} of {count} total
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Sessions Display Area */}
            <div className="relative">
              {!userId ? (
                <Card className="border-2 border-dashed border-border shadow-lg">
                  <CardContent className="p-16 text-center">
                    <div className="w-20 h-20 bg-gradient-to-br from-destructive/10 to-destructive/20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
                      <IconCircleX className="h-10 w-10 text-destructive" />
                    </div>
                    <h3 className="text-2xl font-bold mb-3">Authentication Required</h3>
                    <p className="text-muted-foreground max-w-md mx-auto mb-6">
                      You must be logged in to view and join course sessions. Please sign in to continue.
                    </p>
                    <Button asChild size="lg" className="gap-2">
                      <Link href="/login">
                        <IconUser className="h-4 w-4" />
                        Sign In
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {error && (
                    <Card className="border-2 border-destructive/20 bg-destructive/5 mb-6 shadow-lg">
                      <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-destructive/10 rounded-full">
                            <IconAlertCircle className="h-6 w-6 text-destructive" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-destructive mb-1">Error Loading Sessions</h4>
                            <p className="text-sm text-destructive/80">{error}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {!loading && !filteredRecords.length && !error && (
                    <Card className="border-2 border-dashed border-border shadow-lg">
                      <CardContent className="p-16 text-center">
                        <div className="w-20 h-20 bg-gradient-to-br from-muted to-muted/50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
                          <IconCalendarEvent className="h-10 w-10 text-muted-foreground" />
                        </div>
                        <h3 className="text-2xl font-bold mb-3">No Sessions Found</h3>
                        <p className="text-muted-foreground max-w-md mx-auto mb-6">
                          {hasActiveFilters || activeTab !== 'all'
                            ? 'No sessions match your current filters. Try adjusting your search criteria or view all sessions.'
                            : 'There are no sessions available for this course yet. Check back later!'}
                        </p>
                        {(hasActiveFilters || activeTab !== 'all') && (
                          <Button onClick={resetFilters} size="lg" className="gap-2">
                            <IconRefresh className="h-4 w-4" />
                            Clear All Filters & View All
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {loading && (
                    <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6' : 'space-y-4'}>
                      {[1, 2, 3, 4, 5, 6].map((i) => (
                        <Card key={i} className="border-2 animate-pulse shadow-lg">
                          <CardContent className="p-6">
                            <div className="flex items-center gap-3 mb-4">
                              <Skeleton className="h-12 w-12 rounded-full" />
                              <div className="flex-1">
                                <Skeleton className="h-5 w-3/4 mb-2" />
                                <Skeleton className="h-4 w-1/2" />
                              </div>
                            </div>
                            <div className="space-y-3">
                              <Skeleton className="h-4 w-full" />
                              <Skeleton className="h-4 w-2/3" />
                              <Skeleton className="h-11 w-full mt-6" />
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}

                  {!loading && filteredRecords.length > 0 && (
                    <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6' : 'space-y-4'}>
                      {filteredRecords.map((session) => {
                        const isLive = session.status === 'live'
                        const isCompleted = session.status === 'completed'
                        const isScheduled = session.status === 'scheduled'
                        const isCancelled = session.status === 'cancelled'
                        const sessionDate = session.created_at ? new Date(session.created_at) : null
                        const now = new Date()
                        const isUpcoming = sessionDate && sessionDate > now && (isScheduled || isLive)
                        const timeUntil = sessionDate ? sessionDate - now : 0
                        const isStartingSoon = isUpcoming && timeUntil < 60 * 60 * 1000 // Less than 1 hour

                        return (
                          <Card
                            key={session.id}
                            className={`
                              group relative border transition-all duration-300 overflow-hidden hover:shadow-lg
                              ${isLive 
                                ? 'border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20' 
                                : isStartingSoon
                                ? 'border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20'
                                : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                              }
                            `}
                          >
                            {/* Live/Starting Soon Banner */}
                            {isLive && (
                              <div className="absolute top-0 left-0 right-0 bg-red-600 text-white px-4 py-2 text-xs font-bold flex items-center justify-center gap-2 z-10">
                                <span className="relative flex h-2 w-2">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                                </span>
                                LIVE SESSION IN PROGRESS
                              </div>
                            )}
                            
                            {!isLive && isStartingSoon && (
                              <div className="absolute top-0 left-0 right-0 bg-amber-600 text-white px-4 py-2 text-xs font-bold flex items-center justify-center gap-2 z-10">
                                <IconBolt className="h-4 w-4 animate-pulse" />
                                STARTING SOON
                                {sessionDate && <CountdownTimer targetDate={sessionDate} />}
                              </div>
                            )}

                            <CardContent className={`p-6 ${isLive || isStartingSoon ? 'pt-16' : ''}`}>
                              {/* Session Header */}
                              <div className="flex items-start gap-4 mb-5">
                                {/* Session Icon */}
                                <div className={`
                                  shrink-0 p-3 rounded-lg border shadow-sm
                                  ${isLive 
                                    ? 'bg-red-100 dark:bg-red-900/30 border-red-200 dark:border-red-800' 
                                    : isStartingSoon
                                    ? 'bg-amber-100 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800'
                                    : isCompleted
                                    ? 'bg-green-100 dark:bg-green-900/30 border-green-200 dark:border-green-800'
                                    : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                                  }
                                `}>
                                  {isLive ? (
                                    <IconCircleDot className="h-6 w-6 text-red-600 dark:text-red-400 animate-pulse" />
                                  ) : isCompleted ? (
                                    <IconCircleCheck className="h-6 w-6 text-green-600 dark:text-green-400" />
                                  ) : (
                                    <IconVideo className="h-6 w-6 text-slate-600 dark:text-slate-400" />
                                  )}
                                </div>

                                {/* Session Title & Status */}
                                <div className="flex-1 min-w-0">
                                  <h3 className="text-lg font-bold mb-2 line-clamp-2 text-foreground group-hover:text-primary transition-colors">
                                    {session.title || 'Untitled Session'}
                                  </h3>
                                  <div className="flex items-center gap-2">
                                    <Badge 
                                      variant={
                                        isLive ? 'destructive' : 
                                        isCompleted ? 'default' : 
                                        isScheduled ? 'default' : 'outline'
                                      }
                                      className="text-xs font-medium gap-1.5"
                                    >
                                      {getStatusIcon(session.status)}
                                      <span className="capitalize">{session.status}</span>
                                    </Badge>
                                    {isUpcoming && !isLive && (
                                      <Badge variant="outline" className="text-xs gap-1.5 border-amber-300 text-amber-700 dark:text-amber-400">
                                        <IconClock className="h-3 w-3" />
                                        {getRelativeTime(session.created_at)}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Session Details */}
                              <div className="space-y-3 mb-6">
                                {/* Date & Time */}
                                {sessionDate && (
                                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                    <div className="p-2 bg-muted/50 rounded-lg">
                                      <IconCalendarTime className="h-4 w-4" />
                                    </div>
                                    <div>
                                      <p className="font-medium text-foreground">
                                        {sessionDate.toLocaleDateString('en-US', {
                                          weekday: 'long',
                                          year: 'numeric',
                                          month: 'long',
                                          day: 'numeric'
                                        })}
                                      </p>
                                      <p className="text-xs">
                                        {sessionDate.toLocaleTimeString('en-US', {
                                          hour: '2-digit',
                                          minute: '2-digit'
                                        })}
                                      </p>
                                    </div>
                                  </div>
                                )}

                                {/* Additional Info - Real Data */}
                                <div className="flex items-center gap-2 flex-wrap text-xs">
                                  {/* Duration from API */}
                                  {session.duration && (
                                    <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-muted/50 rounded-lg">
                                      <IconClock className="h-3.5 w-3.5 text-primary" />
                                      <span>Duration: {session.duration} min</span>
                                    </div>
                                  )}

                                  {/* Recording Available */}
                                  {(isCompleted || session.recording_available) && session.recording_url && (
                                    <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400 rounded-lg">
                                      <IconPhotoVideo className="h-3.5 w-3.5" />
                                      <span>Recording Available</span>
                                    </div>
                                  )}

                                  {/* Auto Record Indicator */}
                                  {session.auto_record && !isCompleted && (
                                    <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 rounded-lg">
                                      <IconPhotoVideo className="h-3.5 w-3.5" />
                                      <span>Auto-Recording</span>
                                    </div>
                                  )}

                                  {/* Course Teacher */}
                                  {session.course_teacher && (
                                    <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-purple-100 dark:bg-purple-950/30 text-purple-700 dark:text-purple-400 rounded-lg">
                                      <IconSchool className="h-3.5 w-3.5" />
                                      <span>Instructor: {session.course_teacher}</span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Action Buttons */}
                              <div className="space-y-2">
                                {isLive ? (
                                  <>
                                    <Button
                                      className="w-full gap-2 h-12 font-semibold bg-red-500 hover:bg-red-600 text-white disabled:opacity-70"
                                      onClick={() => handleJoinSession(session.id)}
                                      disabled={joiningSessionId === session.id}
                                    >
                                      {joiningSessionId === session.id ? (
                                        <>
                                          <IconRefresh className="h-5 w-5 animate-spin" />
                                          Joining Session...
                                        </>
                                      ) : (
                                        <>
                                          <IconPlayerPlay className="h-5 w-5" />
                                          Join Live Session Now
                                          <span className="ml-2 relative flex h-2.5 w-2.5">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
                                          </span>
                                        </>
                                      )}
                                    </Button>
                                    <Button
                                      variant="outline"
                                      className="w-full gap-2 h-10 font-medium"
                                      onClick={() => {
                                        setSelectedSessionForResources(session)
                                        setResourcesDialogOpen(true)
                                      }}
                                    >
                                      <IconFolderOpen className="h-4 w-4" />
                                      View Resources
                                    </Button>
                                  </>
                                ) : isScheduled && isUpcoming ? (
                                  <>
                                    <Button 
                                      disabled 
                                      variant="outline"
                                      className="w-full gap-2 h-12 font-semibold border-2 border-slate-200 dark:border-slate-700"
                                    >
                                      <IconCalendarEvent className="h-5 w-5" />
                                      Scheduled for {getRelativeTime(session.created_at)}
                                    </Button>
                                    <Button
                                      variant="outline"
                                      className="w-full gap-2 h-10 font-medium"
                                      onClick={() => {
                                        setSelectedSessionForResources(session)
                                        setResourcesDialogOpen(true)
                                      }}
                                    >
                                      <IconFolderOpen className="h-4 w-4" />
                                      View Resources
                                    </Button>
                                  </>
                                ) : isCompleted ? (
                                  <>
                                    <div className="flex gap-2">
                                      {session.recording_url ? (
                                        <>
                                          <Button 
                                            asChild
                                            variant="outline"
                                            className="flex-1 gap-2 h-12 font-semibold border-2 border-slate-200 dark:border-slate-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-300 dark:hover:border-blue-600 group/btn"
                                          >
                                            <a href={session.recording_url} target="_blank" rel="noopener noreferrer">
                                              <IconPhotoVideo className="h-5 w-5 group-hover/btn:scale-110 transition-transform" />
                                              View Recording
                                            </a>
                                          </Button>
                                          <Button 
                                            asChild
                                            variant="outline"
                                            size="icon"
                                            className="h-12 w-12 border-2 border-slate-200 dark:border-slate-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-300 dark:hover:border-blue-600"
                                            title="Download Recording"
                                          >
                                            <a href={session.recording_url} download>
                                              <IconDownload className="h-5 w-5" />
                                            </a>
                                          </Button>
                                        </>
                                      ) : (
                                        <Button 
                                          disabled
                                          variant="outline"
                                          className="w-full gap-2 h-12 font-semibold border-2 border-slate-200 dark:border-slate-700"
                                        >
                                          <IconPhotoVideo className="h-5 w-5" />
                                          Recording Not Available
                                        </Button>
                                      )}
                                    </div>
                                    <Button
                                      variant="outline"
                                      className="w-full gap-2 h-10 font-medium"
                                      onClick={() => {
                                        setSelectedSessionForResources(session)
                                        setResourcesDialogOpen(true)
                                      }}
                                    >
                                      <IconFolderOpen className="h-4 w-4" />
                                      View Resources
                                    </Button>
                                  </>
                                ) : isCancelled ? (
                                  <Button 
                                    disabled 
                                    variant="outline"
                                    className="w-full gap-2 h-12 font-semibold border-2 border-slate-200 dark:border-slate-700 opacity-60"
                                  >
                                    <IconCircleX className="h-5 w-5" />
                                    Session Cancelled
                                  </Button>
                                ) : (
                                  <>
                                    <Button 
                                      disabled 
                                      variant="outline"
                                      className="w-full gap-2 h-12 font-semibold border-2 border-slate-200 dark:border-slate-700"
                                    >
                                      <IconVideo className="h-5 w-5" />
                                      Not Available
                                    </Button>
                                    <Button
                                      variant="outline"
                                      className="w-full gap-2 h-10 font-medium"
                                      onClick={() => {
                                        setSelectedSessionForResources(session)
                                        setResourcesDialogOpen(true)
                                      }}
                                    >
                                      <IconFolderOpen className="h-4 w-4" />
                                      View Resources
                                    </Button>
                                  </>
                                )}

                              </div>
                            </CardContent>
                          </Card>
                        )
                      })}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Enhanced Pagination */}
            {userId && !loading && filteredRecords.length > 0 && (
              <div className="mt-10 pt-8 border-t-2 border-border">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="text-sm text-muted-foreground font-medium">
                      Page <span className="text-foreground font-bold">{Math.floor(offset / limit) + 1}</span> of{' '}
                      <span className="text-foreground font-bold">{Math.ceil(count / limit)}</span>
                    </div>
                    {/* Items per page */}
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground font-medium">Items per page:</span>
                      <Select value={String(limit)} onValueChange={(value) => {
                        setLimit(Number(value));
                        setOffset(0);
                      }}>
                        <SelectTrigger className="w-[80px] h-8 rounded-lg border-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="6">6</SelectItem>
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
                      onClick={() => {
                        if (!prevUrl) return
                        fetchSessions(prevUrl)
                        setOffset(Math.max(0, offset - limit))
                        window.scrollTo({ top: 0, behavior: 'smooth' })
                      }}
                      className="rounded-xl font-semibold min-w-[120px]"
                    >
                      ← Previous
                    </Button>
                    <div className="hidden sm:flex items-center gap-1">
                      {count > limit && Array.from({ length: Math.min(5, Math.ceil(count / limit)) }, (_, i) => {
                        const pageNum = i + 1;
                        return (
                          <Button
                            key={pageNum}
                            variant={Math.floor(offset / limit) + 1 === pageNum ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => {
                              const newOffset = (pageNum - 1) * limit;
                              setOffset(newOffset);
                              fetchSessions();
                            }}
                            className="w-8 h-8 rounded-lg"
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
                      onClick={() => {
                        if (!nextUrl) return
                        fetchSessions(nextUrl)
                        setOffset(offset + limit)
                        window.scrollTo({ top: 0, behavior: 'smooth' })
                      }}
                      className="rounded-xl font-semibold min-w-[120px]"
                    >
                      Next →
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Resources Dialog */}
      <Dialog open={resourcesDialogOpen} onOpenChange={setResourcesDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <IconFolderOpen className="h-5 w-5 text-primary" />
              Session Resources
            </DialogTitle>
            <DialogDescription>
              {selectedSessionForResources?.title && (
                <span className="font-medium text-foreground">
                  {selectedSessionForResources.title}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto">
            {selectedSessionForResources && (
              <ResourceList 
                sessionId={selectedSessionForResources.id} 
                canManage={false}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
