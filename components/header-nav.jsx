"use client"

import { useContext, useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { 
  IconSearch, 
  IconBell, 
  IconMenu2,
  IconX,
  IconBook,
  IconBook2,
  IconBooks,
  IconUser,
  IconArticle,
  IconHome,
  IconLogout,
  IconSettings,
  IconChevronRight,
  IconDashboard
} from '@tabler/icons-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import AuthContext from '@/context/AuthContext'
import { enrollmentAPI } from '@/lib/api'
import { getMediaUrl } from '@/lib/config'
import { ThemeToggle } from "@/components/theme-toggle"
import NotificationBell from "@/components/notifications/NotificationBell"
import NotificationDropdown from "@/components/notifications/NotificationDropdown"
import { useNotifications } from "@/hooks/use-notifications"
import { useTheme } from "next-themes"
export default function HeaderNav() {
  const { userData, logoutUser } = useContext(AuthContext)
  const router = useRouter()
  const { theme, resolvedTheme } = useTheme()
  const [searchQuery, setSearchQuery] = useState('')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userCourses, setUserCourses] = useState([])
  const [loadingCourses, setLoadingCourses] = useState(false)
  const [notificationDropdownOpen, setNotificationDropdownOpen] = useState(false)
  const notificationBellRef = useRef(null)
  
  // Initialize notifications hook
  const {
    notifications,
    unreadCount,
    loading: notificationsLoading,
    isConnected: notificationsConnected,
    markAsRead,
    markAsUnread,
    markAllAsRead,
    deleteNotification,
    deleteAll,
    requestNotificationPermission
  } = useNotifications(userData?.id)

  useEffect(() => {
    const fetchEnrolledCourses = async () => {
      if (!userData?.id) return;
      setLoadingCourses(true);
      try {
        // Fetch enrollments for this user with status completed/active
        const res = await enrollmentAPI.getEnrollments({ student: userData.id, status: 'completed' });
        // Each enrollment has class_data with the course object
        const courses = (res.data || [])
          .map(e => e.class_data)
          .filter(Boolean);
        setUserCourses(courses);
      } catch (err) {
        setUserCourses([]);
      } finally {
        setLoadingCourses(false);
      }
    };
    if (userData) fetchEnrolledCourses();
    else setUserCourses([]);
  }, [userData]);

  // Request notification permission when user logs in
  useEffect(() => {
    if (userData && 'Notification' in window && Notification.permission === 'default') {
      requestNotificationPermission()
    }
  }, [userData, requestNotificationPermission]);

  // Close notification dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationBellRef.current && !notificationBellRef.current.contains(event.target)) {
        setNotificationDropdownOpen(false)
      }
    }

    if (notificationDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [notificationDropdownOpen]);

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`)
    }
  }

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
        <div className="container px-4 md:px-8 lg:px-12">
          <div className="flex h-16 items-center justify-between">
            {/* Desktop - Left section: Logo and Navigation */}
            <div className="hidden md:flex items-center gap-8">
              <Link href="/" className="inline-block group">
                <div className="w-14 h-14 rounded-xl flex items-center justify-center shadow-lg ring-2 ring-primary/30 group-hover:ring-primary/50 transition-all bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border border-gray-200 dark:border-gray-700">
                  <Image 
                    src="/Transparent Version of Logo.png" 
                    alt="Deen Bridge Logo" 
                    width={56} 
                    height={56}
                    className={`object-contain drop-shadow-md w-full h-full transition-all ${resolvedTheme === 'dark' ? 'brightness-0 invert' : ''}`}
                  />
                </div>
              </Link>
              
              <nav className="flex items-center space-x-1">
                <Link
                  href="/courses"
                  className="group flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all duration-200 hover:bg-primary/10 text-foreground/70 hover:text-primary font-medium relative"
                >
                  <IconBook className="h-4 w-4 transition-transform group-hover:scale-110" />
                  <span className="relative">
                    Classes
                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-200 group-hover:w-full"></span>
                  </span>
                </Link>
                <Link
                  href="/quran"
                  className="group flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all duration-200 hover:bg-primary/10 text-foreground/70 hover:text-primary font-medium relative"
                >
                  <IconBook2 className="h-4 w-4 transition-transform group-hover:scale-110" />
                  <span className="relative">
                    Quran
                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-200 group-hover:w-full"></span>
                  </span>
                </Link>
                <Link
                  href="/library"
                  className="group flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all duration-200 hover:bg-primary/10 text-foreground/70 hover:text-primary font-medium relative"
                >
                  <IconBooks className="h-4 w-4 transition-transform group-hover:scale-110" />
                  <span className="relative">
                    Library
                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-200 group-hover:w-full"></span>
                  </span>
                </Link>
                <Link
                  href="/blogs"
                  className="group flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all duration-200 hover:bg-primary/10 text-foreground/70 hover:text-primary font-medium relative"
                >
                  <IconArticle className="h-4 w-4 transition-transform group-hover:scale-110" />
                  <span className="relative">
                    Blog
                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-200 group-hover:w-full"></span>
                  </span>
                </Link>
              </nav>
            </div>

            {/* Mobile - Left section: Menu button only */}
            <div className="flex md:hidden items-center">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileMenuOpen(true)}
                className="hover:bg-primary/10 transition-colors"
              >
                <IconMenu2 className="h-6 w-6" />
              </Button>
            </div>

            {/* Desktop - Center: Search bar */}
            <div className="hidden md:flex flex-1 items-center justify-center px-8">
              <form 
                onSubmit={handleSearch}
                className="w-full max-w-md lg:max-w-lg xl:max-w-xl"
              >
                <div className="relative group">
                  <IconSearch className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    type="search"
                    placeholder="Search classes, library, and more..."
                    className="pl-11 pr-4 h-11 w-full rounded-full bg-muted/40 border border-border/50 focus:border-primary/50 focus:bg-background focus:shadow-sm transition-all placeholder:text-muted-foreground/60"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </form>
            </div>

            {/* Right section - Actions (both mobile and desktop) */}
            <div className="flex items-center gap-1.5">
              {/* My Classes - Desktop only */}
              {userData && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="hidden md:flex hover:bg-primary/10 transition-colors relative group">
                      <IconBook className="h-5 w-5 text-foreground/70 group-hover:text-primary transition-colors" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-64" align="end" forceMount>
                    <DropdownMenuLabel>My Classes</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {loadingCourses ? (
                      <DropdownMenuItem disabled>Loading...</DropdownMenuItem>
                    ) : userCourses.length > 0 ? (
                      userCourses.map((course) => (
                        <DropdownMenuItem key={course.id} asChild>
                          <Link href={`/courses/${course.id}`}>
                            {course.title}
                          </Link>
                        </DropdownMenuItem>
                      ))
                    ) : (
                      <DropdownMenuItem disabled>No classes yet</DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/my-learning">
                        <Button variant="default" size="sm" className="w-full">
                          Go to My Learning
                        </Button>
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
                
              {/* Notification Bell */}
              {userData && (
                <div className="relative" ref={notificationBellRef}>
                  <NotificationBell
                    unreadCount={unreadCount}
                    isOpen={notificationDropdownOpen}
                    onClick={() => setNotificationDropdownOpen(!notificationDropdownOpen)}
                  />
                  
                  {notificationDropdownOpen && (
                    <NotificationDropdown
                      notifications={notifications}
                      loading={notificationsLoading}
                      isConnected={notificationsConnected}
                      onMarkAsRead={markAsRead}
                      onMarkAsUnread={markAsUnread}
                      onMarkAllAsRead={markAllAsRead}
                      onDelete={deleteNotification}
                      onDeleteAll={deleteAll}
                      onClose={() => setNotificationDropdownOpen(false)}
                      triggerRef={notificationBellRef}
                    />
                  )}
                </div>
              )}

              {/* Theme Toggle - Desktop only */}
              <div className="hidden md:block">
                <ThemeToggle />
              </div>

              {/* User Menu - Desktop */}
              {userData ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button className="hidden md:flex relative h-9 w-9 rounded-full p-0 overflow-hidden">
                      {userData.profile_image ? (
                        <Image
                          src={userData.profile_image.startsWith('http') ? userData.profile_image : getMediaUrl(userData.profile_image)}
                          alt={userData.full_name || 'User'}
                          width={36}
                          height={36}
                          className="h-9 w-9 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                          {userData.full_name ? userData.full_name.charAt(0).toUpperCase() : 'U'}
                        </div>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{userData.full_name}</p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {userData.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {userData.role !== 'student' && (
                      <DropdownMenuItem asChild>
                        <Link href={userData.role === 'super_admin' ? '/dashboard/super-admin' : '/dashboard'}>
                          <IconDashboard className="mr-2 h-4 w-4" />
                          Dashboard
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem asChild>
                      <Link href="/profile">
                        <IconUser className="mr-2 h-4 w-4" />
                        Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={logoutUser}>
                      <IconLogout className="mr-2 h-4 w-4" />
                      Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <div className="hidden md:flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => router.push("/login")}
                  >
                    Log in
                  </Button>
                  <Button 
                    size="sm"
                    onClick={() => router.push("/signup")}
                  >
                    Sign up
                  </Button>
                </div>
              )}

              {/* Mobile - Logo on the absolute right */}
              <Link href="/" className="inline-block md:hidden ml-auto">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg ring-2 ring-primary/30 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border border-gray-200 dark:border-gray-700">
                  <Image 
                    src="/Transparent Version of Logo.png" 
                    alt="Deen Bridge Logo" 
                    width={48} 
                    height={48}
                    className={`object-contain drop-shadow-md w-full h-full transition-all ${resolvedTheme === 'dark' ? 'brightness-0 invert' : ''}`}
                  />
                </div>
              </Link>
            </div>
          </div>

        </div>
      </header>

      {/* Mobile Drawer Menu */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="w-[85vw] sm:w-[350px] p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation Menu</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col h-full">
            {/* User Profile Section */}
            {userData ? (
              <div className="p-6 border-b border-border/40 bg-gradient-to-br from-primary/5 via-primary/3 to-transparent">
                <div className="flex items-center gap-4">
                  {userData.profile_image ? (
                    <div className="flex h-14 w-14 items-center justify-center rounded-full overflow-hidden shadow-md ring-2 ring-primary/20">
                      <Image
                        src={userData.profile_image.startsWith('http') ? userData.profile_image : getMediaUrl(userData.profile_image)}
                        alt={userData.full_name || 'User'}
                        width={56}
                        height={56}
                        className="h-14 w-14 rounded-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/80 text-lg font-bold text-primary-foreground shadow-md">
                      {userData.full_name ? userData.full_name.charAt(0).toUpperCase() : 'U'}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-semibold text-foreground truncate">
                      {userData.full_name}
                    </p>
                    <p className="text-sm text-muted-foreground truncate">
                      {userData.email}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6 border-b border-border/40 bg-gradient-to-br from-primary/5 via-primary/3 to-transparent">
                <div className="flex flex-col gap-3">
                  <p className="text-sm text-muted-foreground mb-2">Welcome to Deen Bridge</p>
                  <Button 
                    className="w-full"
                    onClick={() => {
                      setMobileMenuOpen(false)
                      router.push("/login")
                    }}
                  >
                    Log in
                  </Button>
                  <Button 
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setMobileMenuOpen(false)
                      router.push("/signup")
                    }}
                  >
                    Sign up
                  </Button>
                </div>
              </div>
            )}

            {/* Navigation Links */}
            <nav className="flex-1 overflow-y-auto py-6 px-4">
              <div className="space-y-1">
                <p className="px-3 mb-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Explore
                </p>
                
                <Link 
                  href="/" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="group flex items-center justify-between px-3 py-3.5 rounded-xl hover:bg-primary/10 transition-all duration-200 text-foreground hover:text-primary font-medium"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                      <IconHome className="h-5 w-5 text-primary" />
                    </div>
                    <span className="font-medium">Home</span>
                  </div>
                  <IconChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </Link>

                <Link 
                  href="/courses" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="group flex items-center justify-between px-3 py-3.5 rounded-xl hover:bg-primary/10 transition-all duration-200 text-foreground hover:text-primary font-medium"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                      <IconBook className="h-5 w-5 text-primary" />
                    </div>
                    <span className="font-medium">Classes</span>
                  </div>
                  <IconChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </Link>

                <Link 
                  href="/quran" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="group flex items-center justify-between px-3 py-3.5 rounded-xl hover:bg-primary/10 transition-all duration-200 text-foreground hover:text-primary font-medium"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                      <IconBook2 className="h-5 w-5 text-primary" />
                    </div>
                    <span className="font-medium">Quran</span>
                  </div>
                  <IconChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </Link>

                <Link 
                  href="/library" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="group flex items-center justify-between px-3 py-3.5 rounded-xl hover:bg-primary/10 transition-all duration-200 text-foreground hover:text-primary font-medium"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                      <IconBooks className="h-5 w-5 text-primary" />
                    </div>
                    <span className="font-medium">Library</span>
                  </div>
                  <IconChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </Link>

                <Link 
                  href="/blogs" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="group flex items-center justify-between px-3 py-3.5 rounded-xl hover:bg-primary/10 transition-all duration-200 text-foreground hover:text-primary font-medium"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                      <IconArticle className="h-5 w-5 text-primary" />
                    </div>
                    <span className="font-medium">Blog</span>
                  </div>
                  <IconChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </Link>

                {userData && (
                  <>
                    <div className="my-4 border-t border-border/40" />
                    
                    <p className="px-3 mb-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      My Account
                    </p>

                    <Link 
                      href="/my-learning" 
                      onClick={() => setMobileMenuOpen(false)}
                      className="group flex items-center justify-between px-3 py-3.5 rounded-xl hover:bg-primary/10 transition-all duration-200 text-foreground hover:text-primary font-medium"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                          <IconBook className="h-5 w-5 text-primary" />
                        </div>
                        <span className="font-medium">My Learning</span>
                      </div>
                      <IconChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </Link>

                    {userData.role !== 'student' && (
                      <Link 
                        href={userData.role === 'super_admin' ? '/dashboard/super-admin' : '/dashboard'}
                        onClick={() => setMobileMenuOpen(false)}
                        className="group flex items-center justify-between px-3 py-3.5 rounded-xl hover:bg-primary/10 transition-all duration-200 text-foreground hover:text-primary font-medium"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                            <IconDashboard className="h-5 w-5 text-primary" />
                          </div>
                          <span className="font-medium">Dashboard</span>
                        </div>
                        <IconChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      </Link>
                    )}

                    <Link 
                      href="/profile" 
                      onClick={() => setMobileMenuOpen(false)}
                      className="group flex items-center justify-between px-3 py-3.5 rounded-xl hover:bg-primary/10 transition-all duration-200 text-foreground hover:text-primary font-medium"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                          <IconUser className="h-5 w-5 text-primary" />
                        </div>
                        <span className="font-medium">Profile</span>
                      </div>
                      <IconChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </Link>

                    <Link 
                      href="/profile" 
                      onClick={() => setMobileMenuOpen(false)}
                      className="group flex items-center justify-between px-3 py-3.5 rounded-xl hover:bg-primary/10 transition-all duration-200 text-foreground hover:text-primary font-medium"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                          <IconSettings className="h-5 w-5 text-primary" />
                        </div>
                        <span className="font-medium">Settings</span>
                      </div>
                      <IconChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </Link>
                  </>
                )}
              </div>
            </nav>

            {/* Footer Section */}
              <div className="p-4 border-t border-border/40">
                <div className="mb-4 flex items-center justify-between px-3">
                  <span className="text-sm font-medium text-foreground">Theme</span>
                  <ThemeToggle />
                </div>
              {userData && (
                <Button 
                  variant="outline" 
                  className="w-full justify-start gap-3 h-12 text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => {
                    setMobileMenuOpen(false)
                    logoutUser()
                  }}
                >
                  <IconLogout className="h-5 w-5" />
                  <span className="font-medium">Log out</span>
                </Button>
              )}
              </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}