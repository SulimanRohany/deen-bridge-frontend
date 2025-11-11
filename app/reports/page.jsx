'use client';

import React, { useState, useEffect, useContext } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Bug,
  AlertTriangle,
  MessageSquare,
  Lightbulb,
  HelpCircle,
  CheckCircle,
  XCircle,
  ImageIcon,
  Download,
  Eye,
  Edit,
  Sparkles,
  Send,
  Upload,
  X,
  Clock,
  User
} from 'lucide-react';
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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import AuthContext from '@/context/AuthContext';

const REPORT_TYPES = [
  { 
    value: 'bug', 
    label: 'Bug/Issue', 
    icon: Bug,
    description: 'Report technical problems or bugs',
    color: 'from-red-500 to-red-600'
  },
  { 
    value: 'content', 
    label: 'Inappropriate Content', 
    icon: AlertTriangle,
    description: 'Report inappropriate or offensive content',
    color: 'from-orange-500 to-orange-600'
  },
  { 
    value: 'feedback', 
    label: 'Feedback', 
    icon: MessageSquare,
    description: 'Share your thoughts and experiences',
    color: 'from-blue-500 to-blue-600'
  },
  { 
    value: 'suggestion', 
    label: 'Suggestion', 
    icon: Lightbulb,
    description: 'Suggest new features or improvements',
    color: 'from-green-500 to-green-600'
  },
  { 
    value: 'other', 
    label: 'Other', 
    icon: HelpCircle,
    description: 'Other inquiries or concerns',
    color: 'from-purple-500 to-purple-600'
  },
];

export default function ReportsPage() {
  const router = useRouter();
  const { userData } = useContext(AuthContext);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  
  const [formData, setFormData] = useState({
    report_type: 'bug',
    title: '',
    content: '',
    screen_shot: null,
  });
  const [previewImage, setPreviewImage] = useState(null);
  const [errors, setErrors] = useState({});
  const [removeScreenshot, setRemoveScreenshot] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (mounted && !userData) {
      router.push('/login');
    }
  }, [userData, mounted, router]);

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


  // Fetch user's reports
  const fetchReports = async () => {
    if (!userData) return;
    
    try {
      setLoading(true);
      const token = getAccessToken();
      if (!token) return;
      
      // Use the unified communications API to fetch reports
      const response = await fetch('http://127.0.0.1:8000/api/report/', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch reports');
      }
      
      const data = await response.json();
      
      // Handle both paginated and non-paginated responses
      const reportsList = data.results || data;
      
      // Backend already filters by user, so we don't need to filter again
      setReports(reportsList);
    } catch (error) {
      console.error('Failed to fetch reports:', error);
      if (error.message !== 'Authentication required. Please login again.') {
        toast.error('Failed to load your reports');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userData) {
      fetchReports();
    }
  }, [userData]);

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
    }
  };

  const removeImage = () => {
    setFormData({ ...formData, screen_shot: null });
    setPreviewImage(null);
    setRemoveScreenshot(true); // Mark that user wants to remove screenshot
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
      if (!token) {
        setSubmitting(false);
        return;
      }

      const formDataToSend = new FormData();
      
      formDataToSend.append('report_type', formData.report_type);
      formDataToSend.append('title', formData.title);
      formDataToSend.append('message', formData.content); // Use 'message' field for unified model
      
      if (formData.screen_shot) {
        formDataToSend.append('screen_shot', formData.screen_shot);
      }
      
      // Use fetch API for file uploads to ensure proper Content-Type with boundary
      const response = await fetch('http://127.0.0.1:8000/api/report/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          // Don't set Content-Type - let browser set it with boundary for multipart/form-data
        },
        body: formDataToSend,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw { response: { status: response.status, data: errorData } };
      }

      toast.success('Report submitted successfully!', {
        description: 'We\'ll review your report and get back to you soon.'
      });
      
      // Reset form
      setFormData({
        report_type: 'bug',
        title: '',
        content: '',
        screen_shot: null,
      });
      setPreviewImage(null);
      
      // Refresh reports list
      fetchReports();
      
      // Scroll to history section
      setTimeout(() => {
        document.getElementById('report-history')?.scrollIntoView({ behavior: 'smooth' });
      }, 500);
      
    } catch (error) {
      console.error('Error submitting report:', error);
      if (error.response?.status === 400) {
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
        }
      } else {
        toast.error('Failed to submit report. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Open edit dialog
  const openEditForm = (report) => {
    setSelectedReport(report);
    setFormData({
      report_type: report.report_type,
      title: report.title,
      content: report.message || report.content, // Use message field (unified model), fallback to content for backward compatibility
      screen_shot: null,
    });
    setPreviewImage(
      report.screen_shot && typeof report.screen_shot === 'string' && report.screen_shot.startsWith('http')
        ? report.screen_shot
        : null
    );
    setErrors({});
    setRemoveScreenshot(false); // Reset remove flag
    setOpenEditDialog(true);
  };

  // Update report
  const handleUpdate = async (e) => {
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
      if (!token) {
        setSubmitting(false);
        return;
      }

      let response;
      
      if (formData.screen_shot && formData.screen_shot instanceof File) {
        // Use FormData for file uploads
        const formDataToSend = new FormData();
        formDataToSend.append('report_type', formData.report_type);
        formDataToSend.append('title', formData.title);
        formDataToSend.append('message', formData.content); // Use 'message' field for unified model
        formDataToSend.append('screen_shot', formData.screen_shot);
        
        response = await fetch(`http://127.0.0.1:8000/api/report/${selectedReport.id}/`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            // Don't set Content-Type - let browser set it with boundary for multipart/form-data
          },
          body: formDataToSend,
        });
      } else {
        // Use JSON for non-file updates (including screenshot removal)
        const updateData = {
          report_type: formData.report_type,
          title: formData.title,
          message: formData.content, // Use 'message' field for unified model
        };
        
        if (removeScreenshot) {
          updateData.screen_shot = null; // Explicitly set to null to remove
        }
        
        response = await fetch(`http://127.0.0.1:8000/api/report/${selectedReport.id}/`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updateData),
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw { response: { status: response.status, data: errorData } };
      }

      toast.success('Report updated successfully!');
      
      // Reset form and close dialog
      setFormData({
        report_type: 'bug',
        title: '',
        content: '',
        screen_shot: null,
      });
      setPreviewImage(null);
      setRemoveScreenshot(false);
      setOpenEditDialog(false);
      
      // Refresh reports list
      fetchReports();
      
    } catch (error) {
      console.error('Error updating report:', error);
      if (error.response?.status === 400) {
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
        }
      } else {
        toast.error('Failed to update report. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Get report type info
  const getReportTypeInfo = (type) => {
    return REPORT_TYPES.find(t => t.value === type) || REPORT_TYPES[REPORT_TYPES.length - 1];
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!mounted || !userData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-secondary/5 to-background border-b">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>

        <div className="container mx-auto px-4 py-20 relative z-10">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium mb-4">
              <Sparkles className="w-4 h-4" />
              <span>Help Us Improve</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight">
              Report & Feedback
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary mt-2">
                Center
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Found a bug? Have a suggestion? We value your feedback and are committed to making your experience better.
            </p>
          </div>
        </div>
      </section>

      {/* Report Types Info Cards */}
      <section className="container mx-auto px-4 -mt-12 relative z-20 mb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {REPORT_TYPES.map((type, index) => (
            <Card 
              key={index}
              className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-2 hover:border-primary/50 bg-background shadow-lg cursor-pointer"
              onClick={() => setFormData({ ...formData, report_type: type.value })}
            >
              <CardContent className="p-6 text-center space-y-3">
                <div className={`w-14 h-14 mx-auto rounded-xl bg-gradient-to-br ${type.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-md`}>
                  <type.icon className="w-7 h-7 text-white" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-sm text-foreground">{type.label}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{type.description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Main Content - Form */}
      <section className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Card className="border-2 shadow-xl">
            <CardHeader>
              <CardTitle className="text-2xl md:text-3xl flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-white" />
                </div>
                Submit a Report
              </CardTitle>
              <CardDescription className="text-base">
                Please provide detailed information to help us address your concern effectively
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Report Type */}
                <div className="space-y-2">
                  <Label htmlFor="report_type" className="text-sm font-semibold">
                    Report Type <span className="text-destructive">*</span>
                  </Label>
                  <Select 
                    value={formData.report_type} 
                    onValueChange={(value) => setFormData({...formData, report_type: value})}
                  >
                    <SelectTrigger className="w-full h-12">
                      <SelectValue placeholder="Select report type" />
                    </SelectTrigger>
                    <SelectContent>
                      {REPORT_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center gap-3">
                            <type.icon className="h-4 w-4" />
                            <div className="flex flex-col items-start">
                              <span className="font-medium">{type.label}</span>
                              <span className="text-xs text-muted-foreground">{type.description}</span>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Title */}
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-sm font-semibold">
                    Title <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="title"
                    name="title"
                    placeholder="Brief title describing your report"
                    value={formData.title}
                    onChange={handleChange}
                    className={`h-12 ${errors.title ? 'border-red-500' : ''}`}
                    disabled={submitting}
                  />
                  {errors.title && (
                    <p className="text-sm text-red-500">{errors.title}</p>
                  )}
                </div>

                {/* Content */}
                <div className="space-y-2">
                  <Label htmlFor="content" className="text-sm font-semibold">
                    Description <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="content"
                    name="content"
                    placeholder="Please provide detailed information about your report. Include steps to reproduce if it's a bug, or detailed suggestions for improvements."
                    value={formData.content}
                    onChange={handleChange}
                    rows={6}
                    className={`resize-none ${errors.content ? 'border-red-500' : ''}`}
                    disabled={submitting}
                  />
                  {errors.content && (
                    <p className="text-sm text-red-500">{errors.content}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Be as specific as possible to help us understand and address your concern
                  </p>
                </div>

                {/* Screenshot Upload */}
                <div className="space-y-2">
                  <Label htmlFor="screen_shot" className="text-sm font-semibold">
                    Screenshot (Optional)
                  </Label>
                  <div className="space-y-4">
                    {!previewImage ? (
                      <label
                        htmlFor="screen_shot"
                        className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-xl cursor-pointer border-border hover:border-primary/50 hover:bg-primary/5 transition-all duration-300 group"
                      >
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <Upload className="w-10 h-10 mb-3 text-muted-foreground group-hover:text-primary transition-colors" />
                          <p className="mb-2 text-sm text-muted-foreground">
                            <span className="font-semibold">Click to upload</span> or drag and drop
                          </p>
                          <p className="text-xs text-muted-foreground">PNG, JPG, GIF (MAX. 5MB)</p>
                        </div>
                        <input
                          id="screen_shot"
                          name="screen_shot"
                          type="file"
                          className="hidden"
                          onChange={handleFileChange}
                          accept="image/*"
                          disabled={submitting}
                        />
                      </label>
                    ) : (
                      <div className="relative">
                        <img 
                          src={previewImage} 
                          alt="Preview" 
                          className="w-full h-auto max-h-80 object-contain rounded-xl border-2 border-border shadow-md"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2 rounded-full shadow-lg"
                          onClick={removeImage}
                          disabled={submitting}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  size="lg"
                  className="w-full h-12 text-base font-semibold shadow-lg hover:shadow-xl transition-all"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                      Submitting Report...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5 mr-2" />
                      Submit Report
                    </>
                  )}
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  Your report will be reviewed by our team. We typically respond within 24-48 hours.
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Report History Section */}
      <section id="report-history" className="container mx-auto px-4 py-16 bg-muted/30 border-y">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Your Report History
            </h2>
            <p className="text-muted-foreground text-lg">
              Track the status of your submitted reports
            </p>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
              <p className="text-muted-foreground">Loading your reports...</p>
            </div>
          ) : reports.length > 0 ? (
            <div className="space-y-4">
              {reports.map((report) => {
                const reportType = getReportTypeInfo(report.report_type);
                const IconComponent = reportType.icon;
                
                return (
                  <Card 
                    key={report.id} 
                    className="border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg group"
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4 flex-1">
                          <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${reportType.color} flex items-center justify-center flex-shrink-0 shadow-md`}>
                            <IconComponent className="w-6 h-6 text-white" />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors">
                                {report.title}
                              </h3>
                              <Badge 
                                variant={report.is_resolved ? "default" : "secondary"}
                                className={`flex-shrink-0 ${report.is_resolved ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"}`}
                              >
                                {report.is_resolved ? (
                                  <>
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Resolved
                                  </>
                                ) : (
                                  <>
                                    <Clock className="h-3 w-3 mr-1" />
                                    Pending
                                  </>
                                )}
                              </Badge>
                            </div>
                            
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                              {report.message || report.content}
                            </p>
                            
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <IconComponent className="h-3 w-3" />
                                {reportType.label}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatDate(report.created_at)}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex gap-2 flex-shrink-0">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => {
                              setSelectedReport(report);
                              setOpenViewDialog(true);
                            }}
                            className="hover:bg-primary/10 hover:text-primary hover:border-primary"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => openEditForm(report)}
                            className="hover:bg-blue-50 hover:text-blue-600 hover:border-blue-600 dark:hover:bg-blue-900/20"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="border-2 border-dashed">
              <CardContent className="py-16 text-center">
                <div className="flex flex-col items-center">
                  <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-4">
                    <MessageSquare className="h-10 w-10 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium text-foreground mb-2">No reports yet</h3>
                  <p className="text-muted-foreground mb-6 max-w-md">
                    You haven't submitted any reports. If you encounter any issues or have suggestions, feel free to submit a report above.
                  </p>
                  <Button 
                    variant="outline"
                    onClick={() => {
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                  >
                    Submit Your First Report
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      {/* View Report Details Dialog */}
      <Dialog open={openViewDialog} onOpenChange={setOpenViewDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-foreground flex items-center gap-2">
              {selectedReport && (
                <>
                  {React.createElement(getReportTypeInfo(selectedReport.report_type).icon, { className: "h-5 w-5" })}
                  {selectedReport.title}
                </>
              )}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Report details and information
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="max-h-[60vh] px-1">
            {selectedReport && (
              <div className="space-y-6 py-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-medium text-foreground mb-2">Report Type</h3>
                    <div className="flex items-center gap-2">
                      {React.createElement(
                        getReportTypeInfo(selectedReport.report_type).icon, 
                        { className: "h-4 w-4 text-primary" }
                      )}
                      <span>{getReportTypeInfo(selectedReport.report_type).label}</span>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-foreground mb-2">Status</h3>
                    <Badge 
                      variant={selectedReport.is_resolved ? "default" : "secondary"}
                      className={selectedReport.is_resolved ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"}
                    >
                      {selectedReport.is_resolved ? "Resolved" : "Pending"}
                    </Badge>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="font-medium text-foreground mb-2">Description</h3>
                  <p className="text-muted-foreground whitespace-pre-wrap p-3 bg-muted/50 rounded-md">
                    {selectedReport.message || selectedReport.content}
                  </p>
                </div>
                
                {selectedReport.screen_shot && (
                  <div>
                    <h3 className="font-medium text-foreground flex items-center gap-2 mb-2">
                      <ImageIcon className="h-4 w-4" />
                      Screenshot
                    </h3>
                    <div>
                      <img 
                        src={selectedReport.screen_shot} 
                        alt="Report screenshot" 
                        className="max-w-full h-auto rounded-lg border shadow-md"
                      />
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-3"
                        onClick={() => window.open(selectedReport.screen_shot, '_blank')}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        View Full Image
                      </Button>
                    </div>
                  </div>
                )}
                
                <Separator />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-medium text-foreground mb-2">Submitted On</h3>
                    <p className="text-muted-foreground text-sm">{formatDate(selectedReport.created_at)}</p>
                  </div>
                  
                  {selectedReport.updated_at !== selectedReport.created_at && (
                    <div>
                      <h3 className="font-medium text-foreground mb-2">Last Updated</h3>
                      <p className="text-muted-foreground text-sm">{formatDate(selectedReport.updated_at)}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Edit Report Dialog */}
      <Dialog open={openEditDialog} onOpenChange={setOpenEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-foreground">
              Edit Report
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Update the details of your report
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="max-h-[60vh] px-1">
            <form onSubmit={handleUpdate} className="space-y-6 py-4">
              {/* Report Type */}
              <div className="space-y-2">
                <Label htmlFor="edit_report_type" className="text-sm font-semibold">
                  Report Type <span className="text-destructive">*</span>
                </Label>
                <Select 
                  value={formData.report_type} 
                  onValueChange={(value) => setFormData({...formData, report_type: value})}
                >
                  <SelectTrigger className="w-full h-12">
                    <SelectValue placeholder="Select report type" />
                  </SelectTrigger>
                  <SelectContent>
                    {REPORT_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-3">
                          <type.icon className="h-4 w-4" />
                          <span className="font-medium">{type.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="edit_title" className="text-sm font-semibold">
                  Title <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="edit_title"
                  name="title"
                  placeholder="Brief title describing your report"
                  value={formData.title}
                  onChange={handleChange}
                  className={`h-12 ${errors.title ? 'border-red-500' : ''}`}
                  disabled={submitting}
                />
                {errors.title && (
                  <p className="text-sm text-red-500">{errors.title}</p>
                )}
              </div>

              {/* Content */}
              <div className="space-y-2">
                <Label htmlFor="edit_content" className="text-sm font-semibold">
                  Description <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="edit_content"
                  name="content"
                  placeholder="Please provide detailed information about your report"
                  value={formData.content}
                  onChange={handleChange}
                  rows={6}
                  className={`resize-none ${errors.content ? 'border-red-500' : ''}`}
                  disabled={submitting}
                />
                {errors.content && (
                  <p className="text-sm text-red-500">{errors.content}</p>
                )}
              </div>

              {/* Screenshot Upload */}
              <div className="space-y-2">
                <Label htmlFor="edit_screen_shot" className="text-sm font-semibold">
                  Screenshot (Optional)
                </Label>
                <div className="space-y-4">
                  {!previewImage ? (
                    <label
                      htmlFor="edit_screen_shot"
                      className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer border-border hover:border-primary/50 hover:bg-primary/5 transition-all duration-300 group"
                    >
                      <div className="flex flex-col items-center justify-center">
                        <Upload className="w-8 h-8 mb-2 text-muted-foreground group-hover:text-primary transition-colors" />
                        <p className="text-sm text-muted-foreground">
                          <span className="font-semibold">Click to upload</span> new screenshot
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">PNG, JPG, GIF (MAX. 5MB)</p>
                      </div>
                      <input
                        id="edit_screen_shot"
                        name="screen_shot"
                        type="file"
                        className="hidden"
                        onChange={handleFileChange}
                        accept="image/*"
                        disabled={submitting}
                      />
                    </label>
                  ) : (
                    <div className="relative">
                      <img 
                        src={previewImage} 
                        alt="Preview" 
                        className="w-full h-auto max-h-60 object-contain rounded-xl border-2 border-border shadow-md"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 rounded-full shadow-lg"
                        onClick={removeImage}
                        disabled={submitting}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setOpenEditDialog(false);
                    setFormData({
                      report_type: 'bug',
                      title: '',
                      content: '',
                      screen_shot: null,
                    });
                    setPreviewImage(null);
                    setRemoveScreenshot(false);
                    setErrors({});
                  }}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Edit className="w-4 h-4 mr-2" />
                      Update Report
                    </>
                  )}
                </Button>
              </div>
            </form>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <Card className="border-2 bg-gradient-to-br from-primary via-primary/95 to-secondary text-white overflow-hidden relative">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl" />
          </div>
          <CardContent className="relative z-10 py-16 px-6 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Need Additional Help?
            </h2>
            <p className="text-lg text-white/90 mb-8 max-w-2xl mx-auto">
              If your issue requires immediate attention or you'd like to speak with our support team directly
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary" className="font-semibold" asChild>
                <Link href="/contact">
                  <MessageSquare className="w-5 h-5 mr-2" />
                  Contact Support
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="bg-white/10 border-white text-white hover:bg-white hover:text-primary font-semibold" asChild>
                <Link href="/courses">
                  <Sparkles className="w-5 h-5 mr-2" />
                  Browse Classes
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
