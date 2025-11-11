'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { useDebounce } from '@/hooks/use-debounce';
import CoursePlaceholder from '@/components/CoursePlaceholder';
import Pagination from '@/components/Pagination';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { TimezoneSelector } from '@/components/admin/TimezoneSelector';
import { TimezoneComparison } from '@/components/admin/TimezoneComparison';
import { getUserTimezone, getDayName, convertClassTime } from '@/lib/timezone-utils';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  MoreVertical, 
  Eye, 
  Edit, 
  Trash2,
  BookOpen,
  User,
  Users,
  Star,
  Calendar,
  RefreshCw,
  ArrowLeft,
  Filter,
  X,
  DollarSign,
  Clock
} from 'lucide-react';
import { toast } from 'sonner';

export default function ClassesPage() {
  const router = useRouter();
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [currentClass, setCurrentClass] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    teachers: [],
    subjects: [],
    capacity: 5,
    price: '',
    is_special_class: false,
    cover_image: null,
    start_time: '09:00',
    end_time: '10:00',
    days_of_week: [],
    timezone: getUserTimezone(), // Use admin's timezone by default
    is_active: false,
  });
  const [coverImagePreview, setCoverImagePreview] = useState(null);
  const [errors, setErrors] = useState({});
  const [deleting, setDeleting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Timezone viewing state (for preview only, NOT saved)
  const [viewingTimezone, setViewingTimezone] = useState(getUserTimezone());
  const [previewTimezone, setPreviewTimezone] = useState(getUserTimezone());
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  
  // Filter state
  const [teacherFilter, setTeacherFilter] = useState('all');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [specialClassFilter, setSpecialClassFilter] = useState('all');
  
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
      
      // Build query parameters for classes
      const classParams = {
        page: currentPage,
        page_size: pageSize,
      };
      if (debouncedSearchQuery) {
        classParams.title__icontains = debouncedSearchQuery;
      }
      
      // Add filters
      if (teacherFilter !== 'all') {
        classParams.teacher = teacherFilter;
      }
      if (subjectFilter !== 'all') {
        classParams.subject = subjectFilter;
      }
      if (specialClassFilter !== 'all') {
        classParams.is_special_class = specialClassFilter === 'special';
      }
      
      console.log('Class API params:', classParams);
      
      const [classesRes, subjectsRes, teachersRes] = await Promise.all([
        api.get('course/', { params: classParams }),
        api.get('subject/'),
        api.get('auth/user/?role=teacher')
      ]);
      
      console.log('Fetched classes response:', classesRes.data);
      
      // Handle paginated response
      if (classesRes.data.results) {
        setClasses(classesRes.data.results);
        setTotalCount(classesRes.data.count);
        setTotalPages(classesRes.data.total_pages);
      } else {
        // Fallback for non-paginated response
        setClasses(classesRes.data);
        setTotalCount(classesRes.data.length);
        setTotalPages(1);
      }
      
      setSubjects(subjectsRes.data);
      setTeachers(teachersRes.data);
    } catch (error) {
      handleApiError(error, 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [debouncedSearchQuery, currentPage, pageSize, teacherFilter, subjectFilter, specialClassFilter]);

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

  // Handle file changes
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    console.log('File selected:', file);
    if (file) {
      setFormData({
        ...formData,
        cover_image: file
      });
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
      if (errors.cover_image) setErrors({ ...errors, cover_image: '' });
    }
  };

  // Handle checkbox changes
  const handleCheckboxChange = (name, id) => {
    const currentValues = [...formData[name]];
    const newValues = currentValues.includes(id)
      ? currentValues.filter(item => item !== id)
      : [...currentValues, id];
    
    setFormData({
      ...formData,
      [name]: newValues
    });
  };

  // Open create dialog
  const openCreateDialog = () => {
    setCurrentClass(null);
    setFormData({
      title: '',
      description: '',
      teachers: [],
      subjects: [],
      capacity: 5,
      price: '',
      is_special_class: false,
      cover_image: null,
      start_time: '09:00',
      end_time: '10:00',
      days_of_week: [],
      timezone: getUserTimezone(), // Use admin's timezone by default
      is_active: false,
    });
    setCoverImagePreview(null);
    setErrors({});
    setPreviewTimezone(getUserTimezone()); // Reset preview timezone
    setOpenDialog(true);
  };

  // Open edit dialog
  const openEditDialog = (classItem) => {
    console.log('Opening edit dialog for class:', classItem);
    console.log('Class cover_image:', classItem.cover_image);
    setCurrentClass(classItem);
    setFormData({
      title: classItem.title,
      description: classItem.description,
      teachers: classItem.teachers.map(t => t.id),
      subjects: classItem.subjects.map(s => s.id),
      capacity: classItem.capacity,
      price: classItem.price,
      is_special_class: classItem.is_special_class,
      cover_image: null,
      start_time: classItem.start_time || '09:00',
      end_time: classItem.end_time || '10:00',
      days_of_week: classItem.days_of_week || [],
      timezone: classItem.timezone || 'UTC',
      is_active: classItem.is_active || false,
    });
    // Set existing cover image preview if available
    setCoverImagePreview(
      classItem.cover_image 
        ? (classItem.cover_image.startsWith('http') 
            ? classItem.cover_image 
            : `http://127.0.0.1:8000/media/${classItem.cover_image}`)
        : null
    );
    setErrors({});
    setPreviewTimezone(getUserTimezone()); // Reset preview timezone
    setOpenDialog(true);
  };

  // Open delete confirmation
  const openDeleteConfirmation = (classItem) => {
    setCurrentClass(classItem);
    setOpenDeleteDialog(true);
  };

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    
    console.log('Form data being submitted:', formData);
    console.log('Cover image file:', formData.cover_image);
    
    // Client-side validation
    const validationErrors = {};
    if (!formData.title.trim()) validationErrors.title = 'Title is required';
    if (formData.capacity < 1) validationErrors.capacity = 'Capacity must be at least 1';
    if (formData.price && formData.price < 0) validationErrors.price = 'Price cannot be negative';
    if (formData.teachers.length === 0) validationErrors.teachers = 'At least one teacher is required';
    if (!formData.start_time) validationErrors.start_time = 'Start time is required';
    if (!formData.end_time) validationErrors.end_time = 'End time is required';
    if (formData.start_time && formData.end_time && formData.start_time >= formData.end_time) {
      validationErrors.end_time = 'End time must be after start time';
    }
    if (formData.days_of_week.length === 0) validationErrors.days_of_week = 'At least one day is required';
    
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      toast.warning('Please fix the form errors');
      return;
    }

    setSubmitting(true);
    
    try {
      const token = getAccessToken();
      
      // Prepare FormData for file upload
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('capacity', formData.capacity);
      // Only append price if it has a value
      if (formData.price) {
        formDataToSend.append('price', parseFloat(formData.price));
      }
      formDataToSend.append('is_special_class', formData.is_special_class);
      formDataToSend.append('start_time', formData.start_time);
      formDataToSend.append('end_time', formData.end_time);
      formDataToSend.append('days_of_week', JSON.stringify(formData.days_of_week));
      formDataToSend.append('timezone', formData.timezone);
      formDataToSend.append('is_active', formData.is_active);
      
      // Append arrays correctly for Django
      formData.teachers.forEach(teacherId => {
        formDataToSend.append('teacher', teacherId);
      });
      formData.subjects.forEach(subjectId => {
        formDataToSend.append('subject', subjectId);
      });
      
      // Append cover image if present
      if (formData.cover_image) {
        formDataToSend.append('cover_image', formData.cover_image);
      }
      
      // Use axios directly for FormData upload
      const config = {
        baseURL: 'http://127.0.0.1:8000/api/',
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: token ? `Bearer ${token}` : '',
        },
      };
      
      if (currentClass) {
        await axios.put(`course/${currentClass.id}/`, formDataToSend, config);
        toast.success('Class updated successfully');
      } else {
        await axios.post('course/', formDataToSend, config);
        toast.success('Class created successfully');
      }
      
      setOpenDialog(false);
      // Reset to first page after creating/updating
      setCurrentPage(1);
      fetchData();
    } catch (error) {
      handleApiError(error, currentClass ? 'Failed to update class' : 'Failed to create class');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete class
  const handleDelete = async () => {
    setDeleting(true);
    try {
      const api = getApiInstance();
      await api.delete(`course/${currentClass.id}/`);
      toast.success('Class deleted successfully');
      setOpenDeleteDialog(false);
      
      // Check if we need to go to previous page after deletion
      if (classes.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
      
      fetchData();
    } catch (error) {
      handleApiError(error, 'Failed to delete class');
    } finally {
      setDeleting(false);
    }
  };

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
    setTeacherFilter('all');
    setSubjectFilter('all');
    setSpecialClassFilter('all');
    setCurrentPage(1);
  };

  // Check if any filter is active
  const hasActiveFilters = teacherFilter !== 'all' || subjectFilter !== 'all' || specialClassFilter !== 'all';

  // Get active filters for display
  const getActiveFilters = () => {
    const filters = [];
    if (teacherFilter !== 'all') {
      const teacher = teachers.find(t => t.id.toString() === teacherFilter);
      if (teacher) {
        filters.push({
          type: 'teacher',
          label: teacher.full_name,
          icon: User,
          remove: () => setTeacherFilter('all')
        });
      }
    }
    if (subjectFilter !== 'all') {
      const subject = subjects.find(s => s.id.toString() === subjectFilter);
      if (subject) {
        filters.push({
          type: 'subject',
          label: subject.name,
          icon: BookOpen,
          remove: () => setSubjectFilter('all')
        });
      }
    }
    if (specialClassFilter !== 'all') {
      filters.push({
        type: 'classType',
        label: specialClassFilter === 'special' ? 'Special Classes' : 'Regular Classes',
        icon: Star,
        remove: () => setSpecialClassFilter('all')
      });
    }
    return filters;
  };

  const activeFilters = getActiveFilters();

  // Format currency
  const formatCurrency = (value) => {
    return value ? `$${parseFloat(value).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}` : 'Free';
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        <p className="mt-4 text-muted-foreground">Loading classes...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-foreground">Manage Classes</h1>
        <Button onClick={openCreateDialog} className="bg-primary hover:bg-primary/90">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          Add New Class
        </Button>
      </div>

      {/* Search and Filters Section */}
      <div className="mb-6 flex flex-col lg:flex-row gap-3">
        {/* Search Bar */}
        <div className="relative flex-1">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <Input
            placeholder="Search classes by title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-10"
          />
        </div>

        {/* Filters Container */}
        <div className="flex flex-wrap lg:flex-nowrap items-center gap-2">
          {/* Teacher Filter */}
          <Select value={teacherFilter} onValueChange={(value) => { setTeacherFilter(value); setCurrentPage(1); }}>
            <SelectTrigger className={`w-full lg:w-[160px] !h-10 ${teacherFilter !== 'all' ? 'border-primary bg-primary/5' : ''}`}>
              <div className="flex items-center gap-1.5">
                <User className="h-4 w-4 text-muted-foreground" />
                <SelectValue placeholder="Teacher" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Teachers</SelectItem>
              {teachers.map((teacher) => (
                <SelectItem key={teacher.id} value={teacher.id.toString()}>
                  {teacher.full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Subject Filter */}
          <Select value={subjectFilter} onValueChange={(value) => { setSubjectFilter(value); setCurrentPage(1); }}>
            <SelectTrigger className={`w-full lg:w-[160px] !h-10 ${subjectFilter !== 'all' ? 'border-primary bg-primary/5' : ''}`}>
              <div className="flex items-center gap-1.5">
                <BookOpen className="h-4 w-4 text-muted-foreground" />
                <SelectValue placeholder="Subject" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Subjects</SelectItem>
              {subjects.map((subject) => (
                <SelectItem key={subject.id} value={subject.id.toString()}>
                  {subject.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Class Type Filter */}
          <Select value={specialClassFilter} onValueChange={(value) => { setSpecialClassFilter(value); setCurrentPage(1); }}>
            <SelectTrigger className={`w-full lg:w-[140px] !h-10 ${specialClassFilter !== 'all' ? 'border-primary bg-primary/5' : ''}`}>
              <div className="flex items-center gap-1.5">
                <Star className="h-4 w-4 text-muted-foreground" />
                <SelectValue placeholder="Type" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="regular">Regular</SelectItem>
              <SelectItem value="special">Special</SelectItem>
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

      <div className="border border-border rounded-lg overflow-hidden shadow-sm bg-card">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="w-[60px]">#</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Teachers</TableHead>
              <TableHead>Subjects</TableHead>
              <TableHead>Capacity</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Special</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {classes.length > 0 ? (
              classes.map((classItem, index) => (
                <TableRow key={classItem.id}>
                  <TableCell className="font-medium">{index + 1}</TableCell>
                  <TableCell className="font-medium">{classItem.title}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1 max-w-xs">
                      {classItem.teachers.map(teacher => (
                        <div key={teacher.id} className="flex items-center bg-primary/10 text-primary text-xs px-2 py-1 rounded">
                          <div className="bg-primary/30 border-2 rounded-full w-4 h-4 mr-1" />
                          <span>{teacher.full_name}</span>
                        </div>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1 max-w-xs">
                      {classItem.subjects.map(subject => (
                        <div key={subject.id} className="flex items-center bg-secondary/10 text-secondary text-xs px-2 py-1 rounded">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <span>{subject.name}</span>
                        </div>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <span className="mr-2">{classItem.enrolled_count || 0}/{classItem.capacity}</span>
                      <div className="w-20 bg-muted rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full" 
                          style={{ 
                            width: `${Math.min(100, (classItem.enrolled_count || 0) / classItem.capacity * 100)}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{formatCurrency(classItem.price)}</TableCell>
                  <TableCell>
                    {classItem.is_special_class ? (
                      <span className="px-2 py-1 bg-secondary/10 text-secondary rounded text-xs">Special</span>
                    ) : (
                      <span className="px-2 py-1 bg-muted/50 text-foreground rounded text-xs">Regular</span>
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
                          setCurrentClass(classItem);
                          setViewingTimezone(getUserTimezone()); // Reset viewing timezone
                          setOpenViewDialog(true);
                        }}
                          className="cursor-pointer flex items-center gap-2"
                        >
                          <Eye className="h-4 w-4 text-primary" />
                          <span>View Details</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => openEditDialog(classItem)}
                          className="cursor-pointer flex items-center gap-2"
                        >
                          <Edit className="h-4 w-4 text-yellow-500" />
                          <span>Edit Class</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => openDeleteConfirmation(classItem)}
                          className="cursor-pointer flex items-center gap-2 text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span>Delete Class</span>
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
                    <h3 className="text-lg font-medium text-foreground mb-1">No classes found</h3>
                    <p className="text-muted-foreground mb-4">Get started by adding your first class</p>
                    <Button 
                      className="bg-primary hover:bg-primary/90"
                      onClick={openCreateDialog}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                      </svg>
                      Add Class
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
            label="Classes"
            pageSizeOptions={[5, 10, 20, 50]}
          />
        )}
      </div>

      {/* View Class Details Dialog */}
      <Dialog open={openViewDialog} onOpenChange={setOpenViewDialog}>
        <DialogContent className="max-w-3xl max-h-[95vh] flex flex-col overflow-hidden">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="text-xl font-bold text-foreground flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              {currentClass?.title}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Complete class details
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="flex-1 overflow-y-auto px-1">
            {currentClass && (
              <div className="space-y-6 py-4 pr-3">
                <div className="border-b border-border pb-4">
                  <h3 className="font-medium text-foreground flex items-center gap-2 mb-3">
                    <BookOpen className="h-4 w-4" />
                    Cover Image
                  </h3>
                  <div className="relative w-full max-w-md h-48 rounded-lg border border-border overflow-hidden bg-muted/20">
                    {currentClass.cover_image ? (
                      <img 
                        src={
                          currentClass.cover_image.startsWith('http') 
                            ? currentClass.cover_image 
                            : `http://127.0.0.1:8000/media/${currentClass.cover_image}`
                        }
                        alt={currentClass.title}
                        className="w-full h-full object-cover absolute inset-0"
                        onError={(e) => {
                          console.error('Image failed to load:', e.target.src);
                          e.target.style.display = 'none';
                        }}
                      />
                    ) : (
                      <CoursePlaceholder 
                        title={currentClass.title}
                        category={currentClass.category}
                        size="medium"
                      />
                    )}
                    {!currentClass.cover_image && (
                      <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">
                        No cover image uploaded
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="border-b border-border pb-4">
                  <h3 className="font-medium text-foreground flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    Description
                  </h3>
                  <p className="mt-2 text-muted-foreground">
                    {currentClass.description || 'No description available'}
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-medium text-foreground flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Teachers
                    </h3>
                    <div className="mt-2 space-y-2">
                      {currentClass.teachers.map(teacher => (
                        <div key={teacher.id} className="flex items-center p-2 bg-primary/5 text-primary rounded-md">
                          <div className="bg-primary/30 border-2 rounded-full w-4 h-4 mr-1" />
                          <div className="ml-3">
                            <p className="text-sm font-medium text-foreground">{teacher.full_name}</p>
                            <div className="flex flex-wrap gap-1 mt-1">
                              <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                                {teacher.email}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-foreground flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      Subjects
                    </h3>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      {currentClass.subjects.map(subject => (
                        <div key={subject.id} className="border border-border rounded-lg p-3 bg-secondary/10">
                          <h4 className="font-medium text-secondary">{subject.name}</h4>
                          {/* <p className="text-xs text-muted-foreground mt-1">
                            {subject.description || 'No description available'}
                          </p> */}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <h3 className="font-medium text-foreground flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Capacity
                    </h3>
                    <p className="mt-2 text-muted-foreground">
                      <span className="font-semibold">{currentClass.enrolled_count || 0}</span> / 
                      {currentClass.capacity} students
                    </p>
                    <div className="mt-2 w-full bg-muted rounded-full h-2.5">
                      <div 
                        className="bg-primary h-2.5 rounded-full" 
                        style={{ 
                          width: `${Math.min(100, (currentClass.enrolled_count || 0) / currentClass.capacity * 100)}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-foreground flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Price
                    </h3>
                    <p className="mt-2 text-2xl font-bold text-foreground">
                      {formatCurrency(currentClass.price)}
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-foreground flex items-center gap-2">
                      <Star className="h-4 w-4" />
                      Class Type
                    </h3>
                    <p className="mt-2">
                      {currentClass.is_special_class ? (
                        <span className="px-3 py-1 bg-secondary/10 text-secondary rounded-full text-sm">
                          Special Class
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                          Regular Class
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                
                {/* Class Schedule Section */}
                <div className="border-b border-border pb-4">
                  <h3 className="font-medium text-foreground flex items-center gap-2 mb-3">
                    <Clock className="h-4 w-4" />
                    Class Schedule
                  </h3>
                  
                  <div className="space-y-4">
                    {(() => {
                      const adminTz = getUserTimezone();
                      const storedTz = currentClass.timezone || adminTz;
                      
                      return (
                        <>
                          {/* Time Display with Viewing Timezone Selector */}
                          <div className="space-y-3">
                            {/* Viewing Timezone Selector */}
                            <div className="flex items-center gap-3">
                              <Label className="text-sm font-medium shrink-0">
                                View times in:
                              </Label>
                              <div className="flex-1">
                                <TimezoneSelector
                                  value={viewingTimezone}
                                  onValueChange={setViewingTimezone}
                                  placeholder="Select timezone..."
                                  className="max-w-md"
                                />
                              </div>
                            </div>
                            
                            {/* Display Times in Selected Timezone */}
                            {currentClass.days_of_week && currentClass.days_of_week.length > 0 && (
                              <div className="bg-primary/5 p-4 rounded-lg border-2 border-primary/20 space-y-3">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-medium">Class Time:</span>
                                  <span className="font-semibold text-lg">
                                    {(() => {
                                      const converted = convertClassTime(
                                        currentClass.start_time,
                                        storedTz,
                                        currentClass.days_of_week[0],
                                        { targetTimezone: viewingTimezone }
                                      );
                                      const convertedEnd = convertClassTime(
                                        currentClass.end_time,
                                        storedTz,
                                        currentClass.days_of_week[0],
                                        { targetTimezone: viewingTimezone }
                                      );
                                      return `${converted.localTime} - ${convertedEnd.localTime}`;
                                    })()}
                                  </span>
                                </div>
                                
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-medium">Days:</span>
                                  <span className="font-medium">
                                    {currentClass.days_of_week.map(d => {
                                      const conv = convertClassTime(
                                        currentClass.start_time,
                                        storedTz,
                                        d,
                                        { targetTimezone: viewingTimezone }
                                      );
                                      return conv.localDayName;
                                    }).filter((v, i, a) => a.indexOf(v) === i).join(', ')}
                                  </span>
                                </div>
                                
                                {/* Show warning if day changed */}
                                {(() => {
                                  const hasChangedDay = currentClass.days_of_week.some(d => {
                                    const conv = convertClassTime(currentClass.start_time, storedTz, d, { targetTimezone: viewingTimezone });
                                    return conv.isDifferentDay;
                                  });
                                  
                                  if (hasChangedDay) {
                                    return (
                                      <div className="bg-amber-50 dark:bg-amber-900/20 p-2 rounded border border-amber-200 dark:border-amber-800">
                                        <p className="text-xs text-amber-700 dark:text-amber-300">
                                          ⚠️ Day changes in this timezone due to time difference
                                        </p>
                                      </div>
                                    );
                                  }
                                  return null;
                                })()}
                                
                                {/* Show stored timezone if different from viewing */}
                                {viewingTimezone !== storedTz && (
                                  <div className="mt-2 pt-2 border-t border-border/30">
                                    <p className="text-xs text-muted-foreground">
                                      Originally stored as: {currentClass.start_time} - {currentClass.end_time} ({storedTz})
                                    </p>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium text-foreground flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Additional Information
                  </h3>
                  <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
                    <div className="flex justify-between py-2 border-b border-border">
                      <span className="text-muted-foreground">Created At:</span>
                      <span className="text-foreground">
                        {new Date(currentClass.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-border">
                      <span className="text-muted-foreground">Last Updated:</span>
                      <span className="text-foreground">
                        {new Date(currentClass.updated_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </ScrollArea>
          
          <DialogFooter className="flex-shrink-0 pt-4 border-t">
            <Button 
              onClick={() => setOpenViewDialog(false)}
              className="bg-primary hover:bg-primary/90"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create/Edit Dialog */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="max-w-3xl max-h-[95vh] flex flex-col overflow-hidden">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
              {currentClass ? (
                <>
                  <Edit className="h-5 w-5 text-yellow-500" />
                  Edit Class
                </>
              ) : (
                <>
                  <BookOpen className="h-5 w-5 text-primary" />
                  Create New Class
                </>
              )}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {currentClass
                ? 'Update the details of this class'
                : 'Add a new class to your curriculum'}
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="flex-1 overflow-y-auto px-1">
            <form onSubmit={handleSubmit} className="mt-2 pr-3" id="class-form">
              <div className="grid gap-4 py-2">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="title" className="text-right font-medium">
                    Title*
                  </Label>
                  <div className="col-span-3">
                    <Input
                      id="title"
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      placeholder="e.g., Quran Memorization"
                      className={`focus:ring-primary focus:border-primary ${
                        errors.title ? 'border-red-500' : ''
                      }`}
                    />
                    {errors.title && (
                      <p className="mt-1 text-sm text-red-500">{errors.title}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="description" className="text-right font-medium">
                    Description
                  </Label>
                  <div className="col-span-3">
                    <Input
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      placeholder="Brief description of the class"
                      className="focus:ring-primary focus:border-primary"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-4 items-start gap-4">
                  <Label htmlFor="cover_image" className="text-right font-medium pt-2">
                    Cover Image
                  </Label>
                  <div className="col-span-3 space-y-3">
                    <Input
                      id="cover_image"
                      name="cover_image"
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="focus:ring-primary focus:border-primary"
                    />
                    {coverImagePreview && (
                      <div className="mt-3">
                        <img 
                          src={coverImagePreview} 
                          alt="Cover preview" 
                          className="max-w-xs h-32 object-cover rounded-lg border border-border"
                        />
                      </div>
                    )}
                    {errors.cover_image && (
                      <p className="mt-1 text-sm text-red-500">{errors.cover_image}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right font-medium">
                    Teachers*
                  </Label>
                  <div className="col-span-3">
                    <div className="border border-border rounded-lg p-4 bg-muted/50">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {teachers.map((teacher) => (
                          <div key={teacher.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`teacher-${teacher.id}`}
                              checked={formData.teachers.includes(teacher.id)}
                              onCheckedChange={() => handleCheckboxChange('teachers', teacher.id)}
                            />
                            <label 
                              htmlFor={`teacher-${teacher.id}`} 
                              className="text-sm font-medium leading-none"
                            >
                              {teacher.full_name}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                    {errors.teachers && (
                      <p className="mt-1 text-sm text-red-500">{errors.teachers}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right font-medium">
                    Subjects
                  </Label>
                  <div className="col-span-3">
                    <div className="border border-border rounded-lg p-4 bg-muted/50">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {subjects.map((subject) => (
                          <div key={subject.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`subject-${subject.id}`}
                              checked={formData.subjects.includes(subject.id)}
                              onCheckedChange={() => handleCheckboxChange('subjects', subject.id)}
                            />
                            <label 
                              htmlFor={`subject-${subject.id}`} 
                              className="text-sm font-medium leading-none"
                            >
                              {subject.name}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="capacity" className="text-right font-medium">
                    Capacity*
                  </Label>
                  <div className="col-span-3">
                    <Input
                      id="capacity"
                      name="capacity"
                      type="number"
                      min="1"
                      value={formData.capacity}
                      onChange={handleChange}
                      className={`focus:ring-primary focus:border-primary ${
                        errors.capacity ? 'border-red-500' : ''
                      }`}
                    />
                    {errors.capacity && (
                      <p className="mt-1 text-sm text-red-500">{errors.capacity}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="price" className="text-right font-medium">
                    Price ($)
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
                      placeholder="0.00"
                      className={`focus:ring-primary focus:border-primary ${
                        errors.price ? 'border-red-500' : ''
                      }`}
                    />
                    {errors.price && (
                      <p className="mt-1 text-sm text-red-500">{errors.price}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="is_special_class" className="text-right font-medium">
                    Special Class
                  </Label>
                  <div className="col-span-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="is_special_class"
                        name="is_special_class"
                        checked={formData.is_special_class}
                        onCheckedChange={(checked) => 
                          setFormData({ ...formData, is_special_class: checked })
                        }
                      />
                      <label 
                        htmlFor="is_special_class" 
                        className="text-sm font-medium leading-none"
                      >
                        Mark as special class
                      </label>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-4 items-start gap-4">
                  <Label className="text-right font-medium pt-2">
                    Class Time*
                  </Label>
                  <div className="col-span-3 space-y-4">
                    {/* Time inputs with viewing timezone selector */}
                    <div className="flex items-center gap-3">
                      <div className="flex-1 grid grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor="start_time" className="text-xs text-muted-foreground">Start Time</Label>
                          <Input
                            id="start_time"
                            name="start_time"
                            type="time"
                            value={formData.start_time}
                            onChange={handleChange}
                            className={`focus:ring-primary focus:border-primary ${
                              errors.start_time ? 'border-red-500' : ''
                            }`}
                          />
                        </div>
                        <div>
                          <Label htmlFor="end_time" className="text-xs text-muted-foreground">End Time</Label>
                          <Input
                            id="end_time"
                            name="end_time"
                            type="time"
                            value={formData.end_time}
                            onChange={handleChange}
                            className={`focus:ring-primary focus:border-primary ${
                              errors.end_time ? 'border-red-500' : ''
                            }`}
                          />
                        </div>
                      </div>
                    </div>
                    
                    {/* Display timezone info and viewing selector */}
                    <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-blue-900 dark:text-blue-100">
                          Your Timezone (times are in):
                        </span>
                        <span className="font-mono text-xs bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100 px-2 py-1 rounded">
                          {getUserTimezone()}
                        </span>
                      </div>
                      
                      {/* View in different timezone */}
                      {formData.start_time && formData.days_of_week && formData.days_of_week.length > 0 && (
                        <div className="space-y-2">
                          <Label className="text-xs font-medium">
                            View these times as if you're in:
                          </Label>
                          <TimezoneSelector
                            value={previewTimezone}
                            onValueChange={setPreviewTimezone}
                            placeholder="Select timezone to view as..."
                            className="text-sm"
                          />
                          
                          {previewTimezone !== getUserTimezone() && (
                            <div className="bg-white dark:bg-slate-900 p-3 rounded border space-y-1">
                              {formData.days_of_week.map((day, idx) => {
                                const converted = convertClassTime(
                                  formData.start_time,
                                  getUserTimezone(),
                                  day,
                                  { targetTimezone: previewTimezone }
                                );
                                const convertedEnd = convertClassTime(
                                  formData.end_time,
                                  getUserTimezone(),
                                  day,
                                  { targetTimezone: previewTimezone }
                                );
                                
                                return (
                                  <div key={idx} className="flex items-center gap-2 text-xs">
                                    <span className={converted.isDifferentDay ? 'text-amber-600 font-medium' : 'font-medium'}>
                                      {converted.localDayName}:
                                    </span>
                                    <span className="text-primary font-semibold">
                                      {converted.localTime} - {convertedEnd.localTime}
                                    </span>
                                    {converted.isDifferentDay && (
                                      <span className="text-amber-600">⚠️</span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {errors.start_time && (
                      <p className="text-sm text-red-500">{errors.start_time}</p>
                    )}
                    {errors.end_time && (
                      <p className="text-sm text-red-500">{errors.end_time}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right font-medium">
                    Days of Week*
                  </Label>
                  <div className="col-span-3">
                    <div className="border border-border rounded-lg p-4 bg-muted/50">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {[
                          { value: 0, label: 'Monday' },
                          { value: 1, label: 'Tuesday' },
                          { value: 2, label: 'Wednesday' },
                          { value: 3, label: 'Thursday' },
                          { value: 4, label: 'Friday' },
                          { value: 5, label: 'Saturday' },
                          { value: 6, label: 'Sunday' },
                        ].map((day) => (
                          <div key={day.value} className="flex items-center space-x-2">
                            <Checkbox
                              id={`day-${day.value}`}
                              checked={formData.days_of_week.includes(day.value)}
                              onCheckedChange={() => handleCheckboxChange('days_of_week', day.value)}
                            />
                            <label 
                              htmlFor={`day-${day.value}`} 
                              className="text-sm font-medium leading-none"
                            >
                              {day.label}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                    {errors.days_of_week && (
                      <p className="mt-1 text-sm text-red-500">{errors.days_of_week}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="is_active" className="text-right font-medium">
                    Active
                  </Label>
                  <div className="col-span-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="is_active"
                        name="is_active"
                        checked={formData.is_active}
                        onCheckedChange={(checked) => 
                          setFormData({ ...formData, is_active: checked })
                        }
                      />
                      <label 
                        htmlFor="is_active" 
                        className="text-sm font-medium leading-none"
                      >
                        Mark class as active
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </form>
          </ScrollArea>
          
          <DialogFooter className="flex-shrink-0 pt-4 border-t">
            <Button 
              type="submit"
              form="class-form"
              className="bg-primary hover:bg-primary/90"
              disabled={submitting}
            >
              {submitting ? (
                <span className="flex items-center">
                  <RefreshCw className="animate-spin h-4 w-4 mr-2" />
                  {currentClass ? 'Updating...' : 'Creating...'}
                </span>
              ) : currentClass ? (
                <span className="flex items-center">
                  <Edit className="h-4 w-4 mr-1" />
                  Update Class
                </span>
              ) : (
                <span className="flex items-center">
                  <BookOpen className="h-4 w-4 mr-1" />
                  Create Class
                </span>
              )}
            </Button>
          </DialogFooter>
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
            <div className="mt-4 bg-red-500/10 p-4 rounded-lg border border-red-500/20">
              <div className="flex items-start">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <div className="font-medium text-foreground">This action cannot be undone.</div>
                  <div className="mt-2 text-foreground">
                    Are you sure you want to permanently delete the class:{" "}
                    <span className="font-semibold text-red-500">{currentClass?.title}</span>?
                  </div>
                </div>
              </div>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel disabled={deleting} className="border-border hover:bg-muted/50 flex items-center">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-red-500 hover:bg-red-600 focus:ring-red-500 flex items-center"
              disabled={deleting}
            >
              {deleting ? (
                <span className="flex items-center">
                  <RefreshCw className="animate-spin h-4 w-4 mr-1" />
                  Deleting...
                </span>
              ) : (
                <span className="flex items-center">
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete Class
                </span>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}