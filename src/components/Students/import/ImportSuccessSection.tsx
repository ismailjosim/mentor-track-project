'use client';

import Link from 'next/link';
import { CheckCircle } from 'lucide-react';
import { PAGE_ROUTES } from '@/lib/constants';
import type { ImportPreview } from './types';

interface ImportSuccessSectionProps {
  preview: ImportPreview;
  onReset: () => void;
}

export function ImportSuccessSection({ preview, onReset }: ImportSuccessSectionProps) {
  return (
    <div className="space-y-6">
      {/* Success message */}
      <div className="flex items-center gap-3 rounded-xl border border-success-border bg-success-soft p-4">
        <CheckCircle className="w-5 h-5 shrink-0 text-success-foreground" />
        <div>
          <h3 className="font-semibold text-success-foreground">Import completed!</h3>
          <p className="mt-1 text-sm text-success-foreground">
            Your students have been successfully imported.
          </p>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-success-border bg-success-soft p-4">
          <div className="text-xs font-medium text-success-foreground">Imported</div>
          <div className="mt-2 text-3xl font-bold text-success-foreground">
            {preview.validCount}
          </div>
        </div>
        <div className="p-4 bg-muted/50 rounded-lg border">
          <div className="text-xs text-muted-foreground">Skipped</div>
          <div className="text-3xl font-bold mt-2">
            {preview.invalidCount + preview.duplicateCount}
          </div>
        </div>
        <div className="rounded-xl border border-info-border bg-info-soft p-4">
          <div className="text-xs font-medium text-info-foreground">Total Processed</div>
          <div className="mt-2 text-3xl font-bold text-info-foreground">{preview.totalRows}</div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3 justify-end">
        <Link
          href={PAGE_ROUTES.STUDENTS}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          View Students
        </Link>
        <button
          onClick={onReset}
          className="px-4 py-2 border rounded-md text-sm font-medium hover:bg-muted transition-colors"
        >
          Import More
        </button>
      </div>
    </div>
  );
}
