// app/admin/blog/page.jsx
'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import axios from 'axios'
import { useDebounce } from '@/hooks/use-debounce'
import { config } from '@/lib/config'
import Pagination from '@/components/Pagination'
import { 
  IconPlus, 
  IconEdit, 
  IconTrash, 
  IconEye,
  IconSearch,
  IconFilter,
  IconDotsVertical
} from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { FileText, X, Filter as FilterIcon } from 'lucide-react'
import { useContext } from 'react'
import AuthContext from '@/context/AuthContext'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import ProtectedRoute from '@/components/ProtectedRoute'

export default function AdminBlogPage() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const { userData } = useContext(AuthContext)
  const router = useRouter()
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  
  // Debounce search query to avoid too many API calls
  const debouncedSearchQuery = useDebounce(searchQuery, 500)

  useEffect(() => {
    if (userData) {
      fetchPosts()
    }
  }, [userData, statusFilter, debouncedSearchQuery, currentPage, pageSize])


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



  const fetchPosts = async () => {
    try {
      setLoading(true)
      const token = getAccessToken();
      const response = await axios.get(config.API_BASE_URL + 'blog/post/', {
        params: {
          page: currentPage,
          page_size: pageSize,
          ...(statusFilter !== 'all' ? { status: statusFilter } : {}),
          ...(debouncedSearchQuery ? { search: debouncedSearchQuery } : {}),
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      
      // Handle paginated response
      if (response.data.results) {
        setPosts(response.data.results)
        setTotalCount(response.data.count)
        setTotalPages(response.data.total_pages)
      } else {
        // Fallback for non-paginated response
        setPosts(response.data)
        setTotalCount(response.data.length)
        setTotalPages(1)
      }
    } catch (error) {
      console.error('Error fetching posts:', error)
      toast.error('Failed to fetch posts')
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
        label: statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1),
        icon: FileText,
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

  const deletePost = async (id) => {
    if (!confirm('Are you sure you want to delete this post?')) return
    
    const token = getAccessToken();

    try {
      await axios.delete(config.API_BASE_URL + `blog/post/${id}/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      toast.success('Post deleted successfully')
      
      // Check if we need to go to previous page after deletion
      if (posts.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1)
      }
      
      fetchPosts()
    } catch (error) {
      console.error('Error deleting post:', error)
      toast.error('Failed to delete post')
    }
  }

  const updatePostStatus = async (id, status) => {
    try {
      const token = getAccessToken();
      await axios.patch(config.API_BASE_URL + `blog/post/${id}/`, {
        status: status === 'publish' ? 'published' : 'draft'
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      fetchPosts() // Refresh the list
    } catch (error) {
      console.error('Error updating post status:', error)
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <ProtectedRoute>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Blog Management</h1>
            <p className="text-muted-foreground">Create and manage your blog posts</p>
          </div>
          <Button asChild>
            <Link href="/dashboard/super-admin/blog/create">
              <IconPlus className="mr-2" />
              New Post
            </Link>
          </Button>
        </div>

        {/* Search and Filter Section */}
        <div className="mb-6 flex flex-col lg:flex-row gap-3">
          {/* Search Bar */}
          <div className="relative flex-1">
            <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
            <Input
              placeholder="Search posts..."
              className="pl-10 h-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Filters Container */}
          <div className="flex flex-wrap lg:flex-nowrap items-center gap-2">
            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={(value) => { setStatusFilter(value); setCurrentPage(1); }}>
              <SelectTrigger className={`w-full lg:w-[160px] !h-10 ${statusFilter !== 'all' ? 'border-primary bg-primary/5' : ''}`}>
                <div className="flex items-center gap-1.5">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <SelectValue placeholder="Status" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Active Filters Display */}
        {activeFilters.length > 0 && (
          <div className="mb-4 flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
              <FilterIcon className="h-4 w-4" />
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

        <div className="border rounded-lg overflow-hidden shadow-sm bg-card">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-[60px]">#</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Author</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : posts.length > 0 ? (
                posts.map((post, index) => (
                  <TableRow key={post.id}>
                    <TableCell className="font-medium">{index + 1}</TableCell>
                    <TableCell className="font-medium">{post.title}</TableCell>
                    <TableCell>{post.author_data?.full_name}</TableCell>
                    <TableCell>
                      <Badge variant={post.status === 'published' ? 'default' : 'secondary'}>
                        {post.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(post.updated_at)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <IconDotsVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem 
                            onClick={() => window.open(`/blogs/${post.slug}`, '_blank')}
                            className="cursor-pointer flex items-center gap-2"
                          >
                            <IconEye className="h-4 w-4 text-primary" />
                            <span>View Post</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => router.push(`/dashboard/super-admin/blog/edit/${post.id}`)}
                            className="cursor-pointer flex items-center gap-2"
                          >
                            <IconEdit className="h-4 w-4 text-yellow-500" />
                            <span>Edit Post</span>
                          </DropdownMenuItem>
                          {post.status === 'draft' ? (
                            <DropdownMenuItem 
                              onClick={() => updatePostStatus(post.id, 'publish')}
                              className="cursor-pointer flex items-center gap-2 text-primary"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              <span>Publish</span>
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem 
                              onClick={() => updatePostStatus(post.id, 'unpublish')}
                              className="cursor-pointer flex items-center gap-2 text-orange-600"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L5.636 5.636" />
                              </svg>
                              <span>Unpublish</span>
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem 
                            onClick={() => deletePost(post.id)}
                            className="cursor-pointer flex items-center gap-2 text-red-600"
                          >
                            <IconTrash className="h-4 w-4" />
                            <span>Delete Post</span>
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
                      <h3 className="text-lg font-medium text-foreground mb-1">No blog posts found</h3>
                      <p className="text-muted-foreground mb-4">Get started by creating your first blog post</p>
                      <Button 
                        className="bg-primary hover:bg-primary/90"
                        onClick={() => router.push('/dashboard/super-admin/blog/create')}
                      >
                        <IconPlus className="h-4 w-4 mr-1" />
                        Create Post
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
              label="Posts"
              pageSizeOptions={[5, 10, 20, 50]}
            />
          )}
        </div>
      </div>
    </ProtectedRoute>
  )
}