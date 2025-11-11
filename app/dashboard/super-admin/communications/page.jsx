'use client'

import { useState, useEffect } from 'react'
import { useDebounce } from '@/hooks/use-debounce'
import Pagination from '@/components/Pagination'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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
  MessageSquare,
  Eye,
  Filter,
  Search,
  Download,
  TrendingUp,
  Bug,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Sparkles,
  X,
  Users,
  Lightbulb,
  HelpCircle,
  AlertTriangle,
} from 'lucide-react'
import { toast } from 'sonner'
import * as communicationsAPI from '@/lib/communications-api'

export default function UnifiedCommunicationsPage() {
  const [communications, setCommunications] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedItem, setSelectedItem] = useState(null)
  const [showDetailDialog, setShowDetailDialog] = useState(false)
  const [activeTab, setActiveTab] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  
  // Debounce search term
  const debouncedSearchTerm = useDebounce(searchTerm, 500)
  
  const [stats, setStats] = useState({
    overall: { total: 0, pending: 0 },
    by_type: { custom_requests: 0, contact_messages: 0, reports: 0 }
  })

  useEffect(() => {
    fetchCommunications()
    fetchStats()
  }, [debouncedSearchTerm, filterStatus, activeTab, currentPage, pageSize])

  const fetchCommunications = async () => {
    try {
      const token = localStorage.getItem('authTokens')
      if (!token) {
        toast.error('Please login to continue')
        return
      }

      const parsedToken = JSON.parse(token)
      const accessToken = parsedToken.access

      const params = {
        token: accessToken,
        page: currentPage,
        page_size: pageSize,
      }

      // Filter by tab
      if (activeTab !== 'all') {
        params.communication_type = activeTab
      }

      if (debouncedSearchTerm) {
        params.search = debouncedSearchTerm
      }
      if (filterStatus !== 'all') {
        params.status = filterStatus
      }

      const data = await communicationsAPI.getCommunications(params)
      
      if (data.results) {
        setCommunications(data.results)
        setTotalCount(data.count)
        setTotalPages(data.total_pages)
      } else {
        setCommunications(data)
        setTotalCount(data.length)
        setTotalPages(1)
      }
    } catch (error) {
      console.error('Error fetching communications:', error)
      toast.error(error.message || 'Error loading communications')
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('authTokens')
      if (!token) return

      const parsedToken = JSON.parse(token)
      const accessToken = parsedToken.access

      const data = await communicationsAPI.getCommunicationStats(accessToken)
      setStats(data)
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      const token = localStorage.getItem('authTokens')
      if (!token) return

      const parsedToken = JSON.parse(token)
      const accessToken = parsedToken.access

      await communicationsAPI.updateCommunication(id, { status: newStatus }, accessToken)
      toast.success('Status updated successfully')
      fetchCommunications()
      fetchStats()
      setShowDetailDialog(false)
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error(error.message || 'Error updating status')
    }
  }

  const handlePageChange = (page) => {
    setCurrentPage(page)
  }

  const handlePageSizeChange = (size) => {
    setPageSize(size)
    setCurrentPage(1)
  }

  const clearFilters = () => {
    setFilterStatus('all')
    setSearchTerm('')
    setCurrentPage(1)
  }

  const hasActiveFilters = filterStatus !== 'all' || searchTerm !== ''

  const getActiveFilters = () => {
    const filters = []
    if (filterStatus !== 'all') {
      filters.push({
        label: `Status: ${filterStatus}`,
        remove: () => setFilterStatus('all')
      })
    }
    if (searchTerm) {
      filters.push({
        label: `Search: "${searchTerm}"`,
        remove: () => setSearchTerm('')
      })
    }
    return filters
  }

  const activeFilters = getActiveFilters()

  const getCommunicationTypeIcon = (type) => {
    switch (type) {
      case 'custom_request':
        return <Sparkles className="h-4 w-4" />
      case 'contact_message':
        return <MessageSquare className="h-4 w-4" />
      case 'report':
        return <Bug className="h-4 w-4" />
      default:
        return <MessageSquare className="h-4 w-4" />
    }
  }

  const getCommunicationTypeBadge = (type, display) => {
    const colors = {
      custom_request: 'bg-blue-500 hover:bg-blue-600',
      contact_message: 'bg-green-500 hover:bg-green-600',
      report: 'bg-red-500 hover:bg-red-600',
    }

    return (
      <Badge className={`${colors[type]} text-white flex items-center gap-1 w-fit`}>
        {getCommunicationTypeIcon(type)}
        {display}
      </Badge>
    )
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { className: 'bg-orange-500 hover:bg-orange-600', icon: AlertCircle },
      new: { className: 'bg-blue-500 hover:bg-blue-600', icon: AlertCircle },
      read: { className: 'bg-purple-500 hover:bg-purple-600', icon: Eye },
      reviewed: { className: 'bg-indigo-500 hover:bg-indigo-600', icon: Eye },
      contacted: { className: 'bg-violet-500 hover:bg-violet-600', icon: Phone },
      replied: { className: 'bg-cyan-500 hover:bg-cyan-600', icon: MessageSquare },
      approved: { className: 'bg-primary hover:bg-primary/90', icon: CheckCircle2 },
      rejected: { className: 'bg-red-500 hover:bg-red-600', icon: XCircle },
      completed: { className: 'bg-gray-500 hover:bg-gray-600', icon: CheckCircle2 },
      closed: { className: 'bg-gray-400 hover:bg-gray-500', icon: XCircle },
      resolved: { className: 'bg-green-500 hover:bg-green-600', icon: CheckCircle2 }
    }

    const config = statusConfig[status] || statusConfig.pending
    const Icon = config.icon

    return (
      <Badge className={`${config.className} text-white flex items-center gap-1 w-fit`}>
        <Icon className="h-3 w-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const formatDate = (dateString, options = {}) => {
    const { showRelative = false, includeSeconds = false } = options
    const date = new Date(dateString)
    const now = new Date()
    
    // Calculate time difference for relative display
    if (showRelative) {
      const diffInSeconds = Math.floor((now - date) / 1000)
      const diffInMinutes = Math.floor(diffInSeconds / 60)
      const diffInHours = Math.floor(diffInMinutes / 60)
      const diffInDays = Math.floor(diffInHours / 24)
      
      // Show relative time for recent items
      if (diffInMinutes < 1) {
        return 'Just now'
      } else if (diffInMinutes < 60) {
        return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`
      } else if (diffInHours < 24) {
        return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`
      } else if (diffInDays < 7) {
        return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`
      }
    }
    
    // Format absolute time with user's local timezone
    const formatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short' // Shows timezone abbreviation like "PST", "EST", etc.
    }
    
    if (includeSeconds) {
      formatOptions.second = '2-digit'
    }
    
    // Use undefined to detect user's locale automatically
    return date.toLocaleString(undefined, formatOptions)
  }
  
  const formatDateWithTooltip = (dateString) => {
    // Full format for tooltip
    const date = new Date(dateString)
    return date.toLocaleString(undefined, {
      dateStyle: 'full',
      timeStyle: 'long'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-muted-foreground">Loading communications...</p>
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
              <MessageSquare className="h-6 w-6 text-white" />
            </div>
            User Communications
          </h1>
          <p className="text-muted-foreground mt-2">Manage all user-to-admin communications in one place</p>
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
            <CardTitle className="text-sm font-semibold text-muted-foreground">Total Communications</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-black">{stats.overall?.total || 0}</p>
            <div className="flex items-center gap-1 mt-2 text-xs text-primary">
              <TrendingUp className="h-3 w-3" />
              <span>All types</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 hover:border-orange-500/50 transition-colors">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-black text-orange-500">{stats.overall?.pending || 0}</p>
            <p className="text-xs text-muted-foreground mt-2">Needs attention</p>
          </CardContent>
        </Card>

        <Card className="border-2 hover:border-blue-500/50 transition-colors">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Course Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-black text-blue-500">{stats.by_type?.custom_requests || 0}</p>
            <p className="text-xs text-muted-foreground mt-2">Custom courses</p>
          </CardContent>
        </Card>

        <Card className="border-2 hover:border-green-500/50 transition-colors">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Contact Messages</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-black text-green-500">{stats.by_type?.contact_messages || 0}</p>
            <p className="text-xs text-muted-foreground mt-2">General inquiries</p>
          </CardContent>
        </Card>

        <Card className="border-2 hover:border-red-500/50 transition-colors">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-black text-red-500">{stats.by_type?.reports || 0}</p>
            <p className="text-xs text-muted-foreground mt-2">User reports</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter Section */}
      <div className="mb-6 flex flex-col lg:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search across all communications..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-10"
          />
        </div>

        <div className="flex flex-wrap lg:flex-nowrap items-center gap-2">
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
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="read">Read</SelectItem>
              <SelectItem value="reviewed">Reviewed</SelectItem>
              <SelectItem value="contacted">Contacted</SelectItem>
              <SelectItem value="replied">Replied</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
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
          {activeFilters.map((filter, index) => (
            <div
              key={index}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium border border-primary/20"
            >
              <span>{filter.label}</span>
              <button
                onClick={filter.remove}
                className="ml-1 hover:bg-primary/30 rounded-full p-0.5"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="h-7 text-xs text-muted-foreground hover:text-destructive"
          >
            Clear All
          </Button>
        </div>
      )}

      {/* Tabs for Communication Types */}
      <Tabs value={activeTab} onValueChange={(value) => { setActiveTab(value); setCurrentPage(1); }} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">All ({stats.overall?.total || 0})</TabsTrigger>
          <TabsTrigger value="custom_request">Course Requests ({stats.by_type?.custom_requests || 0})</TabsTrigger>
          <TabsTrigger value="contact_message">Messages ({stats.by_type?.contact_messages || 0})</TabsTrigger>
          <TabsTrigger value="report">Reports ({stats.by_type?.reports || 0})</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          <Card className="border-2">
            <CardHeader>
              <CardTitle>Communications ({totalCount})</CardTitle>
              <CardDescription>Click on any item to view details and manage</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[60px]">#</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Subject/Title</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {communications.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8">
                          <div className="flex flex-col items-center gap-2">
                            <AlertCircle className="h-8 w-8 text-muted-foreground" />
                            <p className="text-muted-foreground">No communications found</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      communications.map((item, index) => (
                        <TableRow key={item.id} className="cursor-pointer hover:bg-muted/50">
                          <TableCell className="font-medium">{(currentPage - 1) * pageSize + index + 1}</TableCell>
                          <TableCell>
                            {getCommunicationTypeBadge(item.communication_type, item.communication_type_display)}
                          </TableCell>
                          <TableCell className="font-medium">{item.name}</TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 text-sm">
                                <Mail className="h-3 w-3" />
                                <span className="text-muted-foreground truncate max-w-[200px]">{item.email}</span>
                              </div>
                              {item.phone && (
                                <div className="flex items-center gap-2 text-sm">
                                  <Phone className="h-3 w-3" />
                                  <span className="text-muted-foreground">{item.phone}</span>
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="font-medium">{item.subject || item.title || '-'}</span>
                          </TableCell>
                          <TableCell>{getStatusBadge(item.status)}</TableCell>
                          <TableCell>
                            <div 
                              className="flex items-center gap-2 text-sm text-muted-foreground"
                              title={formatDateWithTooltip(item.created_at)}
                            >
                              <Calendar className="h-3 w-3" />
                              {formatDate(item.created_at, { showRelative: true })}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedItem(item)
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

              {/* Pagination */}
              {totalCount > 0 && (
                <div className="mt-4">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalCount={totalCount}
                    pageSize={pageSize}
                    onPageChange={handlePageChange}
                    onPageSizeChange={handlePageSizeChange}
                    label="Communications"
                    pageSizeOptions={[5, 10, 20, 50]}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Custom Course Request Dialog */}
      {selectedItem && selectedItem.communication_type === 'custom_request' && (
        <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
          <DialogContent className="max-w-[90vw] max-h-[85vh] overflow-hidden flex flex-col p-0 gap-0">
            {/* Header */}
            <div className="px-6 py-4 border-b bg-gradient-to-r from-background to-muted/20">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center flex-shrink-0 ring-4 ring-primary/5">
                    <Sparkles className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <DialogTitle className="text-2xl font-bold mb-1">Custom Course Request</DialogTitle>
                    <DialogDescription 
                      className="flex items-center gap-2 text-sm"
                      title={formatDateWithTooltip(selectedItem.created_at)}
                    >
                      <Calendar className="h-3.5 w-3.5" />
                      {formatDate(selectedItem.created_at)}
                    </DialogDescription>
                  </div>
                </div>
                {getStatusBadge(selectedItem.status)}
              </div>
            </div>

            {/* Content */}
            <div className="overflow-y-auto flex-1 p-6 space-y-6">
              {/* Contact Card */}
              <div className="rounded-xl border-2 bg-card overflow-hidden">
                <div className="bg-muted/50 px-4 py-2.5 border-b">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" />
                    <h3 className="text-sm font-semibold">Contact Information</h3>
                  </div>
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Users className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground mb-0.5">Full Name</p>
                        <p className="font-semibold truncate">{selectedItem.name}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Mail className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground mb-0.5">Email</p>
                        <a href={`mailto:${selectedItem.email}`} className="font-medium text-primary hover:underline text-sm truncate block">
                          {selectedItem.email}
                        </a>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Phone className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground mb-0.5">Phone</p>
                        <a href={`tel:${selectedItem.phone}`} className="font-medium text-primary hover:underline text-sm truncate block">
                          {selectedItem.phone || 'Not provided'}
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Course Requirements Card */}
              <div className="rounded-xl border-2 bg-card overflow-hidden">
                <div className="bg-muted/50 px-4 py-2.5 border-b">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <h3 className="text-sm font-semibold">Course Requirements</h3>
                  </div>
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg bg-muted/30 border">
                      <p className="text-xs text-muted-foreground mb-1.5">Course Type</p>
                      <p className="font-semibold text-sm">{selectedItem.course_type_display || 'Not specified'}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/30 border">
                      <p className="text-xs text-muted-foreground mb-1.5">Number of Students</p>
                      <p className="font-semibold text-sm">{selectedItem.number_of_students || 'Not specified'}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/30 border">
                      <p className="text-xs text-muted-foreground mb-1.5">Preferred Schedule</p>
                      <p className="font-semibold text-sm">{selectedItem.preferred_schedule_display || 'Not specified'}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/30 border">
                      <p className="text-xs text-muted-foreground mb-1.5">Subjects of Interest</p>
                      <p className="font-semibold text-sm">{selectedItem.subjects || 'Not specified'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Additional Message */}
              {selectedItem.message && (
                <div className="rounded-xl border-2 bg-card overflow-hidden">
                  <div className="bg-muted/50 px-4 py-2.5 border-b">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-primary" />
                      <h3 className="text-sm font-semibold">Additional Information</h3>
                    </div>
                  </div>
                  <div className="p-4">
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{selectedItem.message}</p>
                  </div>
                </div>
              )}

              {/* Admin Notes */}
              {selectedItem.admin_notes && (
                <div className="rounded-xl border-2 border-amber-200 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-950/20 overflow-hidden">
                  <div className="bg-amber-100/50 dark:bg-amber-900/20 px-4 py-2.5 border-b border-amber-200 dark:border-amber-900">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-500" />
                      <h3 className="text-sm font-semibold text-amber-900 dark:text-amber-100">Admin Notes</h3>
                    </div>
                  </div>
                  <div className="p-4">
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-amber-900 dark:text-amber-100">{selectedItem.admin_notes}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="px-6 py-4 border-t bg-muted/20 flex-shrink-0">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                {/* Quick Actions */}
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    className="gap-2 shadow-sm hover:shadow"
                    onClick={() => window.location.href = `mailto:${selectedItem.email}?subject=Regarding your custom course request`}
                  >
                    <Mail className="h-4 w-4" />
                    Send Email
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-2 hover:bg-green-50 hover:text-green-700 hover:border-green-300 dark:hover:bg-green-950 dark:hover:text-green-300"
                    onClick={() => window.open(`https://wa.me/${selectedItem.phone?.replace(/\D/g, '')}?text=Hello ${selectedItem.name}, regarding your custom course request...`, '_blank')}
                  >
                    <Phone className="h-4 w-4" />
                    WhatsApp
                  </Button>
                </div>

                {/* Status Management */}
                <div className="flex flex-wrap gap-1.5">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleUpdateStatus(selectedItem.id, 'reviewed')}
                    className="gap-1.5 h-8 px-3 hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-blue-950 dark:hover:text-blue-300"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    <span className="text-xs font-medium">Reviewed</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleUpdateStatus(selectedItem.id, 'contacted')}
                    className="gap-1.5 h-8 px-3 hover:bg-purple-50 hover:text-purple-700 dark:hover:bg-purple-950 dark:hover:text-purple-300"
                  >
                    <Phone className="h-3.5 w-3.5" />
                    <span className="text-xs font-medium">Contacted</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleUpdateStatus(selectedItem.id, 'approved')}
                    className="gap-1.5 h-8 px-3 hover:bg-green-50 hover:text-green-700 dark:hover:bg-green-950 dark:hover:text-green-300"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span className="text-xs font-medium">Approve</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleUpdateStatus(selectedItem.id, 'rejected')}
                    className="gap-1.5 h-8 px-3 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950 dark:hover:text-red-300"
                  >
                    <XCircle className="h-3.5 w-3.5" />
                    <span className="text-xs font-medium">Reject</span>
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Contact Message Dialog */}
      {selectedItem && selectedItem.communication_type === 'contact_message' && (
        <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
          <DialogContent className="max-w-[90vw] max-h-[85vh] overflow-hidden flex flex-col p-0 gap-0">
            {/* Header */}
            <div className="px-6 py-4 border-b bg-gradient-to-r from-background to-muted/20">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center flex-shrink-0 ring-4 ring-primary/5">
                    <MessageSquare className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <DialogTitle className="text-2xl font-bold mb-1">Contact Message</DialogTitle>
                    <DialogDescription 
                      className="flex items-center gap-2 text-sm"
                      title={formatDateWithTooltip(selectedItem.created_at)}
                    >
                      <Calendar className="h-3.5 w-3.5" />
                      {formatDate(selectedItem.created_at)}
                    </DialogDescription>
                  </div>
                </div>
                {getStatusBadge(selectedItem.status)}
              </div>
            </div>

            {/* Content */}
            <div className="overflow-y-auto flex-1 p-6 space-y-6">
              {/* Sender Information Card */}
              <div className="rounded-xl border-2 bg-card overflow-hidden">
                <div className="bg-muted/50 px-4 py-2.5 border-b">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" />
                    <h3 className="text-sm font-semibold">Sender Information</h3>
                  </div>
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Users className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground mb-0.5">Full Name</p>
                        <p className="font-semibold truncate">{selectedItem.name}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Mail className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground mb-0.5">Email</p>
                        <a href={`mailto:${selectedItem.email}`} className="font-medium text-primary hover:underline text-sm truncate block">
                          {selectedItem.email}
                        </a>
                      </div>
                    </div>
                    {selectedItem.phone && (
                      <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Phone className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-muted-foreground mb-0.5">Phone</p>
                          <a href={`tel:${selectedItem.phone}`} className="font-medium text-primary hover:underline text-sm truncate block">
                            {selectedItem.phone}
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Subject */}
              {selectedItem.subject && (
                <div className="rounded-xl border-2 bg-card overflow-hidden">
                  <div className="bg-muted/50 px-4 py-2.5 border-b">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-primary" />
                      <h3 className="text-sm font-semibold">Subject</h3>
                    </div>
                  </div>
                  <div className="p-4">
                    <p className="font-semibold text-base">{selectedItem.subject}</p>
                  </div>
                </div>
              )}

              {/* Message Content */}
              {selectedItem.message && (
                <div className="rounded-xl border-2 bg-card overflow-hidden">
                  <div className="bg-muted/50 px-4 py-2.5 border-b">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-primary" />
                      <h3 className="text-sm font-semibold">Message</h3>
                    </div>
                  </div>
                  <div className="p-4">
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{selectedItem.message}</p>
                  </div>
                </div>
              )}

              {/* Tracking Information */}
              {(selectedItem.ip_address || selectedItem.user_agent) && (
                <div className="rounded-xl border-2 bg-card overflow-hidden">
                  <div className="bg-muted/50 px-4 py-2.5 border-b">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-primary" />
                      <h3 className="text-sm font-semibold">Tracking Information</h3>
                    </div>
                  </div>
                  <div className="p-4 space-y-3">
                    {selectedItem.ip_address && (
                      <div className="p-3 rounded-lg bg-muted/30 border">
                        <p className="text-xs text-muted-foreground mb-1.5">IP Address</p>
                        <p className="font-mono text-sm">{selectedItem.ip_address}</p>
                      </div>
                    )}
                    {selectedItem.user_agent && (
                      <div className="p-3 rounded-lg bg-muted/30 border">
                        <p className="text-xs text-muted-foreground mb-1.5">User Agent</p>
                        <p className="font-mono text-xs break-all text-muted-foreground">{selectedItem.user_agent}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="px-6 py-4 border-t bg-muted/20 flex-shrink-0">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                {/* Quick Actions */}
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    className="gap-2 shadow-sm hover:shadow"
                    onClick={() => window.location.href = `mailto:${selectedItem.email}?subject=Re: ${selectedItem.subject}`}
                  >
                    <Mail className="h-4 w-4" />
                    Reply via Email
                  </Button>
                  {selectedItem.phone && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-2 hover:bg-green-50 hover:text-green-700 hover:border-green-300 dark:hover:bg-green-950 dark:hover:text-green-300"
                      onClick={() => window.open(`https://wa.me/${selectedItem.phone?.replace(/\D/g, '')}`, '_blank')}
                    >
                      <Phone className="h-4 w-4" />
                      WhatsApp
                    </Button>
                  )}
                </div>

                {/* Status Management */}
                <div className="flex flex-wrap gap-1.5">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleUpdateStatus(selectedItem.id, 'new')}
                    className="gap-1.5 h-8 px-3 hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-blue-950 dark:hover:text-blue-300"
                  >
                    <AlertCircle className="h-3.5 w-3.5" />
                    <span className="text-xs font-medium">New</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleUpdateStatus(selectedItem.id, 'read')}
                    className="gap-1.5 h-8 px-3 hover:bg-purple-50 hover:text-purple-700 dark:hover:bg-purple-950 dark:hover:text-purple-300"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    <span className="text-xs font-medium">Read</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleUpdateStatus(selectedItem.id, 'replied')}
                    className="gap-1.5 h-8 px-3 hover:bg-green-50 hover:text-green-700 dark:hover:bg-green-950 dark:hover:text-green-300"
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                    <span className="text-xs font-medium">Replied</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleUpdateStatus(selectedItem.id, 'closed')}
                    className="gap-1.5 h-8 px-3 hover:bg-gray-50 hover:text-gray-700 dark:hover:bg-gray-950 dark:hover:text-gray-300"
                  >
                    <XCircle className="h-3.5 w-3.5" />
                    <span className="text-xs font-medium">Closed</span>
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Report Dialog */}
      {selectedItem && selectedItem.communication_type === 'report' && (
        <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
          <DialogContent className="max-w-[90vw] max-h-[85vh] overflow-hidden flex flex-col p-0 gap-0">
            {/* Header */}
            <div className="px-6 py-4 border-b bg-gradient-to-r from-background to-muted/20">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-destructive/20 to-destructive/10 flex items-center justify-center flex-shrink-0 ring-4 ring-destructive/5">
                    <Bug className="h-6 w-6 text-destructive" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <DialogTitle className="text-2xl font-bold mb-1">User Report</DialogTitle>
                    <DialogDescription 
                      className="flex items-center gap-2 text-sm"
                      title={formatDateWithTooltip(selectedItem.created_at)}
                    >
                      <Calendar className="h-3.5 w-3.5" />
                      {formatDate(selectedItem.created_at)}
                    </DialogDescription>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2">
                  {getStatusBadge(selectedItem.status)}
                  {selectedItem.is_resolved && (
                    <Badge className="bg-green-500 text-white shadow-sm">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Resolved
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="overflow-y-auto flex-1 p-6 space-y-6">
              {/* Reporter Information Card */}
              <div className="rounded-xl border-2 bg-card overflow-hidden">
                <div className="bg-muted/50 px-4 py-2.5 border-b">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" />
                    <h3 className="text-sm font-semibold">Reporter Information</h3>
                  </div>
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Users className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground mb-0.5">Name</p>
                        <p className="font-semibold truncate">{selectedItem.name}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Mail className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground mb-0.5">Email</p>
                        <a href={`mailto:${selectedItem.email}`} className="font-medium text-primary hover:underline text-sm truncate block">
                          {selectedItem.email}
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Report Details Card */}
              <div className="rounded-xl border-2 bg-card overflow-hidden">
                <div className="bg-muted/50 px-4 py-2.5 border-b">
                  <div className="flex items-center gap-2">
                    <Bug className="h-4 w-4 text-primary" />
                    <h3 className="text-sm font-semibold">Report Details</h3>
                  </div>
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg bg-muted/30 border">
                      <p className="text-xs text-muted-foreground mb-1.5">Report Type</p>
                      <p className="font-semibold text-sm">{selectedItem.report_type_display || 'Not specified'}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/30 border">
                      <p className="text-xs text-muted-foreground mb-1.5">Resolution Status</p>
                      <div className="flex items-center gap-2">
                        {selectedItem.is_resolved ? (
                          <Badge className="bg-green-500/10 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Resolved
                          </Badge>
                        ) : (
                          <Badge className="bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Pending
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Report Title */}
              {selectedItem.title && (
                <div className="rounded-xl border-2 bg-card overflow-hidden">
                  <div className="bg-muted/50 px-4 py-2.5 border-b">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-primary" />
                      <h3 className="text-sm font-semibold">Title</h3>
                    </div>
                  </div>
                  <div className="p-4">
                    <p className="font-semibold text-base">{selectedItem.title}</p>
                  </div>
                </div>
              )}

              {/* Report Description */}
              {selectedItem.message && (
                <div className="rounded-xl border-2 bg-card overflow-hidden">
                  <div className="bg-muted/50 px-4 py-2.5 border-b">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-primary" />
                      <h3 className="text-sm font-semibold">Description</h3>
                    </div>
                  </div>
                  <div className="p-4">
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{selectedItem.message}</p>
                  </div>
                </div>
              )}

              {/* Screenshot */}
              {selectedItem.screen_shot && (
                <div className="rounded-xl border-2 bg-card overflow-hidden">
                  <div className="bg-muted/50 px-4 py-2.5 border-b">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Download className="h-4 w-4 text-primary" />
                        <h3 className="text-sm font-semibold">Screenshot</h3>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="gap-1.5 h-7 text-xs"
                        onClick={() => window.open(selectedItem.screen_shot, '_blank')}
                      >
                        <Download className="h-3 w-3" />
                        Download
                      </Button>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="rounded-lg border overflow-hidden bg-muted/20 cursor-pointer hover:bg-muted/40 transition-colors" onClick={() => window.open(selectedItem.screen_shot, '_blank')}>
                      <img
                        src={selectedItem.screen_shot}
                        alt="Report screenshot"
                        className="w-full h-auto"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-2 text-center">Click image to view full size</p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="px-6 py-4 border-t bg-muted/20 flex-shrink-0">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                {/* Contact Reporter */}
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    className="gap-2 shadow-sm hover:shadow"
                    onClick={() => window.location.href = `mailto:${selectedItem.email}?subject=Regarding your report: ${selectedItem.title}`}
                  >
                    <Mail className="h-4 w-4" />
                    Contact Reporter
                  </Button>
                </div>

                {/* Status Management */}
                <div className="flex flex-wrap gap-1.5">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleUpdateStatus(selectedItem.id, 'pending')}
                    className="gap-1.5 h-8 px-3 hover:bg-orange-50 hover:text-orange-700 dark:hover:bg-orange-950 dark:hover:text-orange-300"
                  >
                    <AlertCircle className="h-3.5 w-3.5" />
                    <span className="text-xs font-medium">Pending</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleUpdateStatus(selectedItem.id, 'reviewed')}
                    className="gap-1.5 h-8 px-3 hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-blue-950 dark:hover:text-blue-300"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    <span className="text-xs font-medium">Reviewed</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleUpdateStatus(selectedItem.id, 'resolved')}
                    className="gap-1.5 h-8 px-3 hover:bg-green-50 hover:text-green-700 dark:hover:bg-green-950 dark:hover:text-green-300"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span className="text-xs font-medium">Resolved</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleUpdateStatus(selectedItem.id, 'closed')}
                    className="gap-1.5 h-8 px-3 hover:bg-gray-50 hover:text-gray-700 dark:hover:bg-gray-950 dark:hover:text-gray-300"
                  >
                    <XCircle className="h-3.5 w-3.5" />
                    <span className="text-xs font-medium">Closed</span>
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}


