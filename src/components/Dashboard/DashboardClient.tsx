/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { DashboardStats } from './DashboardStats';
import { FailingStudentsTable } from './FailingStudentsTable';
import { CallQueue } from './CallQueue';
import { SubmissionDistribution } from './SubmissionDistribution';
import { AssignmentCompletionStats } from './AssignmentCompletionStats';
import { DashboardSkeleton } from './DashboardSkeleton';
import { DashboardHeader } from './DashboardHeader';
import { CallStatisticsChart } from './CallStatisticsChart';
import { dashboardApi } from '@/lib/api-client';
import { AlertCircle } from 'lucide-react';
import type { DashboardStats as DashboardStatsType, StudentWithRelations } from '@/types';
import toast from 'react-hot-toast';
import { useBatch } from '@/components/providers/BatchProvider';
import { Button } from '@/components/ui/button';

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

export function DashboardClient({ initialData }: DashboardClientProps = {}) {
  const queryClient = useQueryClient();
  const { selectedBatch, setSelectedBatch } = useBatch();
  const selectedCohort = selectedBatch;

  const [statusFilter, setStatusFilter] = useState('all');
  const [failingPage, setFailingPage] = useState(1);
  const [callQueuePage, setCallQueuePage] = useState(1);

  // TanStack Query for dashboard overview
  const {
    data: overview,
    isLoading: isOverviewLoading,
    isRefetching: isRefreshing,
    error: overviewError,
    refetch,
    dataUpdatedAt,
  } = useQuery<DashboardOverview>({
    queryKey: ['dashboard-overview', selectedCohort],
    queryFn: async () => {
      const res = await dashboardApi.getOverview(selectedCohort);
      if (res.error) throw new Error(res.error);
      return res.data as DashboardOverview;
    },
    initialData:
      initialData && (!initialData.cohort || initialData.cohort === selectedCohort)
        ? initialData
        : undefined,
    staleTime: 60 * 1000,
  });

  // Query for paginated failing students beyond page 1
  const { data: paginatedFailing, isLoading: isFailingLoading } = useQuery({
    queryKey: ['dashboard-failing', selectedCohort, failingPage],
    queryFn: async () => {
      const res = await dashboardApi.getFailingStudents(failingPage, 10, selectedCohort);
      if (res.error) throw new Error(res.error);
      return (res.data as any) || {};
    },
    enabled: failingPage > 1,
    staleTime: 60 * 1000,
  });

  // Query for paginated call queue beyond page 1
  const { data: paginatedCallQueue, isLoading: isCallQueueLoading } = useQuery({
    queryKey: ['dashboard-call-queue', selectedCohort, callQueuePage],
    queryFn: async () => {
      const res = await dashboardApi.getCallQueue(callQueuePage, 10, selectedCohort);
      if (res.error) throw new Error(res.error);
      return (res.data as any) || {};
    },
    enabled: callQueuePage > 1,
    staleTime: 60 * 1000,
  });

  const availableCohorts = overview?.availableCohorts || ['13', '14'];
  const stats = overview?.stats || null;
  const allStudents = overview?.students || [];

  const failingStudents: StudentWithRelations[] =
    failingPage === 1 ? overview?.failingStudents || [] : paginatedFailing?.data || [];

  const failingTotalPages =
    failingPage === 1 ? overview?.failingPagination?.pages || 1 : paginatedFailing?.totalPages || 1;

  const failingTotalCount =
    failingPage === 1 ? overview?.failingPagination?.total || 0 : paginatedFailing?.total || 0;

  const callQueueStudents: StudentWithRelations[] =
    callQueuePage === 1 ? overview?.callQueue || [] : paginatedCallQueue?.data || [];

  const callQueueTotalPages =
    callQueuePage === 1
      ? overview?.callQueuePagination?.pages || 1
      : paginatedCallQueue?.pagination?.pages || 1;

  const callQueueTotalCount =
    callQueuePage === 1
      ? overview?.callQueuePagination?.total || 0
      : paginatedCallQueue?.pagination?.total || 0;

  const handleCohortChange = (newCohort: string) => {
    setFailingPage(1);
    setCallQueuePage(1);
    setSelectedBatch(newCohort);
  };

  const handleRefresh = async () => {
    try {
      setFailingPage(1);
      setCallQueuePage(1);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['dashboard-overview', selectedCohort] }),
        refetch(),
      ]);
      toast.success('Dashboard refreshed');
    } catch {
      toast.error('Failed to refresh dashboard');
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

  if (isOverviewLoading && !overview) {
    return <DashboardSkeleton />;
  }

  const filteredFailingStudents =
    statusFilter === 'all'
      ? failingStudents
      : failingStudents.filter((s) => s.currentStatus === statusFilter);

  const errorMessage = overviewError instanceof Error ? overviewError.message : null;
  const lastUpdated = dataUpdatedAt ? new Date(dataUpdatedAt) : null;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <DashboardHeader
        lastUpdated={lastUpdated}
        refreshing={isRefreshing}
        selectedCohort={selectedCohort}
        availableCohorts={availableCohorts}
        onCohortChange={handleCohortChange}
        onRefresh={handleRefresh}
        onExportCallList={handleExportCallList}
      />

      {errorMessage && (
        <div className="flex items-center gap-3 rounded-xl border border-destructive/20 bg-destructive/10 p-4">
          <AlertCircle className="w-5 h-5 text-destructive shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-destructive">{errorMessage}</p>
            <p className="text-xs text-destructive/80 mt-0.5">Showing cached data if available</p>
          </div>
          <Button variant="destructive" size="sm" onClick={handleRefresh}>
            Retry
          </Button>
        </div>
      )}

      {stats && <DashboardStats stats={stats} />}

      <CallStatisticsChart cohort={selectedCohort} />

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
                className="px-3 py-1.5 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-hidden focus:ring-2 focus:ring-primary"
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
              onPageChange={(page) => setFailingPage(page)}
              loading={failingPage > 1 && isFailingLoading}
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
            onPageChange={(page) => setCallQueuePage(page)}
            loading={callQueuePage > 1 && isCallQueueLoading}
          />
        </div>
      </div>
    </div>
  );
}
