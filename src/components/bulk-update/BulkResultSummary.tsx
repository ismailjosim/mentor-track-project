'use client';

import { CheckCircle2, XCircle, AlertCircle, Award, Clock } from 'lucide-react';
import type { BulkResult } from './types';

interface BulkResultSummaryProps {
  result: BulkResult;
  processing: boolean;
  onCommit: () => void;
  onCancel: () => void;
  tier?: number;
}

export function BulkResultSummary({
  result,
  processing,
  onCommit,
  onCancel,
  tier = 60,
}: BulkResultSummaryProps) {
  const hasAssignmentDetails = Boolean(
    result.matchedStudents && result.matchedStudents.some((s) => s.targetStatus !== undefined)
  );

  const completedCount =
    result.withMarks ??
    (result.matchedStudents
      ? result.matchedStudents.filter((s) => s.targetStatus === 'COMPLETED').length
      : 0);

  const pendingCount =
    result.pendingMarks ??
    (result.matchedStudents
      ? result.matchedStudents.filter((s) => s.targetStatus === 'SUBMITTED').length
      : 0);

  return (
    <div className="rounded-lg border bg-muted/20 p-4 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-2">
        <p className="text-sm font-semibold">Import Preview & Status Check</p>
        <span className="text-xs text-muted-foreground font-medium">
          Deadline Tier: <strong>{tier} Marks</strong>
        </span>
      </div>

      {/* Summary Stat Badges */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>{result.matched} Matched Students</span>
        </div>

        {hasAssignmentDetails && completedCount > 0 && (
          <div className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
            <Award className="w-3.5 h-3.5" />
            <span>{completedCount} Marked (Completed)</span>
          </div>
        )}

        {hasAssignmentDetails && pendingCount > 0 && (
          <div className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
            <Clock className="w-3.5 h-3.5" />
            <span>{pendingCount} Pending Marks (Submitted)</span>
          </div>
        )}

        {result.unmatched > 0 && (
          <div className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
            <XCircle className="w-3.5 h-3.5" />
            <span>{result.unmatched} Not in Database</span>
          </div>
        )}
      </div>

      {/* Matched Students List */}
      {result.matchedStudents && result.matchedStudents.length > 0 && (
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-xs font-medium text-muted-foreground">
            <span>Matched Students ({result.matchedStudents.length})</span>
            {hasAssignmentDetails && (
              <span>Scores &gt; 0 = Completed | 0/negative/empty = Submitted</span>
            )}
          </div>
          <div className="text-xs space-y-1.5 max-h-52 overflow-y-auto bg-background rounded-lg p-2.5 border divide-y divide-border/40">
            {result.matchedStudents.map((s) => (
              <div
                key={s.studentId}
                className="pt-1.5 first:pt-0 flex flex-wrap items-center justify-between gap-2"
              >
                <div className="min-w-0">
                  <div className="font-semibold text-foreground flex items-center gap-1.5">
                    <span>{s.name}</span>
                    {s.sheetName && s.sheetName.toLowerCase() !== s.name.toLowerCase() && (
                      <span className="text-[10px] text-muted-foreground font-normal">
                        ({s.sheetName})
                      </span>
                    )}
                  </div>
                  <div className="font-mono text-[11px] text-muted-foreground truncate">
                    {s.email}
                  </div>
                </div>

                {hasAssignmentDetails && (
                  <div className="flex items-center gap-2 shrink-0">
                    {s.marks !== undefined && s.marks !== null ? (
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-mono font-medium ${
                          s.marks > 0
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950 dark:text-amber-300'
                        }`}
                      >
                        {s.marks > 0
                          ? `${Math.min(tier, s.marks)} / ${tier}`
                          : `${s.marks} (Pending)`}
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[11px] font-mono text-muted-foreground bg-muted">
                        No marks (Pending)
                      </span>
                    )}

                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        s.targetStatus === 'COMPLETED'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/60 dark:text-green-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300'
                      }`}
                    >
                      {s.targetStatus === 'COMPLETED' ? 'Completed' : 'Submitted'}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Unmatched list */}
      {result.unmatchedEmails.length > 0 && (
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-600">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Unmatched Emails ({result.unmatchedEmails.length}) - will be skipped:</span>
          </div>
          <div className="text-xs font-mono text-rose-600 space-y-0.5 max-h-32 overflow-y-auto bg-background rounded-lg p-2 border border-rose-200 dark:border-rose-900">
            {result.unmatchedEmails.map((e) => (
              <div key={e}>{e}</div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 pt-2 border-t">
        <button
          onClick={onCommit}
          disabled={processing || result.matched === 0}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors shadow-sm"
        >
          {processing ? 'Applying updates...' : `Confirm & Apply (${result.matched} Students)`}
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
