'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import api from '@/lib/api' // axios instance with auth interceptor
import { convertClassTime, getDayName } from '@/lib/timezone-utils'
import { getMediaUrl } from '@/lib/config'

import {
  IconArrowLeft,
  IconBook,
  IconCalendar,
  IconCalendarEvent,
  IconCircleCheck,
  IconClock,
  IconCurrencyDollar,
  IconDownload,
  IconExternalLink,
  IconWorld,
  IconSparkles,
  IconMessage,
  IconPlayerPlay,
  IconCircleDot,
  IconUser,
  IconUsers,
  IconVideo,
  IconBolt,
  IconAward,
  IconTarget,
  IconChartBar,
  IconFileText,
  IconBell,
  IconCircleX,
  IconChevronRight,
  IconSchool,
  IconShield,
  IconCheck,
  IconInfoCircle,
  IconChevronDown,
  IconChevronUp,
  IconDeviceDesktop,
  IconCertificate,
  IconLanguage,
  IconStar,
  IconStarFilled,
  IconBulb,
  IconRocket,
  IconCheckbox,
  IconListCheck,
  IconAlertCircle
} from '@tabler/icons-react'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

import { WHATSAPP_NUMBER } from '@/lib/constants'
import { StructuredData } from '@/components/seo/structured-data'

/* ---------------- helpers ---------------- */
function toArray(v) {
  if (Array.isArray(v)) return v
  if (v && Array.isArray((v).results)) return (v).results
  return []
}

function teacherName(t) {
  if (t?.full_name) return t.full_name
  const fn = t?.first_name ?? ''
  const ln = t?.last_name ?? ''
  return `${fn} ${ln}`.trim()
}

/** Get next session time for a course */
function getNextSessionInfo(timetables) {
  if (!timetables || timetables.length === 0) return null
  
  const now = new Date()
  const currentDay = (now.getDay() + 6) % 7 // Convert Sunday=0 to Monday=0
  const currentTime = now.getHours() * 60 + now.getMinutes()
  
  // Find the nearest upcoming session with timezone conversion
  let nearestDaysAway = Infinity
  let nextSession = null
  
  for (const tt of timetables) {
    if (!tt.is_active) continue
    
    for (const day of tt.days_of_week || []) {
      // Convert class time from teacher's timezone to student's local timezone
      const converted = convertClassTime(
        tt.start_time,
        tt.timezone || 'UTC',
        day
      )
      
      // Calculate days away using converted local day
      let daysAway = (converted.localDay - currentDay + 7) % 7
      
      if (daysAway === 0) {
        // Check if time has passed today using converted local time
        const [hours, minutesStr] = converted.localTime.replace(/AM|PM/gi, '').split(':')
        const isPM = /PM/i.test(converted.localTime)
        const hour24 = isPM && parseInt(hours) !== 12 ? parseInt(hours) + 12 : 
                      (!isPM && parseInt(hours) === 12 ? 0 : parseInt(hours))
        const sessionTimeInMinutes = hour24 * 60 + parseInt(minutesStr.trim())
        
        if (currentTime > sessionTimeInMinutes) {
          daysAway = 7
        }
      }
      
      if (daysAway < nearestDaysAway) {
        nearestDaysAway = daysAway
        nextSession = {
          ...tt,
          nextDay: converted.localDay,
          originalDay: day,
          daysAway,
          start_time: converted.localTime,
          end_time: tt.end_time ? convertClassTime(tt.end_time, tt.timezone || 'UTC', day).localTime : tt.end_time,
          isDifferentDay: converted.isDifferentDay,
          timezone_info: converted.timeDifference,
          original_timezone: tt.timezone
        }
      }
    }
  }
  
  return nextSession
}

/** Format days of week */
const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

/* ---------------- Page ---------------- */

export default function CourseDetailsPage() {
  // Get current user id from JWT if possible, fallback to localStorage
  let userId = null
  let jwtPresent = false
  try {
    if (typeof window !== 'undefined') {
      const authTokens = localStorage.getItem('authTokens')
      if (authTokens) {
        jwtPresent = true
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
  const courseId = Number(params?.id)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [course, setCourse] = useState(null)
  const [timetables, setTimetables] = useState([])
  const [sessions, setSessions] = useState([]) // last 5 sessions
  const [isEnrolled, setIsEnrolled] = useState(false)

  // Attendance (last 5)
  const [lastAttendance, setLastAttendance] = useState([])
  const [attLoading, setAttLoading] = useState(false)

  // Recordings (last 5)
  const [lastRecordings, setLastRecordings] = useState([])
  const [recLoading, setRecLoading] = useState(false)

  // Related courses state
  const [relatedCourses, setRelatedCourses] = useState([])
  const [relatedCoursesLoading, setRelatedCoursesLoading] = useState(false)

  // State for FAQs and other interactions - MUST be before conditional returns
  const [activeTab, setActiveTab] = useState('overview')
  const [expandedFaq, setExpandedFaq] = useState(null)

  // 🎓 ENROLLED STUDENT DATA - Comprehensive information
  const [enrollmentDetails, setEnrollmentDetails] = useState(null)
  const [allAttendance, setAllAttendance] = useState([])
  const [upcomingSessions, setUpcomingSessions] = useState([])
  const [certificates, setCertificates] = useState([])
  const [studentStats, setStudentStats] = useState(null)

  const DAY_OF_WEEK = {
    0: 'Monday',
    1: 'Tuesday',
    2: 'Wednesday',
    3: 'Thursday',
    4: 'Friday',
    5: 'Saturday',
    6: 'Sunday',
  }

  useEffect(() => {
    if (!courseId || Number.isNaN(courseId)) {
      setError('Invalid course id.')
      setLoading(false)
      return
    }

    const load = async () => {
      try {
        setLoading(true)
        setError(null)

        // 1) Course details
        const cRes = await api.get(`course/${courseId}/`)
        const c = cRes.data
        setCourse(c)

        // 1.5) Enrollment status (backend-provided)
        setIsEnrolled(!!c.is_enrolled)

        // 2) Timetables for this course
        const ttRes = await api.get(`course/timetable/?course=${courseId}`)
        const tts = toArray(ttRes.data)
        setTimetables(tts)

        // 3) Sessions (last 5 by created_at desc) via timetable ids
        const ids = tts.map((t) => t.id)
        if (ids.length) {
          const sRes = await api.get(
            `course/live_session/?timetable=${ids.join(',')}&ordering=-created_at&limit=5`
          )
          setSessions(toArray(sRes.data))
        } else {
          setSessions([])
        }
      } catch (e) {
        setError('Failed to load course.')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [courseId])

  // Attendance: last 5
  useEffect(() => {
    const fetchLastAttendance = async () => {
      if (!userId || !courseId) return
      try {
        setAttLoading(true)
        const res = await api.get(
          `course/attendance/?course=${courseId}&student=${userId}&ordering=-created_at&limit=5`
        )
        setLastAttendance(toArray(res.data))
      } catch (e) {
        setLastAttendance([])
      } finally {
        setAttLoading(false)
      }
    }
    fetchLastAttendance()
  }, [userId, courseId])

  // Recordings: last 5 (by course → timetable → session)
  useEffect(() => {
    const fetchLastRecordings = async () => {
      if (!courseId) return
      try {
        setRecLoading(true)
        const ttRes = await api.get(`course/timetable/?course=${courseId}`)
        const tts = toArray(ttRes.data)
        const ids = tts.map((t) => t.id)
        if (!ids.length) {
          setLastRecordings([])
        } else {
          const res = await api.get(
            `course/recording/?session__timetable__in=${ids.join(',')}&ordering=-created_at&limit=5`
          )
          setLastRecordings(toArray(res.data))
        }
      } catch (e) {
        setLastRecordings([])
      } finally {
        setRecLoading(false)
      }
    }
    fetchLastRecordings()
  }, [courseId])

  // Related courses: fetch other courses (excluding current one)
  useEffect(() => {
    const fetchRelatedCourses = async () => {
      if (!courseId) return
      try {
        setRelatedCoursesLoading(true)
        const res = await api.get(`course/?limit=3&exclude=${courseId}`)
        const courses = toArray(res.data)
        setRelatedCourses(courses)
      } catch (e) {
        setRelatedCourses([])
      } finally {
        setRelatedCoursesLoading(false)
      }
    }
    fetchRelatedCourses()
  }, [courseId])

  // 🎓 FETCH COMPREHENSIVE ENROLLED STUDENT DATA
  useEffect(() => {
    if (!isEnrolled || !userId || !courseId) return

    const fetchEnrolledStudentData = async () => {
      try {
        // 1. Fetch enrollment details
        const enrollmentRes = await api.get(`enrollment/?student=${userId}&timetable__course=${courseId}`)
        const enrollments = toArray(enrollmentRes.data)
        if (enrollments.length > 0) {
          setEnrollmentDetails(enrollments[0])
        }

        // 2. Fetch ALL attendance records (not limited)
        const allAttRes = await api.get(`course/attendance/?course=${courseId}&student=${userId}&ordering=-created_at`)
        setAllAttendance(toArray(allAttRes.data))

        // 3. Fetch upcoming sessions
        const upcomingRes = await api.get(`course/live_session/?timetable__course=${courseId}&status=scheduled&ordering=created_at`)
        setUpcomingSessions(toArray(upcomingRes.data))

        // 4. Fetch certificates
        const certRes = await api.get(`course/certificate/?student=${userId}&course=${courseId}`)
        setCertificates(toArray(certRes.data))

        // 5. Calculate comprehensive stats
        const allAtt = toArray(allAttRes.data)
        const totalSessions = allAtt.length
        const presentCount = allAtt.filter(a => a.status === 'present').length
        const absentCount = allAtt.filter(a => a.status === 'absent').length
        const attendancePercentage = totalSessions > 0 ? Math.round((presentCount / totalSessions) * 100) : 0
        
        // Calculate total time spent in sessions
        let totalMinutes = 0
        allAtt.forEach(att => {
          if (att.joined_at && att.left_at) {
            const joined = new Date(att.joined_at)
            const left = new Date(att.left_at)
            const minutes = (left - joined) / (1000 * 60)
            totalMinutes += minutes
          }
        })
        const totalHours = Math.round(totalMinutes / 60)

        setStudentStats({
          totalSessions,
          presentCount,
          absentCount,
          attendancePercentage,
          totalHours,
          totalMinutes: Math.round(totalMinutes)
        })
      } catch (e) {
      }
    }

    fetchEnrolledStudentData()
  }, [isEnrolled, userId, courseId])

  const teacherList = useMemo(
    () => toArray(course?.teachers).map(teacherName).filter(Boolean).join(', '),
    [course]
  )

  const subjectBadges = useMemo(
    () => toArray(course?.subjects).map((s) => s?.name).filter(Boolean),
    [course]
  )

  // Calculate next session - MUST be called before conditional returns
  const nextSession = useMemo(() => getNextSessionInfo(timetables), [timetables])
  
  // Calculate attendance rate - MUST be called before conditional returns
  const attendanceRate = useMemo(() => {
    if (!lastAttendance.length) return 0
    const presentCount = lastAttendance.filter(a => a.status === 'present').length
    return Math.round((presentCount / lastAttendance.length) * 100)
  }, [lastAttendance])

  const handleEnroll = () => {
    if (!course) return
    const subjects = subjectBadges.join(', ')
    const messageLines = [
      'سلام! می‌خواهم برای این کورس ثبت‌نام کنم. ✅',
      '',
      `📘 عنوان کورس: ${course.title}`,
      subjects ? `🧩 مضامین: ${subjects}` : '',
      teacherList ? `👨‍🏫 استاد(ها): ${teacherList}` : '',
      course.price && parseFloat(course.price) > 0 ? `💵 قیمت: $${course.price}` : '💵 قیمت: رایگان',
      `👥 ظرفیت: ${course.enrolled_count ?? '-'} / ${course.capacity ?? '-'}`,
      '',
      'لطفاً مرا در مورد مراحل بعدی راهنمایی کنید. سپاس 🙏',
    ].filter(Boolean)

    const text = encodeURIComponent(messageLines.join('\n'))
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${text}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }


  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        {/* Hero Skeleton */}
        <div className="border-b bg-muted/30">
          <div className="container mx-auto px-4 py-8">
            <div className="max-w-5xl space-y-4">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
        </div>
        
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardContent className="p-6 space-y-4">
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </CardContent>
              </Card>
            </div>
            <div>
              <Card>
                <CardContent className="p-6 space-y-4">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-4 w-full" />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !course) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
              <IconCircleX className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Course Not Found</h3>
              <p className="text-muted-foreground text-sm">{error ?? 'This course does not exist.'}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => router.back()} className="flex-1">
                <IconArrowLeft className="h-4 w-4 mr-2" />
                Go Back
              </Button>
              <Button asChild className="flex-1">
                <Link href="/courses">Browse Classes</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Check if there's a live session now
  const hasLiveSession = course?.has_live_session || false

  const seatsLeft = Number(course?.seat_left ?? 0)
  const capacity = Number(course?.capacity ?? 0)
  const isFull = seatsLeft === 0
  const isLowSeats = seatsLeft > 0 && seatsLeft <= 3
  const hasPrice = course?.price && parseFloat(course.price) > 0
  const nextSessionLabel = nextSession
    ? (nextSession.daysAway === 0
        ? 'Today'
        : nextSession.daysAway === 1
          ? 'Tomorrow'
          : `In ${nextSession.daysAway} days`)
    : null

  // Mock data for enhanced UX (replace with real data from API when available)
  const mockLearningOutcomes = [
    'Master fundamental concepts and principles',
    'Apply knowledge through hands-on projects',
    'Develop practical skills for real-world scenarios',
    'Gain confidence through interactive sessions'
  ]
  const mockRequirements = [
    'No prior experience required - beginners welcome',
    'Access to a computer or mobile device',
    'Stable internet connection for live sessions',
    'Willingness to learn and participate actively'
  ]
  const mockFaqs = [
    { q: 'What happens if I miss a live session?', a: 'All sessions are recorded and available for playback. You can watch them at your convenience and catch up with the material.' },
    { q: 'Can I get a refund if the course isn\'t for me?', a: 'Yes! We offer a 14-day money-back guarantee. If you\'re not satisfied within the first two weeks, we\'ll refund your payment in full.' },
    { q: 'Do I get a certificate upon completion?', a: 'Absolutely! Upon successfully completing the course and meeting attendance requirements, you\'ll receive a certificate of completion.' },
    { q: 'How do I interact with the instructor?', a: 'You can ask questions during live sessions, participate in Q&A segments, and reach out via course messaging system.' },
    { q: 'What if I need to take a break from the course?', a: 'You can pause your enrollment and resume later. Just contact us to discuss your situation and we\'ll work out a solution.' }
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Structured Data for SEO */}
      {course && <StructuredData type="course" data={course} />}
      {course && (
        <StructuredData
          type="breadcrumb"
          data={[
            { name: 'Home', url: '/' },
            { name: 'Courses', url: '/courses' },
            { name: course.title || course.name, url: `/courses/${course.id}` },
          ]}
        />
      )}
      
      {/* 🚨 LIVE SESSION ALERT - Top Priority */}
      {hasLiveSession && (
        <div className="sticky top-0 z-50 bg-gradient-to-r from-red-600 via-red-500 to-red-600 text-white px-4 py-3 shadow-lg">
          <div className="container mx-auto flex items-center justify-between max-w-7xl">
            <div className="flex items-center gap-3">
              <IconCircleDot className="h-5 w-5 animate-pulse" />
              <span className="font-bold text-sm md:text-base">🔴 LIVE SESSION IN PROGRESS</span>
            </div>
            <Button size="sm" variant="secondary" className="bg-white text-red-600 hover:bg-white/90 font-bold">
              Join Now
            </Button>
          </div>
        </div>
      )}

      {/* 🎯 PROFESSIONAL HERO BANNER - Enhanced with Course-Specific Graphics */}
      <div className="relative bg-gradient-to-br from-slate-50 via-white to-blue-50/30 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        {/* Subtle professional pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#f8fafc_1px,transparent_1px),linear-gradient(to_bottom,#f8fafc_1px,transparent_1px)] bg-[size:24px_24px] dark:bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)]"></div>
        
        {/* Spectacular Course Details Background */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Animated gradient waves */}
          <div className="absolute inset-0">
            <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-violet-400/20 via-purple-400/15 to-fuchsia-400/20 dark:from-violet-600/10 dark:via-purple-600/8 dark:to-fuchsia-600/10 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-gradient-to-bl from-cyan-400/20 via-blue-400/15 to-indigo-400/20 dark:from-cyan-600/10 dark:via-blue-600/8 dark:to-indigo-600/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
            <div className="absolute -bottom-1/2 -left-1/2 w-full h-full bg-gradient-to-tr from-emerald-400/20 via-teal-400/15 to-cyan-400/20 dark:from-emerald-600/10 dark:via-teal-600/8 dark:to-cyan-600/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
            <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-rose-400/20 via-pink-400/15 to-orange-400/20 dark:from-rose-600/10 dark:via-pink-600/8 dark:to-orange-600/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '3s'}}></div>
          </div>
          
          {/* Floating course detail specific elements - UNIQUE to course details page */}
          
          {/* 1. Progress Tracker with Percentage Circle */}
          <div className="absolute top-16 right-16 w-32 h-32 bg-gradient-to-br from-green-100/90 via-emerald-100/70 to-teal-100/60 dark:from-green-900/40 dark:via-emerald-900/30 dark:to-teal-900/20 backdrop-blur-md rounded-2xl border border-green-300/60 dark:border-green-700/40 shadow-2xl transform rotate-12 hover:rotate-6 transition-all duration-1000 opacity-80">
            <div className="p-4 h-full flex flex-col items-center justify-center">
              {/* Circular progress indicator */}
              <div className="relative w-16 h-16 mb-2">
                <svg className="w-16 h-16 transform -rotate-90">
                  <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="none" className="text-green-200 dark:text-green-800" />
                  <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="none" strokeDasharray="176" strokeDashoffset="44" className="text-green-500" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-bold text-green-600 dark:text-green-400">75%</span>
                </div>
              </div>
              <div className="text-[10px] font-semibold text-green-700 dark:text-green-300 text-center">Progress</div>
            </div>
          </div>
          
          {/* 2. Attendance Calendar Grid */}
          <div className="absolute top-32 left-12 w-32 h-28 bg-gradient-to-br from-blue-100/90 via-indigo-100/70 to-cyan-100/60 dark:from-blue-900/40 dark:via-indigo-900/30 dark:to-cyan-900/20 backdrop-blur-md rounded-2xl border border-blue-300/60 dark:border-blue-700/40 shadow-2xl transform -rotate-8 hover:-rotate-4 transition-all duration-1000 opacity-75">
            <div className="p-3 h-full flex flex-col">
              {/* Calendar header */}
              <div className="flex items-center gap-1 mb-2">
                <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded"></div>
                <div className="flex-1 h-1 bg-gradient-to-r from-blue-400/60 to-indigo-400/40 rounded-full"></div>
              </div>
              {/* Calendar grid (attendance) */}
              <div className="grid grid-cols-5 gap-1">
                <div className="w-3 h-3 bg-green-500 rounded-sm"></div>
                <div className="w-3 h-3 bg-green-500 rounded-sm"></div>
                <div className="w-3 h-3 bg-red-500 rounded-sm"></div>
                <div className="w-3 h-3 bg-green-500 rounded-sm"></div>
                <div className="w-3 h-3 bg-green-500 rounded-sm"></div>
                <div className="w-3 h-3 bg-green-500 rounded-sm"></div>
                <div className="w-3 h-3 bg-gray-300 dark:bg-gray-600 rounded-sm"></div>
                <div className="w-3 h-3 bg-gray-300 dark:bg-gray-600 rounded-sm"></div>
                <div className="w-3 h-3 bg-gray-300 dark:bg-gray-600 rounded-sm"></div>
                <div className="w-3 h-3 bg-gray-300 dark:bg-gray-600 rounded-sm"></div>
              </div>
            </div>
          </div>
          
          {/* 3. Session Timer/Clock */}
          <div className="absolute bottom-28 right-24 w-28 h-28 bg-gradient-to-br from-purple-100/90 via-fuchsia-100/70 to-pink-100/60 dark:from-purple-900/40 dark:via-fuchsia-900/30 dark:to-pink-900/20 backdrop-blur-md rounded-full border border-purple-300/60 dark:border-purple-700/40 shadow-2xl transform rotate-8 hover:rotate-4 transition-all duration-1000 opacity-70">
            <div className="p-3 h-full flex flex-col items-center justify-center">
              {/* Clock face */}
              <div className="relative w-14 h-14">
                <div className="absolute inset-0 border-4 border-purple-400 dark:border-purple-600 rounded-full"></div>
                {/* Clock hands */}
                <div className="absolute top-1/2 left-1/2 w-1 h-5 bg-purple-600 dark:bg-purple-400 transform -translate-x-1/2 origin-bottom" style={{transform: 'translate(-50%, -100%) rotate(90deg)'}}></div>
                <div className="absolute top-1/2 left-1/2 w-0.5 h-6 bg-fuchsia-600 dark:bg-fuchsia-400 transform -translate-x-1/2 origin-bottom" style={{transform: 'translate(-50%, -100%) rotate(180deg)'}}></div>
                <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-pink-500 rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
              </div>
              <div className="text-[9px] font-semibold text-purple-700 dark:text-purple-300 mt-1">Next: 2h</div>
            </div>
          </div>
          
          {/* 4. Grade/Score Badge */}
          <div className="absolute top-48 left-1/4 w-24 h-24 bg-gradient-to-br from-amber-100/90 via-yellow-100/70 to-orange-100/60 dark:from-amber-900/40 dark:via-yellow-900/30 dark:to-orange-900/20 backdrop-blur-md rounded-full border-4 border-amber-300/60 dark:border-amber-700/40 shadow-2xl transform -rotate-4 hover:-rotate-2 transition-all duration-1000 opacity-65">
            <div className="h-full flex flex-col items-center justify-center">
              {/* Star badge with grade */}
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-full flex items-center justify-center">
                  <div className="text-white font-bold text-sm">A+</div>
                </div>
                {/* Star points around */}
                <div className="absolute -top-1 left-1/2 w-2 h-2 bg-yellow-400 rounded-full transform -translate-x-1/2"></div>
                <div className="absolute -bottom-1 left-1/2 w-2 h-2 bg-yellow-400 rounded-full transform -translate-x-1/2"></div>
                <div className="absolute top-1/2 -left-1 w-2 h-2 bg-yellow-400 rounded-full transform -translate-y-1/2"></div>
                <div className="absolute top-1/2 -right-1 w-2 h-2 bg-yellow-400 rounded-full transform -translate-y-1/2"></div>
              </div>
            </div>
          </div>
          
          {/* 5. Document Stack (Course Materials) */}
          <div className="absolute bottom-40 left-1/3 w-28 h-24 bg-gradient-to-br from-cyan-100/90 via-sky-100/70 to-blue-100/60 dark:from-cyan-900/40 dark:via-sky-900/30 dark:to-blue-900/20 backdrop-blur-md rounded-xl border border-cyan-300/60 dark:border-cyan-700/40 shadow-2xl transform rotate-6 hover:rotate-3 transition-all duration-1000 opacity-70">
            <div className="p-3 h-full flex items-center justify-center">
              {/* Stacked documents */}
              <div className="relative w-12 h-14">
                <div className="absolute bottom-0 left-0 w-10 h-12 bg-gradient-to-br from-cyan-400 to-blue-400 rounded-lg shadow-md">
                  <div className="p-1">
                    <div className="w-full h-0.5 bg-white/40 rounded-full mb-0.5"></div>
                    <div className="w-3/4 h-0.5 bg-white/30 rounded-full mb-0.5"></div>
                    <div className="w-full h-0.5 bg-white/30 rounded-full"></div>
                  </div>
                </div>
                <div className="absolute bottom-1 left-1 w-10 h-12 bg-gradient-to-br from-sky-400 to-cyan-400 rounded-lg shadow-md opacity-80"></div>
                <div className="absolute bottom-2 left-2 w-10 h-12 bg-gradient-to-br from-blue-400 to-sky-400 rounded-lg shadow-md opacity-60"></div>
                {/* Badge showing count */}
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-[10px] font-bold">5</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* 6. Live Session Indicator */}
          <div className="absolute top-1/3 right-1/4 w-32 h-20 bg-gradient-to-br from-red-100/90 via-rose-100/70 to-pink-100/60 dark:from-red-900/40 dark:via-rose-900/30 dark:to-pink-900/20 backdrop-blur-md rounded-2xl border border-red-300/60 dark:border-red-700/40 shadow-2xl transform -rotate-3 hover:-rotate-1 transition-all duration-1000 opacity-80">
            <div className="p-3 h-full flex items-center gap-2">
              {/* Pulsing live dot */}
              <div className="relative">
                <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse"></div>
                <div className="absolute inset-0 w-4 h-4 bg-red-400 rounded-full animate-ping"></div>
              </div>
              <div className="flex-1">
                <div className="text-xs font-bold text-red-600 dark:text-red-400">LIVE</div>
                <div className="h-0.5 bg-red-400/60 rounded-full mt-1"></div>
                <div className="h-0.5 bg-red-300/40 rounded-full mt-0.5 w-3/4"></div>
              </div>
            </div>
          </div>
          
          {/* Dynamic course learning path network */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{opacity: 0.3}}>
            <defs>
              <linearGradient id="courseDetailPath1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.6"/>
                <stop offset="50%" stopColor="#8b5cf6" stopOpacity="0.4"/>
                <stop offset="100%" stopColor="#ec4899" stopOpacity="0.6"/>
              </linearGradient>
              <linearGradient id="courseDetailPath2" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.6"/>
                <stop offset="50%" stopColor="#06b6d4" stopOpacity="0.4"/>
                <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.6"/>
              </linearGradient>
              <linearGradient id="courseDetailPath3" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.6"/>
                <stop offset="50%" stopColor="#ef4444" stopOpacity="0.4"/>
                <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.6"/>
              </linearGradient>
            </defs>
            
            {/* Course learning progression */}
            <path d="M 100 150 Q 300 100 500 200 Q 700 300 900 250" stroke="url(#courseDetailPath1)" strokeWidth="3" fill="none" className="animate-pulse"/>
            
            {/* Course module connections */}
            <path d="M 200 200 Q 350 150 500 180" stroke="url(#courseDetailPath2)" strokeWidth="2" fill="none" className="animate-pulse" style={{animationDelay: '0.5s'}}/>
            <path d="M 400 250 Q 600 200 800 220" stroke="url(#courseDetailPath3)" strokeWidth="2" fill="none" className="animate-pulse" style={{animationDelay: '1s'}}/>
            
            {/* Course milestones */}
            <circle cx="200" cy="200" r="8" fill="url(#courseDetailPath1)" className="animate-pulse"/>
            <circle cx="400" cy="180" r="6" fill="url(#courseDetailPath2)" className="animate-pulse" style={{animationDelay: '0.3s'}}/>
            <circle cx="600" cy="220" r="7" fill="url(#courseDetailPath3)" className="animate-pulse" style={{animationDelay: '0.7s'}}/>
            <circle cx="800" cy="250" r="8" fill="url(#courseDetailPath1)" className="animate-pulse" style={{animationDelay: '1.2s'}}/>
            
            {/* Course completion indicators */}
            <rect x="120" y="280" width="12" height="12" fill="url(#courseDetailPath1)" className="animate-pulse" style={{animationDelay: '0.8s'}}/>
            <rect x="320" y="300" width="10" height="10" fill="url(#courseDetailPath2)" className="animate-pulse" style={{animationDelay: '1.3s'}}/>
            <rect x="520" y="320" width="11" height="11" fill="url(#courseDetailPath3)" className="animate-pulse" style={{animationDelay: '1.8s'}}/>
            
            {/* Learning flow arrows */}
            <path d="M 300 120 L 320 140 L 300 160 M 320 140 L 340 140" stroke="url(#courseDetailPath1)" strokeWidth="2" fill="none" className="animate-pulse" style={{animationDelay: '2.5s'}}/>
            <path d="M 500 180 L 520 200 L 500 220 M 520 200 L 540 200" stroke="url(#courseDetailPath2)" strokeWidth="2" fill="none" className="animate-pulse" style={{animationDelay: '3s'}}/>
            <path d="M 700 240 L 720 260 L 700 280 M 720 260 L 740 260" stroke="url(#courseDetailPath3)" strokeWidth="2" fill="none" className="animate-pulse" style={{animationDelay: '3.5s'}}/>
          </svg>
          
          {/* Floating course detail particles */}
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
            <span className="text-gray-900 dark:text-white font-medium truncate">{course.title}</span>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
            {/* Left: Course Overview */}
            <div className="lg:col-span-2 space-y-8">
              
              {/* Professional Course Header */}
              <div className="space-y-6">
                  {/* Professional Badges */}
                  <div className="flex flex-wrap gap-2">
                    {subjectBadges.map((subject, idx) => (
                      <div key={idx} className="inline-flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-md border border-slate-200 dark:border-slate-700">
                        <IconBook className="h-3.5 w-3.5 text-slate-600 dark:text-slate-400" />
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{subject}</span>
                      </div>
                    ))}
                    {course.is_special_class && (
                      <div className="inline-flex items-center gap-1.5 bg-blue-600 px-3 py-1.5 rounded-md">
                        <IconStar className="h-3.5 w-3.5 text-white" />
                        <span className="text-sm font-semibold text-white">Premium</span>
                      </div>
                    )}
                    {isEnrolled && (
                      <div className="inline-flex items-center gap-1.5 bg-green-600 px-3 py-1.5 rounded-md">
                        <IconCircleCheck className="h-3.5 w-3.5 text-white" />
                        <span className="text-sm font-semibold text-white">Enrolled</span>
                      </div>
                    )}
                  </div>
                  
              
                {/* Professional Title */}
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight text-slate-900 dark:text-white">
                  {course.title}
                </h1>
              
                {/* Professional Description */}
                <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-3xl">
                  {course.description || 'Professional course designed to provide comprehensive knowledge and practical skills through expert instruction and interactive learning.'}
                </p>

                {/* Course Statistics */}
                <div className="flex flex-wrap items-center gap-6">
                  {/* Students Enrolled */}
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                      <IconUsers className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                    </div>
                    <div>
                      <span className="text-xl font-semibold text-slate-900 dark:text-white">{course.enrolled_count || 0}</span>
                      <span className="text-sm text-slate-600 dark:text-slate-400 ml-1">students</span>
                    </div>
                  </div>
                    
                  {/* Sessions */}
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                      <IconCalendar className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                    </div>
                    <div>
                      <span className="text-xl font-semibold text-slate-900 dark:text-white">{timetables.length}</span>
                      <span className="text-sm text-slate-600 dark:text-slate-400 ml-1">sessions</span>
                    </div>
                  </div>
                
                  {/* Seats Status */}
                  {!isFull && (
                    <div className="flex items-center gap-3">
                      <div className={`p-2 ${isLowSeats ? 'bg-orange-100 dark:bg-orange-900/30' : 'bg-green-100 dark:bg-green-900/30'} rounded-lg`}>
                        <IconTarget className={`h-4 w-4 ${isLowSeats ? 'text-orange-600 dark:text-orange-400' : 'text-green-600 dark:text-green-400'}`} />
                      </div>
                      <div>
                        <span className={`text-xl font-semibold ${isLowSeats ? 'text-orange-600 dark:text-orange-400' : 'text-slate-900 dark:text-white'}`}>{seatsLeft}</span>
                        <span className="text-sm text-slate-600 dark:text-slate-400 ml-1">seats left</span>
                      </div>
                    </div>
                  )}

                  {isFull && (
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                        <IconCircleX className="h-4 w-4 text-red-600 dark:text-red-400" />
                      </div>
                      <span className="text-lg font-semibold text-red-600 dark:text-red-400">Course Full</span>
                    </div>
                  )}
                </div>

                {/* Professional Feature Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6">
                  <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex flex-col items-center text-center gap-2">
                      <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                        <IconDeviceDesktop className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-slate-900 dark:text-white">Live Classes</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex flex-col items-center text-center gap-2">
                      <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                        <IconPlayerPlay className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-slate-900 dark:text-white">HD Recordings</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex flex-col items-center text-center gap-2">
                      <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                        <IconCertificate className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-slate-900 dark:text-white">Cert Included</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex flex-col items-center text-center gap-2">
                      <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                        <IconLanguage className="h-5 w-5 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-slate-900 dark:text-white">Multi Language</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Professional Instructor Preview */}
                {toArray(course?.teachers).length > 0 && (
                  <div className="flex flex-wrap items-center gap-3 pt-4">
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Instructor:</span>
                    <div className="flex items-center gap-3">
                      <div className="flex -space-x-2">
                        {toArray(course.teachers).slice(0, 3).map((teacher, idx) => (
                          <Avatar key={idx} className="h-10 w-10 border-2 border-white dark:border-slate-800">
                            <AvatarImage src={teacher.profile_picture} />
                            <AvatarFallback className="bg-slate-600 text-white text-sm font-medium">
                              {teacher.full_name
                                ? teacher.full_name.split(' ').map((n) => n[0]).join('').slice(0, 2)
                                : ((teacher.first_name ?? '').charAt(0) + (teacher.last_name ?? '').charAt(0)) || 'T'}
                            </AvatarFallback>
                          </Avatar>
                        ))}
                      </div>
                      <span className="font-medium text-slate-900 dark:text-white">{teacherList}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Professional Value Proposition */}
              <Card className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="shrink-0">
                      <div className="p-3 bg-slate-100 dark:bg-slate-700 rounded-lg">
                        <IconRocket className="h-6 w-6 text-slate-600 dark:text-slate-400" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
                        Why Choose This Course?
                      </h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5">
                            <div className="p-1 bg-green-100 dark:bg-green-900/30 rounded-full">
                              <IconCheck className="h-4 w-4 text-green-600 dark:text-green-400" />
                            </div>
                          </div>
                          <div>
                            <p className="font-medium text-sm text-slate-900 dark:text-white">Expert Instructors</p>
                            <p className="text-xs text-slate-600 dark:text-slate-400">Learn from industry professionals</p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <div className="mt-0.5">
                            <div className="p-1 bg-green-100 dark:bg-green-900/30 rounded-full">
                              <IconCheck className="h-4 w-4 text-green-600 dark:text-green-400" />
                            </div>
                          </div>
                          <div>
                            <p className="font-medium text-sm text-slate-900 dark:text-white">Interactive Learning</p>
                            <p className="text-xs text-slate-600 dark:text-slate-400">Engage in live Q&A sessions</p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <div className="mt-0.5">
                            <div className="p-1 bg-green-100 dark:bg-green-900/30 rounded-full">
                              <IconCheck className="h-4 w-4 text-green-600 dark:text-green-400" />
                            </div>
                          </div>
                          <div>
                            <p className="font-medium text-sm text-slate-900 dark:text-white">Lifetime Access</p>
                            <p className="text-xs text-slate-600 dark:text-slate-400">All recordings available forever</p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <div className="mt-0.5">
                            <div className="p-1 bg-green-100 dark:bg-green-900/30 rounded-full">
                              <IconCheck className="h-4 w-4 text-green-600 dark:text-green-400" />
                            </div>
                          </div>
                          <div>
                            <p className="font-medium text-sm text-slate-900 dark:text-white">Certificate</p>
                            <p className="text-xs text-slate-600 dark:text-slate-400">Earn recognized credentials</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Professional Next Session Highlight */}
              {nextSession && (
                <Card className="border-l-4 border-l-blue-500 bg-white dark:bg-slate-800">
                  <CardContent className="p-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                      <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg shrink-0">
                        <IconCalendarEvent className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h3 className="font-semibold text-lg text-slate-900 dark:text-white">Next Live Session</h3>
                          <Badge className="bg-blue-600 text-white">
                            {nextSessionLabel}
                          </Badge>
                        </div>
                        <p className="text-base text-slate-600 dark:text-slate-300">
                          {DAY_NAMES[nextSession.nextDay]} • {nextSession.start_time} - {nextSession.end_time}
                        </p>
                        {nextSession.isDifferentDay && (
                          <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                            ⚠️ Different day in your timezone
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right: Sticky Enrollment Card (Desktop) */}
            <div className="lg:block hidden">
              <EnrollmentCard 
                course={course}
                isEnrolled={isEnrolled}
                isFull={isFull}
                isLowSeats={isLowSeats}
                seatsLeft={seatsLeft}
                capacity={capacity}
                hasPrice={hasPrice}
                timetables={timetables}
                attendanceRate={attendanceRate}
                lastAttendance={lastAttendance}
                lastRecordings={lastRecordings}
                userId={userId}
                courseId={courseId}
                handleEnroll={handleEnroll}
                studentStats={studentStats}
                upcomingSessions={upcomingSessions}
                certificates={certificates}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 📚 MAIN CONTENT AREA */}
      <div className="container mx-auto px-4 py-8 md:py-12 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Detailed Course Information */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Main Course Content - Tabbed Interface */}
            <Card className="shadow-lg">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className="border-b px-4 sm:px-6 pt-4 sm:pt-6">
                  <TabsList className="grid w-full grid-cols-3 h-auto gap-2">
                    <TabsTrigger value="overview" className="flex items-center gap-2 py-2 sm:py-3 text-xs sm:text-sm">
                      <IconBulb className="h-4 w-4" />
                      <span>Overview</span>
                    </TabsTrigger>
                    <TabsTrigger value="instructor" className="flex items-center gap-2 py-2 sm:py-3 text-xs sm:text-sm">
                      <IconUser className="h-4 w-4" />
                      <span>Instructor</span>
                    </TabsTrigger>
                    <TabsTrigger value="schedule" className="flex items-center gap-2 py-2 sm:py-3 text-xs sm:text-sm">
                      <IconCalendar className="h-4 w-4" />
                      <span>Schedule</span>
                    </TabsTrigger>
                  </TabsList>
                  </div>
                
                {/* Tab: Overview - What You'll Learn + Requirements */}
                <TabsContent value="overview" className="p-4 sm:p-6 space-y-8">
                  {/* What You'll Learn */}
                  <div>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <IconBulb className="h-6 w-6 text-primary" />
                      </div>
                      <h2 className="text-2xl font-bold">What You'll Learn</h2>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      {mockLearningOutcomes.map((outcome, idx) => (
                        <div key={idx} className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                          <div className="p-1 bg-green-500/10 rounded-full shrink-0 mt-0.5">
                            <IconCheck className="h-4 w-4 text-green-600 dark:text-green-500" />
                          </div>
                          <p className="text-sm leading-relaxed">{outcome}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  {/* Course Description */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">About This Course</h3>
                    <div className="prose prose-sm max-w-none">
                      <p className="text-muted-foreground leading-relaxed">
                        {course.description || 'This comprehensive course is designed to provide you with in-depth knowledge and practical skills. Through interactive sessions, hands-on projects, and expert guidance, you\'ll gain the confidence and competence to excel in your learning journey.'}
                      </p>
                </div>
                  </div>
                
                  <Separator />

                  {/* Requirements */}
                  <div>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <IconListCheck className="h-6 w-6 text-primary" />
                      </div>
                      <h2 className="text-2xl font-bold">Requirements</h2>
                    </div>
                    
                    <ul className="space-y-3">
                      {mockRequirements.map((req, idx) => (
                        <li key={idx} className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                          <IconCheckbox className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                          <span className="text-sm leading-relaxed">{req}</span>
                        </li>
                      ))}
                    </ul>

                    <div className="mt-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                      <div className="flex items-start gap-3">
                        <IconCheck className="h-5 w-5 text-green-600 dark:text-green-500 shrink-0 mt-0.5" />
                              <div>
                          <p className="font-semibold text-green-700 dark:text-green-400 mb-1">Perfect for Beginners!</p>
                          <p className="text-sm text-green-600/80 dark:text-green-500/80">
                            No prior experience is required. This course is designed to take you from beginner to proficient.
                                </p>
                  </div>
                </div>
                      </div>
                  </div>
                </TabsContent>
                
                {/* Tab: Instructor */}
                <TabsContent value="instructor" className="p-4 sm:p-6 space-y-6">
                  <div>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <IconUser className="h-6 w-6 text-primary" />
                      </div>
                      <h2 className="text-2xl font-bold">Meet Your Instructors</h2>
                    </div>
                  </div>

                    {toArray(course?.teachers).length > 0 ? (
                    <div className="space-y-6">
                      {toArray(course.teachers).map((teacher, idx) => (
                        <div key={idx} className="flex flex-col md:flex-row gap-6 items-start p-4 rounded-lg border bg-card hover:shadow-md transition-shadow">
                          <Avatar className="h-24 w-24 shrink-0">
                                <AvatarImage src={teacher.profile_picture} />
                            <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white font-bold text-2xl">
                                  {teacher.full_name
                                ? teacher.full_name.split(' ').map((n) => n[0]).join('').slice(0, 2)
                                : ((teacher.first_name ?? '').charAt(0) + (teacher.last_name ?? '').charAt(0)) || 'T'}
                                </AvatarFallback>
                              </Avatar>
                          <div className="flex-1 space-y-3">
                            <h3 className="font-bold text-xl">
                                  {teacher.full_name || `${teacher.first_name ?? ''} ${teacher.last_name ?? ''}`.trim()}
                                </h3>
                            <p className="text-muted-foreground leading-relaxed">
                              {teacher.bio || 'Experienced educator dedicated to helping students achieve their learning goals through engaging and practical instruction.'}
                            </p>
                            <div className="flex flex-wrap gap-2 pt-2">
                              <Badge variant="secondary">
                                <IconAward className="h-3 w-3 mr-1" />
                                Expert Instructor
                              </Badge>
                              <Badge variant="secondary">
                                <IconUsers className="h-3 w-3 mr-1" />
                                {course.enrolled_count || 0}+ Students
                              </Badge>
                  </div>
                </div>
                        </div>
                        ))}
              </div>
                    ) : (
                    <p className="text-muted-foreground text-center py-8">
                      Instructor information will be available soon.
                    </p>
                  )}
                </TabsContent>
                
                {/* Tab: Schedule */}
                <TabsContent value="schedule" className="p-4 sm:p-6 space-y-6">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <IconCalendar className="h-6 w-6 text-primary" />
            </div>
                      <h2 className="text-2xl font-bold">Class Schedule</h2>
                    </div>
                    <p className="text-sm text-muted-foreground mb-6">
                      {timetables.length} weekly session{timetables.length !== 1 ? 's' : ''} • Live interactive classes
                    </p>
                  </div>

                  {timetables.length > 0 ? (
                    <div className="space-y-3">
                      {timetables.map((tt, idx) => (
                        <Card key={idx} className="border-l-4 border-l-primary/50 hover:shadow-md transition-shadow">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between gap-4">
                              <div className="flex items-center gap-4 flex-1">
                                <div className="p-2 bg-primary/10 rounded-lg">
                                  <IconClock className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                  <p className="font-semibold">
                                    {tt.days_of_week && tt.days_of_week.map(d => DAY_NAMES[d]).join(', ')}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {tt.start_time} - {tt.end_time}
                                  </p>
                                </div>
                              </div>
                              <Badge variant={tt.is_active ? "default" : "secondary"}>
                                {tt.is_active ? "Active" : "Inactive"}
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-8">
                      Schedule will be announced soon.
                    </p>
                  )}
                </TabsContent>
                
              </Tabs>
            </Card>

            {/* 🎓 ENROLLED STUDENT DASHBOARD - Platform Consistent Design */}
        {isEnrolled && (
          <Card className="shadow-lg">
                <Tabs defaultValue="dashboard" className="w-full">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3 text-2xl">
                      <div className="p-2 bg-green-500/10 rounded-lg">
                        <IconCircleCheck className="h-6 w-6 text-green-600" />
                      </div>
                      You're Enrolled!
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {enrollmentDetails?.enrolled_at ? `Since ${new Date(enrollmentDetails.enrolled_at).toLocaleDateString()}` : 'Active Student'}
                    </p>
                  </CardHeader>
                  <div className="border-b px-4 sm:px-6 pb-4">
                    <TabsList className="grid w-full grid-cols-2 h-auto gap-2">
                      <TabsTrigger value="dashboard" className="flex items-center gap-2 py-2 sm:py-3 text-xs sm:text-sm">
                        <IconChartBar className="h-4 w-4" />
                        <span>Dashboard</span>
                      </TabsTrigger>
                      <TabsTrigger value="materials" className="flex items-center gap-2 py-2 sm:py-3 text-xs sm:text-sm">
                        <IconPlayerPlay className="h-4 w-4" />
                        <span>Materials</span>
                      </TabsTrigger>
                    </TabsList>
          </div>

                  {/* Tab: Dashboard */}
                  <TabsContent value="dashboard" className="p-4 sm:p-6 space-y-6">
                    {/* Key Stats - Platform Design */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="p-4 rounded-xl border hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                            <IconCircleCheck className="h-4 w-4 text-green-600 dark:text-green-400" />
                          </div>
                          <div className="text-3xl font-black">{studentStats?.attendancePercentage || attendanceRate}%</div>
                        </div>
                        <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Attendance</div>
                      </div>
                      
                      <div className="p-4 rounded-xl border hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                            <IconClock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div className="text-3xl font-black">{studentStats?.totalHours || 0}h</div>
                        </div>
                        <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Total Time</div>
                      </div>
                      
                      <div className="p-4 rounded-xl border hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                            <IconCircleCheck className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                          </div>
                          <div className="text-3xl font-black">{studentStats?.presentCount || 0}</div>
                        </div>
                        <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Present</div>
                      </div>
                      
                      <div className="p-4 rounded-xl border hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="p-2 bg-pink-100 dark:bg-pink-900/30 rounded-lg">
                            <IconPlayerPlay className="h-4 w-4 text-pink-600 dark:text-pink-400" />
                          </div>
                          <div className="text-3xl font-black">{lastRecordings.length}</div>
                        </div>
                        <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Recordings</div>
                      </div>
                    </div>

                    {/* Next Class - Platform Style */}
                    {nextSession && (
                      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800 p-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 bg-blue-100 dark:bg-blue-900/40 rounded-lg shrink-0">
                            <IconCalendarEvent className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-0.5">Next Class</p>
                            <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                              {nextSession.daysAway === 0 ? 'Today' : 
                               nextSession.daysAway === 1 ? 'Tomorrow' :
                               DAY_NAMES[nextSession.nextDay]} • {nextSession.start_time}
                            </p>
                            {nextSession.isDifferentDay && (
                              <p className="text-[9px] text-amber-600 dark:text-amber-400 mt-0.5">
                                ⚠️ Different day in your timezone
                              </p>
                            )}
                          </div>
                          {hasLiveSession && (
                            <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white font-semibold shrink-0">
                              Join Now
                            </Button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Upcoming Sessions */}
                    {upcomingSessions.length > 0 && (
                      <div>
                        <h4 className="font-bold text-sm mb-3">Upcoming Sessions</h4>
                        <div className="space-y-2">
                          {upcomingSessions.slice(0, 3).map((session, idx) => (
                            <div key={idx} className="flex items-center gap-3 p-3 rounded-xl border hover:shadow-sm transition-shadow">
                              <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                                <IconVideo className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-sm truncate">{session.title}</p>
                                <p className="text-xs text-muted-foreground">{new Date(session.created_at).toLocaleDateString()}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Performance Badge */}
                    {attendanceRate >= 80 && (
                      <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                            <IconSparkles className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                          <div>
                            <p className="font-bold text-sm text-gray-900 dark:text-white">
                              {attendanceRate >= 90 ? "🏆 Exceptional Performance!" : "⭐ Excellent Work!"}
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              {attendanceRate >= 90 ? "Certificate eligible!" : "On track for excellence"}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </TabsContent>

                  {/* Tab: Materials */}
                  <TabsContent value="materials" className="p-4 sm:p-6 space-y-6">
                    {lastRecordings.length > 0 ? (
                  <div className="space-y-3">
                    {lastRecordings.map((recording, idx) => (
                      <div key={idx} className="flex flex-col sm:flex-row gap-4 p-4 rounded-xl border hover:shadow-md transition-all group">
                        <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg shrink-0 self-start group-hover:scale-110 transition-transform">
                          <IconPlayerPlay className="h-5 w-5 text-red-600 dark:text-red-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-base mb-1">{recording.title || `Recording ${idx + 1}`}</h4>
                          {recording.description && (
                            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{recording.description}</p>
                          )}
                          <div className="flex flex-wrap gap-2">
                            {recording.video_url && (
                              <Button size="sm" className="h-9 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-sm">
                                <IconPlayerPlay className="h-3.5 w-3.5 mr-1.5" />
                                Watch
                              </Button>
                            )}
                            {recording.slides && (
                              <Button size="sm" variant="outline" className="h-9 rounded-xl font-semibold">
                                <IconDownload className="h-3.5 w-3.5 mr-1.5" />
                                Slides
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                        <Button asChild variant="ghost" size="sm" className="w-full text-sm font-semibold hover:bg-gray-100 dark:hover:bg-gray-800">
                          <Link href={`/courses/${courseId}/recordings`} className="flex items-center justify-center gap-1">
                            View All Recordings
                            <IconChevronRight className="h-3.5 w-3.5" />
                          </Link>
                        </Button>
                    </div>
                    ) : (
                      <div className="text-center py-12">
                        <div className="p-4 bg-muted rounded-2xl w-16 h-16 flex items-center justify-center mx-auto mb-4">
                          <IconPlayerPlay className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <p className="text-sm font-semibold text-muted-foreground">No recordings available yet</p>
                        <p className="text-xs text-muted-foreground mt-1">Check back after class sessions</p>
                      </div>
                    )}
              </TabsContent>
            </Tabs>
          </Card>
        )}

            {/* FAQs Section */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-2xl">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <IconInfoCircle className="h-6 w-6 text-primary" />
                </div>
                  Frequently Asked Questions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <Accordion type="single" collapsible className="w-full">
                  {mockFaqs.map((faq, idx) => (
                    <AccordionItem key={idx} value={`faq-${idx}`}>
                      <AccordionTrigger className="text-left hover:no-underline">
                        <span className="font-semibold">{faq.q}</span>
                      </AccordionTrigger>
                      <AccordionContent>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {faq.a}
                        </p>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
                
                <div className="mt-6 p-4 bg-primary/5 rounded-lg border">
                  <div className="flex items-start gap-3">
                    <IconMessage className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-semibold mb-1">Still have questions?</p>
                      <p className="text-sm text-muted-foreground mb-3">
                        Our team is here to help! Contact us via WhatsApp and we'll respond within minutes.
                      </p>
                      <Button size="sm" variant="outline" onClick={handleEnroll}>
                        <IconMessage className="h-4 w-4 mr-2" />
                        Chat with Us
                      </Button>
                        </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Related Courses */}
            {relatedCourses.length > 0 && (
              <section id="related-courses">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3 text-2xl">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <IconRocket className="h-6 w-6 text-primary" />
                            </div>
                      You Might Also Like
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-2">
                      Students who enrolled in this course also checked out these courses
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-3 gap-4">
                      {relatedCourses.map((relatedCourse) => (
                        <Link 
                          key={relatedCourse.id} 
                          href={`/courses/${relatedCourse.id}`}
                          className="group"
                        >
                          <Card className="h-full hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                            <CardContent className="p-4 space-y-3">
                              <div className="aspect-video bg-gradient-to-br from-primary/20 to-secondary/20 rounded-lg flex items-center justify-center">
                                <IconSchool className="h-12 w-12 text-primary/50" />
                          </div>
                              <h4 className="font-semibold line-clamp-2 group-hover:text-primary transition-colors">
                                {relatedCourse.title}
                              </h4>
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">
                                  {relatedCourse.enrolled_count || 0} students
                                </span>
                                {relatedCourse.price && parseFloat(relatedCourse.price) > 0 ? (
                                  <span className="font-bold">${relatedCourse.price}</span>
                                ) : (
                                  <Badge variant="secondary">Free</Badge>
                                )}
                </div>
                            </CardContent>
                          </Card>
                        </Link>
                        ))}
                      </div>
                  </CardContent>
                </Card>
              </section>
            )}
          </div>

          {/* Right Column: Sticky Enrollment Card (Desktop Only) */}
          <div className="hidden lg:block">
            {/* Spacer - Card is already rendered in hero section as sticky */}
          </div>
        </div>
      </div>

      {/* 📱 MOBILE: Fixed Bottom CTA */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-background border-t shadow-lg z-40">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="font-bold text-lg truncate">
                {hasPrice ? `$${course.price}` : 'Free'}
              </p>
              <p className="text-xs text-muted-foreground">
                {isFull ? 'Course Full' : `${seatsLeft} seats left`}
              </p>
            </div>
            <Button 
              size="lg" 
              className="shrink-0 font-bold"
              onClick={handleEnroll}
              disabled={isFull}
            >
              {isFull ? (
                <>
                  <IconCircleX className="h-5 w-5 mr-2" />
                  Full
                </>
              ) : isEnrolled ? (
                <>
                  <IconVideo className="h-5 w-5 mr-2" />
                  Go to Course
                </>
              ) : (
                <>
                  <IconCircleCheck className="h-5 w-5 mr-2" />
                  Enroll Now
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Add padding at bottom for mobile fixed CTA */}
      <div className="lg:hidden h-20" />
    </div>
  )
}

/* 🎴 ENROLLMENT CARD COMPONENT - Reusable */
function EnrollmentCard({ 
  course, 
  isEnrolled, 
  isFull, 
  isLowSeats, 
  seatsLeft, 
  capacity, 
  hasPrice, 
  timetables,
  attendanceRate,
  lastAttendance,
  lastRecordings,
  userId,
  courseId,
  handleEnroll,
  studentStats,
  upcomingSessions,
  certificates 
}) {
  // For enrolled students, show clean dashboard in sidebar
  if (isEnrolled) {
    return (
      <div className="sticky top-4 space-y-4">
        {/* Enrolled Status Card - Platform Design */}
        <Card className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-2xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
          {/* Green Header */}
          <div className="bg-green-50 dark:bg-green-900/20 border-b border-green-200 dark:border-green-800 p-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-green-500 rounded-xl shadow-md">
                <IconCircleCheck className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="font-black text-lg text-gray-900 dark:text-white">You're Enrolled</div>
                <div className="text-xs text-gray-600 dark:text-gray-400 font-medium">Active Student</div>
              </div>
            </div>
          </div>

          {/* Stats Mini Grid */}
          <CardContent className="p-4 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-700">
                <div className="text-2xl font-black text-green-600 dark:text-green-400">{studentStats?.attendancePercentage || attendanceRate}%</div>
                <div className="text-[10px] font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mt-1">Attendance</div>
              </div>
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-700">
                <div className="text-2xl font-black text-blue-600 dark:text-blue-400">{studentStats?.totalHours || 0}h</div>
                <div className="text-[10px] font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mt-1">Time</div>
              </div>
            </div>

            <Button asChild className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-base rounded-xl shadow-md hover:shadow-lg transition-all">
              <Link href={`/courses/${courseId}/sessions`}>
                <IconVideo className="h-4 w-4 mr-2" />
                Continue Learning
                          </Link>
                        </Button>

            {certificates.length > 0 && (
              <Button variant="outline" className="w-full h-10 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 font-semibold text-sm rounded-xl">
                <IconCertificate className="h-4 w-4 mr-2 text-amber-600" />
                View Certificate
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Quick Access Links */}
        <Card className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-2xl shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <IconBolt className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              Quick Access
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-2">
            <Link href={`/courses/${courseId}/sessions`} className="flex items-center justify-between p-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-300 dark:hover:border-blue-600 transition-all group">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <IconVideo className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                      </div>
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">All Sessions</span>
              </div>
              <IconChevronRight className="h-3.5 w-3.5 text-gray-400" />
            </Link>

            <Link href={`/courses/${courseId}/recordings`} className="flex items-center justify-between p-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:border-purple-300 dark:hover:border-purple-600 transition-all group">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <IconPlayerPlay className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                </div>
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Recordings</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-xs font-bold text-purple-600 dark:text-purple-400">{lastRecordings.length}</span>
                <IconChevronRight className="h-3.5 w-3.5 text-gray-400" />
              </div>
            </Link>

            <Link href={`/courses/${courseId}/attendance`} className="flex items-center justify-between p-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-green-50 dark:hover:bg-green-900/20 hover:border-green-300 dark:hover:border-green-600 transition-all group">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <IconCalendar className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                </div>
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Attendance</span>
              </div>
              <IconChevronRight className="h-3.5 w-3.5 text-gray-400" />
            </Link>
          </CardContent>
        </Card>

        {/* Course Info */}
        <Card className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-2xl shadow-md">
          <CardContent className="p-4 space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400 font-medium">Total Sessions</span>
              <span className="font-black text-base text-gray-900 dark:text-white">{studentStats?.totalSessions || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400 font-medium">Present</span>
              <span className="font-black text-base text-green-600 dark:text-green-400">{studentStats?.presentCount || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-400 font-medium">Learning Time</span>
              <span className="font-black text-base text-blue-600 dark:text-blue-400">{studentStats?.totalHours || 0}h</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Non-enrolled: Standard enrollment card - Platform Design
  return (
    <Card className="sticky top-4 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-2xl shadow-md overflow-hidden hover:shadow-xl transition-shadow">
      {/* Course Preview Image */}
      <div className="relative h-48 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 overflow-hidden">
                  {course.cover_image ? (
                    <>
                      <img 
                        src={getMediaUrl(course.cover_image)}
              alt={course.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    </>
                  ) : null}
                  
        {/* Subtle overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent"></div>

        {/* Price Tag - Platform Style */}
        <div className="absolute bottom-3 left-3">
          <div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-4 py-2 rounded-full font-bold shadow-md border border-gray-200 dark:border-gray-700">
            {hasPrice ? `$${course.price}` : 'Free'}
          </div>
        </div>

        {/* Urgency Badge - Platform Style */}
        {!isFull && isLowSeats && (
          <div className="absolute top-3 right-3">
            <div className="bg-red-500 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg flex items-center gap-1.5 animate-pulse">
              <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
              <span>{seatsLeft} left</span>
            </div>
          </div>
        )}
                </div>
                
      <CardContent className="p-5 space-y-4">
        {/* Primary CTA - Platform Style */}
                      <Button 
          className={`w-full h-12 font-semibold text-base rounded-xl shadow-md hover:shadow-lg transition-all ${isFull ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'} text-white`}
                        onClick={handleEnroll}
                        disabled={isFull}
                      >
                        {isFull ? (
                          <>
              <IconCircleX className="h-4 w-4 mr-2" />
                            Course Full
                          </>
                        ) : (
                          <>
              <IconCircleCheck className="h-4 w-4 mr-2" />
                            Enroll Now
                          </>
                        )}
                      </Button>
                      
        <p className="text-center text-[10px] text-gray-600 dark:text-gray-400 flex items-center justify-center gap-1">
          <IconInfoCircle className="h-3 w-3" />
          Quick response via WhatsApp
        </p>

        <Separator className="bg-gray-200 dark:bg-gray-700" />

        {/* Course Stats - Clean */}
        <div className="space-y-2.5 text-xs">
                    <div className="flex items-center justify-between">
            <span className="text-gray-600 dark:text-gray-400 font-medium flex items-center gap-1.5">
              <IconUsers className="h-3.5 w-3.5" />
              Students
                      </span>
            <span className="font-black text-sm text-gray-900 dark:text-white">{course.enrolled_count || 0}/{capacity}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
            <span className="text-gray-600 dark:text-gray-400 font-medium flex items-center gap-1.5">
              <IconTarget className="h-3.5 w-3.5" />
                        Seats Left
                      </span>
            <span className={`font-black text-sm ${isFull ? 'text-red-600 dark:text-red-400' : isLowSeats ? 'text-orange-600 dark:text-orange-400' : 'text-green-600 dark:text-green-400'}`}>
                        {seatsLeft}
                      </span>
                    </div>
                    
                      <div className="flex items-center justify-between">
            <span className="text-gray-600 dark:text-gray-400 font-medium flex items-center gap-1.5">
              <IconCalendar className="h-3.5 w-3.5" />
              Sessions
                        </span>
            <span className="font-black text-sm text-gray-900 dark:text-white">{timetables.length}</span>
                      </div>
                  </div>

        <Separator className="bg-gray-200 dark:border-gray-700" />

        {/* What's Included - Minimal */}
        <div className="space-y-2">
          <p className="font-bold text-xs text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-3">Includes:</p>
          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
              <span className="font-medium">Live sessions</span>
                    </div>
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
              <span className="font-medium">Recordings</span>
                    </div>
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
              <span className="font-medium">Certificate</span>
                    </div>
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
              <span className="font-medium">Lifetime access</span>
                  </div>
            </div>
          </div>
      </CardContent>
    </Card>
  )
}
