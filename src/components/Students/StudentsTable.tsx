'use client';

import { useState, useMemo } from 'react';
import { getLastAssignmentNumber } from '@/lib/ui-helpers';
import { StudentsTableFilters } from './StudentsTableFilters';
import { StudentsTablePagination } from './StudentsTablePagination';
import { DeleteStudentModal } from './DeleteStudentModal';
import { StudentsTableRow } from './StudentsTableRow';
import { StudentsTableSkeleton } from './StudentsTableSkeleton';
import { type StudentsTableProps, PAGE_SIZE } from './types';

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
  const [clientPage, setClientPage] = useState(1);

  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    studentId?: string;
    studentName?: string;
  }>({ isOpen: false });
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

  const isServerPaginated = !!onPageChange;

  const filtered = useMemo(() => {
    if (isServerPaginated) return students;

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

  const clientTotalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = useMemo(() => {
    if (isServerPaginated) return students;
    const start = (clientPage - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
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

      setDeleteModal({ isOpen: false });
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

  return (
    <div className="bg-background rounded-xl border shadow-sm overflow-hidden">
      <StudentsTableFilters
        search={effectiveSearch}
        onSearchChange={handleSearch}
        statusFilter={effectiveStatusFilter}
        onStatusFilterChange={handleStatusFilter}
        progressFilter={effectiveProgressFilter}
        onProgressFilterChange={handleProgressFilter}
        groupFilter={effectiveGroupFilter}
        onGroupFilterChange={handleGroupFilter}
        deviceFilter={effectiveDeviceFilter}
        onDeviceFilterChange={handleDeviceFilter}
        programFilter={effectiveProgramFilter}
        onProgramFilterChange={handleProgramFilter}
        onResetFilters={resetFilters}
        onExportFiltered={onExportFiltered}
        isExporting={isExporting}
        hasActiveFilters={hasActiveFilters}
      />

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
              <StudentsTableSkeleton />
            ) : paginated.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-14 text-center text-muted-foreground italic">
                  No students found matching your criteria.
                </td>
              </tr>
            ) : (
              paginated.map((s) => (
                <StudentsTableRow
                  key={s._id}
                  student={s}
                  onDeleteClick={handleDeleteClick}
                  isDeleting={isDeleting}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      <StudentsTablePagination
        itemCount={paginated.length}
        totalStudents={isServerPaginated ? totalStudents : filtered.length}
        currentPage={displayPage}
        totalPages={displayTotalPages}
        isLoading={isLoading}
        onPageChange={handlePageChange}
      />

      <DeleteStudentModal
        isOpen={deleteModal.isOpen}
        studentName={deleteModal.studentName}
        isDeleting={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteModal({ isOpen: false })}
      />
    </div>
  );
}
