'use client';

import { useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';
import { getLastAssignmentNumber } from '@/lib/ui-helpers';
import { StudentsTableFilters } from './StudentsTableFilters';
import { StudentsTablePagination } from './StudentsTablePagination';
import { DeleteStudentModal } from './DeleteStudentModal';
import { StudentsTableRow } from './StudentsTableRow';
import { StudentsTableSkeleton } from './StudentsTableSkeleton';
import { useReactTable, getCoreRowModel, flexRender, type ColumnDef } from '@tanstack/react-table';
import type { StudentWithRelations } from '@/types';
import {
  type StudentsTableProps,
  type StudentTableFilters,
  type StudentFilterKey,
  PAGE_SIZE,
} from './types';

const columns: ColumnDef<StudentWithRelations>[] = [
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

  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    studentId?: string;
    studentName?: string;
  }>({ isOpen: false });
  const [isDeleting, setIsDeleting] = useState(false);

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
          (s.phone ?? '').toLowerCase().includes(q) ||
          (qDigits.length >= 2 &&
            (sPhoneDigits.includes(qDigits) || sWhatsappDigits.includes(qDigits)));

        const matchStatus =
          effectiveFilters.status === 'all' || s.currentStatus === effectiveFilters.status;
        const matchProgress =
          effectiveFilters.progress === 'all' ||
          getLastAssignmentNumber(s.lastCompletedAssignment) === Number(effectiveFilters.progress);
        const matchGroup =
          effectiveFilters.group === 'all' ||
          (effectiveFilters.group === 'in-group' && s.mentorshipJoiningStatus) ||
          (effectiveFilters.group === 'missing' && !s.mentorshipJoiningStatus);
        const matchDevice =
          effectiveFilters.device === 'all' ||
          (effectiveFilters.device === 'none' && !s.workingDevice) ||
          s.workingDevice === effectiveFilters.device;
        const matchProgram =
          effectiveFilters.programType === 'all' || s.programType === effectiveFilters.programType;

        return (
          matchSearch && matchStatus && matchProgress && matchGroup && matchDevice && matchProgram
        );
      })
      .sort((a, b) =>
        (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' })
      );
  }, [students, effectiveFilters, isServerPaginated]);

  const clientTotalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = useMemo(() => {
    if (isServerPaginated) return students;
    const start = (clientPage - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, clientPage, isServerPaginated, students]);

  const displayPage = isServerPaginated ? currentPage : clientPage;
  const displayTotalPages = isServerPaginated ? totalPages : clientTotalPages;

  const handleFilterChange = (key: StudentFilterKey, val: string) => {
    if (onFilterChange) {
      onFilterChange(key, val);
      return;
    }
    if (key === 'search' && onSearchChange) return onSearchChange(val);
    if (key === 'cohort' && onCohortFilterChange) return onCohortFilterChange(val);
    if (key === 'status' && onStatusFilterChange) return onStatusFilterChange(val);
    if (key === 'progress' && onProgressFilterChange) return onProgressFilterChange(val);
    if (key === 'group' && onGroupFilterChange) return onGroupFilterChange(val);
    if (key === 'device' && onDeviceFilterChange) return onDeviceFilterChange(val);
    if (key === 'programType' && onProgramFilterChange) return onProgramFilterChange(val);

    setLocalFilters((prev) => ({ ...prev, [key]: val }));
    setClientPage(1);
  };

  const resetFilters = () => {
    if (onResetFilters) {
      onResetFilters();
    } else {
      setLocalFilters(defaultLocalFilters);
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

  const queryClient = useQueryClient();

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
      toast.success('Student deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['students'] });
    } catch (error) {
      toast.error(
        `Failed to delete student: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      setIsDeleting(false);
    }
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

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b bg-muted/10">
                {headerGroup.headers.map((header) => {
                  const id = header.id;
                  const isStudent = id === 'student';
                  const isAction = id === 'action';
                  return (
                    <th
                      key={header.id}
                      className={`py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground ${
                        isStudent
                          ? 'text-left px-6'
                          : isAction
                            ? 'text-right px-6'
                            : 'text-left px-4'
                      }`}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  );
                })}
              </tr>
            ))}
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
