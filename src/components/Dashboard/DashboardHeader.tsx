'use client';

import { RefreshCw, Download, Layers } from 'lucide-react';

interface DashboardHeaderProps {
  lastUpdated: Date | null;
  refreshing: boolean;
  selectedCohort: string;
  availableCohorts?: string[];
  onCohortChange: (cohort: string) => void;
  onRefresh: () => void;
  onExportCallList: () => void;
}

export function DashboardHeader({
  lastUpdated,
  refreshing,
  selectedCohort,
  availableCohorts = ['13', '14'],
  onCohortChange,
  onRefresh,
  onExportCallList,
}: DashboardHeaderProps) {
  const cohortLabel = selectedCohort === 'all' ? 'All Batches' : `Batch ${selectedCohort}`;

  return (
    <div className="page-header rounded-3xl border border-border/70 bg-card/70 p-5 shadow-sm backdrop-blur-sm sm:p-7">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
            Operations overview
          </p>
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
            {cohortLabel}
          </span>
        </div>
        <h1 className="page-title">Cohort Dashboard</h1>
        <p className="page-description">
          A live view of student progress, outreach priorities, and cohort momentum for{' '}
          {cohortLabel}.
        </p>
        {lastUpdated && (
          <p className="text-xs text-muted-foreground mt-2">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
        {/* Cohort Selector */}
        <div className="flex items-center gap-2 rounded-xl border bg-card px-3 h-10 shadow-sm transition-colors hover:border-primary/40 flex-1 sm:flex-initial">
          <Layers className="w-4 h-4 text-primary shrink-0" />
          <span className="text-xs font-semibold text-muted-foreground hidden sm:inline">
            Cohort:
          </span>
          <select
            value={selectedCohort}
            onChange={(e) => onCohortChange(e.target.value)}
            className="bg-transparent text-sm font-bold text-foreground focus:outline-none cursor-pointer py-1 w-full sm:w-auto"
          >
            <option value="13">Batch 13</option>
            <option value="14">Batch 14 (New)</option>
            <option value="all">All Batches</option>
            {availableCohorts
              .filter((c) => c !== '13' && c !== '14')
              .map((c) => (
                <option key={c} value={c}>
                  Batch {c}
                </option>
              ))}
          </select>
        </div>

        <button
          onClick={onRefresh}
          disabled={refreshing}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border bg-card px-4 text-sm font-semibold transition-colors hover:bg-muted disabled:opacity-50 flex-1 sm:flex-initial"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
        <button
          onClick={onExportCallList}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm shadow-primary/20 transition-colors hover:bg-hover w-full sm:w-auto"
        >
          <Download className="w-4 h-4" />
          <span>Export Call List</span>
        </button>
      </div>
    </div>
  );
}
