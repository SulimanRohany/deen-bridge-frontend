'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { 
  IconSparkles,
  IconBook,
  IconUsers,
  IconWorld,
  IconHeart,
  IconAward,
  IconTarget,
  IconRocket,
  IconCheck,
  IconTrendingUp,
  IconSchool,
  IconBuilding,
  IconStar,
  IconArrowRight,
  IconClock,
  IconBook2
} from '@tabler/icons-react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

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

// Scroll Animated Section Component with delay support
function ScrollAnimatedSection({ children, delay = 0 }) {
  const [ref, isVisible] = useScrollAnimation()
  
  return (
    <div 
      ref={ref}
      className={`transition-all duration-700 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
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

// 3D Tilt Card Component
function TiltCard({ children, className = '' }) {
  const cardRef = useRef(null)
  const [rotation, setRotation] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const card = cardRef.current
    if (!card) return

    const handleMouseMove = (e) => {
      const rect = card.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      const centerX = rect.width / 2
      const centerY = rect.height / 2
      const rotateX = (y - centerY) / 10
      const rotateY = (centerX - x) / 10

      setRotation({ x: rotateX, y: rotateY })
    }

    const handleMouseLeave = () => {
      setRotation({ x: 0, y: 0 })
    }

    card.addEventListener('mousemove', handleMouseMove)
    card.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      card.removeEventListener('mousemove', handleMouseMove)
      card.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [])

  return (
    <div
      ref={cardRef}
      className={className}
      style={{
        transform: `perspective(1000px) rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
        transition: 'transform 0.1s ease-out'
      }}
    >
      {children}
    </div>
  )
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

export default function AboutPage() {
  const coreValues = [
    {
      icon: IconBook,
      title: 'Authenticity',
      description: 'All teachings derived from Quran and authentic Sunnah, ensuring genuine Islamic knowledge.',
      verse: 'وَاعْتَصِمُوا بِحَبْلِ اللَّهِ',
      gradient: 'from-green-500 to-emerald-600'
    },
    {
      icon: IconUsers,
      title: 'Excellence',
      description: 'Learn from certified scholars with Ijazah and credentials, maintaining the highest standards.',
      verse: 'فَاسْأَلُوا أَهْلَ الذِّكْرِ',
      gradient: 'from-blue-500 to-indigo-600'
    },
    {
      icon: IconHeart,
      title: 'Sincerity (Ikhlas)',
      description: 'Every action is done with pure intention for the sake of Allah.',
      verse: 'إِنَّمَا نُطْعِمُكُمْ لِوَجْهِ اللَّهِ',
      gradient: 'from-pink-500 to-rose-600'
    },
    {
      icon: IconWorld,
      title: 'Accessibility',
      description: 'Making quality Islamic education accessible to Muslims worldwide, regardless of location.',
      verse: 'وَمَا أَرْسَلْنَاكَ إِلَّا رَحْمَةً لِّلْعَالَمِينَ',
      gradient: 'from-purple-500 to-violet-600'
    },
    {
      icon: IconBuilding,
      title: 'Community',
      description: 'Building a strong Ummah through shared learning and mutual support.',
      verse: 'وَاعْتَصِمُوا بِحَبْلِ اللَّهِ جَمِيعًا',
      gradient: 'from-orange-500 to-amber-600'
    },
    {
      icon: IconAward,
      title: 'Quality',
      description: 'Committed to delivering the highest quality educational content and experiences.',
      verse: 'وَمَن يَتَّقِ اللَّهَ يَجْعَل لَّهُ مَخْرَجًا',
      gradient: 'from-teal-500 to-cyan-600'
    }
  ]

  const statistics = [
    {
      icon: IconUsers,
      value: 5000,
      suffix: '+',
      label: 'Active Students',
      gradient: 'from-blue-500 to-blue-600'
    },
    {
      icon: IconBook,
      value: 50,
      suffix: '+',
      label: 'Expert Teachers',
      gradient: 'from-purple-500 to-purple-600'
    },
    {
      icon: IconSchool,
      value: 100,
      suffix: '+',
      label: 'Courses Available',
      gradient: 'from-green-500 to-green-600'
    },
    {
      icon: IconWorld,
      value: 30,
      suffix: '+',
      label: 'Countries',
      gradient: 'from-orange-500 to-orange-600'
    }
  ]

  const features = [
    {
      icon: IconTarget,
      title: 'Clear Learning Paths',
      description: 'Structured courses designed to take you from beginner to advanced levels with clear milestones.',
      color: 'text-blue-600 dark:text-blue-400'
    },
    {
      icon: IconStar,
      title: 'Expert Instructors',
      description: 'Learn from certified Islamic scholars with years of teaching experience and authentic credentials.',
      color: 'text-purple-600 dark:text-purple-400'
    },
    {
      icon: IconRocket,
      title: 'Interactive Learning',
      description: 'Engage with live sessions, interactive discussions, and comprehensive resources.',
      color: 'text-green-600 dark:text-green-400'
    },
    {
      icon: IconTrendingUp,
      title: 'Progress Tracking',
      description: 'Monitor your learning journey with detailed progress reports and achievement certificates.',
      color: 'text-orange-600 dark:text-orange-400'
    }
  ]

  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="min-h-screen bg-background">
      {/* Enhanced Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-secondary/5 to-background border-b min-h-[80vh] flex items-center">
        {/* Enhanced Background Patterns */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Grid Pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_80%_60%_at_50%_50%,#000_70%,transparent_100%)]" />
          
          {/* Islamic Geometric Pattern */}
          <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]">
            <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="about-hero-pattern" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
                  <circle cx="40" cy="40" r="30" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-primary" />
                  <circle cx="40" cy="40" r="20" fill="none" stroke="currentColor" strokeWidth="0.3" className="text-blue-600" />
                  <path d="M 40 10 L 40 70 M 10 40 L 70 40" stroke="currentColor" strokeWidth="0.3" className="text-primary" opacity="0.5" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#about-hero-pattern)" />
            </svg>
          </div>

          {/* Multiple Animated Gradient Orbs */}
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 right-1/3 w-72 h-72 bg-blue-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
          <div className="absolute bottom-1/3 left-1/3 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1.5s' }} />
        </div>

        {/* Parallax Content */}
        <div 
          className="container mx-auto px-4 py-20 relative z-10"
          style={{
            transform: `translateY(${scrollY * 0.1}px)`,
            transition: 'transform 0.1s ease-out'
          }}
        >
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <ScrollAnimatedSection delay={0}>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium mb-4 backdrop-blur-sm border border-primary/20">
                <IconSparkles className="w-4 h-4 animate-pulse" />
                <span>About Deen Bridge</span>
              </div>
            </ScrollAnimatedSection>
            
            <ScrollAnimatedSection delay={100}>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight">
                Empowering Muslims Worldwide
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary via-blue-600 to-secondary mt-2 animate-gradient" style={{ backgroundSize: '200% 200%' }}>
                  Through Quality Islamic Education
                </span>
              </h1>
            </ScrollAnimatedSection>
            
            <ScrollAnimatedSection delay={200}>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Deen Bridge is dedicated to providing authentic, accessible, and comprehensive Islamic education to Muslims around the globe.
              </p>
            </ScrollAnimatedSection>
          </div>
        </div>
      </section>

      {/* Enhanced Mission & Vision Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          <ScrollAnimatedSection delay={0}>
            <TiltCard className="h-full">
              <div className="group relative h-full">
                {/* Glow Effect */}
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 via-blue-600/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition duration-500 blur-xl rounded-3xl" />
                <Card className="relative h-full border-2 border-blue-200/50 dark:border-blue-800/50 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 rounded-3xl bg-white dark:bg-slate-900">
                  <CardHeader>
                    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                      <IconTarget className="h-8 w-8 text-white" />
                    </div>
                    <CardTitle className="text-2xl md:text-3xl mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Our Mission</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground leading-relaxed text-base">
                      To empower Muslims worldwide with authentic Islamic knowledge by providing accessible, high-quality education 
                      that connects learners with certified scholars and comprehensive resources, fostering a deeper understanding 
                      of Islam and strengthening the global Ummah.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </TiltCard>
          </ScrollAnimatedSection>

          <ScrollAnimatedSection delay={150}>
            <TiltCard className="h-full">
              <div className="group relative h-full">
                {/* Glow Effect */}
                <div className="absolute -inset-1 bg-gradient-to-r from-purple-500/20 via-purple-600/20 to-pink-500/20 opacity-0 group-hover:opacity-100 transition duration-500 blur-xl rounded-3xl" />
                <Card className="relative h-full border-2 border-purple-200/50 dark:border-purple-800/50 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 rounded-3xl bg-white dark:bg-slate-900">
                  <CardHeader>
                    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                      <IconRocket className="h-8 w-8 text-white" />
                    </div>
                    <CardTitle className="text-2xl md:text-3xl mb-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">Our Vision</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground leading-relaxed text-base">
                      To become the leading global platform for Islamic education, where every Muslim, regardless of location 
                      or background, can access authentic knowledge, learn from qualified teachers, and contribute to the 
                      preservation and propagation of Islamic values in the modern world.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </TiltCard>
          </ScrollAnimatedSection>
        </div>
      </section>

      {/* Enhanced Our Story Section with Timeline */}
      <section className="container mx-auto px-4 py-16 bg-muted/30 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:40px_40px]" />
        </div>

        <ScrollAnimatedSection delay={0}>
          <div className="max-w-4xl mx-auto text-center space-y-8 relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium backdrop-blur-sm border border-primary/20">
              <IconBook className="w-4 h-4" />
              <span>Our Story</span>
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground">
              Building Bridges to Knowledge
            </h2>
          </div>
        </ScrollAnimatedSection>

        {/* Timeline Visualization */}
        <div className="max-w-4xl mx-auto mt-12 relative z-10">
          <div className="space-y-8">
            {/* Timeline Item 1 */}
            <ScrollAnimatedSection delay={0}>
              <div className="flex gap-6 items-start">
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                    <IconBook2 className="h-6 w-6 text-white" />
                  </div>
                  <div className="w-0.5 h-full bg-gradient-to-b from-blue-500/50 to-transparent mt-2 min-h-[60px]" />
                </div>
                <div className="flex-1 pt-2">
                  <Card className="border-2 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                    <CardContent className="p-6">
                      <p className="text-muted-foreground leading-relaxed text-base md:text-lg">
                        Deen Bridge was founded with a simple yet profound vision: to make authentic Islamic education accessible 
                        to every Muslim, everywhere. In a world where quality Islamic learning was often limited by geography, 
                        language barriers, or financial constraints, we saw an opportunity to bridge these gaps.
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </ScrollAnimatedSection>

            {/* Timeline Item 2 */}
            <ScrollAnimatedSection delay={150}>
              <div className="flex gap-6 items-start">
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg">
                    <IconUsers className="h-6 w-6 text-white" />
                  </div>
                  <div className="w-0.5 h-full bg-gradient-to-b from-purple-500/50 to-transparent mt-2 min-h-[60px]" />
                </div>
                <div className="flex-1 pt-2">
                  <Card className="border-2 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                    <CardContent className="p-6">
                      <p className="text-muted-foreground leading-relaxed text-base md:text-lg">
                        Our platform brings together certified Islamic scholars, comprehensive course materials, and innovative 
                        technology to create an immersive learning experience. We believe that seeking knowledge is a fundamental 
                        right for every Muslim, and our mission is to facilitate this journey of learning and spiritual growth.
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </ScrollAnimatedSection>

            {/* Timeline Item 3 */}
            <ScrollAnimatedSection delay={300}>
              <div className="flex gap-6 items-start">
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg">
                    <IconWorld className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="flex-1 pt-2">
                  <Card className="border-2 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                    <CardContent className="p-6">
                      <p className="text-muted-foreground leading-relaxed text-base md:text-lg">
                        Today, Deen Bridge serves thousands of students across the globe, offering courses in Quranic studies, 
                        Islamic jurisprudence, Arabic language, and more. We remain committed to maintaining the highest standards 
                        of authenticity while embracing modern educational methods that make learning engaging and effective.
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </ScrollAnimatedSection>
          </div>
        </div>
      </section>

      {/* Core Values Section */}
      <section className="container mx-auto px-4 py-16">
        <ScrollAnimatedSection>
          <div className="text-center mb-12 max-w-3xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium">
              <IconHeart className="w-4 h-4" />
              <span>Our Foundation</span>
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground">
              Built on Islamic Values
            </h2>
            <p className="text-lg text-muted-foreground">
              Every aspect of our platform reflects the core principles of authentic Islamic education
            </p>
          </div>
        </ScrollAnimatedSection>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {coreValues.map((value, index) => (
            <ScrollAnimatedSection key={index} delay={index * 100}>
              <div className="group relative h-full">
                {/* Enhanced Glow Effect */}
                <div className={`absolute -inset-1 bg-gradient-to-r opacity-0 group-hover:opacity-30 transition duration-500 blur-xl rounded-3xl ${value.gradient}`} />
                <Card className="relative h-full border-2 border-slate-200 dark:border-slate-800 hover:border-primary/50 dark:hover:border-primary/50 transition-all duration-500 hover:shadow-2xl hover:-translate-y-3 rounded-3xl bg-white dark:bg-slate-900">
                  <CardContent className="p-8">
                    <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${value.gradient} flex items-center justify-center shadow-xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 mb-6`}>
                      <value.icon className="h-10 w-10 text-white" />
                    </div>
                    
                    <div className="space-y-4">
                      <h3 className="text-2xl font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors">
                        {value.title}
                      </h3>
                      <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                        {value.description}
                      </p>
                    </div>

                    <div className="pt-4 mt-4 border-t border-slate-200 dark:border-slate-800">
                      <p className="text-lg font-serif text-primary text-center leading-loose" style={{ fontFamily: "'Amiri', serif" }}>
                        {value.verse}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </ScrollAnimatedSection>
          ))}
        </div>
      </section>

      {/* Statistics Section */}
      <section className="container mx-auto px-4 py-16 bg-gradient-to-br from-primary/5 via-secondary/5 to-background">
        <ScrollAnimatedSection>
          <div className="text-center mb-12 max-w-3xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium">
              <IconTrendingUp className="w-4 h-4" />
              <span>Our Impact</span>
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground">
              Growing Together
            </h2>
            <p className="text-lg text-muted-foreground">
              Join thousands of students on their journey to Islamic knowledge
            </p>
          </div>
        </ScrollAnimatedSection>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {statistics.map((stat, index) => (
            <ScrollAnimatedSection key={index} delay={index * 100}>
              <Card className="group text-center border-2 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 rounded-2xl bg-white dark:bg-slate-900">
                <CardContent className="p-8">
                  <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 animate-pulse-glow`}>
                    <stat.icon className="h-8 w-8 text-white" />
                  </div>
                  <div className="text-4xl md:text-5xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                    <AnimatedCounter end={stat.value} suffix={stat.suffix} />
                  </div>
                  <p className="text-muted-foreground font-medium">{stat.label}</p>
                  {/* Progress Bar */}
                  <div className="mt-4 h-1 bg-muted rounded-full overflow-hidden">
                    <div 
                      className={`h-full bg-gradient-to-r ${stat.gradient} rounded-full transition-all duration-1000`}
                      style={{ width: '0%' }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.width = '100%'
                      }}
                    />
                  </div>
                </CardContent>
              </Card>
            </ScrollAnimatedSection>
          ))}
        </div>
      </section>

      {/* Enhanced Why Choose Us Section with Bento Grid */}
      <section className="container mx-auto px-4 py-16">
        <ScrollAnimatedSection delay={0}>
          <div className="text-center mb-12 max-w-3xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium backdrop-blur-sm border border-primary/20">
              <IconStar className="w-4 h-4" />
              <span>Why Choose Us</span>
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground">
              What Makes Deen Bridge Special
            </h2>
            <p className="text-lg text-muted-foreground">
              Discover the features that set us apart in Islamic education
            </p>
          </div>
        </ScrollAnimatedSection>

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {/* Large Feature Card */}
          <ScrollAnimatedSection delay={0}>
            <div className="md:col-span-2 group p-10 rounded-3xl bg-gradient-to-br from-primary to-blue-600 text-white hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.3),rgba(255,255,255,0))]" />
              <div className="relative z-10 space-y-6">
                <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                  <IconRocket className="h-8 w-8" />
                </div>
                <h3 className="text-3xl font-bold">Learn at Your Own Pace</h3>
                <p className="text-xl text-white/90 leading-relaxed max-w-2xl">
                  24/7 access to all materials. Study when it fits your schedule, whether that's early morning or late night. Our platform adapts to your learning style.
                </p>
              </div>
            </div>
          </ScrollAnimatedSection>

          {/* Regular Feature Cards */}
          {features.map((feature, index) => (
            <ScrollAnimatedSection key={index} delay={(index + 1) * 100}>
              <Card className="group border-2 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 rounded-2xl bg-white dark:bg-slate-900">
                <CardContent className="p-6">
                  <div className="flex flex-col gap-4">
                    <div className={`w-12 h-12 rounded-xl bg-primary/10 ${feature.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                      <feature.icon className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                        {feature.title}
                      </h3>
                      <p className="text-muted-foreground leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </ScrollAnimatedSection>
          ))}
        </div>
      </section>

      {/* Enhanced CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <ScrollAnimatedSection delay={0}>
          <Card className="border-2 bg-gradient-to-br from-primary via-primary/95 to-secondary text-white overflow-hidden relative rounded-3xl">
            {/* Enhanced Gradient Mesh Background */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl animate-pulse" />
              <div className="absolute bottom-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
              <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-blue-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '0.5s' }} />
            </div>
            
            {/* Gradient Mesh Overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/5 to-transparent" />
            
            <CardContent className="relative z-10 py-16 px-6 text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Ready to Start Your Learning Journey?
              </h2>
              <p className="text-lg text-white/90 mb-8 max-w-2xl mx-auto">
                Join thousands of students learning Quran and Islamic studies with expert teachers
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <MagneticButton 
                  size="lg" 
                  variant="secondary" 
                  className="font-semibold shadow-lg hover:shadow-xl transition-all" 
                  asChild
                >
                  <Link href="/courses">
                    Browse Courses
                    <IconBook className="w-5 h-5 ml-2" />
                  </Link>
                </MagneticButton>
                <MagneticButton 
                  size="lg" 
                  variant="outline" 
                  className="bg-white/10 border-white text-white hover:bg-white hover:text-primary font-semibold shadow-lg hover:shadow-xl transition-all" 
                  asChild
                >
                  <Link href="/signup">
                    Sign Up Free
                    <IconSparkles className="w-5 h-5 ml-2" />
                  </Link>
                </MagneticButton>
              </div>
            </CardContent>
          </Card>
        </ScrollAnimatedSection>
      </section>

      {/* Custom Styles for Animations */}
      <style jsx global>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes pulse-glow {
          0%, 100% { 
            box-shadow: 0 0 20px rgba(59, 130, 246, 0.3);
            opacity: 0.8;
          }
          50% { 
            box-shadow: 0 0 40px rgba(59, 130, 246, 0.6);
            opacity: 1;
          }
        }
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 8s ease infinite;
        }
        .animate-pulse-glow {
          animation: pulse-glow 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}

