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
    <div className="px-6 py-4 border-t bg-muted/10 flex items-center justify-between">
      <p className="text-xs text-muted-foreground">
        Showing {itemCount} of {totalStudents} students
      </p>

      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          <button
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1 || isLoading}
            className="p-1.5 rounded border hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

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

          <button
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages || isLoading}
            className="p-1.5 rounded border hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
