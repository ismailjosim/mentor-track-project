'use client';

import { Search, RefreshCw, Download, X, Filter } from 'lucide-react';
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
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

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
    <div className="p-4 sm:p-5 border-b bg-card/40 space-y-3">
      {/* Top row: Search input + Actions (Reset, Export) */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-lg">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none shrink-0" />
          <Input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={filters.search}
            onChange={(e) => onFilterChange('search', e.target.value)}
            className="pl-9 pr-9 h-10 text-sm bg-background w-full"
          />
          {filters.search && (
            <button
              type="button"
              onClick={() => onFilterChange('search', '')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer p-0.5 rounded transition-colors"
              title="Clear search"
            >
              <X className="size-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onResetFilters}
            className="h-10 gap-1.5 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
            title="Reset all filters"
          >
            <RefreshCw className="size-3.5" />
            <span>Reset</span>
          </Button>

          {onExportFiltered && hasActiveFilters && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onExportFiltered}
              disabled={isExporting}
              className="h-10 gap-1.5 text-xs font-semibold cursor-pointer"
              title="Export filtered call sheet"
            >
              <Download className="size-3.5" />
              <span>{isExporting ? 'Exporting...' : 'Export'}</span>
            </Button>
          )}
        </div>
      </div>

      {/* Bottom row: Filter dropdowns */}
      <div className="flex flex-wrap items-center gap-2 pt-0.5">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground mr-1">
          <Filter className="size-3.5 text-primary" />
          <span>Filters:</span>
        </div>

        {/* Cohort / Batch */}
        <div className="flex items-center gap-1.5 border border-primary/30 bg-primary/5 rounded-lg px-2.5 h-9 text-xs font-semibold shrink-0">
          <span className="text-primary font-bold">Batch:</span>
          <select
            value={filters.cohort}
            onChange={(e) => onFilterChange('cohort', e.target.value)}
            className="bg-transparent text-xs font-bold text-foreground focus:outline-hidden cursor-pointer py-1"
          >
            {COHORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Progress */}
        <select
          value={filters.progress}
          onChange={(e) => onFilterChange('progress', e.target.value)}
          className="h-9 px-3 border border-border rounded-lg text-xs bg-background text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/20 shrink-0 cursor-pointer"
        >
          {PROGRESS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {/* Status */}
        <select
          value={filters.status}
          onChange={(e) => onFilterChange('status', e.target.value)}
          className="h-9 px-3 border border-border rounded-lg text-xs bg-background text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/20 shrink-0 cursor-pointer"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {/* Group */}
        <select
          value={filters.group}
          onChange={(e) => onFilterChange('group', e.target.value)}
          className="h-9 px-3 border border-border rounded-lg text-xs bg-background text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/20 shrink-0 cursor-pointer"
        >
          {GROUP_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {/* Device */}
        <select
          value={filters.device}
          onChange={(e) => onFilterChange('device', e.target.value)}
          className="h-9 px-3 border border-border rounded-lg text-xs bg-background text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/20 shrink-0 cursor-pointer"
        >
          {DEVICE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {/* Program Type */}
        <select
          value={filters.programType}
          onChange={(e) => onFilterChange('programType', e.target.value)}
          className="h-9 px-3 border border-border rounded-lg text-xs bg-background text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/20 shrink-0 cursor-pointer"
        >
          {PROGRAM_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
