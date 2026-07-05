'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Search, RefreshCw, Eye, Trash2, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import type { StudentWithRelations } from '@/types';
import { PAGE_ROUTES } from '@/lib/constants';
import { getStatusBadgeClass, getLastAssignmentNumber } from '@/lib/ui-helpers';
import { StudentAvatar } from './StudentAvatar';

interface StudentsTableProps {
  students: StudentWithRelations[];
  currentPage?: number;
  totalPages?: number;
  totalStudents?: number;
  onPageChange?: (page: number) => void;
  isLoading?: boolean;
  search?: string;
  onSearchChange?: (search: string) => void;
  statusFilter?: string;
  onStatusFilterChange?: (status: string) => void;
  progressFilter?: string;
  onProgressFilterChange?: (progress: string) => void;
  groupFilter?: string;
  onGroupFilterChange?: (group: string) => void;
  deviceFilter?: string;
  onDeviceFilterChange?: (device: string) => void;
  programFilter?: string;
  onProgramFilterChange?: (programType: string) => void;
  onResetFilters?: () => void;
  onExportFiltered?: () => void;
  isExporting?: boolean;
}

const STATUS_OPTIONS: { label: string; value: string }[] = [
  { label: 'All Statuses', value: 'all' },
  { label: 'On Track', value: 'On Track' },
  { label: 'Behind', value: 'Behind' },
  { label: 'At Risk', value: 'At Risk' },
  { label: 'Completed', value: 'Completed' },
  { label: 'Dropped', value: 'Dropped' },
];

const PROGRESS_OPTIONS = [
  { label: 'All Progress', value: 'all' },
  ...Array.from({ length: 11 }, (_, progress) => ({
    label: `${progress}/10`,
    value: String(progress),
  })),
];

const GROUP_OPTIONS = [
  { label: 'All Groups', value: 'all' },
  { label: 'In Group', value: 'in-group' },
  { label: 'Missing', value: 'missing' },
];

const DEVICE_OPTIONS = [
  { label: 'All Devices', value: 'all' },
  { label: 'Laptop', value: 'Laptop' },
  { label: 'Desktop', value: 'Desktop' },
  { label: 'Mobile', value: 'Mobile' },
  { label: 'No Device', value: 'none' },
];

const PROGRAM_OPTIONS = [
  { label: 'All Programs', value: 'all' },
  { label: 'EJP', value: 'EJP' },
  { label: 'SCIC', value: 'SCIC' },
  { label: 'Both', value: 'Both' },
  { label: 'Other', value: 'Other' },
];

const PAGE_SIZE = 10;

export function StudentsTable({
  students,
  currentPage = 1,
  totalPages = 1,
  totalStudents = 0,
  onPageChange,
  isLoading = false,
  search = '',
  onSearchChange,
  statusFilter = 'all',
  onStatusFilterChange,
  progressFilter = 'all',
  onProgressFilterChange,
  groupFilter = 'all',
  onGroupFilterChange,
  deviceFilter = 'all',
  onDeviceFilterChange,
  programFilter = 'all',
  onProgramFilterChange,
  onResetFilters,
  onExportFiltered,
  isExporting = false,
}: StudentsTableProps) {
  // Use provided state if callbacks exist, otherwise use local state
  const hasExternalState =
    !!onSearchChange &&
    !!onStatusFilterChange &&
    !!onProgressFilterChange &&
    !!onGroupFilterChange &&
    !!onDeviceFilterChange &&
    !!onProgramFilterChange &&
    !!onResetFilters;
  const [localSearch, setLocalSearch] = useState('');
  const [localStatusFilter, setLocalStatusFilter] = useState('all');
  const [localProgressFilter, setLocalProgressFilter] = useState('all');
  const [localGroupFilter, setLocalGroupFilter] = useState('all');
  const [localDeviceFilter, setLocalDeviceFilter] = useState('all');
  const [localProgramFilter, setLocalProgramFilter] = useState('all');
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    studentId?: string;
    studentName?: string;
  }>({
    isOpen: false,
  });
  const [isDeleting, setIsDeleting] = useState(false);

  const effectiveSearch = hasExternalState ? search : localSearch;
  const effectiveStatusFilter = hasExternalState ? statusFilter : localStatusFilter;
  const effectiveProgressFilter = hasExternalState ? progressFilter : localProgressFilter;
  const effectiveGroupFilter = hasExternalState ? groupFilter : localGroupFilter;
  const effectiveDeviceFilter = hasExternalState ? deviceFilter : localDeviceFilter;
  const effectiveProgramFilter = hasExternalState ? programFilter : localProgramFilter;
  const hasActiveFilters =
    !!effectiveSearch ||
    effectiveStatusFilter !== 'all' ||
    effectiveProgressFilter !== 'all' ||
    effectiveGroupFilter !== 'all' ||
    effectiveDeviceFilter !== 'all' ||
    effectiveProgramFilter !== 'all';

  // Use server-side pagination if onPageChange is provided, otherwise use client-side
  const isServerPaginated = !!onPageChange;

  const filtered = useMemo(() => {
    // Skip filtering if using server-side pagination
    if (isServerPaginated) {
      return students;
    }

    const q = effectiveSearch.toLowerCase();

    return students.filter((s) => {
      const matchSearch =
        s.name.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        (s.phone ?? '').includes(q);

      const matchStatus =
        effectiveStatusFilter === 'all' || s.currentStatus === effectiveStatusFilter;
      const matchProgress =
        effectiveProgressFilter === 'all' ||
        getLastAssignmentNumber(s.lastCompletedAssignment) === Number(effectiveProgressFilter);
      const matchGroup =
        effectiveGroupFilter === 'all' ||
        (effectiveGroupFilter === 'in-group' && s.mentorshipJoiningStatus) ||
        (effectiveGroupFilter === 'missing' && !s.mentorshipJoiningStatus);
      const matchDevice =
        effectiveDeviceFilter === 'all' ||
        (effectiveDeviceFilter === 'none' && !s.workingDevice) ||
        s.workingDevice === effectiveDeviceFilter;
      const matchProgram =
        effectiveProgramFilter === 'all' || s.programType === effectiveProgramFilter;

      return (
        matchSearch && matchStatus && matchProgress && matchGroup && matchDevice && matchProgram
      );
    });
  }, [
    students,
    effectiveSearch,
    effectiveStatusFilter,
    effectiveProgressFilter,
    effectiveGroupFilter,
    effectiveDeviceFilter,
    effectiveProgramFilter,
    isServerPaginated,
  ]);

  // Client-side pagination
  const clientTotalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const [clientPage, setClientPage] = useState(1);

  const paginated = useMemo(() => {
    if (isServerPaginated) {
      return students;
    }
    const start = (clientPage - 1) * PAGE_SIZE;
    const end = start + PAGE_SIZE;
    return filtered.slice(start, end);
  }, [filtered, clientPage, isServerPaginated, students]);

  const displayPage = isServerPaginated ? currentPage : clientPage;
  const displayTotalPages = isServerPaginated ? totalPages : clientTotalPages;

  const handleSearch = (val: string) => {
    if (hasExternalState && onSearchChange) {
      onSearchChange(val);
    } else {
      setLocalSearch(val);
      setClientPage(1);
    }
  };

  const handleStatusFilter = (val: string) => {
    if (hasExternalState && onStatusFilterChange) {
      onStatusFilterChange(val);
    } else {
      setLocalStatusFilter(val);
      setClientPage(1);
    }
  };

  const handleProgressFilter = (val: string) => {
    if (hasExternalState && onProgressFilterChange) {
      onProgressFilterChange(val);
    } else {
      setLocalProgressFilter(val);
      setClientPage(1);
    }
  };

  const handleGroupFilter = (val: string) => {
    if (hasExternalState && onGroupFilterChange) {
      onGroupFilterChange(val);
    } else {
      setLocalGroupFilter(val);
      setClientPage(1);
    }
  };

  const handleDeviceFilter = (val: string) => {
    if (hasExternalState && onDeviceFilterChange) {
      onDeviceFilterChange(val);
    } else {
      setLocalDeviceFilter(val);
      setClientPage(1);
    }
  };

  const handleProgramFilter = (val: string) => {
    if (hasExternalState && onProgramFilterChange) {
      onProgramFilterChange(val);
    } else {
      setLocalProgramFilter(val);
      setClientPage(1);
    }
  };

  const resetFilters = () => {
    if (hasExternalState && onResetFilters) {
      onResetFilters();
    } else {
      setLocalSearch('');
      setLocalStatusFilter('all');
      setLocalProgressFilter('all');
      setLocalGroupFilter('all');
      setLocalDeviceFilter('all');
      setLocalProgramFilter('all');
      setClientPage(1);
    }
  };

  const handlePageChange = (page: number) => {
    if (isServerPaginated && onPageChange) {
      onPageChange(page);
    } else {
      setClientPage(page);
    }
  };

  const handleDeleteClick = (studentId: string, studentName: string) => {
    setDeleteModal({ isOpen: true, studentId, studentName });
  };

  const handleConfirmDelete = async () => {
    if (!deleteModal.studentId) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/students/${deleteModal.studentId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to delete student');
      }

      // Close modal
      setDeleteModal({ isOpen: false });

      // Refresh the page or trigger parent refresh
      window.location.reload();
    } catch (error) {
      console.error('Error deleting student:', error);
      alert(
        `Failed to delete student: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setDeleteModal({ isOpen: false });
  };

  return (
    <div className="bg-background rounded-xl border shadow-sm overflow-hidden">
      {/* Filters */}
      <div className="px-5 py-4 border-b bg-muted/20 flex flex-col md:flex-row gap-3 justify-between">
        <div className="relative w-full md:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={effectiveSearch}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-md text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={effectiveProgressFilter}
            onChange={(e) => handleProgressFilter(e.target.value)}
            className="border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            {PROGRESS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <select
            value={effectiveStatusFilter}
            onChange={(e) => handleStatusFilter(e.target.value)}
            className="border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <select
            value={effectiveGroupFilter}
            onChange={(e) => handleGroupFilter(e.target.value)}
            className="border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            {GROUP_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <select
            value={effectiveDeviceFilter}
            onChange={(e) => handleDeviceFilter(e.target.value)}
            className="border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            {DEVICE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <select
            value={effectiveProgramFilter}
            onChange={(e) => handleProgramFilter(e.target.value)}
            className="border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            {PROGRAM_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <button
            onClick={resetFilters}
            className="p-2 border rounded-md hover:bg-muted transition-colors"
            title="Reset filters"
          >
            <RefreshCw className="w-4 h-4 text-muted-foreground" />
          </button>

          {onExportFiltered && hasActiveFilters && (
            <button
              onClick={onExportFiltered}
              disabled={isExporting}
              className="inline-flex items-center gap-2 px-3 py-2 border rounded-md text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50"
              title="Export filtered call sheet"
            >
              <Download className="w-4 h-4" />
              {isExporting ? 'Exporting...' : 'Export'}
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/10">
              <th className="text-left px-6 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Student
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Progress
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Status
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Group
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Division
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Device
              </th>
              <th className="text-right px-6 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Action
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-border">
            {isLoading ? (
              Array.from({ length: PAGE_SIZE }).map((_, index) => (
                <tr key={`student-row-skeleton-${index}`}>
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
                      <div className="space-y-2">
                        <div className="h-4 w-32 rounded bg-muted animate-pulse" />
                        <div className="h-3 w-44 rounded bg-muted animate-pulse" />
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="space-y-2 w-28">
                      <div className="h-3 w-20 rounded bg-muted animate-pulse" />
                      <div className="h-1.5 w-28 rounded-full bg-muted animate-pulse" />
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="h-5 w-16 rounded bg-muted animate-pulse" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="h-5 w-16 rounded bg-muted animate-pulse" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="h-4 w-20 rounded bg-muted animate-pulse" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="h-4 w-16 rounded bg-muted animate-pulse" />
                  </td>
                  <td className="px-6 py-3">
                    <div className="ml-auto h-8 w-20 rounded bg-muted animate-pulse" />
                  </td>
                </tr>
              ))
            ) : paginated.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-14 text-center text-muted-foreground italic">
                  No students found matching your criteria.
                </td>
              </tr>
            ) : (
              paginated.map((s) => {
                const lastDone = getLastAssignmentNumber(s.lastCompletedAssignment);
                const pct = lastDone * 10;

                return (
                  <tr key={s._id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-3">
                        <StudentAvatar name={s.name} size="sm" />
                        <div>
                          <p className="font-semibold">{s.name}</p>
                          <p className="text-xs text-muted-foreground">{s.email}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1 w-28">
                        <div className="flex justify-between text-[11px] font-medium">
                          <span>{lastDone}/10</span>
                          <span>{pct}%</span>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${getStatusBadgeClass(
                          s.currentStatus!
                        )}`}
                      >
                        {s.currentStatus}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      {s.mentorshipJoiningStatus ? (
                        <span className="text-xs font-medium status-success border px-2 py-0.5 rounded">
                          In Group
                        </span>
                      ) : (
                        <span className="text-xs font-medium status-danger border px-2 py-0.5 rounded">
                          Missing
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3 text-sm text-muted-foreground">{s.division ?? '—'}</td>

                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {s.workingDevice ?? '—'}
                    </td>

                    <td className="px-6 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={PAGE_ROUTES.STUDENT_DETAIL.replace(':id', s._id!)}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                          title="View profile"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDeleteClick(s._id!, s.name)}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-md hover:bg-danger-soft transition-colors text-muted-foreground hover:text-danger-foreground"
                          title="Delete student"
                          disabled={isDeleting}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="px-6 py-4 border-t bg-muted/10 flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Showing {paginated.length} of {isServerPaginated ? totalStudents : filtered.length}{' '}
          students
        </p>

        {displayTotalPages > 1 && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => handlePageChange(Math.max(1, displayPage - 1))}
              disabled={displayPage === 1 || isLoading}
              className="p-1.5 rounded border hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {Array.from({ length: Math.min(displayTotalPages, 10) }, (_, i) => {
              // Show first 10 page numbers, or adjust to show current page in range
              const pageNum = i + 1;
              if (displayTotalPages <= 10) return pageNum;
              if (displayPage <= 5) return pageNum;
              if (displayPage > displayTotalPages - 5) return displayTotalPages - 9 + i;
              return displayPage - 5 + i + 1;
            }).map((p) => (
              <button
                key={p}
                onClick={() => handlePageChange(p)}
                disabled={isLoading}
                className={`w-8 h-8 rounded border text-sm font-medium transition-colors ${
                  p === displayPage
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'hover:bg-muted disabled:opacity-40'
                }`}
              >
                {p}
              </button>
            ))}

            <button
              onClick={() => handlePageChange(Math.min(displayTotalPages, displayPage + 1))}
              disabled={displayPage === displayTotalPages || isLoading}
              className="p-1.5 rounded border hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background rounded-lg border shadow-lg max-w-sm w-full mx-4">
            <div className="px-6 py-4 border-b">
              <h2 className="text-lg font-semibold">Delete Student</h2>
            </div>

            <div className="px-6 py-4">
              <p className="text-sm text-foreground mb-2">
                Are you sure you want to delete <strong>{deleteModal.studentName}</strong>?
              </p>
              <p className="text-xs text-muted-foreground">
                This action will permanently remove the student and all related data including
                assignments, call logs, and follow-ups from the database. This cannot be undone.
              </p>
            </div>

            <div className="px-6 py-4 border-t flex justify-end gap-3">
              <button
                onClick={handleCancelDelete}
                disabled={isDeleting}
                className="px-4 py-2 border rounded-md hover:bg-muted transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 bg-destructive text-destructive-foreground rounded-md hover:opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
