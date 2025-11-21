'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import { useDebounce } from '@/hooks/use-debounce';
import { config } from '@/lib/config';
import Pagination from '@/components/Pagination';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
  Mail,
  Shield,
  Activity,
  Key,
  Calendar,
  Lock,
  User as UserIcon,
  Filter,
  X,
  RefreshCw,
  ArrowLeft,
  CheckCircle
} from 'lucide-react';
import { IconEye, IconEyeOff } from '@tabler/icons-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';




// Role options matching Django model
const ROLE_OPTIONS = [
  { value: 'student', label: 'Student' },
  { value: 'teacher', label: 'Teacher' },
  { value: 'parent', label: 'Parent' },
  { value: 'staff', label: 'Staff' },
  { value: 'super_admin', label: 'Super Admin' },
];

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openPasswordDialog, setOpenPasswordDialog] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    role: 'student',
    is_active: true,
    password: '',
  });
  const [passwordData, setPasswordData] = useState({
    password: '',
  });
  const [errors, setErrors] = useState({});
  const [deleting, setDeleting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
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
      console.error('Error parsing authTokens:', error);
      toast.error('Invalid authentication data. Please login again.');
      router.push('/login');
      return null;
    }
  };

  // Create Axios instance with base URL for auth endpoints
  const getApiInstance = () => {
    const token = getAccessToken();
    return axios.create({
      baseURL: config.API_BASE_URL + 'auth/',
      headers: {
        'Content-Type': 'application/json',
        Authorization: token ? `Bearer ${token}` : '',
      },
    });
  };

  // Fetch users
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const api = getApiInstance();
      
      // Build query parameters
      const params = {
        page: currentPage,
        page_size: pageSize,
      };
      if (debouncedSearchQuery) {
        params.full_name = debouncedSearchQuery;
        params.email = debouncedSearchQuery;
      }
      if (roleFilter && roleFilter !== 'all') {
        params.role = roleFilter;
      }
      if (statusFilter === 'active') {
        params.is_active = true;
      } else if (statusFilter === 'inactive') {
        params.is_active = false;
      }
      
      const response = await api.get('user/', { params });
      
      // Handle paginated response
      if (response.data.results) {
        setUsers(response.data.results);
        setTotalCount(response.data.count);
        setTotalPages(response.data.total_pages);
      } else {
        // Fallback for non-paginated response
        setUsers(response.data);
        setTotalCount(response.data.length);
        setTotalPages(1);
      }
    } catch (error) {
      handleApiError(error, 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [debouncedSearchQuery, roleFilter, statusFilter, currentPage, pageSize]);

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
    setRoleFilter('all');
    setStatusFilter('all');
    setSearchQuery('');
    setCurrentPage(1);
  };

  // Check if any filter is active
  const hasActiveFilters = roleFilter !== 'all' || statusFilter !== 'all' || searchQuery !== '';

  // Get active filters for display
  const getActiveFilters = () => {
    const filters = [];
    if (roleFilter !== 'all') {
      const roleLabel = ROLE_OPTIONS.find(r => r.value === roleFilter)?.label || roleFilter;
      filters.push({
        type: 'role',
        label: roleLabel,
        icon: Shield,
        remove: () => setRoleFilter('all')
      });
    }
    if (statusFilter !== 'all') {
      filters.push({
        type: 'status',
        label: statusFilter === 'active' ? 'Active' : 'Inactive',
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

  // Handle password changes
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData({
      ...passwordData,
      [name]: value
    });
  };

  // Handle role selection
  const handleRoleChange = (value) => {
    setFormData({
      ...formData,
      role: value
    });
  };

  // Open create dialog
  const openCreateDialog = () => {
    setCurrentUser(null);
    setFormData({
      email: '',
      full_name: '',
      role: 'student',
      is_active: true,
      password: '',
    });
    setErrors({});
    setOpenDialog(true);
  };

  // Open edit dialog
  const openEditDialog = (user) => {
    setCurrentUser(user);
    setFormData({
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      is_active: user.is_active,
    });
    setErrors({});
    setOpenDialog(true);
  };

  // Open delete confirmation
  const openDeleteConfirmation = (user) => {
    setCurrentUser(user);
    setOpenDeleteDialog(true);
  };

  // Open user view
  const openUserView = (user) => {
    setCurrentUser(user);
    setOpenViewDialog(true);
  };

  // Get role badge
  const getRoleBadge = (role) => {
    const roleConfig = {
      student: { label: 'Student', variant: 'default' },
      teacher: { label: 'Teacher', variant: 'secondary' },
      parent: { label: 'Parent', variant: 'outline' },
      staff: { label: 'Staff', variant: 'destructive' },
      super_admin: { label: 'Super Admin', variant: 'success' },
    };
    
    const config = roleConfig[role] || { label: role, variant: 'default' };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  // Submit user form
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    
    // Client-side validation
    const validationErrors = {};
    if (!formData.email) validationErrors.email = 'Email is required';
    if (!formData.full_name) validationErrors.full_name = 'Full name is required';
    if (!formData.role) validationErrors.role = 'Role is required';
    
    // Password required only for new users
    if (!currentUser && !formData.password) {
      validationErrors.password = 'Password is required';
    }
    
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      toast.warning('Please fix the form errors');
      return;
    }

    setSubmitting(true);
    
    try {
      const api = getApiInstance();
      
      if (currentUser) {
        // Update existing user - remove password from payload
        const { password, ...updateData } = formData;
        await api.put(`user/${currentUser.id}/`, updateData);
        toast.success('User updated successfully');
      } else {
        // Create new user - include password in payload
        await api.post('registration/', formData);
        toast.success('User created successfully');
      }
      
      setOpenDialog(false);
      // Reset to first page after creating/updating
      setCurrentPage(1);
      fetchUsers();
    } catch (error) {
      handleApiError(error, currentUser ? 'Failed to update user' : 'Failed to create user');
    } finally {
      setSubmitting(false);
    }
  };

  // Submit password form
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    
    // Client-side validation
    const validationErrors = {};
    if (!passwordData.password) validationErrors.password = 'Password is required';
    
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      toast.warning('Please fix the form errors');
      return;
    }

    setSubmitting(true);
    
    try {
      const api = getApiInstance();
      await api.post(`user/${currentUser.id}/set_password/`, {
        password: passwordData.password
      });
      
      toast.success('Password updated successfully');
      setOpenPasswordDialog(false);
    } catch (error) {
      handleApiError(error, 'Failed to update password');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete user
  const handleDelete = async () => {
    setDeleting(true);
    try {
      const api = getApiInstance();
      await api.delete(`user/${currentUser.id}/`);
      toast.success('User deleted successfully');
      setOpenDeleteDialog(false);
      
      // Check if we need to go to previous page after deletion
      if (users.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
      
      fetchUsers();
    } catch (error) {
      handleApiError(error, 'Failed to delete user');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        <p className="mt-4 text-gray-500">Loading users...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-foreground">Manage Users</h1>
        <Button onClick={openCreateDialog} className="bg-primary hover:bg-primary/90">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          Add New User
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
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-10"
          />
        </div>

        {/* Filters Container */}
        <div className="flex flex-wrap lg:flex-nowrap items-center gap-2">
          {/* Role Filter */}
          <Select value={roleFilter} onValueChange={(value) => { setRoleFilter(value); setCurrentPage(1); }}>
            <SelectTrigger className={`w-full lg:w-[160px] !h-10 ${roleFilter !== 'all' ? 'border-primary bg-primary/5' : ''}`}>
              <div className="flex items-center gap-1.5">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <SelectValue placeholder="Role" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="student">Student</SelectItem>
              <SelectItem value="teacher">Teacher</SelectItem>
              <SelectItem value="parent">Parent</SelectItem>
              <SelectItem value="staff">Staff</SelectItem>
              <SelectItem value="super_admin">Super Admin</SelectItem>
            </SelectContent>
          </Select>
          
          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={(value) => { setStatusFilter(value); setCurrentPage(1); }}>
            <SelectTrigger className={`w-full lg:w-[160px] !h-10 ${statusFilter !== 'all' ? 'border-primary bg-primary/5' : ''}`}>
              <div className="flex items-center gap-1.5">
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
                <SelectValue placeholder="Status" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
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
              <TableHead>Email</TableHead>
              <TableHead>Full Name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length > 0 ? (
              users.map((user, index) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{index + 1}</TableCell>
                  <TableCell className="font-medium">{user.email}</TableCell>
                  <TableCell>{user.full_name}</TableCell>
                  <TableCell>{getRoleBadge(user.role)}</TableCell>
                  <TableCell>
                    {user.is_active ? (
                      <Badge variant="success">Active</Badge>
                    ) : (
                      <Badge variant="destructive">Inactive</Badge>
                    )}
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
                          onClick={() => openUserView(user)}
                          className="cursor-pointer flex items-center gap-2"
                        >
                          <Eye className="h-4 w-4 text-primary" />
                          <span>View Details</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/dashboard/super-admin/users/${user.id}`} className="flex items-center gap-2 cursor-pointer">
                            <UserIcon className="h-4 w-4 text-primary" />
                            <span>View Profile</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => openEditDialog(user)}
                          className="cursor-pointer flex items-center gap-2"
                        >
                          <Edit className="h-4 w-4 text-yellow-500" />
                          <span>Edit</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => {
                            setCurrentUser(user);
                            setPasswordData({ password: '' });
                            setOpenPasswordDialog(true);
                          }}
                          className="cursor-pointer flex items-center gap-2"
                        >
                          <Lock className="h-4 w-4 text-secondary" />
                          <span>Password</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => openDeleteConfirmation(user)}
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
                <TableCell colSpan={6} className="text-center py-12">
                  <div className="flex flex-col items-center">
                    <div className="bg-muted/50 p-4 rounded-full mb-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-foreground mb-1">No users found</h3>
                    <p className="text-muted-foreground mb-4">Get started by adding your first user</p>
                    <Button 
                      className="bg-primary hover:bg-primary/90"
                      onClick={openCreateDialog}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                      </svg>
                      Add User
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
            label="Users"
            pageSizeOptions={[5, 10, 20, 50]}
          />
        )}
      </div>

      {/* User View Dialog - Fixed scrolling */}
      <Dialog open={openViewDialog} onOpenChange={setOpenViewDialog}>
        <DialogContent className="max-w-lg h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              {currentUser?.full_name}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              User details
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="flex-1 overflow-y-auto p-4">
            <div className="space-y-6">
              <div className="border-b pb-4">
                <h3 className="font-medium text-foreground flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email
                </h3>
                <p className="mt-2 text-muted-foreground">
                  {currentUser?.email}
                </p>
              </div>
              
              <div className="border-b pb-4">
                <h3 className="font-medium text-foreground flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Full Name
                </h3>
                <p className="mt-2 text-muted-foreground">
                  {currentUser?.full_name}
                </p>
              </div>
              
              <div className="border-b pb-4">
                <h3 className="font-medium text-foreground flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Role
                </h3>
                <div className="mt-2">
                  {currentUser && getRoleBadge(currentUser.role)}
                </div>
              </div>
              
              <div className="border-b pb-4">
                <h3 className="font-medium text-foreground flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Status
                </h3>
                <div className="mt-2">
                  {currentUser?.is_active ? (
                    <Badge variant="success">Active</Badge>
                  ) : (
                    <Badge variant="destructive">Inactive</Badge>
                  )}
                </div>
              </div>
              
              
              <div>
                <h3 className="font-medium text-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Additional Information
                </h3>
                <div className="mt-2 grid grid-cols-1 gap-4 text-sm">
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-500">User ID:</span>
                    <span className="text-foreground font-mono">
                      {currentUser?.id}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-500">Created At:</span>
                    <span className="text-foreground">
                      {currentUser && new Date(currentUser.created_at).toLocaleDateString('en-BD', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-500">Last Updated:</span>
                    <span className="text-foreground">
                      {currentUser && new Date(currentUser.updated_at).toLocaleDateString('en-BD', {
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
          </ScrollArea>
          
          <DialogFooter className="pt-4 border-t">
            <Button 
              onClick={() => setOpenViewDialog(false)}
              variant="default"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create/Edit Dialog */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-gray-800">
              {currentUser ? 'Edit User' : 'Create New User'}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {currentUser
                ? 'Update the details of this user'
                : 'Add a new user to your system'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="mt-2">
            <div className="grid gap-4 py-2">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right font-medium">
                  Email*
                </Label>
                <div className="col-span-3">
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="user@example.com"
                    className={`focus:ring-2 focus:ring-primary focus:border-primary ${
                      errors.email ? 'border-red-500' : ''
                    }`}
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-500">{errors.email}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="full_name" className="text-right font-medium">
                  Full Name*
                </Label>
                <div className="col-span-3">
                  <Input
                    id="full_name"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleChange}
                    placeholder="John Doe"
                    className={`focus:ring-2 focus:ring-primary focus:border-primary ${
                      errors.full_name ? 'border-red-500' : ''
                    }`}
                  />
                  {errors.full_name && (
                    <p className="mt-1 text-sm text-red-500">{errors.full_name}</p>
                  )}
                </div>
              </div>

              {/* Password field for new users only */}
              {!currentUser && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="password" className="text-right font-medium">
                    Password*
                  </Label>
                  <div className="col-span-3">
                    <div className="relative">
                      <Input
                        id="password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Enter password"
                        className={`focus:ring-2 focus:ring-primary focus:border-primary ${
                          errors.password ? 'border-red-500' : ''
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-foreground focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-1 rounded-sm"
                      >
                        {showPassword ? (
                          <IconEyeOff className="h-4 w-4" />
                        ) : (
                          <IconEye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="mt-1 text-sm text-red-500">{errors.password}</p>
                    )}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="role" className="text-right font-medium">
                  Role*
                </Label>
                <div className="col-span-3">
                  <Select 
                    value={formData.role} 
                    onValueChange={handleRoleChange}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLE_OPTIONS.map((role) => (
                        <SelectItem key={role.value} value={role.value}>
                          {role.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.role && (
                    <p className="mt-1 text-sm text-red-500">{errors.role}</p>
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
                      User is active
                    </label>
                  </div>
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
                    {currentUser ? 'Updating...' : 'Creating...'}
                  </span>
                ) : (
                  currentUser ? 'Update User' : 'Create User'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Password Reset Dialog */}
      <Dialog open={openPasswordDialog} onOpenChange={setOpenPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-gray-800">
              Reset Password for {currentUser?.email}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Set a new password for this user
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handlePasswordSubmit} className="mt-2">
            <div className="grid gap-4 py-2">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="password" className="text-right font-medium">
                  New Password*
                </Label>
                <div className="col-span-3">
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type={showResetPassword ? 'text' : 'password'}
                      value={passwordData.password}
                      onChange={handlePasswordChange}
                      placeholder="Enter new password"
                      className={`focus:ring-2 focus:ring-primary focus:border-primary ${
                        errors.password ? 'border-red-500' : ''
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowResetPassword(!showResetPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-foreground focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-1 rounded-sm"
                    >
                      {showResetPassword ? (
                        <IconEyeOff className="h-4 w-4" />
                      ) : (
                        <IconEye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-1 text-sm text-red-500">{errors.password}</p>
                  )}
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
                    Updating...
                  </span>
                ) : (
                  'Update Password'
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
            <div className="mt-4 bg-red-500/10 p-4 rounded-lg border border-red-500/20">
              <div className="flex items-start">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <div className="font-medium">This action cannot be undone.</div>
                  <div className="mt-2">
                    Are you sure you want to permanently delete user:{" "}
                    <span className="font-semibold text-red-500">{currentUser?.email}</span>?
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
                'Delete User'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

