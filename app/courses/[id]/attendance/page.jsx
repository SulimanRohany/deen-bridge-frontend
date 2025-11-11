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
  IconListCheck, 
  IconCalendar, 
  IconClock, 
  IconCheck, 
  IconX, 
  IconFilter, 
  IconRefresh, 
  IconChevronLeft, 
  IconChevronRight,
  IconSearch,
  IconUsers,
  IconChartBar,
  IconSparkles,
  IconCircleCheck,
  IconCircleX,
  IconCalendarEvent,
  IconLayoutGrid
} from '@tabler/icons-react'

function toArray(v) {
  if (Array.isArray(v)) return v
  if (v && Array.isArray((v).results)) return (v).results
  return []
}

export default function CourseAttendancePage() {
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
  const [status, setStatus] = useState(searchParams.get('status') ?? 'all')
  const [title, setTitle] = useState(searchParams.get('title') ?? '')

  // pagination
  const [limit, setLimit] = useState(Number(searchParams.get('limit') ?? 10))
  const [offset, setOffset] = useState(Number(searchParams.get('offset') ?? 0))

  const queryString = useMemo(() => {
    const q = new URLSearchParams()
    if (courseId) q.set('course', String(courseId))
    if (userId) q.set('student', String(userId))
    q.set('ordering', '-created_at')
    q.set('limit', String(limit))
    q.set('offset', String(offset))
    if (dateFrom) q.set('date_from', dateFrom)
    if (dateTo) q.set('date_to', dateTo)
    if (status && status !== 'all') q.set('status', status)
    if (title) q.set('title', title)
    return q.toString()
  }, [courseId, userId, dateFrom, dateTo, status, title, limit, offset])

  const fetchAttendance = async (fullUrl) => {
    if (!courseId || !userId) {
      setLoading(false)
      return
    }
    try {
      setLoading(true)
      setError(null)

      const url = fullUrl
        ? fullUrl
        : `course/attendance/?${queryString}`

      const res = await api.get(url)
      // DRF pagination style:
      const data = res.data
      setRecords(toArray(data))
      setCount(data.count ?? toArray(data).length)
      setNextUrl(data.next ?? null)
      setPrevUrl(data.previous ?? null)
    } catch (e) {
      console.error(e)
      setError('Failed to load attendance.')
      setRecords([])
      setCount(0)
      setNextUrl(null)
      setPrevUrl(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAttendance()
    // reflect filters in URL (nice UX)
    const q = new URLSearchParams()
    if (dateFrom) q.set('date_from', dateFrom)
    if (dateTo) q.set('date_to', dateTo)
    if (status && status !== 'all') q.set('status', status)
    if (title) q.set('title', title)
    q.set('limit', String(limit))
    q.set('offset', String(offset))
    const qs = q.toString()
    const base = `/courses/${courseId}/attendance`
    router.replace(qs ? `${base}?${qs}` : base)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryString]) // triggers when any dependency changes

  const resetFilters = () => {
    setDateFrom(undefined)
    setDateTo(undefined)
    setStatus('all')
    setTitle('')
    setOffset(0)
  }

  // Calculate attendance statistics
  const stats = useMemo(() => {
    const present = records.filter(r => r.status === 'present').length
    const absent = records.filter(r => r.status === 'absent').length
    const attendanceRate = count > 0 ? ((present / count) * 100).toFixed(1) : 0
    return { present, absent, attendanceRate, total: count }
  }, [records, count])

  // Format date and time
  const formatDateTime = (dateString) => {
    if (!dateString) return '—'
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  const formatTime = (dateString) => {
    if (!dateString) return '—'
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  const hasActiveFilters = dateFrom || dateTo || (status && status !== 'all') || title

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Header with Enhanced Animated Background and Attendance-Specific Graphics */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-white to-blue-50/30 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 border-b">
        {/* Subtle professional pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#f8fafc_1px,transparent_1px),linear-gradient(to_bottom,#f8fafc_1px,transparent_1px)] bg-[size:24px_24px] dark:bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)]"></div>
        
        {/* Spectacular Attendance Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Animated gradient waves */}
          <div className="absolute inset-0">
            <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-green-400/20 via-emerald-400/15 to-teal-400/20 dark:from-green-600/10 dark:via-emerald-600/8 dark:to-teal-600/10 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-gradient-to-bl from-blue-400/20 via-indigo-400/15 to-violet-400/20 dark:from-blue-600/10 dark:via-indigo-600/8 dark:to-violet-600/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
            <div className="absolute -bottom-1/2 -left-1/2 w-full h-full bg-gradient-to-tr from-red-400/20 via-rose-400/15 to-pink-400/20 dark:from-red-600/10 dark:via-rose-600/8 dark:to-pink-600/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
            <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-amber-400/20 via-yellow-400/15 to-orange-400/20 dark:from-amber-600/10 dark:via-yellow-600/8 dark:to-orange-600/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '3s'}}></div>
          </div>
          
          {/* Floating attendance-specific elements */}
          
          {/* 1. Calendar with Checkmarks Grid */}
          <div className="absolute top-16 right-16 w-36 h-32 bg-gradient-to-br from-green-100/90 via-emerald-100/70 to-teal-100/60 dark:from-green-900/40 dark:via-emerald-900/30 dark:to-teal-900/20 backdrop-blur-md rounded-2xl border border-green-300/60 dark:border-green-700/40 shadow-2xl transform rotate-12 hover:rotate-6 transition-all duration-1000 opacity-80">
            <div className="p-3 h-full flex flex-col">
              {/* Calendar header */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex gap-0.5">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                </div>
                <div className="text-[8px] font-bold text-green-700 dark:text-green-300">MAR</div>
              </div>
              {/* Calendar grid with attendance marks */}
              <div className="flex-1 grid grid-cols-7 gap-0.5">
                <div className="w-3 h-3 bg-green-500 rounded-sm flex items-center justify-center">
                  <div className="text-white text-[6px]">✓</div>
                </div>
                <div className="w-3 h-3 bg-green-500 rounded-sm flex items-center justify-center">
                  <div className="text-white text-[6px]">✓</div>
                </div>
                <div className="w-3 h-3 bg-red-500 rounded-sm flex items-center justify-center">
                  <div className="text-white text-[6px]">✗</div>
                </div>
                <div className="w-3 h-3 bg-green-500 rounded-sm flex items-center justify-center">
                  <div className="text-white text-[6px]">✓</div>
                </div>
                <div className="w-3 h-3 bg-green-500 rounded-sm flex items-center justify-center">
                  <div className="text-white text-[6px]">✓</div>
                </div>
                <div className="w-3 h-3 bg-green-500 rounded-sm flex items-center justify-center">
                  <div className="text-white text-[6px]">✓</div>
                </div>
                <div className="w-3 h-3 bg-gray-300 dark:bg-gray-600 rounded-sm"></div>
                <div className="w-3 h-3 bg-green-500 rounded-sm flex items-center justify-center">
                  <div className="text-white text-[6px]">✓</div>
                </div>
                <div className="w-3 h-3 bg-red-500 rounded-sm flex items-center justify-center">
                  <div className="text-white text-[6px]">✗</div>
                </div>
                <div className="w-3 h-3 bg-green-500 rounded-sm flex items-center justify-center">
                  <div className="text-white text-[6px]">✓</div>
                </div>
                <div className="w-3 h-3 bg-green-500 rounded-sm flex items-center justify-center">
                  <div className="text-white text-[6px]">✓</div>
                </div>
                <div className="w-3 h-3 bg-gray-300 dark:bg-gray-600 rounded-sm"></div>
                <div className="w-3 h-3 bg-gray-300 dark:bg-gray-600 rounded-sm"></div>
                <div className="w-3 h-3 bg-gray-300 dark:bg-gray-600 rounded-sm"></div>
              </div>
            </div>
          </div>
          
          {/* 2. Circular Attendance Percentage */}
          <div className="absolute top-32 left-12 w-28 h-28 bg-gradient-to-br from-blue-100/90 via-indigo-100/70 to-violet-100/60 dark:from-blue-900/40 dark:via-indigo-900/30 dark:to-violet-900/20 backdrop-blur-md rounded-full border-4 border-blue-300/60 dark:border-blue-700/40 shadow-2xl transform -rotate-8 hover:-rotate-4 transition-all duration-1000 opacity-75">
            <div className="h-full flex flex-col items-center justify-center">
              {/* Circular progress */}
              <div className="relative w-16 h-16">
                <svg className="w-16 h-16 transform -rotate-90">
                  <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="none" className="text-blue-200 dark:text-blue-800" />
                  <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="none" strokeDasharray="176" strokeDashoffset="35" className="text-blue-500" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-black text-blue-600 dark:text-blue-400">80%</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* 3. Check-in/Check-out Time Tracker */}
          <div className="absolute bottom-28 right-24 w-32 h-28 bg-gradient-to-br from-purple-100/90 via-fuchsia-100/70 to-pink-100/60 dark:from-purple-900/40 dark:via-fuchsia-900/30 dark:to-pink-900/20 backdrop-blur-md rounded-2xl border border-purple-300/60 dark:border-purple-700/40 shadow-2xl transform rotate-8 hover:rotate-4 transition-all duration-1000 opacity-70">
            <div className="p-3 h-full flex flex-col justify-between">
              {/* Check-in */}
              <div className="flex items-center gap-2">
                <div className="p-1 bg-green-500 rounded-md">
                  <div className="text-white text-[10px] font-bold">IN</div>
                </div>
                <div className="flex-1">
                  <div className="text-[10px] font-bold text-purple-700 dark:text-purple-300">09:00</div>
                  <div className="h-0.5 bg-purple-400/60 rounded-full"></div>
                </div>
              </div>
              {/* Duration indicator */}
              <div className="flex items-center justify-center">
                <div className="w-1 h-8 bg-gradient-to-b from-green-500 via-purple-500 to-red-500 rounded-full"></div>
              </div>
              {/* Check-out */}
              <div className="flex items-center gap-2">
                <div className="p-1 bg-red-500 rounded-md">
                  <div className="text-white text-[10px] font-bold">OUT</div>
                </div>
                <div className="flex-1">
                  <div className="text-[10px] font-bold text-purple-700 dark:text-purple-300">11:30</div>
                  <div className="h-0.5 bg-purple-400/60 rounded-full"></div>
                </div>
              </div>
            </div>
          </div>
          
          {/* 4. Streak Counter Badge */}
          <div className="absolute top-48 left-1/4 w-28 h-28 bg-gradient-to-br from-orange-100/90 via-amber-100/70 to-yellow-100/60 dark:from-orange-900/40 dark:via-amber-900/30 dark:to-yellow-900/20 backdrop-blur-md rounded-2xl border border-orange-300/60 dark:border-orange-700/40 shadow-2xl transform -rotate-4 hover:-rotate-2 transition-all duration-1000 opacity-65">
            <div className="p-3 h-full flex flex-col items-center justify-center">
              {/* Flame/streak icon */}
              <div className="relative mb-2">
                <div className="w-10 h-12 bg-gradient-to-t from-orange-600 via-amber-500 to-yellow-400 rounded-t-full relative">
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-6 h-8 bg-gradient-to-t from-orange-700 via-amber-600 to-yellow-500 rounded-t-full"></div>
                  <div className="absolute top-1 left-1/2 transform -translate-x-1/2 w-3 h-4 bg-yellow-300 rounded-t-full"></div>
                </div>
              </div>
              <div className="text-center">
                <div className="text-lg font-black text-orange-600 dark:text-orange-400">7</div>
                <div className="text-[8px] font-bold text-orange-600 dark:text-orange-400">DAY STREAK</div>
              </div>
            </div>
          </div>
          
          {/* 5. Present/Absent Status Cards */}
          <div className="absolute bottom-40 left-1/3 w-32 h-24 bg-gradient-to-br from-red-100/90 via-rose-100/70 to-pink-100/60 dark:from-red-900/40 dark:via-rose-900/30 dark:to-pink-900/20 backdrop-blur-md rounded-2xl border border-red-300/60 dark:border-red-700/40 shadow-2xl transform rotate-6 hover:rotate-3 transition-all duration-1000 opacity-70">
            <div className="p-3 h-full flex items-center justify-around">
              {/* Present card */}
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center mb-1">
                  <div className="text-white text-sm font-bold">✓</div>
                </div>
                <div className="text-[8px] font-bold text-green-600 dark:text-green-400">15</div>
              </div>
              {/* Divider */}
              <div className="w-0.5 h-full bg-gray-300 dark:bg-gray-600 rounded-full"></div>
              {/* Absent card */}
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center mb-1">
                  <div className="text-white text-sm font-bold">✗</div>
                </div>
                <div className="text-[8px] font-bold text-red-600 dark:text-red-400">2</div>
              </div>
            </div>
          </div>
          
          {/* 6. Attendance Trophy/Achievement */}
          <div className="absolute top-1/3 right-1/4 w-24 h-28 bg-gradient-to-br from-yellow-100/90 via-amber-100/70 to-orange-100/60 dark:from-yellow-900/40 dark:via-amber-900/30 dark:to-orange-900/20 backdrop-blur-md rounded-2xl border border-yellow-300/60 dark:border-yellow-700/40 shadow-2xl transform -rotate-3 hover:-rotate-1 transition-all duration-1000 opacity-80">
            <div className="p-3 h-full flex flex-col items-center justify-center">
              {/* Trophy icon */}
              <div className="relative mb-2">
                <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-t-lg relative">
                  {/* Trophy handles */}
                  <div className="absolute -left-2 top-1 w-3 h-4 border-2 border-yellow-400 rounded-l-lg"></div>
                  <div className="absolute -right-2 top-1 w-3 h-4 border-2 border-yellow-400 rounded-r-lg"></div>
                  {/* Trophy cup */}
                  <div className="absolute inset-0 bg-gradient-to-b from-yellow-300 to-amber-400 rounded-t-lg"></div>
                </div>
                {/* Trophy base */}
                <div className="w-10 h-2 bg-gradient-to-br from-amber-500 to-yellow-600 rounded-sm"></div>
                <div className="w-12 h-1 bg-gradient-to-br from-amber-600 to-yellow-700 rounded-sm mx-auto"></div>
              </div>
              <div className="text-[8px] font-bold text-yellow-700 dark:text-yellow-300 text-center">PERFECT</div>
            </div>
          </div>
          
          {/* Dynamic attendance network connections */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{opacity: 0.2}}>
            <defs>
              <linearGradient id="attendancePath1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.6"/>
                <stop offset="50%" stopColor="#3b82f6" stopOpacity="0.4"/>
                <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.6"/>
              </linearGradient>
              <linearGradient id="attendancePath2" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ef4444" stopOpacity="0.6"/>
                <stop offset="50%" stopColor="#ec4899" stopOpacity="0.4"/>
                <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.6"/>
              </linearGradient>
              <linearGradient id="attendancePath3" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.6"/>
                <stop offset="50%" stopColor="#8b5cf6" stopOpacity="0.4"/>
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.6"/>
              </linearGradient>
            </defs>
            
            {/* Attendance tracking paths */}
            <path d="M 150 180 Q 350 120 550 200 Q 750 280 900 240" stroke="url(#attendancePath1)" strokeWidth="3" fill="none" className="animate-pulse"/>
            <path d="M 200 220 Q 400 180 600 200" stroke="url(#attendancePath2)" strokeWidth="2" fill="none" className="animate-pulse" style={{animationDelay: '0.5s'}}/>
            <path d="M 300 260 Q 500 220 700 240" stroke="url(#attendancePath3)" strokeWidth="2" fill="none" className="animate-pulse" style={{animationDelay: '1s'}}/>
            
            {/* Attendance checkpoints */}
            <circle cx="200" cy="220" r="6" fill="url(#attendancePath1)" className="animate-pulse"/>
            <circle cx="450" cy="190" r="8" fill="url(#attendancePath2)" className="animate-pulse" style={{animationDelay: '0.3s'}}/>
            <circle cx="650" cy="210" r="7" fill="url(#attendancePath3)" className="animate-pulse" style={{animationDelay: '0.7s'}}/>
            <circle cx="850" cy="240" r="6" fill="url(#attendancePath1)" className="animate-pulse" style={{animationDelay: '1.2s'}}/>
            
            {/* Checkmark symbols */}
            <path d="M 240 145 L 245 150 L 255 140" stroke="url(#attendancePath1)" strokeWidth="2" fill="none" className="animate-pulse" style={{animationDelay: '0.8s'}}/>
            <path d="M 540 175 L 545 180 L 555 170" stroke="url(#attendancePath2)" strokeWidth="2" fill="none" className="animate-pulse" style={{animationDelay: '1.5s'}}/>
            <path d="M 740 215 L 745 220 L 755 210" stroke="url(#attendancePath3)" strokeWidth="2" fill="none" className="animate-pulse" style={{animationDelay: '2s'}}/>
          </svg>
          
          {/* Floating attendance particles */}
          <div className="absolute top-24 left-1/3 w-3 h-3 bg-gradient-to-br from-green-400 to-emerald-400 dark:from-green-500 dark:to-emerald-500 rounded-full animate-bounce opacity-60"></div>
          <div className="absolute top-44 right-1/3 w-2 h-2 bg-gradient-to-br from-blue-400 to-indigo-400 dark:from-blue-500 dark:to-indigo-500 rounded-full animate-bounce opacity-50" style={{animationDelay: '0.5s'}}></div>
          <div className="absolute bottom-36 left-1/4 w-2.5 h-2.5 bg-gradient-to-br from-red-400 to-rose-400 dark:from-red-500 dark:to-rose-500 rounded-full animate-bounce opacity-55" style={{animationDelay: '1s'}}></div>
          <div className="absolute bottom-24 right-1/4 w-1.5 h-1.5 bg-gradient-to-br from-amber-400 to-yellow-400 dark:from-amber-500 dark:to-yellow-500 rounded-full animate-bounce opacity-45" style={{animationDelay: '1.5s'}}></div>
          
          {/* Holographic grid overlay */}
          <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]">
            <div className="w-full h-full" style={{
              backgroundImage: `
                radial-gradient(circle at 1px 1px, rgb(16 185 129) 1px, transparent 0),
                radial-gradient(circle at 20px 20px, rgb(59 130 246) 1px, transparent 0),
                radial-gradient(circle at 40px 40px, rgb(239 68 68) 1px, transparent 0)
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
                  <IconListCheck className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 dark:text-white tracking-tight">
                    Attendance Records
                  </h1>
                  <p className="text-slate-600 dark:text-slate-300 text-lg mt-1">
                    Track and review your course attendance history
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 hover:shadow-md transition-all duration-300 group">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg group-hover:scale-110 transition-transform">
                  <IconCalendarEvent className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <span className="text-3xl font-bold text-slate-900 dark:text-white">{stats.total}</span>
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">Total Sessions</p>
            </div>

            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 hover:shadow-md transition-all duration-300 group">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg group-hover:scale-110 transition-transform">
                  <IconCircleCheck className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <span className="text-3xl font-bold text-slate-900 dark:text-white">{stats.present}</span>
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">Present</p>
            </div>

            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 hover:shadow-md transition-all duration-300 group">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg group-hover:scale-110 transition-transform">
                  <IconCircleX className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
                <span className="text-3xl font-bold text-slate-900 dark:text-white">{stats.absent}</span>
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">Absent</p>
            </div>

            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 hover:shadow-md transition-all duration-300 group">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg group-hover:scale-110 transition-transform">
                  <IconChartBar className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <span className="text-3xl font-bold text-slate-900 dark:text-white">{stats.attendanceRate}%</span>
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">Attendance Rate</p>
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
                          Filter Records
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

                  {/* Status Filter */}
                  <div className="space-y-2.5">
                    <label className="text-xs font-semibold text-foreground uppercase tracking-wide flex items-center gap-2">
                      <IconCircleCheck className="h-3.5 w-3.5 text-primary" />
                      Status
                    </label>
                    <Select value={status} onValueChange={(v) => { setOffset(0); setStatus(v) }}>
                      <SelectTrigger className="h-11 border-2 focus:border-primary transition-all duration-200">
                        <SelectValue placeholder="All Statuses" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="present">✅ Present</SelectItem>
                        <SelectItem value="absent">❌ Absent</SelectItem>
                      </SelectContent>
                    </Select>
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
                        <SelectItem value="10">10 records</SelectItem>
                        <SelectItem value="20">20 records</SelectItem>
                        <SelectItem value="50">50 records</SelectItem>
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
                            dateTo && 'To Date',
                            status !== 'all' && 'Status'
                          ].filter(Boolean).join(', ')}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </aside>

          {/* Right Content Area - Records List */}
          <main className="flex-1 min-w-0">
            <div>
          {/* List Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              {loading ? (
                <div className="flex items-center gap-3">
                  <IconRefresh className="h-6 w-6 animate-spin text-secondary" />
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">Loading Records...</h2>
                    <p className="text-sm text-muted-foreground">Please wait</p>
                  </div>
                </div>
              ) : (
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-1">
                    {count} {count === 1 ? 'Record' : 'Records'} Found
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
                    You must be logged in to view your attendance records.
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
                        <IconListCheck className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <h3 className="text-xl font-semibold mb-2">No Records Found</h3>
                      <p className="text-muted-foreground mb-6">
                        {hasActiveFilters 
                          ? 'No attendance records match your current filters. Try adjusting your search criteria.'
                          : 'You don\'t have any attendance records for this course yet. Your attendance will be tracked when you join live sessions.'}
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
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <Card key={i} className="border-2 animate-pulse">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between mb-4">
                            <div className="h-6 bg-muted rounded w-2/3"></div>
                            <div className="h-5 bg-muted rounded-full w-16"></div>
                          </div>
                          <div className="h-4 bg-muted rounded w-1/2 mb-2"></div>
                          <div className="h-4 bg-muted rounded w-1/3"></div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {!loading && records.length > 0 && (
                  <Card className="border-2 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b bg-muted/50">
                            <th className="text-left p-4 font-semibold text-sm text-foreground">Session</th>
                            <th className="text-left p-4 font-semibold text-sm text-foreground">Status</th>
                            <th className="text-left p-4 font-semibold text-sm text-foreground">Recorded At</th>
                          </tr>
                        </thead>
                        <tbody>
                          {records.map((a, index) => (
                            <tr 
                              key={a.id} 
                              className={`border-b transition-all duration-200 hover:bg-muted/50 ${
                                index % 2 === 0 ? 'bg-background' : 'bg-muted/20'
                              }`}
                            >
                              <td className="p-4">
                                <div className="font-medium text-sm max-w-xs truncate">
                                  {a.session_data?.title ?? 'Untitled Session'}
                                </div>
                              </td>
                              <td className="p-4">
                                {a.status === 'present' ? (
                                  <Badge className="gap-1.5 bg-green-100 text-green-700 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800">
                                    <IconCircleCheck className="h-3 w-3" />
                                    Present
                                  </Badge>
                                ) : (
                                  <Badge variant="destructive" className="gap-1.5">
                                    <IconCircleX className="h-3 w-3" />
                                    Absent
                                  </Badge>
                                )}
                              </td>
                              <td className="p-4">
                                <div className="text-sm text-muted-foreground flex items-center gap-2">
                                  <IconCalendar className="h-4 w-4" />
                                  {formatDateTime(a.created_at)}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Card>
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
                <span className="font-semibold">{count}</span> records
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  disabled={!prevUrl || loading}
                  onClick={() => {
                    if (!prevUrl) return
                    fetchAttendance(prevUrl)
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
                    fetchAttendance(nextUrl)
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
