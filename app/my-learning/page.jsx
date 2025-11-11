'use client'

import { useContext, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import AuthContext from '@/context/AuthContext'
import { enrollmentAPI, courseAPI } from '@/lib/api'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import CoursePlaceholder from '@/components/CoursePlaceholder'
import { convertClassTime, getDayName } from '@/lib/timezone-utils'
import { 
  IconSearch, 
  IconBook2, 
  IconCertificate, 
  IconCalendar,
  IconTrendingUp,
  IconFilter,
  IconSortDescending,
  IconClock,
  IconVideo,
  IconUsers,
  IconAward,
  IconTarget,
  IconChartBar,
  IconPlayerPlay,
  IconStar,
  IconTrophy,
  IconFlame,
  IconClockHour4,
  IconCheck,
  IconArrowRight,
  IconBookmark,
  IconDownload,
  IconShare,
  IconExternalLink,
  IconCalendarEvent,
  IconAlertCircle,
  IconRefresh,
  IconSparkles,
  IconRocket,
  IconBolt,
  IconActivity,
  IconBrain,
  IconGift,
  IconChevronRight
} from '@tabler/icons-react'
import { 
  Search, 
  Filter, 
  Users, 
  DollarSign, 
  BookOpen, 
  Star, 
  X,
  Clock,
  Calendar,
  Video,
  FileText,
  ArrowUpDown,
  CheckCircle2,
  XCircle,
  Radio,
  UserCircle,
  MessageCircle,
  Zap,
  TrendingUp,
  Award,
  Home,
  ChevronRight,
  Eye,
  Target
} from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import Link from 'next/link'

/** ---------- Helpers ---------- */
function toArray(v){
  if (Array.isArray(v)) return v
  if (v && Array.isArray((v).results)) return (v).results
  return []
}

/** Get next session time for a class */
function getNextSessionInfo(classes) {
  if (!classes || classes.length === 0) return null
  
  const now = new Date()
  const currentDay = (now.getDay() + 6) % 7 // Convert Sunday=0 to Monday=0
  const currentTime = now.getHours() * 60 + now.getMinutes() // Current time in minutes
  
  // Find the nearest upcoming session with timezone conversion
  let nearestDaysAway = Infinity
  let nextSession = null
  
  for (const classObj of classes) {
    if (!classObj.is_active) continue
    
    for (const day of classObj.days_of_week || []) {
      // Convert class time from teacher's timezone to student's local timezone
      const converted = convertClassTime(
        classObj.start_time,
        classObj.timezone || 'UTC', // Use UTC if timezone not specified
        day
      )
      
      // Calculate days away using the converted local day
      let daysAway = (converted.localDay - currentDay + 7) % 7
      
      if (daysAway === 0) {
        // Check if time has passed today using converted local time
        const [hours, minutesStr] = converted.localTime.replace(/AM|PM/gi, '').split(':')
        const isPM = /PM/i.test(converted.localTime)
        const hour24 = isPM && parseInt(hours) !== 12 ? parseInt(hours) + 12 : 
                      (!isPM && parseInt(hours) === 12 ? 0 : parseInt(hours))
        const sessionTimeInMinutes = hour24 * 60 + parseInt(minutesStr.trim())
        
        if (currentTime > sessionTimeInMinutes) {
          daysAway = 7 // Next week
        }
      }
      
      if (daysAway < nearestDaysAway) {
        nearestDaysAway = daysAway
        nextSession = {
          ...classObj,
          nextDay: converted.localDay, // Use converted local day
          originalDay: day, // Keep original for reference
          daysAway,
          start_time: converted.localTime, // Use converted time for display
          end_time: classObj.end_time ? convertClassTime(classObj.end_time, classObj.timezone || 'UTC', day).localTime : null,
          isDifferentDay: converted.isDifferentDay, // Flag if timezone conversion changed the day
          timezone_info: converted.timeDifference, // Show timezone difference
          original_timezone: classObj.timezone
        }
      }
    }
  }
  
  return nextSession
}

/** Format days of week */
const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export default function MyLearningPage() {
  const { userData } = useContext(AuthContext)
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [enrollments, setEnrollments] = useState([])
  const [certificates, setCertificates] = useState([])
  const [qCourses, setQCourses] = useState('')
  const [qCerts, setQCerts] = useState('')
  const [sessions, setSessions] = useState([])
  const [sessionsLoading, setSessionsLoading] = useState(false)
  const [sessionsError, setSessionsError] = useState(null)
  const [sortBy, setSortBy] = useState('recent')
  const [filterStatus, setFilterStatus] = useState('all')

  useEffect(() => {
    if (!userData?.id) {
      router.push('/login')
      return
    }
    const load = async () => {
      try {
        setLoading(true)
        setError(null)

        // All enrollments for this student
        const enrRes = await enrollmentAPI.getEnrollments({ student: userData.id })
        const enrsRaw = toArray(enrRes.data)
        const _enrs = enrsRaw.map((e) => ({
          ...e,
          class_data: e?.class_data || e?.class_enrolled,
        }))
        setEnrollments(_enrs)

        // Certificates for this student
        const certRes = await courseAPI.getCertificates({ student: userData.id })
        setCertificates(toArray(certRes.data))

        // Sessions for this student (live/recorded sessions for their enrolled classes)
        setSessionsLoading(true)
        setSessionsError(null)
        // Get all class IDs from enrollments
        const courseIds = _enrs.map(e => e?.class_data?.id).filter(Boolean)
        let allSessions = []
        if (courseIds.length > 0) {
          // For each course, fetch its sessions
          const sessionPromises = courseIds.map(cid =>
            courseAPI.getLiveSessions({ course: cid })
          )
          const sessionResults = await Promise.allSettled(sessionPromises)
          allSessions = sessionResults
            .filter(r => r.status === 'fulfilled')
            .flatMap(r => toArray(r.value.data))
        }
        setSessions(allSessions)
        setSessionsLoading(false)
      } catch (err) {
        console.error(err)
        setError('Failed to load My Learning.')
        setSessionsError('Failed to load sessions.')
        setSessionsLoading(false)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [userData, router])

  // Unique classes built from enrollments (deduped, newest first)
  const allCourses = useMemo(() => {
    const list = toArray(enrollments)
      .map((e) => e?.class_data)
      .filter((c) => !!c)
    const map = new Map()
    list.forEach((c) => map.set(c.id, c))
    return Array.from(map.values()).sort(
      (a, b) =>
        new Date(b?.created_at || 0).getTime() - new Date(a?.created_at || 0).getTime()
    )
  }, [enrollments])

  const filteredCourses = useMemo(() => {
    let filtered = allCourses
    
    // Search filter
    if (qCourses.trim()) {
      const needle = qCourses.toLowerCase()
      filtered = filtered.filter((c) =>
        [c.title, c.description, ...toArray(c.subjects).map((s) => s?.name)]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(needle))
      )
    }
    
    // Sort
    if (sortBy === 'recent') {
      filtered = [...filtered].sort((a, b) => 
        new Date(b?.created_at || 0).getTime() - new Date(a?.created_at || 0).getTime()
      )
    } else if (sortBy === 'oldest') {
      filtered = [...filtered].sort((a, b) => 
        new Date(a?.created_at || 0).getTime() - new Date(b?.created_at || 0).getTime()
      )
    } else if (sortBy === 'name') {
      filtered = [...filtered].sort((a, b) => 
        (a?.title || '').localeCompare(b?.title || '')
      )
    }
    
    return filtered
  }, [allCourses, qCourses, sortBy])

  const filteredCertificates = useMemo(() => {
    if (!qCerts.trim()) return certificates
    const needle = qCerts.toLowerCase()
    return toArray(certificates).filter((c) => {
      const courseTitle = c?.course_data?.title || ''
      const code = c?.certificate_code || ''
      return (
        courseTitle.toLowerCase().includes(needle) ||
        code.toLowerCase().includes(needle)
      )
    })
  }, [certificates, qCerts])

  // Get upcoming sessions (scheduled status, sorted by scheduled_date)
  const upcomingSessions = useMemo(() => {
    return sessions.filter(s => s?.status === 'scheduled')
      .sort((a, b) => {
        const dateA = new Date(a?.scheduled_date || a?.created_at || 0)
        const dateB = new Date(b?.scheduled_date || b?.created_at || 0)
        return dateA.getTime() - dateB.getTime() // Earliest upcoming session first
      })
      .slice(0, 3)
  }, [sessions])

  // Calculate statistics
  const stats = useMemo(() => {
    return {
      totalCourses: allCourses.length,
      totalCertificates: certificates.length,
      totalSessions: sessions.length,
      upcomingSessionsCount: upcomingSessions.length
    }
  }, [allCourses, certificates, sessions, upcomingSessions])

  // Get the most recently accessed course for "Continue Learning"
  const lastAccessedCourse = useMemo(() => {
    if (allCourses.length === 0) return null
    return allCourses[0] // Most recent by default from sorting
  }, [allCourses])

  // Calculate learning streak (mock for now - would need backend support)
  const learningStreak = useMemo(() => {
    return Math.min(enrollments.length * 2, 14) // Mock: 0-14 days
  }, [enrollments])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background via-primary/5 to-background">
        {/* Hero Skeleton */}
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
          <div className="container mx-auto px-4 py-20">
            <div className="max-w-5xl mx-auto space-y-6">
              <div className="animate-pulse space-y-4">
                <div className="h-12 w-96 bg-muted rounded-2xl mx-auto" />
                <div className="h-6 w-[600px] bg-muted rounded-xl mx-auto" />
            </div>
            </div>
          </div>
        </div>
        
        {/* Content Skeleton */}
        <div className="container mx-auto px-4 -mt-8 relative z-20">
          <div className="animate-pulse space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-40 bg-muted rounded-2xl shadow-lg" />
              ))}
            </div>
            
            {/* Quick Actions */}
            <div className="h-48 bg-muted rounded-2xl shadow-lg" />
            
            {/* Tabs */}
            <div className="space-y-6">
              <div className="h-12 w-80 bg-muted rounded-xl" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-[400px] bg-muted rounded-2xl" />
              ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background via-primary/5 to-background flex items-center justify-center p-4">
        <Card className="max-w-md border-0 bg-gradient-to-br from-card via-card to-card/95 shadow-2xl rounded-3xl overflow-hidden">
          <CardContent className="p-12 text-center space-y-6">
            <div className="relative">
              <div className="absolute inset-0 bg-destructive/20 blur-2xl rounded-full"></div>
              <div className="relative w-20 h-20 bg-gradient-to-br from-destructive/20 to-destructive/10 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
                <IconAlertCircle className="h-10 w-10 text-destructive" />
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-bold mb-3 text-foreground">Oops! Something went wrong</h3>
              <p className="text-muted-foreground text-base leading-relaxed">{error}</p>
            </div>
            <Button 
              onClick={() => window.location.reload()} 
              className="w-full h-12 rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              <IconRefresh className="h-5 w-5 mr-2" />
              Try Again
              </Button>
            </CardContent>
          </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Premium Hero Section with Enhanced Graphics */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-white to-blue-50/30 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 border-b">
        {/* Subtle professional pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#f8fafc_1px,transparent_1px),linear-gradient(to_bottom,#f8fafc_1px,transparent_1px)] bg-[size:24px_24px] dark:bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)]"></div>
        
        {/* Spectacular My Learning Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Animated gradient waves */}
          <div className="absolute inset-0">
            <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-violet-400/20 via-purple-400/15 to-fuchsia-400/20 dark:from-violet-600/10 dark:via-purple-600/8 dark:to-fuchsia-600/10 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-gradient-to-bl from-cyan-400/20 via-blue-400/15 to-indigo-400/20 dark:from-cyan-600/10 dark:via-blue-600/8 dark:to-indigo-600/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
            <div className="absolute -bottom-1/2 -left-1/2 w-full h-full bg-gradient-to-tr from-emerald-400/20 via-teal-400/15 to-cyan-400/20 dark:from-emerald-600/10 dark:via-teal-600/8 dark:to-cyan-600/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
            <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-rose-400/20 via-pink-400/15 to-orange-400/20 dark:from-rose-600/10 dark:via-pink-600/8 dark:to-orange-600/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '3s'}}></div>
          </div>
          
          {/* Floating learning-specific elements */}
          
          {/* 1. Learning Progress Dashboard */}
          <div className="absolute top-16 right-16 w-36 h-32 bg-gradient-to-br from-blue-100/90 via-indigo-100/70 to-purple-100/60 dark:from-blue-900/40 dark:via-indigo-900/30 dark:to-purple-900/20 backdrop-blur-md rounded-2xl border border-blue-300/60 dark:border-blue-700/40 shadow-2xl transform rotate-12 hover:rotate-6 transition-all duration-1000 opacity-80">
            <div className="p-3 h-full flex flex-col">
              {/* Progress circles */}
              <div className="flex justify-around mb-2">
                <div className="relative w-8 h-8">
                  <svg className="w-8 h-8 transform -rotate-90">
                    <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="2" fill="none" className="text-blue-200 dark:text-blue-800" />
                    <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="2" fill="none" strokeDasharray="88" strokeDashoffset="22" className="text-blue-500" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-blue-600 dark:text-blue-400">75%</div>
                </div>
                <div className="relative w-8 h-8">
                  <svg className="w-8 h-8 transform -rotate-90">
                    <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="2" fill="none" className="text-green-200 dark:text-green-800" />
                    <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="2" fill="none" strokeDasharray="88" strokeDashoffset="44" className="text-green-500" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-green-600 dark:text-green-400">50%</div>
                </div>
              </div>
              {/* Labels */}
              <div className="flex-1 flex flex-col justify-center gap-1">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div className="text-[8px] font-bold text-blue-700 dark:text-blue-300">Course A</div>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div className="text-[8px] font-bold text-green-700 dark:text-green-300">Course B</div>
                </div>
              </div>
            </div>
          </div>
          
          {/* 2. Book/Learning Stack */}
          <div className="absolute top-32 left-12 w-32 h-28 bg-gradient-to-br from-emerald-100/90 via-teal-100/70 to-cyan-100/60 dark:from-emerald-900/40 dark:via-teal-900/30 dark:to-cyan-900/20 backdrop-blur-md rounded-2xl border border-emerald-300/60 dark:border-emerald-700/40 shadow-2xl transform -rotate-8 hover:-rotate-4 transition-all duration-1000 opacity-75">
            <div className="p-3 h-full flex items-center justify-center">
              {/* Stack of books */}
              <div className="relative w-16 h-20">
                <div className="absolute bottom-0 left-0 w-14 h-4 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-sm transform -rotate-3"></div>
                <div className="absolute bottom-4 left-0 w-14 h-4 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-sm transform rotate-2"></div>
                <div className="absolute bottom-8 left-0 w-14 h-4 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-sm transform -rotate-1"></div>
                <div className="absolute bottom-12 left-0 w-14 h-4 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-sm transform rotate-3"></div>
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center">
                  <div className="text-white text-[10px] font-bold">4</div>
                </div>
              </div>
            </div>
          </div>
          
          {/* 3. Certificate/Trophy Badge */}
          <div className="absolute bottom-28 right-24 w-28 h-28 bg-gradient-to-br from-yellow-100/90 via-amber-100/70 to-orange-100/60 dark:from-yellow-900/40 dark:via-amber-900/30 dark:to-orange-900/20 backdrop-blur-md rounded-full border-4 border-yellow-300/60 dark:border-yellow-700/40 shadow-2xl transform rotate-8 hover:rotate-4 transition-all duration-1000 opacity-70">
            <div className="h-full flex flex-col items-center justify-center">
              {/* Trophy */}
              <div className="relative mb-1">
                <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-t-lg relative">
                  <div className="absolute -left-2 top-1 w-3 h-4 border-2 border-yellow-400 rounded-l-lg"></div>
                  <div className="absolute -right-2 top-1 w-3 h-4 border-2 border-yellow-400 rounded-r-lg"></div>
                  <div className="absolute inset-0 bg-gradient-to-b from-yellow-300 to-amber-400 rounded-t-lg flex items-center justify-center">
                    <div className="text-white text-sm font-bold">2</div>
                  </div>
                </div>
                <div className="w-10 h-2 bg-gradient-to-br from-amber-500 to-yellow-600 rounded-sm"></div>
                <div className="w-12 h-1 bg-gradient-to-br from-amber-600 to-yellow-700 rounded-sm mx-auto"></div>
              </div>
              <div className="text-[8px] font-bold text-yellow-700 dark:text-yellow-300">EARNED</div>
            </div>
          </div>
          
          {/* 4. Learning Streak Flame */}
          <div className="absolute top-48 left-1/4 w-24 h-28 bg-gradient-to-br from-orange-100/90 via-red-100/70 to-pink-100/60 dark:from-orange-900/40 dark:via-red-900/30 dark:to-pink-900/20 backdrop-blur-md rounded-2xl border border-orange-300/60 dark:border-orange-700/40 shadow-2xl transform -rotate-4 hover:-rotate-2 transition-all duration-1000 opacity-65">
            <div className="p-3 h-full flex flex-col items-center justify-center">
              {/* Flame icon */}
              <div className="relative mb-2">
                <div className="w-10 h-12 bg-gradient-to-t from-orange-600 via-amber-500 to-yellow-400 rounded-t-full relative">
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-6 h-8 bg-gradient-to-t from-orange-700 via-amber-600 to-yellow-500 rounded-t-full"></div>
                  <div className="absolute top-1 left-1/2 transform -translate-x-1/2 w-3 h-4 bg-yellow-300 rounded-t-full"></div>
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm font-black text-orange-600 dark:text-orange-400">14</div>
                <div className="text-[7px] font-bold text-orange-600 dark:text-orange-400">DAY STREAK</div>
              </div>
            </div>
          </div>
          
          {/* 5. Video/Session Playlist */}
          <div className="absolute bottom-40 left-1/3 w-32 h-24 bg-gradient-to-br from-purple-100/90 via-fuchsia-100/70 to-pink-100/60 dark:from-purple-900/40 dark:via-fuchsia-900/30 dark:to-pink-900/20 backdrop-blur-md rounded-2xl border border-purple-300/60 dark:border-purple-700/40 shadow-2xl transform rotate-6 hover:rotate-3 transition-all duration-1000 opacity-70">
            <div className="p-3 h-full flex flex-col justify-center gap-1">
              {/* Video items */}
              <div className="flex items-center gap-2">
                <div className="w-6 h-4 bg-gradient-to-r from-purple-500 to-fuchsia-500 rounded flex items-center justify-center">
                  <div className="w-0 h-0 border-l-[6px] border-l-white border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent ml-0.5"></div>
                </div>
                <div className="flex-1 h-0.5 bg-purple-400 rounded-full"></div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-4 bg-gradient-to-r from-fuchsia-500 to-pink-500 rounded flex items-center justify-center">
                  <div className="w-0 h-0 border-l-[6px] border-l-white border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent ml-0.5"></div>
                </div>
                <div className="flex-1 h-0.5 bg-fuchsia-400 rounded-full"></div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-4 bg-gradient-to-r from-pink-500 to-rose-500 rounded flex items-center justify-center">
                  <div className="w-0 h-0 border-l-[6px] border-l-white border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent ml-0.5"></div>
                </div>
                <div className="flex-1 h-0.5 bg-pink-400 rounded-full"></div>
              </div>
            </div>
          </div>
          
          {/* 6. Knowledge Brain/Learning Target */}
          <div className="absolute top-1/3 right-1/4 w-28 h-28 bg-gradient-to-br from-cyan-100/90 via-blue-100/70 to-indigo-100/60 dark:from-cyan-900/40 dark:via-blue-900/30 dark:to-indigo-900/20 backdrop-blur-md rounded-2xl border border-cyan-300/60 dark:border-cyan-700/40 shadow-2xl transform -rotate-3 hover:-rotate-1 transition-all duration-1000 opacity-80">
            <div className="p-3 h-full flex flex-col items-center justify-center">
              {/* Target/Brain icon */}
              <div className="relative">
                <div className="w-12 h-12 rounded-full border-4 border-cyan-500 flex items-center justify-center">
                  <div className="w-8 h-8 rounded-full border-3 border-blue-500 flex items-center justify-center">
                    <div className="w-4 h-4 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500"></div>
                  </div>
                </div>
                {/* Sparks around */}
                <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-yellow-400 rounded-full"></div>
                <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-yellow-400 rounded-full"></div>
                <div className="absolute top-1/2 -left-1 transform -translate-y-1/2 w-2 h-2 bg-yellow-400 rounded-full"></div>
                <div className="absolute top-1/2 -right-1 transform -translate-y-1/2 w-2 h-2 bg-yellow-400 rounded-full"></div>
              </div>
            </div>
          </div>
          
          {/* Dynamic learning path network */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{opacity: 0.2}}>
            <defs>
              <linearGradient id="learningPath1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.6"/>
                <stop offset="50%" stopColor="#8b5cf6" stopOpacity="0.4"/>
                <stop offset="100%" stopColor="#ec4899" stopOpacity="0.6"/>
              </linearGradient>
              <linearGradient id="learningPath2" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.6"/>
                <stop offset="50%" stopColor="#06b6d4" stopOpacity="0.4"/>
                <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.6"/>
              </linearGradient>
              <linearGradient id="learningPath3" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.6"/>
                <stop offset="50%" stopColor="#ef4444" stopOpacity="0.4"/>
                <stop offset="100%" stopColor="#ec4899" stopOpacity="0.6"/>
              </linearGradient>
            </defs>
            
            {/* Learning paths */}
            <path d="M 150 180 Q 350 120 550 200 Q 750 280 900 240" stroke="url(#learningPath1)" strokeWidth="3" fill="none" className="animate-pulse"/>
            <path d="M 200 220 Q 400 180 600 200" stroke="url(#learningPath2)" strokeWidth="2" fill="none" className="animate-pulse" style={{animationDelay: '0.5s'}}/>
            <path d="M 300 260 Q 500 220 700 240" stroke="url(#learningPath3)" strokeWidth="2" fill="none" className="animate-pulse" style={{animationDelay: '1s'}}/>
            
            {/* Learning milestones */}
            <circle cx="200" cy="220" r="6" fill="url(#learningPath1)" className="animate-pulse"/>
            <circle cx="450" cy="190" r="8" fill="url(#learningPath2)" className="animate-pulse" style={{animationDelay: '0.3s'}}/>
            <circle cx="650" cy="210" r="7" fill="url(#learningPath3)" className="animate-pulse" style={{animationDelay: '0.7s'}}/>
            <circle cx="850" cy="240" r="6" fill="url(#learningPath1)" className="animate-pulse" style={{animationDelay: '1.2s'}}/>
            
            {/* Star achievement symbols */}
            <path d="M 250 140 L 253 148 L 261 148 L 255 153 L 257 161 L 250 156 L 243 161 L 245 153 L 239 148 L 247 148 Z" fill="url(#learningPath1)" className="animate-pulse" style={{animationDelay: '0.8s'}}/>
            <path d="M 550 170 L 553 178 L 561 178 L 555 183 L 557 191 L 550 186 L 543 191 L 545 183 L 539 178 L 547 178 Z" fill="url(#learningPath2)" className="animate-pulse" style={{animationDelay: '1.5s'}}/>
            <path d="M 750 210 L 753 218 L 761 218 L 755 223 L 757 231 L 750 226 L 743 231 L 745 223 L 739 218 L 747 218 Z" fill="url(#learningPath3)" className="animate-pulse" style={{animationDelay: '2s'}}/>
          </svg>
          
          {/* Floating learning particles */}
          <div className="absolute top-24 left-1/3 w-3 h-3 bg-gradient-to-br from-blue-400 to-indigo-400 dark:from-blue-500 dark:to-indigo-500 rounded-full animate-bounce opacity-60"></div>
          <div className="absolute top-44 right-1/3 w-2 h-2 bg-gradient-to-br from-purple-400 to-fuchsia-400 dark:from-purple-500 dark:to-fuchsia-500 rounded-full animate-bounce opacity-50" style={{animationDelay: '0.5s'}}></div>
          <div className="absolute bottom-36 left-1/4 w-2.5 h-2.5 bg-gradient-to-br from-emerald-400 to-teal-400 dark:from-emerald-500 dark:to-teal-500 rounded-full animate-bounce opacity-55" style={{animationDelay: '1s'}}></div>
          <div className="absolute bottom-24 right-1/4 w-1.5 h-1.5 bg-gradient-to-br from-orange-400 to-amber-400 dark:from-orange-500 dark:to-amber-500 rounded-full animate-bounce opacity-45" style={{animationDelay: '1.5s'}}></div>
          
          {/* Holographic grid overlay */}
          <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]">
            <div className="w-full h-full" style={{
              backgroundImage: `
                radial-gradient(circle at 1px 1px, rgb(59 130 246) 1px, transparent 0),
                radial-gradient(circle at 20px 20px, rgb(139 92 246) 1px, transparent 0),
                radial-gradient(circle at 40px 40px, rgb(236 72 153) 1px, transparent 0)
              `,
              backgroundSize: '60px 60px'
            }}></div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-16 md:py-20 relative">
          <div className="max-w-5xl mx-auto">
            {/* Welcome Badge */}
            <div className="flex justify-center mb-6">
              <div className="inline-flex items-center gap-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm px-4 py-2 rounded-full border border-gray-200 dark:border-gray-700 shadow-sm">
                <IconSparkles className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Welcome back, {userData?.full_name || userData?.first_name || 'Learner'}!
                </span>
                {learningStreak > 0 && (
                  <>
                    <div className="w-1 h-1 rounded-full bg-gray-400"></div>
                    <IconFlame className="h-4 w-4 text-orange-500" />
                    <span className="text-sm font-bold text-orange-600 dark:text-orange-400">
                      {learningStreak} day streak
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Hero Title */}
            <div className="text-center space-y-4 mb-10">
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-black leading-tight tracking-tight">
                <span className="block text-gray-900 dark:text-white">
                  Your Learning
                </span>
                <span className="block mt-2 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 dark:from-blue-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
                  Dashboard
                </span>
              </h1>
              <p className="text-center text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto font-medium leading-relaxed">
                Track your progress, continue your journey, and achieve your learning goals
            </p>
          </div>

            {/* Quick Action - Continue Learning */}
            {lastAccessedCourse && (
              <div className="flex justify-center">
                <Button asChild size="lg" className="h-14 px-8 rounded-2xl font-bold text-base shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600">
                  <Link href={`/courses/${lastAccessedCourse.id}`} className="gap-3">
                <IconPlayerPlay className="h-5 w-5" />
                Continue Learning
                    <IconArrowRight className="h-5 w-5" />
              </Link>
            </Button>
              </div>
          )}
          </div>
        </div>
        </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 space-y-8 -mt-8 relative z-10">

        {/* Premium Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Courses Card */}
          <Card className="group relative bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-xl transition-all duration-300 overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-blue-600/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
            <CardContent className="p-6 relative">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-xl group-hover:scale-110 transition-transform duration-300">
                  <IconBook2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <Badge variant="secondary" className="text-xs">Active</Badge>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Courses</p>
                <p className="text-4xl font-black text-gray-900 dark:text-white">{stats.totalCourses}</p>
                <p className="text-xs text-muted-foreground">Enrolled programs</p>
              </div>
            </CardContent>
          </Card>

          {/* Certificates Card */}
          <Card className="group relative bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-600 hover:shadow-xl transition-all duration-300 overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-500/10 to-emerald-600/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
            <CardContent className="p-6 relative">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-green-50 dark:bg-green-900/30 rounded-xl group-hover:scale-110 transition-transform duration-300">
                  <IconTrophy className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <Badge variant="secondary" className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">Earned</Badge>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Certificates</p>
                <p className="text-4xl font-black text-gray-900 dark:text-white">{stats.totalCertificates}</p>
                <p className="text-xs text-muted-foreground">Achievements unlocked</p>
              </div>
            </CardContent>
          </Card>

          {/* Total Sessions Card */}
          <Card className="group relative bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600 hover:shadow-xl transition-all duration-300 overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/10 to-pink-600/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
            <CardContent className="p-6 relative">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-purple-50 dark:bg-purple-900/30 rounded-xl group-hover:scale-110 transition-transform duration-300">
                  <IconVideo className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <Badge variant="secondary" className="text-xs">Available</Badge>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Sessions</p>
                <p className="text-4xl font-black text-gray-900 dark:text-white">{stats.totalSessions}</p>
                <p className="text-xs text-muted-foreground">Lessons to watch</p>
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Sessions Card */}
          <Card className="group relative bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 hover:border-orange-300 dark:hover:border-orange-600 hover:shadow-xl transition-all duration-300 overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-500/10 to-red-600/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
            <CardContent className="p-6 relative">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-orange-50 dark:bg-orange-900/30 rounded-xl group-hover:scale-110 transition-transform duration-300">
                  <IconFlame className="h-6 w-6 text-orange-600 dark:text-orange-400 animate-pulse" />
                </div>
                <Badge variant="secondary" className="text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400">This Week</Badge>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Upcoming</p>
                <p className="text-4xl font-black text-gray-900 dark:text-white">{stats.upcomingSessionsCount}</p>
                <p className="text-xs text-muted-foreground">Don't miss out!</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Premium Upcoming Sessions Section */}
        {upcomingSessions.length > 0 && (
          <Card className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-800 dark:via-gray-800 dark:to-gray-800 border-2 border-blue-200 dark:border-blue-800 rounded-2xl shadow-lg">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full blur-3xl"></div>
            <CardHeader className="relative">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-600 dark:bg-blue-500 rounded-xl shadow-lg">
                    <IconCalendarEvent className="h-6 w-6 text-white" />
                </div>
                  <div>
                    <CardTitle className="text-2xl font-bold">Upcoming Live Sessions</CardTitle>
                    <CardDescription className="text-base">Don't miss your scheduled classes this week</CardDescription>
                  </div>
                </div>
                <Badge className="gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white border-0 shadow-md">
                  <IconFlame className="h-4 w-4 animate-pulse" />
                  Next 7 Days
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="space-y-4">
                {upcomingSessions.map((session, idx) => (
                  <div
                    key={session.id}
                    className="group relative flex items-center justify-between p-6 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-600 hover:shadow-xl transition-all duration-300"
                  >
                    {/* Session Number Badge */}
                    <div className="absolute -left-3 -top-3 w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                      <span className="text-white font-bold text-sm">{idx + 1}</span>
                    </div>

                    <div className="flex-1">
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg group-hover:scale-110 transition-transform">
                          <IconVideo className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-lg text-gray-900 dark:text-white mb-1">{session.title}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        {session.class_title || session.class_info?.class_title || 'Course'}
                      </p>
                          <div className="flex items-center flex-wrap gap-4">
                            <div className="flex items-center gap-2 text-sm">
                              <div className="p-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg">
                                <IconCalendar className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                              </div>
                              <span className="font-medium text-gray-700 dark:text-gray-300">
                                {session.scheduled_date 
                                  ? new Date(session.scheduled_date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })
                                  : 'Date TBD'}
                        </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <div className="p-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg">
                                <IconClock className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                              </div>
                              <span className="font-medium text-gray-700 dark:text-gray-300">
                          {session.class_info?.start_time || 'Time TBD'}
                          {session.class_info?.end_time && ` - ${session.class_info.end_time}`}
                        </span>
                      </div>
                    </div>
                        </div>
                      </div>
                    </div>
                    
                    <Button size="lg" className="ml-4 h-12 px-6 rounded-xl font-semibold shadow-md hover:shadow-lg transition-all bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600">
                      <IconExternalLink className="h-5 w-5 mr-2" />
                      Join Session
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Premium Tabs Section */}
        <Tabs defaultValue="courses" className="w-full">
          <TabsList className="grid w-full grid-cols-3 lg:w-[500px] h-14 p-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-md">
            <TabsTrigger value="courses" className="gap-2 rounded-xl font-semibold text-sm data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all">
              <IconBook2 className="h-5 w-5" />
              My Courses
              {stats.totalCourses > 0 && (
                <Badge className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-0">
                  {stats.totalCourses}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="sessions" className="gap-2 rounded-xl font-semibold text-sm data-[state=active]:bg-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all">
              <IconVideo className="h-5 w-5" />
              Sessions
              {stats.totalSessions > 0 && (
                <Badge className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-0">
                  {stats.totalSessions}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="certificates" className="gap-2 rounded-xl font-semibold text-sm data-[state=active]:bg-green-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all">
              <IconAward className="h-5 w-5" />
              Certificates
              {stats.totalCertificates > 0 && (
                <Badge className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-0">
                  {stats.totalCertificates}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* All Classes Tab */}
          <TabsContent value="courses" className="space-y-8 mt-8">

            {allCourses.length ? (
              <>
                {/* Results Count */}
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-blue-50 dark:bg-blue-900/30 rounded-xl">
                      <IconBook2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                    <p className="text-lg font-semibold">
                      <span className="text-2xl font-black text-blue-600 dark:text-blue-400">{allCourses.length}</span>
                      <span className="text-muted-foreground ml-2">enrolled courses</span>
                    </p>
                  </div>
                </div>

                {/* Courses Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {allCourses.map((course) => (
                    <EnhancedCourseCard key={course.id} course={course} />
                  ))}
                </div>
              </>
            ) : (
              <Card className="bg-gradient-to-br from-muted/30 via-muted/20 to-transparent backdrop-blur-sm shadow-xl rounded-3xl border-2 border-dashed border-muted/50">
                <CardContent className="p-16 text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                    <IconBook2 className="h-10 w-10 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3 text-foreground">No courses yet</h3>
                  <p className="text-muted-foreground mb-8 text-lg max-w-md mx-auto">
                    Start your learning journey by enrolling in your first course
                  </p>
                  <Button asChild size="lg" className="h-12 px-8 rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                    <Link href="/courses">
                      <IconSearch className="h-5 w-5 mr-2" />
                      Browse All Classes
                      <IconArrowRight className="h-5 w-5 ml-2" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Sessions Tab */}
          <TabsContent value="sessions" className="space-y-8 mt-8">
            {sessionsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i} className="animate-pulse rounded-2xl">
                    <CardContent className="p-6 space-y-4">
                      <div className="h-5 bg-muted rounded w-3/4" />
                      <div className="h-4 bg-muted rounded w-1/2" />
                      <div className="h-4 bg-muted rounded w-2/3" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : sessionsError ? (
              <Card className="bg-gradient-to-br from-destructive/10 to-destructive/5 border-2 border-destructive/20 rounded-3xl">
                <CardContent className="py-12 text-center">
                  <IconAlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
                  <p className="text-lg font-semibold text-destructive">{sessionsError}</p>
                </CardContent>
              </Card>
            ) : sessions.length > 0 ? (
              <>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-purple-50 dark:bg-purple-900/30 rounded-xl">
                      <IconVideo className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <p className="text-lg font-semibold">
                      <span className="text-2xl font-black text-purple-600 dark:text-purple-400">{sessions.length}</span>
                      <span className="text-muted-foreground ml-2">available sessions</span>
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {sessions.map((session) => (
                  <SessionCard key={session.id} session={session} />
                ))}
              </div>
              </>
            ) : (
              <Card className="bg-gradient-to-br from-muted/30 via-muted/20 to-transparent backdrop-blur-sm shadow-xl rounded-3xl border-2 border-dashed border-muted/50">
                <CardContent className="p-16 text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                    <IconVideo className="h-10 w-10 text-purple-600 dark:text-purple-400" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3 text-foreground">No sessions available yet</h3>
                  <p className="text-muted-foreground text-lg max-w-md mx-auto">
                    Live and recorded sessions will appear here once they are scheduled for your enrolled courses
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Certificates Tab */}
          <TabsContent value="certificates" className="space-y-8 mt-8">

            {certificates.length ? (
              <>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-green-50 dark:bg-green-900/30 rounded-xl">
                      <IconTrophy className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <p className="text-lg font-semibold">
                      <span className="text-2xl font-black text-green-600 dark:text-green-400">{certificates.length}</span>
                      <span className="text-muted-foreground ml-2">earned certificates</span>
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {certificates.map((cert) => (
                  <EnhancedCertificateCard key={cert.id} certificate={cert} />
                ))}
              </div>
              </>
            ) : (
              <Card className="bg-gradient-to-br from-muted/30 via-muted/20 to-transparent backdrop-blur-sm shadow-xl rounded-3xl border-2 border-dashed border-muted/50">
                <CardContent className="p-16 text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                    <IconAward className="h-10 w-10 text-green-600 dark:text-green-400" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3 text-foreground">No certificates yet</h3>
                  <p className="text-muted-foreground mb-8 text-lg max-w-md mx-auto">
                    Complete your courses to earn certificates and showcase your achievements
                  </p>
                  {stats.totalCourses > 0 && (
                    <Button asChild variant="outline" size="lg" className="h-12 px-8 rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                      <Link href="#courses">
                        <IconBook2 className="h-5 w-5 mr-2" />
                        View My Courses
                        <IconArrowRight className="h-5 w-5 ml-2" />
                      </Link>
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

// Enhanced Course Card Component with Premium Design
function EnhancedCourseCard({ course }) {
  const toArray = (v) => {
    if (Array.isArray(v)) return v
    if (v && Array.isArray(v.results)) return v.results
    return []
  }

  const alreadyEnrolled = !!course.is_enrolled
  const seatLeft = course.seat_left ?? 0
  const teachers = (course.teachers || [])
    .map((t) => t.full_name || `${t.first_name ?? ''} ${t.last_name ?? ''}`.trim())
    .filter(Boolean)

  // Get class schedule info (timing is now directly in class object)
  const nextSession = course.is_active ? getNextSessionInfo([course]) : null

  // Get first subject for display
  const primarySubject = toArray(course.subjects)[0]?.name
  const additionalSubjectsCount = toArray(course.subjects).length - 1

  return (
    <Card className="relative flex flex-col h-full overflow-hidden transition-all duration-500 hover:-translate-y-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-2xl shadow-md hover:shadow-xl group">
      {/* Cover Image Section - Premium Placeholder */}
      <Link href={`/courses/${course.id}`} className="block">
        <div className="relative h-52 overflow-hidden rounded-t-2xl bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700">
          {/* Image with error handling */}
          {course.cover_image ? (
            <img 
              src={course.cover_image.startsWith('http') ? course.cover_image : `http://127.0.0.1:8000${course.cover_image}`}
              alt={course.title}
              className="w-full h-full object-cover transition-all duration-500 group-hover:scale-105"
              onError={(e) => {
                console.log('Image failed to load:', course.cover_image);
                e.target.style.display = 'none';
                e.target.parentElement.querySelector('.placeholder-cover').style.display = 'flex';
              }}
              onLoad={() => {
                console.log('Image loaded successfully:', course.cover_image);
              }}
            />
          ) : null}
          
          {/* Premium Course Cover Placeholder */}
          <CoursePlaceholder 
            title={course.title}
            category={course.category}
            size="medium"
            className={course.cover_image ? 'hidden' : ''}
          />
          
          {/* Subtle Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent"></div>
          
          {/* Status Badges - Clean Design */}
          <div className="absolute top-3 left-3 flex items-center gap-2">
            {course.is_special_class && (
              <div className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg">
                <Star className="h-3 w-3" />
                <span>PRO</span>
              </div>
            )}
          </div>
            
          {/* Subject Badge - Bottom */}
          {primarySubject && (
            <div className="absolute bottom-3 left-3">
              <div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-1.5 rounded-full text-xs font-semibold shadow-md border border-gray-200 dark:border-gray-700">
                {primarySubject}{additionalSubjectsCount > 0 && ` +${additionalSubjectsCount}`}
              </div>
            </div>
          )}

          {/* Price - Bottom Right */}
          <div className="absolute bottom-3 right-3">
            <div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-1.5 rounded-full text-sm font-bold shadow-md border border-gray-200 dark:border-gray-700">
              {course.price && parseFloat(course.price) > 0 ? `$${course.price}` : 'Free'}
            </div>
          </div>
        </div>
      </Link>

      {/* Card Content - Clean Spacing */}
      <Link href={`/courses/${course.id}`} className="flex flex-1 flex-col">
        <div className="flex-1 flex flex-col p-5 space-y-4">
          {/* Title */}
          <h3 className="font-bold text-lg leading-tight line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300 min-h-[3rem]">
            {course.title}
          </h3>

          {/* Instructor */}
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <div className="p-1.5 bg-gray-100 dark:bg-gray-700 rounded-full">
              <UserCircle className="h-3.5 w-3.5 text-gray-600 dark:text-gray-400" />
            </div>
            <span className="truncate font-medium">{teachers[0] || 'Expert Instructor'}</span>
          </div>

          {/* Flexible Spacer */}
          <div className="flex-1 min-h-[1px]"></div>

          {/* Next Session - Clean Design */}
          {nextSession ? (
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800 p-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-lg shrink-0">
                  <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-0.5">Next Class</p>
                  <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                    {nextSession.daysAway === 0 ? 'Today' : 
                     nextSession.daysAway === 1 ? 'Tomorrow' :
                     DAY_NAMES[nextSession.nextDay]} at {nextSession.start_time}
                  </p>
                  {nextSession.isDifferentDay && (
                    <p className="text-[9px] text-amber-600 dark:text-amber-400 mt-0.5">
                      ⚠️ Different day in your timezone
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 p-3 bg-gray-100 dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600">
              <div className="p-2 bg-gray-200 dark:bg-gray-600 rounded-lg shrink-0">
                <Calendar className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              </div>
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Schedule TBA</p>
            </div>
          )}

          {/* Enrollment Stats */}
          <div className="flex items-center justify-between text-xs pt-1">
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <Users className="h-3.5 w-3.5" />
              <span className="font-medium">{course.enrolled_count ?? 0} students</span>
            </div>
            {seatLeft <= 5 && seatLeft > 0 && (
              <span className="text-red-600 dark:text-red-400 font-bold bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded-full text-[10px]">
                {seatLeft} left
              </span>
            )}
          </div>
        </div>
      </Link>

      {/* Card Footer - Clean Action */}
      <div className="p-5 pt-0 space-y-4">
        {alreadyEnrolled ? (
          <>
            <Link href={`/courses/${course.id}`}>
              <div className="flex items-center justify-center gap-2 py-3 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800 cursor-pointer hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                <span className="text-sm font-bold text-green-700 dark:text-green-400">You're Enrolled</span>
              </div>
            </Link>
            <Link href={`/courses/${course.id}`} className="flex items-center justify-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              <Eye className="h-4 w-4" />
              View Course
              <ChevronRight className="h-4 w-4" />
            </Link>
          </>
        ) : (
          <>
            <Link href={`/courses/${course.id}`}>
              <Button className="w-full h-12 font-semibold text-base rounded-xl shadow-md hover:shadow-lg transition-all duration-300 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white group/btn">
                Continue Learning
                <ChevronRight className="h-5 w-5 ml-2 group-hover/btn:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link href={`/courses/${course.id}`} className="flex items-center justify-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              <Eye className="h-4 w-4" />
              View Details
              <ChevronRight className="h-4 w-4" />
            </Link>
          </>
        )}
      </div>
    </Card>
  )
}

// Session Card Component with Premium Design
function SessionCard({ session }) {
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'scheduled': return 'bg-blue-600 dark:bg-blue-500'
      case 'live': return 'bg-red-500 animate-pulse'
      case 'completed': return 'bg-gray-500'
      default: return 'bg-gray-400'
    }
  }

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'live': return <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
      case 'scheduled': return <IconClock className="h-3 w-3" />
      case 'completed': return <IconCheck className="h-3 w-3" />
      default: return null
    }
  }

  const formatDateTime = (dateStr) => {
    if (!dateStr) return 'Date TBD'
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })
  }

  const formatTime = (timeStr) => {
    if (!timeStr) return 'Time TBD'
    // timeStr is already in HH:MM:SS format from backend
    const [hours, minutes] = timeStr.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const hour12 = hour % 12 || 12
    return `${hour12}:${minutes} ${ampm}`
  }

  const isLive = session.status?.toLowerCase() === 'live'
  
  // Determine if session is upcoming or past
  const now = new Date()
  const sessionDate = session.scheduled_date ? new Date(session.scheduled_date) : null
  const isUpcoming = sessionDate && sessionDate >= now
  const isPast = sessionDate && sessionDate < now
  
  // Calculate days until/since session
  const daysDiff = sessionDate ? Math.ceil((sessionDate - now) / (1000 * 60 * 60 * 24)) : null

  return (
    <Card className={`group relative overflow-hidden transition-all duration-500 hover:-translate-y-2 border-2 bg-white dark:bg-gray-800 rounded-2xl shadow-md hover:shadow-xl ${
      isLive 
        ? 'border-red-500 dark:border-red-400 shadow-red-200 dark:shadow-red-900/30' 
        : isUpcoming 
          ? 'border-blue-300 dark:border-blue-700 hover:border-blue-400 dark:hover:border-blue-600' 
          : isPast 
            ? 'border-gray-300 dark:border-gray-600 opacity-75' 
            : 'border-gray-200 dark:border-gray-700 hover:border-purple-400 dark:hover:border-purple-600'
    }`}>
      {/* Status Badge */}
      <div className="absolute top-4 right-4 z-10">
        <Badge className={`${getStatusColor(session.status)} text-white border-0 shadow-lg gap-1.5 px-3 py-1.5 font-bold`}>
          {getStatusIcon(session.status)}
          {session.status?.toUpperCase() || 'SCHEDULED'}
          </Badge>
        </div>
      
      {/* Upcoming/Past Indicator */}
      {daysDiff !== null && isUpcoming && daysDiff <= 7 && (
        <div className="absolute top-4 left-4 z-10">
          <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white border-0 shadow-lg gap-1.5 px-3 py-1.5 font-bold">
            <IconFlame className="h-3 w-3 animate-pulse" />
            {daysDiff === 0 ? 'TODAY' : daysDiff === 1 ? 'TOMORROW' : `IN ${daysDiff} DAYS`}
          </Badge>
        </div>
      )}
      
      {isPast && session.status?.toLowerCase() !== 'completed' && (
        <div className="absolute top-4 left-4 z-10">
          <Badge className="bg-gray-500 dark:bg-gray-600 text-white border-0 shadow-lg gap-1.5 px-3 py-1.5 font-bold">
            <IconAlertCircle className="h-3 w-3" />
            PAST DUE
          </Badge>
        </div>
      )}

      <CardContent className="p-6">
        {/* Session Icon */}
        <div className="mb-4">
          <div className={`inline-flex p-3 rounded-xl shadow-lg ${isLive ? 'bg-red-50 dark:bg-red-900/30' : 'bg-purple-50 dark:bg-purple-900/30'}`}>
            <IconVideo className={`h-6 w-6 ${isLive ? 'text-red-600 dark:text-red-400' : 'text-purple-600 dark:text-purple-400'}`} />
          </div>
        </div>

        {/* Title and Course */}
        <div className="space-y-2 mb-4">
          <h3 className="font-bold text-lg leading-tight line-clamp-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors min-h-[3.5rem]">
            {session.title}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1 font-medium">
          {session.class_title || session.class_info?.class_title || 'Course'}
          </p>
        </div>

        {/* Session Details */}
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="p-1.5 bg-white dark:bg-gray-800 rounded-lg">
              <IconCalendar className="h-4 w-4 text-gray-600 dark:text-gray-400" />
        </div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {formatDateTime(session.scheduled_date)}
            </span>
          </div>
          
          <div className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="p-1.5 bg-white dark:bg-gray-800 rounded-lg">
              <IconClock className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            </div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {formatTime(session.class_info?.start_time)}
            {session.class_info?.end_time && ` - ${formatTime(session.class_info.end_time)}`}
          </span>
        </div>
        </div>

        {/* Action Button */}
        <div className="mt-6">
          <Button 
            className={`w-full h-12 font-semibold text-base rounded-xl shadow-md hover:shadow-lg transition-all duration-300 ${
              isLive 
                ? 'bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white animate-pulse' 
                : 'bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600 text-white'
            }`}
          >
            {isLive ? (
              <>
                <IconExternalLink className="h-5 w-5 mr-2" />
                Join Live Now
            </>
          ) : (
            <>
                <IconCalendarEvent className="h-5 w-5 mr-2" />
              View Details
            </>
          )}
        </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// Enhanced Certificate Card Component with Premium Design
function EnhancedCertificateCard({ certificate }) {
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `Certificate - ${certificate?.course_data?.title}`,
        text: `I earned a certificate for ${certificate?.course_data?.title}!`,
        url: certificate?.pdf_url || window.location.href,
      }).catch(() => {})
    }
  }

  return (
    <Card className="group relative flex flex-col h-full overflow-hidden transition-all duration-500 hover:-translate-y-2 border-2 border-green-200 dark:border-green-800 hover:border-green-400 dark:hover:border-green-600 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-gray-800 dark:via-gray-800 dark:to-gray-800 rounded-2xl shadow-md hover:shadow-xl">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-500"></div>
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-teal-500/10 to-cyan-500/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>

      <CardContent className="relative p-8 flex flex-col items-center text-center space-y-6">
        {/* Trophy Icon */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full blur-xl opacity-50 group-hover:opacity-70 transition-opacity"></div>
          <div className="relative p-5 rounded-full bg-gradient-to-br from-yellow-400 via-orange-400 to-orange-500 shadow-lg group-hover:scale-110 transition-transform duration-300">
            <IconTrophy className="h-10 w-10 text-white" />
          </div>
        </div>

        {/* Certificate Title */}
        <div className="space-y-2">
          <h3 className="font-black text-xl leading-tight line-clamp-2 text-gray-900 dark:text-white">
          {certificate?.course_data?.title || `Course #${certificate?.course}`}
          </h3>
          <Badge variant="outline" className="font-mono text-xs px-3 py-1 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
            {certificate?.certificate_code || 'CERT-XXXXX'}
          </Badge>
        </div>

        {/* Issue Date */}
        {certificate?.issued_at && (
          <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">
            <IconCalendar className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {new Date(certificate.issued_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
        )}

        {/* Completion Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 text-white text-sm font-bold shadow-lg">
            <IconCheck className="h-4 w-4" />
          Certificate Earned
          </div>

        {/* Action Buttons */}
        <div className="w-full space-y-3 pt-4">
        {certificate?.pdf_url ? (
          <>
              <Button 
                asChild 
                className="w-full h-12 font-semibold text-base rounded-xl shadow-md hover:shadow-lg transition-all duration-300 bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 text-white"
              >
              <a href={certificate.pdf_url} target="_blank" rel="noreferrer" download>
                  <IconDownload className="h-5 w-5 mr-2" />
                  Download Certificate
              </a>
            </Button>
              <Button 
                variant="outline" 
                className="w-full h-10 rounded-lg font-medium border-2 border-gray-300 dark:border-gray-600 hover:border-green-500 dark:hover:border-green-400 transition-all" 
                onClick={handleShare}
              >
              <IconShare className="h-4 w-4 mr-2" />
                Share Achievement
            </Button>
          </>
        ) : (
            <Button disabled className="w-full h-12 rounded-xl font-semibold" variant="outline">
              <IconAlertCircle className="h-5 w-5 mr-2" />
            PDF Unavailable
          </Button>
        )}
        </div>
      </CardContent>
    </Card>
  )
}
