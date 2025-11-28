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
  BookOpen,
  Calendar,
  RefreshCw,
  ArrowLeft
} from 'lucide-react';
import { toast } from 'sonner';

export default function SubjectsPage() {
  const router = useRouter();
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [currentSubject, setCurrentSubject] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });
  const [errors, setErrors] = useState({});
  const [deleting, setDeleting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  
  // Debounce search query to avoid too many API calls
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  // Get access token from localStorage
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

  // Create Axios instance with authorization
  const getApiInstance = () => {
    const token = getAccessToken();
    
    return axios.create({
      baseURL: config.API_BASE_URL + 'subject/',
      headers: {
        'Content-Type': 'application/json',
        Authorization: token ? `Bearer ${token}` : '',
      },
    });
  };

  // Fetch subjects using Axios
  const fetchSubjects = async () => {
    try {
      setLoading(true);
      const api = getApiInstance();
      
      // Build query parameters
      const params = {
        page: currentPage,
        page_size: pageSize,
      };
      if (debouncedSearchQuery) {
        params.name__icontains = debouncedSearchQuery;
      }
      
      const response = await api.get('/', { params });
      
      // Handle paginated response
      if (response.data.results) {
        setSubjects(response.data.results);
        setTotalCount(response.data.count);
        setTotalPages(response.data.total_pages);
      } else {
        // Fallback for non-paginated response
        setSubjects(response.data);
        setTotalCount(response.data.length);
        setTotalPages(1);
      }
    } catch (error) {
      handleApiError(error, 'Failed to fetch subjects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, [debouncedSearchQuery, currentPage, pageSize]);

  // Handle page change
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Handle page size change
  const handlePageSizeChange = (size) => {
    setPageSize(size);
    setCurrentPage(1); // Reset to first page when changing page size
  };

  // Handle API errors
  const handleApiError = (error, defaultMessage) => {
    
    if (error.response) {
      // Handle specific status codes
      if (error.response.status === 401) {
        toast.error('Session expired. Please login again.');
        router.push('/login');
        return;
      }
      
      // Handle validation errors (400 Bad Request)
      if (error.response.status === 400) {
        const backendErrors = error.response.data;
        const formErrors = {};
        
        if (backendErrors.name) {
          formErrors.name = Array.isArray(backendErrors.name) 
            ? backendErrors.name.join(' ') 
            : backendErrors.name;
        }
        
        if (Object.keys(formErrors).length > 0) {
          setErrors(formErrors);
          toast.error('Please fix the form errors');
          return;
        }
        
        const errorMessage = backendErrors.detail || 
                            backendErrors.error || 
                            defaultMessage;
        toast.error(errorMessage);
        return;
      }
      
      const errorMessage = error.response.data?.detail || 
                          error.response.data?.error || 
                          defaultMessage;
      toast.error(errorMessage);
    } else {
      toast.error(defaultMessage || 'Network error. Please try again later.');
    }
  };

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    return newErrors;
  };

  // Open create dialog
  const openCreateDialog = () => {
    setCurrentSubject(null);
    setFormData({ name: '', description: '' });
    setErrors({});
    setOpenDialog(true);
  };

  // Open edit dialog
  const openEditDialog = (subject) => {
    setCurrentSubject(subject);
    setFormData({
      name: subject.name,
      description: subject.description,
    });
    setErrors({});
    setOpenDialog(true);
  };

  // Open delete confirmation
  const openDeleteConfirmation = (subject) => {
    setCurrentSubject(subject);
    setOpenDeleteDialog(true);
  };

  // Submit form (create/update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      toast.warning('Please fix the form errors');
      return;
    }

    setSubmitting(true);
    
    try {
      const api = getApiInstance();
      
      if (currentSubject) {
        await api.put(`${currentSubject.id}/`, formData);
        toast.success('Subject updated successfully');
      } else {
        await api.post('/', formData);
        toast.success('Subject created successfully');
      }
      
      setOpenDialog(false);
      // Reset to first page after creating/updating
      setCurrentPage(1);
      fetchSubjects();
    } catch (error) {
      handleApiError(error, currentSubject ? 'Failed to update subject' : 'Failed to create subject');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete subject
  const handleDelete = async () => {
    setDeleting(true);
    try {
      const api = getApiInstance();
      await api.delete(`${currentSubject.id}/`);
      toast.success('Subject deleted successfully');
      setOpenDeleteDialog(false);
      
      // Check if we need to go to previous page after deletion
      if (subjects.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
      
      fetchSubjects();
    } catch (error) {
      handleApiError(error, 'Failed to delete subject');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        <p className="mt-4 text-muted-foreground">Loading subjects...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-foreground">Manage Subjects</h1>
            <Button onClick={openCreateDialog} className="bg-primary hover:bg-primary/90">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
                Add New Subject
            </Button>
        </div>

        {/* Search Section */}
        <div className="mb-6">
          <div className="relative">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <Input
              placeholder="Search subjects by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10"
            />
          </div>
        </div>

        <div className="border rounded-lg overflow-hidden shadow-sm bg-card">
            <Table>
            <TableHeader className="bg-muted/50">
                <TableRow>
                <TableHead className="w-[60px]">#</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="w-[120px]">Created At</TableHead>
                <TableHead className="text-right w-[100px]">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {subjects.length > 0 ? (
                subjects.map((subject, index) => (
                    <TableRow key={subject.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">{index + 1}</TableCell>
                    <TableCell className="font-medium">{subject.name}</TableCell>
                    <TableCell className="text-muted-foreground">{subject.description || '-'}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                        {new Date(subject.created_at).toLocaleDateString('en-BD', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        })}
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
                              setCurrentSubject(subject);
                              setOpenViewDialog(true);
                            }}
                            className="cursor-pointer flex items-center gap-2"
                          >
                            <Eye className="h-4 w-4 text-primary" />
                            <span>View</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => openEditDialog(subject)}
                            className="cursor-pointer flex items-center gap-2"
                          >
                            <Edit className="h-4 w-4 text-yellow-500" />
                            <span>Edit</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => openDeleteConfirmation(subject)}
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
                    <TableCell colSpan={5} className="text-center py-12">
                    <div className="flex flex-col items-center">
                        <div className="bg-muted/50 p-4 rounded-full mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        </div>
                        <h3 className="text-lg font-medium text-foreground mb-1">No subjects found</h3>
                        <p className="text-muted-foreground mb-4">Get started by adding your first subject</p>
                        <Button 
                        className="bg-primary hover:bg-primary/90"
                        onClick={openCreateDialog}
                        >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                        </svg>
                        Add Subject
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
                label="Subjects"
                pageSizeOptions={[5, 10, 20, 50]}
              />
            )}
        </div>

        {/* View Subject Details Dialog */}
        <Dialog open={openViewDialog} onOpenChange={setOpenViewDialog}>
          <DialogContent className="max-w-lg max-h-[90vh] flex flex-col">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-foreground flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                {currentSubject?.name}
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Subject details
              </DialogDescription>
            </DialogHeader>
            
            <ScrollArea className="max-h-[65vh]">
              {currentSubject && (
                <div className="space-y-6 py-4 pr-4">
                  <div className="border-b pb-4">
                    <h3 className="font-medium text-foreground flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      Description
                    </h3>
                    <p className="mt-2 text-muted-foreground">
                      {currentSubject.description || 'No description available'}
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-6">
                    <div>
                      <h3 className="font-medium text-foreground flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Additional Information
                      </h3>
                      <div className="mt-2 grid grid-cols-1 gap-4 text-sm">
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-muted-foreground">Created At:</span>
                          <span className="text-foreground">
                            {new Date(currentSubject.created_at).toLocaleDateString('en-BD', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-muted-foreground">Last Updated:</span>
                          <span className="text-foreground">
                            {new Date(currentSubject.updated_at).toLocaleDateString('en-BD', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-muted-foreground">Subject ID:</span>
                          <span className="text-foreground font-mono">
                            {currentSubject.id}
                          </span>
                        </div>
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
            <DialogContent>
            <DialogHeader>
                <DialogTitle className="text-lg font-semibold text-foreground">
                {currentSubject ? 'Edit Subject' : 'Create New Subject'}
                </DialogTitle>
                <DialogDescription className="text-muted-foreground">
                {currentSubject
                    ? 'Update the details of this subject'
                    : 'Add a new subject to your curriculum'}
                </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="mt-2">
                <div className="grid gap-4 py-2">
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right font-medium">
                    Name*
                    </Label>
                    <div className="col-span-3">
                    <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="e.g., Quranic Arabic"
                        className={`focus:ring-primary focus:border-primary ${
                        errors.name ? 'border-red-500' : ''
                        }`}
                    />
                    {errors.name && (
                        <p className="mt-1 text-sm text-red-500 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        {errors.name}
                        </p>
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
                        placeholder="Brief description of the subject"
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
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        {currentSubject ? 'Updating...' : 'Creating...'}
                    </span>
                    ) : (
                    currentSubject ? 'Update Subject' : 'Create Subject'
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
                        Are you sure you want to permanently delete the subject:{" "}
                        <span className="font-semibold text-red-500">{currentSubject?.name}</span>?
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
                      Delete Subject
                    </span>
                )}
                </AlertDialogAction>
            </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </div>
  );
}