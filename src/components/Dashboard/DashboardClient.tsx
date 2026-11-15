/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { DashboardStats } from './DashboardStats';
import { CallQueue } from './CallQueue';
import { SubmissionDistribution } from './SubmissionDistribution';
import { AssignmentCompletionStats } from './AssignmentCompletionStats';
import { DashboardSkeleton } from './DashboardSkeleton';
import { DashboardHeader } from './DashboardHeader';
import { CallStatisticsChart } from './CallStatisticsChart';
import { dashboardApi } from '@/lib/api-client';
import { AlertCircle } from 'lucide-react';
import type {
  AssignmentPerformanceStat,
  DashboardStats as DashboardStatsType,
  StudentWithRelations,
} from '@/types';
import toast from 'react-hot-toast';
import { useBatch } from '@/components/providers/BatchProvider';
import { Button } from '@/components/ui/button';

export interface DashboardOverview {
  stats: DashboardStatsType;
  cohort?: string;
  availableCohorts?: string[];
  students: StudentWithRelations[];
  assignmentStats?: AssignmentPerformanceStat[];
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
    setCallQueuePage(1);
    setSelectedBatch(newCohort);
  };

  const handleRefresh = async () => {
    try {
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

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="xl:col-span-7">
          {allStudents.length > 0 && (
            <SubmissionDistribution students={allStudents} stats={overview?.assignmentStats} />
          )}
        </div>
        <div className="xl:col-span-5">
          <CallStatisticsChart cohort={selectedCohort} />
        </div>
      </div>

      {allStudents.length > 0 && (
        <AssignmentCompletionStats students={allStudents} stats={overview?.assignmentStats} />
      )}

      <CallQueue
        students={callQueueStudents}
        onRefresh={handleRefresh}
        currentPage={callQueuePage}
        totalPages={callQueueTotalPages}
        totalCount={callQueueTotalCount}
        onPageChange={(page) => setCallQueuePage(page)}
        loading={isCallQueueLoading}
      />
    </div>
  );
}
