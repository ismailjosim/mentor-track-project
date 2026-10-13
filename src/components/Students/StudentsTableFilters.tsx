'use client';

import {
  Search,
  Download,
  X,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Layers,
} from 'lucide-react';
import {
  STATUS_OPTIONS,
  GROUP_OPTIONS,
  PROGRAM_OPTIONS,
  COHORT_OPTIONS,
  SUBMITTED_ASSIGNMENT_OPTIONS,
  NOT_SUBMITTED_ASSIGNMENT_OPTIONS,
  FILTER_PRESETS,
  type StudentTableFilters as IStudentTableFilters,
  type StudentFilterKey,
} from './types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ClearFiltersButton } from '@/components/shared/ClearFiltersButton';

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
  const currentFilters = {
    search: filters.search || '',
    cohort: filters.cohort || 'all',
    status: filters.status || 'all',
    progress: filters.progress || 'all',
    submittedAssignment: filters.submittedAssignment || 'all',
    notSubmittedAssignment: filters.notSubmittedAssignment || 'none',
    group: filters.group || 'all',
    programType: filters.programType || 'all',
  };

  const handleSelectChange = (key: StudentFilterKey, value: string) => {
    onFilterChange(key, value);
  };

  const applyPreset = (preset: (typeof FILTER_PRESETS)[number]) => {
    onFilterChange('submittedAssignment', preset.submittedAssignment);
    onFilterChange('notSubmittedAssignment', preset.notSubmittedAssignment);
    onFilterChange('group', preset.group);
  };

  const clearCriteria = () => {
    onFilterChange('submittedAssignment', 'all');
    onFilterChange('notSubmittedAssignment', 'none');
  };

  const hasAssignmentCriteria =
    currentFilters.submittedAssignment !== 'all' ||
    currentFilters.notSubmittedAssignment !== 'none';

  return (
    <div className="p-4 sm:p-5 border-b bg-card/40 space-y-3.5">
      {/* Top row: Search input + Actions (Reset, Export) */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-lg">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none shrink-0" />
          <Input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={currentFilters.search}
            onChange={(e) => onFilterChange('search', e.target.value)}
            className="pl-9 pr-9 h-10 text-sm bg-background w-full rounded-xl"
          />
          {currentFilters.search && (
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
          <ClearFiltersButton
            onClear={onResetFilters}
            activeCount={
              (currentFilters.search ? 1 : 0) +
              (currentFilters.cohort !== 'all' ? 1 : 0) +
              (currentFilters.status !== 'all' ? 1 : 0) +
              (currentFilters.submittedAssignment !== 'all' ? 1 : 0) +
              (currentFilters.notSubmittedAssignment !== 'none' ? 1 : 0) +
              (currentFilters.group !== 'all' ? 1 : 0) +
              (currentFilters.programType !== 'all' ? 1 : 0)
            }
            variant="outline"
            className="h-10 gap-1.5 text-xs text-muted-foreground hover:text-foreground rounded-xl cursor-pointer"
          />

          {onExportFiltered && hasActiveFilters && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onExportFiltered}
              disabled={isExporting}
              className="h-10 gap-1.5 text-xs font-semibold rounded-xl cursor-pointer"
              title="Export filtered call sheet"
            >
              <Download className="size-3.5" />
              <span>{isExporting ? 'Exporting...' : 'Export'}</span>
            </Button>
          )}
        </div>
      </div>

      {/* Quick Presets Row for rapid targeting */}
      <div className="flex flex-wrap items-center gap-1.5 text-xs">
        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-muted-foreground uppercase tracking-wider mr-1">
          <Sparkles className="size-3 text-primary" />
          <span>Quick Rules:</span>
        </span>
        {FILTER_PRESETS.map((preset) => {
          const isActive =
            currentFilters.submittedAssignment === preset.submittedAssignment &&
            currentFilters.notSubmittedAssignment === preset.notSubmittedAssignment &&
            (preset.group === 'all' || currentFilters.group === preset.group);
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => applyPreset(preset)}
              className={`px-2.5 py-1 rounded-lg font-medium text-xs transition-all cursor-pointer border ${
                isActive
                  ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                  : 'bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground border-border/70'
              }`}
            >
              {preset.label}
            </button>
          );
        })}
      </div>

      {/* Bottom row: Filter dropdowns */}
      <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-border/50">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground mr-1">
          <Filter className="size-3.5 text-primary" />
          <span>Filters:</span>
        </div>

        {/* Cohort / Batch */}
        <div className="flex items-center gap-1.5 border border-primary/30 bg-primary/5 rounded-xl px-2.5 h-9 text-xs font-semibold shrink-0">
          <span className="text-primary font-bold">Batch:</span>
          <select
            value={currentFilters.cohort}
            onChange={(e) => handleSelectChange('cohort', e.target.value)}
            className="bg-transparent text-xs font-bold text-foreground focus:outline-hidden cursor-pointer py-1"
          >
            {COHORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Progress Criteria: 1) Assignment Submitted */}
        <div className="flex items-center gap-1 border border-border/90 bg-background rounded-xl px-2.5 h-9 text-xs font-medium shrink-0 shadow-2xs hover:border-primary/50 transition-colors">
          <CheckCircle2 className="size-3.5 text-emerald-500 shrink-0" />
          <span className="text-muted-foreground text-[11px] font-semibold">Done:</span>
          <select
            value={currentFilters.submittedAssignment}
            onChange={(e) => handleSelectChange('submittedAssignment', e.target.value)}
            className="bg-transparent text-xs text-foreground focus:outline-hidden cursor-pointer py-1 max-w-36.25"
            title="Filter by assignment submitted"
          >
            {SUBMITTED_ASSIGNMENT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Progress Criteria: 2) Assignment NOT Submitted */}
        <div className="flex items-center gap-1 border border-border/90 bg-background rounded-xl px-2.5 h-9 text-xs font-medium shrink-0 shadow-2xs hover:border-destructive/50 transition-colors">
          <AlertTriangle className="size-3.5 text-amber-500 shrink-0" />
          <span className="text-muted-foreground text-[11px] font-semibold">Missing:</span>
          <select
            value={currentFilters.notSubmittedAssignment}
            onChange={(e) => handleSelectChange('notSubmittedAssignment', e.target.value)}
            className="bg-transparent text-xs text-foreground focus:outline-hidden cursor-pointer py-1 max-w-38.75"
            title="Filter by assignment NOT submitted"
          >
            {NOT_SUBMITTED_ASSIGNMENT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Group / Mentorship Filter */}
        <div className="flex items-center gap-1 border border-border/90 bg-background rounded-xl px-2.5 h-9 text-xs font-medium shrink-0 shadow-2xs hover:border-primary/50 transition-colors">
          <Layers className="size-3.5 text-blue-500 shrink-0" />
          <span className="text-muted-foreground text-[11px] font-semibold">Mentorship:</span>
          <select
            value={currentFilters.group}
            onChange={(e) => handleSelectChange('group', e.target.value)}
            className="bg-transparent text-xs text-foreground focus:outline-hidden cursor-pointer py-1"
            title="Filter by mentorship group status"
          >
            {GROUP_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Status */}
        <select
          value={currentFilters.status}
          onChange={(e) => handleSelectChange('status', e.target.value)}
          className="h-9 px-3 border border-border rounded-xl text-xs bg-background text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/20 shrink-0 cursor-pointer"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {/* Program Type */}
        <select
          value={currentFilters.programType}
          onChange={(e) => handleSelectChange('programType', e.target.value)}
          className="h-9 px-3 border border-border rounded-xl text-xs bg-background text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/20 shrink-0 cursor-pointer"
        >
          {PROGRAM_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Active Criteria Indicator badge banner */}
      {hasAssignmentCriteria && (
        <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-primary/8 border border-primary/20 text-xs text-primary animate-in fade-in duration-200">
          <div className="flex items-center gap-2 flex-wrap font-medium">
            <span className="font-bold">Active Criteria:</span>
            {currentFilters.submittedAssignment !== 'all' && (
              <span className="inline-flex items-center gap-1 bg-primary/15 px-2 py-0.5 rounded-md font-semibold">
                ✓ A-{String(currentFilters.submittedAssignment).padStart(2, '0')} Submitted
              </span>
            )}
            {currentFilters.notSubmittedAssignment !== 'none' && (
              <span className="inline-flex items-center gap-1 bg-destructive/15 text-destructive px-2 py-0.5 rounded-md font-semibold">
                ✕ A-{String(currentFilters.notSubmittedAssignment).padStart(2, '0')} Not Submitted
              </span>
            )}
            {currentFilters.group !== 'all' && (
              <span className="inline-flex items-center gap-1 bg-amber-500/15 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-md font-semibold">
                Mentorship: {currentFilters.group === 'missing' ? 'Not Joined (Missing)' : 'In Group'}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={clearCriteria}
            className="text-xs font-semibold hover:underline flex items-center gap-1 cursor-pointer shrink-0"
          >
            <X className="size-3" />
            <span>Clear Criteria</span>
          </button>
        </div>
      )}
    </div>
  );
}
