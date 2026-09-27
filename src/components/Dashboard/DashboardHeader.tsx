'use client';

import { RefreshCw, Download } from 'lucide-react';

interface DashboardHeaderProps {
  lastUpdated: Date | null;
  refreshing: boolean;
  onRefresh: () => void;
  onExportCallList: () => void;
}

export function DashboardHeader({
  lastUpdated,
  refreshing,
  onRefresh,
  onExportCallList,
}: DashboardHeaderProps) {
  return (
    <div className="page-header rounded-3xl border border-border/70 bg-card/70 p-5 shadow-sm backdrop-blur-sm sm:p-7">
      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-primary">
          Operations overview
        </p>
        <h1 className="page-title">Cohort Dashboard</h1>
        <p className="page-description">
          A live view of student progress, outreach priorities, and cohort momentum.
        </p>
        {lastUpdated && (
          <p className="text-xs text-muted-foreground mt-2">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </p>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={onRefresh}
          disabled={refreshing}
          className="inline-flex h-10 items-center gap-2 rounded-xl border bg-card px-4 text-sm font-semibold transition-colors hover:bg-muted disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
        <button
          onClick={onExportCallList}
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm shadow-primary/20 transition-colors hover:bg-hover"
        >
          <Download className="w-4 h-4" />
          Export Call List
        </button>
      </div>
    </div>
  );
}
