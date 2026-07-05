/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { StudentsTable } from '@/components/Students/StudentsTable';
import { FileUp, Plus, AlertCircle, Sparkles, X, Loader2 } from 'lucide-react';
import { studentApi } from '@/lib/api-client';
import { PAGE_ROUTES } from '@/lib/constants';
import type { StudentWithRelations } from '@/types';
import toast from 'react-hot-toast';

interface AnalysisResult {
  totalStudents: number;
  completedAssignment: number;
  completedCount: number;
  notCompletedCount: number;
  updatedCount: number;
  students: Array<{
    id: string;
    name: string;
    completed: boolean;
    previousStatus: string;
    newStatus: string;
  }>;
}

export default function StudentsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [students, setStudents] = useState<StudentWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalStudents, setTotalStudents] = useState(0);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');
  const [progressFilter, setProgressFilter] = useState(searchParams.get('progress') || '');
  const [groupFilter, setGroupFilter] = useState(searchParams.get('group') || '');
  const [deviceFilter, setDeviceFilter] = useState(searchParams.get('device') || '');
  const [programFilter, setProgramFilter] = useState(searchParams.get('programType') || '');
  const [selectedAssignment, setSelectedAssignment] = useState<number>(1);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [showAnalyzePanel, setShowAnalyzePanel] = useState(false);

  const PAGE_SIZE = 10;

  // Fetch current assignment from MongoDB on mount
  useEffect(() => {
    const fetchCurrentAssignment = async () => {
      try {
        const response = await fetch('/api/settings');
        const data = await response.json();
        if (data.success && data.data?.currentAssignment) {
          const assignmentNum = parseInt(data.data.currentAssignment.split('-')[1]);
          setSelectedAssignment(assignmentNum);
        }
      } catch (error) {
        console.error('Failed to fetch current assignment:', error);
      }
    };
    fetchCurrentAssignment();
  }, []);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await studentApi.getAllPaginated(
          currentPage,
          PAGE_SIZE,
          search,
          statusFilter === 'all' ? '' : statusFilter,
          {
            device: deviceFilter === 'all' ? '' : deviceFilter,
            group: groupFilter === 'all' ? '' : groupFilter,
            progress: progressFilter === 'all' ? '' : progressFilter,
            programType: programFilter === 'all' ? '' : programFilter,
          }
        );

        if (response.error) {
          throw new Error(response.error);
        }

        const data = response.data;
        const pagination = (response as any).rawResponse?.pagination;
        const updatePagination = (fallbackCount: number) => {
          setTotalPages(pagination?.pages || Math.max(1, Math.ceil(fallbackCount / PAGE_SIZE)));
          setTotalStudents(pagination?.total || fallbackCount);
        };

        if (Array.isArray(data)) {
          setStudents(data);
          updatePagination(data.length);
        } else if (
          data &&
          typeof data === 'object' &&
          'data' in data &&
          Array.isArray((data as any).data)
        ) {
          setStudents((data as any).data);
          updatePagination((data as any).data.length);
        } else if (
          data &&
          typeof data === 'object' &&
          'statusCode' in data &&
          'data' in data &&
          Array.isArray((data as any).data)
        ) {
          setStudents((data as any).data);
          updatePagination((data as any).data.length);
        } else {
          setStudents([]);
          setTotalPages(1);
          setTotalStudents(0);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to fetch students';
        setError(message);
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, [currentPage, search, statusFilter, progressFilter, groupFilter, deviceFilter, programFilter]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (statusFilter) params.set('status', statusFilter);
    if (progressFilter) params.set('progress', progressFilter);
    if (groupFilter) params.set('group', groupFilter);
    if (deviceFilter) params.set('device', deviceFilter);
    if (programFilter) params.set('programType', programFilter);

    const query = params.toString();
    const nextUrl = query ? `${window.location.pathname}?${query}` : window.location.pathname;
    router.replace(nextUrl, { scroll: false });
  }, [search, statusFilter, progressFilter, groupFilter, deviceFilter, programFilter, router]);

  const handleSearchChange = (searchTerm: string) => {
    setSearch(searchTerm);
    setCurrentPage(1); // Reset to page 1 when searching
  };

  const handleStatusChange = (status: string) => {
    setStatusFilter(status === 'all' ? '' : status);
    setCurrentPage(1); // Reset to page 1 when filtering
  };

  const handleProgressChange = (progress: string) => {
    setProgressFilter(progress === 'all' ? '' : progress);
    setCurrentPage(1);
  };

  const handleGroupChange = (group: string) => {
    setGroupFilter(group === 'all' ? '' : group);
    setCurrentPage(1);
  };

  const handleDeviceChange = (device: string) => {
    setDeviceFilter(device === 'all' ? '' : device);
    setCurrentPage(1);
  };

  const handleProgramChange = (programType: string) => {
    setProgramFilter(programType === 'all' ? '' : programType);
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setSearch('');
    setStatusFilter('');
    setProgressFilter('');
    setGroupFilter('');
    setDeviceFilter('');
    setProgramFilter('');
    setCurrentPage(1);
  };

  const handleExportFiltered = async () => {
    try {
      setIsExporting(true);
      const params = new URLSearchParams();

      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);
      if (progressFilter) params.set('progress', progressFilter);
      if (groupFilter) params.set('group', groupFilter);
      if (deviceFilter) params.set('device', deviceFilter);
      if (programFilter) params.set('programType', programFilter);

      const response = await fetch(`/api/export/call-list?${params.toString()}`);

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || data.message || 'Failed to export students');
      }

      const blob = await response.blob();
      const disposition = response.headers.get('Content-Disposition') || '';
      const filenameMatch = disposition.match(/filename="([^"]+)"/);
      const filename =
        filenameMatch?.[1] || `filtered-call-list-${new Date().toISOString().split('T')[0]}.xlsx`;
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');

      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Filtered call sheet exported');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to export students';
      toast.error(message);
    } finally {
      setIsExporting(false);
    }
  };

  const handleAnalyze = async () => {
    try {
      setIsAnalyzing(true);

      const currentAssignment = `A-${String(selectedAssignment).padStart(2, '0')}`;

      const settingsResponse = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentAssignment }),
      });

      if (!settingsResponse.ok) {
        const data = await settingsResponse.json();
        throw new Error(data.message || data.error || 'Failed to save current assignment');
      }

      const response = await fetch(`/api/students/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignmentNumber: selectedAssignment }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to analyze');
      }

      const data = await response.json();
      setAnalysisResult(data.data);
      setShowAnalysisModal(true);
      setShowAnalyzePanel(false);
      toast.success('Analysis completed!');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to analyze students';
      toast.error(message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Page Header */}
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
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setShowAnalyzePanel(!showAnalyzePanel)}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-primary/20 bg-primary/10 px-4 text-sm font-semibold text-primary transition-colors hover:bg-primary/15"
            >
              <Sparkles className="w-4 h-4" />
              Analyze
            </button>
            <Link
              href={`${PAGE_ROUTES.STUDENTS}/import`}
              className="inline-flex h-10 items-center gap-2 rounded-xl border bg-card px-4 text-sm font-semibold transition-colors hover:bg-muted"
            >
              <FileUp className="w-4 h-4" />
              Import CSV
            </Link>
            <Link
              href={`${PAGE_ROUTES.STUDENTS}/new`}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm shadow-primary/20 transition-colors hover:bg-hover"
            >
              <Plus className="w-4 h-4" />
              Add Student
            </Link>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
          <AlertCircle className="w-5 h-5 text-destructive shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-destructive">{error}</p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="px-3 py-1 text-xs bg-destructive text-destructive-foreground rounded hover:bg-destructive/90"
          >
            Retry
          </button>
        </div>
      )}

      {/* Analyze Panel */}
      {showAnalyzePanel && (
        <div className="surface space-y-4 border-primary/20 bg-primary/5 p-5 animate-in slide-in-from-top duration-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                Analyze All Students
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Select an assignment and analyze completion status for all students. Statuses will
                be automatically updated based on completion.
              </p>
            </div>
            <button
              onClick={() => setShowAnalyzePanel(false)}
              className="rounded-lg p-1.5 transition-colors hover:bg-primary/10"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 items-end">
            <div className="flex-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
                Select Assignment
              </label>
              <select
                value={selectedAssignment}
                onChange={(e) => setSelectedAssignment(parseInt(e.target.value))}
                disabled={isAnalyzing}
                className="h-10 w-full rounded-xl border bg-card px-3 text-sm focus:outline-none focus:ring-4 focus:ring-ring/15"
              >
                {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => (
                  <option key={num} value={num}>
                    A-{String(num).padStart(2, '0')}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              className="flex h-10 items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-primary px-6 font-semibold text-primary-foreground transition-colors hover:bg-hover disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              {isAnalyzing ? 'Analyzing...' : 'Analyze'}
            </button>
          </div>
        </div>
      )}

      {/* Loading Modal */}
      {isAnalyzing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="surface w-full max-w-sm shadow-2xl">
            <div className="p-8 flex flex-col items-center justify-center gap-4">
              <Loader2 className="w-12 h-12 text-primary animate-spin" />
              <div className="text-center">
                <h2 className="text-lg font-semibold mb-2">Analyzing Students</h2>
                <p className="text-sm text-muted-foreground">
                  Processing assignment{' '}
                  <strong>A-{String(selectedAssignment).padStart(2, '0')}</strong>...
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Analysis Results Modal */}
      {showAnalysisModal && analysisResult && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="surface max-h-[90vh] w-full max-w-2xl overflow-y-auto shadow-2xl">
            {/* Header */}
            <div className="sticky top-0 flex items-center justify-between border-b bg-card/95 px-6 py-4 backdrop-blur">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Analysis Results
              </h2>
              <button
                onClick={() => setShowAnalysisModal(false)}
                className="p-1 hover:bg-muted rounded transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Summary Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl border border-info-border bg-info-soft p-4">
                  <p className="text-xs text-muted-foreground mb-1">Total Students</p>
                  <p className="text-3xl font-bold text-info-foreground">
                    {analysisResult.totalStudents}
                  </p>
                </div>
                <div className="rounded-xl border border-primary/20 bg-primary/10 p-4">
                  <p className="text-xs text-muted-foreground mb-1">Assignment Analyzed</p>
                  <p className="text-3xl font-bold text-primary">
                    A-{String(analysisResult.completedAssignment).padStart(2, '0')}
                  </p>
                </div>
                <div className="rounded-xl border border-success-border bg-success-soft p-4">
                  <p className="text-xs text-muted-foreground mb-1">Completed</p>
                  <p className="text-3xl font-bold text-success-foreground">
                    {analysisResult.completedCount}{' '}
                    <span className="text-sm text-muted-foreground">
                      (
                      {Math.round(
                        (analysisResult.completedCount / analysisResult.totalStudents) * 100
                      )}
                      %)
                    </span>
                  </p>
                </div>
                <div className="rounded-xl border border-warning-border bg-warning-soft p-4">
                  <p className="text-xs text-muted-foreground mb-1">Not Completed</p>
                  <p className="text-3xl font-bold text-warning-foreground">
                    {analysisResult.notCompletedCount}{' '}
                    <span className="text-sm text-muted-foreground">
                      (
                      {Math.round(
                        (analysisResult.notCompletedCount / analysisResult.totalStudents) * 100
                      )}
                      %)
                    </span>
                  </p>
                </div>
              </div>

              {/* Updated Students */}
              {analysisResult.updatedCount > 0 && (
                <div className="rounded-xl border border-warning-border bg-warning-soft p-4">
                  <p className="text-sm font-semibold text-warning-foreground">
                    ✓ {analysisResult.updatedCount} student
                    {analysisResult.updatedCount !== 1 ? 's' : ''} status updated
                  </p>
                </div>
              )}

              {/* Detailed List */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  Student Details
                </h3>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {analysisResult.students.map((student, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-lg border ${
                        student.completed
                          ? 'bg-success-soft border-success-border'
                          : 'bg-warning-soft border-warning-border'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="font-semibold text-sm">{student.name}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {student.completed ? (
                              <span className="text-success-foreground font-medium">Completed</span>
                            ) : (
                              <span className="text-warning-foreground font-medium">
                                Not Completed
                              </span>
                            )}
                          </p>
                        </div>
                        {student.previousStatus !== student.newStatus && (
                          <div className="text-xs">
                            <span className="mr-2 inline-block rounded bg-neutral-soft px-2 py-1 font-medium text-neutral-foreground">
                              {student.previousStatus}
                            </span>
                            <span className="inline-block rounded bg-primary/10 px-2 py-1 font-medium text-primary">
                              {student.newStatus}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 px-6 py-4 border-t bg-muted/20 flex justify-end gap-2">
              <button
                onClick={async () => {
                  try {
                    const response = await fetch('/api/settings', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        currentAssignment: `A-${String(selectedAssignment).padStart(2, '0')}`,
                      }),
                    });
                    if (response.ok) {
                      setShowAnalysisModal(false);
                      window.location.reload();
                    } else {
                      toast.error('Failed to save assignment');
                    }
                  } catch (
                    _error // eslint-disable-line @typescript-eslint/no-unused-vars
                  ) {
                    toast.error('Failed to save assignment');
                  }
                }}
                className="px-4 py-2 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 transition-colors"
              >
                Done & Refresh
              </button>
            </div>
          </div>
        </div>
      )}

      <StudentsTable
        students={students}
        currentPage={currentPage}
        totalPages={totalPages}
        totalStudents={totalStudents}
        onPageChange={setCurrentPage}
        isLoading={loading}
        search={search}
        onSearchChange={handleSearchChange}
        statusFilter={statusFilter || 'all'}
        onStatusFilterChange={handleStatusChange}
        progressFilter={progressFilter || 'all'}
        onProgressFilterChange={handleProgressChange}
        groupFilter={groupFilter || 'all'}
        onGroupFilterChange={handleGroupChange}
        deviceFilter={deviceFilter || 'all'}
        onDeviceFilterChange={handleDeviceChange}
        programFilter={programFilter || 'all'}
        onProgramFilterChange={handleProgramChange}
        onResetFilters={handleResetFilters}
        onExportFiltered={handleExportFiltered}
        isExporting={isExporting}
      />
    </div>
  );
}
