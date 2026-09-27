'use client';

import { Search, RefreshCw, Download } from 'lucide-react';
import {
  STATUS_OPTIONS,
  PROGRESS_OPTIONS,
  GROUP_OPTIONS,
  DEVICE_OPTIONS,
  PROGRAM_OPTIONS,
} from './types';

interface StudentsTableFiltersProps {
  search: string;
  onSearchChange: (val: string) => void;
  statusFilter: string;
  onStatusFilterChange: (val: string) => void;
  progressFilter: string;
  onProgressFilterChange: (val: string) => void;
  groupFilter: string;
  onGroupFilterChange: (val: string) => void;
  deviceFilter: string;
  onDeviceFilterChange: (val: string) => void;
  programFilter: string;
  onProgramFilterChange: (val: string) => void;
  onResetFilters: () => void;
  onExportFiltered?: () => void;
  isExporting?: boolean;
  hasActiveFilters: boolean;
}

export function StudentsTableFilters({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  progressFilter,
  onProgressFilterChange,
  groupFilter,
  onGroupFilterChange,
  deviceFilter,
  onDeviceFilterChange,
  programFilter,
  onProgramFilterChange,
  onResetFilters,
  onExportFiltered,
  isExporting = false,
  hasActiveFilters,
}: StudentsTableFiltersProps) {
  return (
    <div className="px-5 py-4 border-b bg-muted/20 flex flex-col md:flex-row gap-3 justify-between">
      <div className="relative w-full md:max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search by name, email, or phone..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border rounded-md text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <select
          value={progressFilter}
          onChange={(e) => onProgressFilterChange(e.target.value)}
          className="border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          {PROGRESS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => onStatusFilterChange(e.target.value)}
          className="border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <select
          value={groupFilter}
          onChange={(e) => onGroupFilterChange(e.target.value)}
          className="border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          {GROUP_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <select
          value={deviceFilter}
          onChange={(e) => onDeviceFilterChange(e.target.value)}
          className="border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          {DEVICE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <select
          value={programFilter}
          onChange={(e) => onProgramFilterChange(e.target.value)}
          className="border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          {PROGRAM_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <button
          onClick={onResetFilters}
          className="p-2 border rounded-md hover:bg-muted transition-colors"
          title="Reset filters"
        >
          <RefreshCw className="w-4 h-4 text-muted-foreground" />
        </button>

        {onExportFiltered && hasActiveFilters && (
          <button
            onClick={onExportFiltered}
            disabled={isExporting}
            className="inline-flex items-center gap-2 px-3 py-2 border rounded-md text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50"
            title="Export filtered call sheet"
          >
            <Download className="w-4 h-4" />
            {isExporting ? 'Exporting...' : 'Export'}
          </button>
        )}
      </div>
    </div>
  );
}
