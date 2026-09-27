'use client';

interface DeleteStudentModalProps {
  isOpen: boolean;
  studentName?: string;
  isDeleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteStudentModal({
  isOpen,
  studentName,
  isDeleting,
  onConfirm,
  onCancel,
}: DeleteStudentModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background rounded-lg border shadow-lg max-w-sm w-full mx-4">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">Delete Student</h2>
        </div>

        <div className="px-6 py-4">
          <p className="text-sm text-foreground mb-2">
            Are you sure you want to delete <strong>{studentName}</strong>?
          </p>
          <p className="text-xs text-muted-foreground">
            This action will permanently remove the student and all related data including
            assignments, call logs, and follow-ups from the database. This cannot be undone.
          </p>
        </div>

        <div className="px-6 py-4 border-t flex justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={isDeleting}
            className="px-4 py-2 border rounded-md hover:bg-muted transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-4 py-2 bg-destructive text-destructive-foreground rounded-md hover:opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}
