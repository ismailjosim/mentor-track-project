'use client';

import { useState, useMemo } from 'react';
import { getLastAssignmentNumber } from '@/lib/ui-helpers';
import { StudentsTableFilters } from './StudentsTableFilters';
import { StudentsTablePagination } from './StudentsTablePagination';
import { StudentsTableBulkBar } from './StudentsTableBulkBar';
import { BulkDeleteModal } from './BulkDeleteModal';
import { DeleteConfirmationDialog } from '@/components/shared/DeleteConfirmationDialog';
import { StudentsTableHeader } from './StudentsTableHeader';
import { StudentsTableBody } from './StudentsTableBody';
import { useStudentsTableSelection } from './useStudentsTableSelection';
import { getStudentsColumns } from './studentsColumns';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  type SortingState,
  type OnChangeFn,
} from '@tanstack/react-table';
import type { StudentWithRelations } from '@/types';
import {
  type StudentsTableProps,
  type StudentTableFilters,
  type StudentFilterKey,
  PAGE_SIZE,
} from './types';

const defaultLocalFilters: StudentTableFilters = {
  search: '',
  cohort: 'all',
  status: 'all',
  progress: 'all',
  submittedAssignment: 'all',
  notSubmittedAssignment: 'none',
  group: 'all',
  programType: 'all',
};

export function StudentsTable({
  students,
  currentPage = 1,
  totalPages = 1,
  totalStudents = 0,
  onPageChange,
  isLoading = false,
  filters,
  onFilterChange,
  onResetFilters,
  onExportFiltered,
  isExporting = false,
  sorting: externalSorting,
  onSortingChange: externalOnSortingChange,
  // Optional legacy props
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  progressFilter,
  onProgressFilterChange,
  groupFilter,
  onGroupFilterChange,
  cohortFilter,
  onCohortFilterChange,
  programFilter,
  onProgramFilterChange,
}: StudentsTableProps) {
  const [localFilters, setLocalFilters] = useState<StudentTableFilters>(defaultLocalFilters);
  const [internalSorting, setInternalSorting] = useState<SortingState>([]);
  const [clientPage, setClientPage] = useState(1);

  const sorting = externalSorting ?? internalSorting;

  const effectiveFilters: StudentTableFilters = useMemo(
    () => ({
      search: filters?.search ?? search ?? localFilters.search,
      cohort: filters?.cohort ?? cohortFilter ?? localFilters.cohort,
      status: filters?.status ?? statusFilter ?? localFilters.status,
      progress: filters?.progress ?? progressFilter ?? localFilters.progress,
      submittedAssignment: filters?.submittedAssignment ?? localFilters.submittedAssignment,
      notSubmittedAssignment:
        filters?.notSubmittedAssignment ?? localFilters.notSubmittedAssignment,
      group: filters?.group ?? groupFilter ?? localFilters.group,
      programType: filters?.programType ?? programFilter ?? localFilters.programType,
    }),
    [
      filters,
      search,
      cohortFilter,
      statusFilter,
      progressFilter,
      groupFilter,
      programFilter,
      localFilters,
    ]
  );

  const hasActiveFilters =
    Boolean(effectiveFilters.search) ||
    (effectiveFilters.cohort !== 'all' && effectiveFilters.cohort !== '') ||
    (effectiveFilters.status !== 'all' && effectiveFilters.status !== '') ||
    (effectiveFilters.progress !== 'all' && effectiveFilters.progress !== '') ||
    (effectiveFilters.submittedAssignment !== 'all' &&
      effectiveFilters.submittedAssignment !== '') ||
    (effectiveFilters.notSubmittedAssignment !== 'none' &&
      effectiveFilters.notSubmittedAssignment !== '') ||
    (effectiveFilters.group !== 'all' && effectiveFilters.group !== '') ||
    (effectiveFilters.programType !== 'all' && effectiveFilters.programType !== '');

  const isServerPaginated = !!onPageChange;

  // Helper to determine if assignment was submitted by student
  const checkAssignmentSubmitted = (s: StudentWithRelations, assignmentNum: number) => {
    const found = (s.assignments || []).find(
      (a) =>
        (a.assignmentNumber ?? (a as unknown as { assignment?: number }).assignment) ===
        assignmentNum
    );
    if (found) {
      return (
        found.status === 'SUBMITTED' ||
        found.status === 'COMPLETED' ||
        (typeof found.marks === 'number' && found.marks > 0)
      );
    }
    const lastDone = getLastAssignmentNumber(s.lastCompletedAssignment);
    return lastDone >= assignmentNum;
  };

  const filtered = useMemo(() => {
    if (isServerPaginated) return students;

    const q = effectiveFilters.search.toLowerCase().trim();
    const qDigits = q.replace(/\D/g, '');

    return students.filter((s) => {
      const sPhoneDigits = (s.phone ?? '').replace(/\D/g, '');
      const sWhatsappDigits = (s.whatsapp ?? '').replace(/\D/g, '');
      const matchSearch =
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        (!!qDigits && (sPhoneDigits.includes(qDigits) || sWhatsappDigits.includes(qDigits)));

      const matchCohort = effectiveFilters.cohort === 'all' || s.cohort === effectiveFilters.cohort;
      const matchStatus =
        effectiveFilters.status === 'all' || s.currentStatus === effectiveFilters.status;

      // Legacy progress filter
      let matchLegacyProgress = true;
      if (effectiveFilters.progress !== 'all' && effectiveFilters.progress !== '') {
        const pNum = parseInt(effectiveFilters.progress, 10);
        const lastDone = getLastAssignmentNumber(s.lastCompletedAssignment);
        if (!Number.isNaN(pNum)) {
          matchLegacyProgress = lastDone === pNum;
        }
      }

      // Specific assignment submitted criteria (e.g. A-06 submitted)
      let matchSubmitted = true;
      if (effectiveFilters.submittedAssignment && effectiveFilters.submittedAssignment !== 'all') {
        const subNum = parseInt(effectiveFilters.submittedAssignment, 10);
        if (subNum === 0) {
          const lastDone = getLastAssignmentNumber(s.lastCompletedAssignment);
          matchSubmitted = lastDone === 0 && (!s.assignments || s.assignments.length === 0);
        } else if (!Number.isNaN(subNum)) {
          matchSubmitted = checkAssignmentSubmitted(s, subNum);
        }
      }

      // Specific assignment NOT submitted criteria (e.g. A-07 NOT submitted)
      let matchNotSubmitted = true;
      if (
        effectiveFilters.notSubmittedAssignment &&
        effectiveFilters.notSubmittedAssignment !== 'none' &&
        effectiveFilters.notSubmittedAssignment !== 'all'
      ) {
        const notSubNum = parseInt(effectiveFilters.notSubmittedAssignment, 10);
        if (!Number.isNaN(notSubNum)) {
          matchNotSubmitted = !checkAssignmentSubmitted(s, notSubNum);
        }
      }

      // Mentorship Group criteria
      const matchGroup =
        effectiveFilters.group === 'all' ||
        (effectiveFilters.group === 'in-group' && s.mentorshipJoiningStatus === true) ||
        (effectiveFilters.group === 'missing' && !s.mentorshipJoiningStatus);

      const matchProgram =
        effectiveFilters.programType === 'all' || s.programType === effectiveFilters.programType;

      return (
        matchSearch &&
        matchCohort &&
        matchStatus &&
        matchLegacyProgress &&
        matchSubmitted &&
        matchNotSubmitted &&
        matchGroup &&
        matchProgram
      );
    });
  }, [students, effectiveFilters, isServerPaginated]);

  const clientTotalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const displayTotalPages = isServerPaginated ? totalPages : clientTotalPages;
  const displayPage = isServerPaginated ? currentPage : clientPage;

  const paginated = useMemo(() => {
    if (isServerPaginated) return filtered;
    const start = (clientPage - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, clientPage, isServerPaginated]);

  // Hook handles single deletion & bulk selection/deletion
  const {
    selectedIds,
    allPageSelected,
    somePageSelected,
    handleSelectAll,
    handleToggleSelect,
    handleClearSelection,
    bulkDeleteModal,
    setBulkDeleteModal,
    isBulkDeleting,
    handleBulkDelete,
    deleteModal,
    setDeleteModal,
    isDeleting,
    handleDeleteClick,
    handleConfirmDelete,
  } = useStudentsTableSelection(paginated);

  // Declarative columns matching Health-Care-App style
  const columns = useMemo(
    () =>
      getStudentsColumns({
        onDeleteClick: (id, name) => handleDeleteClick({ _id: id, name } as StudentWithRelations),
        isDeleting,
      }),
    [handleDeleteClick, isDeleting]
  );

  const handleFilterChange = (key: StudentFilterKey, value: string) => {
    setClientPage(1);
    handleClearSelection();
    if (onFilterChange) {
      onFilterChange(key, value);
    } else {
      setLocalFilters((prev) => ({ ...prev, [key]: value }));
      if (key === 'search') onSearchChange?.(value);
      if (key === 'cohort') onCohortFilterChange?.(value);
      if (key === 'status') onStatusFilterChange?.(value);
      if (key === 'progress') onProgressFilterChange?.(value);
      if (key === 'group') onGroupFilterChange?.(value);
      if (key === 'programType') onProgramFilterChange?.(value);
    }
  };

  const resetFilters = () => {
    setClientPage(1);
    handleClearSelection();
    if (onResetFilters) {
      onResetFilters();
    } else {
      setLocalFilters(defaultLocalFilters);
      onSearchChange?.('');
      onCohortFilterChange?.('all');
      onStatusFilterChange?.('all');
      onProgressFilterChange?.('all');
      onGroupFilterChange?.('all');
      onProgramFilterChange?.('all');
    }
  };

  const handlePageChange = (page: number) => {
    if (isServerPaginated && onPageChange) {
      onPageChange(page);
    } else {
      setClientPage(page);
    }
    handleClearSelection();
  };

  const handleSortingChange: OnChangeFn<SortingState> = (updaterOrValue) => {
    const nextSorting =
      typeof updaterOrValue === 'function' ? updaterOrValue(sorting) : updaterOrValue;
    if (externalOnSortingChange) {
      externalOnSortingChange(nextSorting);
    } else {
      setInternalSorting(nextSorting);
    }
  };

  // TanStack Table instance with sorting and pagination
  // eslint-disable-next-line react-hooks/incompatible-library -- TanStack Table is not yet memoizable by React Compiler; React Compiler deliberately skips this component
  const table = useReactTable({
    data: paginated,
    columns,
    state: {
      sorting,
    },
    onSortingChange: handleSortingChange,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
    pageCount: displayTotalPages,
  });

  // Extract sorted rows from TanStack Table model, falling back to paginated data
  const sortedStudents = useMemo(() => {
    const rows = table.getRowModel().rows;
    if (rows && rows.length > 0) {
      return rows.map((row) => row.original);
    }
    return paginated;
  }, [table, paginated]);

  return (
    <div className="bg-background rounded-xl border shadow-sm overflow-hidden">
      <StudentsTableFilters
        filters={effectiveFilters}
        onFilterChange={handleFilterChange}
        onResetFilters={resetFilters}
        onExportFiltered={onExportFiltered}
        isExporting={isExporting}
        hasActiveFilters={hasActiveFilters}
      />

      {/* Bulk action toolbar */}
      <StudentsTableBulkBar
        selectedCount={selectedIds.size}
        onClearSelection={handleClearSelection}
        onOpenBulkDelete={() => setBulkDeleteModal(true)}
      />

      <div className="overflow-x-auto">
        <table className="w-full min-w-190 text-sm">
          <StudentsTableHeader
            table={table}
            allPageSelected={allPageSelected}
            somePageSelected={somePageSelected}
            onSelectAll={handleSelectAll}
          />
          <StudentsTableBody
            isLoading={isLoading}
            students={sortedStudents}
            selectedIds={selectedIds}
            isDeleting={isDeleting}
            onDeleteClick={(id, name) =>
              handleDeleteClick({ _id: id, name } as StudentWithRelations)
            }
            onToggleSelect={handleToggleSelect}
          />
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

      {/* Delete Confirmation Dialog matching Health-Care-App pattern */}
      <DeleteConfirmationDialog
        open={deleteModal.isOpen}
        onOpenChange={(open) => !open && setDeleteModal({ isOpen: false })}
        onConfirm={handleConfirmDelete}
        title="Delete Student"
        itemName={deleteModal.studentName}
        description={
          deleteModal.studentName
            ? `Are you sure you want to delete ${deleteModal.studentName}? This action cannot be undone.`
            : 'Are you sure you want to delete this student? This action cannot be undone.'
        }
        isDeleting={isDeleting}
      />

      {/* Bulk delete modal */}
      <BulkDeleteModal
        isOpen={bulkDeleteModal}
        count={selectedIds.size}
        isDeleting={isBulkDeleting}
        onConfirm={handleBulkDelete}
        onCancel={() => setBulkDeleteModal(false)}
      />
    </div>
  );
}
