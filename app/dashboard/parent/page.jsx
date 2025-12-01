'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import { dashboardAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  BookOpen, 
  Award, 
  Calendar, 
  TrendingUp, 
  AlertCircle,
  ArrowRight,
  User
} from 'lucide-react';
import { toast } from 'sonner';
import { getMediaUrl } from '@/lib/config';

export default function ParentDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await dashboardAPI.getParentDashboard();
      setDashboardData(response.data);
    } catch (error) {
      if (error.response?.status === 403) {
        toast.error('Access denied. You must be a parent to view this dashboard.');
        router.push('/dashboard');
      } else {
        toast.error('Failed to load dashboard data');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="container mx-auto p-4 md:p-6 lg:p-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!dashboardData) {
    return (
      <ProtectedRoute>
        <div className="container mx-auto p-4 md:p-6 lg:p-8">
          <Card>
            <CardContent className="p-6 text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Data Available</h3>
              <p className="text-muted-foreground">Unable to load dashboard data. Please try again later.</p>
            </CardContent>
          </Card>
        </div>
      </ProtectedRoute>
    );
  }

  const {
    children = [],
    total_children = 0,
    total_enrollments = 0,
    total_certificates = 0,
    average_attendance_rate = 0,
    upcoming_sessions_count = 0,
    children_summaries = [],
  } = dashboardData;

  return (
    <ProtectedRoute>
      <div className="container mx-auto p-4 md:p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Parent Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Monitor your children's academic progress
            </p>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Children</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{total_children}</div>
              <p className="text-xs text-muted-foreground">Enrolled students</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Enrollments</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{total_enrollments}</div>
              <p className="text-xs text-muted-foreground">Active courses</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Attendance</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{average_attendance_rate.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">Across all children</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Upcoming Sessions</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{upcoming_sessions_count}</div>
              <p className="text-xs text-muted-foreground">Scheduled classes</p>
            </CardContent>
          </Card>
        </div>

        {/* Children List */}
        {total_children > 0 ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Your Children</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {children_summaries.map((summary, index) => {
                const child = summary.child;
                const profileImage = child.profile_image 
                  ? (child.profile_image.startsWith('http') ? child.profile_image : getMediaUrl(child.profile_image))
                  : null;
                
                return (
                  <Card key={child.id || index} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start gap-4">
                        <Avatar className="h-16 w-16">
                          <AvatarImage src={profileImage} alt={child.full_name} />
                          <AvatarFallback>
                            {child.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <CardTitle className="text-lg">{child.full_name}</CardTitle>
                          <CardDescription>{child.email}</CardDescription>
                          {summary.relationship && (
                            <Badge variant="outline" className="mt-2">
                              {summary.relationship}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Quick Stats */}
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Enrollments</p>
                          <p className="font-semibold">{summary.enrollments_count || 0}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Attendance</p>
                          <p className="font-semibold">
                            {summary.attendance_rate ? `${summary.attendance_rate.toFixed(1)}%` : 'N/A'}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Certificates</p>
                          <p className="font-semibold">{summary.certificates_count || 0}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Upcoming</p>
                          <p className="font-semibold">{summary.upcoming_sessions_count || 0}</p>
                        </div>
                      </div>

                      {/* View Details Button */}
                      <Link href={`/dashboard/parent/child/${child.id}`}>
                        <Button className="w-full" variant="outline">
                          View Details
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <User className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Children Linked</h3>
              <p className="text-muted-foreground mb-4">
                You don't have any children linked to your account yet.
              </p>
              <p className="text-sm text-muted-foreground">
                Please contact the administrator to link student accounts to your parent account.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Recent Activity Section */}
        {total_children > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Quick Overview</CardTitle>
              <CardDescription>
                Summary of your children's academic progress
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-muted rounded-lg">
                  <BookOpen className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <p className="text-2xl font-bold">{total_enrollments}</p>
                  <p className="text-sm text-muted-foreground">Total Enrollments</p>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <Award className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <p className="text-2xl font-bold">{total_certificates}</p>
                  <p className="text-sm text-muted-foreground">Certificates Earned</p>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <Calendar className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <p className="text-2xl font-bold">{upcoming_sessions_count}</p>
                  <p className="text-sm text-muted-foreground">Upcoming Sessions</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </ProtectedRoute>
  );
}
