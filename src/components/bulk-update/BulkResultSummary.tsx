'use client';

import { CheckCircle2, XCircle, AlertCircle, Award, Clock, FileQuestion, Calendar, Hash } from 'lucide-react';
import type { BulkResult } from './types';

interface BulkResultSummaryProps {
  result: BulkResult;
  processing: boolean;
  onCommit: () => void;
  onCancel: () => void;
  tier?: number;
  includePending?: boolean;
  onToggleIncludePending?: (val: boolean) => void;
}

export function BulkResultSummary({
  result,
  processing,
  onCommit,
  onCancel,
  tier = 60,
  includePending = true,
  onToggleIncludePending,
}: BulkResultSummaryProps) {
  const hasAssignmentDetails = Boolean(
    result.matchedStudents && result.matchedStudents.some((s) => s.targetStatus !== undefined)
  );

  const completedCount =
    result.withMarks ??
    (result.matchedStudents
      ? result.matchedStudents.filter((s) => s.targetStatus === 'COMPLETED').length
      : 0);

  const submittedCount =
    result.pendingMarks ??
    (result.matchedStudents
      ? result.matchedStudents.filter((s) => s.targetStatus === 'SUBMITTED').length
      : 0);

  const pendingCount =
    result.pendingCount ??
    (result.matchedStudents
      ? result.matchedStudents.filter((s) => s.targetStatus === 'PENDING').length
      : 0);

  const hasPerStudentTiers = Boolean(
    result.matchedStudents &&
      result.matchedStudents.some((s) => s.totalMarks !== undefined && s.totalMarks !== null)
  );

  const effectiveCount = includePending
    ? result.matched
    : result.matched - pendingCount;

  return (
    <div className="rounded-lg border bg-muted/20 p-4 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-2">
        <p className="text-sm font-semibold">Import Preview & Status Check</p>
        <span className="text-xs text-muted-foreground font-medium">
          Deadline Tier:{' '}
          <strong>{hasPerStudentTiers ? 'Detected from Sheet' : `${tier} Marks`}</strong>
          {hasPerStudentTiers && (
            <span className="text-muted-foreground/75 font-normal ml-1">
              (default fallback: {tier})
            </span>
          )}
        </span>
      </div>

      {/* Summary Stat Badges */}
      <div className="flex flex-wrap gap-2.5">
        <div className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>{result.matched} Total Matched</span>
        </div>

        {hasAssignmentDetails && completedCount > 0 && (
          <div className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
            <Award className="w-3.5 h-3.5" />
            <span>{completedCount} Marked (Completed)</span>
          </div>
        )}

        {hasAssignmentDetails && submittedCount > 0 && (
          <div className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
            <Clock className="w-3.5 h-3.5" />
            <span>{submittedCount} Submitted (Awaiting Marks)</span>
          </div>
        )}

        {hasAssignmentDetails && pendingCount > 0 && (
          <div className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-300">
            <FileQuestion className="w-3.5 h-3.5" />
            <span>{pendingCount} Pending (Not Submitted)</span>
          </div>
        )}

        {result.unmatched > 0 && (
          <div className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
            <XCircle className="w-3.5 h-3.5" />
            <span>{result.unmatched} Not in Database</span>
          </div>
        )}
      </div>

      {/* Include Pending Toggle */}
      {pendingCount > 0 && onToggleIncludePending && (
        <div className="flex items-center gap-2 p-2.5 rounded-lg border border-border/60 bg-background/60 text-xs">
          <input
            type="checkbox"
            id="includePendingToggle"
            checked={includePending}
            onChange={(e) => onToggleIncludePending(e.target.checked)}
            disabled={processing}
            className="rounded border-border text-primary focus:ring-primary size-4 cursor-pointer"
          />
          <label htmlFor="includePendingToggle" className="cursor-pointer select-none font-medium">
            Include {pendingCount} Pending students (will mark assignment as Not Submitted / Pending
            in database)
          </label>
        </div>
      )}

      {/* Matched Students List */}
      {result.matchedStudents && result.matchedStudents.length > 0 && (
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-xs font-medium text-muted-foreground">
            <span>Matched Students ({result.matchedStudents.length})</span>
            {hasAssignmentDetails && (
              <span>Scores &gt; 0 = Completed | Submitted = In Review | Pending = Not Submitted</span>
            )}
          </div>
          <div className="text-xs space-y-1.5 max-h-56 overflow-y-auto bg-background rounded-lg p-2.5 border divide-y divide-border/40">
            {result.matchedStudents.map((s) => {
              const studentTier = s.totalMarks || tier;
              const finalMarks =
                s.marks !== undefined && s.marks !== null
                  ? Math.min(studentTier, Math.max(0, s.marks))
                  : undefined;

              const isCompleted = s.targetStatus === 'COMPLETED';
              const isSubmitted = s.targetStatus === 'SUBMITTED';
              const isPending = s.targetStatus === 'PENDING';

              return (
                <div
                  key={s.studentId}
                  className="pt-1.5 first:pt-0 flex flex-wrap items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <div className="font-semibold text-foreground flex items-center gap-1.5 flex-wrap">
                      <span>{s.name}</span>
                      {s.sheetName && s.sheetName.toLowerCase() !== s.name.toLowerCase() && (
                        <span className="text-[10px] text-muted-foreground font-normal">
                          ({s.sheetName})
                        </span>
                      )}
                      {s.roll && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-mono px-1.5 py-0.2 rounded bg-muted text-muted-foreground">
                          <Hash className="size-2.5" />
                          {s.roll}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-mono flex-wrap">
                      <span>{s.email}</span>
                      {s.submittedAt && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-sans text-muted-foreground/80">
                          <Calendar className="size-2.5" />
                          {s.submittedAt}
                        </span>
                      )}
                    </div>
                  </div>

                  {hasAssignmentDetails && (
                    <div className="flex items-center gap-2 shrink-0">
                      {isCompleted && (
                        <span
                          className="px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300"
                          title={
                            s.marks && s.marks > studentTier
                              ? `Mark ${s.marks} capped at deadline tier ${studentTier}`
                              : undefined
                          }
                        >
                          {finalMarks} / {studentTier}
                        </span>
                      )}

                      {isSubmitted && (
                        <span className="px-2 py-0.5 rounded text-[11px] font-mono text-amber-700 border border-amber-200 bg-amber-50 dark:bg-amber-950/60 dark:text-amber-300">
                          Pending Marks / {studentTier}
                        </span>
                      )}

                      {isPending && (
                        <span className="px-2 py-0.5 rounded text-[11px] font-mono text-muted-foreground bg-muted">
                          Not Submitted / {studentTier}
                        </span>
                      )}

                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          isCompleted
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/60 dark:text-green-300'
                            : isSubmitted
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300'
                              : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        {isCompleted ? 'Completed' : isSubmitted ? 'Submitted' : 'Pending'}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
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
          disabled={processing || effectiveCount === 0}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors shadow-sm"
        >
          {processing ? 'Applying updates...' : `Confirm & Apply (${effectiveCount} Students)`}
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
