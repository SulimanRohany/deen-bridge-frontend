"use client"

import { useState, useEffect } from 'react'
import { useDebounce } from '@/hooks/use-debounce'
import Pagination from '@/components/Pagination'
import { 
  IconPlus, 
  IconEdit, 
  IconTrash, 
  IconSearch,
  IconBook,
  IconFolder,
  IconStar,
  IconEye,
  IconDownload,
  IconFilter
} from '@tabler/icons-react'
import { MoreVertical, Eye, Edit, Trash2, X, Filter as FilterIcon, BookOpen } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
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
} from '@/components/ui/dropdown-menu'
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { libraryAPI, subjectAPI } from '@/lib/api'
import { toast } from "sonner"

export default function LibraryManagementPage() {
  const [resources, setResources] = useState([])
  const [subjects, setSubjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterLanguage, setFilterLanguage] = useState("all")
  const [showResourceDialog, setShowResourceDialog] = useState(false)
  const [editingResource, setEditingResource] = useState(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState(null)
  const [viewingResource, setViewingResource] = useState(null)
  const [showViewDialog, setShowViewDialog] = useState(false)
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  
  // Debounce search query to avoid too many API calls
  const debouncedSearchQuery = useDebounce(searchQuery, 500)

  // Fetch data on component mount and when pagination/filters change
  useEffect(() => {
    fetchResources()
  }, [pageSize, currentPage, debouncedSearchQuery, filterLanguage])

  useEffect(() => {
    fetchSubjects()
  }, [])

  const fetchResources = async () => {
    try {
      setLoading(true)
      const params = {
        page: currentPage,
        page_size: pageSize,
      }
      
      // Add backend filters
      if (debouncedSearchQuery) {
        params.search = debouncedSearchQuery
      }
      if (filterLanguage !== 'all') {
        params.language = filterLanguage
      }
      
      const response = await libraryAPI.getResources(params)
      const data = response.data
      
      // Handle paginated response
      if (data.results) {
        setResources(data.results)
        setTotalCount(data.count)
        setTotalPages(data.total_pages)
      } else {
        // Fallback for non-paginated response
        const results = data || []
        setResources(results)
        setTotalCount(results.length)
        setTotalPages(1)
      }
    } catch (error) {
      toast.error("Failed to load resources")
      setResources([])
      setTotalCount(0)
      setTotalPages(1)
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
    setFilterLanguage('all')
    setSearchQuery('')
    setCurrentPage(1)
  }

  // Check if any filter is active
  const hasActiveFilters = filterLanguage !== 'all' || searchQuery !== ''

  // Get active filters for display
  const getActiveFilters = () => {
    const filters = []
    if (filterLanguage !== 'all') {
      filters.push({
        type: 'language',
        label: filterLanguage === 'en' ? 'English' : filterLanguage === 'ar' ? 'Arabic' : filterLanguage,
        icon: BookOpen,
        remove: () => setFilterLanguage('all')
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

  const fetchSubjects = async () => {
    try {
      const response = await subjectAPI.getSubjects()
      setSubjects(response.data || [])
    } catch (error) {
    }
  }

  const handleDeleteResource = async (id) => {
    try {
      await libraryAPI.deleteResource(id)
      toast.success("Resource deleted successfully")
      fetchResources()
      setDeleteDialogOpen(false)
    } catch (error) {
      toast.error("Failed to delete resource")
    }
  }

  const openDeleteDialog = (item, type) => {
    setItemToDelete({ ...item, type })
    setDeleteDialogOpen(true)
  }


  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Library Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage library resources and categories
          </p>
        </div>
      </div>

      <div className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Library Books</CardTitle>
                  <CardDescription>
                    Manage Islamic books and educational materials
                  </CardDescription>
                </div>
                <Button onClick={() => {
                  setEditingResource(null)
                  setShowResourceDialog(true)
                }}>
                  <IconPlus className="mr-2 h-4 w-4" />
                  Add Book
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Search and Filter Section */}
              <div className="mb-6 flex flex-col lg:flex-row gap-3">
                {/* Search Bar */}
                <div className="relative flex-1">
                  <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
                  <Input
                    placeholder="Search books..."
                    className="pl-10 h-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                {/* Filters Container */}
                <div className="flex flex-wrap lg:flex-nowrap items-center gap-2">
                  {/* Language Filter */}
                  <Select value={filterLanguage} onValueChange={(value) => { setFilterLanguage(value); setCurrentPage(1); }}>
                    <SelectTrigger className={`w-full lg:w-[180px] !h-10 ${filterLanguage !== 'all' ? 'border-primary bg-primary/5' : ''}`}>
                      <div className="flex items-center gap-1.5">
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                        <SelectValue placeholder="Language" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Languages</SelectItem>
                      <SelectItem value="arabic">Arabic</SelectItem>
                      <SelectItem value="english">English</SelectItem>
                      <SelectItem value="urdu">Urdu</SelectItem>
                      <SelectItem value="farsi">Farsi</SelectItem>
                      <SelectItem value="pashto">Pashto</SelectItem>
                      <SelectItem value="turkish">Turkish</SelectItem>
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

              {/* Resources Table */}
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[60px]">#</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Author</TableHead>
                      <TableHead>Language</TableHead>
                      <TableHead className="text-center">Rating</TableHead>
                      <TableHead className="text-center">Views</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead className="text-right w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8">
                          Loading books...
                        </TableCell>
                      </TableRow>
                    ) : resources.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8">
                          No books found
                        </TableCell>
                      </TableRow>
                    ) : (
                      resources.map((resource, index) => (
                        <TableRow key={resource.id}>
                          <TableCell className="font-medium">{index + 1}</TableCell>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <IconBook className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <div>{resource.title}</div>
                                {resource.title_arabic && (
                                  <div className="text-sm text-muted-foreground">
                                    {resource.title_arabic}
                                  </div>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{resource.author}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              {resource.language}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-1">
                              <IconStar className="h-4 w-4 text-yellow-500" />
                              <span>{resource.average_rating?.toFixed(1) || '0.0'}</span>
                              <span className="text-muted-foreground text-sm">
                                ({resource.total_ratings})
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-1">
                              <IconEye className="h-4 w-4 text-muted-foreground" />
                              <span>{resource.view_count}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex flex-col gap-1 items-center">
                              <Badge variant={resource.is_published ? "success" : "secondary"}>
                                {resource.is_published ? "Published" : "Draft"}
                              </Badge>
                              {resource.is_featured && (
                                <Badge variant="default">Featured</Badge>
                              )}
                            </div>
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
                                    setViewingResource(resource)
                                    setShowViewDialog(true)
                                  }}
                                  className="cursor-pointer flex items-center gap-2"
                                >
                                  <Eye className="h-4 w-4 text-primary" />
                                  <span>View</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => {
                                    setEditingResource(resource)
                                    setShowResourceDialog(true)
                                  }}
                                  className="cursor-pointer flex items-center gap-2"
                                >
                                  <Edit className="h-4 w-4 text-yellow-500" />
                                  <span>Edit</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => openDeleteDialog(resource, 'resource')}
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
                    )}
                  </TableBody>
                </Table>
              </div>
              
              {/* Pagination Component */}
              {totalCount > 0 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalCount={totalCount}
                  pageSize={pageSize}
                  onPageChange={handlePageChange}
                  onPageSizeChange={handlePageSizeChange}
                  label="Resources"
                  pageSizeOptions={[5, 10, 20, 50]}
                />
              )}
            </CardContent>
          </Card>
        </div>

      {/* Resource Dialog */}
      <ResourceDialog
        open={showResourceDialog}
        onOpenChange={setShowResourceDialog}
        resource={editingResource}
        subjects={subjects}
        onSuccess={() => {
          fetchResources()
          setShowResourceDialog(false)
          setEditingResource(null)
        }}
      />

      {/* View Book Dialog */}
      <ViewBookDialog
        open={showViewDialog}
        onOpenChange={setShowViewDialog}
        resource={viewingResource}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the{" "}
              {itemToDelete?.type}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                handleDeleteResource(itemToDelete.id)
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// Resource Dialog Component
function ResourceDialog({ open, onOpenChange, resource, subjects, onSuccess }) {
  const [formData, setFormData] = useState({
    title: '',
    title_arabic: '',
    author: '',
    author_arabic: '',
    category: '',
    language: 'arabic',
    description: '',
    publisher: '',
    publication_year: '',
    isbn: '',
    pages: '',
    is_published: true,
    is_featured: false,
    featured_order: 0,
    tags: '',
    subject_ids: [],
  })
  const [categories, setCategories] = useState([])
  const [coverImage, setCoverImage] = useState(null)
  const [pdfFile, setPdfFile] = useState(null)
  const [removeCoverImage, setRemoveCoverImage] = useState(false)
  const [removePdfFile, setRemovePdfFile] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const fetchCategories = async () => {
    try {
      const response = await libraryAPI.getCategories()
      setCategories(response.data || [])
    } catch (error) {
    }
  }

  useEffect(() => {
    // Fetch categories when dialog opens
    if (open) {
      fetchCategories()
    }
    
    if (resource) {
      setFormData({
        title: resource.title || '',
        title_arabic: resource.title_arabic || '',
        author: resource.author || '',
        author_arabic: resource.author_arabic || '',
        category: resource.category || '',
        language: resource.language || 'arabic',
        description: resource.description || '',
        publisher: resource.publisher || '',
        publication_year: resource.publication_year || '',
        isbn: resource.isbn || '',
        pages: resource.pages || '',
        is_published: resource.is_published ?? true,
        is_featured: resource.is_featured || false,
        featured_order: resource.featured_order || 0,
        tags: resource.tags?.join(', ') || '',
        subject_ids: resource.subjects?.map(s => s.id) || [],
      })
    } else {
      setFormData({
        title: '',
        title_arabic: '',
        author: '',
        author_arabic: '',
        category: '',
        language: 'arabic',
        description: '',
        publisher: '',
        publication_year: '',
        isbn: '',
        pages: '',
        is_published: true,
        is_featured: false,
        featured_order: 0,
        tags: '',
        subject_ids: [],
      })
      setCoverImage(null)
      setPdfFile(null)
      setRemoveCoverImage(false)
      setRemovePdfFile(false)
    }
  }, [resource, open])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      // Validate files before submission
      if (coverImage && coverImage.size > 5 * 1024 * 1024) {
        toast.error("Cover image must be less than 5MB")
        setSubmitting(false)
        return
      }
      if (pdfFile && pdfFile.size > 50 * 1024 * 1024) {
        toast.error("PDF file must be less than 50MB")
        setSubmitting(false)
        return
      }

      const submitData = new FormData()
      
      // Add all form fields
      Object.keys(formData).forEach(key => {
        if (key === 'subject_ids') {
          formData[key].forEach(id => submitData.append('subject_ids', id))
        } else if (key === 'tags') {
          // Split comma-separated tags and send as individual array items
          if (formData[key]) {
            const tagsArray = formData[key]
              .split(',')
              .map(tag => tag.trim())
              .filter(tag => tag.length > 0)
            tagsArray.forEach(tag => submitData.append('tags', tag))
          }
        } else if (formData[key] !== '' && formData[key] !== null) {
          submitData.append(key, formData[key])
        }
      })

      // Add files or removal flags
      if (coverImage) {
        submitData.append('cover_image', coverImage)
      } else if (removeCoverImage && resource) {
        // Send empty string to indicate removal
        submitData.append('remove_cover_image', 'true')
      }
      
      if (pdfFile) {
        submitData.append('pdf_file', pdfFile)
      } else if (removePdfFile && resource) {
        // Send empty string to indicate removal
        submitData.append('remove_pdf_file', 'true')
      }

      if (resource) {
        await libraryAPI.updateResource(resource.id, submitData)
        toast.success("Book updated successfully")
      } else {
        await libraryAPI.createResource(submitData)
        toast.success("Book created successfully")
      }

      onSuccess()
    } catch (error) {
      
      // Handle specific error messages
      if (error.response?.data) {
        const errorData = error.response.data
        
        // Handle field-specific errors
        if (errorData.cover_image) {
          toast.error(`Cover Image: ${errorData.cover_image[0]}`)
        } else if (errorData.pdf_file) {
          toast.error(`PDF File: ${errorData.pdf_file[0]}`)
        } else if (errorData.detail || errorData.message) {
          toast.error(errorData.detail || errorData.message)
        } else {
          // Show first error found
          const firstError = Object.values(errorData)[0]
          if (Array.isArray(firstError)) {
            toast.error(firstError[0])
          } else {
            toast.error(String(firstError))
          }
        }
      } else {
        toast.error("Failed to save book. Please try again.")
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{resource ? 'Edit Book' : 'Add New Book'}</DialogTitle>
          <DialogDescription>
            Fill in the details below to {resource ? 'update' : 'create'} a book
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="font-semibold">Basic Information</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="title_arabic">Arabic Title</Label>
                <Input
                  id="title_arabic"
                  value={formData.title_arabic}
                  onChange={(e) => setFormData({...formData, title_arabic: e.target.value})}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="author">Author *</Label>
                <Input
                  id="author"
                  value={formData.author}
                  onChange={(e) => setFormData({...formData, author: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="author_arabic">Arabic Author</Label>
                <Input
                  id="author_arabic"
                  value={formData.author_arabic}
                  onChange={(e) => setFormData({...formData, author_arabic: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                rows={4}
              />
            </div>
          </div>

          {/* Book Details */}
          <div className="space-y-4">
            <h3 className="font-semibold">Book Details</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={formData.category?.toString()}
                  onValueChange={(value) => setFormData({...formData, category: parseInt(value)})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id.toString()}>
                        {cat.name} {cat.name_arabic && `(${cat.name_arabic})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="language">Language *</Label>
                <Select
                  value={formData.language}
                  onValueChange={(value) => setFormData({...formData, language: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="arabic">Arabic</SelectItem>
                    <SelectItem value="english">English</SelectItem>
                    <SelectItem value="urdu">Urdu</SelectItem>
                    <SelectItem value="farsi">Farsi</SelectItem>
                    <SelectItem value="pashto">Pashto</SelectItem>
                    <SelectItem value="turkish">Turkish</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">Tags (comma-separated)</Label>
              <Input
                id="tags"
                value={formData.tags}
                onChange={(e) => setFormData({...formData, tags: e.target.value})}
                placeholder="e.g., Quran, Tafsir, Beginner"
              />
            </div>
          </div>

          {/* Files */}
          <div className="space-y-4">
            <h3 className="font-semibold">Files</h3>
            
            {/* Cover Image */}
            <div className="space-y-2">
              <Label htmlFor="cover_image">Cover Image (max 5MB)</Label>
              <Input
                id="cover_image"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  setCoverImage(e.target.files[0])
                  setRemoveCoverImage(false)
                }}
                disabled={removeCoverImage}
              />
              {resource?.cover_image && !coverImage && !removeCoverImage && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 p-2 bg-secondary/20 rounded text-sm">
                    <span className="text-primary">✓</span>
                    <span className="text-muted-foreground">
                      Current file: {resource.cover_image.split('/').pop()}
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      setRemoveCoverImage(true)
                      setCoverImage(null)
                    }}
                    className="w-full"
                  >
                    <IconTrash className="mr-2 h-4 w-4" />
                    Remove Cover Image
                  </Button>
                </div>
              )}
              {removeCoverImage && (
                <div className="space-y-2">
                  <p className="text-sm text-red-600">Cover image will be removed</p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setRemoveCoverImage(false)}
                    className="w-full"
                  >
                    Cancel Removal
                  </Button>
                </div>
              )}
              {coverImage && (
                <p className="text-sm text-primary">New file selected: {coverImage.name}</p>
              )}
              {!resource && (
                <p className="text-xs text-muted-foreground">
                  Leave empty to skip cover image
                </p>
              )}
            </div>

            {/* PDF File */}
            <div className="space-y-2">
              <Label htmlFor="pdf_file">PDF File (max 50MB) {!resource && '*'}</Label>
              <Input
                id="pdf_file"
                type="file"
                accept=".pdf,application/pdf"
                onChange={(e) => {
                  setPdfFile(e.target.files[0])
                  setRemovePdfFile(false)
                }}
                required={!resource && !removePdfFile}
                disabled={removePdfFile}
              />
              {resource?.pdf_file && !pdfFile && !removePdfFile && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 p-2 bg-secondary/20 rounded text-sm">
                    <span className="text-primary">✓</span>
                    <span className="text-muted-foreground">
                      Current file: {resource.pdf_file.split('/').pop()}
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      setRemovePdfFile(true)
                      setPdfFile(null)
                    }}
                    className="w-full"
                  >
                    <IconTrash className="mr-2 h-4 w-4" />
                    Remove PDF File
                  </Button>
                </div>
              )}
              {removePdfFile && (
                <div className="space-y-2">
                  <p className="text-sm text-red-600">PDF file will be removed</p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setRemovePdfFile(false)}
                    className="w-full"
                  >
                    Cancel Removal
                  </Button>
                </div>
              )}
              {pdfFile && (
                <p className="text-sm text-primary">New file selected: {pdfFile.name}</p>
              )}
              {!resource && (
                <p className="text-xs text-muted-foreground">* Required for new books</p>
              )}
            </div>
          </div>

          {/* Metadata */}
          <div className="space-y-4">
            <h3 className="font-semibold">Metadata</h3>
            
            <div className="grid grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="publisher">Publisher</Label>
                <Input
                  id="publisher"
                  value={formData.publisher}
                  onChange={(e) => setFormData({...formData, publisher: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="publication_year">Year</Label>
                <Input
                  id="publication_year"
                  type="number"
                  value={formData.publication_year}
                  onChange={(e) => setFormData({...formData, publication_year: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="isbn">ISBN</Label>
                <Input
                  id="isbn"
                  value={formData.isbn}
                  onChange={(e) => setFormData({...formData, isbn: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pages">Pages</Label>
                <Input
                  id="pages"
                  type="number"
                  value={formData.pages}
                  onChange={(e) => setFormData({...formData, pages: e.target.value})}
                />
              </div>
            </div>
          </div>

          {/* Publishing Options */}
          <div className="space-y-4">
            <h3 className="font-semibold">Publishing Options</h3>
            
            <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_published"
                  checked={formData.is_published}
                  onCheckedChange={(checked) => setFormData({...formData, is_published: checked})}
                />
                <Label htmlFor="is_published">Published</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_featured"
                  checked={formData.is_featured}
                  onCheckedChange={(checked) => setFormData({...formData, is_featured: checked})}
                />
                <Label htmlFor="is_featured">Featured</Label>
              </div>

              {formData.is_featured && (
                <div className="flex items-center space-x-2">
                  <Label htmlFor="featured_order">Order:</Label>
                  <Input
                    id="featured_order"
                    type="number"
                    value={formData.featured_order}
                    onChange={(e) => setFormData({...formData, featured_order: parseInt(e.target.value)})}
                    className="w-20"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Saving...' : resource ? 'Update Book' : 'Create Book'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// View Book Dialog Component
function ViewBookDialog({ open, onOpenChange, resource }) {
  if (!resource) return null

  const handleDownloadPDF = async () => {
    if (resource.pdf_file) {
      try {
        // Fetch the PDF file
        const response = await fetch(resource.pdf_file)
        const blob = await response.blob()
        
        // Create download link
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `${resource.title}.pdf`
        
        // Trigger download
        document.body.appendChild(link)
        link.click()
        
        // Cleanup
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
        
        toast.success("Download started")
      } catch (error) {
        toast.error("Download failed. Please try again.")
      }
    }
  }

  const handleViewPDF = () => {
    if (resource.pdf_file) {
      window.open(resource.pdf_file, '_blank')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div>
            <DialogTitle className="text-2xl">{resource.title}</DialogTitle>
            {resource.title_arabic && (
              <p className="text-lg text-muted-foreground mt-1">{resource.title_arabic}</p>
            )}
            <DialogDescription className="mt-2">
              by {resource.author}
              {resource.author_arabic && ` (${resource.author_arabic})`}
            </DialogDescription>
          </div>
        </DialogHeader>

        {/* Book Information */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4 border-b">
          <div>
            <p className="text-sm font-semibold text-muted-foreground">Language</p>
            <Badge variant="secondary" className="mt-1">{resource.language}</Badge>
          </div>
          {resource.publisher && (
            <div>
              <p className="text-sm font-semibold text-muted-foreground">Publisher</p>
              <p className="text-sm mt-1">{resource.publisher}</p>
            </div>
          )}
          {resource.publication_year && (
            <div>
              <p className="text-sm font-semibold text-muted-foreground">Year</p>
              <p className="text-sm mt-1">{resource.publication_year}</p>
            </div>
          )}
          {resource.pages && (
            <div>
              <p className="text-sm font-semibold text-muted-foreground">Pages</p>
              <p className="text-sm mt-1">{resource.pages}</p>
            </div>
          )}
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-3 gap-4 py-4 border-b">
          <div className="flex items-center gap-2">
            <IconStar className="h-5 w-5 text-yellow-500" />
            <div>
              <p className="text-sm font-semibold">Rating</p>
              <p className="text-sm text-muted-foreground">
                {resource.average_rating?.toFixed(1) || '0.0'} ({resource.total_ratings} ratings)
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <IconEye className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-semibold">Views</p>
              <p className="text-sm text-muted-foreground">{resource.view_count}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <IconDownload className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-semibold">Downloads</p>
              <p className="text-sm text-muted-foreground">{resource.download_count || 0}</p>
            </div>
          </div>
        </div>

        {/* Description */}
        {resource.description && (
          <div className="py-4 border-b">
            <p className="text-sm font-semibold text-muted-foreground mb-2">Description</p>
            <p className="text-sm">{resource.description}</p>
          </div>
        )}

        {/* Tags */}
        {resource.tags && resource.tags.length > 0 && (
          <div className="py-4 border-b">
            <p className="text-sm font-semibold text-muted-foreground mb-2">Tags</p>
            <div className="flex flex-wrap gap-2">
              {resource.tags.map((tag, index) => (
                <Badge key={index} variant="outline">{tag}</Badge>
              ))}
            </div>
          </div>
        )}

        {/* Additional Metadata */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4 border-b">
          {resource.isbn && (
            <div>
              <p className="text-sm font-semibold text-muted-foreground">ISBN</p>
              <p className="text-sm mt-1 font-mono">{resource.isbn}</p>
            </div>
          )}
          
          <div>
            <p className="text-sm font-semibold text-muted-foreground">Status</p>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={resource.is_published ? "default" : "secondary"}>
                {resource.is_published ? "Published" : "Draft"}
              </Badge>
              {resource.is_featured && (
                <Badge variant="outline">Featured</Badge>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-6">
          <Button
            onClick={handleViewPDF}
            variant="outline"
          >
            <IconEye className="mr-2 h-4 w-4" />
            View PDF
          </Button>
          <Button
            onClick={handleDownloadPDF}
            variant="default"
          >
            <IconDownload className="mr-2 h-4 w-4" />
            Download PDF
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

