'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api-client';
import { authClient } from '@/lib/auth-client';
import { ShieldCheck, AlertTriangle, Loader2, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { playCrudSound } from '@/lib/sound-effects';
import type { AdminOverviewData } from './admin.types';
import { AdminStatsCards } from './AdminStatsCards';
import { AdminUsersTab } from './AdminUsersTab';
import { AdminBatchesTab } from './AdminBatchesTab';
import { AdminActivitiesTab } from './AdminActivitiesTab';

export function AdminClient() {
  const queryClient = useQueryClient();
  const { data: session } = authClient.useSession();
  const [activeTab, setActiveTab] = useState<'users' | 'batches' | 'activities'>('users');
  const [searchQuery, setSearchQuery] = useState('');

  const currentUserEmail = session?.user?.email?.toLowerCase();
  const isSuperAdmin =
    currentUserEmail === 'ismailjosim99@gmail.com' ||
    (session?.user as { role?: string | null })?.role === 'super_admin';

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery<AdminOverviewData>({
    queryKey: ['admin-overview'],
    queryFn: async () => {
      const res = await adminApi.getOverview();
      if (res.error) throw new Error(res.error);
      return res.data as AdminOverviewData;
    },
    staleTime: 30 * 1000,
  });

  const roleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const res = await adminApi.updateRole(userId, role);
      if (res.error) throw new Error(res.error);
      return res.data;
    },
    onSuccess: (_, variables) => {
      playCrudSound('update');
      toast.success(`Role updated to ${variables.role}`);
      queryClient.invalidateQueries({ queryKey: ['admin-overview'] });
    },
    onError: (err: Error) => {
      playCrudSound('error');
      toast.error(err.message || 'Failed to update user role');
    },
  });

  const stats = data?.stats || {
    totalUsers: 0,
    totalStudents: 0,
    totalBatches: 0,
    totalCallLogs: 0,
    totalFollowUps: 0,
  };

  const users = data?.users || [];
  const batches = data?.batches || [];
  const recentActivities = data?.recentActivities || [];

  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase();
    return (
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q)
    );
  });

  if (isLoading) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-3">
        <Loader2 className="size-8 animate-spin text-primary" />
        <p className="text-sm font-medium text-muted-foreground">
          Loading System Administration Data...
        </p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-6 text-center">
        <AlertTriangle className="size-8 text-destructive mx-auto mb-2" />
        <h3 className="font-bold text-destructive">Failed to Load Admin Dashboard</h3>
        <p className="text-sm text-destructive/80 mt-1">
          {(error as Error)?.message || 'Access Denied'}
        </p>
        <button
          onClick={() => refetch()}
          className="mt-4 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-semibold text-xs"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/30">
              <ShieldCheck className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-foreground">
                  System Administration
                </h1>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                  {isSuperAdmin ? 'Super Admin' : 'Admin'}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                সিস্টেমের মোট ইউজার, স্টুডেন্ট, ব্যাচ ও ওভারঅল কার্যক্রম মনিটরিং
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="inline-flex items-center gap-2 rounded-xl border border-border px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-muted transition-colors disabled:opacity-50 self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className={`size-3.5 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh Stats
        </button>
      </div>

      {/* Top System-wide KPI Cards */}
      <AdminStatsCards stats={stats} />

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b">
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'users'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Registered Users ({users.length})
        </button>
        <button
          onClick={() => setActiveTab('batches')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'batches'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Batches & Cohorts ({batches.length})
        </button>
        <button
          onClick={() => setActiveTab('activities')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'activities'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Overall System Activities ({recentActivities.length})
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'users' && (
        <AdminUsersTab
          users={users}
          filteredUsers={filteredUsers}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          isSuperAdmin={isSuperAdmin}
          onUpdateRole={(userId, role) => roleMutation.mutate({ userId, role })}
          isPendingRoleUpdate={roleMutation.isPending}
        />
      )}

      {activeTab === 'batches' && <AdminBatchesTab batches={batches} />}

      {activeTab === 'activities' && <AdminActivitiesTab recentActivities={recentActivities} />}
    </div>
  );
}
