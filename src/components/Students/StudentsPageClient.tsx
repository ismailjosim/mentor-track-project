/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertCircle, FileUp, Plus, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { StudentsTable } from '@/components/Students/StudentsTable';
import { StudentAnalysisModal } from './StudentAnalysisModal';
import { StudentAnalysisPanel } from './StudentAnalysisPanel';
import type { AnalysisResult } from './analysis-types';
import { studentApi } from '@/lib/api-client';
import { PAGE_ROUTES } from '@/lib/constants';
import type { StudentWithRelations } from '@/types';
import { useBatch } from '@/components/providers/BatchProvider';

const PAGE_SIZE = 10;

export function StudentsPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { selectedBatch, setSelectedBatch, batchLabel } = useBatch();

  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState(() => {
    const urlCohort = searchParams.get('cohort');
    const initialCohort =
      urlCohort !== null ? urlCohort : selectedBatch === 'all' ? '' : selectedBatch;
    return {
      search: searchParams.get('search') || '',
      cohort: initialCohort,
      status: searchParams.get('status') || '',
      progress: searchParams.get('progress') || '',
      group: searchParams.get('group') || '',
      device: searchParams.get('device') || '',
      programType: searchParams.get('programType') || '',
    };
  });
  const [assignment, setAssignment] = useState(1);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [searchInput, setSearchInput] = useState(filters.search);

  // Debounce search input to avoid race conditions and rapid server requests
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== filters.search) {
        setFilters((current) => ({ ...current, search: searchInput }));
        setPage(1);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [searchInput, filters.search]);

  useEffect(() => {
    fetch('/api/settings')
      .then((response) => response.json())
      .then((data) => {
        const value = data.data?.currentAssignment?.split('-')[1];
        if (value) setAssignment(Number(value));
      })
      .catch(() => undefined);
  }, []);

  const activeFilters = useMemo(
    () => ({
      ...filters,
      cohort: filters.cohort || (selectedBatch === 'all' ? '' : selectedBatch),
    }),
    [filters, selectedBatch]
  );

  // TanStack Query for reactive, cached, and background-synchronized student data
  const {
    data: queryResult,
    isLoading: loading,
    error: queryError,
  } = useQuery({
    queryKey: ['students', page, activeFilters],
    queryFn: async () => {
      const response = await studentApi.getAllPaginated(
        page,
        PAGE_SIZE,
        activeFilters.search,
        activeFilters.status,
        activeFilters
      );
      if (response.error) throw new Error(response.error);
      return response;
    },
    placeholderData: keepPreviousData,
  });

  const students: StudentWithRelations[] = useMemo(() => {
    const data = queryResult?.data;
    if (Array.isArray(data)) return data as StudentWithRelations[];
    if (data && typeof data === 'object' && 'data' in data && Array.isArray((data as any).data)) {
      return (data as any).data;
    }
    return [];
  }, [queryResult]);

  const pagination = (queryResult as any)?.rawResponse?.pagination;
  const totalPages = pagination?.pages || Math.max(1, Math.ceil(students.length / PAGE_SIZE));
  const totalStudents = pagination?.total || students.length;
  const error = queryError instanceof Error ? queryError.message : null;

  useEffect(() => {
    const params = new URLSearchParams();
    Object.entries(activeFilters).forEach(([key, value]) => {
      if (value) params.set(key, String(value));
    });
    router.replace(params.toString() ? `/students?${params}` : '/students', { scroll: false });
  }, [activeFilters, router]);

  const updateFilter = (key: keyof typeof filters, value: string) => {
    setFilters((current) => ({ ...current, [key]: value === 'all' ? '' : value }));
    setPage(1);
  };

  const handleCohortFilterChange = (value: string) => {
    updateFilter('cohort', value);
    setSelectedBatch(value);
  };

  const resetFilters = () => {
    setSearchInput('');
    setFilters({
      search: '',
      cohort: '',
      status: '',
      progress: '',
      group: '',
      device: '',
      programType: '',
    });
    setPage(1);
  };
  const exportFiltered = async () => {
    try {
      setIsExporting(true);
      const response = await fetch(`/api/export/call-list?${new URLSearchParams(filters)}`);
      if (!response.ok) throw new Error('Failed to export students');
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement('a');
      link.href = url;
      link.download = `filtered-call-list-${new Date().toISOString().split('T')[0]}.xlsx`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success('Filtered call sheet exported');
    } catch (exportError) {
      toast.error(exportError instanceof Error ? exportError.message : 'Failed to export students');
    } finally {
      setIsExporting(false);
    }
  };
  const analyze = async () => {
    try {
      setIsAnalyzing(true);
      const currentAssignment = `A-${String(assignment).padStart(2, '0')}`;
      const settings = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentAssignment }),
      });
      if (!settings.ok) throw new Error('Failed to save current assignment');
      const response = await fetch('/api/students/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignmentNumber: assignment }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to analyze');
      setAnalysisResult(data.data);
      setShowAnalysis(false);
      toast.success('Analysis completed!');
    } catch (analysisError) {
      toast.error(
        analysisError instanceof Error ? analysisError.message : 'Failed to analyze students'
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="page-header rounded-3xl border border-border/70 bg-card/70 p-5 sm:p-7">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
              Cohort directory
            </p>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
              {batchLabel(selectedBatch)}
            </span>
          </div>
          <h1 className="page-title">Student Roster</h1>
          <p className="page-description">
            Search, segment, and support every participant from one clear workspace. Currently
            filtered by {batchLabel(selectedBatch)}.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setShowAnalysis((visible) => !visible)}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-primary/20 bg-primary/10 px-3 sm:px-4 text-sm font-semibold text-primary flex-1 sm:flex-initial"
          >
            <Sparkles className="h-4 w-4" />
            <span>Analyze</span>
          </button>
          <Link
            href={`${PAGE_ROUTES.STUDENTS}/import`}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border bg-card px-3 sm:px-4 text-sm font-semibold flex-1 sm:flex-initial"
          >
            <FileUp className="h-4 w-4" />
            <span>Import CSV</span>
          </Link>
          <Link
            href={`${PAGE_ROUTES.STUDENTS}/new`}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-3 sm:px-4 text-sm font-semibold text-primary-foreground w-full sm:w-auto"
          >
            <Plus className="h-4 w-4" />
            <span>Add Student</span>
          </Link>
        </div>
      </div>
      {error && (
        <div className="flex items-center gap-3 rounded-lg border border-destructive/20 bg-destructive/10 p-4">
          <AlertCircle className="h-5 w-5 shrink-0 text-destructive" />
          <p className="flex-1 text-sm font-medium text-destructive">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="rounded bg-destructive px-3 py-1 text-xs text-destructive-foreground"
          >
            Retry
          </button>
        </div>
      )}
      {showAnalysis && (
        <StudentAnalysisPanel
          assignment={assignment}
          isAnalyzing={isAnalyzing}
          onAssignmentChange={setAssignment}
          onAnalyze={analyze}
          onClose={() => setShowAnalysis(false)}
        />
      )}
      <StudentsTable
        students={students}
        currentPage={page}
        totalPages={totalPages}
        totalStudents={totalStudents}
        onPageChange={setPage}
        isLoading={loading}
        filters={{
          ...activeFilters,
          search: searchInput,
          cohort: activeFilters.cohort || 'all',
          status: activeFilters.status || 'all',
          progress: activeFilters.progress || 'all',
          group: activeFilters.group || 'all',
          device: activeFilters.device || 'all',
          programType: activeFilters.programType || 'all',
        }}
        onFilterChange={(key, val) => {
          if (key === 'search') {
            setSearchInput(val);
          } else if (key === 'cohort') {
            handleCohortFilterChange(val);
          } else {
            updateFilter(key, val);
          }
        }}
        onResetFilters={resetFilters}
        onExportFiltered={exportFiltered}
        isExporting={isExporting}
      />
      {analysisResult && (
        <StudentAnalysisModal
          result={analysisResult}
          onClose={() => setAnalysisResult(null)}
          onDone={() => window.location.reload()}
        />
      )}
    </div>
  );
}
