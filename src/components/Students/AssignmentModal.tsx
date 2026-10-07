'use client';

import { useState } from 'react';
import { Loader2, Trash2 } from 'lucide-react';
import type { Assignment, AssignmentMaxMarks } from '@/interfaces/assignment.interface';
import { cn } from '@/lib/cn';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/Modal';
import { assignmentApi } from '@/lib/api-client';
import toast from 'react-hot-toast';

interface AssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedAssignment: Assignment | null;
  studentId: string;
  isExisting: boolean;
  onSuccess?: () => void;
}

export function AssignmentModal({
  isOpen,
  onClose,
  selectedAssignment,
  studentId,
  isExisting,
  onSuccess,
}: AssignmentModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [newStatus, setNewStatus] = useState<string>(selectedAssignment?.status || 'NOT_DEFINED');
  const [newMarks, setNewMarks] = useState<string>(
    selectedAssignment?.marks !== undefined && selectedAssignment.marks !== null
      ? String(selectedAssignment.marks)
      : ''
  );
  const [newMaxMarks, setNewMaxMarks] = useState<AssignmentMaxMarks>(
    selectedAssignment?.maxMarks ?? 60
  );

  const liveMarksNum = newMarks.trim() !== '' ? Number(newMarks) : null;
  const liveMarksPct =
    liveMarksNum !== null && !Number.isNaN(liveMarksNum) && liveMarksNum >= 0
      ? Math.min(100, Math.round((liveMarksNum / newMaxMarks) * 100))
      : null;

  const handleStatusChange = async () => {
    if (!selectedAssignment) return;
    try {
      setIsLoading(true);
      let response;

      if (newStatus === 'NOT_DEFINED') {
        if (isExisting) {
          response = await assignmentApi.delete(studentId, selectedAssignment.assignmentNumber);
        } else {
          onClose();
          return;
        }
      } else {
        const parsedMarks =
          newStatus === 'COMPLETED' && newMarks.trim() !== '' ? Number(newMarks) : undefined;

        const payload: Record<string, unknown> = {
          assignmentNumber: selectedAssignment.assignmentNumber,
          status: newStatus,
          date: new Date(),
          maxMarks: newMaxMarks,
        };

        if (newStatus === 'COMPLETED' && parsedMarks !== undefined && !Number.isNaN(parsedMarks)) {
          payload.marks = Math.min(newMaxMarks, Math.max(0, parsedMarks));
        }

        if (isExisting) {
          response = await assignmentApi.update(studentId, payload);
        } else {
          response = await assignmentApi.create(studentId, payload);
        }
      }

      if (response?.error) throw new Error(response.error);

      toast.success(`Assignment updated to ${newStatus}`);
      onClose();
      onSuccess?.();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update assignment';
      toast.error(message);
      console.error('Assignment update error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemove = async () => {
    if (!selectedAssignment) return;
    try {
      setIsLoading(true);
      const response = await assignmentApi.delete(studentId, selectedAssignment.assignmentNumber);
      if (response?.error) throw new Error(response.error);

      toast.success('Assignment entry removed');
      onClose();
      onSuccess?.();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to remove assignment';
      toast.error(message);
      console.error('Assignment remove error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalHeader
        title={`Assignment ${String(selectedAssignment?.assignmentNumber).padStart(2, '0')}`}
        onClose={onClose}
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
            <label className="text-sm font-medium text-foreground mb-2 block">Update Status</label>
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

            {newStatus === 'SUBMITTED' && (
              <p className="text-xs text-info font-medium mt-1.5">
                Status is Submitted (pending marks). Card will appear in blue.
              </p>
            )}
          </div>

          {/* Marks input conditionally visible ONLY when COMPLETED */}
          {newStatus === 'COMPLETED' && (
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">
                Assignment Marks (0–{newMaxMarks})
              </label>
              <input
                type="number"
                min={0}
                max={newMaxMarks}
                value={newMarks}
                onChange={(e) => setNewMarks(e.target.value)}
                placeholder="Enter assignment marks"
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

              <p className="text-xs text-success font-medium mt-1.5">
                Status is Completed (graded). Card will appear in green.
              </p>
            </div>
          )}

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
          onClick={onClose}
          disabled={isLoading}
          className="px-3 py-2 text-sm font-medium rounded-md border border-border hover:bg-muted transition-colors disabled:opacity-50"
        >
          Cancel
        </button>

        {isExisting && (
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
                (newStatus === 'COMPLETED'
                  ? newMarks.trim() === ''
                    ? selectedAssignment.marks === undefined
                    : Number(newMarks) === selectedAssignment.marks
                  : true)
              : false)
          }
          className="px-3 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
          Update
        </button>
      </ModalFooter>
    </Modal>
  );
}
