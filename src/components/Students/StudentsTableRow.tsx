'use client';

import Link from 'next/link';
import { Eye, Trash2 } from 'lucide-react';
import type { StudentWithRelations } from '@/types';
import { PAGE_ROUTES } from '@/lib/constants';
import { getStatusBadgeClass, getLastAssignmentNumber } from '@/lib/ui-helpers';
import { StudentAvatar } from './StudentAvatar';

interface StudentsTableRowProps {
  student: StudentWithRelations;
  onDeleteClick: (id: string, name: string) => void;
  isDeleting: boolean;
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
}

export function StudentsTableRow({
  student: s,
  onDeleteClick,
  isDeleting,
  isSelected = false,
  onToggleSelect,
}: StudentsTableRowProps) {
  const lastDone = getLastAssignmentNumber(s.lastCompletedAssignment);
  const pct = lastDone * 10;

  return (
    <tr
      className={`hover:bg-muted/20 transition-colors ${isSelected ? 'bg-primary/5 hover:bg-primary/8' : ''}`}
    >
      {/* Checkbox cell */}
      {onToggleSelect && (
        <td className="px-4 py-3 w-10">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onToggleSelect(s._id!)}
            onClick={(e) => e.stopPropagation()}
            className="w-4 h-4 rounded border-border accent-primary cursor-pointer"
            aria-label={`Select ${s.name}`}
            id={`select-student-${s._id}`}
          />
        </td>
      )}

      <td className="px-6 py-3">
        <div className="flex items-center gap-3">
          <StudentAvatar name={s.name} size="sm" />
          <div>
            <div className="flex items-center gap-1.5">
              <p className="font-semibold">{s.name}</p>
              {s.cohort && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">
                  B-{s.cohort}
                </span>
              )}
            </div>
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

      <td className="px-4 py-3 text-sm text-muted-foreground">{s.workingDevice ?? '—'}</td>

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
            onClick={() => onDeleteClick(s._id!, s.name)}
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
}
