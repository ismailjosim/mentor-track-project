'use client';

import { useState, useCallback, useMemo } from 'react';
import { CheckCircle2, Circle, Clock, Loader2, Trash2, Trophy, XCircle, Info } from 'lucide-react';
import type { Assignment, AssignmentMaxMarks } from '@/interfaces/assignment.interface';
import { cn } from '@/lib/cn';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/Modal';
import { assignmentApi } from '@/lib/api-client';
import toast from 'react-hot-toast';

interface AssignmentChecklistProps {
  assignments: Assignment[];
  studentId: string;
  onUpdate?: () => void;
}

const TOTAL = 10;

function computeScicEligibility(assignments: Assignment[]) {
  const map = new Map(assignments.map((a) => [a.assignmentNumber, a]));

  const details1 = [1, 2, 3, 4, 5, 6, 7, 8].map((n) => {
    const a = map.get(n);
    const hasMarks = a?.status === 'COMPLETED' && a.marks !== undefined;
    if (!hasMarks || !a) return { num: n, pass: false, pct: null as number | null };
    const max = a.maxMarks ?? 60;
    const pct = Math.round((a.marks! / max) * 100);
    return { num: n, pass: pct >= 50, pct };
  });
  const cond1 = details1.every((r) => r.pass);

  const details2 = [9, 10].map((n) => {
    const a = map.get(n);
    const hasMarks = a?.status === 'COMPLETED' && a.marks !== undefined;
    if (!hasMarks || !a) return { num: n, pass: false, pct: null as number | null };
    const max = a.maxMarks ?? 60;
    const pct = Math.round((a.marks! / max) * 100);
    return { num: n, pass: pct >= 70, pct };
  });
  const cond2 = details2.every((r) => r.pass);

  const completedAll = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => map.get(n));
  const allDone = completedAll.every((a) => a?.status === 'COMPLETED' && a.marks !== undefined);
  const avg = allDone ? completedAll.reduce((s, a) => s + (a?.marks ?? 0), 0) / 10 : null;
  const cond3 = avg !== null && avg >= 48;

  return { cond1, cond2, cond3, eligible: cond1 && cond2 && cond3, avg, details1, details2 };
}

export function AssignmentChecklist({
  assignments,
  studentId: _studentId,
  onUpdate,
}: AssignmentChecklistProps) {
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [newStatus, setNewStatus] = useState<string>('');
  const [newMarks, setNewMarks] = useState<string>('');
  const [newMaxMarks, setNewMaxMarks] = useState<AssignmentMaxMarks>(60);

  const assignmentMap = new Map(assignments.map((a) => [a.assignmentNumber, a]));

  const completed = assignments.filter(
    (a) => a.status === 'COMPLETED' || a.status === 'SUBMITTED'
  ).length;
  const pct = Math.round((completed / TOTAL) * 100);

  const scic = useMemo(() => computeScicEligibility(assignments), [assignments]);

  const handleAssignmentClick = (assignment: Assignment | undefined, num: number) => {
    const a: Assignment = assignment || {
      assignmentNumber: num,
      status: 'NOT_DEFINED',
      marks: undefined,
      maxMarks: 60,
    };
    setSelectedAssignment(a);
    setNewStatus(a.status || 'NOT_DEFINED');
    setNewMarks(a.marks !== undefined && a.marks !== null ? String(a.marks) : '');
    setNewMaxMarks(a.maxMarks ?? 60);
    setIsModalOpen(true);
  };

  const handleStatusChange = async () => {
    if (!selectedAssignment) return;
    try {
      setIsLoading(true);
      let response;

      const existingAssignment = assignments.some(
        (assignment) => assignment.assignmentNumber === selectedAssignment.assignmentNumber
      );

      if (newStatus === 'NOT_DEFINED') {
        if (existingAssignment) {
          response = await assignmentApi.delete(_studentId, selectedAssignment.assignmentNumber);
        } else {
          setIsModalOpen(false);
          return;
        }
      } else {
        const parsedMarks = newMarks.trim() !== '' ? Number(newMarks) : undefined;
        let effectiveStatus = newStatus;

        if (effectiveStatus === 'SUBMITTED' && parsedMarks !== undefined && parsedMarks > 0) {
          effectiveStatus = 'COMPLETED';
        }

        const payload: Record<string, unknown> = {
          assignmentNumber: selectedAssignment.assignmentNumber,
          status: effectiveStatus,
          date: new Date(),
          maxMarks: newMaxMarks,
        };

        if (parsedMarks !== undefined && !Number.isNaN(parsedMarks)) {
          payload.marks = Math.min(newMaxMarks, Math.max(0, parsedMarks));
        }

        if (existingAssignment) {
          response = await assignmentApi.update(_studentId, payload);
        } else {
          response = await assignmentApi.create(_studentId, payload);
        }
      }

      if (response?.error) throw new Error(response.error);

      toast.success(`Assignment updated to ${newStatus}`);
      setIsModalOpen(false);
      onUpdate?.();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update assignment';
      toast.error(message);
      console.error('Assignment update error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemove = useCallback(async () => {
    if (!selectedAssignment) return;
    try {
      setIsLoading(true);
      const response = await assignmentApi.delete(_studentId, selectedAssignment.assignmentNumber);
      if (response?.error) throw new Error(response.error);
      toast.success('Assignment removed successfully');
      setIsModalOpen(false);
      onUpdate?.();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to remove assignment';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, [_studentId, selectedAssignment, onUpdate]);

  const liveMarksPct =
    newMarks.trim() !== '' && !Number.isNaN(Number(newMarks))
      ? Math.min(Math.round((Number(newMarks) / newMaxMarks) * 100), 100)
      : null;

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
      <div className="bg-background rounded-xl border shadow-sm overflow-hidden mt-4">
        <div
          className={cn(
            'px-5 py-4 border-b flex items-center justify-between',
            scic.eligible ? 'bg-success-soft/50' : 'bg-muted/20'
          )}
        >
          <div className="flex items-center gap-2">
            <Trophy
              className={cn('w-4 h-4', scic.eligible ? 'text-success' : 'text-muted-foreground')}
            />
            <h3 className="font-semibold text-sm">SCIC Next Program Eligibility</h3>
          </div>
          <span
            className={cn(
              'text-xs font-bold px-2.5 py-1 rounded border',
              scic.eligible ? 'status-success' : 'bg-muted text-muted-foreground border-transparent'
            )}
          >
            {scic.eligible ? '✓ Eligible' : 'Not Eligible Yet'}
          </span>
        </div>

        <div className="divide-y divide-border">
          <ScicConditionRow
            label="Assignments 1–8 each ≥ 50%"
            pass={scic.cond1}
            detail={scic.details1
              .map((r) =>
                r.pct !== null ? `A${r.num}: ${r.pct}%${r.pass ? ' ✓' : ' ✗'}` : `A${r.num}: —`
              )
              .join('  ')}
          />
          <ScicConditionRow
            label="Assignments 9 & 10 each ≥ 70%"
            pass={scic.cond2}
            detail={scic.details2
              .map((r) =>
                r.pct !== null ? `A${r.num}: ${r.pct}%${r.pass ? ' ✓' : ' ✗'}` : `A${r.num}: —`
              )
              .join('  ')}
          />
          <ScicConditionRow
            label="Average marks ≥ 48"
            pass={scic.cond3}
            detail={
              scic.avg !== null
                ? `Current avg: ${scic.avg.toFixed(1)}`
                : 'Complete all 10 assignments with marks first'
            }
          />
        </div>

        <div className="px-5 py-3 bg-muted/10 text-xs text-muted-foreground flex items-start gap-2">
          <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>
            All 3 conditions must be met. % = marks received ÷ submission tier (60 / 50 / 30).
          </span>
        </div>
      </div>

      {/* Assignment Update Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <ModalHeader
          title={`Assignment ${String(selectedAssignment?.assignmentNumber).padStart(2, '0')}`}
          onClose={() => setIsModalOpen(false)}
        />
        <ModalBody>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-foreground mb-2">Current Status</p>
              <span
                className={cn(
                  'text-xs font-semibold px-2.5 py-1 rounded border',
                  selectedAssignment?.status === 'COMPLETED'
                    ? 'status-success'
                    : selectedAssignment?.status === 'SUBMITTED'
                      ? 'status-info'
                      : selectedAssignment?.status === 'PENDING'
                        ? 'status-warning'
                        : 'bg-muted text-muted-foreground border-transparent'
                )}
              >
                {selectedAssignment?.status === 'COMPLETED'
                  ? `Completed ${selectedAssignment?.marks !== undefined ? `(${selectedAssignment.marks}/${selectedAssignment.maxMarks ?? 60} marks)` : ''}`
                  : selectedAssignment?.status === 'SUBMITTED'
                    ? 'Submitted (No Marks Yet)'
                    : selectedAssignment?.status === 'PENDING'
                      ? 'Pending'
                      : 'Not defined'}
              </span>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Submission Tier (Max Marks)
              </label>
              <div className="grid grid-cols-3 gap-2">
                {([60, 50, 30] as AssignmentMaxMarks[]).map((tier) => (
                  <button
                    key={tier}
                    type="button"
                    onClick={() => setNewMaxMarks(tier)}
                    className={cn(
                      'py-2 px-3 rounded-md border text-sm font-semibold transition-colors text-center',
                      newMaxMarks === tier
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background border-border hover:bg-muted'
                    )}
                  >
                    {tier} marks
                    <span className="block text-xs font-normal opacity-70">
                      {tier === 60 ? '1st deadline' : tier === 50 ? '2nd deadline' : 'No deadline'}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Update Status
              </label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                disabled={isLoading}
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground disabled:opacity-50 text-sm"
              >
                <option value="NOT_DEFINED">Not Defined</option>
                <option value="PENDING">Pending</option>
                <option value="SUBMITTED">Submitted (Pending Marks)</option>
                <option value="COMPLETED">Completed (Graded)</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">
                Assignment Marks (0–{newMaxMarks})
              </label>
              <input
                type="number"
                min={0}
                max={newMaxMarks}
                value={newMarks}
                onChange={(e) => {
                  const val = e.target.value;
                  setNewMarks(val);
                  if (val.trim() !== '' && Number(val) > 0 && newStatus === 'SUBMITTED') {
                    setNewStatus('COMPLETED');
                  }
                }}
                placeholder="Leave blank if not marked yet"
                disabled={isLoading}
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground disabled:opacity-50 text-sm"
              />

              {liveMarksPct !== null && (
                <div className="mt-2">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>Score preview</span>
                    <span className="font-semibold">
                      {liveMarksPct}% of {newMaxMarks}
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all',
                        liveMarksPct >= 70
                          ? 'bg-success'
                          : liveMarksPct >= 50
                            ? 'bg-primary'
                            : 'bg-destructive'
                      )}
                      style={{ width: `${liveMarksPct}%` }}
                    />
                  </div>
                </div>
              )}

              <p className="text-xs text-muted-foreground mt-1.5">
                {newStatus === 'SUBMITTED' ? (
                  <span className="text-info font-medium">
                    Status is Submitted (pending marks). Card will appear in blue.
                  </span>
                ) : newStatus === 'COMPLETED' ? (
                  <span className="text-success font-medium">
                    Status is Completed (graded). Card will appear in green.
                  </span>
                ) : null}
              </p>
            </div>

            {selectedAssignment?.date && (
              <div>
                <p className="text-sm font-medium text-foreground">Updated Date</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {new Date(selectedAssignment.date).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>
        </ModalBody>
        <ModalFooter>
          <button
            onClick={() => setIsModalOpen(false)}
            disabled={isLoading}
            className="px-3 py-2 text-sm font-medium rounded-md border border-border hover:bg-muted transition-colors disabled:opacity-50"
          >
            Cancel
          </button>

          {selectedAssignment &&
            assignments.some(
              (assignment) => assignment.assignmentNumber === selectedAssignment.assignmentNumber
            ) && (
              <button
                onClick={handleRemove}
                disabled={isLoading}
                className="px-3 py-2 text-sm font-medium rounded-md bg-destructive text-destructive-foreground hover:opacity-90 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                <Trash2 className="w-4 h-4" />
                Remove
              </button>
            )}

          <button
            onClick={handleStatusChange}
            disabled={
              isLoading ||
              (selectedAssignment
                ? newStatus === selectedAssignment.status &&
                  newMaxMarks === (selectedAssignment.maxMarks ?? 60) &&
                  (newMarks.trim() === ''
                    ? selectedAssignment.marks === undefined
                    : Number(newMarks) === selectedAssignment.marks)
                : false)
            }
            className="px-3 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            Update
          </button>
        </ModalFooter>
      </Modal>
    </>
  );
}

function ScicConditionRow({
  label,
  pass,
  detail,
}: {
  label: string;
  pass: boolean;
  detail: string;
}) {
  return (
    <div className="flex items-start gap-3 px-5 py-3">
      {pass ? (
        <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" />
      ) : (
        <XCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
      )}
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            'text-sm font-medium',
            pass ? 'text-success-foreground' : 'text-foreground'
          )}
        >
          {label}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5 break-words">{detail}</p>
      </div>
      <span
        className={cn(
          'text-xs font-bold px-2 py-0.5 rounded border shrink-0',
          pass ? 'status-success' : 'bg-muted text-muted-foreground border-transparent'
        )}
      >
        {pass ? 'Pass' : 'Fail'}
      </span>
    </div>
  );
}
