'use client';

import { Sparkles, X } from 'lucide-react';
import type { AnalysisResult } from './analysis-types';

interface StudentAnalysisModalProps {
  result: AnalysisResult;
  onClose: () => void;
  onDone: () => void;
}

export function StudentAnalysisModal({ result, onClose, onDone }: StudentAnalysisModalProps) {
  const percentage = (count: number) =>
    result.totalStudents ? Math.round((count / result.totalStudents) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="surface max-h-[90vh] w-full max-w-2xl overflow-y-auto shadow-2xl">
        <div className="sticky top-0 flex items-center justify-between border-b bg-card/95 px-6 py-4 backdrop-blur">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Sparkles className="h-5 w-5 text-primary" />
            Analysis Results
          </h2>
          <button
            onClick={onClose}
            className="rounded p-1 hover:bg-muted"
            aria-label="Close analysis results"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="space-y-6 p-6">
          <div className="grid grid-cols-2 gap-4">
            <ResultStat label="Total Students" value={String(result.totalStudents)} tone="info" />
            <ResultStat
              label="Assignment Analyzed"
              value={`A-${String(result.completedAssignment).padStart(2, '0')}`}
              tone="primary"
            />
            <ResultStat
              label="Completed"
              value={`${result.completedCount} (${percentage(result.completedCount)}%)`}
              tone="success"
            />
            <ResultStat
              label="Not Completed"
              value={`${result.notCompletedCount} (${percentage(result.notCompletedCount)}%)`}
              tone="warning"
            />
          </div>
          {result.updatedCount > 0 && (
            <div className="rounded-xl border border-warning-border bg-warning-soft p-4 text-sm font-semibold text-warning-foreground">
              {result.updatedCount} student{result.updatedCount === 1 ? '' : 's'} status updated
            </div>
          )}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Student Details
            </h3>
            <div className="max-h-96 space-y-2 overflow-y-auto">
              {result.students.map((student) => (
                <div
                  key={student.id}
                  className={`rounded-lg border p-3 ${student.completed ? 'border-success-border bg-success-soft' : 'border-warning-border bg-warning-soft'}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold">{student.name}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {student.completed ? 'Completed' : 'Not Completed'}
                      </p>
                    </div>
                    {student.previousStatus !== student.newStatus && (
                      <div className="text-xs">
                        <span className="mr-2 rounded bg-neutral-soft px-2 py-1 font-medium text-neutral-foreground">
                          {student.previousStatus}
                        </span>
                        <span className="rounded bg-primary/10 px-2 py-1 font-medium text-primary">
                          {student.newStatus}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="sticky bottom-0 flex justify-end border-t bg-muted/20 px-6 py-4">
          <button
            onClick={onDone}
            className="rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground hover:bg-primary/90"
          >
            Done &amp; Refresh
          </button>
        </div>
      </div>
    </div>
  );
}

function ResultStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: 'info' | 'primary' | 'success' | 'warning';
}) {
  const styles = {
    info: 'border-info-border bg-info-soft text-info-foreground',
    primary: 'border-primary/20 bg-primary/10 text-primary',
    success: 'border-success-border bg-success-soft text-success-foreground',
    warning: 'border-warning-border bg-warning-soft text-warning-foreground',
  };

  return (
    <div className={`rounded-xl border p-4 ${styles[tone]}`}>
      <p className="mb-1 text-xs text-muted-foreground">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}
