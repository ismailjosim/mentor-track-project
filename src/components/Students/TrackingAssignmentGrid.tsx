'use client';

import type { StudentAssignment } from '@/interfaces/assignment.interface';

interface TrackingAssignmentGridProps {
  assignments: StudentAssignment[];
  currentAssignmentNumber: number;
}

export function TrackingAssignmentGrid({
  assignments,
  currentAssignmentNumber,
}: TrackingAssignmentGridProps) {
  return (
    <div className="space-y-3 border-t pt-6">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
        Assignment Status
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-3">
        {Array.from({ length: 10 }, (_, i) => {
          const assignmentNum = i + 1;
          const assignment = assignments.find((a) => a.assignmentNumber === assignmentNum);
          const isCompleted = assignment?.status === 'COMPLETED';
          const isSubmitted = assignment?.status === 'SUBMITTED';
          const isCurrent = assignmentNum === currentAssignmentNumber;

          const statusClass = isCompleted
            ? 'status-success font-semibold shadow-xs'
            : isSubmitted
              ? 'status-info font-semibold shadow-xs'
              : isCurrent
                ? 'status-warning font-semibold'
                : 'status-neutral';

          const statusTitle = isCompleted
            ? 'Completed (Graded / Has Marks)'
            : isSubmitted
              ? 'Submitted (No Marks Yet)'
              : isCurrent
                ? 'Current Assignment'
                : 'Not Started';

          return (
            <div
              key={assignmentNum}
              className={`flex flex-col items-center justify-center min-h-14 rounded-lg border px-2 py-2 text-xs transition-all ${statusClass}`}
              title={statusTitle}
            >
              <span className="font-bold">A-{String(assignmentNum).padStart(2, '0')}</span>
              <span className="text-[10px] font-medium opacity-90 mt-0.5">
                {isCompleted
                  ? 'Completed'
                  : isSubmitted
                    ? 'Submitted'
                    : isCurrent
                      ? 'Current'
                      : 'Pending'}
              </span>
            </div>
          );
        })}
      </div>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground pt-1">
        <span className="inline-flex items-center">
          <span className="inline-block w-3.5 h-3.5 bg-success-soft border border-success-border rounded mr-2" />
          Completed
        </span>
        <span className="inline-flex items-center">
          <span className="inline-block w-3.5 h-3.5 bg-info-soft border border-info-border rounded mr-2" />
          Submitted (No Marks)
        </span>
        <span className="inline-flex items-center">
          <span className="inline-block w-3.5 h-3.5 bg-warning-soft border border-warning-border rounded mr-2" />
          Current
        </span>
        <span className="inline-flex items-center">
          <span className="inline-block w-3.5 h-3.5 bg-neutral-soft border border-neutral-border rounded mr-2" />
          Not Started
        </span>
      </div>
    </div>
  );
}
