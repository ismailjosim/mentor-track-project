'use client';

import { Search, RefreshCw, Download } from 'lucide-react';
import {
  STATUS_OPTIONS,
  PROGRESS_OPTIONS,
  GROUP_OPTIONS,
  DEVICE_OPTIONS,
  PROGRAM_OPTIONS,
  COHORT_OPTIONS,
  type StudentTableFilters as IStudentTableFilters,
  type StudentFilterKey,
} from './types';

interface StudentsTableFiltersProps {
  filters: IStudentTableFilters;
  onFilterChange: (key: StudentFilterKey, val: string) => void;
  onResetFilters: () => void;
  onExportFiltered?: () => void;
  isExporting?: boolean;
  hasActiveFilters: boolean;
}

export function StudentsTableFilters({
  filters,
  onFilterChange,
  onResetFilters,
  onExportFiltered,
  isExporting = false,
  hasActiveFilters,
}: StudentsTableFiltersProps) {
  return (
    <div className="px-4 py-3 sm:px-5 sm:py-4 border-b bg-muted/20 flex flex-col xl:flex-row gap-3 justify-between">
      <div className="relative w-full xl:max-w-xs shrink-0">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search by name, email, or phone..."
          value={filters.search}
          onChange={(e) => onFilterChange('search', e.target.value)}
          className="w-full pl-10 pr-4 py-2 border rounded-md text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:flex xl:flex-wrap items-center gap-2 w-full xl:w-auto">
        <div className="flex items-center gap-1.5 border border-primary/30 bg-primary/5 rounded-md px-2.5 py-1 text-sm font-semibold w-full xl:w-auto">
          <span className="text-xs text-primary font-bold">Batch:</span>
          <select
            value={filters.cohort}
            onChange={(e) => onFilterChange('cohort', e.target.value)}
            className="bg-transparent text-sm font-bold text-foreground focus:outline-none cursor-pointer py-1 w-full"
          >
            {COHORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <select
          value={filters.progress}
          onChange={(e) => onFilterChange('progress', e.target.value)}
          className="border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 w-full xl:w-auto"
        >
          {PROGRESS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <select
          value={filters.status}
          onChange={(e) => onFilterChange('status', e.target.value)}
          className="border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 w-full xl:w-auto"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <select
          value={filters.group}
          onChange={(e) => onFilterChange('group', e.target.value)}
          className="border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 w-full xl:w-auto"
        >
          {GROUP_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <select
          value={filters.device}
          onChange={(e) => onFilterChange('device', e.target.value)}
          className="border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 w-full xl:w-auto"
        >
          {DEVICE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <select
          value={filters.programType}
          onChange={(e) => onFilterChange('programType', e.target.value)}
          className="border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 w-full xl:w-auto"
        >
          {PROGRAM_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <div className="col-span-2 sm:col-span-1 xl:col-auto flex items-center gap-2">
          <button
            onClick={onResetFilters}
            className="p-2 border rounded-md hover:bg-muted transition-colors flex-1 sm:flex-initial flex justify-center items-center"
            title="Reset filters"
          >
            <RefreshCw className="w-4 h-4 text-muted-foreground" />
          </button>

          {onExportFiltered && hasActiveFilters && (
            <button
              onClick={onExportFiltered}
              disabled={isExporting}
              className="inline-flex items-center justify-center gap-2 px-3 py-2 border rounded-md text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50 flex-1 sm:flex-initial"
              title="Export filtered call sheet"
            >
              <Download className="w-4 h-4" />
              <span>{isExporting ? 'Exporting...' : 'Export'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
