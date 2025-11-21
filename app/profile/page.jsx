'use client'

import { useContext, useEffect, useState, useRef, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import AuthContext from '@/context/AuthContext'
import { profileAPI, userAPI, enrollmentAPI, courseAPI } from '@/lib/api'
import { getMediaUrl } from '@/lib/config'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import {
  IconUser,
  IconMail,
  IconPhone,
  IconMapPin,
  IconCalendar,
  IconEdit,
  IconCheck,
  IconX,
  IconCamera,
  IconBook2,
  IconCertificate,
  IconAward,
  IconTrophy,
  IconChartBar,
  IconClock,
  IconVideo,
  IconUsers,
  IconBriefcase,
  IconInfoCircle,
  IconAlertCircle,
  IconLoader,
  IconStar,
  IconTarget,
  IconTrendingUp,
  IconFlame,
  IconBookmark,
  IconFileText,
  IconLock,
  IconGlobe,
  IconLanguage,
  IconSparkles,
  IconRocket,
  IconActivity,
  IconBolt,
  IconSettings,
  IconShieldCheck,
  IconCalendarEvent,
} from '@tabler/icons-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import Link from 'next/link'

export default function ProfilePage() {
  const { userData, authTokens, updateUserData } = useContext(AuthContext)
  const router = useRouter()
  const fileInputRef = useRef(null)

  // State
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [profile, setProfile] = useState(null)
  const [userDetails, setUserDetails] = useState(null)
  const [formData, setFormData] = useState({})
  const [imagePreview, setImagePreview] = useState(null)
  const [imageFile, setImageFile] = useState(null)

  // Statistics
  const [stats, setStats] = useState({
    totalCourses: 0,
    totalCertificates: 0,
    completedCourses: 0,
    activeCourses: 0,
  })

  useEffect(() => {
    if (!userData?.id) {
      router.push('/login')
      return
    }
    fetchProfileData()
  }, [userData?.id])

  const fetchProfileData = async () => {
    try {
      setLoading(true)

      // Fetch user details with profile
      const userResponse = await userAPI.getUserById(userData.id)
      const user = userResponse.data
      setUserDetails(user)

      // Get profile based on role
      const profileData = user.profile
      if (profileData) {
        setProfile(profileData)
        setFormData({
          address: profileData.address || '',
          gender: profileData.gender || '',
          phone_number: profileData.phone_number || '',
          date_of_birth: profileData.date_of_birth ? profileData.date_of_birth.split('T')[0] : '',
          preferred_timezone: profileData.preferred_timezone || 'UTC',
          preferred_language: profileData.preferred_language || 'en',
          // Role-specific fields
          department: profileData.department || '',
          specialization: profileData.specialization || '',
          qualification: profileData.qualification || '',
          bio: profileData.bio || '',
          position: profileData.position || '',
        })
        if (profileData.profile_image) {
          // Construct the full URL for the profile image
          const imageUrl = profileData.profile_image.startsWith('http') 
            ? profileData.profile_image 
            : getMediaUrl(profileData.profile_image)
          setImagePreview(imageUrl)
        }
      }

      // Fetch statistics for students
      if (userData.role === 'student') {
        try {
          const enrollmentsRes = await enrollmentAPI.getEnrollments({ student: userData.id })
          const enrollments = enrollmentsRes.data?.results || enrollmentsRes.data || []
          
          const certificatesRes = await courseAPI.getCertificates({ student: userData.id })
          const certificates = certificatesRes.data?.results || certificatesRes.data || []

          setStats({
            totalCourses: enrollments.length,
            totalCertificates: certificates.length,
            completedCourses: certificates.length,
            activeCourses: enrollments.length - certificates.length,
          })
        } catch (err) {
          console.error('Error fetching stats:', err)
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
      toast.error('Failed to load profile data')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleImageChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB')
        return
      }
      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)

      const data = new FormData()
      
      // Add all form fields
      Object.keys(formData).forEach(key => {
        if (formData[key] !== null && formData[key] !== undefined && formData[key] !== '') {
          data.append(key, formData[key])
        }
      })

      // Add image if changed
      if (imageFile) {
        data.append('profile_image', imageFile)
      }

      // Update profile based on role
      let response
      const profileId = profile?.id

      if (!profileId) {
        // Create profile if it doesn't exist
        data.append('user', userData.id)
        
        switch (userData.role) {
          case 'student':
            response = await profileAPI.createStudentProfile(data)
            break
          case 'teacher':
            response = await profileAPI.createTeacherProfile(data)
            break
          case 'staff':
            response = await profileAPI.createStaffProfile(data)
            break
          case 'super_admin':
            response = await profileAPI.createSuperAdminProfile(data)
            break
          default:
            throw new Error('Unknown role')
        }
      } else {
        // Update existing profile
        switch (userData.role) {
          case 'student':
            response = await profileAPI.updateStudentProfile(profileId, data)
            break
          case 'teacher':
            response = await profileAPI.updateTeacherProfile(profileId, data)
            break
          case 'staff':
            response = await profileAPI.updateStaffProfile(profileId, data)
            break
          case 'super_admin':
            response = await profileAPI.updateSuperAdminProfile(profileId, data)
            break
          default:
            throw new Error('Unknown role')
        }
      }

      setProfile(response.data)
      setIsEditing(false)
      setImageFile(null)
      toast.success('Profile updated successfully!')
      
      // Update AuthContext with new profile data
      if (response.data) {
        const updatedUserData = {
          ...userData
        }
        
        // Update full_name if changed
        if (formData.full_name) {
          updatedUserData.full_name = formData.full_name
        }
        
        // Update profile_image if available
        if (response.data.profile_image) {
          updatedUserData.profile_image = response.data.profile_image
        }
        
        updateUserData(updatedUserData)
      }
      
      // Refresh profile data
      await fetchProfileData()
    } catch (error) {
      console.error('Error saving profile:', error)
      toast.error(error.response?.data?.message || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
    setImageFile(null)
    // Reset form data
    if (profile) {
      setFormData({
        address: profile.address || '',
        gender: profile.gender || '',
        phone_number: profile.phone_number || '',
        date_of_birth: profile.date_of_birth ? profile.date_of_birth.split('T')[0] : '',
        preferred_timezone: profile.preferred_timezone || 'UTC',
        preferred_language: profile.preferred_language || 'en',
        department: profile.department || '',
        specialization: profile.specialization || '',
        qualification: profile.qualification || '',
        bio: profile.bio || '',
        position: profile.position || '',
      })
      if (profile.profile_image) {
        // Construct the full URL for the profile image
        const imageUrl = profile.profile_image.startsWith('http') 
          ? profile.profile_image 
          : getMediaUrl(profile.profile_image)
        setImagePreview(imageUrl)
      } else {
        setImagePreview(null)
      }
    }
  }

  const getRoleBadgeColor = (role) => {
    const colors = {
      student: 'bg-blue-500',
      teacher: 'bg-purple-500',
      staff: 'bg-green-500',
      super_admin: 'bg-red-500',
      parent: 'bg-orange-500',
    }
    return colors[role] || 'bg-gray-500'
  }

  const getRoleIcon = (role) => {
    const icons = {
      student: IconCertificate,
      teacher: IconBriefcase,
      staff: IconUsers,
      super_admin: IconStar,
      parent: IconUsers,
    }
    const Icon = icons[role] || IconUser
    return <Icon className="h-4 w-4" />
  }

  const getInitials = (name) => {
    return name
      ?.split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2) || 'U'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background via-primary/5 to-background">
        {/* Hero Skeleton */}
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-white to-blue-50/30 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 border-b">
          <div className="container mx-auto px-4 py-20">
            <div className="max-w-6xl mx-auto">
              <div className="animate-pulse space-y-6">
                {/* Profile header skeleton */}
                <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
                  <div className="relative">
                    <div className="h-40 w-40 rounded-full bg-muted shadow-2xl" />
                  </div>
                  <div className="flex-1 space-y-4 text-center md:text-left">
                    <div className="h-12 w-96 bg-muted rounded-2xl mx-auto md:mx-0" />
                    <div className="h-6 w-64 bg-muted rounded-xl mx-auto md:mx-0" />
                    <div className="flex items-center gap-3 justify-center md:justify-start">
                      <div className="h-8 w-24 bg-muted rounded-full" />
                      <div className="h-8 w-24 bg-muted rounded-full" />
                    </div>
                  </div>
                </div>
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
            
            {/* Content Cards */}
            <div className="space-y-6">
              <div className="h-12 w-80 bg-muted rounded-xl" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-96 bg-muted rounded-2xl" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Premium Hero Section with Spectacular Profile Background */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-white to-blue-50/30 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 border-b">
        {/* Subtle professional pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#f8fafc_1px,transparent_1px),linear-gradient(to_bottom,#f8fafc_1px,transparent_1px)] bg-[size:24px_24px] dark:bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)]"></div>
        
        {/* Spectacular Profile Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Animated gradient waves */}
          <div className="absolute inset-0">
            <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-violet-400/20 via-purple-400/15 to-fuchsia-400/20 dark:from-violet-600/10 dark:via-purple-600/8 dark:to-fuchsia-600/10 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-gradient-to-bl from-cyan-400/20 via-blue-400/15 to-indigo-400/20 dark:from-cyan-600/10 dark:via-blue-600/8 dark:to-indigo-600/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
          </div>
          
          {/* Floating profile elements */}
          <div className="absolute top-16 right-16 w-32 h-28 bg-gradient-to-br from-blue-100/90 via-indigo-100/70 to-purple-100/60 dark:from-blue-900/40 dark:via-indigo-900/30 dark:to-purple-900/20 backdrop-blur-md rounded-2xl border border-blue-300/60 dark:border-blue-700/40 shadow-2xl transform rotate-12 hover:rotate-6 transition-all duration-1000 opacity-80">
            <div className="p-3 h-full flex items-center justify-center">
              <IconShieldCheck className="h-12 w-12 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          
          <div className="absolute bottom-20 left-12 w-28 h-28 bg-gradient-to-br from-emerald-100/90 via-teal-100/70 to-cyan-100/60 dark:from-emerald-900/40 dark:via-teal-900/30 dark:to-cyan-900/20 backdrop-blur-md rounded-full border-4 border-emerald-300/60 dark:border-emerald-700/40 shadow-2xl transform -rotate-8 hover:-rotate-4 transition-all duration-1000 opacity-75">
            <div className="h-full flex items-center justify-center">
              <IconStar className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
        </div>
        
        {/* Main Profile Header */}
        <div className="container mx-auto px-4 py-16 md:py-20 relative">
          <div className="max-w-6xl mx-auto">
            
            {/* Welcome Badge */}
            <div className="flex justify-center mb-6">
              <div className="inline-flex items-center gap-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm px-4 py-2 rounded-full border border-gray-200 dark:border-gray-700 shadow-sm">
                <IconSparkles className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  {userData?.role?.replace('_', ' ').charAt(0).toUpperCase() + userData?.role?.replace('_', ' ').slice(1) || 'User'} Profile
                </span>
              </div>
            </div>
            
            {/* Profile Header Content */}
            <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
              {/* Profile Image - Large & Prominent */}
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-full blur-lg opacity-75 group-hover:opacity-100 transition duration-500"></div>
                <Avatar className="relative h-40 w-40 border-4 border-white dark:border-gray-900 shadow-2xl">
                  <AvatarImage src={imagePreview || undefined} alt={userDetails?.full_name} />
                  <AvatarFallback className="text-4xl font-bold bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 text-gray-900 dark:text-white">
                    {getInitials(userDetails?.full_name)}
                  </AvatarFallback>
                </Avatar>
                {isEditing && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  >
                    <IconCamera className="h-10 w-10 text-white mb-1" />
                    <span className="text-white text-xs font-semibold">Change Photo</span>
                  </button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </div>

              {/* User Info - Centered on mobile, left-aligned on desktop */}
              <div className="flex-1 text-center md:text-left">
                <div className="space-y-4">
                  {/* Name & Title */}
                  <div>
                    <h1 className="text-4xl sm:text-5xl md:text-6xl font-black leading-tight tracking-tight">
                      <span className="block text-gray-900 dark:text-white">
                        {userDetails?.full_name}
                      </span>
                    </h1>
                    <div className="flex items-center gap-3 mt-4 justify-center md:justify-start flex-wrap">
                      <Badge className={cn('gap-2 px-4 py-2 text-sm font-bold shadow-md', getRoleBadgeColor(userData?.role))}>
                        {getRoleIcon(userData?.role)}
                        {userData?.role?.replace('_', ' ').toUpperCase()}
                      </Badge>
                      {profile?.is_paid && (
                        <Badge className="gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 shadow-md">
                          <IconStar className="h-4 w-4" />
                          Premium Member
                        </Badge>
                      )}
                      {userDetails?.is_active && (
                        <Badge variant="outline" className="gap-2 px-4 py-2 border-2 border-green-500 text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                          Active
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Quick Contact Info */}
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400 justify-center md:justify-start">
                    <div className="flex items-center gap-2 bg-white dark:bg-gray-800 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                      <IconMail className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      <span className="font-medium">{userDetails?.email}</span>
                    </div>
                    {profile?.phone_number && (
                      <div className="flex items-center gap-2 bg-white dark:bg-gray-800 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                        <IconPhone className="h-4 w-4 text-green-600 dark:text-green-400" />
                        <span className="font-medium">{profile.phone_number}</span>
                      </div>
                    )}
                    {profile?.address && (
                      <div className="flex items-center gap-2 bg-white dark:bg-gray-800 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                        <IconMapPin className="h-4 w-4 text-red-600 dark:text-red-400" />
                        <span className="font-medium">{profile.address}</span>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-3 justify-center md:justify-start pt-2">
                    {!isEditing ? (
                      <Button onClick={() => setIsEditing(true)} size="lg" className="h-12 px-8 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 gap-2">
                        <IconEdit className="h-5 w-5" />
                        Edit Profile
                      </Button>
                    ) : (
                      <>
                        <Button
                          onClick={handleCancel}
                          variant="outline"
                          size="lg"
                          className="h-12 px-6 rounded-xl font-semibold gap-2 border-2"
                          disabled={saving}
                        >
                          <IconX className="h-5 w-5" />
                          Cancel
                        </Button>
                        <Button
                          onClick={handleSave}
                          size="lg"
                          className="h-12 px-8 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 gap-2"
                          disabled={saving}
                        >
                          {saving ? (
                            <>
                              <IconLoader className="h-5 w-5 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <IconCheck className="h-5 w-5" />
                              Save Changes
                            </>
                          )}
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Member Since */}
            {userDetails?.created_at && (
              <div className="mt-8 text-center md:text-left">
                <div className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <IconCalendarEvent className="h-4 w-4" />
                  <span>
                    Member since {new Date(userDetails.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 space-y-8 -mt-8 relative z-10">

        {/* Premium Statistics Cards - Only for Students */}
        {userData?.role === 'student' && (
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

            {/* Completed Card */}
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
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Completed</p>
                  <p className="text-4xl font-black text-gray-900 dark:text-white">{stats.completedCourses}</p>
                  <p className="text-xs text-muted-foreground">Courses finished</p>
                </div>
              </CardContent>
            </Card>

            {/* Active Courses Card */}
            <Card className="group relative bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 hover:border-orange-300 dark:hover:border-orange-600 hover:shadow-xl transition-all duration-300 overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-500/10 to-red-600/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
              <CardContent className="p-6 relative">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-orange-50 dark:bg-orange-900/30 rounded-xl group-hover:scale-110 transition-transform duration-300">
                    <IconFlame className="h-6 w-6 text-orange-600 dark:text-orange-400 animate-pulse" />
                  </div>
                  <Badge variant="secondary" className="text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400">Live</Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active</p>
                  <p className="text-4xl font-black text-gray-900 dark:text-white">{stats.activeCourses}</p>
                  <p className="text-xs text-muted-foreground">In progress</p>
                </div>
              </CardContent>
            </Card>

            {/* Certificates Card */}
            <Card className="group relative bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600 hover:shadow-xl transition-all duration-300 overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/10 to-pink-600/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
              <CardContent className="p-6 relative">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-purple-50 dark:bg-purple-900/30 rounded-xl group-hover:scale-110 transition-transform duration-300">
                    <IconAward className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <Badge variant="secondary" className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400">Achievements</Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Certificates</p>
                  <p className="text-4xl font-black text-gray-900 dark:text-white">{stats.totalCertificates}</p>
                  <p className="text-xs text-muted-foreground">Earned achievements</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Premium Tabs Section */}
        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-2 lg:w-[500px] h-14 p-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-md">
            <TabsTrigger value="details" className="gap-2 rounded-xl font-semibold text-sm data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all">
              <IconInfoCircle className="h-5 w-5" />
              Profile Details
            </TabsTrigger>
            <TabsTrigger id="preferences-tab" value="settings" className="gap-2 rounded-xl font-semibold text-sm data-[state=active]:bg-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all">
              <IconSettings className="h-5 w-5" />
              Preferences
            </TabsTrigger>
          </TabsList>

          {/* Details Tab */}
          <TabsContent value="details" className="space-y-6 mt-8">
            <Card className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm rounded-2xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-900 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-600 dark:bg-blue-500 rounded-xl">
                    <IconUser className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold">Personal Information</CardTitle>
                    <CardDescription className="text-sm">
                      {isEditing ? 'Update your personal information' : 'Your personal information'}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Full Name - Read only */}
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Full Name</Label>
                    <Input
                      id="full_name"
                      value={userDetails?.full_name || ''}
                      disabled
                      className="bg-muted"
                    />
                  </div>

                  {/* Email - Read only */}
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      value={userDetails?.email || ''}
                      disabled
                      className="bg-muted"
                    />
                  </div>

                  {/* Phone Number */}
                  <div className="space-y-2">
                    <Label htmlFor="phone_number">Phone Number</Label>
                    <Input
                      id="phone_number"
                      value={formData.phone_number || ''}
                      onChange={(e) => handleInputChange('phone_number', e.target.value)}
                      disabled={!isEditing}
                      placeholder="+1234567890"
                    />
                  </div>

                  {/* Date of Birth */}
                  <div className="space-y-2">
                    <Label htmlFor="date_of_birth">Date of Birth</Label>
                    <Input
                      id="date_of_birth"
                      type="date"
                      value={formData.date_of_birth || ''}
                      onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                      disabled={!isEditing}
                    />
                  </div>

                  {/* Gender */}
                  <div className="space-y-2">
                    <Label htmlFor="gender">Gender</Label>
                    <Select
                      value={formData.gender || ''}
                      onValueChange={(value) => handleInputChange('gender', value)}
                      disabled={!isEditing}
                    >
                      <SelectTrigger id="gender">
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Address */}
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="address">Address</Label>
                    <Textarea
                      id="address"
                      value={formData.address || ''}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      disabled={!isEditing}
                      placeholder="Enter your address"
                      rows={3}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Role-Specific Information */}
            {userData?.role === 'teacher' && (
              <Card className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm rounded-2xl overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-gray-900 dark:to-gray-900 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-600 dark:bg-purple-500 rounded-xl">
                      <IconBriefcase className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-bold">Professional Information</CardTitle>
                      <CardDescription className="text-sm">
                        {isEditing ? 'Update your professional details' : 'Your professional details'}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-8 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="department">Department</Label>
                      <Input
                        id="department"
                        value={formData.department || ''}
                        onChange={(e) => handleInputChange('department', e.target.value)}
                        disabled={!isEditing}
                        placeholder="e.g., Computer Science"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="specialization">Specialization</Label>
                      <Input
                        id="specialization"
                        value={formData.specialization || ''}
                        onChange={(e) => handleInputChange('specialization', e.target.value)}
                        disabled={!isEditing}
                        placeholder="e.g., Machine Learning"
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="qualification">Qualification</Label>
                      <Input
                        id="qualification"
                        value={formData.qualification || ''}
                        onChange={(e) => handleInputChange('qualification', e.target.value)}
                        disabled={!isEditing}
                        placeholder="e.g., Ph.D. in Computer Science"
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="bio">Bio</Label>
                      <Textarea
                        id="bio"
                        value={formData.bio || ''}
                        onChange={(e) => handleInputChange('bio', e.target.value)}
                        disabled={!isEditing}
                        placeholder="Tell us about yourself..."
                        rows={4}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {userData?.role === 'staff' && (
              <Card className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm rounded-2xl overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-gray-900 dark:to-gray-900 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-600 dark:bg-green-500 rounded-xl">
                      <IconUsers className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-bold">Staff Information</CardTitle>
                      <CardDescription className="text-sm">
                        {isEditing ? 'Update your staff details' : 'Your staff details'}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-8 space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="position">Position</Label>
                    <Input
                      id="position"
                      value={formData.position || ''}
                      onChange={(e) => handleInputChange('position', e.target.value)}
                      disabled={!isEditing}
                      placeholder="e.g., Administrative Officer"
                    />
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Preferences Tab */}
          <TabsContent value="settings" className="space-y-6 mt-8">
            <Card className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm rounded-2xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-gray-900 dark:to-gray-900 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-600 dark:bg-purple-500 rounded-xl">
                    <IconSettings className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold">Preferences</CardTitle>
                    <CardDescription className="text-sm">
                      {isEditing ? 'Customize your preferences' : 'Your preferences'}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="preferred_language">Preferred Language</Label>
                    <Select
                      value={formData.preferred_language || 'en'}
                      onValueChange={(value) => handleInputChange('preferred_language', value)}
                      disabled={!isEditing}
                    >
                      <SelectTrigger id="preferred_language">
                        <SelectValue placeholder="Select language" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="ar">Arabic</SelectItem>
                        <SelectItem value="fr">French</SelectItem>
                        <SelectItem value="es">Spanish</SelectItem>
                        <SelectItem value="de">German</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="preferred_timezone">Preferred Timezone</Label>
                    <Select
                      value={formData.preferred_timezone || 'UTC'}
                      onValueChange={(value) => handleInputChange('preferred_timezone', value)}
                      disabled={!isEditing}
                    >
                      <SelectTrigger id="preferred_timezone">
                        <SelectValue placeholder="Select timezone" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="UTC">UTC</SelectItem>
                        <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                        <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                        <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                        <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                        <SelectItem value="Europe/London">London (GMT)</SelectItem>
                        <SelectItem value="Europe/Paris">Paris (CET)</SelectItem>
                        <SelectItem value="Asia/Dubai">Dubai (GST)</SelectItem>
                        <SelectItem value="Asia/Kolkata">India (IST)</SelectItem>
                        <SelectItem value="Asia/Tokyo">Tokyo (JST)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm rounded-2xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-gray-900 dark:to-gray-900 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-600 dark:bg-blue-500 rounded-xl">
                    <IconShieldCheck className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold">Account Information</CardTitle>
                    <CardDescription className="text-sm">View your account details</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-8 space-y-4">
                <div className="flex items-center justify-between py-2">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Account Status</p>
                    <p className="text-sm text-muted-foreground">
                      {userDetails?.is_active ? 'Active' : 'Inactive'}
                    </p>
                  </div>
                  <Badge variant={userDetails?.is_active ? 'default' : 'secondary'}>
                    {userDetails?.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <Separator />
                <div className="flex items-center justify-between py-2">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Member Since</p>
                    <p className="text-sm text-muted-foreground">
                      {userDetails?.created_at
                        ? new Date(userDetails.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })
                        : 'N/A'}
                    </p>
                  </div>
                  <IconCalendar className="h-5 w-5 text-muted-foreground" />
                </div>
                <Separator />
                <div className="flex items-center justify-between py-2">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">User ID</p>
                    <p className="text-sm text-muted-foreground font-mono">#{userData?.id}</p>
                  </div>
                  <IconInfoCircle className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}


