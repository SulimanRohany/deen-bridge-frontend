'use client'

import { useEffect, useMemo, useState, useCallback, useRef } from 'react'
import CustomCourseRequestDialog from '@/components/CustomCourseRequestDialog'
import CoursePlaceholder from '@/components/CoursePlaceholder'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
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

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'

import { courseAPI } from '@/lib/api'
import { convertClassTime, getDayName } from '@/lib/timezone-utils'
import { getMediaUrl } from '@/lib/config'

/** Normalize paginated/non-paginated responses */
const toList = (data) => (Array.isArray(data) ? data : data?.results || [])

/** Debounce helper */
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(handler)
  }, [value, delay])

  return debouncedValue
}

/** Local Storage Hooks */
function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    if (typeof window === 'undefined') return initialValue
    
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      return initialValue
    }
  })

  const setValue = (value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value
      setStoredValue(valueToStore)
      
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore))
      }
    } catch (error) {
    }
  }

  return [storedValue, setValue]
}

/** Recently Viewed Courses Hook */
function useRecentlyViewed() {
  const [recentlyViewed, setRecentlyViewed] = useLocalStorage('recently-viewed-courses', [])
  
  const addToRecentlyViewed = (courseId) => {
    setRecentlyViewed(prev => {
      const filtered = prev.filter(id => id !== courseId)
      return [courseId, ...filtered].slice(0, 5) // Keep only last 5
    })
  }
  
  return { recentlyViewed, addToRecentlyViewed }
}


/** Get next session time for a course */
function getNextSessionInfo(course) {
  if (!course || !course.is_active || !course.days_of_week || course.days_of_week.length === 0) return null
  
  const now = new Date()
  const currentDay = (now.getDay() + 6) % 7 // Convert Sunday=0 to Monday=0
  const currentTime = now.getHours() * 60 + now.getMinutes()
  
  // Find the nearest upcoming session with timezone conversion
  let nearestDaysAway = Infinity
  let nextSession = null
  
  for (const day of course.days_of_week || []) {
    // Convert class time from teacher's timezone to student's local timezone
    const converted = convertClassTime(
      course.start_time,
      course.timezone || 'UTC',
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
        start_time: converted.localTime,
        end_time: course.end_time ? convertClassTime(course.end_time, course.timezone || 'UTC', day).localTime : null,
        timezone: course.timezone,
        days_of_week: course.days_of_week,
        is_active: course.is_active,
        nextDay: converted.localDay,
        originalDay: day,
        daysAway,
        isDifferentDay: converted.isDifferentDay,
        timezone_info: converted.timeDifference,
        original_timezone: course.timezone
      }
    }
  }
  
  return nextSession
}

/** Format days of week */
const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

/** Live Course Card Component - Premium Modern Design */
function LiveCourseCard({ course, onEnroll, liveSessions = [] }) {
  const alreadyEnrolled = !!course.is_enrolled
  const seatLeft = course.seat_left ?? 0
  const teachers = (course.teachers || [])
    .map((t) => t.full_name || `${t.first_name ?? ''} ${t.last_name ?? ''}`.trim())
    .filter(Boolean)

  // Get next session info from course timing
  const nextSession = getNextSessionInfo(course)
  
  // Check if there's a live session for this course
  const hasLiveSession = liveSessions.some(session => {
    // Check if this session belongs to this course
    return session.class_session === course.id || session.course === course.id
  })

  // Get first subject for display
  const primarySubject = (course.subjects || [])[0]?.name
  const additionalSubjectsCount = (course.subjects || []).length - 1

  // Debug logging for course data

  return (
    <Card className="relative flex flex-col h-full overflow-hidden transition-all duration-500 hover:-translate-y-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-2xl shadow-md hover:shadow-xl group">
      {/* Cover Image Section - Premium Placeholder */}
      <Link href={`/courses/${course.id}`} className="block">
        <div className="relative h-52 overflow-hidden rounded-t-2xl bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700">
          {/* Image with error handling */}
          {course.cover_image ? (
            <img 
              src={course.cover_image.startsWith('http') ? course.cover_image : getMediaUrl(course.cover_image)}
              alt={course.title}
              className="w-full h-full object-cover transition-all duration-500 group-hover:scale-105"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.parentElement.querySelector('.placeholder-cover').style.display = 'flex';
              }}
              onLoad={() => {
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
              {hasLiveSession && (
              <div className="flex items-center gap-1.5 bg-red-500 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg">
                <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                <span>LIVE</span>
                </div>
              )}
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
      <div className="p-5 pt-0 space-y-3">
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
              View Class
              <ChevronRight className="h-4 w-4" />
            </Link>
          </>
        ) : (
          <>
              <Button 
              className="w-full h-12 font-semibold text-base rounded-xl shadow-md hover:shadow-lg transition-all duration-300 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white" 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onEnroll(course);
                }} 
                disabled={seatLeft === 0}
              >
                {seatLeft === 0 ? (
                  <>
                    <XCircle className="h-5 w-5 mr-2" />
                    Class Full
                  </>
                ) : (
                  <>
                    Enroll Now
                    <Zap className="h-5 w-5 ml-2" />
                  </>
                )}
              </Button>
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

/** Loading Skeletons */
function LiveCourseCardSkeleton() {
  return (
    <Card className="flex flex-col h-full overflow-hidden border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-2xl shadow-md">
      {/* Image skeleton */}
      <Skeleton className="h-52 w-full rounded-t-2xl rounded-b-none" />
      
      {/* Content skeleton */}
      <div className="flex-1 flex flex-col p-5 space-y-4">
        {/* Title */}
        <div className="space-y-2">
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-4/5" />
        </div>
        
        {/* Instructor */}
        <div className="flex items-center gap-2">
          <Skeleton className="h-6 w-6 rounded-full" />
          <Skeleton className="h-4 w-32" />
        </div>
        
        {/* Spacer */}
        <div className="flex-1 min-h-[1px]"></div>
        
        {/* Session info */}
        <Skeleton className="h-16 w-full rounded-xl" />
        
        {/* Stats */}
        <div className="flex items-center justify-between pt-1">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-5 w-14 rounded-full" />
        </div>
      </div>
      
      {/* Footer skeleton */}
      <div className="p-5 pt-0 space-y-3">
        <Skeleton className="h-12 w-full rounded-xl" />
        <Skeleton className="h-4 w-32 mx-auto" />
      </div>
    </Card>
  )
}

export default function LiveCoursesPage() {
  const router = useRouter()
  const [courses, setCourses] = useState([])
  const [filteredCourses, setFilteredCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [liveSessions, setLiveSessions] = useState([])

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSubjects, setSelectedSubjects] = useState([])
  const [priceRange, setPriceRange] = useState('all')
  const [sortBy, setSortBy] = useState('next-session')
  const [showFilters, setShowFilters] = useState(false)
  const [showCustomCourseDialog, setShowCustomCourseDialog] = useState(false)
  const [ctaDismissed, setCtaDismissed] = useState(false)

  const debouncedSearch = useDebounce(searchTerm, 300)

  // Custom hooks for new features
  const { recentlyViewed, addToRecentlyViewed } = useRecentlyViewed()

  // WhatsApp number
  const WHATSAPP_NUMBER = '93789468067'

  // Function to dismiss CTA (session only, not persistent)
  const dismissCTA = () => {
    setCtaDismissed(true)
  }

  /** Fetch all courses with timetables and live sessions */
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true)
        setError(null)

        // Fetch courses and live sessions in parallel
        const [coursesRes, liveSessionsRes] = await Promise.all([
          courseAPI.getCourses(),
          courseAPI.getLiveSessions()
        ])
        
        const items = toList(coursesRes.data)
        const sessions = toList(liveSessionsRes.data)
        
        
        setCourses(items)
        setFilteredCourses(items)
        setLiveSessions(sessions)
      } catch (err) {
        setError('Failed to load classes. Please try again later.')
      } finally {
        setLoading(false)
      }
    }

    fetchCourses()
  }, [])

  /** All subject names */
  const allSubjects = useMemo(() => {
    const names = new Set()
    for (const c of courses) {
      for (const s of c.subjects || []) {
        if (s?.name) names.add(s.name)
      }
    }
    return Array.from(names).sort()
  }, [courses])

  /** Handle subject filter toggle */
  const handleSubjectChange = (subject, checked) => {
    if (checked === true) setSelectedSubjects((prev) => [...prev, subject])
    else setSelectedSubjects((prev) => prev.filter((s) => s !== subject))
  }

  /** Clear all filters */
  const clearFilters = () => {
    setSearchTerm('')
    setSelectedSubjects([])
    setPriceRange('all')
  }

  /** Apply search + filters + sorting */
  useEffect(() => {
    const filtered = courses.filter((course) => {
      const tNames = (course.teachers || []).map(
        (t) => t.full_name || `${t.first_name ?? ''} ${t.last_name ?? ''}`.trim()
      )

      const matchesSearch =
        course.title?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        course.description?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        tNames.some((n) => n.toLowerCase().includes(debouncedSearch.toLowerCase()))

      const matchesSubject =
        selectedSubjects.length === 0 ||
        (course.subjects || []).some((s) => s?.name && selectedSubjects.includes(s.name))

      const price = course.price ? parseFloat(course.price) : 0
      const matchesPrice =
        priceRange === 'all' ||
        (priceRange === 'free' && (!course.price || parseFloat(course.price) === 0)) ||
        (priceRange === 'paid' && course.price && parseFloat(course.price) > 0)

      return matchesSearch && matchesSubject && matchesPrice
    })

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'next-session': {
          const aNext = getNextSessionInfo(a)
          const bNext = getNextSessionInfo(b)
          if (!aNext && !bNext) return 0
          if (!aNext) return 1
          if (!bNext) return -1
          return aNext.daysAway - bNext.daysAway
        }
        case 'price-low':
          return (a.price ?? 0) - (b.price ?? 0)
        case 'price-high':
          return (b.price ?? 0) - (a.price ?? 0)
        case 'popular':
          return (b.enrolled_count ?? 0) - (a.enrolled_count ?? 0)
        case 'seats-available':
          return (b.seat_left ?? 0) - (a.seat_left ?? 0)
        case 'newest':
        default:
          return new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime()
      }
    })

    setFilteredCourses(filtered)
  }, [courses, debouncedSearch, selectedSubjects, priceRange, sortBy])

  /** Enroll button handler -> WhatsApp */
  const handleEnroll = (course) => {
    const teacherNames = (course.teachers || [])
      .map((t) => t.full_name || `${t.first_name ?? ''} ${t.last_name ?? ''}`.trim())
      .filter(Boolean)
      .join(', ')

    const subjects = (course.subjects || []).map((s) => s.name).filter(Boolean).join(', ')
    
    const nextSession = getNextSessionInfo(course)
    const scheduleInfo = nextSession 
      ? `📅 Next Session: ${nextSession.daysAway === 0 ? 'Today' : nextSession.daysAway === 1 ? 'Tomorrow' : `In ${nextSession.daysAway} days`} at ${nextSession.start_time}`
      : '📅 Schedule: To be announced'

    const messageLines = [
      'سلام! می‌خواهم در کلاس‌های زنده این کورس شرکت کنم. ✅',
      '',
      `📘 عنوان کورس: ${course.title}`,
      subjects ? `🧩 مضامین: ${subjects}` : '',
      teacherNames ? `👨‍🏫 استاد(ها): ${teacherNames}` : '',
      course.price && parseFloat(course.price) > 0 ? `💵 قیمت: $${course.price}` : '💵 قیمت: رایگان',
      `👥 ظرفیت: ${course.enrolled_count ?? '-'} / ${course.capacity ?? '-'}`,
      scheduleInfo,
      '',
      'لطفاً مرا در مورد مراحل بعدی و زمان کلاس‌ها راهنمایی کنید. سپاس 🙏',
    ].filter(Boolean)

    const text = encodeURIComponent(messageLines.join('\n'))
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${text}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  /** Quick stats */
  const stats = useMemo(() => {
    const total = courses.length
    
    // Count actual live sessions from backend
    const live = liveSessions.length
    
    const upcoming = courses.filter(c => {
      const next = getNextSessionInfo(c)
      return next && next.daysAway <= 7
    }).length
    const seatsAvailable = courses.reduce((sum, c) => sum + (c.seat_left ?? 0), 0)

    return { total, live, upcoming, seatsAvailable }
  }, [courses, liveSessions])

  /** Active filters count */
  const activeFiltersCount = selectedSubjects.length + (priceRange !== 'all' ? 1 : 0)

  /** Get Recently Viewed Courses */
  const recentlyViewedCourses = useMemo(() => {
    return recentlyViewed
      .map(id => courses.find(c => c.id === id))
      .filter(Boolean)
      .slice(0, 3)
  }, [recentlyViewed, courses])

  /** Top Subjects for quick filtering */
  const topSubjects = useMemo(() => {
    const subjectCounts = {}
    courses.forEach(course => {
      course.subjects?.forEach(subject => {
        if (subject?.name) {
          subjectCounts[subject.name] = (subjectCounts[subject.name] || 0) + 1
        }
      })
    })
    
    return Object.entries(subjectCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8)
      .map(([name]) => name)
  }, [courses])

  /** Quick filter by subject */
  const quickFilterSubject = (subject) => {
    if (selectedSubjects.includes(subject)) {
      setSelectedSubjects(prev => prev.filter(s => s !== subject))
    } else {
      setSelectedSubjects(prev => [...prev, subject])
    }
  }

  /** Loading state */
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background via-primary/5 dark:via-primary/5 to-background">
        {/* Hero Skeleton */}
        <div className="relative overflow-hidden bg-gradient-to-br from-primary/20 via-secondary/20 to-primary/20 dark:from-primary/10 dark:via-secondary/10 dark:to-primary/10">
          <div className="container mx-auto px-4 py-24 md:py-32 lg:py-40">
            <div className="max-w-6xl mx-auto space-y-8">
              <div className="flex justify-center">
                <Skeleton className="h-12 w-64 rounded-full" />
              </div>
              <div className="space-y-4 text-center">
                <Skeleton className="h-16 w-96 mx-auto rounded-2xl" />
                <Skeleton className="h-12 w-full max-w-4xl mx-auto rounded-2xl" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-32 rounded-2xl" />
                ))}
              </div>
            </div>
          </div>
        </div>
        
        {/* Content Skeleton */}
        <div className="container mx-auto px-4 -mt-12 relative z-20 space-y-8">
          <Card className="border-0 bg-card/95 backdrop-blur-xl shadow-2xl rounded-3xl">
            <CardContent className="p-6">
              <Skeleton className="h-14 w-full rounded-2xl" />
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-12">
            {[...Array(6)].map((_, i) => (
              <LiveCourseCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    )
  }

  /** Error state */
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-background via-primary/5 dark:via-primary/5 to-background p-4">
        <Card className="max-w-md border-0 bg-gradient-to-br from-card via-card to-card/95 shadow-2xl rounded-3xl overflow-hidden">
          <CardContent className="p-12 text-center space-y-6">
            <div className="relative">
              <div className="absolute inset-0 bg-destructive/20 blur-2xl rounded-full"></div>
              <div className="relative w-20 h-20 bg-gradient-to-br from-destructive/20 to-destructive/10 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
                <XCircle className="h-10 w-10 text-destructive" />
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-bold mb-3 text-foreground">Error Loading Classes</h3>
              <p className="text-muted-foreground text-base leading-relaxed">{error}</p>
            </div>
            <Button 
              onClick={() => window.location.reload()} 
              className="w-full h-12 rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-primary/5 dark:via-primary/5 to-background">

      {/* Modern Clean Hero Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        {/* Simple elegant background pattern */}
        <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] dark:bg-grid-slate-700/25"></div>
        
        {/* Spectacular Course Background */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Animated gradient waves */}
          <div className="absolute inset-0">
            <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-violet-400/20 via-purple-400/15 to-fuchsia-400/20 dark:from-violet-600/10 dark:via-purple-600/8 dark:to-fuchsia-600/10 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-gradient-to-bl from-cyan-400/20 via-blue-400/15 to-indigo-400/20 dark:from-cyan-600/10 dark:via-blue-600/8 dark:to-indigo-600/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
            <div className="absolute -bottom-1/2 -left-1/2 w-full h-full bg-gradient-to-tr from-emerald-400/20 via-teal-400/15 to-cyan-400/20 dark:from-emerald-600/10 dark:via-teal-600/8 dark:to-cyan-600/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
            <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-rose-400/20 via-pink-400/15 to-orange-400/20 dark:from-rose-600/10 dark:via-pink-600/8 dark:to-orange-600/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '3s'}}></div>
          </div>
          
          {/* Floating course-specific elements */}
          <div className="absolute top-16 right-16 w-32 h-24 bg-gradient-to-br from-blue-100/90 via-indigo-100/70 to-purple-100/60 dark:from-blue-900/40 dark:via-indigo-900/30 dark:to-purple-900/20 backdrop-blur-md rounded-xl border border-blue-300/60 dark:border-blue-700/40 shadow-2xl transform rotate-12 hover:rotate-6 transition-all duration-1000 opacity-80">
            <div className="p-3 h-full flex flex-col">
              {/* Course card with live indicator */}
              <div className="flex-1 flex items-center justify-center mb-2">
                <div className="w-8 h-6 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg relative">
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
                    <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                  </div>
                  <div className="absolute inset-1 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-md"></div>
                  <div className="absolute top-1 left-1 right-1 h-0.5 bg-white/40 rounded-full"></div>
                  <div className="absolute top-2 left-1 right-1 h-0.5 bg-white/30 rounded-full"></div>
                </div>
              </div>
              {/* Live course indicator */}
              <div className="space-y-1">
                <div className="w-full h-1 bg-gradient-to-r from-red-400/80 to-pink-400/60 dark:from-red-500/60 dark:to-pink-500/40 rounded-full"></div>
                <div className="w-2/3 h-0.5 bg-gradient-to-r from-red-300/60 to-pink-300/40 dark:from-red-600/40 dark:to-pink-600/30 rounded-full"></div>
              </div>
            </div>
          </div>
          
          <div className="absolute top-32 left-12 w-28 h-20 bg-gradient-to-br from-emerald-100/90 via-teal-100/70 to-cyan-100/60 dark:from-emerald-900/40 dark:via-teal-900/30 dark:to-cyan-900/20 backdrop-blur-md rounded-xl border border-emerald-300/60 dark:border-emerald-700/40 shadow-2xl transform -rotate-8 hover:-rotate-4 transition-all duration-1000 opacity-75">
            <div className="p-3 h-full flex flex-col">
              {/* Course schedule/calendar */}
              <div className="flex-1 flex items-center justify-center mb-2">
                <div className="w-6 h-6 relative">
                  <div className="w-6 h-5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg relative">
                    <div className="absolute top-0.5 left-1 right-1 h-0.5 bg-white/40 rounded-full"></div>
                    <div className="absolute top-1.5 left-1 right-1 h-0.5 bg-white/30 rounded-full"></div>
                    <div className="absolute top-2.5 left-1 right-1 h-0.5 bg-white/20 rounded-full"></div>
                    <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-4 h-1 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-sm"></div>
                  </div>
                </div>
              </div>
              {/* Course schedule */}
              <div className="space-y-1">
                <div className="w-full h-1 bg-gradient-to-r from-emerald-400/80 to-teal-400/60 dark:from-emerald-500/60 dark:to-teal-500/40 rounded-full"></div>
                <div className="w-3/4 h-0.5 bg-gradient-to-r from-emerald-300/60 to-teal-300/40 dark:from-emerald-600/40 dark:to-teal-600/30 rounded-full"></div>
              </div>
            </div>
          </div>
          
          <div className="absolute bottom-28 right-24 w-30 h-22 bg-gradient-to-br from-rose-100/90 via-pink-100/70 to-purple-100/60 dark:from-rose-900/40 dark:via-pink-900/30 dark:to-purple-900/20 backdrop-blur-md rounded-xl border border-rose-300/60 dark:border-rose-700/40 shadow-2xl transform rotate-8 hover:rotate-4 transition-all duration-1000 opacity-70">
            <div className="p-3 h-full flex flex-col">
              {/* Live video session */}
              <div className="flex-1 flex items-center justify-center mb-2">
                <div className="w-6 h-6 relative">
                  <div className="w-6 h-6 bg-gradient-to-r from-rose-500 to-pink-500 rounded-lg flex items-center justify-center relative">
                    <div className="w-0 h-0 border-l-[6px] border-l-white border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent ml-0.5"></div>
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  </div>
                </div>
              </div>
              {/* Live session indicator */}
              <div className="space-y-1">
                <div className="w-full h-1 bg-gradient-to-r from-rose-400/80 to-pink-400/60 dark:from-rose-500/60 dark:to-pink-500/40 rounded-full"></div>
                <div className="w-4/5 h-0.5 bg-gradient-to-r from-rose-300/60 to-pink-300/40 dark:from-rose-600/40 dark:to-pink-600/30 rounded-full"></div>
              </div>
            </div>
          </div>
          
          <div className="absolute top-48 left-1/4 w-26 h-18 bg-gradient-to-br from-amber-100/90 via-orange-100/70 to-yellow-100/60 dark:from-amber-900/40 dark:via-orange-900/30 dark:to-yellow-900/20 backdrop-blur-md rounded-xl border border-amber-300/60 dark:border-amber-700/40 shadow-2xl transform -rotate-4 hover:-rotate-2 transition-all duration-1000 opacity-65">
            <div className="p-3 h-full flex flex-col">
              {/* Course enrollment/seat indicator */}
              <div className="flex-1 flex items-center justify-center mb-2">
                <div className="w-6 h-6 relative">
                  <div className="w-6 h-4 bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg relative">
                    <div className="absolute top-0.5 left-1 right-1 h-0.5 bg-white/40 rounded-full"></div>
                    <div className="absolute top-1.5 left-1 right-1 h-0.5 bg-white/30 rounded-full"></div>
                    <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-1 bg-gradient-to-r from-amber-400 to-orange-400 rounded-sm"></div>
                    <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-4 h-1 bg-gradient-to-r from-amber-600 to-orange-600 rounded-full"></div>
                  </div>
                </div>
              </div>
              {/* Available seats */}
              <div className="space-y-1">
                <div className="w-full h-1 bg-gradient-to-r from-amber-400/80 to-orange-400/60 dark:from-amber-500/60 dark:to-orange-500/40 rounded-full"></div>
                <div className="w-1/2 h-0.5 bg-gradient-to-r from-amber-300/60 to-orange-300/40 dark:from-amber-600/40 dark:to-orange-600/30 rounded-full"></div>
              </div>
            </div>
          </div>
          
          <div className="absolute bottom-40 left-1/3 w-28 h-20 bg-gradient-to-br from-violet-100/90 via-purple-100/70 to-fuchsia-100/60 dark:from-violet-900/40 dark:via-purple-900/30 dark:to-fuchsia-900/20 backdrop-blur-md rounded-xl border border-violet-300/60 dark:border-violet-700/40 shadow-2xl transform rotate-6 hover:rotate-3 transition-all duration-1000 opacity-70">
            <div className="p-3 h-full flex flex-col">
              {/* Course instructor/teacher */}
              <div className="flex-1 flex items-center justify-center mb-2">
                <div className="w-6 h-6 relative">
                  <div className="w-4 h-4 bg-gradient-to-r from-violet-500 to-purple-500 rounded-full mx-auto relative">
                    <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-1 bg-gradient-to-r from-violet-400 to-purple-400 rounded-sm"></div>
                  </div>
                  <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-6 h-2 bg-gradient-to-r from-violet-500 to-purple-500 rounded-t-lg"></div>
                </div>
              </div>
              {/* Instructor info */}
              <div className="space-y-1">
                <div className="w-full h-1 bg-gradient-to-r from-violet-400/80 to-purple-400/60 dark:from-violet-500/60 dark:to-purple-500/40 rounded-full"></div>
                <div className="w-3/4 h-0.5 bg-gradient-to-r from-violet-300/60 to-purple-300/40 dark:from-violet-600/40 dark:to-purple-600/30 rounded-full"></div>
              </div>
            </div>
          </div>
          
          {/* Dynamic learning path network with course-related icons */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{opacity: 0.3}}>
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
                <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.6"/>
              </linearGradient>
            </defs>
            
            {/* Main learning progression path */}
            <path d="M 100 150 Q 300 100 500 200 Q 700 300 900 250" stroke="url(#learningPath1)" strokeWidth="3" fill="none" className="animate-pulse"/>
            
            {/* Branching course paths */}
            <path d="M 200 200 Q 350 150 500 180" stroke="url(#learningPath2)" strokeWidth="2" fill="none" className="animate-pulse" style={{animationDelay: '0.5s'}}/>
            <path d="M 400 250 Q 600 200 800 220" stroke="url(#learningPath3)" strokeWidth="2" fill="none" className="animate-pulse" style={{animationDelay: '1s'}}/>
            
            {/* Course completion checkpoints */}
            <circle cx="200" cy="200" r="8" fill="url(#learningPath1)" className="animate-pulse"/>
            <circle cx="400" cy="180" r="6" fill="url(#learningPath2)" className="animate-pulse" style={{animationDelay: '0.3s'}}/>
            <circle cx="600" cy="220" r="7" fill="url(#learningPath3)" className="animate-pulse" style={{animationDelay: '0.7s'}}/>
            <circle cx="800" cy="250" r="8" fill="url(#learningPath1)" className="animate-pulse" style={{animationDelay: '1.2s'}}/>
            
            {/* Course module connections */}
            <path d="M 150 300 Q 250 280 350 320" stroke="url(#learningPath2)" strokeWidth="1.5" fill="none" className="animate-pulse" style={{animationDelay: '1.5s'}}/>
            <path d="M 450 320 Q 550 300 650 340" stroke="url(#learningPath3)" strokeWidth="1.5" fill="none" className="animate-pulse" style={{animationDelay: '2s'}}/>
            
            {/* Learning milestones */}
            <rect x="120" y="280" width="12" height="12" fill="url(#learningPath1)" className="animate-pulse" style={{animationDelay: '0.8s'}}/>
            <rect x="320" y="300" width="10" height="10" fill="url(#learningPath2)" className="animate-pulse" style={{animationDelay: '1.3s'}}/>
            <rect x="520" y="320" width="11" height="11" fill="url(#learningPath3)" className="animate-pulse" style={{animationDelay: '1.8s'}}/>
            
            {/* Knowledge flow arrows */}
            <path d="M 300 120 L 320 140 L 300 160 M 320 140 L 340 140" stroke="url(#learningPath1)" strokeWidth="2" fill="none" className="animate-pulse" style={{animationDelay: '2.5s'}}/>
            <path d="M 500 180 L 520 200 L 500 220 M 520 200 L 540 200" stroke="url(#learningPath2)" strokeWidth="2" fill="none" className="animate-pulse" style={{animationDelay: '3s'}}/>
            <path d="M 700 240 L 720 260 L 700 280 M 720 260 L 740 260" stroke="url(#learningPath3)" strokeWidth="2" fill="none" className="animate-pulse" style={{animationDelay: '3.5s'}}/>
          </svg>
          
          {/* Floating learning particles */}
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
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20 lg:py-24 relative">
          <div className="max-w-5xl mx-auto">
            
            {/* Badge */}
            <div className="flex justify-center mb-6">
              <div className="inline-flex items-center gap-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm px-4 py-2 rounded-full border border-gray-200 dark:border-gray-700 shadow-sm">
                <div className="flex items-center justify-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  </div>
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  🎓 Live Interactive Classes
                  </span>
                <Star className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            
            {/* Headline */}
            <div className="text-center space-y-4 mb-8">
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black leading-tight tracking-tight">
                <span className="block text-gray-900 dark:text-white">
                  Discover Your Next
                </span>
                <span className="block mt-2 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 dark:from-blue-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
                  Live Class
                </span>
              </h1>
            </div>
            
            {/* Subtitle */}
            <p className="text-center text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto font-medium leading-relaxed mb-10">
              Join interactive classes with expert instructors • Ask questions in real-time • Learn with a community
            </p>
            
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
              <div className="group relative bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-lg transition-all duration-300">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-xl">
                    <BookOpen className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <div className="text-2xl font-black text-gray-900 dark:text-white">{stats.total}+</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">Live Classes</div>
                  </div>
                </div>
              </div>
              
              <div className="group relative bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-600 hover:shadow-lg transition-all duration-300">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-green-50 dark:bg-green-900/30 rounded-xl">
                    <Video className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <div className="text-2xl font-black text-gray-900 dark:text-white">{stats.live}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">Live Now</div>
                  </div>
                </div>
              </div>
              
              <div className="group relative bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 hover:border-pink-300 dark:hover:border-pink-600 hover:shadow-lg transition-all duration-300">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-pink-50 dark:bg-pink-900/30 rounded-xl">
                    <Users className="h-6 w-6 text-pink-600 dark:text-pink-400" />
                  </div>
                  <div>
                    <div className="text-2xl font-black text-gray-900 dark:text-white">{stats.seatsAvailable}+</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">Seats Open</div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Feature Pills */}
            <div className="flex flex-wrap justify-center items-center gap-3 mt-10">
              <div className="flex items-center gap-2 bg-white dark:bg-gray-800 px-4 py-2 rounded-full border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all">
                <Video className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Live Video</span>
              </div>
              <div className="flex items-center gap-2 bg-white dark:bg-gray-800 px-4 py-2 rounded-full border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all">
                <MessageCircle className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Real-time Q&A</span>
              </div>
              <div className="flex items-center gap-2 bg-white dark:bg-gray-800 px-4 py-2 rounded-full border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all">
                <Users className="h-4 w-4 text-pink-600 dark:text-pink-400" />
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Small Classes</span>
              </div>
              <div className="flex items-center gap-2 bg-white dark:bg-gray-800 px-4 py-2 rounded-full border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all">
                <Clock className="h-4 w-4 text-green-600 dark:text-green-400" />
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Flexible Schedule</span>
              </div>
                    </div>
                    
            {/* Social Proof */}
            <div className="text-center pt-8">
              <div className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                <span className="text-sm font-medium">
                  Join <span className="text-gray-900 dark:text-white font-bold">5,000+</span> students learning live
                    </span>
                <Award className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  </div>
                </div>
          </div>
        </div>
      </div>

      {/* Main Content Area with Premium Spacing */}
      <div className="container mx-auto px-4 py-8 md:py-12 relative">



        {/* Search & Filter Section - Clean Design */}
        <div className="space-y-4 mb-8">
          {/* Search & Filter Controls - Clean Card */}
          <Card className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm rounded-2xl overflow-hidden">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row gap-4">
                {/* Search - Clean */}
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 h-5 w-5 z-10" />
                  <Input
                    placeholder="Search by class, instructor, or subject..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-12 h-12 text-base border border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 rounded-xl bg-white dark:bg-gray-700 transition-all duration-300"
                  />
                </div>

                {/* Filter Toggle - Clean Button */}
                <Button
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                  className="h-12 px-6 rounded-xl border border-gray-300 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-300 font-semibold"
                >
                  <Filter className="h-5 w-5 mr-2 transition-transform duration-300" style={{ transform: showFilters ? 'rotate(180deg)' : 'rotate(0deg)' }} />
                  Filters
                  {activeFiltersCount > 0 && (
                    <Badge className="ml-2 h-6 w-6 rounded-full p-0 flex items-center justify-center bg-blue-600 dark:bg-blue-500 text-white shadow-md">
                      {activeFiltersCount}
                    </Badge>
                  )}
                </Button>
              </div>

              {/* Active Filter Chips - Enhanced */}
              {activeFiltersCount > 0 && (
                <div className="flex flex-wrap gap-2 items-center mt-4 pt-4 border-t border-border/50">
                  <span className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                    <Star className="h-4 w-4" />
                    Active filters:
                  </span>
                  {selectedSubjects.map((subject) => (
                    <Badge key={subject} variant="secondary" className="gap-2 px-3 py-1.5 rounded-xl hover:bg-secondary/80 transition-all duration-300 hover:scale-105 shadow-sm">
                      {subject}
                      <X
                        className="h-3.5 w-3.5 cursor-pointer hover:text-destructive transition-colors"
                        onClick={() => handleSubjectChange(subject, false)}
                      />
                    </Badge>
                  ))}
                  {priceRange !== 'all' && (
                    <Badge variant="secondary" className="gap-2 px-3 py-1.5 rounded-xl hover:bg-secondary/80 transition-all duration-300 hover:scale-105 shadow-sm">
                      {priceRange === 'free' ? 'Free Classes' : 'Paid Classes'}
                      <X
                        className="h-3.5 w-3.5 cursor-pointer hover:text-destructive transition-colors"
                        onClick={() => setPriceRange('all')}
                      />
                    </Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="h-8 px-4 text-xs font-semibold rounded-xl hover:bg-destructive/10 hover:text-destructive transition-all duration-300"
                  >
                    Clear all
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Filters Panel - Clean Expanded Design */}
          {showFilters && (
            <Card className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm rounded-2xl overflow-hidden animate-in slide-in-from-top duration-300">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {/* Subjects - Enhanced */}
                  <div className="space-y-4">
                    <Label className="text-lg font-bold mb-4 flex items-center gap-3 text-foreground">
                      <div className="p-2 bg-primary/10 rounded-xl">
                        <BookOpen className="h-5 w-5 text-primary" />
                      </div>
                      Subjects
                    </Label>
                    <ScrollArea className="h-56 pr-4">
                      <div className="space-y-3">
                        {allSubjects.map((subject) => (
                          <div key={subject} className="flex items-center space-x-3 p-2 rounded-xl hover:bg-accent/50 transition-all duration-300 group">
                            <Checkbox
                              id={subject}
                              checked={selectedSubjects.includes(subject)}
                              onCheckedChange={(checked) => handleSubjectChange(subject, checked)}
                              className="border-2 group-hover:border-primary transition-colors"
                            />
                            <Label
                              htmlFor={subject}
                              className="text-sm font-medium cursor-pointer leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 group-hover:text-primary transition-colors"
                            >
                              {subject}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>

                  {/* Price - Enhanced */}
                  <div className="space-y-4">
                    <Label className="text-lg font-bold mb-4 flex items-center gap-3 text-foreground">
                      <div className="p-2 bg-secondary/10 rounded-xl">
                        <DollarSign className="h-5 w-5 text-secondary" />
                      </div>
                      Price Range
                    </Label>
                    <Select value={priceRange} onValueChange={(v) => setPriceRange(v)}>
                      <SelectTrigger className="h-14 border-2 rounded-2xl hover:border-secondary transition-all duration-300 shadow-sm">
                        <SelectValue placeholder="All Classes" />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl">
                        <SelectItem value="all" className="rounded-xl">All Classes</SelectItem>
                        <SelectItem value="free" className="rounded-xl">Free Classes Only</SelectItem>
                        <SelectItem value="paid" className="rounded-xl">Paid Classes Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Sort - Enhanced */}
                  <div className="space-y-4">
                    <Label className="text-lg font-bold mb-4 flex items-center gap-3 text-foreground">
                      <div className="p-2 bg-accent/10 rounded-xl">
                        <ArrowUpDown className="h-5 w-5 text-accent" />
                      </div>
                      Sort By
                    </Label>
                    <Select value={sortBy} onValueChange={(v) => setSortBy(v)}>
                      <SelectTrigger className="h-14 border-2 rounded-2xl hover:border-accent transition-all duration-300 shadow-sm">
                        <SelectValue placeholder="Next Session" />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl">
                        <SelectItem value="next-session" className="rounded-xl">Next Session First</SelectItem>
                        <SelectItem value="seats-available" className="rounded-xl">Most Seats Available</SelectItem>
                        <SelectItem value="popular" className="rounded-xl">Most Popular</SelectItem>
                        <SelectItem value="newest" className="rounded-xl">Newest First</SelectItem>
                        <SelectItem value="price-low" className="rounded-xl">Price: Low to High</SelectItem>
                        <SelectItem value="price-high" className="rounded-xl">Price: High to Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Results Count - Clean Design */}
        <div className="flex items-center gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 rounded-xl">
              <BookOpen className="h-5 w-5 text-primary" />
            </div>
            <p className="text-lg font-semibold">
              <span className="text-2xl font-black text-primary">{filteredCourses.length}</span>
              <span className="text-muted-foreground ml-2">live classes available</span>
            </p>
          </div>
        </div>

        {/* Courses Grid - Premium Layout */}
        {filteredCourses.length > 0 ? (
          <div className="grid gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {filteredCourses.map((course) => (
              <LiveCourseCard
                key={course.id}
                course={course}
                onEnroll={handleEnroll}
                liveSessions={liveSessions}
              />
            ))}
          </div>
        ) : (
          <Card className="bg-gradient-to-br from-muted/30 via-muted/20 to-transparent backdrop-blur-sm shadow-xl rounded-3xl border-2 border-dashed border-muted/50">
            <CardContent className="p-16 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-muted/50 to-muted/30 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Calendar className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-foreground">No live classes found</h3>
              <p className="text-muted-foreground mb-8 text-lg max-w-md mx-auto">
                Try adjusting your search terms or filters to discover more classes
              </p>
              {activeFiltersCount > 0 && (
                <Button 
                  onClick={clearFilters}
                  className="h-12 px-8 rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                >
                  Clear All Filters
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Professional CTA Section for Custom Course Request */}
        {!ctaDismissed && (
          <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
            {/* Professional Info Card - Desktop Only */}
            <div className="hidden md:block">
              <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg max-w-xs">
                <CardContent className="p-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    <div>
                      <p className="font-medium text-sm text-gray-900 dark:text-white">Need a custom class?</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Response in 10 minutes</p>
                    </div>
                  </div>
                  <Button
                    onClick={dismissCTA}
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Professional CTA Button - Mobile with dismiss, Desktop without */}
            <div className="relative">
              <Button
                onClick={() => setShowCustomCourseDialog(true)}
                className="h-12 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm group"
              >
                <FileText className="h-4 w-4 mr-2" />
                <span className="md:block">Request Custom Class</span>
                <span className="hidden md:inline">
                  <ChevronRight className="h-4 w-4 ml-2 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </Button>
              
              {/* Mobile Dismiss Button */}
              <Button
                onClick={dismissCTA}
                variant="ghost"
                size="sm"
                className="md:hidden absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-md hover:bg-gray-100 dark:hover:bg-gray-700 z-10"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        )}

        {/* Custom Course Request Dialog */}
        <CustomCourseRequestDialog 
          open={showCustomCourseDialog}
          onOpenChange={setShowCustomCourseDialog}
        />
      </div>
    </div>
  )
}
