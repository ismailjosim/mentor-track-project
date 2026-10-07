'use client';

import { useState, useMemo } from 'react';
import { CheckCircle2, Circle, Clock } from 'lucide-react';
import type { Assignment } from '@/interfaces/assignment.interface';
import { cn } from '@/lib/cn';
import { ScicEligibilityPanel } from './ScicEligibilityPanel';
import { AssignmentModal } from './AssignmentModal';

interface AssignmentChecklistProps {
  assignments: Assignment[];
  studentId: string;
  onUpdate?: () => void;
}

const TOTAL = 10;

export function AssignmentChecklist({
  assignments,
  studentId,
  onUpdate,
}: AssignmentChecklistProps) {
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const assignmentMap = useMemo(
    () => new Map(assignments.map((a) => [a.assignmentNumber, a])),
    [assignments]
  );

  const completed = useMemo(
    () => assignments.filter((a) => a.status === 'COMPLETED' || a.status === 'SUBMITTED').length,
    [assignments]
  );
  const pct = Math.round((completed / TOTAL) * 100);

  const totalSubmittedCount = completed;
  const totalMarks = useMemo(() => {
    return assignments.reduce((sum, a) => {
      const val = typeof a.marks === 'number' && !Number.isNaN(a.marks) ? a.marks : 0;
      return sum + val;
    }, 0);
  }, [assignments]);

  const avgMarks = totalSubmittedCount > 0 ? totalMarks / totalSubmittedCount : 0;
  const avgMarksFormatted =
    totalSubmittedCount > 0
      ? Number.isInteger(avgMarks)
        ? String(avgMarks)
        : avgMarks.toFixed(1)
      : '0';

  const handleAssignmentClick = (assignment: Assignment | undefined, num: number) => {
    const a: Assignment = assignment || {
      assignmentNumber: num,
      status: 'NOT_DEFINED',
      marks: undefined,
      maxMarks: 60,
    };
    setSelectedAssignment(a);
    setIsModalOpen(true);
  };

  const isSelectedExisting = useMemo(() => {
    if (!selectedAssignment) return false;
    return assignments.some((a) => a.assignmentNumber === selectedAssignment.assignmentNumber);
  }, [assignments, selectedAssignment]);

  return (
    <>
      {/* Assignment Checklist */}
      <div className="bg-background rounded-xl border shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Course Progress</h3>
            <span className="text-sm font-bold text-primary">{pct}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1.5">
            {completed} of {TOTAL} assignments done
          </p>

          <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t">
            <div className="bg-muted/40 rounded-lg p-2.5">
              <p className="text-[11px] text-muted-foreground font-medium">Total Marks</p>
              <p className="text-base font-bold text-foreground">{totalMarks}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {totalSubmittedCount > 0 ? `${totalSubmittedCount} submitted` : 'No submissions'}
              </p>
            </div>
            <div className="bg-muted/40 rounded-lg p-2.5">
              <p className="text-[11px] text-muted-foreground font-medium">Average Marks</p>
              <p className="text-base font-bold text-primary">{avgMarksFormatted}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {totalSubmittedCount > 0
                  ? `Based on ${totalSubmittedCount} submitted`
                  : 'No submissions'}
              </p>
            </div>
          </div>
        </div>

        <div className="divide-y divide-border">
          {Array.from({ length: TOTAL }, (_, i) => {
            const num = i + 1;
            const a = assignmentMap.get(num);
            const isCompleted = a?.status === 'COMPLETED';
            const isSubmitted = a?.status === 'SUBMITTED';
            const isPending = a?.status === 'PENDING';
            const hasMarks = isCompleted && a?.marks !== undefined;
            const maxM = a?.maxMarks ?? 60;
            const marksPct = hasMarks ? Math.round((a!.marks! / maxM) * 100) : null;

            return (
              <div
                key={num}
                onClick={() => handleAssignmentClick(a, num)}
                className={cn(
                  'flex flex-col gap-1.5 px-5 py-3 text-sm transition-colors cursor-pointer',
                  isCompleted
                    ? 'bg-success-soft/70 hover:bg-success-soft'
                    : isSubmitted
                      ? 'bg-info-soft/70 hover:bg-info-soft'
                      : 'hover:bg-muted/30'
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {isCompleted ? (
                      <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
                    ) : isSubmitted ? (
                      <Clock className="w-4 h-4 text-info shrink-0" />
                    ) : isPending ? (
                      <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                    ) : (
                      <Circle className="w-4 h-4 text-muted-foreground shrink-0" />
                    )}
                    <span
                      className={cn(
                        'font-medium',
                        isCompleted && 'text-success-foreground',
                        isSubmitted && 'text-info-foreground'
                      )}
                    >
                      Assignment {String(num).padStart(2, '0')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {hasMarks && (
                      <span className="text-xs font-semibold text-muted-foreground">
                        {a!.marks}/{maxM}
                      </span>
                    )}
                    <span
                      className={cn(
                        'text-xs font-semibold px-2 py-0.5 rounded border',
                        isCompleted
                          ? 'status-success'
                          : isSubmitted
                            ? 'status-info'
                            : isPending
                              ? 'status-warning'
                              : 'bg-muted text-muted-foreground border-transparent'
                      )}
                    >
                      {isCompleted
                        ? marksPct !== null
                          ? `${marksPct}%`
                          : 'Done'
                        : isSubmitted
                          ? 'Submitted'
                          : isPending
                            ? 'Pending'
                            : '—'}
                    </span>
                  </div>
                </div>

                {hasMarks && marksPct !== null && (
                  <div className="flex items-center gap-2 pl-7">
                    <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all',
                          marksPct >= 70
                            ? 'bg-success'
                            : marksPct >= 50
                              ? 'bg-primary'
                              : 'bg-destructive'
                        )}
                        style={{ width: `${marksPct}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground w-8 text-right shrink-0">
                      {marksPct}%
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* SCIC Eligibility Panel */}
      <ScicEligibilityPanel assignments={assignments} />

      {/* Assignment Edit/Update Modal */}
      {isModalOpen && selectedAssignment && (
        <AssignmentModal
          key={`${selectedAssignment.assignmentNumber}-${selectedAssignment.status}-${selectedAssignment.marks}`}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          selectedAssignment={selectedAssignment}
          studentId={studentId}
          isExisting={isSelectedExisting}
          onSuccess={onUpdate}
        />
      )}
    </>
  );
}
