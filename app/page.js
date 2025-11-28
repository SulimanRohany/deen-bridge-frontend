'use client'

/* eslint-disable react/no-unescaped-entities, @next/next/no-img-element */

import { useContext, useEffect, useState, useMemo, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import AuthContext from '@/context/AuthContext'
import CoursePlaceholder from '@/components/CoursePlaceholder'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  IconBook, 
  IconVideo, 
  IconCalendar,
  IconCertificate,
  IconArrowRight,
  IconPlayerPlay,
  IconBook2,
  IconUsers,
  IconTrendingUp,
  IconClock,
  IconStar,
  IconFlame,
  IconTarget,
  IconChevronRight,
  IconBookmark,
  IconTrophy,
  IconSparkles,
  IconAward,
  IconRocket,
  IconCheck as IconCheckbox,
  IconHeart,
  IconBolt,
  IconShield,
  IconInfinity,
  IconDeviceDesktop,
  IconWorld,
  IconBrandZoom,
  IconMessages,
  IconChartBar,
  IconQuote,
  IconStarFilled,
  IconChevronDown,
  IconPlus,
  IconMinus,
  IconMoon,
  IconBuildingCastle,
  IconHandStop,
  IconCheck,
  IconCode,
  IconBulb,
  IconConfetti,
  IconDownload,
  IconEye,
  IconHeadphones,
  IconSchool,
  IconSparkles as IconStar2,
  IconChartLine,
} from '@tabler/icons-react'
import { enrollmentAPI, courseAPI } from '@/lib/api'
import { config, getMediaUrl } from '@/lib/config'

function toArray(v) {
  // Axios returns data in response.data
  const data = v?.data || v
  
  if (Array.isArray(data)) {
    return data
  }
  if (data && Array.isArray(data.results)) {
    return data.results
  }
  return []
}

// Custom cursor effect
function CustomCursor() {
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isPointer, setIsPointer] = useState(false)

  useEffect(() => {
    const handleMouseMove = (e) => {
      setPosition({ x: e.clientX, y: e.clientY })
      
      const target = e.target
      setIsPointer(
        window.getComputedStyle(target).cursor === 'pointer' ||
        target.tagName === 'BUTTON' ||
        target.tagName === 'A'
      )
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  return (
    <>
      <div
        className="custom-cursor"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          transform: `translate(-50%, -50%) scale(${isPointer ? 1.5 : 1})`
        }}
      />
      <div
        className="custom-cursor-dot"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`
        }}
      />
    </>
  )
}

// Magnetic Button Component
function MagneticButton({ children, onClick, variant = 'default', size = 'lg', className = '', ...props }) {
  const buttonRef = useRef(null)
  const [position, setPosition] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const button = buttonRef.current
    if (!button) return

    const handleMouseMove = (e) => {
      const rect = button.getBoundingClientRect()
      const x = e.clientX - rect.left - rect.width / 2
      const y = e.clientY - rect.top - rect.height / 2
      
      const distance = Math.sqrt(x * x + y * y)
      const maxDistance = 100

      if (distance < maxDistance) {
        const strength = (maxDistance - distance) / maxDistance
        setPosition({
          x: x * strength * 0.3,
          y: y * strength * 0.3
        })
      }
    }

    const handleMouseLeave = () => {
      setPosition({ x: 0, y: 0 })
    }

    button.addEventListener('mousemove', handleMouseMove)
    button.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      button.removeEventListener('mousemove', handleMouseMove)
      button.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [])

  return (
    <div ref={buttonRef} className="relative inline-block">
      <Button
        variant={variant}
        size={size}
        onClick={onClick}
        className={className}
        style={{
          transform: `translate(${position.x}px, ${position.y}px)`,
          transition: 'transform 0.2s ease-out'
        }}
        {...props}
      >
        {children}
      </Button>
    </div>
  )
}


// Live Activity Feed
function LiveActivityFeed() {
  const activities = [
    { name: 'Ahmed K.', action: 'enrolled in Quran Tafseer', time: '2m ago', location: 'Dubai' },
    { name: 'Fatima S.', action: 'completed Islamic History', time: '5m ago', location: 'London' },
    { name: 'Yusuf M.', action: 'earned a certificate', time: '8m ago', location: 'New York' },
    { name: 'Aisha R.', action: 'started Arabic Course', time: '12m ago', location: 'Toronto' }
  ]

  const [currentIndex, setCurrentIndex] = useState(0)
  const activitiesCount = activities.length

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activitiesCount)
    }, 3000)
    return () => clearInterval(interval)
  }, [activitiesCount])

  return (
    <div className="overflow-hidden bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-lg">
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
            <span className="text-white font-semibold text-sm">{activities[currentIndex].name.charAt(0)}</span>
          </div>
          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-slate-900 animate-pulse" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
            {activities[currentIndex].name}
          </p>
          <p className="text-xs text-slate-600 dark:text-slate-400 truncate">
            {activities[currentIndex].action}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-500 dark:text-slate-500">{activities[currentIndex].time}</p>
          <p className="text-xs text-slate-400 dark:text-slate-600">{activities[currentIndex].location}</p>
        </div>
      </div>
    </div>
  )
}

// Scroll Animation Hook
function useScrollAnimation() {
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      {
        threshold: 0.1,
        rootMargin: '0px'
      }
    )

    const currentRef = ref.current

    if (currentRef) {
      observer.observe(currentRef)
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef)
      }
    }
  }, [])

  return [ref, isVisible]
}

// Animated Counter Component
function AnimatedCounter({ end, duration = 2000, suffix = '' }) {
  const [count, setCount] = useState(0)
  const [hasAnimated, setHasAnimated] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true)
          const startTime = Date.now()
          const endValue = typeof end === 'string' ? parseFloat(end) : end

          const updateCount = () => {
            const now = Date.now()
            const progress = Math.min((now - startTime) / duration, 1)
            const easeOutQuad = progress * (2 - progress)
            const current = Math.floor(easeOutQuad * endValue)
            
            setCount(current)

            if (progress < 1) {
              requestAnimationFrame(updateCount)
            } else {
              setCount(endValue)
            }
          }

          requestAnimationFrame(updateCount)
        }
      },
      { threshold: 0.5 }
    )

    const currentRef = ref.current

    if (currentRef) {
      observer.observe(currentRef)
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef)
      }
    }
  }, [end, duration, hasAnimated])

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>
}

// Floating Animation Component
function FloatingElement({ children, delay = 0, duration = 3 }) {
  return (
    <div
      className="animate-float"
      style={{
        animationDelay: `${delay}s`,
        animationDuration: `${duration}s`
      }}
    >
      {children}
              </div>
  )
}

// Stunning 3D Quran - Branded Colors & Ultra Elegant
function AnimatedQuranIllustration() {
  const [hovered, setHovered] = useState(false)
  const [rotation, setRotation] = useState({ x: 0, y: 0 })
  
  // Add parallax effect on mouse move
  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = (e.clientX - rect.left - rect.width / 2) / rect.width
    const y = (e.clientY - rect.top - rect.height / 2) / rect.height
    setRotation({ x: y * 10, y: x * 10 })
  }
  
  const handleMouseLeave = () => {
    setRotation({ x: 0, y: 0 })
  }
  
  return (
    <div 
      className="relative w-full h-full flex items-start justify-center pt-8"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* Enhanced Branded Ambient Lighting with rotation */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div 
          className="w-[600px] h-[600px] bg-gradient-to-br from-primary/15 via-secondary/10 to-primary/15 dark:from-primary/8 dark:via-secondary/5 dark:to-primary/8 rounded-full blur-3xl animate-pulse-glow"
          style={{
            animationName: 'pulse-glow, spin-slow',
            animationDuration: '4s, 20s',
            animationTimingFunction: 'ease-in-out, linear',
            animationIterationCount: 'infinite, infinite'
          }}
        />
        <div 
          className="absolute w-[400px] h-[400px] bg-gradient-to-br from-slate-600/10 via-slate-700/8 to-slate-800/10 dark:from-slate-400/5 dark:via-slate-500/4 dark:to-slate-600/5 rounded-full blur-2xl"
          style={{
            animationName: 'spin-slow',
            animationDuration: '15s',
            animationTimingFunction: 'linear',
            animationIterationCount: 'infinite',
            animationDirection: 'reverse'
          }}
        />
      </div>


      {/* Main 3D Quran Container with enhanced parallax */}
      <div 
        className="relative z-10 transform transition-all duration-700"
        style={{
          transform: `
            translateY(${hovered ? -10 : 0}px) 
            scale(${hovered ? 1.02 : 1})
            rotateX(${rotation.x}deg)
            rotateY(${rotation.y}deg)
          `,
          transformStyle: 'preserve-3d',
          animationName: 'gentle-float',
          animationDuration: '6s',
          animationTimingFunction: 'ease-in-out',
          animationIterationCount: 'infinite'
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        
        {/* 3D Quran Book */}
        <div className="relative" style={{ perspective: '1200px' }}>
          
          {/* Professional Modern Quran Cover */}
          <div 
            className="relative w-[340px] h-[460px] shadow-2xl overflow-hidden"
            style={{
              borderRadius: '12px',
              transform: 'translateZ(40px)',
              transformStyle: 'preserve-3d',
              background: 'linear-gradient(135deg, #1a365d 0%, #2d3748 50%, #1a202c 100%)',
              boxShadow: `
                0 25px 50px -12px rgba(0, 0, 0, 0.8),
                0 0 0 1px rgba(255, 255, 255, 0.1),
                inset 0 1px 0 rgba(255, 255, 255, 0.1),
                inset 0 -1px 0 rgba(0, 0, 0, 0.2)
              `,
              zIndex: 10
            }}
          >
            
            {/* Professional Subtle Texture */}
            <div className="absolute inset-0 opacity-30">
              <div className="w-full h-full" style={{
                backgroundImage: `
                  radial-gradient(circle at 20% 20%, rgba(255,255,255,0.05) 0%, transparent 50%),
                  radial-gradient(circle at 80% 80%, rgba(255,255,255,0.03) 0%, transparent 50%),
                  linear-gradient(135deg, rgba(255,255,255,0.02) 0%, transparent 50%)
                `,
                backgroundSize: '200% 200%, 150% 150%, 100% 100%'
              }} />
            </div>

            {/* Professional Grid Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="w-full h-full" style={{
                backgroundImage: `
                  linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
                `,
                backgroundSize: '40px 40px'
              }} />
            </div>

            {/* Professional Islamic Geometric Pattern */}
            <div className="absolute inset-0 opacity-8">
              <svg className="w-full h-full" viewBox="0 0 340 460">
                <defs>
                  <pattern id="professional-pattern" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
                    {/* Clean Geometric Design */}
                    <circle cx="30" cy="30" r="25" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />
                    <circle cx="30" cy="30" r="15" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="0.3" />
                    <circle cx="30" cy="30" r="8" fill="rgba(255,255,255,0.05)" />
                    <path d="M 30 10 L 30 50 M 10 30 L 50 30" stroke="rgba(255,255,255,0.06)" strokeWidth="0.3" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#professional-pattern)" />
              </svg>
            </div>

            {/* Professional Clean Borders */}
            <div className="absolute inset-4 rounded-lg" style={{
              border: '2px solid rgba(255, 255, 255, 0.2)',
              boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.1), inset 0 -1px 2px rgba(0,0,0,0.2)'
            }} />
            <div className="absolute inset-6 border border-white/10 rounded-lg" />
            <div className="absolute inset-8 border border-white/5 rounded" />

            {/* Professional Header Section */}
            <div className="absolute top-8 left-1/2 transform -translate-x-1/2 text-center w-[85%]">
              <div className="relative">
                {/* Clean Professional Frame */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent rounded-lg" 
                     style={{
                       boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.1), inset 0 -1px 2px rgba(0,0,0,0.2)'
                     }} />
                
                {/* Top Border Line */}
                <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                
                {/* Bismillah Text - Professional */}
                <div 
                  className="text-xl font-medium py-3 px-4 relative z-10 text-white/90"
                  style={{ 
                    fontFamily: "'Amiri', serif",
                    textShadow: '0 1px 3px rgba(0,0,0,0.5)',
                    letterSpacing: '0.02em'
                  }}>
                  بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                </div>
                
                {/* Bottom Border Line */}
                <div className="absolute bottom-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
              </div>
            </div>

            {/* Center Traditional Islamic Design */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative">
                
                {/* Professional Islamic Symbol */}
                <div className="relative w-48 h-48">
                  
                  {/* Clean Professional Frame */}
                  <div className="absolute inset-0 rounded-full" 
                       style={{ 
                         border: '3px solid rgba(255, 255, 255, 0.3)',
                         boxShadow: `
                           inset 0 2px 4px rgba(255,255,255,0.1),
                           inset 0 -2px 4px rgba(0,0,0,0.2),
                           0 0 20px rgba(255, 255, 255, 0.1)
                         `,
                         background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.05), transparent 70%)'
                       }} />
                  
                  {/* Middle Ring */}
                  <div className="absolute inset-4 border border-white/20 rounded-full" />
                  
                  {/* Professional Decorative Elements */}
                  {[...Array(12)].map((_, i) => {
                    const angle = (i * 360) / 12;
                    const radius = 85;
                    const x = Math.cos((angle * Math.PI) / 180) * radius;
                    const y = Math.sin((angle * Math.PI) / 180) * radius;
                    return (
                      <div
                        key={i}
                        className="absolute w-1.5 h-1.5 rounded-full"
                        style={{
                          left: '50%',
                          top: '50%',
                          transform: `translate(${x}px, ${y}px) translate(-50%, -50%)`,
                          background: 'rgba(255, 255, 255, 0.6)',
                          boxShadow: '0 0 4px rgba(255,255,255,0.3)'
                        }}
                      />
                    );
                  })}
                  
                  {/* Inner Frame */}
                  <div className="absolute inset-8 border border-white/15 rounded-full" />
                  
                  {/* Center Islamic Art */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="relative">
                      
                      {/* Professional Islamic Symbol */}
                      <svg viewBox="0 0 140 140" className="w-28 h-28">
                        <defs>
                          <linearGradient id="professionalGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
                            <stop offset="50%" stopColor="#e2e8f0" stopOpacity="0.7" />
                            <stop offset="100%" stopColor="#cbd5e0" stopOpacity="0.5" />
                          </linearGradient>
                        </defs>
                        
                        {/* Professional Islamic Star */}
                        <polygon points="70,10 76,30 96,30 80,44 86,64 70,52 54,64 60,44 44,30 64,30" 
                                 fill="url(#professionalGradient)" 
                                 stroke="rgba(255,255,255,0.3)" 
                                 strokeWidth="1" />
                        
                        {/* Clean Circle Layers */}
                        <circle cx="70" cy="70" r="25" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
                        <circle cx="70" cy="70" r="18" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
                        <circle cx="70" cy="70" r="12" fill="rgba(255,255,255,0.1)" />
                        
                        {/* Center Circle */}
                        <circle cx="70" cy="70" r="6" fill="rgba(255,255,255,0.2)" />
                        <circle cx="70" cy="70" r="3" fill="rgba(255,255,255,0.4)" />
                      </svg>
                      
                      {/* Professional Glow Effects */}
                      <div className="absolute inset-0 bg-white/10 rounded-full blur-xl" />
                      <div className="absolute inset-4 bg-white/5 rounded-full blur-lg" />
                    </div>
                  </div>
                </div>
                
                {/* Professional Quran Title */}
                <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 text-center w-full px-6">
                  <div className="relative">
                    {/* Clean Background Frame */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent rounded-lg -mx-2 -my-1" />
                    
                    {/* Main Arabic Title - Professional */}
                    <div 
                      className="text-4xl font-bold mb-3 tracking-wide relative z-10 text-white/95" 
                       style={{ 
                         fontFamily: "'Amiri', serif",
                        textShadow: '0 2px 4px rgba(0,0,0,0.6)',
                        letterSpacing: '0.01em'
                       }}>
                    القرآن الكريم
                  </div>
                    
                    {/* Professional Divider */}
                    <div className="flex items-center justify-center gap-3 mb-2">
                      <div className="h-px w-12 bg-gradient-to-r from-transparent via-white/40 to-transparent" />
                      <div className="w-2 h-2 rounded-full bg-white/60" />
                      <div className="h-px w-12 bg-gradient-to-l from-transparent via-white/40 to-transparent" />
                    </div>
                    
                    {/* English Transliteration - Clean */}
                    <div className="text-base font-medium text-white/80 tracking-[0.25em] uppercase mb-2">
                    AL-QUR'AN AL-KAREEM
                  </div>
                  
                    {/* Subtitle - Professional */}
                    <div className="text-sm text-white/70 tracking-[0.2em] font-medium">
                    THE HOLY QURAN
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Professional Corner Accents */}
            {/* Top-Left Corner */}
            <div className="absolute top-4 left-4 w-6 h-6">
              <div className="w-full h-full border-l-2 border-t-2 border-white/30 rounded-tl" />
            </div>
            
            {/* Top-Right Corner */}
            <div className="absolute top-4 right-4 w-6 h-6">
              <div className="w-full h-full border-r-2 border-t-2 border-white/30 rounded-tr" />
            </div>
            
            {/* Bottom-Left Corner */}
            <div className="absolute bottom-4 left-4 w-6 h-6">
              <div className="w-full h-full border-l-2 border-b-2 border-white/30 rounded-bl" />
            </div>
            
            {/* Bottom-Right Corner */}
            <div className="absolute bottom-4 right-4 w-6 h-6">
              <div className="w-full h-full border-r-2 border-b-2 border-white/30 rounded-br" />
            </div>

            {/* Professional Edge Accents */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
            <div className="absolute left-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-white/40 to-transparent" />
            <div className="absolute right-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-white/40 to-transparent" />

            {/* Professional Subtle Shine */}
            <div 
              className="absolute inset-0 opacity-40 pointer-events-none"
              style={{
                background: `
                  linear-gradient(135deg, rgba(255,255,255,0.05) 0%, transparent 50%, rgba(255,255,255,0.03) 100%)
                `,
                animationName: 'shimmer',
                animationDuration: '20s',
                animationTimingFunction: 'ease-in-out',
                animationIterationCount: 'infinite'
              }}
            />
            
            {/* Professional Lighting */}
            <div 
              className="absolute inset-0 opacity-30 pointer-events-none rounded-xl"
              style={{
                background: 'radial-gradient(ellipse at 40% 30%, rgba(255,255,255,0.08) 0%, transparent 60%)'
              }}
            />
          </div>

          {/* 3D Book Spine - Premium Leather */}
          <div 
            className="absolute left-0 top-0 w-12 h-full rounded-l-2xl"
            style={{
              background: 'linear-gradient(to right, #0c4a2d 0%, #064e3b 30%, #065f46 50%, #064e3b 70%, #0c4a2d 100%)',
              transform: 'rotateY(-90deg) translateZ(6px)',
              transformOrigin: 'right',
              boxShadow: 'inset -5px 0 10px rgba(0,0,0,0.4), inset 2px 0 6px rgba(255,255,255,0.05)'
            }}
          >
            <div className="h-full flex flex-col items-center justify-center gap-4 text-white/70">
              <div className="writing-mode-vertical text-xs tracking-widest font-medium" style={{ 
                fontFamily: "'Amiri', serif",
                textShadow: '0 1px 2px rgba(0,0,0,0.5), 0 0 8px rgba(255,255,255,0.2)'
              }}>
                القرآن الكريم
              </div>
              <div className="w-1 h-8 rounded-full" style={{
                background: 'linear-gradient(to bottom, rgba(255,255,255,0.4), rgba(255,255,255,0.6), rgba(255,255,255,0.4))',
                boxShadow: '0 0 4px rgba(255,255,255,0.3)'
              }} />
              <div className="w-0.5 h-4 bg-white/30 rounded-full" />
            </div>
          </div>

          {/* Professional Bookmark */}
          <div 
            className="absolute top-0 left-1/2 w-6 h-full pointer-events-none"
            style={{
              transform: 'translateX(-50%) translateZ(45px)',
              transformStyle: 'preserve-3d'
            }}
          >
            {/* Main Ribbon */}
            <div 
              className="absolute top-0 left-1/2 w-6 h-[120%] -translate-x-1/2"
              style={{
                background: 'linear-gradient(to bottom, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.6) 85%, transparent 100%)',
                boxShadow: '0 0 10px rgba(255,255,255,0.3), inset 0 1px 2px rgba(255,255,255,0.4), inset 0 -1px 2px rgba(0,0,0,0.2)',
                clipPath: 'polygon(0 0, 100% 0, 100% 95%, 50% 88%, 0 95%)',
                animationName: 'gentle-sway',
                animationDuration: '4s',
                animationTimingFunction: 'ease-in-out',
                animationIterationCount: 'infinite'
              }}
            >
              {/* Ribbon shine */}
              <div 
                className="absolute inset-0 opacity-30"
                style={{
                  background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)',
                  animationName: 'shimmer',
                  animationDuration: '3s',
                  animationTimingFunction: 'ease-in-out',
                  animationIterationCount: 'infinite'
                }}
              />
            </div>
            
            {/* Ribbon glow */}
            <div 
              className="absolute top-0 left-1/2 w-8 h-full -translate-x-1/2 blur-xl"
              style={{
                background: 'linear-gradient(to bottom, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.1) 70%, transparent 100%)',
                animationName: 'pulse-particle',
                animationDuration: '3s',
                animationTimingFunction: 'ease-in-out',
                animationIterationCount: 'infinite'
              }}
            />
          </div>

          {/* 3D Page Layers - White pages behind the cover */}
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="absolute inset-y-2 right-1 rounded-r-xl shadow-sm overflow-hidden"
              style={{
                width: `${338 - i * 0.5}px`,
                height: `${456 - i * 0.5}px`,
                background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 50%, #e2e8f0 100%)',
                transform: `translateX(-${i * 0.3}px) translateZ(${35 - i * 3}px)`,
                opacity: 1 - i * 0.06,
                borderRight: '1px solid rgba(148, 163, 184, 0.3)',
                zIndex: -1
              }}
            >
              {/* Simple page text lines for realistic book appearance */}
              <div className="p-6 space-y-3 opacity-40">
                {[...Array(Math.floor(Math.random() * 3) + 8)].map((_, lineIdx) => (
                  <div 
                    key={lineIdx}
                    className="h-2 bg-slate-400 dark:bg-slate-600 rounded"
                    style={{
                      width: `${Math.random() * 20 + 75}%`,
                      marginLeft: 'auto',
                      marginRight: '0'
                    }}
                  />
                ))}
                  </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}

// Premium Hero Illustration
function PremiumHeroIllustration() {
  return (
    <div className="relative w-full h-full min-h-[500px]">
      {/* Main dashboard mockup */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative w-full max-w-2xl">
          {/* Browser window */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            {/* Browser header */}
            <div className="bg-slate-100 dark:bg-slate-800 p-3 flex items-center gap-2 border-b border-slate-200 dark:border-slate-700">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
                    </div>
              <div className="flex-1 bg-white dark:bg-slate-900 rounded-lg px-3 py-1 text-xs text-slate-500 dark:text-slate-400">
                deenbridge.com/courses
                  </div>
                </div>
                
            {/* Content */}
            <div className="p-6 space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="h-8 w-32 bg-gradient-to-r from-primary to-blue-600 rounded-lg animate-pulse" />
                <div className="h-8 w-8 bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse" />
                </div>
                
              {/* Course cards */}
              <div className="grid grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="group hover:scale-105 transition-transform">
                    <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-4 space-y-3 border border-slate-200 dark:border-slate-700">
                      <div className="w-full h-20 bg-gradient-to-br from-primary to-blue-600 rounded-lg animate-pulse" style={{ animationDelay: `${i * 0.1}s` }} />
                      <div className="space-y-2">
                        <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" style={{ animationDelay: `${i * 0.15}s` }} />
                        <div className="h-3 w-3/4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" style={{ animationDelay: `${i * 0.2}s` }} />
                    </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>

          {/* Floating elements */}
          <FloatingElement delay={0} duration={3}>
            <div className="absolute -top-10 -right-10 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-4 border border-slate-200 dark:border-slate-800 z-10">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
                  <IconCheck className="h-6 w-6 text-white" />
            </div>
                <div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white">Enrolled!</div>
                  <div className="text-xs text-slate-600 dark:text-slate-400">Quran Course</div>
            </div>
          </div>
                    </div>
          </FloatingElement>

          <FloatingElement delay={1} duration={3.5}>
            <div className="absolute -bottom-10 -left-10 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-4 border border-slate-200 dark:border-slate-800 z-10">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                  <IconTrophy className="h-6 w-6 text-white" />
                      </div>
                <div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white">Certificate</div>
                  <div className="text-xs text-slate-600 dark:text-slate-400">Well done!</div>
                    </div>
                    </div>
                    </div>
          </FloatingElement>

          <FloatingElement delay={0.5} duration={4}>
            <div className="absolute top-1/2 -right-20 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-3 border border-slate-200 dark:border-slate-800 z-10">
              <div className="flex items-center gap-2">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <IconStarFilled key={i} className="h-4 w-4 text-amber-400" />
                  ))}
                      </div>
                <span className="text-xs font-semibold text-slate-900 dark:text-white">5.0</span>
                    </div>
                  </div>
          </FloatingElement>
            </div>
          </div>
        </div>
  )
}

// Interactive Feature Card
function InteractiveFeatureCard({ icon: Icon, title, description, gradient, stats, index }) {
  const [ref, isVisible] = useScrollAnimation()
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div
      ref={ref}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`group relative transition-all duration-700 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
      }`}
      style={{ transitionDelay: `${index * 0.1}s` }}
    >
      <div className="absolute -inset-0.5 bg-gradient-to-r from-primary via-blue-600 to-primary opacity-0 group-hover:opacity-20 transition duration-500 blur-xl rounded-3xl" />
      <Card className="relative h-full border-2 border-slate-200 dark:border-slate-800 hover:border-primary/50 dark:hover:border-primary/50 transition-all duration-500 hover:shadow-2xl overflow-hidden group-hover:-translate-y-2 bg-white dark:bg-slate-900">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        <CardHeader className="space-y-6 pb-8 pt-10 relative z-10">
          <div className={`w-20 h-20 bg-gradient-to-br ${gradient} rounded-3xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-2xl relative`}>
            <Icon className="h-10 w-10 text-white relative z-10" />
            <div className="absolute inset-0 bg-white/20 rounded-3xl transform scale-0 group-hover:scale-100 transition-transform duration-500" />
                </div>
                
          <div className="space-y-4">
            <CardTitle className="text-2xl font-bold group-hover:text-primary transition-colors">
              {title}
            </CardTitle>
            <CardDescription className="text-base leading-relaxed text-slate-600 dark:text-slate-400">
              {description}
                  </CardDescription>
                  </div>
                  
          {stats && (
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                <span className="text-2xl font-bold">{stats}</span>
                <IconTrendingUp className="h-5 w-5" />
                    </div>
                  </div>
          )}
                  </CardHeader>
                </Card>
            </div>
  )
}

// Premium Stats Card
function PremiumStatsCard({ icon: Icon, value, label, gradient, index }) {
  const [ref, isVisible] = useScrollAnimation()

  return (
    <div
      ref={ref}
      className={`group relative transition-all duration-700 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
      }`}
      style={{ transitionDelay: `${index * 0.1}s` }}
    >
      <div className="absolute -inset-0.5 bg-gradient-to-r opacity-0 group-hover:opacity-30 transition duration-500 blur-xl rounded-3xl" style={{ background: `linear-gradient(to right, ${gradient})` }} />
      <div className="relative p-8 rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border-2 border-slate-200/50 dark:border-slate-800/50 hover:border-primary/50 dark:hover:border-primary/50 transition-all duration-500 hover:shadow-2xl hover:-translate-y-2">
        <div className="space-y-4">
          <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-500`} style={{ background: `linear-gradient(to bottom right, ${gradient})` }}>
            <Icon className="h-8 w-8 text-white" />
                  </div>
          <div className="space-y-2">
            <div className="text-5xl font-black bg-gradient-to-br from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
              {value}
                </div>
            <div className="text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
              {label}
              </div>
                  </div>
                </div>
              </div>
                  </div>
  )
}

// Helper component for session countdown
function SessionCountdown({ session }) {
  const [timeUntil, setTimeUntil] = useState('')

  useEffect(() => {
    if (!session?.timetable?.date || !session?.timetable?.start_time) return

    const updateCountdown = () => {
      const sessionDateTime = new Date(`${session.timetable.date}T${session.timetable.start_time}`)
      const now = new Date()
      const diff = sessionDateTime - now

      if (diff <= 0) {
        setTimeUntil('Starting soon!')
        return
      }

      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const days = Math.floor(hours / 24)

      if (days > 0) {
        setTimeUntil(`Starts in ${days}d ${hours % 24}h`)
      } else if (hours > 0) {
        setTimeUntil(`Starts in ${hours}h ${minutes}m`)
      } else {
        setTimeUntil(`Starts in ${minutes}m`)
      }
    }

    updateCountdown()
    const interval = setInterval(updateCountdown, 60000)

    return () => clearInterval(interval)
  }, [session])

  if (!timeUntil || session?.status === 'live') return null

  return (
    <Badge variant="secondary" className="text-xs font-medium">
      <IconClock className="h-3 w-3 mr-1" />
      {timeUntil}
              </Badge>
  )
}

export default function Home() {
  const { userData } = useContext(AuthContext)
  const router = useRouter()
  const [enrollments, setEnrollments] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [scrollY, setScrollY] = useState(0)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  // Parallax and mouse tracking
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY)
    }
    
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }
    
    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('mousemove', handleMouseMove, { passive: true })
    
    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('mousemove', handleMouseMove)
    }
  }, [])

  // Load student data function - wrapped in useCallback
  const loadStudentData = useCallback(async (forceRefresh = false) => {
    try {
      setIsLoading(true)
      setError(null)
      
      if (!userData?.id) {
        setIsLoading(false)
        return
      }
      
      const enrollmentsData = await enrollmentAPI.getEnrollments({ student: userData.id })
      const enrollmentsArray = toArray(enrollmentsData.data)
      
      if (enrollmentsArray.length === 0) {
        setEnrollments([])
        setIsLoading(false)
        return
      }
      
      const enrichedEnrollments = await Promise.all(
        enrollmentsArray.map(async (enrollment) => {
          try {
            // The backend serializer already provides class_data with full course details
            // Handle both class_enrolled (ID) and class_data (full object)
            const courseId = enrollment.class_enrolled || enrollment.course_id || enrollment.course || enrollment.timetable?.course || enrollment.timetable_data?.course?.id
            
            if (!courseId) {
              return enrollment
            }
            
            // Check if we already have class_data from the serializer
            let courseDetails
            if (enrollment.class_data) {
              courseDetails = enrollment.class_data
            } else {
              const courseResponse = await courseAPI.getCourseById(courseId)
              courseDetails = courseResponse.data
            }
            
            // Fetch live sessions for this course
            try {
              const sessionsResponse = await courseAPI.getLiveSessions({ course: courseId })
              const sessions = toArray(sessionsResponse.data)
              
              // Filter for upcoming sessions (scheduled or live status)
              const now = new Date()
              const upcomingSessions = sessions.filter(session => {
                // Only show scheduled or live sessions
                return session.status === 'scheduled' || session.status === 'live'
              })
              
              courseDetails.upcoming_sessions = upcomingSessions
            } catch (sessionErr) {
              courseDetails.upcoming_sessions = []
            }
            
            return { ...enrollment, courseDetails, course: courseId }
          } catch (err) {
            return enrollment
          }
        })
      )
      
      setEnrollments(enrichedEnrollments)
    } catch (err) {
      setError('Failed to load your learning data. Please try refreshing the page.')
    } finally {
      setIsLoading(false)
    }
  }, [userData])

  useEffect(() => {
    if (userData?.id) {
      // Only load if we haven't loaded enrollments yet (empty array means not loaded)
      // Don't check isLoading because it starts as true and we want to load on first render
      if (enrollments.length === 0) {
        loadStudentData()
        
        // Safety timeout: force loading to false after 10 seconds
        const timeout = setTimeout(() => {
          setIsLoading(false)
        }, 10000)
        
        return () => clearTimeout(timeout)
      } else if (enrollments.length > 0 && isLoading) {
        // Data already loaded, ensure loading is false
        setIsLoading(false)
      }
    } else if (!userData) {
      setIsLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userData, loadStudentData, enrollments.length])

  const handleRefresh = () => {
    if (!isLoading) {
      loadStudentData(true)
    }
  }

  // Fetch recommended courses
  const loadRecommendedCourses = useCallback(async () => {
    setLoadingRecommended(true)
    try {
      const response = await courseAPI.getCourses({ page_size: 6 })
      
      // Handle both paginated and non-paginated responses
      let courses = []
      if (response?.data) {
        if (Array.isArray(response.data)) {
          // Non-paginated response (array directly)
          courses = response.data
        } else if (response.data.results && Array.isArray(response.data.results)) {
          // Paginated response
          courses = response.data.results
        } else if (Array.isArray(response.data)) {
          // Fallback: data is an array
          courses = response.data
        }
      }
      
      setRecommendedCourses(courses)
    } catch (error) {
      // Handle network errors and other errors gracefully
      // Suppress error logging for expected cases (no courses, network issues)
      if (error.code === 'ERR_NETWORK' || error.message === 'Network Error' || !error.response) {
        // Network error - backend might be down or unreachable
        // This is expected when backend is not running or no courses exist
        setRecommendedCourses([])
      } else if (error.response) {
        // Server responded with an error status
        if (error.response.status === 404 || error.response.status === 400) {
          // 404 or 400 might mean no courses exist - handle gracefully
          setRecommendedCourses([])
        } else if (error.response.status >= 500) {
          // Server errors - log but don't break the UI
          setRecommendedCourses([])
        } else {
          // Other client errors - handle gracefully
          setRecommendedCourses([])
        }
      } else {
        // Other errors - handle gracefully
        setRecommendedCourses([])
      }
    } finally {
      setLoadingRecommended(false)
    }
  }, [])

  // Load recommended courses on mount
  useEffect(() => {
    loadRecommendedCourses()
  }, [loadRecommendedCourses])

  // All hooks must be called before any early returns
  // Calculate enrollments data (always called, even if not used)
  
  // In this system, 'completed' status means enrollment is active and student can access the course
  const activeEnrollments = enrollments.filter(e => e.status === 'completed')
  
  // For completed courses, we need to check if they have actually been completed
  // This would require a separate field or calculation based on course progress
  // For now, we'll show 0 until we have proper completion tracking
  const completedEnrollments = [] // TODO: Implement proper course completion tracking
  
  // Mock certificates count - replace with real data from certificates API
  const certificatesCount = 0 // TODO: Fetch from certificates API
  
  // State for recommended courses
  const [recommendedCourses, setRecommendedCourses] = useState([])
  const [loadingRecommended, setLoadingRecommended] = useState(false)
  
  const upcomingSessions = useMemo(() => {
    const sessions = []
    activeEnrollments.forEach(enrollment => {
      if (enrollment.courseDetails?.upcoming_sessions) {
        enrollment.courseDetails.upcoming_sessions.forEach(session => {
          sessions.push({
            ...session,
            courseId: enrollment.course,
            courseTitle: enrollment.courseDetails.title
          })
        })
      }
    })
    return sessions.sort((a, b) => {
      const dateA = new Date(`${a.timetable?.date}T${a.timetable?.start_time}`)
      const dateB = new Date(`${b.timetable?.date}T${b.timetable?.start_time}`)
      return dateA - dateB
    }).slice(0, 5)
  }, [activeEnrollments])

  // Removed calculateCompletionPercentage function - no longer using fake progress data

  // Get current time for personalized greeting
  const currentHour = new Date().getHours()
  const getGreeting = () => {
    if (currentHour < 12) return { text: 'Good Morning', emoji: '🌅', color: 'from-amber-500 to-orange-500' }
    if (currentHour < 17) return { text: 'Good Afternoon', emoji: '☀️', color: 'from-blue-500 to-cyan-500' }
    if (currentHour < 21) return { text: 'Good Evening', emoji: '🌆', color: 'from-purple-500 to-pink-500' }
    return { text: 'Good Night', emoji: '🌙', color: 'from-indigo-600 to-purple-600' }
  }
  const greeting = getGreeting()

  // Removed mock data for streak, learning time, and achievements
  // These are now replaced with functional action cards

  // Islamic quotes and ayahs with rotation state
  const [quoteIndex, setQuoteIndex] = useState(0)
  const motivationalQuotes = [
    { text: "Seeking knowledge is a duty upon every Muslim.", author: "Prophet Muhammad (ﷺ)" },
    { text: "The ink of the scholar is more sacred than the blood of the martyr.", author: "Prophet Muhammad (ﷺ)" },
    { text: "An hour's contemplation is better than a year's worship.", author: "Prophet Muhammad (ﷺ)" },
    { text: "The best of people are those who benefit others.", author: "Prophet Muhammad (ﷺ)" },
    { text: "And whoever relies upon Allah - then He is sufficient for him.", author: "Quran 65:3" },
    { text: "And We have certainly created man in the best of stature.", author: "Quran 95:4" },
    { text: "And whoever does righteous deeds, whether male or female, while being a believer - those will enter Paradise.", author: "Quran 4:124" },
    { text: "And it is He who created the heavens and earth in truth. And the day He says, 'Be,' and it is, His word is the truth.", author: "Quran 6:73" },
    { text: "And whoever fears Allah - He will make for him a way out.", author: "Quran 65:2" },
    { text: "And whoever relies upon Allah - then He is sufficient for him. Indeed, Allah will accomplish His purpose.", author: "Quran 65:3" },
    { text: "And We have certainly created man in the best of stature.", author: "Quran 95:4" },
    { text: "And whoever does righteous deeds, whether male or female, while being a believer - those will enter Paradise.", author: "Quran 4:124" },
    { text: "And it is He who created the heavens and earth in truth. And the day He says, 'Be,' and it is, His word is the truth.", author: "Quran 6:73" },
    { text: "And whoever fears Allah - He will make for him a way out.", author: "Quran 65:2" },
    { text: "And whoever relies upon Allah - then He is sufficient for him. Indeed, Allah will accomplish His purpose.", author: "Quran 65:3" },
    { text: "And We have certainly created man in the best of stature.", author: "Quran 95:4" },
    { text: "And whoever does righteous deeds, whether male or female, while being a believer - those will enter Paradise.", author: "Quran 4:124" },
    { text: "And it is He who created the heavens and earth in truth. And the day He says, 'Be,' and it is, His word is the truth.", author: "Quran 6:73" },
    { text: "And whoever fears Allah - He will make for him a way out.", author: "Quran 65:2" },
    { text: "And whoever relies upon Allah - then He is sufficient for him. Indeed, Allah will accomplish His purpose.", author: "Quran 65:3" },
  ]

  // Rotate quotes every 20 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setQuoteIndex((prev) => (prev + 1) % motivationalQuotes.length)
    }, 20000) // 20 seconds interval for quote rotation
    return () => clearInterval(interval)
  }, [motivationalQuotes.length])

  const currentQuote = motivationalQuotes[quoteIndex]

  // If not logged in, show landing page
  if (!userData) {
    return (
      <>
        <style jsx global>{`
          .custom-cursor {
            position: fixed;
            width: 32px;
            height: 32px;
            border: 2px solid hsl(var(--primary));
            border-radius: 50%;
            pointer-events: none;
            z-index: 9999;
            transition: transform 0.15s ease;
            mix-blend-mode: difference;
          }
          .custom-cursor-dot {
            position: fixed;
            width: 4px;
            height: 4px;
            background: hsl(var(--primary));
            border-radius: 50%;
            pointer-events: none;
            z-index: 9999;
            transform: translate(-50%, -50%);
          }
          @media (max-width: 768px) {
            .custom-cursor,
            .custom-cursor-dot {
              display: none;
            }
          }
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-20px); }
          }
          @keyframes gradient {
            0%, 100% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
          }
          @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
          @keyframes rotate {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          @keyframes pulse-glow {
            0%, 100% { 
              box-shadow: 0 0 20px rgba(var(--primary-rgb), 0.3);
              opacity: 0.8;
            }
            50% { 
              box-shadow: 0 0 40px rgba(var(--primary-rgb), 0.6);
              opacity: 1;
            }
          }
          @keyframes slide-up {
            from {
              opacity: 0;
              transform: translateY(30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          @keyframes spin-slow {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          @keyframes rotate-beam {
            0% { transform: translate(-50%, -50%) rotate(0deg); opacity: 0.3; }
            50% { opacity: 0.5; }
            100% { transform: translate(-50%, -50%) rotate(360deg); opacity: 0.3; }
          }
          @keyframes float-particle {
            0%, 100% { 
              transform: translate(0, 0) scale(1); 
              opacity: 0.6;
            }
            25% { 
              transform: translate(10px, -15px) scale(1.2);
              opacity: 0.8;
            }
            50% { 
              transform: translate(-5px, -25px) scale(0.9);
              opacity: 1;
            }
            75% { 
              transform: translate(-15px, -10px) scale(1.1);
              opacity: 0.7;
            }
          }
          @keyframes pulse-particle {
            0%, 100% { 
              transform: scale(1);
              opacity: 0.6;
            }
            50% { 
              transform: scale(1.5);
              opacity: 1;
            }
          }
          @keyframes gentle-float {
            0%, 100% { transform: translateY(0px) rotateX(0deg) rotateY(0deg); }
            25% { transform: translateY(-8px) rotateX(1deg) rotateY(-1deg); }
            50% { transform: translateY(-15px) rotateX(-1deg) rotateY(1deg); }
            75% { transform: translateY(-8px) rotateX(1deg) rotateY(-1deg); }
          }
          @keyframes gentle-sway {
            0%, 100% { 
              transform: translateX(-50%) rotateZ(0deg);
            }
            25% { 
              transform: translateX(-50%) rotateZ(1deg);
            }
            75% { 
              transform: translateX(-50%) rotateZ(-1deg);
            }
          }
          .animate-float {
            animation: float 3s ease-in-out infinite;
          }
          .animate-gradient {
            background-size: 200% 200%;
            animation: gradient 8s ease infinite;
          }
          .animate-shimmer {
            animation: shimmer 2s infinite;
          }
          .animate-rotate {
            animation: rotate 20s linear infinite;
          }
          .animate-pulse-glow {
            animation: pulse-glow 3s ease-in-out infinite;
          }
          .animate-slide-up {
            animation: slide-up 0.6s ease-out forwards;
          }
          .islamic-pattern {
            background-image: 
              repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(var(--primary-rgb, 59, 130, 246), 0.03) 10px, rgba(var(--primary-rgb, 59, 130, 246), 0.03) 20px),
              repeating-linear-gradient(-45deg, transparent, transparent 10px, rgba(var(--primary-rgb, 59, 130, 246), 0.03) 10px, rgba(var(--primary-rgb, 59, 130, 246), 0.03) 20px);
          }
          .geometric-pattern {
            background-image: radial-gradient(circle at 25% 25%, rgba(var(--primary-rgb, 59, 130, 246), 0.05) 0%, transparent 50%),
                              radial-gradient(circle at 75% 75%, rgba(var(--primary-rgb, 59, 130, 246), 0.05) 0%, transparent 50%);
          }
        `}</style>

        <CustomCursor />

        <div className="min-h-screen bg-white dark:bg-slate-950">
          {/* Hero Section - Professional & Clean Design */}
          <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-white via-slate-50 to-blue-50/20 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
            
            {/* Clean Professional Background */}
            <div className="absolute inset-0">
              
              {/* Subtle Grid Pattern - Professional */}
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_80%_60%_at_50%_50%,#000_70%,transparent_100%)]" />
              
              {/* Subtle Islamic Pattern - Professional */}
              <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]">
                <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <pattern id="hero-pattern" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
                      <circle cx="40" cy="40" r="30" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-primary" />
                      <circle cx="40" cy="40" r="20" fill="none" stroke="currentColor" strokeWidth="0.3" className="text-blue-600" />
                      <path d="M 40 10 L 40 70 M 10 40 L 70 40" stroke="currentColor" strokeWidth="0.3" className="text-primary" opacity="0.5" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#hero-pattern)" />
                </svg>
              </div>
              
              {/* Clean Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-blue-600/5" />
              
              {/* Subtle Accent Gradient - Top */}
              <div className="absolute -top-64 -left-64 w-[600px] h-[600px] bg-gradient-to-br from-primary/10 to-blue-600/5 rounded-full blur-3xl" />
              
              {/* Subtle Accent Gradient - Bottom */}
              <div className="absolute -bottom-64 -right-64 w-[600px] h-[600px] bg-gradient-to-tl from-blue-600/10 to-purple-600/5 rounded-full blur-3xl" />
              
            </div>

            <div className="container relative mx-auto px-4 sm:px-6 md:px-8 lg:px-16 py-12 md:py-20">
              <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 xl:gap-16 items-center">
                  
                  {/* Left Column - PERFECT First Glance Content */}
                  <div className="space-y-8 max-w-2xl mx-auto lg:mx-0 text-center lg:text-left">
                    
                    {/* Professional Top Badges */}
                    <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start animate-slide-up">
                      {/* Live Activity Badge */}
                      <div className="inline-flex self-center lg:self-start">
                        <div className="group inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 hover:border-green-300 dark:hover:border-green-700 transition-all duration-300 cursor-pointer">
                          <div className="relative flex items-center justify-center">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                            <div className="absolute inset-0 w-2 h-2 bg-green-500 rounded-full animate-ping" />
                          </div>
                          <span className="text-sm font-semibold text-green-700 dark:text-green-400">
                            12,458 Students Online
                          </span>
                        </div>
                      </div>
                      
                      {/* Bismillah Badge */}
                      <div className="inline-flex self-center lg:self-start">
                        <div className="group inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-primary/10 to-blue-50 dark:from-primary/10 dark:to-blue-950/30 border border-primary/20 dark:border-primary/30 hover:border-primary/40 transition-all duration-300 cursor-pointer">
                          <IconBuildingCastle className="h-5 w-5 text-primary group-hover:scale-110 transition-transform duration-300" />
                          <span className="text-lg font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent" style={{ fontFamily: "'Amiri', serif" }}>
                            بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Professional Headline */}
                    <div className="space-y-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
                      <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
                        Master
                        <span className="block mt-2 bg-gradient-to-r from-primary via-blue-600 to-purple-600 bg-clip-text text-transparent animate-gradient" style={{ backgroundSize: '200% 200%' }}>
                          Islamic Knowledge
                        </span>
                      </h1>
                      
                      <p className="text-lg md:text-xl text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                        Transform your life with authentic Islamic education. Join <span className="font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">10,000+ Muslims</span> worldwide on their spiritual journey.
                      </p>
                    </div>

                    {/* CTA Buttons - Professional */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start animate-slide-up" style={{ animationDelay: '0.2s' }}>
                      <Button
                        size="lg"
                        onClick={() => router.push('/signup')}
                        className="h-14 px-10 text-base font-semibold shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90"
                      >
                        Start Learning Free
                        <IconRocket className="h-5 w-5 ml-2" />
                      </Button>
                      
                      <Button
                        size="lg"
                        variant="outline"
                        onClick={() => {
                          const element = document.getElementById('features')
                          element?.scrollIntoView({ behavior: 'smooth' })
                        }}
                        className="h-14 px-10 text-base font-semibold shadow-md hover:shadow-lg transition-all duration-300 border-2 hover:scale-105 hover:border-primary hover:bg-primary hover:text-white"
                      >
                        <IconPlayerPlay className="h-5 w-5 mr-2" />
                        Watch Demo
                      </Button>
                    </div>

                    {/* Professional Trust Indicators */}
                    <div className="flex flex-wrap items-center gap-3 justify-center lg:justify-start pt-4 animate-slide-up" style={{ animationDelay: '0.3s' }}>
                      {/* 5 Star Rating */}
                      <div className="group flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-amber-400/50 transition-all duration-300 cursor-pointer">
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <IconStarFilled 
                              key={i} 
                              className="h-4 w-4 text-amber-400" 
                            />
                          ))}
                        </div>
                        <span className="text-sm font-bold text-slate-800 dark:text-slate-200">4.9/5</span>
                      </div>
                      
                      {/* Verified Badge */}
                      <div className="group flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-green-400/50 transition-all duration-300 cursor-pointer">
                        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
                          <IconCheck className="h-3 w-3 text-white" />
                        </div>
                        <span className="text-sm font-bold text-slate-800 dark:text-slate-200">Accredited</span>
                      </div>
                      
                      {/* Student Count */}
                      <div className="group flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-primary/50 transition-all duration-300 cursor-pointer">
                        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center">
                          <IconUsers className="h-3 w-3 text-white" />
                        </div>
                        <span className="text-sm font-bold text-slate-800 dark:text-slate-200">10K+ Students</span>
                      </div>
                    </div>

                    {/* Live Activity Feed */}
                    <div className="pt-2 animate-slide-up" style={{ animationDelay: '0.4s' }}>
                      <LiveActivityFeed />
                    </div>
                  </div>

                  {/* Right Column - Stunning Animated Quran Illustration */}
                  <div className="relative hidden lg:block">
                    <div 
                      className="relative z-10"
                      style={{
                        transform: `translateY(${scrollY * -0.05}px)`
                      }}
                    >
                      {/* Animated Quran - Spiritual & Elegant */}
                      <div className="relative w-full h-[600px]">
                        <AnimatedQuranIllustration />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Professional Stats Grid */}
                <div className="mt-16 lg:mt-24 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 max-w-6xl mx-auto animate-slide-up" style={{ animationDelay: '0.5s' }}>
                  {[
                    { 
                      icon: IconUsers, 
                      value: <AnimatedCounter end={10000} suffix="+" />, 
                      label: 'Active Students'
                    },
                    { 
                      icon: IconBook, 
                      value: <AnimatedCounter end={50} suffix="+" />, 
                      label: 'Expert Courses'
                    },
                    { 
                      icon: IconWorld, 
                      value: <AnimatedCounter end={15} suffix="+" />, 
                      label: 'Countries'
                    },
                    { 
                      icon: IconCertificate, 
                      value: <><AnimatedCounter end={4.9} />/5</>, 
                      label: 'Average Rating'
                    }
                  ].map((stat, index) => (
                    <div
                      key={index}
                      className="group transition-all duration-300"
                      style={{ animationDelay: `${0.6 + index * 0.1}s` }}
                    >
                      <div className="relative p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-300 hover:shadow-lg">
                        <div className="space-y-3">
                          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/10 to-blue-600/10 flex items-center justify-center">
                            <stat.icon className="h-6 w-6 text-primary" />
                          </div>
                          <div className="space-y-1">
                            <div className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white">
                              {stat.value}
                            </div>
                            <div className="text-sm font-medium text-slate-500 dark:text-slate-400">
                              {stat.label}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
            </div>
            </div>
          </section>

          {/* Quran Quote Section - Professional & Elegant */}
          <section className="relative py-24 md:py-32 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 dark:from-black dark:via-slate-900 dark:to-black overflow-hidden">
            <div className="absolute inset-0">
              {/* Subtle Islamic pattern */}
              <div className="absolute inset-0 opacity-[0.03]">
                <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <pattern id="quran-pattern" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
                      <circle cx="40" cy="40" r="25" fill="none" stroke="white" strokeWidth="0.5" />
                      <circle cx="40" cy="40" r="15" fill="none" stroke="white" strokeWidth="0.3" />
                      <path d="M 40 15 L 40 65 M 15 40 L 65 40" stroke="white" strokeWidth="0.3" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#quran-pattern)" />
                </svg>
              </div>
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent" />
            </div>

            <div className="container relative mx-auto px-6 max-w-5xl">
              <ScrollAnimatedSection>
                <div className="text-center space-y-12">
                  
                  {/* Professional Quran icon */}
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/10 to-blue-600/10 backdrop-blur-xl border border-white/20 mb-6">
                    <IconBook2 className="h-10 w-10 text-white" />
                  </div>

                  {/* Arabic Ayah */}
                  <div className="relative">
                    <div className="text-4xl md:text-5xl lg:text-6xl font-serif text-white leading-relaxed mb-8" style={{ fontFamily: "'Amiri', 'Traditional Arabic', serif" }}>
                      وَقُل رَّبِّ زِدْنِي عِلْمًا
                    </div>
                  
                    {/* Elegant divider */}
                    <div className="flex items-center justify-center gap-4 mb-6">
                      <div className="h-px w-16 bg-gradient-to-r from-transparent to-white/30" />
                      <IconSparkles className="h-5 w-5 text-primary/50" />
                      <div className="h-px w-16 bg-gradient-to-l from-transparent to-white/30" />
                    </div>
                  </div>
                  
                  {/* English Translation */}
                  <div className="space-y-6">
                    <p className="text-2xl md:text-3xl text-white/90 font-medium">
                      "My Lord, increase me in knowledge"
                    </p>
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10">
                      <p className="text-sm text-white/70 font-medium">
                        Surah Taha, Verse 114
                      </p>
                    </div>
                  </div>

                  {/* Simple decorative dots */}
                  <div className="flex items-center justify-center gap-3 pt-8">
                    <div className="w-2 h-2 rounded-full bg-white/20" />
                    <div className="w-2 h-2 rounded-full bg-white/30" />
                    <div className="w-2 h-2 rounded-full bg-white/20" />
                      </div>
                        </div>
              </ScrollAnimatedSection>
                      </div>
          </section>

          {/* Features Section - Professional & Elegant */}
          <section id="features" className="relative py-20 md:py-28 bg-gradient-to-b from-white to-slate-50 dark:from-slate-950 dark:to-slate-900 scroll-mt-20">
            
            <div className="container relative mx-auto px-6">
              <ScrollAnimatedSection>
                <div className="text-center mb-16 max-w-3xl mx-auto space-y-6">
                  <Badge className="px-4 py-2 text-sm font-semibold bg-primary/10 text-primary border-0">
                    <IconSparkles className="mr-2 h-4 w-4" />
                    Platform Features
                  </Badge>
                  <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 dark:text-white">
                    Everything You Need to{' '}
                    <span className="bg-gradient-to-r from-primary via-blue-600 to-purple-600 bg-clip-text text-transparent">
                      Excel in Learning
                    </span>
                  </h2>
                  <p className="text-lg text-slate-600 dark:text-slate-400">
                    A comprehensive platform designed for authentic Islamic education
                  </p>
                </div>
              </ScrollAnimatedSection>

              {/* Premium Feature Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
                {[
                  {
                    icon: IconUsers,
                    title: 'World-Class Scholars',
                    description: 'Learn from certified Islamic scholars with decades of teaching experience and authentic knowledge.',
                    gradient: 'from-blue-500 to-blue-600',
                    stats: '50+ Instructors'
                  },
                  {
                    icon: IconBook2,
                    title: 'Digital Library',
                    description: 'Access 10,000+ Islamic books, papers, and resources in Arabic, English, Urdu, and more.',
                    gradient: 'from-purple-500 to-purple-600',
                    stats: '10K+ Resources'
                  },
                  {
                    icon: IconVideo,
                    title: 'HD Recordings',
                    description: 'Lifetime access to crystal-clear recorded sessions. Learn at your pace, anytime, anywhere.',
                    gradient: 'from-pink-500 to-pink-600',
                    stats: '1000+ Hours'
                  },
                  {
                    icon: IconDeviceDesktop,
                    title: 'Live Interactive Classes',
                    description: 'Real-time discussions with instructors and students. Ask questions and get instant answers.',
                    gradient: 'from-green-500 to-green-600',
                    stats: 'Daily Sessions'
                  },
                  {
                    icon: IconCertificate,
                    title: 'Accredited Certificates',
                    description: 'Earn internationally recognized certificates valued by Islamic institutions worldwide.',
                    gradient: 'from-orange-500 to-orange-600',
                    stats: '500+ Issued'
                  },
                  {
                    icon: IconChartBar,
                    title: 'Progress Analytics',
                    description: 'Track your journey with detailed insights, performance metrics, and personalized guidance.',
                    gradient: 'from-cyan-500 to-cyan-600',
                    stats: 'Real-time Data'
                  }
                ].map((feature, index) => (
                  <InteractiveFeatureCard key={index} {...feature} index={index} />
                ))}
              </div>
            </div>
          </section>

          {/* Islamic Values Section - Professional & Elegant */}
          <section className="relative py-20 md:py-28 bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-950">
            
            <div className="container relative mx-auto px-6">
              <ScrollAnimatedSection>
                <div className="text-center mb-16 max-w-3xl mx-auto space-y-6">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <IconBuildingCastle className="h-5 w-5 text-primary" />
                    <span className="text-sm font-semibold text-primary">Our Foundation</span>
                  </div>
                  <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 dark:text-white">
                    Built on{' '}
                    <span className="bg-gradient-to-r from-primary via-blue-600 to-purple-600 bg-clip-text text-transparent">
                      Islamic Values
                    </span>
                  </h2>
                  <p className="text-lg text-slate-600 dark:text-slate-400">
                    Every aspect reflects the core principles of authentic Islamic education
                  </p>
                </div>
              </ScrollAnimatedSection>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
                {[
                  {
                    icon: IconBook2,
                    title: 'Authentic Sources',
                    description: 'All teachings derived from Quran and authentic Sunnah',
                    verse: 'وَاعْتَصِمُوا بِحَبْلِ اللَّهِ',
                    gradient: 'from-green-500 to-emerald-600'
                  },
                  {
                    icon: IconUsers,
                    title: 'Scholarly Excellence',
                    description: 'Learn from certified scholars with Ijazah and credentials',
                    verse: 'فَاسْأَلُوا أَهْلَ الذِّكْرِ',
                    gradient: 'from-blue-500 to-indigo-600'
                  },
                  {
                    icon: IconHeart,
                    title: 'Sincerity (Ikhlas)',
                    description: 'Education for the sake of Allah and spiritual growth',
                    verse: 'وَمَا أُمِرُوا إِلَّا لِيَعْبُدُوا اللَّهَ',
                    gradient: 'from-rose-500 to-pink-600'
                  },
                  {
                    icon: IconWorld,
                    title: 'Global Ummah',
                    description: 'Connecting Muslims worldwide in pursuit of knowledge',
                    verse: 'إِنَّمَا الْمُؤْمِنُونَ إِخْوَةٌ',
                    gradient: 'from-amber-500 to-orange-600'
                  }
                ].map((value, index) => (
                  <ScrollAnimatedSection key={index}>
                    <div className="group relative h-full">
                      <div className="absolute -inset-1 bg-gradient-to-r opacity-0 group-hover:opacity-30 transition duration-500 blur-xl rounded-3xl" style={{ background: `linear-gradient(to right, var(--tw-gradient-stops))` }} />
                      <div className="relative h-full p-8 rounded-3xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 hover:border-primary/50 dark:hover:border-primary/50 transition-all duration-500 hover:shadow-2xl hover:-translate-y-3">
                        <div className="space-y-6">
                          <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${value.gradient} flex items-center justify-center shadow-xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-500`}>
                            <value.icon className="h-10 w-10 text-white" />
                          </div>
                          
                          <div className="space-y-4">
                            <h3 className="text-2xl font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors">
                              {value.title}
                            </h3>
                            <p className="text-base text-slate-600 dark:text-slate-400 leading-relaxed">
                              {value.description}
                            </p>
                          </div>

                          <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                            <p className="text-lg font-serif text-primary text-center leading-loose" style={{ fontFamily: "'Amiri', serif" }}>
                              {value.verse}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </ScrollAnimatedSection>
                ))}
              </div>
            </div>
          </section>

          {/* Benefits Section - Bento Grid */}
          <section className="relative py-32 md:py-40 bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-950 overflow-hidden">
            <div className="container relative mx-auto px-6">
              <ScrollAnimatedSection>
                <div className="text-center mb-24 max-w-4xl mx-auto space-y-8">
                  <Badge className="px-6 py-3 text-base font-bold bg-primary/10 text-primary border-0 hover:scale-110 transition-transform cursor-pointer shadow-lg">
                    <IconHeart className="mr-2 h-5 w-5" />
                    Why Choose Us
                </Badge>
                  <h2 className="text-5xl md:text-6xl lg:text-7xl font-black text-slate-900 dark:text-white">
                    Built for{' '}
                    <span className="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                      Modern Muslims
                    </span>
                </h2>
              </div>
              </ScrollAnimatedSection>

              {/* Bento Grid Layout */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-7xl mx-auto">
                <ScrollAnimatedSection>
                  <div className="md:col-span-2 group p-10 rounded-3xl bg-gradient-to-br from-primary to-blue-600 text-white hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 relative overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.3),rgba(255,255,255,0))]" />
                    <div className="relative z-10 space-y-6">
                      <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                        <IconClock className="h-8 w-8" />
                      </div>
                      <h3 className="text-3xl font-bold">Learn at Your Own Pace</h3>
                      <p className="text-xl text-white/90 leading-relaxed max-w-2xl">
                        24/7 access to all materials. Study when it fits your schedule, whether that's early morning or late night.
                        </p>
                      </div>
                    </div>
                </ScrollAnimatedSection>

                <ScrollAnimatedSection>
                  <div className="group p-10 rounded-3xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 hover:border-primary/50 dark:hover:border-primary/50 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
                    <div className="space-y-6">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-lg">
                        <IconShield className="h-8 w-8 text-white" />
                      </div>
                      <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Authentic Knowledge</h3>
                      <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
                        Verified scholars with traditional Islamic education and modern teaching methods.
                        </p>
                      </div>
                    </div>
                </ScrollAnimatedSection>

                <ScrollAnimatedSection>
                  <div className="group p-10 rounded-3xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 hover:border-primary/50 dark:hover:border-primary/50 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
                    <div className="space-y-6">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-lg">
                        <IconWorld className="h-8 w-8 text-white" />
                      </div>
                      <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Global Community</h3>
                      <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
                        Connect with 10,000+ students from 15+ countries worldwide.
                        </p>
                      </div>
                    </div>
                </ScrollAnimatedSection>

                <ScrollAnimatedSection>
                  <div className="md:col-span-2 group p-10 rounded-3xl bg-gradient-to-br from-slate-900 to-slate-800 dark:from-slate-800 dark:to-slate-900 text-white hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 relative overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.1),rgba(255,255,255,0))]" />
                    <div className="relative z-10 space-y-6">
                      <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                        <IconHeadphones className="h-8 w-8" />
                      </div>
                      <h3 className="text-3xl font-bold">Premium Support</h3>
                      <p className="text-xl text-white/90 leading-relaxed max-w-2xl">
                        Dedicated support team and personalized guidance from instructors. Get help when you need it.
                      </p>
                      <div className="flex items-center gap-4 pt-4">
                        <div className="flex -space-x-2">
                          {[...Array(4)].map((_, i) => (
                            <div key={i} className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 border-2 border-slate-900" />
                          ))}
                      </div>
                        <span className="text-sm font-semibold">20+ support staff online</span>
                    </div>
              </div>
                        </div>
                </ScrollAnimatedSection>
                      </div>
                        </div>
          </section>

          {/* Payment Section - Premium & Elegant */}
          <section className="relative py-24 md:py-32 overflow-hidden">
            {/* Light mode background */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-slate-50 dark:hidden" />
            {/* Dark mode background */}
            <div className="absolute inset-0 bg-slate-950 hidden dark:block" />
            
            {/* Decorative Elements - Hidden in dark mode */}
            <div className="absolute inset-0 overflow-hidden dark:hidden">
              <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-gradient-to-br from-blue-100/30 to-transparent rounded-full blur-3xl" />
              <div className="absolute -bottom-1/2 -left-1/2 w-full h-full bg-gradient-to-tr from-blue-100/30 to-transparent rounded-full blur-3xl" />
            </div>

            <div className="container mx-auto px-6 max-w-6xl relative z-10">
              
              <ScrollAnimatedSection>
                <div className="text-center mb-16">
                  <div className="inline-block mb-4 px-4 py-2 rounded-full bg-blue-500/10 dark:bg-slate-800 border border-blue-200/50 dark:border-slate-700">
                    <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                      Trusted Payment Solutions
                    </span>
                  </div>
                  <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-6 leading-tight">
                    Easy & Secure Payment
                  </h2>
                  <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                    Experience seamless transactions with enterprise-grade security powered by PayPal
                  </p>
                </div>
              </ScrollAnimatedSection>

              <ScrollAnimatedSection>
                <div className="relative group">
                  {/* Glow Effect - Hidden in dark mode */}
                  <div className="absolute -inset-1 bg-blue-600 rounded-3xl blur-xl opacity-20 group-hover:opacity-30 transition-opacity duration-500 dark:hidden" />
                  
                  {/* Main Card */}
                  <div className="relative bg-white/80 dark:bg-slate-900 backdrop-blur-xl dark:backdrop-blur-none rounded-3xl border border-white/20 dark:border-slate-800 shadow-2xl dark:shadow-none overflow-hidden">
                    
                    {/* Top Gradient Bar */}
                    <div className="h-2 bg-gradient-to-r from-blue-500 to-blue-600" />
                    
                    <div className="p-8 md:p-14">
                      
                      {/* PayPal Logo Section */}
                      <div className="text-center mb-12">
                        <div className="inline-block p-6 rounded-2xl bg-gradient-to-br from-slate-50 to-blue-50/50 dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700 shadow-lg dark:shadow-none hover:scale-105 transition-transform duration-300">
                          <svg className="h-14 w-auto mx-auto" viewBox="0 0 124 33" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M46.211 6.749h-6.839a.95.95 0 0 0-.939.802l-2.766 17.537a.57.57 0 0 0 .564.658h3.265a.95.95 0 0 0 .939-.803l.746-4.73a.95.95 0 0 1 .938-.803h2.165c4.505 0 7.105-2.18 7.784-6.5.306-1.89.013-3.375-.872-4.415-.972-1.142-2.696-1.746-4.985-1.746zM47 13.154c-.374 2.454-2.249 2.454-4.062 2.454h-1.032l.724-4.583a.57.57 0 0 1 .563-.481h.473c1.235 0 2.4 0 3.002.704.359.42.469 1.044.332 1.906zM66.654 13.075h-3.275a.57.57 0 0 0-.563.481l-.145.916-.229-.332c-.709-1.029-2.29-1.373-3.868-1.373-3.619 0-6.71 2.741-7.312 6.586-.313 1.918.132 3.752 1.22 5.031.998 1.176 2.426 1.666 4.125 1.666 2.916 0 4.533-1.875 4.533-1.875l-.146.91a.57.57 0 0 0 .562.66h2.95a.95.95 0 0 0 .939-.803l1.77-11.209a.568.568 0 0 0-.561-.658zm-4.565 6.374c-.316 1.871-1.801 3.127-3.695 3.127-.951 0-1.711-.305-2.199-.883-.484-.574-.668-1.391-.514-2.301.295-1.855 1.805-3.152 3.67-3.152.93 0 1.686.309 2.184.892.499.589.697 1.411.554 2.317zM84.096 13.075h-3.291a.954.954 0 0 0-.787.417l-4.539 6.686-1.924-6.425a.953.953 0 0 0-.912-.678h-3.234a.57.57 0 0 0-.541.754l3.625 10.638-3.408 4.811a.57.57 0 0 0 .465.9h3.287a.949.949 0 0 0 .781-.408l10.946-15.8a.57.57 0 0 0-.468-.895z" fill="#253B80"/>
                            <path d="M94.992 6.749h-6.84a.95.95 0 0 0-.938.802l-2.766 17.537a.569.569 0 0 0 .562.658h3.51a.665.665 0 0 0 .656-.562l.785-4.971a.95.95 0 0 1 .938-.803h2.164c4.506 0 7.105-2.18 7.785-6.5.307-1.89.012-3.375-.873-4.415-.971-1.142-2.694-1.746-4.983-1.746zm.789 6.405c-.373 2.454-2.248 2.454-4.062 2.454h-1.031l.725-4.583a.568.568 0 0 1 .562-.481h.473c1.234 0 2.4 0 3.002.704.359.42.468 1.044.331 1.906zM115.434 13.075h-3.273a.567.567 0 0 0-.562.481l-.145.916-.23-.332c-.709-1.029-2.289-1.373-3.867-1.373-3.619 0-6.709 2.741-7.311 6.586-.312 1.918.131 3.752 1.219 5.031 1 1.176 2.426 1.666 4.125 1.666 2.916 0 4.533-1.875 4.533-1.875l-.146.91a.57.57 0 0 0 .564.66h2.949a.95.95 0 0 0 .938-.803l1.771-11.209a.571.571 0 0 0-.565-.658zm-4.565 6.374c-.314 1.871-1.801 3.127-3.695 3.127-.949 0-1.711-.305-2.199-.883-.484-.574-.666-1.391-.514-2.301.297-1.855 1.805-3.152 3.67-3.152.93 0 1.686.309 2.184.892.501.589.699 1.411.554 2.317zM119.295 7.23l-2.807 17.858a.569.569 0 0 0 .562.658h2.822c.469 0 .867-.34.938-.803l2.769-17.536a.57.57 0 0 0-.562-.659h-3.16a.571.571 0 0 0-.562.482z" fill="#179BD7"/>
                            <path d="M7.266 29.154l.523-3.322-1.165-.027H1.061L4.927 1.292a.316.316 0 0 1 .314-.268h9.38c3.114 0 5.263.648 6.385 1.927.526.6.861 1.227 1.023 1.917.17.724.173 1.589.007 2.644l-.012.077v.676l.526.298a3.69 3.69 0 0 1 1.065.812c.45.513.741 1.165.864 1.938.127.795.085 1.741-.123 2.812-.24 1.232-.628 2.305-1.152 3.183a6.547 6.547 0 0 1-1.825 2c-.696.494-1.523.869-2.458 1.109-.906.236-1.939.355-3.072.355h-.73c-.522 0-1.029.188-1.427.525a2.21 2.21 0 0 0-.744 1.328l-.055.299-.924 5.855-.042.215c-.011.068-.03.102-.058.125a.155.155 0 0 1-.096.035H7.266z" fill="#253B80"/>
                            <path d="M23.048 7.667c-.028.179-.06.362-.096.55-1.237 6.351-5.469 8.545-10.874 8.545H9.326c-.661 0-1.218.48-1.321 1.132L6.596 26.83l-.399 2.533a.704.704 0 0 0 .695.814h4.881c.578 0 1.069-.42 1.16-.99l.048-.248.919-5.832.059-.32c.09-.572.582-.992 1.16-.992h.73c4.729 0 8.431-1.92 9.513-7.476.452-2.321.218-4.259-.978-5.622a4.667 4.667 0 0 0-1.336-1.03z" fill="#179BD7"/>
                            <path d="M21.754 7.151a9.757 9.757 0 0 0-1.203-.267 15.284 15.284 0 0 0-2.426-.177h-7.352a1.172 1.172 0 0 0-1.159.992L8.05 17.605l-.045.289a1.336 1.336 0 0 1 1.321-1.132h2.752c5.405 0 9.637-2.195 10.874-8.545.037-.188.068-.371.096-.55a6.594 6.594 0 0 0-1.017-.429 9.045 9.045 0 0 0-.277-.087z" fill="#222D65"/>
                            <path d="M9.614 7.699a1.169 1.169 0 0 1 1.159-.991h7.352c.871 0 1.684.057 2.426.177a9.757 9.757 0 0 1 1.481.353c.365.121.704.264 1.017.429.368-2.347-.003-3.945-1.272-5.392C20.378.682 17.853 0 14.622 0h-9.38c-.66 0-1.223.48-1.325 1.133L.01 25.898a.806.806 0 0 0 .795.932h5.791l1.454-9.225 1.564-9.906z" fill="#253B80"/>
                          </svg>
                        </div>
                        <p className="mt-6 text-slate-600 dark:text-slate-400 text-lg font-medium">
                          All payments are securely processed through PayPal's trusted infrastructure
                        </p>
                      </div>

                      {/* Divider */}
                      <div className="relative mb-12">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-gradient-to-r from-transparent via-slate-200 dark:via-slate-700 to-transparent" />
                        </div>
                        <div className="relative flex justify-center">
                          <span className="px-4 text-sm text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900">
                            Why choose us
                          </span>
                        </div>
                      </div>

                      {/* Premium Benefits Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Secure */}
                        <div className="group relative">
                          <div className="absolute inset-0 bg-blue-500/5 dark:bg-transparent rounded-2xl transform group-hover:scale-105 transition-transform duration-300" />
                          <div className="relative text-center p-6 space-y-4">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/30 dark:shadow-none group-hover:shadow-xl group-hover:shadow-blue-500/40 dark:group-hover:shadow-none transition-all duration-300 group-hover:-translate-y-1">
                              <IconShield className="h-8 w-8 text-white" />
                            </div>
                            <h4 className="text-xl font-bold text-slate-900 dark:text-white">Bank-Level Security</h4>
                            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                              256-bit SSL encryption with advanced fraud protection for every transaction
                            </p>
                          </div>
                        </div>

                        {/* Instant */}
                        <div className="group relative">
                          <div className="absolute inset-0 bg-blue-500/5 dark:bg-transparent rounded-2xl transform group-hover:scale-105 transition-transform duration-300" />
                          <div className="relative text-center p-6 space-y-4">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/30 dark:shadow-none group-hover:shadow-xl group-hover:shadow-blue-500/40 dark:group-hover:shadow-none transition-all duration-300 group-hover:-translate-y-1">
                              <IconBolt className="h-8 w-8 text-white" />
                            </div>
                            <h4 className="text-xl font-bold text-slate-900 dark:text-white">Instant Access</h4>
                            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                              Get immediate course access upon payment confirmation - no waiting
                            </p>
                          </div>
                        </div>

                        {/* Global */}
                        <div className="group relative">
                          <div className="absolute inset-0 bg-blue-500/5 dark:bg-transparent rounded-2xl transform group-hover:scale-105 transition-transform duration-300" />
                          <div className="relative text-center p-6 space-y-4">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/30 dark:shadow-none group-hover:shadow-xl group-hover:shadow-blue-500/40 dark:group-hover:shadow-none transition-all duration-300 group-hover:-translate-y-1">
                              <IconWorld className="h-8 w-8 text-white" />
                            </div>
                            <h4 className="text-xl font-bold text-slate-900 dark:text-white">Global Reach</h4>
                            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                              Accept payments in 25+ currencies from 200+ countries worldwide
                            </p>
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>
                </div>
              </ScrollAnimatedSection>

            </div>
          </section>

          {/* Testimonials - Premium Cards */}
          <section className="relative py-32 md:py-40 bg-white dark:bg-slate-950">
            <div className="container mx-auto px-6">
              <ScrollAnimatedSection>
                <div className="text-center mb-24 max-w-4xl mx-auto space-y-8">
                  <Badge className="px-6 py-3 text-base font-bold bg-primary/10 text-primary border-0 hover:scale-110 transition-transform cursor-pointer shadow-lg">
                    <IconQuote className="mr-2 h-5 w-5" />
                    Student Success Stories
              </Badge>
                  <h2 className="text-5xl md:text-6xl lg:text-7xl font-black text-slate-900 dark:text-white">
                    Loved by{' '}
                    <span className="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                      Thousands
                    </span>
              </h2>
                  <p className="text-2xl text-slate-600 dark:text-slate-400">
                    See what our students have to say about their journey
              </p>
            </div>
              </ScrollAnimatedSection>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
                {[
                  {
                    quote: "This platform has completely transformed my understanding of Islam. The depth of knowledge and quality of instruction are unmatched. I've learned more in 6 months than in years of self-study.",
                    name: "Dr. Sarah Ahmed",
                    role: "Medical Professional",
                    location: "London, UK",
                    rating: 5,
                    image: "SA"
                  },
                  {
                    quote: "Being able to learn authentic Islamic knowledge while balancing my career and family is a blessing. The flexibility and support from instructors make all the difference.",
                    name: "Mohammed Ali",
                    role: "Software Engineer",
                    location: "New York, USA",
                    rating: 5,
                    image: "MA"
                  },
                  {
                    quote: "The digital library alone is worth it, but when combined with live classes from expert scholars, this platform becomes truly invaluable. Highly recommended!",
                    name: "Fatima Hassan",
                    role: "Teacher",
                    location: "Toronto, Canada",
                    rating: 5,
                    image: "FH"
                  }
                ].map((testimonial, index) => (
                  <ScrollAnimatedSection key={index}>
                    <div className="group relative">
                      <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-blue-600 opacity-0 group-hover:opacity-20 transition duration-500 blur-xl rounded-3xl" />
                      <Card className="relative h-full border-2 border-slate-200 dark:border-slate-800 hover:border-primary/50 dark:hover:border-primary/50 transition-all duration-500 hover:shadow-2xl hover:-translate-y-2">
                        <CardContent className="pt-10 pb-10 space-y-8">
                          <div className="flex items-center gap-1">
                            {[...Array(testimonial.rating)].map((_, i) => (
                              <IconStarFilled key={i} className="h-6 w-6 text-amber-400" />
                            ))}
                    </div>
                          <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-lg italic">
                            "{testimonial.quote}"
                          </p>
                          <div className="flex items-center gap-4 pt-6 border-t border-slate-200 dark:border-slate-800">
                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/30 to-blue-600/30 flex items-center justify-center shadow-lg text-2xl font-bold text-primary">
                              {testimonial.image}
                    </div>
                            <div>
                              <div className="font-bold text-lg text-slate-900 dark:text-white">{testimonial.name}</div>
                              <div className="text-sm text-slate-600 dark:text-slate-400">{testimonial.role}</div>
                              <div className="text-xs text-slate-500 dark:text-slate-500">{testimonial.location}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
                    </div>
                  </ScrollAnimatedSection>
                ))}
                    </div>
                  </div>
          </section>

          {/* Final CTA - Ultra Premium Islamic Design */}
          <section className="relative py-40 md:py-48 bg-gradient-to-br from-primary via-blue-600 to-purple-600 text-white overflow-hidden">
            <div className="absolute inset-0">
              {/* Islamic pattern overlay */}
              <div className="absolute inset-0 opacity-10">
                <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <pattern id="cta-pattern" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
                      <path d="M 40 0 L 40 80 M 0 40 L 80 40" stroke="white" strokeWidth="0.5" opacity="0.3" />
                      <circle cx="40" cy="40" r="15" fill="none" stroke="white" strokeWidth="0.5" opacity="0.5" />
                      <circle cx="40" cy="40" r="25" fill="none" stroke="white" strokeWidth="0.5" opacity="0.3" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#cta-pattern)" />
                </svg>
              </div>
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1),transparent)]" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(255,255,255,0.1),transparent)]" />
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:64px_64px]" />
                    </div>

            {/* Floating decorative elements with Islamic shapes */}
            {[...Array(8)].map((_, i) => (
              <FloatingElement key={i} delay={i * 0.5} duration={4 + i}>
                {i % 3 === 0 ? (
                  <div 
                    className="absolute text-white/10"
                    style={{
                      left: `${10 + i * 12}%`,
                      top: `${20 + (i % 3) * 25}%`,
                      transform: `rotate(${i * 45}deg)`
                    }}
                  >
                    <IconSparkles className="h-12 w-12" />
                  </div>
                ) : (
                <div 
                  className={`absolute w-${8 + i * 2} h-${8 + i * 2} border-4 border-white/10 rounded-${i % 2 === 0 ? 'full' : '3xl'}`}
                  style={{
                      left: `${10 + i * 12}%`,
                      top: `${20 + (i % 3) * 25}%`,
                    transform: `rotate(${i * 45}deg)`
                  }}
                />
                )}
              </FloatingElement>
            ))}

            <div className="container relative mx-auto px-6">
              <ScrollAnimatedSection>
                <div className="max-w-5xl mx-auto text-center space-y-14">
                  <div className="space-y-10">
                    {/* Islamic icon with glow effect */}
                    <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-white/20 backdrop-blur-xl border-3 border-white/40 mb-10 hover:scale-110 hover:rotate-12 transition-all duration-700 cursor-pointer shadow-2xl relative group">
                      <IconBuildingCastle className="h-16 w-16 text-white relative z-10 group-hover:scale-125 transition-transform duration-500" />
                      <div className="absolute inset-0 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all duration-500" />
            </div>

                    {/* Bismillah before main heading */}
                    <div className="inline-flex items-center gap-3 px-8 py-4 rounded-full bg-white/10 backdrop-blur-sm border border-white/30 mb-6">
                      <span className="text-2xl font-serif text-white" style={{ fontFamily: "'Amiri', serif" }}>
                        بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                      </span>
                    </div>

                    <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight animate-slide-up">
                      Begin Your Path to
                      <span className="block mt-2">Islamic Excellence</span>
                    </h2>
                    <p className="text-lg md:text-xl text-white/90 max-w-3xl mx-auto leading-relaxed animate-slide-up" style={{ animationDelay: '0.2s' }}>
                      Join 10,000+ Muslims worldwide learning authentic Islamic knowledge from certified scholars. Transform your Deen, strengthen your Iman, and grow closer to Allah.
                    </p>
        </div>

                  <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8">
                    <Button
                      size="lg"
                      onClick={() => router.push('/signup')}
                      className="h-14 px-10 text-base font-semibold shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105 bg-white text-primary hover:bg-white/95"
                  >
                    Create Free Account
                        <IconArrowRight className="h-5 w-5 ml-2" />
                    </Button>
                    
                    <Button 
                      size="lg"
                    variant="outline" 
                      onClick={() => router.push('/courses')}
                      className="h-14 px-10 text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-300 bg-white/10 border-2 border-white text-white hover:bg-white/20 hover:border-white/60 backdrop-blur-sm hover:scale-105"
                  >
                      Explore Classes
                    </Button>
                </div>
                
                  <div className="pt-8 flex flex-wrap items-center justify-center gap-6 text-white/90 text-sm">
                    {[
                      { icon: IconCheck, text: 'No credit card required' },
                      { icon: IconCheck, text: 'Cancel anytime' },
                      { icon: IconShield, text: '100% Secure' },
                      { icon: IconInfinity, text: 'Lifetime access' }
                    ].map((item, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <item.icon className="h-4 w-4" />
                        <span className="font-medium">{item.text}</span>
                  </div>
                    ))}
                  </div>

                  {/* Social Proof */}
                  <div className="pt-12 border-t border-white/20">
                    <p className="text-sm font-medium text-white/70 uppercase tracking-wider mb-6">
                      Trusted by Students From
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-8 opacity-70">
                      {['USA', 'UK', 'Canada', 'UAE', 'Australia', 'Pakistan'].map((country, index) => (
                        <div key={index} className="text-lg font-semibold text-white/80 hover:text-white transition-colors">
                          {country}
                </div>
                      ))}
          </div>
        </div>
      </div>
              </ScrollAnimatedSection>
            </div>
          </section>
        </div>
      </>
    )
  }

  // Rest of the authenticated user code (dashboard)
  // [Dashboard code remains the same as before...]
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/5">
          <div className="container mx-auto px-4 py-8 lg:px-12 space-y-8">
            <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5 overflow-hidden animate-in fade-in duration-500">
              <CardContent className="p-8 md:p-12">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="space-y-4 flex-1">
                  <Skeleton className="h-12 w-3/4 bg-primary/10" />
                  <Skeleton className="h-6 w-1/2 bg-primary/10" />
            </div>
                <Skeleton className="h-32 w-32 rounded-full bg-primary/10" />
                </div>
              </CardContent>
            </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-in fade-in duration-500" style={{ animationDelay: `${i * 100}ms` }}>
                  <CardHeader>
                    <Skeleton className="h-8 w-3/4 mb-4" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-24 w-full" />
                  </CardContent>
                </Card>
                ))}
              </div>
            <div className="space-y-6">
              <Card className="animate-in fade-in duration-500" style={{ animationDelay: '300ms' }}>
                <CardHeader>
                  <Skeleton className="h-6 w-1/2" />
                    </CardHeader>
                <CardContent>
                  <Skeleton className="h-32 w-full" />
                    </CardContent>
                  </Card>
              </div>
            </div>
          </div>
        </div>
      )
    }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background via-primary/5 to-background">
        <div className="container mx-auto px-4 py-12 lg:px-12 space-y-12">
            <Card className="border-2 border-destructive/50 bg-destructive/5 animate-in fade-in slide-in-from-top duration-500">
            <CardContent className="p-8 text-center">
              <div className="flex flex-col items-center gap-6">
                <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center">
                  <IconHandStop className="h-10 w-10 text-destructive" />
                    </div>
                <div className="space-y-3">
                  <h3 className="text-2xl font-bold text-destructive">Unable to Load Dashboard</h3>
                  <p className="text-muted-foreground max-w-md">{error}</p>
                  </div>
                  <Button 
                  onClick={handleRefresh}
                  className="px-8 py-6 text-lg"
                  disabled={isLoading}
                >
                  {isLoading ? 'Loading...' : 'Try Again'}
                  </Button>
                </div>
              </CardContent>
            </Card>
            </div>
                  </div>
    )
  }

  // Authenticated view starts here
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/[0.02] to-secondary/[0.02]">
      <div className="container mx-auto px-4 py-6 lg:px-12 space-y-6">
        
        {/* Professional Hero Welcome Section */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-lg">
          {/* Subtle Professional Background */}
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-800" />
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#f8fafc_1px,transparent_1px),linear-gradient(to_bottom,#f8fafc_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:24px_24px]" />
          </div>

          <div className="relative p-8 md:p-12">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              
              {/* Left Section - Greeting & Stats */}
              <div className="space-y-4 flex-1">
                {/* Professional Greeting */}
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                    {userData?.full_name?.charAt(0)?.toUpperCase() || 'S'}
                  </div>
                  <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">
                      {greeting.text}, {userData?.full_name?.split(' ')[0] || 'Student'}
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400 text-sm">
                      Welcome back to your learning dashboard
                    </p>
                  </div>
                </div>

                {/* Quick Action Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Continue Learning */}
                  <div 
                    className="group p-4 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/30 border border-blue-200 dark:border-blue-800 hover:border-blue-300 dark:hover:border-blue-700 transition-all cursor-pointer"
                    onClick={() => {
                      if (activeEnrollments.length > 0) {
                        router.push(`/courses/${activeEnrollments[0].course}`)
                      } else {
                        router.push('/courses')
                      }
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <IconPlayerPlay className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-blue-900 dark:text-blue-100">Continue Learning</div>
                        <div className="text-xs text-blue-600 dark:text-blue-300">
                          {activeEnrollments.length > 0 ? 'Pick up where you left off' : 'Start your journey'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Browse Classes */}
                  <div 
                    className="group p-4 rounded-xl bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/30 border border-green-200 dark:border-green-800 hover:border-green-300 dark:hover:border-green-700 transition-all cursor-pointer"
                    onClick={() => router.push('/courses')}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-green-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <IconBook className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-green-900 dark:text-green-100">Browse Classes</div>
                        <div className="text-xs text-green-600 dark:text-green-300">Discover new content</div>
                      </div>
                    </div>
                  </div>

                  {/* View Progress */}
                  <div 
                    className="group p-4 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-900/30 border border-purple-200 dark:border-purple-800 hover:border-purple-300 dark:hover:border-purple-700 transition-all cursor-pointer"
                    onClick={() => router.push('/my-learning')}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-purple-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <IconChartLine className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-purple-900 dark:text-purple-100">View Progress</div>
                        <div className="text-xs text-purple-600 dark:text-purple-300">Track your journey</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Section - Actions & Quote */}
              <div className="space-y-4 w-full lg:w-auto lg:min-w-[320px] lg:max-w-[400px]">
                {/* Professional Daily Quote - Fixed Height */}
                <div className="h-48 p-6 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col">
                  <div className="flex gap-4 flex-1">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0">
                      <IconQuote className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="space-y-3 flex-1 flex flex-col justify-center min-h-0">
                      <p className="text-sm font-medium leading-relaxed text-slate-700 dark:text-slate-300 transition-all duration-500 ease-in-out line-clamp-4 overflow-hidden">"{currentQuote.text}"</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium transition-all duration-500 ease-in-out mt-auto">— {currentQuote.author}</p>
                    </div>
                  </div>
                </div>

                {/* Action Button */}
                <Button 
                  size="lg"
                  onClick={() => router.push('/courses')}
                  className="w-full h-12 font-semibold shadow-lg hover:shadow-xl transition-colors bg-gradient-to-r from-primary to-blue-600"
                >
                  <IconRocket className="mr-2 h-5 w-5" />
                  Explore Classes
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Professional Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Active Classes Card */}
          <Card className="border border-slate-200 dark:border-slate-700 hover:border-blue-500/50 transition-colors hover:shadow-lg bg-white dark:bg-slate-800">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                  <IconBook className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs font-semibold">
                  Active
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-3xl font-bold text-slate-900 dark:text-white">
                  {activeEnrollments.length}
                </div>
                <div className="text-sm font-medium text-slate-600 dark:text-slate-400">Active Classes</div>
                <div className="text-xs text-slate-500 dark:text-slate-500">Keep learning! 🚀</div>
              </div>
            </CardContent>
          </Card>

          {/* Completed Classes Card */}
          <Card className="border border-slate-200 dark:border-slate-700 hover:border-green-500/50 transition-colors hover:shadow-lg bg-white dark:bg-slate-800">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900 flex items-center justify-center">
                  <IconTrophy className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div className="px-3 py-1 rounded-full bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 text-xs font-semibold">
                  Done
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-3xl font-bold text-slate-900 dark:text-white">
                  {completedEnrollments.length}
                </div>
                <div className="text-sm font-medium text-slate-600 dark:text-slate-400">Completed</div>
                <div className="text-xs text-slate-500 dark:text-slate-500">Well done! 🎉</div>
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Sessions Card */}
          <Card className="border border-slate-200 dark:border-slate-700 hover:border-purple-500/50 transition-colors hover:shadow-lg bg-white dark:bg-slate-800">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                  <IconCalendar className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                {upcomingSessions.length > 0 && (
                  <div className="px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 text-xs font-semibold">
                      Soon
                  </div>
                )}
              </div>
              <div className="space-y-1">
                <div className="text-3xl font-bold text-slate-900 dark:text-white">
                  {upcomingSessions.length}
                </div>
                <div className="text-sm font-medium text-slate-600 dark:text-slate-400">Upcoming Sessions</div>
                <div className="text-xs text-slate-500 dark:text-slate-500">Don't miss them! 📅</div>
              </div>
            </CardContent>
          </Card>

          {/* Certificates Card */}
          <Card className="border border-slate-200 dark:border-slate-700 hover:border-amber-500/50 transition-colors hover:shadow-lg bg-white dark:bg-slate-800">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-lg bg-amber-100 dark:bg-amber-900 flex items-center justify-center">
                  <IconCertificate className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 text-xs font-semibold">
                  Earned
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-3xl font-bold text-slate-900 dark:text-white">
                  {certificatesCount}
                </div>
                <div className="text-sm font-medium text-slate-600 dark:text-slate-400">Certificates</div>
                <div className="text-xs text-slate-500 dark:text-slate-500">Amazing! 🏆</div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            
            {/* Empty State - No Classes */}
            {activeEnrollments.length === 0 && (
              <Card className="border-2 border-dashed border-primary/30 shadow-lg">
                <CardContent className="p-12">
                  <div className="text-center space-y-6">
                    <div className="relative inline-block">
                      <div className="w-32 h-32 mx-auto rounded-3xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                        <IconBook className="h-16 w-16 text-primary" />
                      </div>
                      <div className="absolute -top-2 -right-2 w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white text-2xl">
                        ✨
                      </div>
                    </div>
                    <div className="space-y-3">
                      <h3 className="text-3xl font-bold">Start Your Learning Journey</h3>
                      <p className="text-muted-foreground max-w-md mx-auto text-lg">
                        Explore our comprehensive classes and begin your path to mastering Islamic knowledge
                      </p>
                    </div>
                    <Button 
                      onClick={() => router.push('/courses')} 
                      size="lg"
                      className="mt-6 h-14 px-10 text-lg font-semibold shadow-xl hover:shadow-2xl transition-colors bg-gradient-to-r from-primary to-blue-600"
                    >
                      <IconRocket className="mr-3 h-6 w-6" />
                      Browse All Classes
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Continue Learning Section - High Priority UX */}
            {activeEnrollments.length > 0 && (
              <Card className="border-2 border-primary/30 shadow-lg bg-gradient-to-br from-primary/5 via-background to-secondary/5">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center shadow-lg">
                        <IconPlayerPlay className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-2xl font-black">Continue Learning</CardTitle>
                        <p className="text-sm text-muted-foreground mt-0.5">Pick up where you left off</p>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Card className="overflow-hidden border-2 border-border hover:border-primary/50 transition-all duration-300 hover:shadow-2xl cursor-pointer bg-gradient-to-br from-background to-primary/5 group">
                    <div className="relative" onClick={() => router.push(`/courses/${activeEnrollments[0].course}`)}>
                      <CardContent className="p-8">
                        <div className="flex items-start gap-8">
                          {/* Course Thumbnail/Icon */}
                          <div className="relative flex-shrink-0">
                            <div className="w-28 h-28 rounded-3xl bg-gradient-to-br from-primary/20 to-blue-600/20 flex items-center justify-center shadow-xl group-hover:scale-105 transition-transform duration-300">
                              <IconBook className="h-14 w-14 text-primary" />
                            </div>
                            <div className="absolute -top-2 -right-2 w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white text-sm font-bold shadow-lg">
                              <IconCheck className="h-5 w-5" />
                            </div>
                          </div>
                          
                          {/* Course Info */}
                          <div className="flex-1 space-y-4">
                            <div>
                              <h3 className="text-2xl font-bold mb-2 group-hover:text-primary transition-colors">
                                {activeEnrollments[0].courseDetails?.title || 'Course Title'}
                              </h3>
                              <p className="text-base text-muted-foreground line-clamp-2 leading-relaxed">
                                {activeEnrollments[0].courseDetails?.description || 'Continue your learning journey with this comprehensive course'}
                              </p>
                            </div>
                            
                            {/* Course Stats */}
                            <div className="flex items-center gap-6 text-sm">
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                                  <IconUsers className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                </div>
                                <span className="font-medium">
                                  {activeEnrollments[0].courseDetails?.enrolled_count || 0} students
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900 flex items-center justify-center">
                                  <IconCalendar className="h-4 w-4 text-green-600 dark:text-green-400" />
                                </div>
                                <span className="font-medium">Active Course</span>
                              </div>
                              {activeEnrollments[0].courseDetails?.subjects?.[0] && (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                                    <IconBook className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                                  </div>
                                  <span className="font-medium">{activeEnrollments[0].courseDetails.subjects[0].name}</span>
                                </div>
                              )}
                            </div>

                            {/* Course Features */}
                            <div className="flex flex-wrap gap-2">
                              <div className="px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                                Self-Paced Learning
                              </div>
                              <div className="px-3 py-1.5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs font-semibold">
                                Interactive Content
                              </div>
                              <div className="px-3 py-1.5 rounded-full bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 text-xs font-semibold">
                                Expert Instructors
                              </div>
                            </div>

                            {/* CTA Button */}
                            <div className="pt-2">
                              <Button 
                                size="lg"
                                className="w-full sm:w-auto font-bold text-base shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 bg-gradient-to-r from-primary to-blue-600"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  router.push(`/courses/${activeEnrollments[0].course}`)
                                }}
                              >
                                <IconPlayerPlay className="mr-3 h-5 w-5" />
                                Continue Learning
                                <IconArrowRight className="ml-2 h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </div>
                  </Card>
                </CardContent>
              </Card>
            )}

            {/* Other Active Classes - Show remaining classes after the first one */}
            {activeEnrollments.length > 1 && (
              <Card className="border-2 border-primary/20 shadow-md">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <IconBook className="h-5 w-5 text-primary" />
                    </div>
                      <CardTitle className="text-2xl font-bold">
                        Other Active Classes
                        <span className="ml-2 text-sm font-normal text-muted-foreground">
                          ({activeEnrollments.length - 1} {activeEnrollments.length - 1 === 1 ? 'class' : 'classes'})
                        </span>
                      </CardTitle>
                  </div>
                  <Button variant="ghost" onClick={() => router.push('/courses')} className="hover:bg-primary/10">
                    View All
                    <IconChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                  {activeEnrollments.slice(1).map((enrollment, index) => (
                    <Card 
                      key={enrollment.id} 
                      className="overflow-hidden hover:shadow-lg transition-colors cursor-pointer border-2 border-border hover:border-primary/50"
                      onClick={() => router.push(`/courses/${enrollment.course}`)}
                    >
                      <CardContent className="p-5">
                        <div className="flex items-center gap-4">
                          {/* Course Icon */}
                          <div className="relative flex-shrink-0">
                            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary/15 to-blue-600/15 flex items-center justify-center">
                              <IconBook className="h-8 w-8 text-primary" />
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold shadow-md">
                              <IconCheck className="h-3 w-3" />
                            </div>
                          </div>
                          
                          {/* Course Details */}
                          <div className="flex-1 min-w-0 space-y-2">
                            <h3 className="text-base font-bold group-hover:text-primary transition-colors truncate">
                              {enrollment.courseDetails?.title || 'Course Title'}
                            </h3>
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              {enrollment.courseDetails?.description || 'No description available'}
                            </p>
                            <div className="flex items-center justify-between">
                              <Badge variant={enrollment.status === 'completed' ? 'default' : 'secondary'} className="text-xs">
                                {enrollment.status === 'completed' ? 'Active' : enrollment.status}
                              </Badge>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <IconUsers className="h-3 w-3" />
                                <span>{enrollment.courseDetails?.enrolled_count || 0} students</span>
                              </div>
                            </div>
                          </div>
                          
                          {/* Arrow */}
                          <IconChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                        </div>
                      </CardContent>
                    </Card>
                  ))
                }
              </CardContent>
            </Card>
            )}
          </div>

          <div className="space-y-6">
            
            {/* Upcoming Sessions - Enhanced */}
            <Card className="border-2 border-purple-500/20 shadow-md">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500/20 to-purple-600/10 flex items-center justify-center">
                      <IconCalendar className="h-4 w-4 text-purple-600 dark:text-purple-500" />
                    </div>
                    <CardTitle className="text-lg font-bold">Upcoming Sessions</CardTitle>
                  </div>
                  {upcomingSessions.length > 0 && (
                    <Badge variant="secondary" className="text-xs font-bold">
                      {upcomingSessions.length}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {upcomingSessions.length === 0 ? (
                  <div className="text-center py-10 space-y-4">
                    <div className="relative inline-block">
                      <div className="w-16 h-16 mx-auto rounded-xl bg-gradient-to-br from-purple-100 to-purple-50 dark:from-purple-950 dark:to-purple-900 flex items-center justify-center">
                        <IconCalendar className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-white text-xs">
                        📅
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-muted-foreground">No sessions scheduled</p>
                      <p className="text-xs text-muted-foreground">Check back soon for updates</p>
                    </div>
                  </div>
                ) : (
                  upcomingSessions.map((session, index) => (
                    <Card 
                      key={session.id}
                      className="overflow-hidden hover:shadow-lg transition-colors cursor-pointer border-2 border-border hover:border-purple-500/50"
                      onClick={() => router.push(`/courses/${session.courseId}/sessions`)}
                    >
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-sm line-clamp-2">
                              {session.title}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1 line-clamp-1">
                              {session.courseTitle}
                            </div>
                          </div>
                          {session.status === 'live' && (
                            <Badge className="bg-red-500 text-white text-xs flex-shrink-0">
                              Live
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-3 text-xs">
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <IconClock className="h-3.5 w-3.5" />
                            <span className="font-medium">
                              {new Date(`${session.timetable?.date}T${session.timetable?.start_time}`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                          <div className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <span className="font-medium">
                              {new Date(`${session.timetable?.date}T${session.timetable?.start_time}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                        
                        <Button 
                          size="sm" 
                          className="w-full h-8 text-xs font-semibold bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 transition-all"
                          onClick={(e) => {
                            e.stopPropagation()
                            router.push(`/courses/${session.courseId}/sessions/${session.id}/join`)
                          }}
                        >
                          {session.status === 'live' ? (
                            <>
                              <IconVideo className="mr-1.5 h-3.5 w-3.5" />
                              Join Now
                            </>
                          ) : (
                            <>
                              <IconCalendar className="mr-1.5 h-3.5 w-3.5" />
                              View Details
                            </>
                          )}
                        </Button>
                      </CardContent>
                    </Card>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Quick Access - Enhanced */}
            <Card className="border-2 border-primary/20 shadow-md animate-in fade-in slide-in-from-right duration-700 delay-100">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-blue-600/10 flex items-center justify-center">
                    <IconRocket className="h-4 w-4 text-primary" />
                  </div>
                  <CardTitle className="text-lg font-bold">Quick Access</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  variant="outline" 
                  className="w-full justify-start h-11 font-semibold hover:bg-primary/10 hover:border-primary/50 transition-all group"
                  onClick={() => router.push('/quran')}
                >
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500/20 to-emerald-500/10 flex items-center justify-center mr-3 group-hover:scale-110 transition-transform">
                    <IconBook2 className="h-4 w-4 text-green-600 dark:text-green-500" />
                  </div>
                  <span className="flex-1 text-left">Read Quran</span>
                  <IconChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </Button>

                <Button 
                  variant="outline" 
                  className="w-full justify-start h-11 font-semibold hover:bg-primary/10 hover:border-primary/50 transition-all group"
                  onClick={() => router.push('/courses')}
                >
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/10 flex items-center justify-center mr-3 group-hover:scale-110 transition-transform">
                    <IconBook className="h-4 w-4 text-blue-600 dark:text-blue-500" />
                  </div>
                  <span className="flex-1 text-left">Browse Classes</span>
                  <IconChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </Button>

                <Button 
                  variant="outline" 
                  className="w-full justify-start h-11 font-semibold hover:bg-primary/10 hover:border-primary/50 transition-all group"
                  onClick={() => router.push('/library')}
                >
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/10 flex items-center justify-center mr-3 group-hover:scale-110 transition-transform">
                    <IconBook2 className="h-4 w-4 text-purple-600 dark:text-purple-500" />
                  </div>
                  <span className="flex-1 text-left">Visit Library</span>
                  <IconChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </Button>

                <Button 
                  variant="outline" 
                  className="w-full justify-start h-11 font-semibold hover:bg-primary/10 hover:border-primary/50 transition-all group"
                  onClick={() => router.push('/profile')}
                >
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/10 flex items-center justify-center mr-3 group-hover:scale-110 transition-transform">
                    <IconUsers className="h-4 w-4 text-amber-600 dark:text-amber-500" />
                  </div>
                  <span className="flex-1 text-left">My Profile</span>
                  <IconChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Recommended Classes Section */}
        <Card className="border-2 border-blue-500/20 shadow-lg bg-gradient-to-br from-blue-500/5 to-cyan-500/5">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-lg">
                  <IconSparkles className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-bold">Recommended for You</CardTitle>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {loadingRecommended ? 'Loading classes...' : `${recommendedCourses.length} classes available`}
                  </p>
                </div>
              </div>
              <Button variant="ghost" onClick={() => router.push('/courses')} className="hover:bg-primary/10">
                View All
                <IconChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loadingRecommended ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="overflow-hidden">
                    <Skeleton className="h-60 w-full" />
                    <CardContent className="p-6 space-y-4">
                      <Skeleton className="h-6 w-3/4" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-10 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : recommendedCourses.length === 0 ? (
              <div className="text-center py-16 space-y-4">
                <div className="w-24 h-24 mx-auto rounded-3xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                  <IconBook className="h-12 w-12 text-primary" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold">No Classes Available</h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    Check back soon for new class recommendations
                  </p>
                </div>
                <Button onClick={() => router.push('/courses')} className="mt-4">
                  <IconRocket className="mr-2 h-4 w-4" />
                  Browse All Classes
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recommendedCourses.map((course) => (
                  <div key={course.id} className="group">
                    <Card className="relative flex flex-col h-full overflow-hidden transition-all duration-500 hover:-translate-y-1 border-0 bg-gradient-to-br from-card via-card to-card/95 rounded-3xl shadow-lg hover:shadow-2xl">
                      {/* Cover Image Section */}
                      <div className="relative h-60 overflow-hidden bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">
                        {course.cover_image ? (
                          <img 
                            src={course.cover_image.startsWith('http') ? course.cover_image : getMediaUrl(course.cover_image)}
                            alt={course.title}
                            className="w-full h-full object-cover transition-all duration-700 group-hover:brightness-110"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.parentElement.querySelector('.placeholder-cover').style.display = 'flex';
                            }}
                          />
                        ) : null}
                        
                        {/* Premium Course Cover Placeholder */}
                        <CoursePlaceholder 
                          title={course.title}
                          category={course.category}
                          size="large"
                          className={course.cover_image ? 'hidden' : ''}
                        />
                        
                        {/* Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
                        
                        {/* Badges */}
                        <div className="absolute top-4 left-4 right-4 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            {course.has_live_session && (
                              <div className="flex items-center gap-2 bg-gradient-to-r from-red-500 to-red-600 text-white px-3 py-1.5 rounded-full text-xs font-black shadow-2xl backdrop-blur-md border border-red-400/40">
                                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                                LIVE
                              </div>
                            )}
                            {course.is_special_class && (
                              <div className="flex items-center gap-2 bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 text-white px-3 py-1.5 rounded-full text-xs font-black shadow-2xl backdrop-blur-md border border-amber-300/40">
                                <IconSparkles className="h-3.5 w-3.5" />
                                PRO
                              </div>
                            )}
                          </div>
                          
                          {/* Price */}
                          <div className="bg-white/95 dark:bg-gray-900/95 text-gray-900 dark:text-white px-4 py-2 rounded-full text-sm font-black shadow-2xl backdrop-blur-md border border-white/50 dark:border-gray-700/50">
                            {course.price && parseFloat(course.price) > 0 ? `$${course.price}` : 'Free'}
                          </div>
                        </div>
                        
                        {/* Subject Badge */}
                        {course.subjects?.[0]?.name && (
                          <div className="absolute bottom-4 left-4">
                            <div className="bg-black/80 dark:bg-white/90 backdrop-blur-md text-white dark:text-gray-900 px-3 py-1.5 rounded-full text-xs font-bold shadow-xl border border-white/30 dark:border-gray-300/30 tracking-wide">
                              {course.subjects[0].name}{course.subjects.length > 1 && ` +${course.subjects.length - 1}`}
                            </div>
                          </div>
                        )}

                        {/* View Details Overlay - Appears on Hover */}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                          <div className="bg-white/95 dark:bg-gray-900/95 text-gray-900 dark:text-white px-6 py-3 rounded-full text-sm font-bold shadow-2xl backdrop-blur-md border border-white/50 dark:border-gray-700/50 flex items-center gap-2">
                            <IconBook className="h-4 w-4" />
                            View Class Details
                            <IconArrowRight className="h-4 w-4" />
                          </div>
                        </div>
                      </div>

                      {/* Card Content */}
                      <div className="flex-1 flex flex-col p-7 space-y-5">
                        {/* Title */}
                        <h3 className="font-bold text-xl leading-tight line-clamp-2 group-hover:text-primary transition-colors duration-300 min-h-[3.5rem] tracking-tight">
                          {course.title}
                        </h3>

                        {/* Instructor */}
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <div className="p-1.5 bg-primary/10 dark:bg-primary/20 rounded-full">
                            <IconUsers className="h-3.5 w-3.5 text-primary" />
                          </div>
                          <span className="truncate font-medium">
                            {course.teachers?.[0]?.full_name || course.teachers?.[0]?.first_name || 'Expert Instructor'}
                          </span>
                        </div>

                        {/* Spacer */}
                        <div className="flex-1 min-h-[1px]"></div>

                        {/* Enrollment Stats */}
                        <div className="flex items-center justify-between text-xs pt-2">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <IconUsers className="h-3.5 w-3.5" />
                            <span className="font-medium">{course.enrolled_count ?? 0} students</span>
                          </div>
                          {course.seat_left !== undefined && course.seat_left <= 5 && course.seat_left > 0 && (
                            <span className="text-red-500 dark:text-red-400 font-bold bg-red-50 dark:bg-red-950/30 px-2 py-1 rounded-full text-[10px]">
                              {course.seat_left} left
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Card Footer */}
                      <div className="p-7 pt-0">
                        {course.is_enrolled ? (
                          <div className="space-y-3">
                            <div className="flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/30 rounded-2xl border border-emerald-200 dark:border-emerald-800">
                              <IconCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                              <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400">You're Enrolled</span>
                            </div>
                            <Button
                              variant="ghost"
                              className="w-full flex items-center justify-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                router.push(`/courses/${course.id}`);
                              }}
                            >
                              <IconBook className="h-4 w-4" />
                              View Class Details
                              <IconArrowRight className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <Button 
                              className="w-full h-14 font-bold text-base rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary" 
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                router.push(`/courses/${course.id}`);
                              }}
                              disabled={course.seat_left === 0}
                            >
                              {course.seat_left === 0 ? 'Class Full' : 'Enroll Now'}
                              {course.seat_left !== 0 && <IconSparkles className="h-5 w-5 ml-2" />}
                            </Button>
                            <Button
                              variant="ghost"
                              className="w-full flex items-center justify-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                router.push(`/courses/${course.id}`);
                              }}
                            >
                              <IconBook className="h-4 w-4" />
                              View Class Details
                              <IconArrowRight className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </Card>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Scroll Animated Section Wrapper
function ScrollAnimatedSection({ children }) {
  const [ref, isVisible] = useScrollAnimation()
  
    return (
    <div 
      ref={ref}
      className={`transition-all duration-700 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
      }`}
    >
      {children}
    </div>
  )
}

