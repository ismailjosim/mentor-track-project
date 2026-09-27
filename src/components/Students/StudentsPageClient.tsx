/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertCircle, FileUp, Plus, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { StudentsTable } from '@/components/Students/StudentsTable';
import { StudentAnalysisModal } from './StudentAnalysisModal';
import { StudentAnalysisPanel } from './StudentAnalysisPanel';
import type { AnalysisResult } from './analysis-types';
import { studentApi } from '@/lib/api-client';
import { PAGE_ROUTES } from '@/lib/constants';
import type { StudentWithRelations } from '@/types';

const PAGE_SIZE = 10;

export function StudentsPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [students, setStudents] = useState<StudentWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalStudents, setTotalStudents] = useState(0);
  const [filters, setFilters] = useState(() => ({
    search: searchParams.get('search') || '',
    status: searchParams.get('status') || '',
    progress: searchParams.get('progress') || '',
    group: searchParams.get('group') || '',
    device: searchParams.get('device') || '',
    programType: searchParams.get('programType') || '',
  }));
  const [assignment, setAssignment] = useState(1);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    fetch('/api/settings')
      .then((response) => response.json())
      .then((data) => {
        const value = data.data?.currentAssignment?.split('-')[1];
        if (value) setAssignment(Number(value));
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    const loadStudents = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await studentApi.getAllPaginated(
          page,
          PAGE_SIZE,
          filters.search,
          filters.status,
          filters
        );
        if (response.error) throw new Error(response.error);
        const data = response.data;
        const items = Array.isArray(data)
          ? data
          : data && typeof data === 'object' && 'data' in data && Array.isArray((data as any).data)
            ? (data as any).data
            : [];
        const pagination = (response as any).rawResponse?.pagination;
        setStudents(items);
        setTotalPages(pagination?.pages || Math.max(1, Math.ceil(items.length / PAGE_SIZE)));
        setTotalStudents(pagination?.total || items.length);
      } catch (loadError) {
        const message = loadError instanceof Error ? loadError.message : 'Failed to fetch students';
        setError(message);
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };
    loadStudents();
  }, [page, filters]);

  useEffect(() => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    router.replace(params.toString() ? `/students?${params}` : '/students', { scroll: false });
  }, [filters, router]);

  const updateFilter = (key: keyof typeof filters, value: string) => {
    setFilters((current) => ({ ...current, [key]: value === 'all' ? '' : value }));
    setPage(1);
  };
  const resetFilters = () => {
    setFilters({ search: '', status: '', progress: '', group: '', device: '', programType: '' });
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
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-primary">
            Cohort directory
          </p>
          <h1 className="page-title">Student Roster</h1>
          <p className="page-description">
            Search, segment, and support every participant from one clear workspace.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowAnalysis((visible) => !visible)}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-primary/20 bg-primary/10 px-4 text-sm font-semibold text-primary"
          >
            <Sparkles className="h-4 w-4" />
            Analyze
          </button>
          <Link
            href={`${PAGE_ROUTES.STUDENTS}/import`}
            className="inline-flex h-10 items-center gap-2 rounded-xl border bg-card px-4 text-sm font-semibold"
          >
            <FileUp className="h-4 w-4" />
            Import CSV
          </Link>
          <Link
            href={`${PAGE_ROUTES.STUDENTS}/new`}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground"
          >
            <Plus className="h-4 w-4" />
            Add Student
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
        search={filters.search}
        onSearchChange={(value) => updateFilter('search', value)}
        statusFilter={filters.status || 'all'}
        onStatusFilterChange={(value) => updateFilter('status', value)}
        progressFilter={filters.progress || 'all'}
        onProgressFilterChange={(value) => updateFilter('progress', value)}
        groupFilter={filters.group || 'all'}
        onGroupFilterChange={(value) => updateFilter('group', value)}
        deviceFilter={filters.device || 'all'}
        onDeviceFilterChange={(value) => updateFilter('device', value)}
        programFilter={filters.programType || 'all'}
        onProgramFilterChange={(value) => updateFilter('programType', value)}
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
