'use client';

import { Download, FileSpreadsheet } from 'lucide-react';

interface ReportsHeaderProps {
  hasReport: boolean;
  onExport: (format: 'csv' | 'xlsx') => void;
}

export function ReportsHeader({ hasReport, onExport }: ReportsHeaderProps) {
  return (
    <div className="page-header rounded-3xl border border-border/70 bg-card/70 p-5 shadow-sm backdrop-blur-sm sm:p-7">
      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-primary">
          Cohort insights
        </p>
        <h1 className="page-title">Generate Report</h1>
        <p className="page-description">
          Pick the sections you need, generate the report, and export it for sharing.
        </p>
      </div>
      {hasReport && (
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onExport('csv')}
            className="inline-flex h-10 items-center gap-2 rounded-xl border bg-card px-4 text-sm font-semibold transition-colors hover:bg-muted"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <button
            onClick={() => onExport('xlsx')}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm shadow-primary/20 transition-colors hover:bg-hover"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Export Excel
          </button>
        </div>
      )}
    </div>
  );
}
