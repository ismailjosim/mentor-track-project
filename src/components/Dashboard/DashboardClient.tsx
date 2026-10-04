/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useCallback, useEffect, useState } from 'react';
import { DashboardStats } from './DashboardStats';
import { FailingStudentsTable } from './FailingStudentsTable';
import { CallQueue } from './CallQueue';
import { SubmissionDistribution } from './SubmissionDistribution';
import { AssignmentCompletionStats } from './AssignmentCompletionStats';
import { DashboardSkeleton } from './DashboardSkeleton';
import { DashboardHeader } from './DashboardHeader';
import { dashboardApi } from '@/lib/api-client';
import { AlertCircle } from 'lucide-react';
import type { DashboardStats as DashboardStatsType, StudentWithRelations } from '@/types';
import toast from 'react-hot-toast';
import { useBatch } from '@/components/providers/BatchProvider';

export interface DashboardOverview {
  stats: DashboardStatsType;
  cohort?: string;
  availableCohorts?: string[];
  students: StudentWithRelations[];
  failingStudents: StudentWithRelations[];
  failingPagination: { page: number; total: number; pages: number };
  callQueue: StudentWithRelations[];
  callQueuePagination: { page: number; total: number; pages: number };
}

interface DashboardClientProps {
  initialData?: DashboardOverview;
}

const dashboardMemoryCache: Record<string, DashboardOverview> = {};

export function DashboardClient({ initialData }: DashboardClientProps = {}) {
  const { selectedBatch, setSelectedBatch } = useBatch();

  const selectedCohort = selectedBatch;
  const [availableCohorts, setAvailableCohorts] = useState<string[]>(['13', '14']);
  const [stats, setStats] = useState<DashboardStatsType | null>(initialData?.stats || null);
  const [allStudents, setAllStudents] = useState<StudentWithRelations[]>(
    initialData?.students || []
  );
  const [failingStudents, setFailingStudents] = useState<StudentWithRelations[]>(
    initialData?.failingStudents || []
  );
  const [callQueueStudents, setCallQueueStudents] = useState<StudentWithRelations[]>(
    initialData?.callQueue || []
  );
  const [loading, setLoading] = useState<boolean>(
    !initialData && !dashboardMemoryCache[selectedCohort]
  );
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(initialData ? new Date() : null);

  // Pagination states
  const [failingPage, setFailingPage] = useState(1);
  const [failingTotalPages, setFailingTotalPages] = useState(
    initialData?.failingPagination.pages || 1
  );
  const [failingTotalCount, setFailingTotalCount] = useState(
    initialData?.failingPagination.total || 0
  );
  const [failingLoading, setFailingLoading] = useState(false);

  const [callQueuePage, setCallQueuePage] = useState(1);
  const [callQueueTotalPages, setCallQueueTotalPages] = useState(
    initialData?.callQueuePagination.pages || 1
  );
  const [callQueueTotalCount, setCallQueueTotalCount] = useState(
    initialData?.callQueuePagination.total || 0
  );
  const [callQueueLoading, setCallQueueLoading] = useState(false);

  const applyOverview = useCallback((data: DashboardOverview) => {
    setStats(data.stats);
    setAllStudents(data.students);
    setFailingStudents(data.failingStudents);
    setFailingTotalPages(data.failingPagination.pages);
    setFailingTotalCount(data.failingPagination.total);
    setCallQueueStudents(data.callQueue);
    setCallQueueTotalPages(data.callQueuePagination.pages);
    setCallQueueTotalCount(data.callQueuePagination.total);
    if (data.availableCohorts && data.availableCohorts.length > 0) {
      setAvailableCohorts(data.availableCohorts);
    }
  }, []);

  const fetchOverviewData = useCallback(async (cohort: string) => {
    const overviewResponse = await dashboardApi.getOverview(cohort);

    if (overviewResponse.error) {
      throw new Error(overviewResponse.error);
    }

    if (overviewResponse.data) {
      const data = overviewResponse.data as DashboardOverview;
      dashboardMemoryCache[cohort] = data;
      return data;
    }
    return null;
  }, []);

  useEffect(() => {
    let isMounted = true;

    fetchOverviewData(selectedBatch)
      .then((data) => {
        if (isMounted && data) {
          applyOverview(data);
          setFailingPage(1);
          setCallQueuePage(1);
          setLastUpdated(new Date());
        }
      })
      .catch((err) => {
        if (isMounted) {
          const msg = err instanceof Error ? err.message : 'Failed to switch cohort';
          setError(msg);
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [selectedBatch, fetchOverviewData, applyOverview]);

  const handleCohortChange = (newCohort: string) => {
    if (dashboardMemoryCache[newCohort]) {
      applyOverview(dashboardMemoryCache[newCohort]);
    } else {
      setLoading(true);
    }
    setFailingPage(1);
    setCallQueuePage(1);
    setSelectedBatch(newCohort);
  };

  const handleFailingPageChange = async (newPage: number) => {
    setFailingPage(newPage);
    try {
      setFailingLoading(true);
      const failingResponse = await dashboardApi.getFailingStudents(newPage, 10, selectedCohort);

      if (failingResponse.error) {
        throw new Error(failingResponse.error);
      }

      if (
        failingResponse.data &&
        typeof failingResponse.data === 'object' &&
        'data' in failingResponse.data
      ) {
        setFailingStudents((failingResponse.data as any).data || []);
        setFailingTotalPages((failingResponse.data as any).totalPages || 1);
        setFailingTotalCount((failingResponse.data as any).total || 0);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to fetch failing students');
    } finally {
      setFailingLoading(false);
    }
  };

  const handleCallQueuePageChange = async (newPage: number) => {
    setCallQueuePage(newPage);
    try {
      setCallQueueLoading(true);
      const callQueueResponse = await dashboardApi.getCallQueue(newPage, 10, selectedCohort);

      if (callQueueResponse.error) {
        throw new Error(callQueueResponse.error);
      }

      if (
        callQueueResponse.data &&
        typeof callQueueResponse.data === 'object' &&
        'data' in callQueueResponse.data
      ) {
        setCallQueueStudents((callQueueResponse.data as any).data || []);
        setCallQueueTotalPages((callQueueResponse.data as any).pagination?.pages || 1);
        setCallQueueTotalCount((callQueueResponse.data as any).pagination?.total || 0);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to fetch call queue');
    } finally {
      setCallQueueLoading(false);
    }
  };

  useEffect(() => {
    if (initialData) return;

    const loadOverview = async () => {
      if (dashboardMemoryCache[selectedCohort]) {
        applyOverview(dashboardMemoryCache[selectedCohort]);
        setLoading(false);
      }

      try {
        setError(null);
        if (!dashboardMemoryCache[selectedCohort]) setLoading(true);
        await fetchOverviewData(selectedCohort);
        setLastUpdated(new Date());
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to fetch dashboard data';
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    loadOverview();
  }, [applyOverview, fetchOverviewData, initialData, selectedCohort]);

  const filteredFailingStudents =
    statusFilter === 'all'
      ? failingStudents
      : failingStudents.filter((s) => s.currentStatus === statusFilter);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      setFailingPage(1);
      setCallQueuePage(1);
      await fetchOverviewData(selectedCohort);
      setLastUpdated(new Date());
      toast.success('Dashboard refreshed');
    } catch {
      toast.error('Failed to refresh dashboard');
    } finally {
      setRefreshing(false);
    }
  };

  const handleExportCallList = () => {
    try {
      const csvContent = [
        ['Name', 'Email', 'Phone', 'Status'],
        ...callQueueStudents.map((s) => [s.name, s.email, s.phone || 'N/A', s.currentStatus]),
      ]
        .map((row) => row.map((cell) => `"${cell}"`).join(','))
        .join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `call-list-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Call list exported successfully');
    } catch {
      toast.error('Failed to export call list');
    }
  };

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <DashboardHeader
        lastUpdated={lastUpdated}
        refreshing={refreshing}
        selectedCohort={selectedCohort}
        availableCohorts={availableCohorts}
        onCohortChange={handleCohortChange}
        onRefresh={handleRefresh}
        onExportCallList={handleExportCallList}
      />

      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-danger-border bg-danger-soft p-4">
          <AlertCircle className="w-5 h-5 text-destructive shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-destructive">{error}</p>
            <p className="text-xs text-destructive/80 mt-0.5">Showing cached data if available</p>
          </div>
          <button
            onClick={handleRefresh}
            className="px-3 py-1 text-xs bg-destructive text-destructive-foreground rounded hover:bg-destructive/90"
          >
            Retry
          </button>
        </div>
      )}

      {stats && <DashboardStats stats={stats} />}

      {allStudents.length > 0 && <AssignmentCompletionStats students={allStudents} />}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          {allStudents.length > 0 && <SubmissionDistribution students={allStudents} />}

          <div>
            <div className="mb-4 flex items-center gap-2">
              <span className="text-sm font-medium">Filter by Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="all">All At Risk</option>
                <option value="At Risk">At Risk</option>
                <option value="Behind">Behind</option>
                <option value="Dropped">Dropped</option>
              </select>
              <span className="text-xs text-muted-foreground ml-auto">
                Showing {filteredFailingStudents.length} of {failingStudents.length}
              </span>
            </div>
            <FailingStudentsTable
              students={filteredFailingStudents}
              currentPage={failingPage}
              totalPages={failingTotalPages}
              totalCount={failingTotalCount}
              onPageChange={handleFailingPageChange}
              loading={failingLoading}
            />
          </div>
        </div>

        <div>
          <CallQueue
            students={callQueueStudents}
            onRefresh={handleRefresh}
            currentPage={callQueuePage}
            totalPages={callQueueTotalPages}
            totalCount={callQueueTotalCount}
            onPageChange={handleCallQueuePageChange}
            loading={callQueueLoading}
          />
        </div>
      </div>
    </div>
  );
}
