'use client';

import Link from 'next/link';
import { Eye, Trash2 } from 'lucide-react';
import type { ColumnDef } from '@tanstack/react-table';
import type { StudentWithRelations } from '@/types';
import { PAGE_ROUTES } from '@/lib/constants';
import { getLastAssignmentNumber } from '@/lib/ui-helpers';
import { UserInfoCell } from '@/components/shared/Cell/UserInfoCell';
import { StatusBadgeCell } from '@/components/shared/Cell/StatusBadgeCell';

export interface StudentsColumnsOptions {
  onDeleteClick: (id: string, name: string) => void;
  isDeleting?: boolean;
}

export const getStudentsColumns = ({
  onDeleteClick,
  isDeleting = false,
}: StudentsColumnsOptions): ColumnDef<StudentWithRelations>[] => [
  {
    id: 'select',
    header: 'Select',
    enableSorting: false,
    cell: ({ row }) => (
      <input
        type="checkbox"
        checked={row.getIsSelected()}
        onChange={row.getToggleSelectedHandler()}
        onClick={(e) => e.stopPropagation()}
        className="w-4 h-4 rounded border-border accent-primary cursor-pointer"
        aria-label={`Select ${row.original.name}`}
      />
    ),
  },
  {
    id: 'student',
    header: 'Student',
    accessorKey: 'name',
    enableSorting: true,
    cell: ({ row }) => {
      const s = row.original;
      return <UserInfoCell name={s.name} email={s.email} cohort={s.cohort} />;
    },
  },
  {
    id: 'progress',
    header: 'Progress',
    accessorFn: (row) => getLastAssignmentNumber(row.lastCompletedAssignment),
    enableSorting: true,
    cell: ({ row }) => {
      const s = row.original;
      const completedAssignments = (s.assignments || []).filter(
        (a) =>
          a.status === 'COMPLETED' ||
          (typeof a.marks === 'number' && !Number.isNaN(a.marks) && a.marks > 0)
      );
      const maxCompleted =
        completedAssignments.length > 0
          ? Math.max(...completedAssignments.map((a) => a.assignmentNumber ?? 0))
          : 0;
      const lastDone =
        s.assignments && s.assignments.length > 0
          ? maxCompleted
          : getLastAssignmentNumber(s.lastCompletedAssignment);
      const pct = lastDone * 10;

      return (
        <div className="flex flex-col gap-1 w-28">
          <div className="flex justify-between text-[11px] font-medium text-foreground">
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
      );
    },
  },
  {
    id: 'status',
    header: 'Status',
    accessorKey: 'currentStatus',
    enableSorting: true,
    cell: ({ row }) => <StatusBadgeCell status={row.original.currentStatus || 'On Track'} />,
  },
  {
    id: 'group',
    header: 'Group',
    accessorFn: (row) => (row.mentorshipJoiningStatus ? 1 : 0),
    enableSorting: true,
    cell: ({ row }) =>
      row.original.mentorshipJoiningStatus ? (
        <span className="text-xs font-medium status-success border px-2 py-0.5 rounded">
          In Group
        </span>
      ) : (
        <span className="text-xs font-medium status-danger border px-2 py-0.5 rounded">
          Missing
        </span>
      ),
  },
  {
    id: 'lastSubmitted',
    header: 'Last Submitted',
    accessorFn: (row) => {
      const submitted = (row.assignments || []).filter(
        (a) =>
          a.status === 'COMPLETED' ||
          a.status === 'SUBMITTED' ||
          (typeof a.marks === 'number' && !Number.isNaN(a.marks))
      );
      if (submitted.length > 0) {
        return Math.max(...submitted.map((a) => a.assignmentNumber ?? 0));
      }
      return getLastAssignmentNumber(row.lastCompletedAssignment);
    },
    enableSorting: true,
    cell: ({ row }) => {
      const s = row.original;
      const submitted = (s.assignments || []).filter(
        (a) =>
          a.status === 'COMPLETED' ||
          a.status === 'SUBMITTED' ||
          (typeof a.marks === 'number' && !Number.isNaN(a.marks))
      );
      const maxFromAssignments =
        submitted.length > 0
          ? Math.max(...submitted.map((a) => a.assignmentNumber ?? 0))
          : 0;
      const lastDone = getLastAssignmentNumber(s.lastCompletedAssignment);
      const bestLastNum = Math.max(maxFromAssignments, lastDone);
      const lastSubmitted = bestLastNum > 0 ? `A-${String(bestLastNum).padStart(2, '0')}` : '—';

      return lastSubmitted !== '—' ? (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-muted text-foreground border border-border">
          {lastSubmitted}
        </span>
      ) : (
        <span className="text-sm text-muted-foreground">—</span>
      );
    },
  },
  {
    id: 'avgMarks',
    header: 'Avg Marks',
    accessorFn: (row) => {
      const graded = (row.assignments || []).filter(
        (a) => typeof a.marks === 'number' && !Number.isNaN(a.marks)
      );
      if (graded.length > 0) {
        return graded.reduce((sum, a) => sum + (a.marks || 0), 0) / graded.length;
      }
      return typeof row.scicMarks === 'number' ? row.scicMarks : -1;
    },
    enableSorting: true,
    cell: ({ row }) => {
      const s = row.original;
      const graded = (s.assignments || []).filter(
        (a) => typeof a.marks === 'number' && !Number.isNaN(a.marks)
      );
      let avgMarks: number | null = null;
      let avgMarksFormatted = '—';

      if (graded.length > 0) {
        const total = graded.reduce((sum, a) => sum + (a.marks || 0), 0);
        avgMarks = total / graded.length;
        avgMarksFormatted = Number.isInteger(avgMarks) ? String(avgMarks) : avgMarks.toFixed(1);
      } else if (typeof s.scicMarks === 'number' && !Number.isNaN(s.scicMarks)) {
        avgMarks = s.scicMarks;
        avgMarksFormatted = Number.isInteger(avgMarks) ? String(avgMarks) : avgMarks.toFixed(1);
      }

      if (avgMarks === null) return <span className="text-sm text-muted-foreground">—</span>;

      const isPassing = avgMarks >= 48;
      return (
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${
            isPassing ? 'status-success' : 'status-danger'
          }`}
          title={`Average: ${avgMarksFormatted}`}
        >
          {avgMarksFormatted}
        </span>
      );
    },
  },
  {
    id: 'action',
    header: 'Action',
    enableSorting: false,
    cell: ({ row }) => {
      const s = row.original;
      return (
        <div className="flex items-center justify-end gap-2">
          <Link
            href={PAGE_ROUTES.STUDENT_DETAIL.replace(':id', s._id!)}
            className="inline-flex items-center justify-center w-8 h-8 rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            title="View profile"
          >
            <Eye className="w-4 h-4" />
          </Link>
          <button
            type="button"
            onClick={() => onDeleteClick(s._id!, s.name)}
            className="inline-flex items-center justify-center w-8 h-8 rounded-md hover:bg-danger-soft transition-colors text-muted-foreground hover:text-danger-foreground cursor-pointer"
            title="Delete student"
            disabled={isDeleting}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      );
    },
  },
];
