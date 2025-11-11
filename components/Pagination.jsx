'use client';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Reusable Pagination Component
 * 
 * @param {number} currentPage - Current active page (1-based)
 * @param {number} totalPages - Total number of pages
 * @param {number} totalCount - Total number of items
 * @param {number} pageSize - Number of items per page
 * @param {function} onPageChange - Callback when page changes
 * @param {function} onPageSizeChange - Callback when page size changes
 * @param {string} label - Label for total count (e.g., "Courses", "Users")
 * @param {array} pageSizeOptions - Available page size options (default: [5, 10, 20, 50, 100])
 */
export default function Pagination({
  currentPage = 1,
  totalPages = 1,
  totalCount = 0,
  pageSize = 10,
  onPageChange,
  onPageSizeChange,
  label = 'Items',
  pageSizeOptions = [5, 10, 20, 50, 100],
}) {
  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5;

    if (totalPages <= maxPagesToShow) {
      // Show all pages if total is less than max
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      // Calculate start and end of middle pages
      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);

      // Adjust if near the start
      if (currentPage <= 3) {
        start = 2;
        end = 4;
      }

      // Adjust if near the end
      if (currentPage >= totalPages - 2) {
        start = totalPages - 3;
        end = totalPages - 1;
      }

      // Add ellipsis before middle pages if needed
      if (start > 2) {
        pages.push('...');
      }

      // Add middle pages
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      // Add ellipsis after middle pages if needed
      if (end < totalPages - 1) {
        pages.push('...');
      }

      // Always show last page
      if (totalPages > 1) {
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  const handlePageClick = (page) => {
    if (page !== '...' && page !== currentPage) {
      onPageChange(page);
    }
  };

  return (
    <div className="flex items-center justify-between px-6 py-3.5 bg-gradient-to-r from-muted/20 via-muted/10 to-muted/20 border-t border-border/60">
      {/* Left: Total count */}
      <div className="flex items-center">
        <span className="text-sm text-muted-foreground">
          Total {label}: <span className="font-semibold text-foreground ml-1">{totalCount}</span>
        </span>
      </div>

      {/* Center: Page navigation */}
      <div className="flex items-center gap-1">
        {/* Previous button */}
        <Button
          variant="outline"
          size="icon"
          onClick={handlePreviousPage}
          disabled={currentPage === 1}
          className="h-9 w-9 rounded-md disabled:opacity-40 disabled:cursor-not-allowed border-border/50 hover:border-primary/50 hover:bg-primary/5 transition-all"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {/* Page numbers */}
        <div className="flex items-center gap-1 mx-1">
          {pageNumbers.map((page, index) => (
            <Button
              key={index}
              variant={page === currentPage ? 'default' : 'outline'}
              size="sm"
              onClick={() => handlePageClick(page)}
              disabled={page === '...'}
              className={`h-9 min-w-[36px] px-3 rounded-md transition-all ${
                page === currentPage
                  ? 'bg-primary text-primary-foreground shadow-md hover:bg-primary/90 border-primary'
                  : page === '...'
                  ? 'cursor-default hover:bg-transparent border-transparent hover:border-transparent'
                  : 'bg-background border-border/50 hover:border-primary/50 hover:bg-primary/5 hover:text-primary'
              }`}
            >
              {page}
            </Button>
          ))}
        </div>

        {/* Next button */}
        <Button
          variant="outline"
          size="icon"
          onClick={handleNextPage}
          disabled={currentPage === totalPages}
          className="h-9 w-9 rounded-md disabled:opacity-40 disabled:cursor-not-allowed border-border/50 hover:border-primary/50 hover:bg-primary/5 transition-all"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Right: Items per page selector */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Show per Page:</span>
        <Select
          value={pageSize.toString()}
          onValueChange={(value) => onPageSizeChange(parseInt(value, 10))}
        >
          <SelectTrigger className="h-9 w-[70px] text-sm bg-background border-border/50 hover:border-primary/50 transition-colors">
            <SelectValue>{pageSize}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {pageSizeOptions.map((size) => (
              <SelectItem key={size} value={size.toString()}>
                {size}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

