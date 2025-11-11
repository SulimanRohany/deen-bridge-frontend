'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useDebounce } from '@/hooks/use-debounce'
import Pagination from '@/components/Pagination'
import * as communicationsAPI from '@/lib/communications-api'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  IconMail, 
  IconPhone, 
  IconCalendar, 
  IconSearch,
  IconRefresh,
  IconEye,
  IconCheck,
  IconX,
  IconClock
} from '@tabler/icons-react'
import { Filter, X as XIcon, Mail } from 'lucide-react'
import { toast } from "sonner"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const statusColors = {
  new: 'bg-blue-100 text-blue-800',
  read: 'bg-yellow-100 text-yellow-800',
  replied: 'bg-primary/10 text-primary',
  closed: 'bg-gray-100 text-gray-800'
}

const statusLabels = {
  new: 'New',
  read: 'Read',
  replied: 'Replied',
  closed: 'Closed'
}

export default function AdminContactMessages() {
  const { userData, authTokens } = useAuth()
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedMessage, setSelectedMessage] = useState(null)
  const [stats, setStats] = useState(null)
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  
  // Debounce search query to avoid too many API calls
  const debouncedSearchQuery = useDebounce(searchQuery, 500)

  // Check if user is admin
  const isAdmin = userData?.role === 'super_admin' || userData?.role === 'staff'

  useEffect(() => {
    if (!isAdmin) {
      toast.error('Access denied', {
        description: 'You need admin privileges to access this page.'
      })
      return
    }
    
    fetchMessages()
    fetchStats()
  }, [isAdmin, authTokens, debouncedSearchQuery, statusFilter, currentPage, pageSize])

  const fetchMessages = async () => {
    if (!authTokens?.access) return
    
    try {
      setLoading(true)
      const params = {
        token: authTokens.access,
        communication_type: 'contact_message',
        search: debouncedSearchQuery,
        status: statusFilter === 'all' ? undefined : statusFilter,
        ordering: '-created_at',
        page: currentPage,
        page_size: pageSize
      }
      const response = await communicationsAPI.getCommunications(params)
      
      // Handle paginated response
      if (response.results) {
        setMessages(response.results)
        setTotalCount(response.count)
        setTotalPages(response.total_pages)
      } else {
        setMessages(response)
        setTotalCount(response.length)
        setTotalPages(1)
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
      toast.error('Failed to fetch messages', {
        description: error.message
      })
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
    setStatusFilter('all')
    setSearchQuery('')
    setCurrentPage(1)
  }

  // Check if any filter is active
  const hasActiveFilters = statusFilter !== 'all' || searchQuery !== ''

  // Get active filters for display
  const getActiveFilters = () => {
    const filters = []
    if (statusFilter !== 'all') {
      filters.push({
        type: 'status',
        label: statusLabels[statusFilter] || statusFilter,
        icon: Mail,
        remove: () => setStatusFilter('all')
      })
    }
    if (searchQuery) {
      filters.push({
        type: 'search',
        label: `Search: "${searchQuery}"`,
        icon: IconSearch,
        remove: () => setSearchQuery('')
      })
    }
    return filters
  }

  const activeFilters = getActiveFilters()

  const fetchStats = async () => {
    if (!authTokens?.access) return
    
    try {
      const response = await communicationsAPI.getCommunicationStats(authTokens.access)
      // Extract contact message stats from unified stats
      if (response.contact_messages) {
        setStats({
          total_messages: response.contact_messages.total,
          new_messages: response.contact_messages.new,
          replied_messages: response.contact_messages.replied,
          closed_messages: response.overall.total - response.contact_messages.total // Approximate
        })
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const updateMessageStatus = async (messageId, newStatus) => {
    if (!authTokens?.access) return
    
    try {
      await communicationsAPI.updateCommunication(messageId, { status: newStatus }, authTokens.access)
      toast.success('Status updated successfully')
      fetchMessages()
      fetchStats()
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error('Failed to update status', {
        description: error.message
      })
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="p-8 text-center">
            <IconX className="w-16 h-16 text-destructive mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-foreground mb-2">Access Denied</h2>
            <p className="text-muted-foreground">
              You need admin privileges to access this page.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Contact Messages</h1>
          <p className="text-muted-foreground">Manage and respond to contact form submissions</p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Messages</p>
                    <p className="text-2xl font-bold text-foreground">{stats.total_messages}</p>
                  </div>
                  <IconMail className="w-8 h-8 text-primary" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">New Messages</p>
                    <p className="text-2xl font-bold text-blue-600">{stats.new_messages}</p>
                  </div>
                  <IconClock className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Replied</p>
                    <p className="text-2xl font-bold text-primary">{stats.replied_messages}</p>
                  </div>
                  <IconCheck className="w-8 h-8 text-primary" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Closed</p>
                    <p className="text-2xl font-bold text-gray-600">{stats.closed_messages}</p>
                  </div>
                  <IconX className="w-8 h-8 text-gray-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Search and Filter Section */}
        <div className="mb-6 flex flex-col lg:flex-row gap-3">
          {/* Search Bar */}
          <div className="relative flex-1">
            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search messages..."
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
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <SelectValue placeholder="Status" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="read">Read</SelectItem>
                <SelectItem value="replied">Replied</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
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
                    <XIcon className="h-3.5 w-3.5" />
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

        {/* Messages List */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Loading messages...</p>
            </div>
          ) : messages.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <IconMail className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No messages found</h3>
                <p className="text-muted-foreground">
                  {searchQuery || statusFilter ? 'Try adjusting your filters.' : 'No contact messages have been submitted yet.'}
                </p>
              </CardContent>
            </Card>
          ) : (
            messages.map((message) => (
              <Card key={message.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-foreground">{message.subject}</h3>
                        <Badge className={statusColors[message.status]}>
                          {statusLabels[message.status]}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                        <span className="flex items-center gap-1">
                          <IconMail className="w-4 h-4" />
                          {message.name} ({message.email})
                        </span>
                        {message.phone && (
                          <span className="flex items-center gap-1">
                            <IconPhone className="w-4 h-4" />
                            {message.phone}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <IconCalendar className="w-4 h-4" />
                          {formatDate(message.created_at)}
                        </span>
                      </div>
                      <p className="text-muted-foreground line-clamp-2">{message.message}</p>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedMessage(message)}
                      >
                        <IconEye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                      
                      {message.status === 'new' && (
                        <Button
                          size="sm"
                          onClick={() => updateMessageStatus(message.id, 'read')}
                        >
                          Mark as Read
                        </Button>
                      )}
                      
                      {message.status === 'read' && (
                        <Button
                          size="sm"
                          onClick={() => updateMessageStatus(message.id, 'replied')}
                        >
                          Mark as Replied
                        </Button>
                      )}
                      
                      {message.status !== 'closed' && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => updateMessageStatus(message.id, 'closed')}
                        >
                          Close
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Pagination Component */}
        {totalCount > 0 && (
          <div className="mt-6">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalCount={totalCount}
              pageSize={pageSize}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
              label="Messages"
              pageSizeOptions={[5, 10, 20, 50]}
            />
          </div>
        )}

        {/* Message Detail Modal */}
        {selectedMessage && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-2xl max-h-[80vh] overflow-hidden">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{selectedMessage.subject}</CardTitle>
                    <CardDescription>
                      From {selectedMessage.name} ({selectedMessage.email})
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedMessage(null)}
                  >
                    <IconX className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="overflow-y-auto">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-foreground mb-2">Message:</h4>
                    <p className="text-muted-foreground whitespace-pre-wrap">{selectedMessage.message}</p>
                  </div>
                  
                  {selectedMessage.phone && (
                    <div>
                      <h4 className="font-semibold text-foreground mb-2">Phone:</h4>
                      <p className="text-muted-foreground">{selectedMessage.phone}</p>
                    </div>
                  )}
                  
                  <div>
                    <h4 className="font-semibold text-foreground mb-2">Submitted:</h4>
                    <p className="text-muted-foreground">{formatDate(selectedMessage.created_at)}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-foreground mb-2">Status:</h4>
                    <Badge className={statusColors[selectedMessage.status]}>
                      {statusLabels[selectedMessage.status]}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}

