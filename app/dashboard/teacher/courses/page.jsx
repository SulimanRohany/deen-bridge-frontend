'use client'

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { useDebounce } from '@/hooks/use-debounce';
import { config } from '@/lib/config';
import Pagination from '@/components/Pagination';
import { 
  IconBook, 
  IconUsers, 
  IconCalendar,
  IconClock,
  IconSearch
} from "@tabler/icons-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MoreVertical, Eye, Filter, X, User, BookOpen, Users, DollarSign, Star, Calendar } from 'lucide-react';
import Image from "next/image";




export default function TeacherCoursesPage() {
  const router = useRouter();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [specialClassFilter, setSpecialClassFilter] = useState('all');
  
  // View dialog state
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [currentClass, setCurrentClass] = useState(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  
  // Debounce search query
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  useEffect(() => {
    fetchClasses();
  }, [debouncedSearchQuery, specialClassFilter, currentPage, pageSize]);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get auth token from localStorage
      const authTokens = localStorage.getItem('authTokens');
      if (!authTokens) {
        throw new Error('Authentication required');
      }
      
      const parsedTokens = JSON.parse(authTokens);
      const token = parsedTokens.access;
      
      // Build query parameters
      const params = {
        page: currentPage,
        page_size: pageSize,
      };
      
      if (debouncedSearchQuery) {
        params.title__icontains = debouncedSearchQuery;
      }
      
      if (specialClassFilter !== 'all') {
        params.is_special_class = specialClassFilter === 'special';
      }
      
      // Fetch classes where the teacher is assigned
      const response = await axios.get(config.API_BASE_URL + 'course/', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        params
      });
      
      // Handle paginated response
      if (response.data.results) {
        setClasses(response.data.results);
        setTotalCount(response.data.count);
        setTotalPages(response.data.total_pages);
      } else {
        setClasses(response.data);
        setTotalCount(response.data.length);
        setTotalPages(1);
      }
    } catch (err) {
      console.error('Error fetching classes:', err);
      setError(err.response?.data?.error || err.message || 'Failed to load classes');
      toast.error('Failed to load classes');
    } finally {
      setLoading(false);
    }
  };

  // Handle page change
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Handle page size change
  const handlePageSizeChange = (size) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  // Clear all filters
  const clearFilters = () => {
    setSpecialClassFilter('all');
    setSearchQuery('');
    setCurrentPage(1);
  };

  // Check if any filter is active
  const hasActiveFilters = specialClassFilter !== 'all' || searchQuery !== '';

  // Get active filters for display
  const getActiveFilters = () => {
    const filters = [];
    if (specialClassFilter !== 'all') {
      filters.push({
        type: 'special',
        label: specialClassFilter === 'special' ? 'Special Classes' : 'Regular Classes',
        icon: IconBook,
        remove: () => setSpecialClassFilter('all')
      });
    }
    if (searchQuery) {
      filters.push({
        type: 'search',
        label: `Search: "${searchQuery}"`,
        icon: IconSearch,
        remove: () => setSearchQuery('')
      });
    }
    return filters;
  };

  const activeFilters = getActiveFilters();

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-BD', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency: 'BDT',
      minimumFractionDigits: 0,
    }).format(amount || 0);
  };

  // Open view dialog
  const openViewDialogFn = (classItem) => {
    setCurrentClass(classItem);
    setOpenViewDialog(true);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        <p className="mt-4 text-gray-500">Loading classes...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex flex-col items-center justify-center h-96">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-red-600 mb-2">Error Loading Classes</h2>
            <p className="text-slate-600 dark:text-slate-400 mb-4">{error}</p>
            <Button onClick={fetchClasses} className="bg-primary hover:bg-primary/90">
              <IconRefresh className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">My Classes</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage and view all your assigned classes
        </p>
      </div>

      {/* Search and Filter Section */}
      <div className="mb-6 flex flex-col lg:flex-row gap-3">
        {/* Search Bar */}
        <div className="relative flex-1">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <Input
            placeholder="Search by class name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-10"
          />
        </div>

        {/* Filters Container */}
        <div className="flex flex-wrap lg:flex-nowrap items-center gap-2">
          {/* Special Class Filter */}
          <Select value={specialClassFilter} onValueChange={(value) => { setSpecialClassFilter(value); setCurrentPage(1); }}>
            <SelectTrigger className={`w-full lg:w-[180px] !h-10 ${specialClassFilter !== 'all' ? 'border-primary bg-primary/5' : ''}`}>
              <div className="flex items-center gap-1.5">
                <IconBook className="h-4 w-4 text-muted-foreground" />
                <SelectValue placeholder="Class Type" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Classes</SelectItem>
              <SelectItem value="special">Special Classes</SelectItem>
              <SelectItem value="regular">Regular Classes</SelectItem>
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
                  <TableCell className="font-medium">{(currentPage - 1) * pageSize + index + 1}</TableCell>
                  <TableCell className="font-medium">{classItem.title}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1 max-w-xs">
                      {classItem.teachers && classItem.teachers.length > 0 ? (
                        classItem.teachers.map(teacher => (
                          <div key={teacher.id} className="flex items-center bg-primary/10 text-primary text-xs px-2 py-1 rounded">
                            <div className="bg-primary/30 border-2 rounded-full w-4 h-4 mr-1" />
                            <span>{teacher.full_name}</span>
                          </div>
                        ))
                      ) : (
                        <span className="text-muted-foreground text-xs">No teachers</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1 max-w-xs">
                      {classItem.subjects && classItem.subjects.length > 0 ? (
                        classItem.subjects.map(subject => (
                          <div key={subject.id} className="flex items-center bg-secondary/10 text-secondary text-xs px-2 py-1 rounded">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <span>{subject.name}</span>
                          </div>
                        ))
                      ) : (
                        <span className="text-muted-foreground text-xs">No subjects</span>
                      )}
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
                          onClick={() => openViewDialogFn(classItem)}
                          className="cursor-pointer flex items-center gap-2"
                        >
                          <Eye className="h-4 w-4 text-primary" />
                          <span>View Details</span>
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
                      <IconBook className="h-10 w-10 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium text-foreground mb-1">No classes found</h3>
                    <p className="text-muted-foreground">
                      {hasActiveFilters ? 'Try adjusting your filters' : 'You don\'t have any classes assigned yet'}
                    </p>
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
              Class Details
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Detailed information about this class
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="flex-1 overflow-y-auto px-1">
            {currentClass && (
              <div className="space-y-6 pr-4">
                <div className="border-b pb-4">
                  <h3 className="font-medium text-foreground flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    Title
                  </h3>
                  <p className="mt-2 text-lg font-semibold text-foreground">
                    {currentClass.title}
                  </p>
                </div>

                <div className="border-b pb-4">
                  <h3 className="font-medium text-foreground flex items-center gap-2">
                    <Eye className="h-4 w-4" />
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
                      {currentClass.teachers && currentClass.teachers.length > 0 ? (
                        currentClass.teachers.map(teacher => (
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
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">No teachers assigned</p>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-foreground flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      Subjects
                    </h3>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      {currentClass.subjects && currentClass.subjects.length > 0 ? (
                        currentClass.subjects.map(subject => (
                          <div key={subject.id} className="border border-border rounded-lg p-3 bg-secondary/10">
                            <h4 className="font-medium text-secondary">{subject.name}</h4>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground col-span-2">No subjects</p>
                      )}
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

                {/* Timetables Section */}
                {currentClass.course_timetables && currentClass.course_timetables.length > 0 && (
                  <div>
                    <h3 className="font-medium text-foreground flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Class Schedule
                    </h3>
                    <div className="mt-2 space-y-2">
                      {currentClass.course_timetables.map((timetable, idx) => (
                        <div key={idx} className="p-3 bg-muted/50 rounded-lg border border-border">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <IconClock className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm font-medium">
                                {timetable.days_display || 'N/A'}
                              </span>
                            </div>
                            <span className="text-sm text-muted-foreground">
                              {timetable.start_time} - {timetable.end_time}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div>
                  <h3 className="font-medium text-foreground flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Additional Information
                  </h3>
                  <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
                    <div className="flex justify-between py-2 border-b border-border">
                      <span className="text-muted-foreground">Created At:</span>
                      <span className="text-foreground">
                        {currentClass.created_at ? formatDate(currentClass.created_at) : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-border">
                      <span className="text-muted-foreground">Last Updated:</span>
                      <span className="text-foreground">
                        {currentClass.updated_at ? formatDate(currentClass.updated_at) : 'N/A'}
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
    </div>
  );
}

