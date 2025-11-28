'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import React from 'react';
import { useDebounce } from '@/hooks/use-debounce';
import Pagination from '@/components/Pagination';
import * as communicationsAPI from '@/lib/communications-api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  Bug,
  AlertTriangle,
  MessageSquare,
  Lightbulb,
  HelpCircle,
  CheckCircle,
  XCircle,
  ImageIcon,
  Download,
  Filter,
  X,
  RefreshCw,
  ArrowLeft,
  User
} from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

const REPORT_TYPES = [
  { value: 'bug', label: 'Bug/Issue', icon: Bug },
  { value: 'content', label: 'Inappropriate Content', icon: AlertTriangle },
  { value: 'feedback', label: 'Feedback', icon: MessageSquare },
  { value: 'suggestion', label: 'Suggestion', icon: Lightbulb },
  { value: 'other', label: 'Other', icon: HelpCircle },
];

export default function ReportsPage() {
  const router = useRouter();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [currentReport, setCurrentReport] = useState(null);
  const [formData, setFormData] = useState({
    report_type: 'bug',
    title: '',
    content: '',
    screen_shot: null,
  });
  const [previewImage, setPreviewImage] = useState(null);
  const [errors, setErrors] = useState({});
  const [deleting, setDeleting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [resolvedFilter, setResolvedFilter] = useState('all');
  
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

  // Fetch reports
  const fetchReports = async () => {
    try {
      setLoading(true);
      const token = getAccessToken();
      if (!token) return;
      
      // Build query parameters for unified API
      const params = {
        token,
        communication_type: 'report',
        page: currentPage,
        page_size: pageSize,
      };
      
      if (typeFilter && typeFilter !== 'all') {
        params.report_type = typeFilter;
      }
      if (resolvedFilter === 'resolved') {
        params.is_resolved = true;
      } else if (resolvedFilter === 'pending') {
        params.is_resolved = false;
      }
      if (debouncedSearchQuery) {
        params.search = debouncedSearchQuery;
      }
      
      const reportData = await communicationsAPI.getCommunications(params);
      
      // Handle paginated response
      if (reportData.results) {
        setReports(reportData.results);
        setTotalCount(reportData.count);
        setTotalPages(reportData.total_pages);
      } else {
        setReports(reportData);
        setTotalCount(reportData.length);
        setTotalPages(1);
      }
    } catch (error) {
      handleApiError(error, 'Failed to fetch reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [debouncedSearchQuery, typeFilter, resolvedFilter, currentPage, pageSize]);

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
    setTypeFilter('all');
    setResolvedFilter('all');
    setSearchQuery('');
    setCurrentPage(1);
  };

  // Check if any filter is active
  const hasActiveFilters = typeFilter !== 'all' || resolvedFilter !== 'all' || searchQuery !== '';

  // Get active filters for display
  const getActiveFilters = () => {
    const filters = [];
    if (typeFilter !== 'all') {
      const typeLabel = REPORT_TYPES.find(t => t.value === typeFilter)?.label || typeFilter;
      filters.push({
        type: 'reportType',
        label: typeLabel,
        icon: Bug,
        remove: () => setTypeFilter('all')
      });
    }
    if (resolvedFilter !== 'all') {
      filters.push({
        type: 'resolved',
        label: resolvedFilter === 'resolved' ? 'Resolved' : 'Pending',
        icon: CheckCircle,
        remove: () => setResolvedFilter('all')
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
    setFormData({ ...formData, [name]: value });
    if (errors[name]) setErrors({ ...errors, [name]: '' });
  };

  // Handle file upload
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check if file is an image
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }

      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB');
        return;
      }

      setFormData({ ...formData, screen_shot: file });

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewImage(e.target.result);
      };
      reader.readAsDataURL(file);

      // Reset file input value to allow re-upload
      e.target.value = '';
    }
  };

  const removeImage = () => {
    setFormData({ ...formData, screen_shot: null });
    setPreviewImage(null);
  };

  // Open create dialog
  const openCreateDialog = () => {
    setCurrentReport(null);
    setFormData({
      report_type: 'bug',
      title: '',
      content: '',
      screen_shot: null,
    });
    setPreviewImage(null);
    setErrors({});
    setOpenDialog(true);
  };

  // Open edit dialog
  const openEditDialog = (report) => {
    setCurrentReport(report);
    setFormData({
      report_type: report.report_type,
      title: report.title,
      content: report.content,
      screen_shot: null,
    });
    setPreviewImage(
      report.screen_shot && typeof report.screen_shot === 'string' && report.screen_shot.startsWith('http')
        ? report.screen_shot
        : null
    );
    setErrors({});
    setOpenDialog(true);
  };

  // Open delete confirmation
  const openDeleteConfirmation = (report) => {
    setCurrentReport(report);
    setOpenDeleteDialog(true);
  };

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    
    // Client-side validation
    const validationErrors = {};
    if (!formData.title.trim()) validationErrors.title = 'Title is required';
    if (!formData.content.trim()) validationErrors.content = 'Content is required';
    
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      toast.warning('Please fix the form errors');
      return;
    }

    setSubmitting(true);
    
    try {
      const token = getAccessToken();
      if (!token) return;
      
      const formDataToSend = new FormData();
      formDataToSend.append('report_type', formData.report_type);
      formDataToSend.append('title', formData.title);
      formDataToSend.append('message', formData.content); // Use 'message' field for unified model
      
      if (formData.screen_shot) {
        formDataToSend.append('screen_shot', formData.screen_shot);
      }
      
      if (currentReport) {
        await communicationsAPI.updateReport(currentReport.id, formDataToSend, token);
        toast.success('Report updated successfully');
      } else {
        await communicationsAPI.createReport(formDataToSend, token);
        toast.success('Report submitted successfully');
      }
      
      setOpenDialog(false);
      // Reset to first page after creating/updating
      setCurrentPage(1);
      fetchReports();
    } catch (error) {
      handleApiError(error, currentReport ? 'Failed to update report' : 'Failed to submit report');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete report
  const handleDelete = async () => {
    setDeleting(true);
    try {
      const token = getAccessToken();
      if (!token) return;
      
      await communicationsAPI.deleteReport(currentReport.id, token);
      toast.success('Report deleted successfully');
      setOpenDeleteDialog(false);
      
      // Check if we need to go to previous page after deletion
      if (reports.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
      
      fetchReports();
    } catch (error) {
      handleApiError(error, 'Failed to delete report');
    } finally {
      setDeleting(false);
    }
  };

  // Toggle resolved status
  const toggleResolvedStatus = async (report) => {
    try {
      const token = getAccessToken();
      if (!token) return;
      
      await communicationsAPI.updateCommunication(
        report.id, 
        { is_resolved: !report.is_resolved },
        token
      );
      toast.success(`Report marked as ${!report.is_resolved ? 'resolved' : 'unresolved'}`);
      fetchReports();
    } catch (error) {
      handleApiError(error, 'Failed to update report status');
    }
  };

  // Get report type info
  const getReportTypeInfo = (type) => {
    return REPORT_TYPES.find(t => t.value === type) || REPORT_TYPES[REPORT_TYPES.length - 1];
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-BD', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        <p className="mt-4 text-muted-foreground">Loading reports...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-foreground">Manage Reports</h1>
        <Button onClick={openCreateDialog} className="bg-primary hover:bg-primary/90">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          Submit New Report
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
            placeholder="Search by title, content or user..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-10"
          />
        </div>

        {/* Filters Container */}
        <div className="flex flex-wrap lg:flex-nowrap items-center gap-2">
          {/* Type Filter */}
          <Select value={typeFilter} onValueChange={(value) => { setTypeFilter(value); setCurrentPage(1); }}>
            <SelectTrigger className={`w-full lg:w-[180px] !h-10 ${typeFilter !== 'all' ? 'border-primary bg-primary/5' : ''}`}>
              <div className="flex items-center gap-1.5">
                <Bug className="h-4 w-4 text-muted-foreground" />
                <SelectValue placeholder="Type" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="bug">Bug/Issue</SelectItem>
              <SelectItem value="content">Inappropriate Content</SelectItem>
              <SelectItem value="feedback">Feedback</SelectItem>
              <SelectItem value="suggestion">Suggestion</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
          
          {/* Resolved Filter */}
          <Select value={resolvedFilter} onValueChange={(value) => { setResolvedFilter(value); setCurrentPage(1); }}>
            <SelectTrigger className={`w-full lg:w-[160px] !h-10 ${resolvedFilter !== 'all' ? 'border-primary bg-primary/5' : ''}`}>
              <div className="flex items-center gap-1.5">
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
                <SelectValue placeholder="Status" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
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
              <TableHead>Type</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Submitted By</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reports.length > 0 ? (
              reports.map((report, index) => {
                const reportType = getReportTypeInfo(report.report_type);
                const IconComponent = reportType.icon;
                
                return (
                  <TableRow key={report.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">{index + 1}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <IconComponent className="h-4 w-4 mr-2" />
                        <span className="text-sm">{reportType.label}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{report.title}</TableCell>
                    <TableCell>
                      {report.user?.full_name || report.user?.email || 'Unknown User'}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={report.is_resolved ? "default" : "secondary"}
                        className={report.is_resolved ? "bg-primary/10 text-primary" : "bg-yellow-100 text-yellow-800"}
                      >
                        {report.is_resolved ? (
                          <>
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Resolved
                          </>
                        ) : (
                          <>
                            <XCircle className="h-3 w-3 mr-1" />
                            Pending
                          </>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(report.created_at)}
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
                              setCurrentReport(report);
                              setOpenViewDialog(true);
                            }}
                            className="cursor-pointer flex items-center gap-2"
                          >
                            <Eye className="h-4 w-4 text-primary" />
                            <span>View Details</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => openEditDialog(report)}
                            className="cursor-pointer flex items-center gap-2"
                          >
                            <Edit className="h-4 w-4 text-yellow-500" />
                            <span>Edit</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => toggleResolvedStatus(report)}
                            className="cursor-pointer flex items-center gap-2"
                          >
                            {report.is_resolved ? (
                              <>
                                <XCircle className="h-4 w-4 text-orange-500" />
                                <span>Mark as Pending</span>
                              </>
                            ) : (
                              <>
                                <CheckCircle className="h-4 w-4 text-primary" />
                                <span>Mark as Resolved</span>
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => openDeleteConfirmation(report)}
                            className="cursor-pointer flex items-center gap-2 text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                            <span>Delete</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12">
                  <div className="flex flex-col items-center">
                    <div className="bg-muted/50 p-4 rounded-full mb-4">
                      <MessageSquare className="h-10 w-10 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium text-foreground mb-1">No reports found</h3>
                    <p className="text-muted-foreground mb-4">Be the first to submit a report or feedback</p>
                    <Button 
                      className="bg-primary hover:bg-primary/90"
                      onClick={openCreateDialog}
                    >
                      Submit Report
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
            label="Reports"
            pageSizeOptions={[5, 10, 20, 50]}
          />
        )}
      </div>

      {/* View Report Details Dialog */}
      <Dialog open={openViewDialog} onOpenChange={setOpenViewDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-foreground flex items-center gap-2">
              {currentReport && (
                <>
                  {React.createElement(getReportTypeInfo(currentReport.report_type).icon, { className: "h-5 w-5" })}
                  {currentReport.title}
                </>
              )}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Report details and information
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="max-h-[60vh] px-1">
            {currentReport && (
              <div className="space-y-6 py-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-medium text-foreground">Report Type</h3>
                    <div className="mt-2 flex items-center">
                      {React.createElement(
                        getReportTypeInfo(currentReport.report_type).icon, 
                        { className: "h-4 w-4 mr-2 text-primary" }
                      )}
                      <span>{getReportTypeInfo(currentReport.report_type).label}</span>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-foreground">Status</h3>
                    <div className="mt-2">
                      <Badge 
                        variant={currentReport.is_resolved ? "default" : "secondary"}
                        className={currentReport.is_resolved ? "bg-primary/10 text-primary" : "bg-yellow-100 text-yellow-800"}
                      >
                        {currentReport.is_resolved ? "Resolved" : "Pending"}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                  <div>
                    <h3 className="font-medium text-foreground">Content</h3>
                    <p className="mt-2 text-muted-foreground whitespace-pre-wrap p-3 bg-muted/50 rounded-md">
                      {currentReport.message || currentReport.content}
                    </p>
                  </div>
                
                {currentReport.screen_shot && (
                  <div>
                    <h3 className="font-medium text-foreground flex items-center gap-2">
                      <ImageIcon className="h-4 w-4" />
                      Screenshot
                    </h3>
                    <div className="mt-2">
                      <img 
                        src={currentReport.screen_shot} 
                        alt="Report screenshot" 
                        className="max-w-full h-auto rounded-lg border shadow-md mb-4"
                      />
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-2"
                        onClick={() => window.open(currentReport.screen_shot, '_blank')}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        View Full Image
                      </Button>
                    </div>
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-medium text-foreground">Submitted By</h3>
                    <p className="mt-2 text-muted-foreground">
                      {currentReport.user?.full_name || currentReport.user?.email || 'Unknown User'}
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-foreground">Submitted On</h3>
                    <p className="mt-2 text-muted-foreground">{formatDate(currentReport.created_at)}</p>
                  </div>
                </div>
                
                {currentReport.updated_at !== currentReport.created_at && (
                  <div>
                    <h3 className="font-medium text-foreground">Last Updated</h3>
                    <p className="mt-2 text-muted-foreground">{formatDate(currentReport.updated_at)}</p>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>
          
          <DialogFooter className="flex gap-2 mt-4">
            <Button 
              variant="outline"
              onClick={() => setOpenViewDialog(false)}
            >
              Close
            </Button>
            {currentReport && (
              <Button 
                onClick={() => {
                  setOpenViewDialog(false);
                  openEditDialog(currentReport);
                }}
              >
                <Edit className="h-4 w-4 mr-1" />
                Edit Report
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create/Edit Dialog */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-foreground">
              {currentReport ? 'Edit Report' : 'Submit New Report'}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {currentReport
                ? 'Update the details of this report'
                : 'Submit a new report, feedback, or suggestion'}
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="max-h-[60vh] px-1">
            <form onSubmit={handleSubmit} className="mt-2">
              <div className="grid gap-4 py-2">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="report_type" className="text-right font-medium">
                    Type*
                  </Label>
                  <div className="col-span-3">
                    <Select 
                      value={formData.report_type} 
                      onValueChange={(value) => setFormData({...formData, report_type: value})}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select report type" />
                      </SelectTrigger>
                      <SelectContent>
                        {REPORT_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            <div className="flex items-center">
                              {React.createElement(type.icon, { className: "h-4 w-4 mr-2" })}
                              {type.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

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
                      placeholder="Brief title for your report"
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
                  <Label htmlFor="content" className="text-right font-medium">
                    Content*
                  </Label>
                  <div className="col-span-3">
                    <Textarea
                      id="content"
                      name="content"
                      value={formData.content}
                      onChange={handleChange}
                      placeholder="Please provide detailed information about your report"
                      rows={5}
                      className={`focus:ring-primary focus:border-primary ${
                        errors.content ? 'border-red-500' : ''
                      }`}
                    />
                    {errors.content && (
                      <p className="mt-1 text-sm text-red-500">{errors.content}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="screen_shot" className="text-right font-medium">
                    Screenshot
                  </Label>
                  <div className="col-span-3">
                    <div className="flex items-center justify-center w-full">
                      <label
                        htmlFor="screen_shot"
                        className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer border-border hover:border-gray-400 relative"
                      >
                        {previewImage ? (
                          <img 
                            src={previewImage} 
                            alt="Preview" 
                            className="absolute inset-0 object-cover w-full h-full rounded-lg"
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <ImageIcon className="w-8 h-8 mb-4 text-muted-foreground" />
                            <p className="mb-2 text-sm text-muted-foreground">
                              <span className="font-semibold">Click to upload</span> or drag and drop
                            </p>
                            <p className="text-xs text-muted-foreground">PNG, JPG, GIF (MAX. 5MB)</p>
                          </div>
                        )}
                        <input
                          id="screen_shot"
                          name="screen_shot"
                          type="file"
                          className="hidden"
                          onChange={handleFileChange}
                          accept="image/*"
                        />
                      </label>
                    </div>
                    
                    {previewImage && (
                      <div className="mt-4 max-w-full overflow-hidden">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="mt-2"
                          onClick={removeImage}
                        >
                          Remove Image
                        </Button>
                      </div>
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
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                      {currentReport ? 'Updating...' : 'Submitting...'}
                    </span>
                  ) : (
                    currentReport ? 'Update Report' : 'Submit Report'
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
            <AlertDialogTitle className="text-lg font-semibold text-foreground">
              Confirm Deletion
            </AlertDialogTitle>
            <div className="mt-4 bg-red-50 p-4 rounded-lg border border-red-100">
              <div className="flex items-start">
                <AlertTriangle className="h-6 w-6 text-red-500 mr-2 mt-0.5" />
                <div>
                  <div className="font-medium">This action cannot be undone.</div>
                  <div className="mt-2">
                    Are you sure you want to permanently delete the report:{" "}
                    <span className="font-semibold text-red-500">{currentReport?.title}</span>?
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
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                  Deleting...
                </span>
              ) : (
                'Delete Report'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}