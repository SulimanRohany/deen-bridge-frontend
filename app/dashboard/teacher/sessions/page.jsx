'use client'

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { useDebounce } from '@/hooks/use-debounce';
import { config } from '@/lib/config';
import { 
  IconCalendarEvent,
  IconClock,
  IconUsers,
  IconSearch,
  IconCheck,
  IconClipboardCheck,
  IconAlertCircle
} from "@tabler/icons-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Pagination from '@/components/Pagination';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Filter, X, Eye, ClipboardCheck, CheckCircle2, XCircle, AlertCircle, MoreVertical, Edit, Trash2, Video } from 'lucide-react';
import ResourceList from '@/components/live-session/resource-list';
import { cn } from "@/lib/utils";




export default function TeacherSessionsPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  
  // Session management dialog state
  const [openDialog, setOpenDialog] = useState(false);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [currentSession, setCurrentSession] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    class_session: '',
    scheduled_date: '',
    auto_record: false,
    recording_url: '',
    recording_available: true,
    status: 'scheduled'
  });
  const [errors, setErrors] = useState({});
  const [deleting, setDeleting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Attendance dialog state
  const [attendanceDialogOpen, setAttendanceDialogOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [savingAttendance, setSavingAttendance] = useState(false);
  const [attendanceData, setAttendanceData] = useState({});
  
  // Debounce search query
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  
  // Upload resources dialog state
  const [uploadResourcesDialogOpen, setUploadResourcesDialogOpen] = useState(false);
  const [selectedSessionForUpload, setSelectedSessionForUpload] = useState(null);
  const [filesToUpload, setFilesToUpload] = useState([]);
  const [uploadingResources, setUploadingResources] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});

  useEffect(() => {
    fetchSessions();
  }, [statusFilter, debouncedSearchQuery, currentPage, pageSize]);

  // Get access token
  const getAccessToken = () => {
    if (typeof window === 'undefined') return null;
    const authTokens = localStorage.getItem('authTokens');
    if (!authTokens) {
      toast.error('Authentication required. Please login again.');
      router.push('/login');
      return null;
    }
    try {
      const parsedTokens = JSON.parse(authTokens);
      return parsedTokens.access;
    } catch (error) {
      console.error('Error parsing authTokens:', error);
      toast.error('Invalid authentication data. Please login again.');
      router.push('/login');
      return null;
    }
  };

  // Create Axios instance
  const getApiInstance = () => {
    const token = getAccessToken();
    return axios.create({
      baseURL: config.API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
        Authorization: token ? `Bearer ${token}` : '',
      },
    });
  };

  const fetchSessions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const api = getApiInstance();
      
      // Build query params
      const sessionParams = {
        page: currentPage,
        page_size: pageSize,
      };
      
      if (debouncedSearchQuery) {
        sessionParams.title = debouncedSearchQuery;
      }
      
      if (statusFilter !== 'all') {
        sessionParams.status = statusFilter;
      }
      
      const [sessionsRes, coursesRes] = await Promise.all([
        api.get('course/live_session/', { params: sessionParams }),
        api.get('course/')
      ]);
      
      // Handle paginated response
      if (sessionsRes.data.results) {
        setSessions(sessionsRes.data.results);
        setTotalCount(sessionsRes.data.count);
        setTotalPages(sessionsRes.data.total_pages);
      } else {
        setSessions(sessionsRes.data);
        setTotalCount(sessionsRes.data.length);
        setTotalPages(1);
      }
      
      // Handle courses data
      if (coursesRes.data.results) {
        setCourses(coursesRes.data.results);
      } else {
        setCourses(coursesRes.data);
      }
    } catch (err) {
      console.error('Error fetching sessions:', err);
      setError(err.response?.data?.error || err.message || 'Failed to load sessions');
      toast.error('Failed to load sessions');
    } finally {
      setLoading(false);
    }
  };

  // Handle API errors
  const handleApiError = (error, defaultMessage) => {
    console.error('API Error:', error);
    if (error.response) {
      if (error.response.status === 401) {
        toast.error('Session expired. Please login again.');
        router.push('/login');
        return;
      }
      
      if (error.response.status === 400) {
        const backendErrors = error.response.data;
        const formErrors = {};
        
        Object.keys(backendErrors).forEach(key => {
          formErrors[key] = Array.isArray(backendErrors[key]) 
            ? backendErrors[key].join(' ') 
            : backendErrors[key];
        });
        
        if (Object.keys(formErrors).length > 0) {
          setErrors(formErrors);
          toast.error('Please fix the form errors');
          return;
        }
        
        toast.error(backendErrors.detail || backendErrors.error || defaultMessage);
        return;
      }
      
      toast.error(error.response.data?.detail || error.response.data?.error || defaultMessage);
    } else {
      toast.error(defaultMessage || 'Network error. Please try again later.');
    }
  };

  // Handle form changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
    if (errors[name]) setErrors({ ...errors, [name]: '' });
  };

  // Handle select changes
  const handleSelectChange = (name, value) => {
    const updates = { [name]: value };
    
    // Auto-generate title when class is selected (only if creating new session)
    if (name === 'class_session' && !currentSession) {
      const selectedClass = courses.find(c => c.id === value);
      if (selectedClass) {
        // Generate title with class name and current date
        const today = new Date();
        const dateStr = today.toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'short', 
          day: 'numeric' 
        });
        updates.title = `${selectedClass.title} - ${dateStr}`;
      }
    }
    
    setFormData({
      ...formData,
      ...updates
    });
    if (errors[name]) setErrors({ ...errors, [name]: '' });
  };

  // Open create dialog
  const openCreateDialog = () => {
    setCurrentSession(null);
    setFormData({
      title: '',
      class_session: '',
      scheduled_date: '',
      auto_record: false,
      recording_url: '',
      recording_available: true,
      status: 'scheduled'
    });
    setErrors({});
    setOpenDialog(true);
  };

  // Open edit dialog
  const openEditDialog = (session) => {
    setCurrentSession(session);
    setFormData({
      title: session.title,
      class_session: session.class_session,
      scheduled_date: session.scheduled_date || '',
      auto_record: session.auto_record,
      recording_url: session.recording_url || '',
      recording_available: session.recording_available,
      status: session.status
    });
    setErrors({});
    setOpenDialog(true);
  };

  // Open view dialog
  const openViewDialogFn = (session) => {
    setCurrentSession(session);
    setOpenViewDialog(true);
  };

  // Open delete confirmation
  const openDeleteConfirmation = (session) => {
    setCurrentSession(session);
    setOpenDeleteDialog(true);
  };

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    
    // Client-side validation
    const validationErrors = {};
    // Title is optional (auto-generated if left empty)
    if (!formData.class_session) validationErrors.class_session = 'Class is required';
    
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      toast.warning('Please fix the form errors');
      return;
    }

    setSubmitting(true);
    
    try {
      const api = getApiInstance();
      
      // Prepare data - convert empty scheduled_date to null for auto-calculation
      const submitData = {
        ...formData,
        scheduled_date: formData.scheduled_date?.trim() ? formData.scheduled_date : null
      };
      
      if (currentSession) {
        await api.put(`course/live_session/${currentSession.id}/`, submitData);
        toast.success('Session updated successfully');
      } else {
        await api.post('course/live_session/', submitData);
        toast.success('Session created successfully');
      }
      
      setOpenDialog(false);
      // Reset to first page after creating/updating
      setCurrentPage(1);
      fetchSessions();
    } catch (error) {
      handleApiError(error, currentSession ? 'Failed to update session' : 'Failed to create session');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete session
  const handleDelete = async () => {
    setDeleting(true);
    try {
      const api = getApiInstance();
      await api.delete(`course/live_session/${currentSession.id}/`);
      toast.success('Session deleted successfully');
      setOpenDeleteDialog(false);
      
      // Check if we need to go to previous page after deletion
      if (sessions.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
      
      fetchSessions();
    } catch (error) {
      handleApiError(error, 'Failed to delete session');
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-BD', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (timeString) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-BD', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  // Open attendance dialog
  const openAttendanceDialog = async (session) => {
    // Check if session is live or completed
    if (session.status !== 'completed' && session.status !== 'live') {
      toast.error('Attendance can only be taken for live or completed sessions', {
        description: 'Please wait until the session is live or completed.'
      });
      return;
    }

    setSelectedSession(session);
    setAttendanceDialogOpen(true);
    await fetchSessionAttendance(session.id);
  };

  // Fetch enrollments and existing attendance for a session
  const fetchSessionAttendance = async (sessionId) => {
    try {
      setLoadingAttendance(true);
      
      const authTokens = localStorage.getItem('authTokens');
      if (!authTokens) {
        throw new Error('Authentication required');
      }
      
      const parsedTokens = JSON.parse(authTokens);
      const token = parsedTokens.access;
      
      // Fetch enrollments for this session
      const enrollmentsResponse = await axios.get(
        config.API_BASE_URL + `course/session/${sessionId}/enrollments/`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );
      
      setEnrollments(enrollmentsResponse.data.enrollments || []);
      
      // Fetch existing attendance records for this session
      const attendanceResponse = await axios.get(
        config.API_BASE_URL + 'course/attendance/',
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          params: {
            session: sessionId,
            page_size: 1000, // Get all records
          }
        }
      );
      
      const records = attendanceResponse.data.results || [];
      setAttendanceRecords(records);
      
      // Build attendance data object
      const data = {};
      records.forEach(record => {
        data[record.class_enrollment] = {
          id: record.id,
          status: record.status,
          class_enrollment: record.class_enrollment,
        };
      });
      setAttendanceData(data);
      
    } catch (err) {
      console.error('Error fetching attendance:', err);
      toast.error('Failed to load attendance data');
    } finally {
      setLoadingAttendance(false);
    }
  };

  // Toggle attendance status
  const toggleAttendanceStatus = (enrollmentId, currentStatus) => {
    const newStatus = currentStatus === 'present' ? 'absent' : 'present';
    setAttendanceData(prev => ({
      ...prev,
      [enrollmentId]: {
        ...prev[enrollmentId],
        status: newStatus,
        class_enrollment: enrollmentId,
      }
    }));
  };

  // Save attendance
  const saveAttendance = async () => {
    try {
      setSavingAttendance(true);
      
      const authTokens = localStorage.getItem('authTokens');
      if (!authTokens) {
        throw new Error('Authentication required');
      }
      
      const parsedTokens = JSON.parse(authTokens);
      const token = parsedTokens.access;
      
      const api = axios.create({
        baseURL: config.API_BASE_URL + 'course/',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      // Prepare attendance records
      const promises = [];
      
      enrollments.forEach(enrollment => {
        const attendance = attendanceData[enrollment.id];
        const status = attendance?.status || 'absent';
        
        if (attendance?.id) {
          // Update existing attendance - include class_enrollment and session for validation
          promises.push(
            api.patch(`attendance/${attendance.id}/`, {
              class_enrollment: enrollment.id,
              session: selectedSession.id,
              status: status,
            })
          );
        } else {
          // Create new attendance
          promises.push(
            api.post('attendance/', {
              class_enrollment: enrollment.id,
              session: selectedSession.id,
              status: status,
            })
          );
        }
      });
      
      await Promise.all(promises);
      
      toast.success('Attendance saved successfully', {
        description: `Marked attendance for ${enrollments.length} students`
      });
      
      // Refresh attendance data
      await fetchSessionAttendance(selectedSession.id);
      
      // Close the dialog
      closeAttendanceDialog();
      
    } catch (err) {
      console.error('Error saving attendance:', err);
      toast.error('Failed to save attendance', {
        description: err.response?.data?.error || err.message || 'Please try again'
      });
    } finally {
      setSavingAttendance(false);
    }
  };

  // Close attendance dialog
  const closeAttendanceDialog = () => {
    setAttendanceDialogOpen(false);
    setSelectedSession(null);
    setEnrollments([]);
    setAttendanceRecords([]);
    setAttendanceData({});
  };

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'scheduled':
        return 'default';
      case 'live':
        return 'secondary';
      case 'completed':
        return 'outline';
      case 'cancelled':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300';
      case 'live':
        return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300';
      case 'completed':
        return 'bg-gray-50 text-gray-700 dark:bg-gray-950 dark:text-gray-300';
      case 'cancelled':
        return 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300';
      default:
        return 'bg-slate-50 text-slate-700 dark:bg-slate-950 dark:text-slate-300';
    }
  };
  
  // Handle page change
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Handle page size change
  const handlePageSizeChange = (size) => {
    setPageSize(size);
    setCurrentPage(1);
  };
  
  // Clear all filters
  const clearFilters = () => {
    setStatusFilter('all');
    setSearchQuery('');
    setCurrentPage(1);
  };

  // Check if any filter is active
  const hasActiveFilters = statusFilter !== 'all' || searchQuery !== '';

  // Get active filters for display
  const getActiveFilters = () => {
    const filters = [];
    if (statusFilter !== 'all') {
      filters.push({
        type: 'status',
        label: statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1),
        icon: IconCalendarEvent,
        remove: () => setStatusFilter('all')
      });
    }
    if (searchQuery) {
      filters.push({
        type: 'search',
        label: `Search: "${searchQuery}"`,
        icon: IconSearch,
        remove: () => setSearchQuery('')
      });
    }
    return filters;
  };

  const activeFilters = getActiveFilters();

  // Resource upload functions
  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files).map((file, index) => ({
      id: Date.now() + index,
      file,
      title: file.name.split('.').slice(0, -1).join('.'),
      description: '',
    }));
    setFilesToUpload([...filesToUpload, ...selectedFiles]);
  };

  const removeFileFromUpload = (id) => {
    setFilesToUpload(filesToUpload.filter(f => f.id !== id));
  };

  const updateFileInfo = (id, field, value) => {
    setFilesToUpload(filesToUpload.map(f => f.id === id ? { ...f, [field]: value } : f));
  };

  const uploadResources = async () => {
    if (!selectedSessionForUpload) {
      toast.error('Please select a session');
      return;
    }
    if (filesToUpload.length === 0) {
      toast.error('Please select at least one file');
      return;
    }

    setUploadingResources(true);
    let successCount = 0;
    let errorCount = 0;
    const api = getApiInstance();

    for (const fileData of filesToUpload) {
      try {
        const formData = new FormData();
        formData.append('session', selectedSessionForUpload);
        formData.append('title', fileData.title);
        formData.append('description', fileData.description);
        formData.append('file', fileData.file);

        await api.post('course/session/resources/', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setUploadProgress(prev => ({ ...prev, [fileData.id]: percentCompleted }));
          },
        });

        successCount++;
        setFilesToUpload(prevFiles => prevFiles.filter(f => f.id !== fileData.id));
      } catch (error) {
        errorCount++;
        console.error('Error uploading file:', error);
        toast.error(`Failed to upload ${fileData.title}`);
      }
    }

    setUploadingResources(false);
    setUploadProgress({});

    if (successCount > 0) {
      toast.success(`Successfully uploaded ${successCount} file(s)`);
      setUploadResourcesDialogOpen(false);
      setFilesToUpload([]);
      setSelectedSessionForUpload(null);
    }

    if (errorCount > 0) {
      toast.error(`Failed to upload ${errorCount} file(s)`);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  // Format days of week
  const formatDaysOfWeek = (days) => {
    const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    return days?.map(day => dayNames[day]).join(', ') || 'N/A';
  };

  if (loading) {
    return <SessionsSkeleton />;
  }

  if (error) {
    return (
      <div className="p-6 md:p-8 bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-slate-950 dark:to-blue-950/30 min-h-screen">
        <div className="flex flex-col items-center justify-center h-96">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-red-600 mb-2">Error Loading Sessions</h2>
            <p className="text-slate-600 dark:text-slate-400 mb-4">{error}</p>
            <Button onClick={fetchSessions} className="bg-primary hover:bg-primary/90">
              <IconRefresh className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
          <div>
          <h1 className="text-2xl font-bold text-foreground">My Live Sessions</h1>
          <p className="text-muted-foreground text-sm mt-1">
              Manage and view all your live sessions
            </p>
          </div>
        <Button onClick={openCreateDialog} className="bg-primary hover:bg-primary/90">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          New Session
          </Button>
        </div>

      {/* Search and Filter Section */}
      <div className="mb-6 flex flex-col lg:flex-row gap-3">
        {/* Search Bar */}
        <div className="relative flex-1">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <Input
            placeholder="Search sessions by title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-10"
          />
      </div>

        {/* Filters Container */}
        <div className="flex flex-wrap lg:flex-nowrap items-center gap-2">
          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={(value) => { setStatusFilter(value); setCurrentPage(1); }}>
            <SelectTrigger className={`w-full lg:w-[180px] !h-10 ${statusFilter !== 'all' ? 'border-primary bg-primary/5' : ''}`}>
              <div className="flex items-center gap-1.5">
                <IconCalendarEvent className="h-4 w-4 text-muted-foreground" />
                <SelectValue placeholder="Status" />
              </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="live">Live</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

      {/* Active Filters Display */}
      {activeFilters.length > 0 && (
        <div className="mb-4 flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
            <Filter className="h-4 w-4" />
            Active Filters:
          </span>
          {activeFilters.map((filter, index) => {
            const IconComponent = filter.icon;
            return (
              <div
                key={index}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium border border-primary/20 hover:bg-primary/15 transition-colors"
              >
                <IconComponent className="h-3.5 w-3.5" />
                <span>{filter.label}</span>
                <button
                  onClick={filter.remove}
                  className="ml-1 hover:bg-primary/30 rounded-full p-0.5 transition-colors"
                  aria-label={`Remove ${filter.label} filter`}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })}
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="h-7 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          >
            Clear All
          </Button>
            </div>
      )}

      {/* Sessions Table */}
      <div className="border border-border rounded-lg overflow-hidden shadow-sm bg-card">
              <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="w-[60px]">#</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Course</TableHead>
              <TableHead>Schedule</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
            {sessions.length > 0 ? (
              sessions.map((session, index) => (
                <TableRow key={session.id}>
                  <TableCell className="font-medium">{(currentPage - 1) * pageSize + index + 1}</TableCell>
                  <TableCell className="font-medium">{session.title}</TableCell>
                  <TableCell>
                    {session.class_title || session.class_info?.class_title || 'N/A'}
                      </TableCell>
                  <TableCell>
                    {session.scheduled_date ? (
                      <span className="text-sm font-medium">
                        {new Date(session.scheduled_date).toLocaleDateString('en-US', { 
                          weekday: 'short', 
                          month: 'short', 
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        {session.class_info?.days_display || 'N/A'}
                      </span>
                    )}
                      </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <IconClock className="h-3.5 w-3.5" />
                      <span>
                        {session.class_info?.start_time && session.class_info?.end_time
                          ? `${formatTime(session.class_info.start_time)} - ${formatTime(session.class_info.end_time)}`
                              : 'N/A'}
                          </span>
                        </div>
                      </TableCell>
                  <TableCell>
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${getStatusBadgeClass(session.status)}`}>
                          {session.status}
                        </span>
                      </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                          </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem 
                          onClick={() => openViewDialogFn(session)}
                          className="cursor-pointer flex items-center gap-2"
                        >
                          <Eye className="h-4 w-4 text-primary" />
                          <span>View Details</span>
                        </DropdownMenuItem>
                        {session.status === 'live' && (
                          <DropdownMenuItem 
                            onClick={() => router.push(`/courses/${session.class_id}/sessions/${session.id}/join`)}
                            className="cursor-pointer flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/30"
                          >
                            <Video className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                            <span className="font-medium text-emerald-600 dark:text-emerald-400">Join Session</span>
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem 
                          onClick={() => openEditDialog(session)}
                          className="cursor-pointer flex items-center gap-2"
                        >
                          <Edit className="h-4 w-4 text-yellow-500" />
                          <span>Edit</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => openAttendanceDialog(session)}
                          className={`cursor-pointer flex items-center gap-2 ${(session.status !== 'completed' && session.status !== 'live') ? 'opacity-50' : ''}`}
                          disabled={session.status !== 'completed' && session.status !== 'live'}
                        >
                          <ClipboardCheck className="h-4 w-4 text-emerald-600" />
                          <span>Take Attendance</span>
                          {(session.status !== 'completed' && session.status !== 'live') && (
                            <Badge variant="outline" className="ml-auto text-xs">Live/Completed</Badge>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => {
                            setSelectedSessionForUpload(session.id);
                            setUploadResourcesDialogOpen(true);
                          }}
                          className="cursor-pointer flex items-center gap-2"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                          </svg>
                          <span>Upload Resources</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => openDeleteConfirmation(session)}
                          className="cursor-pointer flex items-center gap-2 text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span>Delete</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12">
                  <div className="flex flex-col items-center">
                    <div className="bg-muted/50 p-4 rounded-full mb-4">
                      <IconCalendarEvent className="h-10 w-10 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium text-foreground mb-1">No sessions found</h3>
                    <p className="text-muted-foreground">
                      {hasActiveFilters 
                        ? 'Try adjusting your filters'
                        : 'You don\'t have any sessions scheduled yet'}
                    </p>
                        </div>
                      </TableCell>
                    </TableRow>
            )}
                </TableBody>
              </Table>
        
        {/* Pagination Component */}
        {totalCount > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalCount={totalCount}
            pageSize={pageSize}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            label="Sessions"
            pageSizeOptions={[5, 10, 20, 50]}
          />
        )}
            </div>

      {/* Create/Edit Session Dialog */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Video className="h-5 w-5 text-primary" />
              {currentSession ? 'Edit Live Session' : 'Create New Live Session'}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {currentSession
                ? 'Update the details of this live session'
                : 'Schedule a new live session for your class'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
            <ScrollArea className="flex-1 overflow-y-auto pr-4">
              <div className="space-y-4 py-2">
                {/* Title Field - Auto-filled but editable */}
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-sm font-semibold">
                    Session Title
                  </Label>
                  <Input
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="Auto-generated or enter custom title"
                    className={errors.title ? 'border-red-500' : ''}
                  />
                  <p className="text-xs text-muted-foreground">
                    Auto-filled when you select a class. You can edit it if needed.
                  </p>
                  {errors.title && (
                    <p className="text-sm text-red-500">{errors.title}</p>
                  )}
                </div>
                
                {/* Class Selection */}
                <div className="space-y-2">
                  <Label htmlFor="class_session" className="text-sm font-semibold">
                    Select Class*
                  </Label>
                  <Select 
                    value={formData.class_session?.toString() || ''} 
                    onValueChange={(value) => handleSelectChange('class_session', parseInt(value))}
                  >
                    <SelectTrigger className={errors.class_session ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Choose a class..." />
                    </SelectTrigger>
                    <SelectContent>
                      {courses.map((course) => (
                        <SelectItem key={course.id} value={course.id.toString()}>
                          <div className="flex flex-col">
                            <span className="font-medium">{course.title}</span>
                            {course.subjects && course.subjects.length > 0 && (
                              <span className="text-xs text-muted-foreground">
                                {course.subjects.map(s => s.name).join(', ')}
                              </span>
                            )}
                </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.class_session && (
                    <p className="text-sm text-red-500">{errors.class_session}</p>
                  )}
              </div>

                {/* Scheduled Date Field */}
                {formData.class_session && (
                  <div className="space-y-2">
                    <Label htmlFor="scheduled_date" className="text-sm font-semibold">
                      Scheduled Date
                    </Label>
                    <Input
                      id="scheduled_date"
                      name="scheduled_date"
                      type="date"
                      value={formData.scheduled_date}
                      onChange={handleChange}
                      className={cn('h-11', errors.scheduled_date ? 'border-red-500' : '')}
                    />
                    
                    {/* Suggested Dates Section */}
                    {(() => {
                      const classDetail = courses.find(c => c.id === parseInt(formData.class_session));
                      if (!classDetail || !classDetail.days_of_week || classDetail.days_of_week.length === 0) {
                        return (
                          <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 p-3 mt-2">
                            <div className="flex items-start gap-2">
                              <svg className="h-4 w-4 text-amber-600 dark:text-amber-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                              </svg>
                              <p className="text-xs text-amber-800 dark:text-amber-200">
                                Class has no scheduled days set. Please configure the class schedule first.
                              </p>
                            </div>
                          </div>
                        );
                      }
                      
                      // Get next 5 possible dates
                      const suggestions = [];
                      const startDate = formData.scheduled_date ? new Date(formData.scheduled_date) : new Date();
                      let checkDate = new Date(startDate);
                      
                      while (suggestions.length < 5) {
                        if (classDetail.days_of_week.includes(checkDate.getDay() === 0 ? 6 : checkDate.getDay() - 1)) {
                          suggestions.push(new Date(checkDate));
                        }
                        checkDate.setDate(checkDate.getDate() + 1);
                      }
                      
                      return (
                        <div className="rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800 p-4 mt-2">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="p-1 rounded-md bg-blue-100 dark:bg-blue-900/50">
                              <svg className="h-4 w-4 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                              </svg>
                            </div>
                            <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                              Quick Select Dates
                            </h4>
                          </div>
                          
                          <div className="grid grid-cols-1 gap-2">
                            {suggestions.map((date, idx) => {
                              const dateStr = date.toISOString().split('T')[0];
                              const isSelected = formData.scheduled_date === dateStr;
                              const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
                              const monthDay = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                              const isToday = date.toDateString() === new Date().toDateString();
                              const isTomorrow = date.toDateString() === new Date(Date.now() + 86400000).toDateString();
                              
                              return (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => setFormData({ ...formData, scheduled_date: dateStr })}
                                  className={cn(
                                    "w-full text-left px-3 py-2.5 rounded-md border transition-all duration-200",
                                    "hover:shadow-sm hover:scale-[1.02] active:scale-[0.98]",
                                    isSelected
                                      ? "bg-blue-600 border-blue-600 text-white shadow-md"
                                      : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30"
                                  )}
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                      <div className={cn(
                                        "flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold",
                                        isSelected 
                                          ? "bg-white/20 text-white" 
                                          : "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                                      )}>
                                        {idx + 1}
                                      </div>
                                      <div>
                                        <div className={cn(
                                          "text-sm font-semibold",
                                          isSelected ? "text-white" : "text-gray-900 dark:text-gray-100"
                                        )}>
                                          {dayName}
                                        </div>
                                        <div className={cn(
                                          "text-xs",
                                          isSelected ? "text-blue-100" : "text-gray-500 dark:text-gray-400"
                                        )}>
                                          {monthDay}
                                        </div>
                                      </div>
                                    </div>
                                    {(isToday || isTomorrow) && (
                                      <span className={cn(
                                        "px-2 py-1 rounded-full text-[10px] font-bold uppercase",
                                        isSelected
                                          ? "bg-white/20 text-white"
                                          : isToday 
                                            ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                                            : "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"
                                      )}>
                                        {isToday ? 'Today' : 'Tomorrow'}
                                      </span>
                                    )}
                                    {isSelected && (
                                      <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                      </svg>
                                    )}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                          
                          <div className="mt-3 flex items-start gap-2 p-2 rounded-md bg-white/50 dark:bg-gray-900/50">
                            <svg className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                            <p className="text-xs text-blue-800 dark:text-blue-200 leading-relaxed">
                              Leave the date field blank to automatically schedule the session on the next available class day.
                            </p>
                          </div>
                        </div>
                      );
                    })()}
                    
                    {errors.scheduled_date && (
                      <div className="flex items-center gap-2 text-red-600 dark:text-red-400 mt-2">
                        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        <p className="text-sm font-medium">{errors.scheduled_date}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Status */}
                <div className="space-y-2">
                  <Label htmlFor="status" className="text-sm font-semibold">
                    Status
                  </Label>
                  <Select 
                    value={formData.status} 
                    onValueChange={(value) => handleSelectChange('status', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                      <SelectItem value="live">Live</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
              </div>

                {/* Auto Record */}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="auto_record"
                    name="auto_record"
                    checked={formData.auto_record}
                    onCheckedChange={(checked) => 
                      setFormData({ ...formData, auto_record: checked })
                    }
                  />
                  <Label htmlFor="auto_record" className="text-sm font-medium cursor-pointer">
                    Auto-record this session
                  </Label>
                </div>

                {/* Recording URL */}
                <div className="space-y-2">
                  <Label htmlFor="recording_url" className="text-sm font-semibold">
                    Recording URL <span className="text-muted-foreground font-normal">(Optional)</span>
                  </Label>
                  <Input
                    id="recording_url"
                    name="recording_url"
                    value={formData.recording_url}
                    onChange={handleChange}
                    placeholder="https://example.com/recording.mp4"
                  />
              </div>

                {/* Recording Available */}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="recording_available"
                    name="recording_available"
                    checked={formData.recording_available}
                    onCheckedChange={(checked) => 
                      setFormData({ ...formData, recording_available: checked })
                    }
                  />
                  <Label htmlFor="recording_available" className="text-sm font-medium cursor-pointer">
                    Make recording available to students
                  </Label>
              </div>
              </div>
            </ScrollArea>
            
            <DialogFooter className="flex-shrink-0 mt-4 pt-4 border-t">
              <Button 
                type="button"
                variant="outline"
                onClick={() => setOpenDialog(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="bg-primary hover:bg-primary/90"
                disabled={submitting}
              >
                {submitting ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {currentSession ? 'Updating...' : 'Creating...'}
                  </span>
                ) : (
                  currentSession ? 'Update Session' : 'Create Session'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Session Details Dialog */}
      <Dialog open={openViewDialog} onOpenChange={setOpenViewDialog}>
        <DialogContent className="max-w-[1400px] w-[95vw]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Video className="h-5 w-5 text-primary" />
              Session Details
            </DialogTitle>
          </DialogHeader>
          
          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="space-y-4 py-2">
              {/* Title */}
              <div className="border-b pb-4">
                <h3 className="text-sm font-semibold text-muted-foreground mb-2">Title</h3>
                <p className="text-base font-medium text-foreground">
                  {currentSession?.title}
                </p>
                </div>

              {/* Class */}
              <div className="border-b pb-4">
                <h3 className="text-sm font-semibold text-muted-foreground mb-2">Class</h3>
                <p className="text-base font-medium text-foreground">
                  {currentSession?.class_title || currentSession?.class_info?.class_title || 'N/A'}
                </p>
              </div>

              {/* Session Scheduled Date */}
              <div className="border-b pb-4">
                <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Session Schedule
                </h3>
                {currentSession?.scheduled_date ? (
                  <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                        <svg className="h-5 w-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold uppercase mb-1">Scheduled For</p>
                        <p className="text-lg font-bold text-blue-900 dark:text-blue-100">
                          {new Date(currentSession.scheduled_date).toLocaleDateString('en-US', { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}
                        </p>
                        {currentSession?.class_info?.start_time && currentSession?.class_info?.end_time && (
                          <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                            <IconClock className="h-3.5 w-3.5 inline mr-1" />
                            {formatTime(currentSession.class_info.start_time)} - {formatTime(currentSession.class_info.end_time)}
                            {currentSession.class_info.timezone && ` (${currentSession.class_info.timezone})`}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                    <p className="text-sm text-amber-800 dark:text-amber-200">
                      ⚠️ No specific date scheduled yet. This session will be auto-scheduled based on class schedule.
                    </p>
                  </div>
                )}
              </div>

              {/* Class Recurring Schedule */}
              {currentSession?.class_info?.days_display && (
                <div className="border-b pb-4">
                  <h3 className="text-sm font-semibold text-muted-foreground mb-2">Class Recurring Schedule</h3>
                  <p className="text-base text-foreground">
                    {currentSession.class_info.days_display}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {currentSession.class_info.start_time && currentSession.class_info.end_time
                      ? `${formatTime(currentSession.class_info.start_time)} - ${formatTime(currentSession.class_info.end_time)}`
                      : 'N/A'}
                  </p>
                </div>
              )}

              {/* Status */}
              <div className="border-b pb-4">
                <h3 className="text-sm font-semibold text-muted-foreground mb-2">Status</h3>
              <div>
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${getStatusBadgeClass(currentSession?.status)}`}>
                    {currentSession?.status}
                  </span>
              </div>
              </div>

              {/* Recording Settings */}
              <div className="border-b pb-4">
                <h3 className="text-sm font-semibold text-muted-foreground mb-2">Recording Settings</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className={`h-4 w-4 ${currentSession?.auto_record ? 'text-emerald-600' : 'text-muted-foreground'}`} />
                    <span className="text-sm">Auto-record: {currentSession?.auto_record ? 'Enabled' : 'Disabled'}</span>
                </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className={`h-4 w-4 ${currentSession?.recording_available ? 'text-emerald-600' : 'text-muted-foreground'}`} />
                    <span className="text-sm">Recording Available: {currentSession?.recording_available ? 'Yes' : 'No'}</span>
              </div>
                  {currentSession?.recording_url && (
                    <div className="mt-2 p-3 bg-muted rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">Recording URL:</p>
                      <a 
                        href={currentSession.recording_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline break-all"
                      >
                        {currentSession.recording_url}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Session Resources */}
              <div className="border-b pb-4">
                <h3 className="text-sm font-semibold text-muted-foreground mb-3">Session Resources</h3>
                <ResourceList 
                  sessionId={currentSession?.id}
                  canManage={true}
                />
              </div>

              {/* Metadata */}
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground mb-2">Additional Information</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Session ID:</span>
                    <span className="font-mono font-medium">{currentSession?.id}</span>
              </div>
                  <div className="flex justify-between py-2">
                    <span className="text-muted-foreground">Created:</span>
                    <span>{currentSession?.created_at ? formatDate(currentSession.created_at) : 'N/A'}</span>
        </div>
                </div>
              </div>
            </div>
          </ScrollArea>
          
          <DialogFooter>
            <Button onClick={() => setOpenViewDialog(false)} variant="default">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-semibold text-foreground">
              Confirm Deletion
            </AlertDialogTitle>
            <div className="mt-4 bg-red-500/10 p-4 rounded-lg border border-red-500/20">
              <div className="flex items-start">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <div className="font-medium">This action cannot be undone.</div>
                  <div className="mt-2">
                    Are you sure you want to permanently delete the session:{" "}
                    <span className="font-semibold text-red-500">{currentSession?.title}</span>?
                  </div>
                </div>
              </div>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel disabled={deleting} className="border-border hover:bg-muted/50">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-red-500 hover:bg-red-600 focus:ring-red-500"
              disabled={deleting}
            >
              {deleting ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Deleting...
                </span>
              ) : (
                'Delete Session'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Attendance Dialog */}
      <Dialog open={attendanceDialogOpen} onOpenChange={closeAttendanceDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader className="pb-4 border-b flex-shrink-0">
            <DialogTitle className="text-xl font-semibold flex items-center gap-2">
              <IconClipboardCheck className="h-5 w-5 text-primary" />
              Session Attendance
            </DialogTitle>
            <DialogDescription className="text-sm mt-2">
              <div className="font-medium text-foreground">{selectedSession?.title}</div>
              <div className="text-muted-foreground">{selectedSession?.class_title || selectedSession?.class_info?.class_title}</div>
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto">
            {loadingAttendance ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading attendance data...</p>
                </div>
              </div>
            ) : enrollments.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="bg-muted/50 p-4 rounded-full mb-4 inline-block">
                    <IconUsers className="h-10 w-10 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium text-foreground mb-1">No Students Enrolled</h3>
                  <p className="text-muted-foreground text-sm">
                    There are no students enrolled in this session's class.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4 p-1">
                {/* Attendance Summary Stats */}
                <div className="grid grid-cols-3 gap-3 p-4 bg-muted/30 rounded-lg">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-foreground">{enrollments.length}</div>
                    <div className="text-xs text-muted-foreground mt-1">Total</div>
                  </div>
                  <div className="text-center border-x">
                    <div className="text-2xl font-bold text-emerald-600">
                      {Object.values(attendanceData).filter(a => a?.status === 'present').length}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">Present</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {Object.values(attendanceData).filter(a => a?.status === 'absent').length || enrollments.length - Object.values(attendanceData).filter(a => a?.status === 'present').length}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">Absent</div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="flex items-center justify-end gap-2 pb-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-emerald-600 border-emerald-300 hover:bg-emerald-50"
                    onClick={() => {
                      const newData = {};
                      enrollments.forEach(enrollment => {
                        newData[enrollment.id] = {
                          ...attendanceData[enrollment.id],
                          status: 'present',
                          class_enrollment: enrollment.id,
                        };
                      });
                      setAttendanceData(newData);
                    }}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                    All Present
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-600 border-red-300 hover:bg-red-50"
                    onClick={() => {
                      const newData = {};
                      enrollments.forEach(enrollment => {
                        newData[enrollment.id] = {
                          ...attendanceData[enrollment.id],
                          status: 'absent',
                          class_enrollment: enrollment.id,
                        };
                      });
                      setAttendanceData(newData);
                    }}
                  >
                    <XCircle className="h-3.5 w-3.5 mr-1.5" />
                    All Absent
                  </Button>
                </div>

                {/* Students List */}
                <div className="space-y-2">
                  {enrollments.map((enrollment, index) => {
                    const attendance = attendanceData[enrollment.id];
                    const status = attendance?.status || 'absent';
                    const isPresent = status === 'present';

                    return (
                      <div
                        key={enrollment.id}
                        className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                          isPresent
                            ? 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:border-emerald-800'
                            : 'bg-background border-border hover:bg-muted/50'
                        }`}
                        onClick={() => toggleAttendanceStatus(enrollment.id, status)}
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="h-8 w-8 rounded bg-muted flex items-center justify-center text-sm font-medium">
                              {index + 1}
                            </div>
                            
                            <div className={`h-10 w-10 rounded-full flex items-center justify-center text-white font-medium ${
                              isPresent ? 'bg-emerald-600' : 'bg-muted-foreground'
                            }`}>
                              {enrollment.student_name?.[0]?.toUpperCase() || enrollment.student_email?.[0]?.toUpperCase() || '?'}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-foreground truncate">
                                {enrollment.student_name || 'Unknown Student'}
                              </div>
                              <div className="text-sm text-muted-foreground truncate">
                                {enrollment.student_email}
                              </div>
                            </div>
                          </div>

                          <Badge 
                            variant={isPresent ? 'default' : 'secondary'}
                            className={isPresent ? 'bg-emerald-600' : ''}
                          >
                            {isPresent ? (
                              <>
                                <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                                Present
                              </>
                            ) : (
                              <>
                                <XCircle className="h-3.5 w-3.5 mr-1" />
                                Absent
                              </>
                            )}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="mt-4 pt-4 border-t flex-shrink-0">
            <Button
              variant="outline"
              onClick={closeAttendanceDialog}
              disabled={savingAttendance}
            >
              Cancel
            </Button>
            <Button
              onClick={saveAttendance}
              disabled={loadingAttendance || savingAttendance || enrollments.length === 0}
            >
              {savingAttendance ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <IconCheck className="h-4 w-4 mr-2" />
                  Save Attendance
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upload Resources Dialog */}
      <Dialog open={uploadResourcesDialogOpen} onOpenChange={setUploadResourcesDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
              Upload Session Resources
            </DialogTitle>
            <DialogDescription>
              Upload documents, images, videos and other materials for your live sessions
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-1 overflow-y-auto pr-4">
            <div className="space-y-4 py-4">
            {/* Session Selection */}
            <div className="space-y-2">
              <Label htmlFor="upload-session">Session *</Label>
              {selectedSessionForUpload ? (
                <div className="p-3 border rounded-md bg-muted/50">
                  <div className="flex flex-col">
                    <span className="font-medium">
                      {sessions.find(s => s.id === selectedSessionForUpload)?.title || 'Selected Session'}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {sessions.find(s => s.id === selectedSessionForUpload)?.class_title || ''}
                    </span>
                  </div>
                </div>
              ) : (
                <Select 
                  value={selectedSessionForUpload?.toString() || ''} 
                  onValueChange={(value) => setSelectedSessionForUpload(parseInt(value))}
                >
                  <SelectTrigger id="upload-session">
                    <SelectValue placeholder="Choose a session..." />
                  </SelectTrigger>
                  <SelectContent>
                    {sessions.map((session) => (
                      <SelectItem key={session.id} value={session.id.toString()}>
                        <div className="flex flex-col">
                          <span className="font-medium">{session.title}</span>
                          <span className="text-xs text-muted-foreground">
                            {session.class_title}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* File Input */}
            <div className="flex items-center justify-center w-full">
              <label
                htmlFor="resource-file-upload"
                className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 border-gray-300 dark:border-gray-600"
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 mb-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="mb-2 text-sm text-gray-500">
                    <span className="font-semibold">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-gray-500">
                    PDF, DOC, Images, Videos (MAX. 50MB per file)
                  </p>
                </div>
                <input
                  id="resource-file-upload"
                  type="file"
                  className="hidden"
                  multiple
                  onChange={handleFileSelect}
                  disabled={uploadingResources}
                />
              </label>
            </div>

            {/* Selected Files */}
            {filesToUpload.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-medium">Selected Files ({filesToUpload.length})</h3>
                <div className="space-y-3">
                  {filesToUpload.map((fileData) => (
                    <Card key={fileData.id} className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-start gap-3">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{fileData.file.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatFileSize(fileData.file.size)}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeFileFromUpload(fileData.id)}
                            disabled={uploadingResources}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="space-y-1">
                          <Label>Title *</Label>
                          <Input
                            value={fileData.title}
                            onChange={(e) => updateFileInfo(fileData.id, 'title', e.target.value)}
                            placeholder="Resource title"
                            disabled={uploadingResources}
                          />
                        </div>

                        <div className="space-y-1">
                          <Label>Description (Optional)</Label>
                          <Textarea
                            value={fileData.description}
                            onChange={(e) => updateFileInfo(fileData.id, 'description', e.target.value)}
                            placeholder="Add a description"
                            rows={2}
                            disabled={uploadingResources}
                          />
                        </div>

                        {uploadProgress[fileData.id] !== undefined && (
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>Uploading...</span>
                              <span>{uploadProgress[fileData.id]}%</span>
                            </div>
                            <Progress value={uploadProgress[fileData.id]} />
                          </div>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
            </div>
          </ScrollArea>

          <DialogFooter className="flex-shrink-0 mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setUploadResourcesDialogOpen(false);
                setFilesToUpload([]);
                setSelectedSessionForUpload(null);
              }}
              disabled={uploadingResources}
            >
              Cancel
            </Button>
            <Button
              onClick={uploadResources}
              disabled={uploadingResources || filesToUpload.length === 0 || !selectedSessionForUpload}
              className="bg-primary hover:bg-primary/90"
            >
              {uploadingResources ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                  Uploading...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                  Upload {filesToUpload.length} file(s)
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SessionsSkeleton() {
  return (
    <div className="p-4 md:p-6">
      <div className="mb-6">
        <Skeleton className="h-10 w-40 mb-4" />
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-80" />
      </div>

      <Card className="border-0 shadow-lg mb-6">
        <CardHeader>
          <Skeleton className="h-6 w-24" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-10 w-64" />
        </CardContent>
      </Card>

      <Card className="border-0 shadow-lg">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex justify-between items-center">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-8 w-24" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

