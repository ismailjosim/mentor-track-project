'use client';

import { useState, useCallback } from 'react';
import { CheckCircle2, Circle, Clock, Loader2, Trash2 } from 'lucide-react';
import type { Assignment } from '@/interfaces/assignment.interface';
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

  // Build a map for quick lookup
  const assignmentMap = new Map(assignments.map((a) => [a.assignmentNumber, a]));

  const completed = assignments.filter(
    (a) => a.status === 'COMPLETED' || a.status === 'SUBMITTED'
  ).length;
  const pct = Math.round((completed / TOTAL) * 100);

  const handleAssignmentClick = (assignment: Assignment | undefined, num: number) => {
    const a: Assignment = assignment || {
      assignmentNumber: num,
      status: 'NOT_DEFINED',
      marks: undefined,
    };
    setSelectedAssignment(a);
    setNewStatus(a.status || 'NOT_DEFINED');
    setNewMarks(a.marks !== undefined && a.marks !== null ? String(a.marks) : '');
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

        // Auto-differentiate based on marks:
        // If marks provided and status is SUBMITTED, mark as COMPLETED
        if (effectiveStatus === 'SUBMITTED' && parsedMarks !== undefined && parsedMarks > 0) {
          effectiveStatus = 'COMPLETED';
        }

        const payload: Record<string, unknown> = {
          assignmentNumber: selectedAssignment.assignmentNumber,
          status: effectiveStatus,
          date: new Date(),
        };

        if (parsedMarks !== undefined && !Number.isNaN(parsedMarks)) {
          payload.marks = Math.min(100, Math.max(0, parsedMarks));
        }

        if (existingAssignment) {
          response = await assignmentApi.update(_studentId, payload);
        } else {
          response = await assignmentApi.create(_studentId, payload);
        }
      }

      if (response?.error) {
        throw new Error(response.error);
      }

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

      if (response?.error) {
        throw new Error(response.error);
      }

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

  return (
    <>
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

            return (
              <div
                key={num}
                onClick={() => handleAssignmentClick(a, num)}
                className={cn(
                  'flex items-center justify-between px-5 py-3 text-sm transition-colors cursor-pointer',
                  isCompleted
                    ? 'bg-success-soft/70 hover:bg-success-soft'
                    : isSubmitted
                      ? 'bg-info-soft/70 hover:bg-info-soft'
                      : 'hover:bg-muted/30'
                )}
              >
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
                    ? a?.marks !== undefined && a?.marks !== null
                      ? `Done (${a.marks})`
                      : 'Done'
                    : isSubmitted
                      ? 'Submitted'
                      : isPending
                        ? 'Pending'
                        : '—'}
                </span>
              </div>
            );
          })}
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
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'text-xs font-semibold px-2.5 py-1 rounded border',
                    selectedAssignment?.status === 'COMPLETED'
                      ? 'status-success'
                      : selectedAssignment?.status === 'SUBMITTED'
                        ? 'status-info'
                        : selectedAssignment?.status === 'PENDING'
                          ? 'status-warning'
                          : 'bg-muted text-muted-foreground'
                  )}
                >
                  {selectedAssignment?.status === 'COMPLETED'
                    ? `Completed ${selectedAssignment?.marks !== undefined ? `(${selectedAssignment.marks} marks)` : ''}`
                    : selectedAssignment?.status === 'SUBMITTED'
                      ? 'Submitted (No Marks Yet)'
                      : selectedAssignment?.status === 'PENDING'
                        ? 'Pending'
                        : 'Not defined'}
                </span>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Update Status
              </label>
              <select
                value={newStatus}
                onChange={(e) => {
                  const val = e.target.value;
                  setNewStatus(val);
                }}
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
                Assignment Marks (0-100)
              </label>
              <input
                type="number"
                min={0}
                max={100}
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
