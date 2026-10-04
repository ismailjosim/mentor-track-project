'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

interface StudentsTablePaginationProps {
  itemCount: number;
  totalStudents: number;
  currentPage: number;
  totalPages: number;
  isLoading?: boolean;
  onPageChange: (page: number) => void;
}

export function StudentsTablePagination({
  itemCount,
  totalStudents,
  currentPage,
  totalPages,
  isLoading = false,
  onPageChange,
}: StudentsTablePaginationProps) {
  return (
    <div className="px-4 py-3 sm:px-6 sm:py-4 border-t bg-muted/10 flex flex-col sm:flex-row items-center justify-between gap-3">
      <p className="text-xs text-muted-foreground text-center sm:text-left">
        Showing {itemCount} of {totalStudents} students
      </p>

      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          <button
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1 || isLoading}
            className="p-1.5 rounded border hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            aria-label="Previous page"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Mobile compact pagination indicator */}
          <span className="text-xs font-semibold px-2 inline-block sm:hidden">
            Page {currentPage} of {totalPages}
          </span>

          {/* Desktop full numbered page buttons */}
          <div className="hidden sm:flex items-center gap-1">
            {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => {
              const pageNum = i + 1;
              if (totalPages <= 10) return pageNum;
              if (currentPage <= 5) return pageNum;
              if (currentPage > totalPages - 5) return totalPages - 9 + i;
              return currentPage - 5 + i + 1;
            }).map((p) => (
              <button
                key={p}
                onClick={() => onPageChange(p)}
                disabled={isLoading}
                className={`w-8 h-8 rounded border text-sm font-medium transition-colors ${
                  p === currentPage
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'hover:bg-muted disabled:opacity-40'
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          <button
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages || isLoading}
            className="p-1.5 rounded border hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            aria-label="Next page"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
