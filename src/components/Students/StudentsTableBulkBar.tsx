'use client';

import { CheckSquare, Trash2, X } from 'lucide-react';

interface StudentsTableBulkBarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onOpenBulkDelete: () => void;
}

export function StudentsTableBulkBar({
  selectedCount,
  onClearSelection,
  onOpenBulkDelete,
}: StudentsTableBulkBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-4 sm:px-6 py-3 bg-primary/5 border-b border-primary/20">
      <div className="flex items-center gap-3">
        <CheckSquare className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold text-primary">
          {selectedCount} student{selectedCount > 1 ? 's' : ''} selected
        </span>
      </div>
      <div className="flex items-center gap-2 self-end sm:self-auto">
        <button
          type="button"
          onClick={onClearSelection}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-background hover:bg-muted transition-colors text-xs font-medium text-muted-foreground hover:text-foreground cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
          Clear selection
        </button>
        <button
          type="button"
          onClick={onOpenBulkDelete}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-destructive text-destructive-foreground hover:opacity-90 transition-all text-xs font-semibold cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Delete {selectedCount} student{selectedCount > 1 ? 's' : ''}
        </button>
      </div>
    </div>
  );
}
