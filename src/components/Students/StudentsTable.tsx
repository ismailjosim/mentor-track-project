'use client';

import { useState, useMemo } from 'react';
import { getLastAssignmentNumber } from '@/lib/ui-helpers';
import { StudentsTableFilters } from './StudentsTableFilters';
import { StudentsTablePagination } from './StudentsTablePagination';
import { StudentsTableBulkBar } from './StudentsTableBulkBar';
import { DeleteStudentModal } from './DeleteStudentModal';
import { BulkDeleteModal } from './BulkDeleteModal';
import { StudentsTableHeader } from './StudentsTableHeader';
import { StudentsTableBody } from './StudentsTableBody';
import { useStudentsTableSelection } from './useStudentsTableSelection';
import { useReactTable, getCoreRowModel, type ColumnDef } from '@tanstack/react-table';
import type { StudentWithRelations } from '@/types';
import {
  type StudentsTableProps,
  type StudentTableFilters,
  type StudentFilterKey,
  PAGE_SIZE,
} from './types';

const columns: ColumnDef<StudentWithRelations>[] = [
  { id: 'select', header: 'Select' },
  { id: 'student', header: 'Student', accessorKey: 'name' },
  { id: 'progress', header: 'Progress', accessorKey: 'lastCompletedAssignment' },
  { id: 'status', header: 'Status', accessorKey: 'currentStatus' },
  { id: 'group', header: 'Group', accessorKey: 'mentorshipJoiningStatus' },
  { id: 'division', header: 'Division', accessorKey: 'division' },
  { id: 'device', header: 'Device', accessorKey: 'workingDevice' },
  { id: 'action', header: 'Action' },
];

const defaultLocalFilters: StudentTableFilters = {
  search: '',
  cohort: 'all',
  status: 'all',
  progress: 'all',
  group: 'all',
  device: 'all',
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
  // Optional legacy props
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  progressFilter,
  onProgressFilterChange,
  groupFilter,
  onGroupFilterChange,
  deviceFilter,
  onDeviceFilterChange,
  cohortFilter,
  onCohortFilterChange,
  programFilter,
  onProgramFilterChange,
}: StudentsTableProps) {
  const [localFilters, setLocalFilters] = useState<StudentTableFilters>(defaultLocalFilters);
  const [clientPage, setClientPage] = useState(1);

  const effectiveFilters: StudentTableFilters = useMemo(
    () => ({
      search: filters?.search ?? search ?? localFilters.search,
      cohort: filters?.cohort ?? cohortFilter ?? localFilters.cohort,
      status: filters?.status ?? statusFilter ?? localFilters.status,
      progress: filters?.progress ?? progressFilter ?? localFilters.progress,
      group: filters?.group ?? groupFilter ?? localFilters.group,
      device: filters?.device ?? deviceFilter ?? localFilters.device,
      programType: filters?.programType ?? programFilter ?? localFilters.programType,
    }),
    [
      filters,
      search,
      cohortFilter,
      statusFilter,
      progressFilter,
      groupFilter,
      deviceFilter,
      programFilter,
      localFilters,
    ]
  );

  const hasActiveFilters =
    !!effectiveFilters.search ||
    effectiveFilters.cohort !== 'all' ||
    effectiveFilters.status !== 'all' ||
    effectiveFilters.progress !== 'all' ||
    effectiveFilters.group !== 'all' ||
    effectiveFilters.device !== 'all' ||
    effectiveFilters.programType !== 'all';

  const isServerPaginated = !!onPageChange;

  const filtered = useMemo(() => {
    if (isServerPaginated) return students;

    const q = effectiveFilters.search.toLowerCase().trim();
    const qDigits = q.replace(/\D/g, '');
    return students
      .filter((s) => {
        const sPhoneDigits = (s.phone ?? '').replace(/\D/g, '');
        const sWhatsappDigits = (s.whatsapp ?? '').replace(/\D/g, '');
        const matchSearch =
          !q ||
          s.name.toLowerCase().includes(q) ||
          s.email.toLowerCase().includes(q) ||
          (!!qDigits && (sPhoneDigits.includes(qDigits) || sWhatsappDigits.includes(qDigits)));

        const matchCohort =
          effectiveFilters.cohort === 'all' || s.cohort === effectiveFilters.cohort;
        const matchStatus =
          effectiveFilters.status === 'all' || s.currentStatus === effectiveFilters.status;

        const lastDone = getLastAssignmentNumber(s.lastCompletedAssignment);
        let matchProgress = true;
        if (effectiveFilters.progress === '0') matchProgress = lastDone === 0;
        else if (effectiveFilters.progress === '1-3')
          matchProgress = lastDone >= 1 && lastDone <= 3;
        else if (effectiveFilters.progress === '4-6')
          matchProgress = lastDone >= 4 && lastDone <= 6;
        else if (effectiveFilters.progress === '7-9')
          matchProgress = lastDone >= 7 && lastDone <= 9;
        else if (effectiveFilters.progress === '10') matchProgress = lastDone === 10;

        const matchGroup =
          effectiveFilters.group === 'all' ||
          (effectiveFilters.group === 'in-group' && s.mentorshipJoiningStatus === true) ||
          (effectiveFilters.group === 'missing' && !s.mentorshipJoiningStatus);
        const matchDevice =
          effectiveFilters.device === 'all' || s.workingDevice === effectiveFilters.device;
        const matchProgram =
          effectiveFilters.programType === 'all' ||
          s.programType === effectiveFilters.programType;

        return (
          matchSearch &&
          matchCohort &&
          matchStatus &&
          matchProgress &&
          matchGroup &&
          matchDevice &&
          matchProgram
        );
      })
      .sort((a, b) => {
        const doneA = getLastAssignmentNumber(a.lastCompletedAssignment);
        const doneB = getLastAssignmentNumber(b.lastCompletedAssignment);
        return doneB - doneA;
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
      if (key === 'device') onDeviceFilterChange?.(value);
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
      onDeviceFilterChange?.('all');
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

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: paginated,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: displayTotalPages,
  });

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
            students={paginated}
            selectedIds={selectedIds}
            isDeleting={isDeleting}
            onDeleteClick={(id, name) => handleDeleteClick({ _id: id, name } as StudentWithRelations)}
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

      {/* Single delete modal */}
      <DeleteStudentModal
        isOpen={deleteModal.isOpen}
        studentName={deleteModal.studentName}
        isDeleting={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteModal({ isOpen: false })}
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
