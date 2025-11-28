'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { useDebounce } from '@/hooks/use-debounce';
import { config } from '@/lib/config';
import Pagination from '@/components/Pagination';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  User,
  BookOpen,
  Calendar,
  DollarSign,
  BadgeCheck,
  Clock,
  XCircle,
  CheckCircle,
  Users,
  Book,
  Clock4,
  Filter,
  X,
  RefreshCw,
  ArrowLeft
} from 'lucide-react';
import { toast } from 'sonner';

export default function EnrollmentsPage() {
  const router = useRouter();
  const [enrollments, setEnrollments] = useState([]);
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [currentEnrollment, setCurrentEnrollment] = useState(null);
  const [formData, setFormData] = useState({
    student: '',
    class_enrolled: '',
    status: 'pending',
    price: '',
    payment_ref: '',
  });

  // Enrollment status choices (sync with backend)
  const ENROLLMENT_STATUSES = [
    { value: 'pending', label: 'Pending' },
    { value: 'cancelled', label: 'Cancelled' },
    { value: 'completed', label: 'Completed' },
    { value: 'expired', label: 'Expired' },
  ];
  const [errors, setErrors] = useState({});
  const [deleting, setDeleting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
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

  // Fetch data
  const fetchData = async () => {
    try {
      setLoading(true);
      const api = getApiInstance();
      
      // Build query parameters for enrollments
      const enrollmentParams = {
        page: currentPage,
        page_size: pageSize,
      };
      if (statusFilter && statusFilter !== 'all') {
        enrollmentParams.status__iexact = statusFilter;
      }
      
      const [enrollmentsRes, studentsRes, classesRes] = await Promise.all([
        api.get('enrollment/', { params: enrollmentParams }),
        api.get('auth/user/?role=student'),
        api.get('course/')
      ]);
      
      // Handle paginated response
      if (enrollmentsRes.data.results) {
        // If debouncedSearchQuery is provided, filter client-side by student name/email
        let filteredEnrollments = enrollmentsRes.data.results;
        if (debouncedSearchQuery) {
          filteredEnrollments = enrollmentsRes.data.results.filter(enrollment => {
            const studentName = enrollment.student_data?.full_name?.toLowerCase() || '';
            const studentEmail = enrollment.student_data?.email?.toLowerCase() || '';
            const query = debouncedSearchQuery.toLowerCase();
            return studentName.includes(query) || studentEmail.includes(query);
          });
        }
        
        setEnrollments(filteredEnrollments);
        setTotalCount(enrollmentsRes.data.count);
        setTotalPages(enrollmentsRes.data.total_pages);
      } else {
        // Fallback for non-paginated response
        let filteredEnrollments = enrollmentsRes.data;
        if (debouncedSearchQuery) {
          filteredEnrollments = enrollmentsRes.data.filter(enrollment => {
            const studentName = enrollment.student_data?.full_name?.toLowerCase() || '';
            const studentEmail = enrollment.student_data?.email?.toLowerCase() || '';
            const query = debouncedSearchQuery.toLowerCase();
            return studentName.includes(query) || studentEmail.includes(query);
          });
        }
        
        setEnrollments(filteredEnrollments);
        setTotalCount(filteredEnrollments.length);
        setTotalPages(1);
      }
      
      // Handle students and classes data
      if (studentsRes.data.results) {
        setStudents(studentsRes.data.results);
      } else {
        setStudents(studentsRes.data);
      }
      
      if (classesRes.data.results) {
        setClasses(classesRes.data.results);
      } else {
        setClasses(classesRes.data);
      }
    } catch (error) {
      handleApiError(error, 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [debouncedSearchQuery, statusFilter, currentPage, pageSize]);

  // Handle page change
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Handle page size change
  const handlePageSizeChange = (size) => {
    setPageSize(size);
    setCurrentPage(1); // Reset to first page when changing page size
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
      const statusLabel = ENROLLMENT_STATUSES.find(s => s.value === statusFilter)?.label || statusFilter;
      filters.push({
        type: 'status',
        label: statusLabel,
        icon: BadgeCheck,
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

  // Handle API errors
  const handleApiError = (error, defaultMessage) => {
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
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    if (errors[name]) setErrors({ ...errors, [name]: '' });
  };

  // Handle select changes
  const handleSelectChange = (name, value) => {
    setFormData({
      ...formData,
      [name]: value
    });
    if (errors[name]) setErrors({ ...errors, [name]: '' });
  };

  // Open create dialog
  const openCreateDialog = () => {
    setCurrentEnrollment(null);
    setFormData({
      student: '',
      class_enrolled: '',
      status: 'pending',
      price: '',
      payment_ref: '',
    });
    setErrors({});
    setOpenDialog(true);
  };

  // Open edit dialog
  const openEditDialog = (enrollment) => {
    setCurrentEnrollment(enrollment);
    setFormData({
      student: enrollment.student.toString(),
      class_enrolled: enrollment.class_enrolled.toString(),
      status: enrollment.status,
      price: enrollment.price ? enrollment.price.toString() : '',
      payment_ref: enrollment.payment_ref || '',
    });
    setErrors({});
    setOpenDialog(true);
  };

  // Open delete confirmation
  const openDeleteConfirmation = (enrollment) => {
    setCurrentEnrollment(enrollment);
    setOpenDeleteDialog(true);
  };

  // Handle delete enrollment
  const handleDelete = async () => {
    if (!currentEnrollment) return;
    setDeleting(true);
    try {
      const api = getApiInstance();
      await api.delete(`enrollment/${currentEnrollment.id}/`);
      toast.success('Enrollment deleted successfully');
      setOpenDeleteDialog(false);
      setCurrentEnrollment(null);
      
      // Check if we need to go to previous page after deletion
      if (enrollments.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
      
      fetchData();
    } catch (error) {
      handleApiError(error, 'Failed to delete enrollment');
    } finally {
      setDeleting(false);
    }
  };

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    
    // Client-side validation
    const validationErrors = {};
    if (!formData.student) validationErrors.student = 'Student is required';
    if (!formData.class_enrolled) validationErrors.class_enrolled = 'Class is required';
    if (!formData.status) validationErrors.status = 'Status is required';
    
    // Validate price doesn't exceed class price
    const selectedClass = classes.find(c => c.id.toString() === formData.class_enrolled);
    if (selectedClass) {
      const classPrice = selectedClass.price ? parseFloat(selectedClass.price) : 0;
      const enrollmentPrice = formData.price ? parseFloat(formData.price) : 0;
      
      if (classPrice === 0 || !classPrice) {
        // Class is free, price should not exceed 0
        if (enrollmentPrice > 0) {
          validationErrors.price = 'This class is free. Amount paid cannot exceed $0.00.';
        }
      } else {
        // Class has a price, enrollment price cannot exceed it
        if (enrollmentPrice > classPrice) {
          validationErrors.price = `Amount paid cannot exceed the class price of $${classPrice.toFixed(2)}. You entered $${enrollmentPrice.toFixed(2)}.`;
        }
      }
    }
    
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      toast.warning('Please fix the form errors');
      return;
    }

    setSubmitting(true);
    
    try {
      const api = getApiInstance();
      
      // Prepare payload
      const payload = {
        student: parseInt(formData.student),
        class_enrolled: parseInt(formData.class_enrolled),
        status: formData.status,
        price: formData.price ? parseFloat(formData.price) : null,
        payment_ref: formData.payment_ref || '',
      };
      
      if (currentEnrollment) {
        await api.put(`enrollment/${currentEnrollment.id}/`, payload);
        toast.success('Enrollment updated successfully');
      } else {
        await api.post('enrollment/', payload);
        toast.success('Enrollment created successfully');
      }
      
      setOpenDialog(false);
      // Reset to first page after creating/updating
      setCurrentPage(1);
      fetchData();
    } catch (error) {
      handleApiError(error, currentEnrollment ? 'Failed to update enrollment' : 'Failed to create enrollment');
    } finally {
      setSubmitting(false);
    }
  };

  // Get status badge
  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      cancelled: { color: 'bg-red-100 text-red-800', icon: XCircle },
      completed: { color: 'bg-primary/10 text-primary', icon: BadgeCheck },
      expired: { color: 'bg-muted text-foreground', icon: Clock },
    };
    const config = statusConfig[status] || statusConfig.pending;
    const IconComponent = config.icon;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color} flex items-center gap-1`}>
        <IconComponent className="h-3 w-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  // Format currency
  const formatCurrency = (value) => {
    return value ? `$${parseFloat(value).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}` : 'Free';
  };

  // Map day numbers to day names
  const getDayName = (dayNumber) => {
    const days = {
      1: 'Monday',
      2: 'Tuesday',
      3: 'Wednesday',
      4: 'Thursday',
      5: 'Friday',
      6: 'Saturday',
      7: 'Sunday'
    };
    return days[dayNumber] || `Day ${dayNumber}`;
  };

  // Format days of week array
  const formatDaysOfWeek = (daysArray) => {
    if (!daysArray || !Array.isArray(daysArray)) return 'N/A';
    return daysArray.map(day => getDayName(day)).join(', ');
  };

  // Get class display text for select options
  const getClassDisplayText = (classItem) => {
    const classTitle = classItem.title || 'Unknown Class';
    
    const days = formatDaysOfWeek(classItem.days_of_week);
    const startTime = classItem.start_time || '';
    const endTime = classItem.end_time || '';
    
    return `${classTitle} - ${days} ${startTime} to ${endTime}`;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        <p className="mt-4 text-muted-foreground">Loading enrollments...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-foreground">Manage Enrollments</h1>
        <Button onClick={openCreateDialog} className="bg-primary hover:bg-primary/90">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          Add New Enrollment
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
            placeholder="Search by student name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-10"
          />
        </div>

        {/* Filters Container */}
        <div className="flex flex-wrap lg:flex-nowrap items-center gap-2">
          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={(value) => { setStatusFilter(value); setCurrentPage(1); }}>
            <SelectTrigger className={`w-full lg:w-[160px] !h-10 ${statusFilter !== 'all' ? 'border-primary bg-primary/5' : ''}`}>
              <div className="flex items-center gap-1.5">
                <BadgeCheck className="h-4 w-4 text-muted-foreground" />
                <SelectValue placeholder="Status" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
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
              <TableHead>Status</TableHead>
              <TableHead>Enrolled At</TableHead>
              <TableHead>Amount Paid</TableHead>
              <TableHead>Payment Ref</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {enrollments.length > 0 ? (
              enrollments.map((enrollment, index) => (
                <TableRow key={enrollment.id} className="hover:bg-muted/50">
                  <TableCell className="font-medium">{index + 1}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <div className="bg-primary/10 p-2 rounded-full mr-3">
                        <User className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{enrollment.student_data?.full_name || 'Unknown Student'}</p>
                        <p className="text-xs text-muted-foreground">{enrollment.student_data?.email || 'No email'}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <div className="bg-primary/10 p-2 rounded-full mr-3">
                        <Clock4 className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">
                          {enrollment.class_data?.title || 'Unknown Class'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDaysOfWeek(enrollment.class_data?.days_of_week)}
                          {enrollment.class_data?.start_time ? ` ${enrollment.class_data.start_time}` : ''}
                          {enrollment.class_data?.end_time ? ` - ${enrollment.class_data.end_time}` : ''}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(enrollment.status)}
                  </TableCell>
                  <TableCell>
                    {enrollment.enrolled_at ? (
                      new Date(enrollment.enrolled_at).toLocaleDateString()
                    ) : (
                      <span className="text-muted-foreground">Not yet enrolled</span>
                    )}
                  </TableCell>
                  <TableCell>{formatCurrency(enrollment.price)}</TableCell>
                  <TableCell>
                    {enrollment.payment_ref ? (
                      <span className="text-xs bg-muted/50 px-2 py-1 rounded">
                        {enrollment.payment_ref.length > 15 
                          ? `${enrollment.payment_ref.substring(0, 15)}...` 
                          : enrollment.payment_ref
                        }
                      </span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
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
                            setCurrentEnrollment(enrollment);
                            setOpenViewDialog(true);
                          }}
                          className="cursor-pointer flex items-center gap-2"
                        >
                          <Eye className="h-4 w-4 text-primary" />
                          <span>View Details</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => openEditDialog(enrollment)}
                          className="cursor-pointer flex items-center gap-2"
                        >
                          <Edit className="h-4 w-4 text-yellow-500" />
                          <span>Edit Enrollment</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => openDeleteConfirmation(enrollment)}
                          className="cursor-pointer flex items-center gap-2 text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span>Delete Enrollment</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12">
                  <div className="flex flex-col items-center">
                    <div className="bg-muted/50 p-4 rounded-full mb-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-foreground mb-1">No enrollments found</h3>
                    <p className="text-muted-foreground mb-4">Get started by adding your first enrollment</p>
                    <Button 
                      className="bg-primary hover:bg-primary/90"
                      onClick={openCreateDialog}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                      </svg>
                      Add Enrollment
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
            label="Enrollments"
            pageSizeOptions={[5, 10, 20, 50]}
          />
        )}
      </div>

      {/* View Enrollment Details Dialog */}
      <Dialog open={openViewDialog} onOpenChange={setOpenViewDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-foreground flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Enrollment Details
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Complete enrollment information
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="max-h-[65vh] overflow-y-auto pr-4">
            {currentEnrollment && (
              <div className="space-y-6 py-4">
                <div className="grid grid-cols-1  gap-6">
                  {/* Student Information */}
                  <div className="bg-primary/5 p-4 rounded-lg border border-primary/10">
                    <h3 className="font-semibold text-primary mb-3 flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Student Information
                    </h3>
                    <div className="flex items-center mb-3">
                      <div className="bg-primary/20 p-2 rounded-full mr-3">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{currentEnrollment.student_data?.full_name || 'Unknown Student'}</p>
                        <p className="text-sm text-muted-foreground">{currentEnrollment.student_data?.email || 'No email'}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex justify-between py-1 border-b border-primary/10">
                        <span className="text-primary">Role:</span>
                        <span className="text-foreground font-medium capitalize">{currentEnrollment.student_data?.role || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-primary/10">
                        <span className="text-primary">Status:</span>
                        <span className="text-foreground font-medium">{currentEnrollment.student_data?.is_active ? 'Active' : 'Inactive'}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-primary/10">
                        <span className="text-primary">Joined:</span>
                        <span className="text-foreground">
                          {currentEnrollment.student_data?.created_at ? 
                            new Date(currentEnrollment.student_data.created_at).toLocaleDateString() : 'N/A'
                          }
                        </span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-primary">Student ID:</span>
                        <span className="text-foreground font-mono">{currentEnrollment.student_data?.id || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Class Information */}
                  <div className="bg-primary/5 p-4 rounded-lg border border-primary/10">
                    <h3 className="font-semibold text-primary mb-3 flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      Class Information
                    </h3>
                    <div className="flex items-center mb-3">
                      <div className="bg-primary/20 p-2 rounded-full mr-3">
                        <BookOpen className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-primary">
                          {currentEnrollment.class_data?.title || 'Unknown Class'}
                        </p>
                        <p className="text-sm text-primary">
                          {formatDaysOfWeek(currentEnrollment.class_data?.days_of_week)}
                          {currentEnrollment.class_data?.start_time ? ` ${currentEnrollment.class_data.start_time}` : ''}
                          {currentEnrollment.class_data?.end_time ? ` - ${currentEnrollment.class_data.end_time}` : ''}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex justify-between py-1 border-b border-primary/10">
                        <span className="text-primary">Days:</span>
                        <span className="text-primary font-medium">
                          {formatDaysOfWeek(currentEnrollment.class_data?.days_of_week)}
                        </span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-primary/10">
                        <span className="text-primary">Time:</span>
                        <span className="text-primary font-medium">
                          {currentEnrollment.class_data?.start_time || 'N/A'} - {currentEnrollment.class_data?.end_time || 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-primary/10">
                        <span className="text-primary">Class Price:</span>
                        <span className="text-primary font-medium">
                          {formatCurrency(currentEnrollment.class_data?.price)}
                        </span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-primary">Class ID:</span>
                        <span className="text-primary font-mono">{currentEnrollment.class_data?.id || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Enrollment Status */}
                  <div className="bg-muted/50 p-4 rounded-lg border border-gray-100">
                    <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                      <BadgeCheck className="h-4 w-4" />
                      Enrollment Status
                    </h3>
                    <div className="flex justify-center">
                      {getStatusBadge(currentEnrollment.status)}
                    </div>
                  </div>
                  
                  {/* Amount Paid & Payment */}
                  <div className="bg-accent/5 p-4 rounded-lg border border-accent/10">
                    <h3 className="font-semibold text-accent mb-3 flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Amount Paid
                    </h3>
                    <p className="text-2xl font-bold text-accent text-center">
                      {formatCurrency(currentEnrollment.price)}
                    </p>
                    {currentEnrollment.payment_ref && (
                      <p className="text-xs text-accent text-center mt-2">
                        Ref: {currentEnrollment.payment_ref}
                      </p>
                    )}
                  </div>
                  
                  {/* Enrollment Date */}
                  <div className="bg-secondary/5 p-4 rounded-lg border border-secondary/10">
                    <h3 className="font-semibold text-secondary mb-3 flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Enrollment Date
                    </h3>
                    <p className="text-sm text-foreground text-center">
                      {currentEnrollment.enrolled_at ? (
                        new Date(currentEnrollment.enrolled_at).toLocaleDateString('en-BD', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })
                      ) : (
                        <span className="text-secondary">Not yet enrolled</span>
                      )}
                    </p>
                  </div>
                </div>
                
                {/* Timestamps */}
                <div className="bg-muted/50 p-4 rounded-lg border border-gray-100">
                  <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Timestamps
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="flex justify-between py-2 border-b border-gray-200">
                      <span className="text-muted-foreground">Created At:</span>
                      <span className="text-foreground">
                        {new Date(currentEnrollment.created_at).toLocaleDateString('en-BD', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-200">
                      <span className="text-muted-foreground">Last Updated:</span>
                      <span className="text-foreground">
                        {new Date(currentEnrollment.updated_at).toLocaleDateString('en-BD', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </ScrollArea>
          
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
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
              {currentEnrollment ? (
                <>
                  <Edit className="h-5 w-5 text-yellow-500" />
                  Edit Enrollment
                </>
              ) : (
                <>
                  <User className="h-5 w-5 text-primary" />
                  Create New Enrollment
                </>
              )}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {currentEnrollment
                ? 'Update the enrollment details'
                : 'Enroll a student in a class'}
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="max-h-[65vh] overflow-y-auto">
            <form onSubmit={handleSubmit} className="mt-2 pr-4">
              <div className="grid gap-4 py-2">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="student" className="text-right font-medium">
                    Student*
                  </Label>
                  <div className="col-span-3">
                    <Select
                      value={formData.student}
                      onValueChange={(value) => handleSelectChange('student', value)}
                    >
                      <SelectTrigger className={`w-full ${errors.student ? 'border-red-500' : ''}`}>
                        <SelectValue placeholder="Select a student" />
                      </SelectTrigger>
                      <SelectContent>
                        {students.map((student) => (
                          <SelectItem key={student.id} value={student.id.toString()}>
                            {student.full_name} ({student.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.student && (
                      <p className="mt-1 text-sm text-red-500">{errors.student}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="class_enrolled" className="text-right font-medium">
                    Class*
                  </Label>
                  <div className="col-span-3">
                    <Select
                      value={formData.class_enrolled}
                      onValueChange={(value) => handleSelectChange('class_enrolled', value)}
                    >
                      <SelectTrigger className={`w-full ${errors.class_enrolled ? 'border-red-500' : ''}`}>
                        <SelectValue placeholder="Select a class" />
                      </SelectTrigger>
                      <SelectContent className="max-h-60 overflow-y-auto">
                        {classes.map((classItem) => (
                          <SelectItem key={classItem.id} value={classItem.id.toString()}>
                            {getClassDisplayText(classItem)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.class_enrolled && (
                      <p className="mt-1 text-sm text-red-500">{errors.class_enrolled}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="status" className="text-right font-medium">
                    Status*
                  </Label>
                  <div className="col-span-3">
                    <Select
                      value={formData.status}
                      onValueChange={(value) => handleSelectChange('status', value)}
                    >
                      <SelectTrigger className={`w-full ${errors.status ? 'border-red-500' : ''}`}>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        {ENROLLMENT_STATUSES.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.status && (
                      <p className="mt-1 text-sm text-red-500">{errors.status}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="price" className="text-right font-medium">
                    Amount Paid ($)
                  </Label>
                  <div className="col-span-3">
                    <Input
                      id="price"
                      name="price"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.price}
                      onChange={handleChange}
                      placeholder="Enter amount paid"
                      className={`focus:ring-primary focus:border-primary ${
                        errors.price ? 'border-red-500' : ''
                      }`}
                    />
                    {!errors.price && formData.class_enrolled && (() => {
                      const selectedClass = classes.find(c => c.id.toString() === formData.class_enrolled);
                      const classPrice = selectedClass?.price ? parseFloat(selectedClass.price) : 0;
                      
                      if (classPrice === 0 || !classPrice) {
                        return (
                          <p className="mt-1 text-sm text-muted-foreground">
                            This class is free. Enter 0 or leave empty.
                          </p>
                        );
                      } else {
                        return (
                          <p className="mt-1 text-sm text-muted-foreground">
                            Class price: ${classPrice.toFixed(2)}. Cannot exceed this amount.
                          </p>
                        );
                      }
                    })()}
                    {errors.price && (
                      <p className="mt-1 text-sm text-red-500">{errors.price}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="payment_ref" className="text-right font-medium">
                    Payment Reference
                  </Label>
                  <div className="col-span-3">
                    <Input
                      id="payment_ref"
                      name="payment_ref"
                      value={formData.payment_ref}
                      onChange={handleChange}
                      placeholder="Payment reference ID"
                      className="focus:ring-primary focus:border-primary"
                    />
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
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                      {currentEnrollment ? 'Updating...' : 'Creating...'}
                    </span>
                  ) : currentEnrollment ? (
                    'Update Enrollment'
                  ) : (
                    'Create Enrollment'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-500" />
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
                    Are you sure you want to permanently delete the enrollment of{" "}
                    <span className="font-semibold text-red-500">
                      {currentEnrollment?.student_data?.full_name || 'Unknown Student'}
                    </span> in{" "}
                    <span className="font-semibold text-red-500">
                      {currentEnrollment?.class_data?.title || 'Unknown Class'}
                    </span>?
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
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-1"></div>
                  Deleting...
                </span>
              ) : (
                'Delete Enrollment'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}