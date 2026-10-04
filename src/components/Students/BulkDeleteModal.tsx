'use client';

import { AlertTriangle, Trash2, X } from 'lucide-react';

interface BulkDeleteModalProps {
  isOpen: boolean;
  count: number;
  isDeleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function BulkDeleteModal({
  isOpen,
  count,
  isDeleting,
  onConfirm,
  onCancel,
}: BulkDeleteModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-2xl border border-border shadow-2xl max-w-md w-full mx-4 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-destructive/10">
              <AlertTriangle className="w-5 h-5 text-destructive" />
            </div>
            <h2 className="text-lg font-bold">Bulk Delete Students</h2>
          </div>
          <button
            onClick={onCancel}
            disabled={isDeleting}
            className="inline-flex items-center justify-center w-8 h-8 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground disabled:opacity-50"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          <div className="flex items-start gap-3 p-4 rounded-xl bg-destructive/5 border border-destructive/20">
            <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-semibold text-destructive">This action cannot be undone</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                You are about to permanently delete{' '}
                <span className="font-bold text-foreground">{count} student{count > 1 ? 's' : ''}</span>{' '}
                and all their associated data.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">The following data will be removed:</p>
            <ul className="space-y-1.5">
              {[
                'Student profiles & personal information',
                'All call logs & contact history',
                'All follow-up reminders',
                'Assignment records & progress data',
              ].map((item) => (
                <li key={item} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="w-1.5 h-1.5 rounded-full bg-destructive/60 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border flex justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={isDeleting}
            className="px-4 py-2 rounded-lg border border-border bg-background hover:bg-muted transition-colors text-sm font-medium disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-destructive text-destructive-foreground hover:opacity-90 transition-all text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2 className="w-4 h-4" />
            {isDeleting
              ? `Deleting ${count} student${count > 1 ? 's' : ''}…`
              : `Delete ${count} Student${count > 1 ? 's' : ''}`}
          </button>
        </div>
      </div>
    </div>
  );
}
