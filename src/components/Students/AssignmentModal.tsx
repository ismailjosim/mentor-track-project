'use client';

import { useState } from 'react';
import { Loader2, Trash2 } from 'lucide-react';
import type { Assignment, AssignmentMaxMarks } from '@/interfaces/assignment.interface';
import { cn } from '@/lib/cn';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/Modal';
import { assignmentApi } from '@/lib/api-client';
import toast from 'react-hot-toast';
import { AssignmentTierSelector } from './AssignmentTierSelector';
import { AssignmentMarksInput } from './AssignmentMarksInput';

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
  const initialStatus =
    selectedAssignment?.status && selectedAssignment.status !== 'NOT_DEFINED'
      ? selectedAssignment.status
      : 'PENDING';
  const [newStatus, setNewStatus] = useState<string>(initialStatus);
  const [newMaxMarks, setNewMaxMarks] = useState<AssignmentMaxMarks>(
    selectedAssignment?.maxMarks ?? 60
  );
  const [newMarks, setNewMarks] = useState<string>(
    selectedAssignment?.marks !== undefined && selectedAssignment.marks !== null
      ? String(selectedAssignment.marks)
      : initialStatus === 'COMPLETED'
        ? String(selectedAssignment?.maxMarks ?? 60)
        : ''
  );
  const [prevAssignment, setPrevAssignment] = useState(selectedAssignment);

  if (selectedAssignment !== prevAssignment) {
    setPrevAssignment(selectedAssignment);
    const status =
      selectedAssignment?.status && selectedAssignment.status !== 'NOT_DEFINED'
        ? selectedAssignment.status
        : 'PENDING';
    setNewStatus(status);
    const max = selectedAssignment?.maxMarks ?? 60;
    setNewMaxMarks(max);
    setNewMarks(
      selectedAssignment?.marks !== undefined && selectedAssignment.marks !== null
        ? String(selectedAssignment.marks)
        : status === 'COMPLETED'
          ? String(max)
          : ''
    );
  }

  const handleTierChange = (tier: AssignmentMaxMarks) => {
    setNewMaxMarks(tier);
    setNewMarks(String(tier));
  };

  const handleStatusChangeDropdown = (status: string) => {
    setNewStatus(status);
    if (status === 'COMPLETED' && (!newMarks || newMarks.trim() === '')) {
      setNewMarks(String(newMaxMarks));
    }
  };

  const adjustMarks = (delta: number) => {
    const current = newMarks.trim() !== '' ? Number(newMarks) : newMaxMarks;
    if (Number.isNaN(current)) return;
    const next = Math.min(newMaxMarks, Math.max(0, current + delta));
    setNewMarks(String(next));
  };

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

          {/* Submission Tier Selector */}
          <AssignmentTierSelector currentTier={newMaxMarks} onTierChange={handleTierChange} />

          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Update Status</label>
            <select
              value={newStatus}
              onChange={(e) => handleStatusChangeDropdown(e.target.value)}
              disabled={isLoading}
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground disabled:opacity-50 text-sm"
            >
              <option value="PENDING">Pending</option>
              <option value="SUBMITTED">Submitted (Pending Marks)</option>
              <option value="COMPLETED">Completed (Graded)</option>
              <option value="NOT_DEFINED">Not Defined</option>
            </select>

            {newStatus === 'SUBMITTED' && (
              <p className="text-xs text-info font-medium mt-1.5">
                Status is Submitted (pending marks). Card will appear in blue.
              </p>
            )}
          </div>

          {/* Marks input conditionally visible ONLY when COMPLETED */}
          {newStatus === 'COMPLETED' && (
            <AssignmentMarksInput
              newMarks={newMarks}
              newMaxMarks={newMaxMarks}
              isLoading={isLoading}
              onMarksChange={setNewMarks}
              onAdjustMarks={adjustMarks}
            />
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
        <div className="flex items-center justify-between w-full">
          <div>
            {isExisting && (
              <button
                type="button"
                onClick={handleRemove}
                disabled={isLoading}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-destructive hover:bg-destructive/10 px-3 py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                <Trash2 className="size-3.5" />
                <span>Remove Entry</span>
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 border border-border text-foreground rounded-lg hover:bg-muted text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleStatusChange}
              disabled={isLoading}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              Save Changes
            </button>
          </div>
        </div>
      </ModalFooter>
    </Modal>
  );
}
