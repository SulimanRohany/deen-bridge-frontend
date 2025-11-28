'use client'

import { useState, useEffect } from 'react'
import { useDebounce } from '@/hooks/use-debounce'
import Pagination from '@/components/Pagination'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Phone,
  Mail,
  Calendar,
  Users,
  Clock,
  MessageSquare,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Eye,
  Filter,
  Search,
  Download,
  TrendingUp,
  Sparkles,
  ExternalLink,
  X
} from 'lucide-react'
import { toast } from 'sonner'
import * as communicationsAPI from '@/lib/communications-api'

export default function CustomRequestsPage() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [showDetailDialog, setShowDetailDialog] = useState(false)
  const [filterStatus, setFilterStatus] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  
  // Debounce search term to avoid too many API calls
  const debouncedSearchTerm = useDebounce(searchTerm, 500)
  
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    contacted: 0,
    approved: 0,
    rejected: 0
  })

  useEffect(() => {
    fetchRequests()
  }, [debouncedSearchTerm, filterStatus, currentPage, pageSize])

  const fetchRequests = async () => {
    try {
      const token = localStorage.getItem('authTokens')
      if (!token) {
        toast.error('Please login to continue')
        return
      }

      const parsedToken = JSON.parse(token)
      const accessToken = parsedToken.access

      // Use unified communications API
      const params = {
        token: accessToken,
        communication_type: 'custom_request',
        page: currentPage,
        page_size: pageSize,
      }

      if (debouncedSearchTerm) {
        params.search = debouncedSearchTerm
      }
      if (filterStatus !== 'all') {
        params.status = filterStatus
      }

      const data = await communicationsAPI.getCommunications(params)
      
      // Handle paginated response
      if (data.results) {
        setRequests(data.results)
        setTotalCount(data.count)
        setTotalPages(data.total_pages)
        calculateStats(data.results)
      } else {
        setRequests(data)
        setTotalCount(data.length)
        setTotalPages(1)
        calculateStats(data)
      }
    } catch (error) {
      toast.error(error.message || 'Error loading requests')
    } finally {
      setLoading(false)
    }
  }

  // Handle page change
  const handlePageChange = (page) => {
    setCurrentPage(page)
  }

  // Handle page size change
  const handlePageSizeChange = (size) => {
    setPageSize(size)
    setCurrentPage(1) // Reset to first page when changing page size
  }
  
  // Clear all filters
  const clearFilters = () => {
    setFilterStatus('all')
    setSearchTerm('')
    setCurrentPage(1)
  }

  // Check if any filter is active
  const hasActiveFilters = filterStatus !== 'all' || searchTerm !== ''

  // Get active filters for display
  const getActiveFilters = () => {
    const filters = []
    if (filterStatus !== 'all') {
      filters.push({
        type: 'status',
        label: filterStatus.charAt(0).toUpperCase() + filterStatus.slice(1),
        icon: CheckCircle2,
        remove: () => setFilterStatus('all')
      })
    }
    if (searchTerm) {
      filters.push({
        type: 'search',
        label: `Search: "${searchTerm}"`,
        icon: Search,
        remove: () => setSearchTerm('')
      })
    }
    return filters
  }

  const activeFilters = getActiveFilters()

  const calculateStats = (data) => {
    const stats = {
      total: data.length,
      pending: data.filter(r => r.status === 'pending').length,
      contacted: data.filter(r => r.status === 'contacted').length,
      approved: data.filter(r => r.status === 'approved').length,
      rejected: data.filter(r => r.status === 'rejected').length
    }
    setStats(stats)
  }


  const handleUpdateStatus = async (requestId, newStatus) => {
    try {
      const token = localStorage.getItem('authTokens')
      if (!token) {
        toast.error('Please login to continue')
        return
      }

      const parsedToken = JSON.parse(token)
      const accessToken = parsedToken.access

      await communicationsAPI.updateCommunication(requestId, { status: newStatus }, accessToken)
      toast.success('Status updated successfully')
      fetchRequests()
      setShowDetailDialog(false)
    } catch (error) {
      toast.error(error.message || 'Error updating status')
    }
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { variant: 'default', icon: AlertCircle, className: 'bg-orange-500 hover:bg-orange-600' },
      reviewed: { variant: 'default', icon: Eye, className: 'bg-blue-500 hover:bg-blue-600' },
      contacted: { variant: 'default', icon: Phone, className: 'bg-purple-500 hover:bg-purple-600' },
      approved: { variant: 'default', icon: CheckCircle2, className: 'bg-primary hover:bg-primary/90' },
      completed: { variant: 'default', icon: CheckCircle2, className: 'bg-secondary hover:bg-secondary/90' },
      rejected: { variant: 'destructive', icon: XCircle, className: '' }
    }

    const config = statusConfig[status] || statusConfig.pending
    const Icon = config.icon

    return (
      <Badge variant={config.variant} className={`${config.className} text-white flex items-center gap-1 w-fit`}>
        <Icon className="h-3 w-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleWhatsAppContact = (phone, name, courseType) => {
    const message = `Hello ${name}, regarding your custom course request for '${courseType}'. We received it and will get back to you shortly.`
    const encodedMessage = encodeURIComponent(message)
    window.open(`https://wa.me/${phone}?text=${encodedMessage}`, '_blank')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-muted-foreground">Loading requests...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            Custom Course Requests
          </h1>
          <p className="text-muted-foreground mt-2">Manage and respond to custom course requests</p>
        </div>
        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Export Data
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="border-2 hover:border-primary/50 transition-colors">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Total Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-black">{stats.total}</p>
            <div className="flex items-center gap-1 mt-2 text-xs text-primary">
              <TrendingUp className="h-3 w-3" />
              <span>All time</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 hover:border-orange-500/50 transition-colors">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-black text-orange-500">{stats.pending}</p>
            <p className="text-xs text-muted-foreground mt-2">Needs attention</p>
          </CardContent>
        </Card>

        <Card className="border-2 hover:border-purple-500/50 transition-colors">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Contacted</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-black text-purple-500">{stats.contacted}</p>
            <p className="text-xs text-muted-foreground mt-2">In progress</p>
          </CardContent>
        </Card>

        <Card className="border-2 hover:border-primary/50 transition-colors">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Approved</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-black text-primary">{stats.approved}</p>
            <p className="text-xs text-muted-foreground mt-2">Success</p>
          </CardContent>
        </Card>

        <Card className="border-2 hover:border-red-500/50 transition-colors">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Rejected</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-black text-red-500">{stats.rejected}</p>
            <p className="text-xs text-muted-foreground mt-2">Declined</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter Section */}
      <div className="mb-6 flex flex-col lg:flex-row gap-3">
        {/* Search Bar */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-10"
          />
        </div>

        {/* Filters Container */}
        <div className="flex flex-wrap lg:flex-nowrap items-center gap-2">
          {/* Status Filter */}
          <Select value={filterStatus} onValueChange={(value) => { setFilterStatus(value); setCurrentPage(1); }}>
            <SelectTrigger className={`w-full lg:w-[180px] !h-10 ${filterStatus !== 'all' ? 'border-primary bg-primary/5' : ''}`}>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                <SelectValue placeholder="Status" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="reviewed">Reviewed</SelectItem>
              <SelectItem value="contacted">Contacted</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
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
            const IconComponent = filter.icon
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
            )
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

      {/* Requests Table */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle>All Requests ({requests.length})</CardTitle>
          <CardDescription>Click on any request to view details and manage</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[60px]">#</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Course Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2">
                        <AlertCircle className="h-8 w-8 text-muted-foreground" />
                        <p className="text-muted-foreground">No requests found</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  requests.map((request, index) => (
                    <TableRow key={request.id} className="cursor-pointer hover:bg-muted/50">
                      <TableCell className="font-medium">{index + 1}</TableCell>
                      <TableCell className="font-medium">{request.name}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="h-3 w-3" />
                            <span className="text-muted-foreground">{request.email}</span>
                          </div>
                          {request.phone && (
                            <div className="flex items-center gap-2 text-sm">
                              <Phone className="h-3 w-3" />
                              <span className="text-muted-foreground">{request.phone}</span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {request.course_type || 'N/A'}
                        </Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(request.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {formatDate(request.created_at)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedRequest(request)
                            setShowDetailDialog(true)
                          }}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          
          {/* Pagination Component */}
          {totalCount > 0 && (
            <div className="mt-4">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalCount={totalCount}
                pageSize={pageSize}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
                label="Requests"
                pageSizeOptions={[5, 10, 20, 50]}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      {selectedRequest && (
        <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
          <DialogContent className="max-w-[85vw] w-full max-h-[95vh] overflow-hidden flex flex-col p-0 gap-0">
            <DialogHeader className="px-8 py-6 border-b flex-shrink-0">
              <div className="flex items-start justify-between">
                <div>
                  <DialogTitle className="text-3xl font-black">{selectedRequest.name}</DialogTitle>
                  <DialogDescription className="flex items-center gap-2 mt-2">
                    <Calendar className="h-4 w-4" />
                    Submitted on {formatDate(selectedRequest.created_at)}
                  </DialogDescription>
                </div>
                {getStatusBadge(selectedRequest.status)}
              </div>
            </DialogHeader>

            <div className="overflow-y-auto flex-1 min-h-0">
              <Tabs defaultValue="details" className="w-full h-full flex flex-col">
                <TabsList className="grid w-full grid-cols-2 mx-8 mt-6 flex-shrink-0">
                  <TabsTrigger value="details">Request Details</TabsTrigger>
                  <TabsTrigger value="actions">Actions & Status</TabsTrigger>
                </TabsList>

                <TabsContent value="details" className="space-y-6 px-8 py-6 overflow-y-auto">
                  {/* Contact Information */}
                  <div className="space-y-4">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Contact Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="rounded-lg border p-4 space-y-2">
                        <Label className="text-sm text-muted-foreground">Email</Label>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-primary" />
                          <a href={`mailto:${selectedRequest.email}`} className="font-medium hover:underline">
                            {selectedRequest.email}
                          </a>
                        </div>
                      </div>
                      {selectedRequest.phone && (
                        <div className="rounded-lg border p-4 space-y-2">
                          <Label className="text-sm text-muted-foreground">Phone</Label>
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-primary" />
                            <a href={`tel:${selectedRequest.phone}`} className="font-medium hover:underline">
                              {selectedRequest.phone}
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Course Details */}
                  <div className="space-y-4">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                      <Sparkles className="h-5 w-5" />
                      Course Details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="rounded-lg border p-4 space-y-2">
                        <Label className="text-sm text-muted-foreground">Course Type</Label>
                        <p className="font-semibold capitalize">{selectedRequest.course_type || 'Not specified'}</p>
                      </div>
                      <div className="rounded-lg border p-4 space-y-2">
                        <Label className="text-sm text-muted-foreground">Number of Students</Label>
                        <p className="font-semibold">{selectedRequest.number_of_students || 'Not specified'}</p>
                      </div>
                      <div className="rounded-lg border p-4 space-y-2">
                        <Label className="text-sm text-muted-foreground">Preferred Schedule</Label>
                        <p className="font-semibold capitalize">{selectedRequest.preferred_schedule || 'Not specified'}</p>
                      </div>
                      <div className="rounded-lg border p-4 space-y-2">
                        <Label className="text-sm text-muted-foreground">Subjects of Interest</Label>
                        <p className="font-semibold">{selectedRequest.subjects || 'Not specified'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Message */}
                  {selectedRequest.message && (
                    <div className="space-y-4">
                      <h3 className="text-xl font-bold flex items-center gap-2">
                        <MessageSquare className="h-5 w-5" />
                        Additional Message
                      </h3>
                      <div className="rounded-lg border p-4 bg-muted/30">
                        <p className="text-foreground whitespace-pre-wrap">{selectedRequest.message}</p>
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="actions" className="space-y-6 px-8 py-6 overflow-y-auto">
                  {/* Status Update */}
                  <div className="space-y-4">
                    <h3 className="text-xl font-bold">Update Status</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      <Button
                        variant="outline"
                        onClick={() => handleUpdateStatus(selectedRequest.id, 'reviewed')}
                        className="h-auto py-4 flex flex-col items-center gap-2 hover:border-blue-500 hover:text-blue-500"
                      >
                        <Eye className="h-6 w-6" />
                        <span className="font-semibold">Reviewed</span>
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleUpdateStatus(selectedRequest.id, 'contacted')}
                        className="h-auto py-4 flex flex-col items-center gap-2 hover:border-purple-500 hover:text-purple-500"
                      >
                        <Phone className="h-6 w-6" />
                        <span className="font-semibold">Contacted</span>
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleUpdateStatus(selectedRequest.id, 'approved')}
                        className="h-auto py-4 flex flex-col items-center gap-2 hover:border-primary hover:text-primary"
                      >
                        <CheckCircle2 className="h-6 w-6" />
                        <span className="font-semibold">Approved</span>
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleUpdateStatus(selectedRequest.id, 'completed')}
                        className="h-auto py-4 flex flex-col items-center gap-2 hover:border-secondary hover:text-secondary"
                      >
                        <CheckCircle2 className="h-6 w-6" />
                        <span className="font-semibold">Completed</span>
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleUpdateStatus(selectedRequest.id, 'rejected')}
                        className="h-auto py-4 flex flex-col items-center gap-2 hover:border-red-500 hover:text-red-500"
                      >
                        <XCircle className="h-6 w-6" />
                        <span className="font-semibold">Rejected</span>
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleUpdateStatus(selectedRequest.id, 'pending')}
                        className="h-auto py-4 flex flex-col items-center gap-2 hover:border-orange-500 hover:text-orange-500"
                      >
                        <AlertCircle className="h-6 w-6" />
                        <span className="font-semibold">Pending</span>
                      </Button>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="space-y-4">
                    <h3 className="text-xl font-bold">Quick Actions</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Button
                        variant="default"
                        size="lg"
                        onClick={() => handleWhatsAppContact(selectedRequest.phone, selectedRequest.name, selectedRequest.course_type)}
                        className="h-auto py-4 bg-primary hover:bg-primary/90"
                      >
                        <Phone className="h-5 w-5 mr-2" />
                        <div className="text-left">
                          <p className="font-bold">Contact on WhatsApp</p>
                          <p className="text-xs opacity-80">Send message directly</p>
                        </div>
                        <ExternalLink className="h-4 w-4 ml-auto" />
                      </Button>

                      <Button
                        variant="default"
                        size="lg"
                        onClick={() => window.location.href = `mailto:${selectedRequest.email}`}
                        className="h-auto py-4"
                      >
                        <Mail className="h-5 w-5 mr-2" />
                        <div className="text-left">
                          <p className="font-bold">Send Email</p>
                          <p className="text-xs opacity-80">Open email client</p>
                        </div>
                        <ExternalLink className="h-4 w-4 ml-auto" />
                      </Button>
                    </div>
                  </div>

                  {/* Response Time */}
                  {selectedRequest.response_time && (
                    <div className="rounded-lg border bg-primary/5 p-4">
                      <div className="flex items-center gap-3">
                        <Clock className="h-5 w-5 text-primary" />
                        <div>
                          <p className="font-semibold">Response Time</p>
                          <p className="text-sm text-muted-foreground">
                            Responded in {selectedRequest.response_time}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
