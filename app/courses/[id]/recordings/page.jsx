'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import api from '@/lib/api'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  IconArrowLeft, 
  IconCalendar, 
  IconClock, 
  IconVideo, 
  IconFilter,
  IconSearch,
  IconX,
  IconRefresh,
  IconPlayerPlay,
  IconSparkles,
  IconLayoutGrid,
  IconLayoutList,
  IconDownload,
  IconEye,
  IconTrendingUp,
  IconFileText,
  IconCircleX,
  IconCalendarEvent
} from '@tabler/icons-react'

function toArray(v) {
  if (Array.isArray(v)) return v
  if (v && Array.isArray((v).results)) return (v).results
  return []
}

export default function CourseRecordingsPage() {
  // Get current user id from JWT if possible, fallback to localStorage
  let userId = null
  try {
    if (typeof window !== 'undefined') {
      const authTokens = localStorage.getItem('authTokens')
      if (authTokens) {
        try {
          const tokens = JSON.parse(authTokens)
          if (tokens.access) {
            // Decode JWT to get user id
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

  const [records, setRecords] = useState([])
  const [count, setCount] = useState(0)
  const [nextUrl, setNextUrl] = useState(null)
  const [prevUrl, setPrevUrl] = useState(null)

  // filters
  const [dateFrom, setDateFrom] = useState(searchParams.get('date_from') ?? undefined)
  const [dateTo, setDateTo] = useState(searchParams.get('date_to') ?? undefined)
  const [title, setTitle] = useState(searchParams.get('title') ?? '')

  // pagination
  const [limit, setLimit] = useState(Number(searchParams.get('limit') ?? 10))
  const [offset, setOffset] = useState(Number(searchParams.get('offset') ?? 0))

  const queryString = useMemo(() => {
    const q = new URLSearchParams()
    q.set('course', String(courseId))
    q.set('ordering', '-created_at')
    q.set('limit', String(limit))
    q.set('offset', String(offset))
    if (dateFrom) q.set('date_from', dateFrom)
    if (dateTo) q.set('date_to', dateTo)
    if (title) q.set('title', title)
    return q.toString()
  }, [courseId, dateFrom, dateTo, title, limit, offset])

  const fetchRecordings = async (fullUrl) => {
    if (!courseId) return
    try {
      setLoading(true)
      setError(null)

      const url = fullUrl ? fullUrl : `course/recording/?${queryString}`
      const res = await api.get(url)
      const data = res.data

      setRecords(toArray(data))
      setCount(data.count ?? toArray(data).length)
      setNextUrl(data.next ?? null)
      setPrevUrl(data.previous ?? null)
    } catch (e) {
      console.error(e)
      setError('Failed to load recordings.')
      setRecords([])
      setCount(0)
      setNextUrl(null)
      setPrevUrl(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRecordings()
    // reflect filters in URL
    const q = new URLSearchParams()
    if (dateFrom) q.set('date_from', dateFrom)
    if (dateTo) q.set('date_to', dateTo)
    if (title) q.set('title', title)
    q.set('limit', String(limit))
    q.set('offset', String(offset))
    const qs = q.toString()
    const base = `/courses/${courseId}/recordings`
    router.replace(qs ? `${base}?${qs}` : base)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryString])

  const resetFilters = () => {
    setDateFrom(undefined)
    setDateTo(undefined)
    setTitle('')
    setOffset(0)
  }

  const hasActiveFilters = dateFrom || dateTo || title

  // Calculate recording stats
  const recordingStats = useMemo(() => {
    const stats = {
      total: count,
      recent: 0,
      withSlides: 0,
      available: 0
    }
    records.forEach(r => {
      // Recent: within last 7 days
      if (r.created_at) {
        const daysDiff = Math.floor((Date.now() - new Date(r.created_at).getTime()) / (1000 * 60 * 60 * 24))
        if (daysDiff <= 7) stats.recent++
      }
      if (r.slides) stats.withSlides++
      if (r.video_url) stats.available++
    })
    return stats
  }, [records, count])

  const [viewMode, setViewMode] = useState('grid')

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Header with Enhanced Animated Background and Recording-Specific Graphics */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-white to-blue-50/30 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 border-b">
        {/* Subtle professional pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#f8fafc_1px,transparent_1px),linear-gradient(to_bottom,#f8fafc_1px,transparent_1px)] bg-[size:24px_24px] dark:bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)]"></div>
        
        {/* Spectacular Recording Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Animated gradient waves */}
          <div className="absolute inset-0">
            <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-red-400/20 via-pink-400/15 to-rose-400/20 dark:from-red-600/10 dark:via-pink-600/8 dark:to-rose-600/10 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-gradient-to-bl from-purple-400/20 via-violet-400/15 to-indigo-400/20 dark:from-purple-600/10 dark:via-violet-600/8 dark:to-indigo-600/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
            <div className="absolute -bottom-1/2 -left-1/2 w-full h-full bg-gradient-to-tr from-blue-400/20 via-cyan-400/15 to-sky-400/20 dark:from-blue-600/10 dark:via-cyan-600/8 dark:to-sky-600/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
            <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-orange-400/20 via-amber-400/15 to-yellow-400/20 dark:from-orange-600/10 dark:via-amber-600/8 dark:to-yellow-600/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '3s'}}></div>
          </div>
          
          {/* Floating recording-specific elements */}
          
          {/* 1. Video Player with Progress Bar */}
          <div className="absolute top-16 right-16 w-36 h-28 bg-gradient-to-br from-red-100/90 via-rose-100/70 to-pink-100/60 dark:from-red-900/40 dark:via-rose-900/30 dark:to-pink-900/20 backdrop-blur-md rounded-2xl border border-red-300/60 dark:border-red-700/40 shadow-2xl transform rotate-12 hover:rotate-6 transition-all duration-1000 opacity-80">
            <div className="p-3 h-full flex flex-col">
              {/* Video player screen */}
              <div className="flex-1 bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg relative overflow-hidden mb-2">
                {/* Play button overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-8 h-8 bg-white/90 rounded-full flex items-center justify-center shadow-lg">
                    <div className="w-0 h-0 border-l-[10px] border-l-red-500 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent ml-1"></div>
                  </div>
                </div>
                {/* Video scan line effect */}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/10 to-transparent animate-pulse"></div>
              </div>
              {/* Progress bar */}
              <div className="space-y-1">
                <div className="w-full h-1 bg-gray-300 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div className="w-2/3 h-full bg-gradient-to-r from-red-500 to-pink-500 rounded-full"></div>
                </div>
                <div className="flex justify-between">
                  <div className="text-[8px] font-bold text-red-600 dark:text-red-400">12:34</div>
                  <div className="text-[8px] font-bold text-gray-600 dark:text-gray-400">18:56</div>
                </div>
              </div>
            </div>
          </div>
          
          {/* 2. Recording Timeline/Waveform */}
          <div className="absolute top-32 left-12 w-36 h-24 bg-gradient-to-br from-purple-100/90 via-violet-100/70 to-indigo-100/60 dark:from-purple-900/40 dark:via-violet-900/30 dark:to-indigo-900/20 backdrop-blur-md rounded-2xl border border-purple-300/60 dark:border-purple-700/40 shadow-2xl transform -rotate-8 hover:-rotate-4 transition-all duration-1000 opacity-75">
            <div className="p-3 h-full flex flex-col">
              {/* Waveform visualization */}
              <div className="flex-1 flex items-end justify-around gap-0.5 mb-2">
                <div className="w-1 h-8 bg-gradient-to-t from-purple-500 to-violet-400 rounded-full"></div>
                <div className="w-1 h-12 bg-gradient-to-t from-purple-500 to-violet-400 rounded-full"></div>
                <div className="w-1 h-6 bg-gradient-to-t from-purple-500 to-violet-400 rounded-full"></div>
                <div className="w-1 h-10 bg-gradient-to-t from-purple-500 to-violet-400 rounded-full"></div>
                <div className="w-1 h-14 bg-gradient-to-t from-purple-500 to-violet-400 rounded-full"></div>
                <div className="w-1 h-8 bg-gradient-to-t from-purple-500 to-violet-400 rounded-full"></div>
                <div className="w-1 h-11 bg-gradient-to-t from-purple-500 to-violet-400 rounded-full"></div>
                <div className="w-1 h-7 bg-gradient-to-t from-purple-500 to-violet-400 rounded-full"></div>
                <div className="w-1 h-13 bg-gradient-to-t from-purple-500 to-violet-400 rounded-full"></div>
              </div>
              {/* Timeline indicator */}
              <div className="h-0.5 bg-purple-400/60 rounded-full"></div>
            </div>
          </div>
          
          {/* 3. Download/Cloud Storage */}
          <div className="absolute bottom-28 right-24 w-28 h-28 bg-gradient-to-br from-blue-100/90 via-cyan-100/70 to-sky-100/60 dark:from-blue-900/40 dark:via-cyan-900/30 dark:to-sky-900/20 backdrop-blur-md rounded-2xl border border-blue-300/60 dark:border-blue-700/40 shadow-2xl transform rotate-8 hover:rotate-4 transition-all duration-1000 opacity-70">
            <div className="p-3 h-full flex flex-col items-center justify-center">
              {/* Cloud icon */}
              <div className="relative mb-2">
                <div className="w-16 h-10 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-full relative">
                  <div className="absolute -top-2 left-2 w-8 h-8 bg-gradient-to-br from-blue-300 to-cyan-400 rounded-full"></div>
                  <div className="absolute -top-1 right-2 w-6 h-6 bg-gradient-to-br from-blue-300 to-cyan-400 rounded-full"></div>
                </div>
                {/* Download arrow */}
                <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2">
                  <div className="w-1 h-4 bg-white rounded-full"></div>
                  <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[6px] border-t-white"></div>
                </div>
              </div>
              <div className="text-[9px] font-bold text-blue-600 dark:text-blue-400">HD</div>
            </div>
          </div>
          
          {/* 4. Slides/Presentation Stack */}
          <div className="absolute top-48 left-1/4 w-28 h-28 bg-gradient-to-br from-orange-100/90 via-amber-100/70 to-yellow-100/60 dark:from-orange-900/40 dark:via-amber-900/30 dark:to-yellow-900/20 backdrop-blur-md rounded-2xl border border-orange-300/60 dark:border-orange-700/40 shadow-2xl transform -rotate-4 hover:-rotate-2 transition-all duration-1000 opacity-65">
            <div className="p-3 h-full flex items-center justify-center">
              {/* Presentation slides stack */}
              <div className="relative w-16 h-20">
                <div className="absolute bottom-0 left-0 w-14 h-18 bg-gradient-to-br from-orange-400 to-amber-400 rounded-lg shadow-md">
                  {/* Slide content lines */}
                  <div className="p-2 space-y-1">
                    <div className="w-full h-1 bg-white/50 rounded-full"></div>
                    <div className="w-3/4 h-1 bg-white/40 rounded-full"></div>
                    <div className="w-full h-1 bg-white/40 rounded-full"></div>
                    {/* Small chart/graph representation */}
                    <div className="flex items-end gap-0.5 mt-2">
                      <div className="w-1 h-2 bg-white/60 rounded-sm"></div>
                      <div className="w-1 h-3 bg-white/60 rounded-sm"></div>
                      <div className="w-1 h-2 bg-white/60 rounded-sm"></div>
                    </div>
                  </div>
                </div>
                <div className="absolute bottom-1 left-1 w-14 h-18 bg-gradient-to-br from-amber-400 to-yellow-400 rounded-lg shadow-md opacity-70"></div>
                <div className="absolute bottom-2 left-2 w-14 h-18 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-lg shadow-md opacity-50"></div>
              </div>
            </div>
          </div>
          
          {/* 5. Recording REC Indicator */}
          <div className="absolute bottom-40 left-1/3 w-32 h-24 bg-gradient-to-br from-red-100/90 via-rose-100/70 to-pink-100/60 dark:from-red-900/40 dark:via-rose-900/30 dark:to-pink-900/20 backdrop-blur-md rounded-2xl border border-red-300/60 dark:border-red-700/40 shadow-2xl transform rotate-6 hover:rotate-3 transition-all duration-1000 opacity-70">
            <div className="p-3 h-full flex items-center gap-2">
              {/* REC indicator */}
              <div className="relative flex items-center gap-2">
                <div className="w-5 h-5 bg-red-600 rounded-full animate-pulse shadow-lg shadow-red-500/50"></div>
                <div className="absolute inset-0 w-5 h-5 bg-red-500 rounded-full animate-ping"></div>
              </div>
              <div className="flex-1">
                <div className="text-sm font-black text-red-600 dark:text-red-400">REC</div>
                <div className="text-[10px] font-bold text-red-500 dark:text-red-400 font-mono">00:45:32</div>
              </div>
            </div>
          </div>
          
          {/* 6. Quality/Resolution Badge */}
          <div className="absolute top-1/3 right-1/4 w-24 h-24 bg-gradient-to-br from-green-100/90 via-emerald-100/70 to-teal-100/60 dark:from-green-900/40 dark:via-emerald-900/30 dark:to-teal-900/20 backdrop-blur-md rounded-full border-4 border-green-300/60 dark:border-green-700/40 shadow-2xl transform -rotate-3 hover:-rotate-1 transition-all duration-1000 opacity-80">
            <div className="h-full flex flex-col items-center justify-center">
              {/* HD badge */}
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center shadow-lg">
                  <div className="text-white font-black text-xs">1080p</div>
                </div>
                {/* Quality indicator dots */}
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full"></div>
                <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-emerald-400 rounded-full"></div>
              </div>
            </div>
          </div>
          
          {/* Dynamic recording network connections */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{opacity: 0.2}}>
            <defs>
              <linearGradient id="recordingPath1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ef4444" stopOpacity="0.6"/>
                <stop offset="50%" stopColor="#ec4899" stopOpacity="0.4"/>
                <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.6"/>
              </linearGradient>
              <linearGradient id="recordingPath2" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.6"/>
                <stop offset="50%" stopColor="#06b6d4" stopOpacity="0.4"/>
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.6"/>
              </linearGradient>
              <linearGradient id="recordingPath3" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.6"/>
                <stop offset="50%" stopColor="#f97316" stopOpacity="0.4"/>
                <stop offset="100%" stopColor="#ef4444" stopOpacity="0.6"/>
              </linearGradient>
            </defs>
            
            {/* Recording data flow paths */}
            <path d="M 150 180 Q 350 120 550 200 Q 750 280 900 240" stroke="url(#recordingPath1)" strokeWidth="3" fill="none" className="animate-pulse"/>
            <path d="M 200 220 Q 400 180 600 200" stroke="url(#recordingPath2)" strokeWidth="2" fill="none" className="animate-pulse" style={{animationDelay: '0.5s'}}/>
            <path d="M 300 260 Q 500 220 700 240" stroke="url(#recordingPath3)" strokeWidth="2" fill="none" className="animate-pulse" style={{animationDelay: '1s'}}/>
            
            {/* Recording points */}
            <circle cx="200" cy="220" r="6" fill="url(#recordingPath1)" className="animate-pulse"/>
            <circle cx="450" cy="190" r="8" fill="url(#recordingPath2)" className="animate-pulse" style={{animationDelay: '0.3s'}}/>
            <circle cx="650" cy="210" r="7" fill="url(#recordingPath3)" className="animate-pulse" style={{animationDelay: '0.7s'}}/>
            <circle cx="850" cy="240" r="6" fill="url(#recordingPath1)" className="animate-pulse" style={{animationDelay: '1.2s'}}/>
            
            {/* Play button symbols */}
            <polygon points="250,150 270,162 250,174" fill="url(#recordingPath1)" className="animate-pulse" style={{animationDelay: '0.8s'}}/>
            <polygon points="550,180 570,192 550,204" fill="url(#recordingPath2)" className="animate-pulse" style={{animationDelay: '1.5s'}}/>
            <polygon points="750,220 770,232 750,244" fill="url(#recordingPath3)" className="animate-pulse" style={{animationDelay: '2s'}}/>
          </svg>
          
          {/* Floating video particles */}
          <div className="absolute top-24 left-1/3 w-3 h-3 bg-gradient-to-br from-red-400 to-pink-400 dark:from-red-500 dark:to-pink-500 rounded-full animate-bounce opacity-60"></div>
          <div className="absolute top-44 right-1/3 w-2 h-2 bg-gradient-to-br from-purple-400 to-violet-400 dark:from-purple-500 dark:to-violet-500 rounded-full animate-bounce opacity-50" style={{animationDelay: '0.5s'}}></div>
          <div className="absolute bottom-36 left-1/4 w-2.5 h-2.5 bg-gradient-to-br from-blue-400 to-cyan-400 dark:from-blue-500 dark:to-cyan-500 rounded-full animate-bounce opacity-55" style={{animationDelay: '1s'}}></div>
          <div className="absolute bottom-24 right-1/4 w-1.5 h-1.5 bg-gradient-to-br from-orange-400 to-amber-400 dark:from-orange-500 dark:to-amber-500 rounded-full animate-bounce opacity-45" style={{animationDelay: '1.5s'}}></div>
          
          {/* Holographic grid overlay */}
          <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]">
            <div className="w-full h-full" style={{
              backgroundImage: `
                radial-gradient(circle at 1px 1px, rgb(239 68 68) 1px, transparent 0),
                radial-gradient(circle at 20px 20px, rgb(139 92 246) 1px, transparent 0),
                radial-gradient(circle at 40px 40px, rgb(59 130 246) 1px, transparent 0)
              `,
              backgroundSize: '60px 60px'
            }}></div>
          </div>
        </div>
        
        <div className="container relative mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 max-w-7xl">
          {/* Back Button */}
          <Button 
            asChild 
            variant="ghost" 
            className="gap-2 mb-6 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all"
          >
            <Link href={`/courses/${courseId}`}>
              <IconArrowLeft className="h-4 w-4" />
              Back to Course
            </Link>
          </Button>

          {/* Header Content */}
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-8">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-primary to-secondary rounded-2xl shadow-lg">
                  <IconVideo className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 dark:text-white tracking-tight">
                    Course Recordings
                  </h1>
                  <p className="text-slate-600 dark:text-slate-300 text-lg mt-1">
                    Watch and review past sessions anytime
                  </p>
                </div>
              </div>
            </div>

            {/* View Toggle */}
            <div className="flex gap-2 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className={viewMode === 'grid' ? '' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}
              >
                <IconLayoutGrid className="h-4 w-4 mr-2" />
                Grid
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className={viewMode === 'list' ? '' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}
              >
                <IconLayoutList className="h-4 w-4 mr-2" />
                List
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 hover:shadow-md transition-all duration-300 group">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg group-hover:scale-110 transition-transform">
                  <IconCalendarEvent className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <span className="text-3xl font-bold text-slate-900 dark:text-white">{recordingStats.total}</span>
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">Total Recordings</p>
            </div>

            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 hover:shadow-md transition-all duration-300 group">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg group-hover:scale-110 transition-transform">
                  <IconSparkles className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <span className="text-3xl font-bold text-slate-900 dark:text-white">{recordingStats.recent}</span>
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">New This Week</p>
            </div>

            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 hover:shadow-md transition-all duration-300 group">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg group-hover:scale-110 transition-transform">
                  <IconFileText className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <span className="text-3xl font-bold text-slate-900 dark:text-white">{recordingStats.withSlides}</span>
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">With Slides</p>
            </div>

            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 hover:shadow-md transition-all duration-300 group">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg group-hover:scale-110 transition-transform">
                  <IconPlayerPlay className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <span className="text-3xl font-bold text-slate-900 dark:text-white">{recordingStats.available}</span>
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">Available Now</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 pt-8 pb-8 max-w-7xl">
        <div className="flex flex-col lg:flex-row gap-6">
          
          {/* Left Sidebar - Filters */}
          <aside className="w-full lg:w-80 shrink-0">
            <div className="lg:sticky lg:top-4 space-y-4">
              {/* Filter Card */}
              <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-gradient-to-br from-primary to-secondary rounded-xl shadow-md">
                        <IconFilter className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-base font-bold text-foreground">
                          Filter Recordings
                        </CardTitle>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Refine your search
                        </p>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-5">
                  {/* Search Bar */}
                  <div className="space-y-2.5">
                    <label className="text-xs font-semibold text-foreground uppercase tracking-wide flex items-center gap-2">
                      <IconSearch className="h-3.5 w-3.5 text-primary" />
                      Search
                    </label>
                    <div className="relative group">
                      <Input
                        placeholder="Type to search..."
                        value={title}
                        onChange={(e) => { setOffset(0); setTitle(e.target.value) }}
                        className="h-11 pl-4 pr-10 border-2 focus:border-primary transition-all duration-200 bg-background"
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

                  <div className="border-t border-border/50" />

                  {/* Date Range Section */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-semibold text-foreground uppercase tracking-wide flex items-center gap-2">
                      <IconCalendar className="h-3.5 w-3.5 text-primary" />
                      Date Range
                    </h4>
                    
                    <div className="space-y-3 pl-5">
                      {/* Date From */}
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-muted-foreground">
                          From
                        </label>
                        <Input
                          type="date"
                          value={dateFrom ?? ''}
                          onChange={(e) => { setOffset(0); setDateFrom(e.target.value || undefined) }}
                          className="h-10 border-2 focus:border-primary transition-all duration-200"
                        />
                      </div>

                      {/* Date To */}
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-muted-foreground">
                          To
                        </label>
                        <Input
                          type="date"
                          value={dateTo ?? ''}
                          onChange={(e) => { setOffset(0); setDateTo(e.target.value || undefined) }}
                          className="h-10 border-2 focus:border-primary transition-all duration-200"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-border/50" />

                  {/* Per Page */}
                  <div className="space-y-2.5">
                    <label className="text-xs font-semibold text-foreground uppercase tracking-wide flex items-center gap-2">
                      <IconLayoutGrid className="h-3.5 w-3.5 text-primary" />
                      Items Per Page
                    </label>
                    <Select value={String(limit)} onValueChange={(v) => { setOffset(0); setLimit(Number(v)) }}>
                      <SelectTrigger className="h-11 border-2 focus:border-primary transition-all duration-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10 recordings</SelectItem>
                        <SelectItem value="20">20 recordings</SelectItem>
                        <SelectItem value="50">50 recordings</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {hasActiveFilters && (
                    <>
                      <div className="border-t border-border/50" />
                      <Button
                        variant="outline"
                        onClick={resetFilters}
                        className="w-full gap-2 h-11 border-2 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-200 font-medium"
                      >
                        <IconRefresh className="h-4 w-4" />
                        Clear All Filters
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Active Filters Summary */}
              {hasActiveFilters && (
                <Card className="border-0 shadow-md bg-primary/5 dark:bg-primary/10">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-2">
                      <IconSparkles className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs font-semibold text-foreground">Active Filters</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {[
                            title && 'Search',
                            dateFrom && 'From Date',
                            dateTo && 'To Date'
                          ].filter(Boolean).join(', ')}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </aside>

          {/* Right Content Area - Recordings List */}
          <main className="flex-1 min-w-0">
            <div>
          {/* List Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              {loading ? (
                <div className="flex items-center gap-3">
                  <IconRefresh className="h-6 w-6 animate-spin text-primary" />
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">Loading Recordings...</h2>
                    <p className="text-sm text-muted-foreground">Please wait</p>
                  </div>
                </div>
              ) : (
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-1">
                    {count} {count === 1 ? 'Recording' : 'Recordings'} Found
                  </h2>
                  {!loading && records.length > 0 && (
                    <p className="text-sm text-muted-foreground">
                      Showing {offset + 1}–{Math.min(offset + limit, count)} of {count}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="relative">
            {!userId ? (
              <Card className="border-2 border-dashed">
                <CardContent className="p-12 text-center">
                  <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <IconCircleX className="h-8 w-8 text-destructive" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Authentication Required</h3>
                  <p className="text-muted-foreground">
                    You must be logged in to view course recordings.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                {error && (
                  <Card className="border-2 border-destructive/20 bg-destructive/5 mb-6">
                    <CardContent className="p-6">
                      <p className="text-destructive flex items-center gap-3">
                        <IconCircleX className="h-5 w-5" />
                        {error}
                      </p>
                    </CardContent>
                  </Card>
                )}

                {!loading && !records.length && !error && (
                  <Card className="border-2 border-dashed">
                    <CardContent className="p-12 text-center">
                      <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                        <IconVideo className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <h3 className="text-xl font-semibold mb-2">No Recordings Found</h3>
                      <p className="text-muted-foreground mb-6">
                        {hasActiveFilters 
                          ? 'No recordings match your current filters. Try adjusting your search criteria.'
                          : 'There are no recordings available for this course yet.'}
                      </p>
                      {hasActiveFilters && (
                        <Button onClick={resetFilters}>
                          Clear All Filters
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                )}

                {loading && (
                  <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
                    {[1, 2, 3].map((i) => (
                      <Card key={i} className="border-2 animate-pulse">
                        <div className="h-48 bg-muted"></div>
                        <CardContent className="p-6">
                          <div className="h-6 bg-muted rounded w-2/3 mb-4"></div>
                          <div className="h-4 bg-muted rounded w-1/2 mb-6"></div>
                          <div className="h-11 bg-muted rounded"></div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {!loading && records.length > 0 && (
                  <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
                    {records.map((r) => {
                      const hasSlides = Boolean(r.slides)
                      const isAvailable = Boolean(r.video_url)
                      const isRecent = r.created_at && Math.floor((Date.now() - new Date(r.created_at).getTime()) / (1000 * 60 * 60 * 24)) <= 7

                      return (
                        <Card
                          key={r.id}
                          className={`
                            group relative border-2 hover:shadow-xl transition-all duration-300 overflow-hidden
                            ${isAvailable ? 'border-border hover:border-primary/50' : 'border-muted bg-muted/30'}
                            ${viewMode === 'list' ? 'hover:scale-[1.01]' : 'hover:scale-105'}
                          `}
                        >
                          {/* New Badge */}
                          {isRecent && (
                            <div className="absolute top-3 right-3 z-10">
                              <Badge className="bg-green-500 text-white border-0 shadow-lg gap-1">
                                <IconSparkles className="h-3 w-3" />
                                New
                              </Badge>
                            </div>
                          )}

                          {/* Video Thumbnail */}
                          <div className="relative bg-gradient-to-br from-primary/20 via-secondary/20 to-primary/20 h-48 flex items-center justify-center border-b">
                            <div className="absolute inset-0 bg-grid-white/5" />
                            <div className="relative rounded-full bg-background/90 backdrop-blur p-6 group-hover:scale-110 transition-transform duration-300 shadow-xl">
                              <IconPlayerPlay className="h-12 w-12 text-primary" />
                            </div>
                            
                            {/* Date Badge */}
                            {r.created_at && (
                              <div className="absolute bottom-3 left-3">
                                <Badge variant="secondary" className="gap-1 bg-background/90 backdrop-blur">
                                  <IconClock className="h-3 w-3" />
                                  {new Date(r.created_at).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric'
                                  })}
                                </Badge>
                              </div>
                            )}

                            {/* Slides Badge */}
                            {hasSlides && (
                              <div className="absolute bottom-3 right-3">
                                <Badge variant="secondary" className="gap-1 bg-primary/90 text-white backdrop-blur">
                                  <IconFileText className="h-3 w-3" />
                                  Slides
                                </Badge>
                              </div>
                            )}
                          </div>

                          <CardContent className="p-6">
                            {/* Header */}
                            <div className="mb-4">
                              <h3 className="text-lg font-semibold mb-2 line-clamp-2 text-foreground group-hover:text-primary transition-colors">
                                {r.title || 'Untitled Recording'}
                              </h3>
                              {r.session_data?.title && (
                                <p className="text-sm text-muted-foreground line-clamp-1 flex items-center gap-2">
                                  <IconVideo className="h-3.5 w-3.5" />
                                  {r.session_data.title}
                                </p>
                              )}
                            </div>

                            {/* Action Buttons */}
                            <div className="space-y-2">
                              {isAvailable ? (
                                <Button
                                  asChild
                                  className="w-full gap-2 h-11 font-medium bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white"
                                >
                                  <a href={r.video_url} target="_blank" rel="noreferrer">
                                    <IconPlayerPlay className="h-4 w-4" />
                                    Watch Recording
                                  </a>
                                </Button>
                              ) : (
                                <Button 
                                  disabled 
                                  variant="secondary"
                                  className="w-full gap-2 h-11 font-medium"
                                >
                                  <IconX className="h-4 w-4" />
                                  Recording Unavailable
                                </Button>
                              )}
                              
                              {/* Download Slides Button */}
                              {hasSlides && (
                                <Button
                                  asChild
                                  variant="outline"
                                  size="sm"
                                  className="w-full gap-2"
                                >
                                  <a href={r.slides} target="_blank" rel="noreferrer" download>
                                    <IconDownload className="h-3.5 w-3.5" />
                                    Download Slides
                                  </a>
                                </Button>
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

          {/* Pagination */}
          {userId && !loading && records.length > 0 && (
            <div className="mt-8 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="text-sm text-muted-foreground">
                Showing <span className="font-semibold">{offset + 1}</span> to{' '}
                <span className="font-semibold">{Math.min(offset + limit, count)}</span> of{' '}
                <span className="font-semibold">{count}</span> recordings
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  disabled={!prevUrl || loading}
                  onClick={() => {
                    if (!prevUrl) return
                    fetchRecordings(prevUrl)
                    setOffset(Math.max(0, offset - limit))
                  }}
                  className="gap-2"
                >
                  <IconArrowLeft className="h-4 w-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  disabled={!nextUrl || loading}
                  onClick={() => {
                    if (!nextUrl) return
                    fetchRecordings(nextUrl)
                    setOffset(offset + limit)
                  }}
                  className="gap-2"
                >
                  Next
                  <IconArrowLeft className="h-4 w-4 rotate-180" />
                </Button>
              </div>
            </div>
          )}
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
