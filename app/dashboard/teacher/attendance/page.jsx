'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { useDebounce } from '@/hooks/use-debounce';
import Pagination from '@/components/Pagination';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  Filter,
  X,
  User,
  RefreshCw,
  AlertCircle,
  BookOpen,
  Smartphone
} from 'lucide-react';
import { toast } from 'sonner';

export default function TeacherAttendancePage() {
  const router = useRouter();
  const [attendances, setAttendances] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [currentAttendance, setCurrentAttendance] = useState(null);
  const [formData, setFormData] = useState({
    student: '',
    session: '',
    status: 'present',
  });
  const [errors, setErrors] = useState({});
  const [deleting, setDeleting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [studentFilter, setStudentFilter] = useState('all');
  const [classFilter, setClassFilter] = useState('all');
  const [sessionFilter, setSessionFilter] = useState('all');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  
  // Debounce search query to avoid too many API calls
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

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
      baseURL: 'http://127.0.0.1:8000/api/',
      headers: {
        'Content-Type': 'application/json',
        Authorization: token ? `Bearer ${token}` : '',
      },
    });
  };

  // Fetch data
  const fetchData = async () => {
    try {
      setLoading(true);
      const api = getApiInstance();
      
      // Build query parameters for attendance with search and filters
      const attendanceParams = {
        page: currentPage,
        page_size: pageSize,
      };
      if (statusFilter && statusFilter !== 'all') {
        attendanceParams.status = statusFilter;
      }
      if (studentFilter && studentFilter !== 'all') {
        attendanceParams.student = studentFilter;
      }
      if (classFilter && classFilter !== 'all') {
        attendanceParams.class_id = classFilter;
      }
      if (sessionFilter && sessionFilter !== 'all') {
        attendanceParams.session = sessionFilter;
      }
      if (debouncedSearchQuery) {
        attendanceParams.search = debouncedSearchQuery;
      }
      
      const [attendancesRes, sessionsRes, classesRes, enrollmentsRes] = await Promise.all([
        api.get('course/attendance/', { params: attendanceParams }),
        api.get('course/live_session/', { params: { page_size: 1000 } }),
        api.get('course/', { params: { page_size: 1000 } }),
        api.get('enrollment/', { params: { status__iexact: 'completed', page_size: 1000 } })
      ]);
      
      // Handle paginated response for attendances
      if (attendancesRes.data.results) {
        setAttendances(attendancesRes.data.results);
        setTotalCount(attendancesRes.data.count);
        setTotalPages(attendancesRes.data.total_pages);
      } else {
        setAttendances(attendancesRes.data);
        setTotalCount(attendancesRes.data.length);
        setTotalPages(1);
      }
      
      // Handle sessions data
      if (sessionsRes.data.results) {
        setSessions(sessionsRes.data.results);
      } else {
        setSessions(sessionsRes.data);
      }
      
      // Handle classes data
      if (classesRes.data.results) {
        setClasses(classesRes.data.results);
      } else {
        setClasses(classesRes.data);
      }
      
      // Extract unique students from enrollments
      const enrollments = enrollmentsRes.data.results || enrollmentsRes.data;
      const uniqueStudentsMap = new Map();
      enrollments.forEach(enrollment => {
        if (enrollment.student_data) {
          const student = enrollment.student_data;
          if (!uniqueStudentsMap.has(student.id)) {
            uniqueStudentsMap.set(student.id, student);
          }
        }
      });
      const uniqueStudents = Array.from(uniqueStudentsMap.values());
      setAllStudents(uniqueStudents);
      
      console.log('Loaded data:', {
        students: uniqueStudents.length,
        classes: (classesRes.data.results || classesRes.data).length,
        sessions: (sessionsRes.data.results || sessionsRes.data).length,
        attendances: (attendancesRes.data.results || attendancesRes.data).length
      });
    } catch (error) {
      console.error('Error fetching data:', error);
      handleApiError(error, 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [debouncedSearchQuery, statusFilter, studentFilter, classFilter, sessionFilter, currentPage, pageSize]);

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
    setStudentFilter('all');
    setClassFilter('all');
    setSessionFilter('all');
    setSearchQuery('');
    setCurrentPage(1);
  };

  // Check if any filter is active
  const hasActiveFilters = statusFilter !== 'all' || studentFilter !== 'all' || classFilter !== 'all' || sessionFilter !== 'all' || searchQuery !== '';

  // Get active filters for display
  const getActiveFilters = () => {
    const filters = [];
    if (studentFilter !== 'all') {
      const student = allStudents.find(s => s.id.toString() === studentFilter);
      filters.push({
        type: 'student',
        label: student ? (student.full_name || student.email) : 'Student',
        icon: User,
        remove: () => setStudentFilter('all')
      });
    }
    if (classFilter !== 'all') {
      const classItem = classes.find(c => c.id.toString() === classFilter);
      filters.push({
        type: 'class',
        label: classItem ? classItem.title : 'Class',
        icon: BookOpen,
        remove: () => setClassFilter('all')
      });
    }
    if (sessionFilter !== 'all') {
      const session = sessions.find(s => s.id.toString() === sessionFilter);
      filters.push({
        type: 'session',
        label: session ? session.title : 'Session',
        icon: Calendar,
        remove: () => setSessionFilter('all')
      });
    }
    if (statusFilter !== 'all') {
      filters.push({
        type: 'status',
        label: statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1),
        icon: CheckCircle,
        remove: () => setStatusFilter('all')
      });
    }
    if (searchQuery) {
      filters.push({
        type: 'search',
        label: `Search: "${searchQuery}"`,
        icon: User,
        remove: () => setSearchQuery('')
      });
    }
    return filters;
  };

  const activeFilters = getActiveFilters();

  // Fetch students enrolled in a specific session
  const fetchStudentsForSession = async (sessionId) => {
    if (!sessionId) {
      setStudents([]);
      return;
    }
    
    try {
      setLoadingStudents(true);
      const api = getApiInstance();
      const response = await api.get(`course/session/${sessionId}/students/`);
      setStudents(response.data.students || []);
    } catch (error) {
      console.error('Error fetching students:', error);
      toast.error('Failed to load students for this session');
      setStudents([]);
    } finally {
      setLoadingStudents(false);
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
        const errorMessages = [];
        
        Object.keys(backendErrors).forEach(key => {
          const errorValue = Array.isArray(backendErrors[key]) 
            ? backendErrors[key].join(' ') 
            : backendErrors[key];
          
          formErrors[key] = errorValue;
          
          if (key === 'non_field_errors') {
            errorMessages.push(errorValue);
          } else {
            errorMessages.push(errorValue);
          }
        });
        
        if (Object.keys(formErrors).length > 0) {
          setErrors(formErrors);
          
          if (errorMessages.length === 1) {
            const message = errorMessages[0].length > 100 
              ? errorMessages[0].substring(0, 97) + '...' 
              : errorMessages[0];
            toast.error(message, { duration: 4000 });
          } else if (errorMessages.length > 1) {
            toast.error(`${errorMessages.length} errors found. Check form.`, { duration: 4000 });
          } else {
            toast.error('Please check the form for errors');
          }
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
  const handleChange = (name, value) => {
    setFormData({
      ...formData,
      [name]: value
    });
    if (errors[name]) setErrors({ ...errors, [name]: '' });
    
    // If session changes, load students for that session and reset student selection
    if (name === 'session') {
      fetchStudentsForSession(value);
      setFormData(prev => ({
        ...prev,
        student: '',
        [name]: value
      }));
    }
  };

  // Open create dialog
  const openCreateDialog = () => {
    setCurrentAttendance(null);
    setFormData({
      student: '',
      session: '',
      status: 'present',
    });
    setStudents([]);
    setErrors({});
    setOpenDialog(true);
  };

  // Open edit dialog
  const openEditDialog = async (attendance) => {
    setCurrentAttendance(attendance);
    
    // For editing, we need to load students for the session
    if (attendance.session) {
      await fetchStudentsForSession(attendance.session);
    }
    
    // Get the student ID directly from the attendance record
    const studentId = attendance.student_id || '';
    
    setFormData({
      student: studentId,
      session: attendance.session,
      status: attendance.status,
    });
    setErrors({});
    setOpenDialog(true);
  };

  // Open delete confirmation
  const openDeleteConfirmation = (attendance) => {
    setCurrentAttendance(attendance);
    setOpenDeleteDialog(true);
  };

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    
    // Client-side validation
    const validationErrors = {};
    if (!formData.session) validationErrors.session = 'Please select a session';
    if (!formData.student) validationErrors.student = 'Please select a student';
    if (!formData.status) validationErrors.status = 'Please select a status';
    
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      const errorCount = Object.keys(validationErrors).length;
      if (errorCount === 1) {
        const fieldName = Object.keys(validationErrors)[0];
        const displayName = fieldName === 'student' ? 'Student' :
                           fieldName === 'session' ? 'Session' :
                           fieldName === 'status' ? 'Status' : fieldName;
        toast.error(`${displayName} is required`);
      } else {
        toast.error(`Please fill in ${errorCount} required fields`);
      }
      return;
    }

    setSubmitting(true);
    
    try {
      const api = getApiInstance();
      
      // Collect client-side device info
      const deviceInfo = {
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        screen_resolution: `${window.screen.width}x${window.screen.height}`,
        language: navigator.language,
        platform: navigator.platform,
      };

      const payload = {
        student: formData.student,
        session: formData.session,
        status: formData.status,
        device_info: deviceInfo,
      };
      
      if (currentAttendance) {
        await api.put(`course/attendance/${currentAttendance.id}/`, payload);
        toast.success('Attendance updated successfully');
      } else {
        await api.post('course/attendance/', payload);
        toast.success('Attendance created successfully');
      }
      
      setOpenDialog(false);
      setCurrentPage(1);
      fetchData();
    } catch (error) {
      handleApiError(error, currentAttendance ? 'Failed to update attendance' : 'Failed to create attendance');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete attendance
  const handleDelete = async () => {
    setDeleting(true);
    try {
      const api = getApiInstance();
      await api.delete(`course/attendance/${currentAttendance.id}/`);
      toast.success('Attendance deleted successfully');
      setOpenDeleteDialog(false);
      
      // Check if we need to go to previous page after deletion
      if (attendances.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
      
      fetchData();
    } catch (error) {
      handleApiError(error, 'Failed to delete attendance');
    } finally {
      setDeleting(false);
    }
  };

  // Helper to get student display
  const getStudentDisplay = (student) => {
    if (!student) return 'Unknown Student';
    return `${student.full_name || student.email} (${student.email})`;
  };

  // Helper to get session display
  const getSessionDisplay = (id) => {
    const session = sessions.find(s => s.id === id);
    return session ? `${session.title} (${formatDate(session.created_at)})` : 'Unknown Session';
  };

  // Format date
  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? 'Invalid Date' : date.toLocaleString();
  };

  // Format currency
  const formatCurrency = (value) => {
    return value ? `$${parseFloat(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'Free';
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        <p className="mt-4 text-muted-foreground">Loading attendance records...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-foreground">Manage Attendance</h1>
        <Button onClick={openCreateDialog} className="bg-primary hover:bg-primary/90">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          Record Attendance
        </Button>
      </div>

      {/* Search and Filter Section */}
      <div className="mb-6 space-y-3">
        {/* Search Bar */}
        <div className="relative">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <Input
            placeholder="Search by student name, email, session, or class..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-10"
          />
        </div>

        {/* Filters Container */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Student Filter */}
          <Select value={studentFilter} onValueChange={(value) => { setStudentFilter(value); setCurrentPage(1); }}>
            <SelectTrigger className={`w-full sm:w-[200px] !h-10 ${studentFilter !== 'all' ? 'border-primary bg-primary/5' : ''}`}>
              <div className="flex items-center gap-1.5">
                <User className="h-4 w-4 text-muted-foreground" />
                <SelectValue placeholder="All Students" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Students</SelectItem>
              {allStudents.map((student) => (
                <SelectItem key={student.id} value={student.id.toString()}>
                  {student.full_name || student.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Class Filter */}
          <Select value={classFilter} onValueChange={(value) => { setClassFilter(value); setCurrentPage(1); }}>
            <SelectTrigger className={`w-full sm:w-[200px] !h-10 ${classFilter !== 'all' ? 'border-primary bg-primary/5' : ''}`}>
              <div className="flex items-center gap-1.5">
                <BookOpen className="h-4 w-4 text-muted-foreground" />
                <SelectValue placeholder="All Classes" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Classes</SelectItem>
              {classes.map((classItem) => (
                <SelectItem key={classItem.id} value={classItem.id.toString()}>
                  {classItem.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Session Filter */}
          <Select value={sessionFilter} onValueChange={(value) => { setSessionFilter(value); setCurrentPage(1); }}>
            <SelectTrigger className={`w-full sm:w-[200px] !h-10 ${sessionFilter !== 'all' ? 'border-primary bg-primary/5' : ''}`}>
              <div className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <SelectValue placeholder="All Sessions" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sessions</SelectItem>
              {sessions.map((session) => (
                <SelectItem key={session.id} value={session.id.toString()}>
                  {session.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={(value) => { setStatusFilter(value); setCurrentPage(1); }}>
            <SelectTrigger className={`w-full sm:w-[160px] !h-10 ${statusFilter !== 'all' ? 'border-primary bg-primary/5' : ''}`}>
              <div className="flex items-center gap-1.5">
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
                <SelectValue placeholder="All Status" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="present">Present</SelectItem>
              <SelectItem value="absent">Absent</SelectItem>
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

      <div className="border rounded-lg overflow-hidden shadow-sm bg-card">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="w-[60px]">#</TableHead>
              <TableHead>Student</TableHead>
              <TableHead>Class</TableHead>
              <TableHead>Session</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {attendances.length > 0 ? (
              attendances.map((attendance, index) => (
                <TableRow key={attendance.id} className="hover:bg-muted/50">
                  <TableCell className="font-medium">{(currentPage - 1) * pageSize + index + 1}</TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{attendance.student_name || 'Unknown Student'}</div>
                      <div className="text-xs text-muted-foreground">{attendance.student_email || '-'}</div>
                    </div>
                  </TableCell>
                  <TableCell>{attendance.class_title || 'Unknown Class'}</TableCell>
                  <TableCell>{attendance.session_title || 'Unknown Session'}</TableCell>
                  <TableCell>
                    {attendance.status === 'present' ? (
                      <span className="inline-flex items-center px-2.5 py-1 bg-primary/10 text-primary rounded text-xs font-medium">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Present
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-1 bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 rounded text-xs font-medium">
                        <XCircle className="h-3 w-3 mr-1" />
                        Absent
                      </span>
                    )}
                  </TableCell>
                  <TableCell>{formatDate(attendance.created_at)}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem 
                          onClick={() => {
                            setCurrentAttendance(attendance);
                            setOpenViewDialog(true);
                          }}
                          className="cursor-pointer flex items-center gap-2"
                        >
                          <Eye className="h-4 w-4 text-primary" />
                          <span>View Details</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => openEditDialog(attendance)}
                          className="cursor-pointer flex items-center gap-2"
                        >
                          <Edit className="h-4 w-4 text-yellow-500" />
                          <span>Edit</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => openDeleteConfirmation(attendance)}
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
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-foreground mb-1">No attendance records found</h3>
                    <p className="text-muted-foreground mb-4">
                      {hasActiveFilters 
                        ? 'Try adjusting your filters'
                        : 'Get started by recording attendance'}
                    </p>
                    <Button 
                      className="bg-primary hover:bg-primary/90"
                      onClick={openCreateDialog}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                      </svg>
                      Record Attendance
                    </Button>
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
            label="Attendance Records"
            pageSizeOptions={[5, 10, 20, 50]}
          />
        )}
      </div>

      {/* View Attendance Details Dialog */}
      <Dialog open={openViewDialog} onOpenChange={setOpenViewDialog}>
        <DialogContent className="max-w-2xl h-[80vh] flex flex-col overflow-hidden">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-foreground flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-primary" />
              Attendance Details
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              View attendance record information
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full pr-4">
              {currentAttendance && (
                <div className="space-y-6 py-4">
                  <div className="border-b pb-4">
                    <h3 className="font-medium text-foreground flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      Status
                    </h3>
                    <p className="mt-2 text-muted-foreground">
                      {currentAttendance.status === 'present' ? 'Present' : 'Absent'}
                    </p>
                  </div>
                  <div className="border-b pb-4">
                    <h3 className="font-medium text-foreground flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      Class Details
                    </h3>
                    {currentAttendance.class_data ? (
                      <div className="mt-2 space-y-2 text-sm">
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-muted-foreground">Title:</span>
                          <span className="text-foreground">{currentAttendance.class_data.title}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-muted-foreground">Description:</span>
                          <span className="text-foreground">{currentAttendance.class_data.description || '-'}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-muted-foreground">Capacity:</span>
                          <span className="text-foreground">{currentAttendance.class_data.capacity}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-muted-foreground">Price:</span>
                          <span className="text-foreground">{formatCurrency(currentAttendance.class_data.price)}</span>
                        </div>
                      </div>
                    ) : (
                      <p className="mt-2 text-muted-foreground">No class data available</p>
                    )}
                  </div>
                  <div className="border-b pb-4">
                    <h3 className="font-medium text-foreground flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Session Details
                    </h3>
                    {currentAttendance.session_data ? (
                      <div className="mt-2 space-y-2 text-sm">
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-muted-foreground">Title:</span>
                          <span className="text-foreground">{currentAttendance.session_data.title}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-muted-foreground">Status:</span>
                          <span className="text-foreground">{currentAttendance.session_data.status}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-muted-foreground">Duration:</span>
                          <span className="text-foreground">{currentAttendance.session_data.duration} minutes</span>
                        </div>
                      </div>
                    ) : (
                      <p className="mt-2 text-muted-foreground">No session data available</p>
                    )}
                  </div>
                  <div className="border-b pb-4">
                    <h3 className="font-medium text-foreground flex items-center gap-2">
                      <Smartphone className="h-4 w-4" />
                      Device Information
                    </h3>
                    <div className="mt-2 bg-muted/50 p-3 rounded-md text-sm overflow-x-auto">
                      <pre className="whitespace-pre-wrap">
                        {JSON.stringify(currentAttendance.device_info, null, 2)}
                      </pre>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Additional Information
                    </h3>
                    <div className="mt-2 space-y-2 text-sm">
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-muted-foreground">Student:</span>
                        <span className="text-foreground">{currentAttendance.student_name || 'Unknown Student'}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-muted-foreground">Class:</span>
                        <span className="text-foreground">{currentAttendance.class_title || 'Unknown Class'}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-muted-foreground">Session:</span>
                        <span className="text-foreground">{getSessionDisplay(currentAttendance.session)}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-muted-foreground">Created At:</span>
                        <span className="text-foreground">{formatDate(currentAttendance.created_at)}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span className="text-muted-foreground">Updated At:</span>
                        <span className="text-foreground">{formatDate(currentAttendance.updated_at)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </ScrollArea>
          </div>
          <DialogFooter>
            <Button 
              onClick={() => setOpenViewDialog(false)}
              className="bg-gray-800 hover:bg-gray-900"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create/Edit Dialog */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-foreground">
              {currentAttendance ? 'Edit Attendance' : 'Record New Attendance'}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {currentAttendance
                ? 'Update the attendance record'
                : 'Create a new attendance record'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="mt-2">
            {/* Error Summary Alert */}
            {Object.keys(errors).length > 0 && (
              <Alert variant="destructive" className="mb-3">
                <AlertCircle className="h-4 w-4 mt-0.5" />
                <AlertDescription className="text-sm">
                  {Object.entries(errors).map(([key, value], index) => (
                    <div key={key} className={index > 0 ? 'mt-1' : ''}>
                      {key === 'non_field_errors' ? (
                        <span>{value}</span>
                      ) : (
                        <span>
                          <strong className="font-semibold">
                            {key === 'student' ? 'Student' :
                             key === 'session' ? 'Session' :
                             key === 'status' ? 'Status' :
                             key === 'class_enrollment' ? 'Enrollment' :
                             key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ')}:
                          </strong> {value}
                        </span>
                      )}
                    </div>
                  ))}
                </AlertDescription>
              </Alert>
            )}
            <div className="grid gap-4 py-2">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right font-medium">Session*</Label>
                <div className="col-span-3">
                  <Select 
                    value={formData.session.toString()}
                    onValueChange={(value) => handleChange('session', parseInt(value))}
                  >
                    <SelectTrigger className={errors.session ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Select session" />
                    </SelectTrigger>
                    <SelectContent>
                      {sessions.map(session => (
                        <SelectItem key={session.id} value={session.id.toString()}>
                          {getSessionDisplay(session.id)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.session && <p className="mt-1 text-sm text-red-500">{errors.session}</p>}
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right font-medium">Student*</Label>
                <div className="col-span-3">
                  {!formData.session ? (
                    <p className="text-sm text-muted-foreground">Please select a session first</p>
                  ) : loadingStudents ? (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <RefreshCw className="animate-spin h-4 w-4 mr-2" />
                      Loading students...
                    </div>
                  ) : students.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No students enrolled in this session</p>
                  ) : (
                    <Select 
                      value={formData.student.toString()}
                      onValueChange={(value) => handleChange('student', parseInt(value))}
                    >
                      <SelectTrigger className={errors.student ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Select student" />
                      </SelectTrigger>
                      <SelectContent>
                        {students.map(student => (
                          <SelectItem key={student.id} value={student.id.toString()}>
                            {getStudentDisplay(student)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  {errors.student && <p className="mt-1 text-sm text-red-500">{errors.student}</p>}
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right font-medium">Status*</Label>
                <div className="col-span-3">
                  <Select 
                    value={formData.status}
                    onValueChange={(value) => handleChange('status', value)}
                  >
                    <SelectTrigger className={errors.status ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="present">Present</SelectItem>
                      <SelectItem value="absent">Absent</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.status && <p className="mt-1 text-sm text-red-500">{errors.status}</p>}
                </div>
              </div>
            </div>
            <DialogFooter className="mt-4">
              <Button 
                type="submit" 
                className="bg-primary hover:bg-primary/90"
                disabled={submitting}
              >
                {submitting ? (
                  <span className="flex items-center">
                    <RefreshCw className="animate-spin h-4 w-4 mr-2" />
                    {currentAttendance ? 'Updating...' : 'Creating...'}
                  </span>
                ) : (
                  currentAttendance ? 'Update Attendance' : 'Create Attendance'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-semibold text-foreground">
              Confirm Deletion
            </AlertDialogTitle>
            <div className="mt-4 bg-red-50 p-4 rounded-lg border border-red-100">
              <div className="flex items-start">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <div className="font-medium">This action cannot be undone.</div>
                  <div className="mt-2">
                    Are you sure you want to permanently delete this attendance record?
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
                  <RefreshCw className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" />
                  Deleting...
                </span>
              ) : (
                'Delete Attendance'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
