'use client';

import { CheckCircle2, XCircle } from 'lucide-react';
import type { BulkResult } from './types';

interface BulkResultSummaryProps {
  result: BulkResult;
  processing: boolean;
  onCommit: () => void;
  onCancel: () => void;
}

export function BulkResultSummary({
  result,
  processing,
  onCommit,
  onCancel,
}: BulkResultSummaryProps) {
  return (
    <div className="rounded-lg border bg-muted/20 p-4 space-y-3">
      <p className="text-sm font-semibold">Preview</p>
      <div className="flex gap-4">
        <div className="flex items-center gap-2 text-sm text-green-700">
          <CheckCircle2 className="w-4 h-4" />
          <span>
            <strong>{result.matched}</strong> matched
          </span>
        </div>
        {result.unmatched > 0 && (
          <div className="flex items-center gap-2 text-sm text-red-600">
            <XCircle className="w-4 h-4" />
            <span>
              <strong>{result.unmatched}</strong> not found
            </span>
          </div>
        )}
      </div>

      {result.matchedStudents && result.matchedStudents.length > 0 && (
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-1">
            Matched Students ({result.matchedStudents.length}):
          </p>
          <div className="text-xs space-y-1 max-h-40 overflow-y-auto bg-background rounded p-2 border">
            {result.matchedStudents.map((s) => (
              <div key={s.studentId} className="text-green-700">
                <span className="font-mono">{s.email}</span> -{' '}
                <span className="font-medium">{s.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {result.unmatchedEmails.length > 0 && (
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-1">
            Unmatched ({result.unmatchedEmails.length}):
          </p>
          <div className="text-xs font-mono text-red-600 space-y-0.5 max-h-40 overflow-y-auto bg-background rounded p-2 border">
            {result.unmatchedEmails.map((e) => (
              <div key={e}>{e}</div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-2 pt-1">
        <button
          onClick={onCommit}
          disabled={processing}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {processing ? 'Updating...' : 'Confirm & Apply'}
        </button>
        <button
          onClick={onCancel}
          disabled={processing}
          className="px-4 py-2 border rounded-md text-sm font-medium hover:bg-muted disabled:opacity-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
