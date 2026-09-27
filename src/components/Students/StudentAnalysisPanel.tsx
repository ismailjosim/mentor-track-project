'use client';

import { Loader2, Sparkles, X } from 'lucide-react';

interface StudentAnalysisPanelProps {
  assignment: number;
  isAnalyzing: boolean;
  onAssignmentChange: (assignment: number) => void;
  onAnalyze: () => void;
  onClose: () => void;
}

export function StudentAnalysisPanel({
  assignment,
  isAnalyzing,
  onAssignmentChange,
  onAnalyze,
  onClose,
}: StudentAnalysisPanelProps) {
  return (
    <>
      <div className="surface space-y-4 border-primary/20 bg-primary/5 p-5 animate-in slide-in-from-top duration-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              <Sparkles className="h-4 w-4 text-primary" />
              Analyze All Students
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Check completion for an assignment and update student statuses.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 hover:bg-primary/10"
            aria-label="Close analysis panel"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
        <div className="flex flex-col items-end gap-3 sm:flex-row">
          <label className="flex-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Select Assignment
            <select
              value={assignment}
              onChange={(event) => onAssignmentChange(Number(event.target.value))}
              disabled={isAnalyzing}
              className="mt-2 h-10 w-full rounded-xl border bg-card px-3 text-sm font-normal normal-case tracking-normal focus:outline-none focus:ring-4 focus:ring-ring/15"
            >
              {Array.from({ length: 10 }, (_, index) => index + 1).map((value) => (
                <option key={value} value={value}>
                  A-{String(value).padStart(2, '0')}
                </option>
              ))}
            </select>
          </label>
          <button
            onClick={onAnalyze}
            disabled={isAnalyzing}
            className="flex h-10 items-center gap-2 rounded-xl bg-primary px-6 font-semibold text-primary-foreground hover:bg-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Sparkles className="h-4 w-4" />
            {isAnalyzing ? 'Analyzing...' : 'Analyze'}
          </button>
        </div>
      </div>
      {isAnalyzing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="surface w-full max-w-sm shadow-2xl">
            <div className="flex flex-col items-center justify-center gap-4 p-8">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <div className="text-center">
                <h2 className="mb-2 text-lg font-semibold">Analyzing Students</h2>
                <p className="text-sm text-muted-foreground">
                  Processing assignment A-{String(assignment).padStart(2, '0')}...
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
