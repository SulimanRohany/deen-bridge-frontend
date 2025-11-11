

'use client'

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { 
  IconUsers, 
  IconSchool, 
  IconBook, 
  IconCurrencyDollar,
  IconCalendarEvent,
  IconListDetails,
  IconChartBar,
  IconRefresh,
  IconArrowUpRight,
  IconArrowDownRight,
  IconVideo
} from "@tabler/icons-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";




export default function SuperAdminDashboard() {
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get auth token from localStorage
      const authTokens = localStorage.getItem('authTokens');
      if (!authTokens) {
        throw new Error('Authentication required');
      }
      
      const parsedTokens = JSON.parse(authTokens);
      const token = parsedTokens.access;
      
      const response = await axios.get('http://127.0.0.1:8000/api/dashboard/report/', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      setDashboardData(response.data);
      // toast.success('Dashboard data loaded successfully');
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err.response?.data?.error || err.message || 'Failed to load dashboard data');
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-BD', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Format time
  const formatTime = (timeString) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-BD', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  // Quick actions
  const quickActions = [
    { id: 1, title: "Manage Courses", icon: IconBook, action: () => router.push('/dashboard/super-admin/courses') },
    { id: 2, title: "Manage Teachers", icon: IconSchool, action: () => router.push('/dashboard/super-admin/users') },
    { id: 3, title: "View Reports", icon: IconChartBar, action: () => router.push('/dashboard/super-admin/reports') },
    { id: 4, title: "Schedule Class", icon: IconCalendarEvent, action: () => router.push('/dashboard/super-admin/timetable') },
    { id: 5, title: "Contact Messages", icon: IconListDetails, action: () => router.push('/dashboard/super-admin/contact-messages') },
  ];

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <div className="p-4 md:p-6 flex flex-col items-center justify-center h-96">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-2">Error Loading Dashboard</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={fetchDashboardData} className="bg-primary hover:bg-primary/90">
            <IconRefresh className="mr-2 h-4 w-4" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="p-4 md:p-6 flex flex-col items-center justify-center h-96">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-muted-foreground mb-2">No Data Available</h2>
          <p className="text-muted-foreground mb-4">There's no data to display on the dashboard</p>
          <Button onClick={fetchDashboardData} className="bg-primary hover:bg-primary/90">
            <IconRefresh className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-slate-950 dark:to-blue-950/30 min-h-screen">
      {/* Professional Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-1 tracking-tight">
              Assalamu Alaikum, Administrator
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-sm flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                month: 'long', 
                day: 'numeric',
                year: 'numeric',
                timeZone: 'Asia/Dhaka'
              })}
            </p>
          </div>
          <Button 
            onClick={fetchDashboardData} 
            variant="outline"
            className="border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800"
          >
            <IconRefresh className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard
          title="Total Students"
          value={dashboardData.students.total}
          change={dashboardData.students.growth}
          subtitle={`${dashboardData.students.new} new this period`}
          icon={IconUsers}
          iconColor="text-primary"
        />
        <MetricCard
          title="Active Teachers"
          value={dashboardData.teachers.total_active}
          change={dashboardData.teachers.growth}
          subtitle={`${dashboardData.teachers.new} new this period`}
          icon={IconSchool}
          iconColor="text-secondary"
        />
        <MetricCard
          title="Classes Offered"
          value={dashboardData.classes.total_offered}
          change={dashboardData.classes.growth}
          subtitle={`${dashboardData.classes.new} new this period`}
          icon={IconBook}
          iconColor="text-accent"
        />
        <MetricCard
          title="Total Revenue"
          value={formatCurrency(dashboardData.revenue.total)}
          change={dashboardData.revenue.growth}
          subtitle={formatCurrency(dashboardData.revenue.new) + ' this period'}
          icon={IconCurrencyDollar}
          iconColor="text-secondary"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Enrollments */}
        <div className="lg:col-span-2">
          <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <CardHeader className="border-b border-slate-100 dark:border-slate-800 px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">Recent Enrollments</CardTitle>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Latest student course registrations</p>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950"
                  onClick={() => router.push('/dashboard/super-admin/enrollments')}
                >
                  View All
                  <IconArrowUpRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-50 dark:hover:bg-slate-900/50">
                      <TableHead className="font-semibold text-slate-700 dark:text-slate-300 py-3 px-6">Student</TableHead>
                      <TableHead className="font-semibold text-slate-700 dark:text-slate-300 py-3">Course</TableHead>
                      <TableHead className="font-semibold text-slate-700 dark:text-slate-300 py-3">Date</TableHead>
                      <TableHead className="font-semibold text-slate-700 dark:text-slate-300 py-3">Amount</TableHead>
                      <TableHead className="text-right font-semibold text-slate-700 dark:text-slate-300 py-3 px-6">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dashboardData.recent_enrollments.map((enrollment, index) => (
                      <TableRow key={enrollment?.id} className="border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <TableCell className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold text-sm shadow-sm">
                              {enrollment?.student_email?.[0]?.toUpperCase()}
                            </div>
                            <span className="text-sm font-medium text-slate-900 dark:text-white">{enrollment?.student_email}</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <span className="text-sm text-slate-700 dark:text-slate-300">{enrollment?.class_title}</span>
                        </TableCell>
                        <TableCell className="py-4">
                          <span className="text-sm text-slate-600 dark:text-slate-400">{formatDate(enrollment?.enrolled_at)}</span>
                        </TableCell>
                        <TableCell className="py-4">
                          <span className="text-sm font-semibold text-slate-900 dark:text-white">{formatCurrency(enrollment?.price)}</span>
                        </TableCell>
                        <TableCell className="text-right py-4 px-6">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${enrollment?.status === 'completed' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' : ''} ${enrollment?.status === 'active' ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300' : ''} ${enrollment?.status === 'pending' ? 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300' : ''}`}>
                            {enrollment?.status}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions & Stats */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <CardHeader className="border-b border-slate-100 dark:border-slate-800 px-6 py-4">
              <div>
                <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">Quick Actions</CardTitle>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Common administrative tasks</p>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 gap-3">
                {quickActions.map((action, index) => {
                  const colorSchemes = [
                    { bg: 'bg-blue-50 dark:bg-blue-950', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-100 dark:border-blue-900', hover: 'hover:bg-blue-100 dark:hover:bg-blue-900' },
                    { bg: 'bg-purple-50 dark:bg-purple-950', text: 'text-purple-600 dark:text-purple-400', border: 'border-purple-100 dark:border-purple-900', hover: 'hover:bg-purple-100 dark:hover:bg-purple-900' },
                    { bg: 'bg-emerald-50 dark:bg-emerald-950', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-100 dark:border-emerald-900', hover: 'hover:bg-emerald-100 dark:hover:bg-emerald-900' },
                    { bg: 'bg-amber-50 dark:bg-amber-950', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-100 dark:border-amber-900', hover: 'hover:bg-amber-100 dark:hover:bg-amber-900' },
                    { bg: 'bg-rose-50 dark:bg-rose-950', text: 'text-rose-600 dark:text-rose-400', border: 'border-rose-100 dark:border-rose-900', hover: 'hover:bg-rose-100 dark:hover:bg-rose-900' }
                  ];
                  const scheme = colorSchemes[index % colorSchemes.length];
                  
                  return (
                    <button
                      key={action?.id}
                      onClick={action?.action}
                      className={`group relative overflow-hidden rounded-lg border ${scheme.border} ${scheme.bg} ${scheme.hover} p-4 transition-all duration-200 hover:shadow-sm`}
                    >
                      <div className="flex flex-col items-center gap-2.5">
                        <action.icon className={`h-6 w-6 ${scheme.text}`} />
                        <span className={`text-xs font-medium text-center ${scheme.text}`}>
                          {action?.title}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Popular Classes */}
          <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <CardHeader className="border-b border-slate-100 dark:border-slate-800 px-6 py-4">
              <div>
                <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">Popular Classes</CardTitle>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Top performing classes by enrollment</p>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-5">
                {dashboardData.popular_classes.map((course, index) => {
                  const maxEnrolled = Math.max(...dashboardData.popular_classes.map(c => c.enrolled));
                  const barWidth = maxEnrolled > 0 ? (course.enrolled / maxEnrolled) * 100 : 0;
                  
                  const colorSchemes = [
                    { bar: 'bg-blue-500 dark:bg-blue-600', bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-blue-600 dark:text-blue-400' },
                    { bar: 'bg-purple-500 dark:bg-purple-600', bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-purple-600 dark:text-purple-400' },
                    { bar: 'bg-emerald-500 dark:bg-emerald-600', bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-emerald-600 dark:text-emerald-400' },
                    { bar: 'bg-amber-500 dark:bg-amber-600', bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-amber-600 dark:text-amber-400' },
                    { bar: 'bg-rose-500 dark:bg-rose-600', bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-rose-600 dark:text-rose-400' }
                  ];
                  const scheme = colorSchemes[index % colorSchemes.length];
                  
                  return (
                    <div key={index}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-slate-900 dark:text-white truncate flex-1">{course.title}</span>
                        <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                            {course.enrolled} enrolled
                          </span>
                          <span className={`text-sm font-bold ${scheme.text} min-w-[50px] text-right`}>
                            {course.percentage}%
                          </span>
                        </div>
                      </div>
                      
                      <div className="relative">
                        <div className={`h-2.5 ${scheme.bg} rounded-full overflow-hidden`}>
                          <div 
                            className={`h-full ${scheme.bar} rounded-full transition-all duration-700 ease-out`}
                            style={{ width: `${barWidth}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Enrollments</span>
                  <span className="text-lg font-bold text-slate-900 dark:text-white">
                    {dashboardData.popular_classes.reduce((sum, course) => sum + course.enrolled, 0)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Live Sessions Section */}
      <div className="mt-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Session Management</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Monitor and manage live teaching sessions</p>
        </div>
        
        <div className="grid grid-cols-1 gap-6">
          {/* Ongoing Live Sessions */}
          {dashboardData.ongoing_live_sessions && dashboardData.ongoing_live_sessions.length > 0 && (
            <Card className="bg-white dark:bg-slate-900 border-2 border-emerald-200 dark:border-emerald-900 overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-950 dark:to-green-950 border-b border-emerald-100 dark:border-emerald-900 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 rounded-lg bg-emerald-500 flex items-center justify-center shadow-sm">
                      <IconVideo className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        Sessions in Progress
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400">{dashboardData.ongoing_live_sessions.length} active session{dashboardData.ongoing_live_sessions.length > 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900"
                    onClick={() => router.push('/dashboard/super-admin/sessions')}
                  >
                    View All
                    <IconArrowUpRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {dashboardData.ongoing_live_sessions.map((session) => (
                    <div key={session?.id} className="p-4 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-3">
                            <h4 className="font-semibold text-slate-900 dark:text-white truncate">{session?.title}</h4>
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-xs font-medium">
                              <span className="relative flex h-1.5 w-1.5 mr-1.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                              </span>
                              Live
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-4 text-sm text-slate-600 dark:text-slate-400">
                            <div className="flex items-center gap-1.5">
                              <IconBook className="h-4 w-4" />
                              <span>{session?.class_title}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <IconCalendarEvent className="h-4 w-4" />
                              <span>{session?.days_of_week}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <IconSchool className="h-4 w-4" />
                              <span>{formatTime(session?.start_time)} - {formatTime(session?.end_time)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Upcoming Live Sessions */}
          <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden">
            <CardHeader className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-lg bg-blue-500 flex items-center justify-center shadow-sm">
                    <IconCalendarEvent className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Upcoming Sessions</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {dashboardData.upcoming_live_sessions && dashboardData.upcoming_live_sessions.length > 0 
                        ? `${dashboardData.upcoming_live_sessions.length} scheduled session${dashboardData.upcoming_live_sessions.length > 1 ? 's' : ''}`
                        : 'No sessions scheduled'}
                    </p>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950"
                  onClick={() => router.push('/dashboard/super-admin/sessions')}
                >
                  View All
                  <IconArrowUpRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {dashboardData.upcoming_live_sessions && dashboardData.upcoming_live_sessions.length > 0 ? (
                <div className="space-y-4">
                  {dashboardData.upcoming_live_sessions.map((session) => (
                    <div key={session?.id} className="p-4 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-slate-900 dark:text-white mb-3 truncate">{session?.title}</h4>
                          <div className="flex flex-wrap gap-4 text-sm text-slate-600 dark:text-slate-400 mb-3">
                            <div className="flex items-center gap-1.5">
                              <IconBook className="h-4 w-4" />
                              <span>{session?.class_title}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <IconCalendarEvent className="h-4 w-4" />
                              <span>{session?.days_of_week}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <IconSchool className="h-4 w-4" />
                              <span>{formatTime(session?.start_time)} - {formatTime(session?.end_time)}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex-shrink-0">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-xs font-medium capitalize">
                            {session.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 mb-3">
                    <IconCalendarEvent className="h-7 w-7 text-slate-400 dark:text-slate-500" />
                  </div>
                  <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-1">No Sessions Scheduled</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Schedule sessions to see them here.</p>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => router.push('/dashboard/super-admin/sessions')}
                    className="border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    Manage Sessions
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Professional Metric Card Component
function MetricCard({ title, value, change, subtitle, icon: Icon, iconColor }) {
  const isPositive = change >= 0;
  
  return (
    <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-800 transition-all duration-200 group">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className={`w-12 h-12 rounded-lg ${iconColor.includes('primary') ? 'bg-blue-50 dark:bg-blue-950' : iconColor.includes('secondary') ? 'bg-purple-50 dark:bg-purple-950' : iconColor.includes('accent') ? 'bg-emerald-50 dark:bg-emerald-950' : 'bg-amber-50 dark:bg-amber-950'} flex items-center justify-center`}>
            <Icon className={`h-6 w-6 ${iconColor.includes('primary') ? 'text-blue-600 dark:text-blue-400' : iconColor.includes('secondary') ? 'text-purple-600 dark:text-purple-400' : iconColor.includes('accent') ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`} />
          </div>
          <div className={`flex items-center gap-1 px-2.5 py-1 rounded-md ${isPositive ? 'bg-emerald-50 dark:bg-emerald-950' : 'bg-red-50 dark:bg-red-950'}`}>
            {isPositive ? (
              <IconArrowUpRight className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <IconArrowDownRight className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
            )}
            <span className={`text-xs font-semibold ${isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
              {Math.abs(change)}%
            </span>
          </div>
        </div>
        <div>
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">{title}</p>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">{value}</h3>
          <p className="text-xs text-slate-500 dark:text-slate-500">{subtitle}</p>
        </div>
      </CardContent>
    </Card>
  );
}

// Skeleton loader for dashboard
function DashboardSkeleton() {
  return (
    <div className="p-4 md:p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-80" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Metrics Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-5 w-5 rounded-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-7 w-20 mb-2" />
              <Skeleton className="h-3 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <Skeleton className="h-6 w-40" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex justify-between items-center">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-6 w-16" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-24 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <Skeleton className="h-6 w-40" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i}>
                    <div className="flex justify-between mb-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-8" />
                    </div>
                    <Skeleton className="h-2 w-full" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Upcoming Sessions Skeleton */}
      <Card className="mt-6 border-0 shadow-lg">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex justify-between items-center">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-6 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}