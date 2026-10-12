'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api-client';
import { authClient } from '@/lib/auth-client';
import {
  ShieldCheck,
  Users,
  GraduationCap,
  Layers,
  PhoneCall,
  Search,
  AlertTriangle,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface AdminStats {
  totalUsers: number;
  totalStudents: number;
  totalBatches: number;
  totalCallLogs: number;
  totalFollowUps: number;
}

interface UserItem {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string | null;
  studentsCount: number;
  callsCount: number;
  lastCallDate: string | null;
}

interface BatchItem {
  cohort: string;
  totalStudents: number;
  joinedMentorship: number;
  notJoinedMentorship: number;
  completedStudents: number;
  onTrackStudents: number;
  atRiskStudents: number;
  mentorsCount: number;
  joinRate: number;
}

interface ActivityItem {
  id: string;
  type: string;
  title: string;
  studentName?: string;
  studentCohort?: string;
  mentorName?: string;
  status?: string;
  date: string;
  notes?: string;
}

interface AdminOverviewData {
  stats: AdminStats;
  users: UserItem[];
  batches: BatchItem[];
  recentActivities: ActivityItem[];
  recentStudents: unknown[];
}

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
      toast.success(`Role updated to ${variables.role}`);
      queryClient.invalidateQueries({ queryKey: ['admin-overview'] });
    },
    onError: (err: Error) => {
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="surface p-5 rounded-2xl border border-border/80 flex flex-col justify-between hover:border-primary/30 transition-all">
          <div className="flex items-center justify-between text-muted-foreground mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Registered Users</span>
            <div className="size-8 rounded-lg bg-info-soft text-info flex items-center justify-center">
              <Users className="size-4" />
            </div>
          </div>
          <p className="text-3xl font-extrabold tracking-tight text-foreground">
            {stats.totalUsers}
          </p>
          <p className="text-[11px] text-muted-foreground mt-2">Mentors & administrators</p>
        </div>

        <div className="surface p-5 rounded-2xl border border-border/80 flex flex-col justify-between hover:border-primary/30 transition-all">
          <div className="flex items-center justify-between text-muted-foreground mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Students</span>
            <div className="size-8 rounded-lg bg-success-soft text-success flex items-center justify-center">
              <GraduationCap className="size-4" />
            </div>
          </div>
          <p className="text-3xl font-extrabold tracking-tight text-foreground">
            {stats.totalStudents}
          </p>
          <p className="text-[11px] text-muted-foreground mt-2">Across all batches & mentors</p>
        </div>

        <div className="surface p-5 rounded-2xl border border-border/80 flex flex-col justify-between hover:border-primary/30 transition-all">
          <div className="flex items-center justify-between text-muted-foreground mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Batches</span>
            <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Layers className="size-4" />
            </div>
          </div>
          <p className="text-3xl font-extrabold tracking-tight text-foreground">
            {stats.totalBatches}
          </p>
          <p className="text-[11px] text-muted-foreground mt-2">Active cohort batches</p>
        </div>

        <div className="surface p-5 rounded-2xl border border-border/80 flex flex-col justify-between hover:border-primary/30 transition-all">
          <div className="flex items-center justify-between text-muted-foreground mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Total Calls Logged
            </span>
            <div className="size-8 rounded-lg bg-warning-soft text-warning-foreground flex items-center justify-center">
              <PhoneCall className="size-4 text-warning" />
            </div>
          </div>
          <p className="text-3xl font-extrabold tracking-tight text-foreground">
            {stats.totalCallLogs}
          </p>
          <p className="text-[11px] text-muted-foreground mt-2">All mentor outreach calls</p>
        </div>
      </div>

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

      {/* Tab 1: Registered Users */}
      {activeTab === 'users' && (
        <div className="surface rounded-2xl border overflow-hidden space-y-4">
          <div className="p-4 border-b flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search users by name, email or role..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <p className="text-xs text-muted-foreground font-medium">
              Showing {filteredUsers.length} of {users.length} users
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-xs uppercase tracking-wider text-muted-foreground bg-muted/20">
                  <th className="py-3 px-4 text-left">User</th>
                  <th className="py-3 px-4 text-left">Role</th>
                  <th className="py-3 px-4 text-center">Students Managed</th>
                  <th className="py-3 px-4 text-center">Calls Made</th>
                  <th className="py-3 px-4 text-left">Last Call Date</th>
                  {isSuperAdmin && <th className="py-3 px-4 text-right">Role Management</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredUsers.map((u) => {
                  const isThisSuperAdmin =
                    u.email.toLowerCase() === 'ismailjosim99@gmail.com' || u.role === 'super_admin';

                  return (
                    <tr key={u.id} className="hover:bg-muted/20 transition-colors">
                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-foreground text-xs">{u.name}</p>
                        <p className="text-[11px] text-muted-foreground">{u.email}</p>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                            isThisSuperAdmin
                              ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                              : u.role === 'admin'
                                ? 'bg-primary/20 text-primary border border-primary/30'
                                : 'bg-muted text-muted-foreground border border-border'
                          }`}
                        >
                          {isThisSuperAdmin ? 'Super Admin' : u.role || 'User'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-foreground">
                        {u.studentsCount}
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-foreground">
                        {u.callsCount}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-muted-foreground">
                        {u.lastCallDate
                          ? new Date(u.lastCallDate).toLocaleDateString()
                          : 'No calls yet'}
                      </td>
                      {isSuperAdmin && (
                        <td className="py-3.5 px-4 text-right">
                          {u.email.toLowerCase() === 'ismailjosim99@gmail.com' ? (
                            <span className="text-[11px] text-muted-foreground font-semibold italic">
                              Permanent Super Admin
                            </span>
                          ) : (
                            <select
                              value={u.role || 'user'}
                              disabled={roleMutation.isPending}
                              onChange={(e) =>
                                roleMutation.mutate({ userId: u.id, role: e.target.value })
                              }
                              className="text-xs px-2 py-1 rounded-lg border bg-background font-semibold cursor-pointer"
                            >
                              <option value="user">User / Mentor</option>
                              <option value="admin">Admin</option>
                              <option value="super_admin">Super Admin</option>
                            </select>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Batches & Cohorts Overview */}
      {activeTab === 'batches' && (
        <div className="surface rounded-2xl border overflow-hidden">
          <div className="p-5 border-b">
            <h3 className="font-bold text-sm text-foreground">System Batches & Enrolment Health</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              প্রতিটি ব্যাচে স্টুডেন্টের সংখ্যা, মেন্টরশিপ জয়েনিং ও অগ্রগতি ওভারভিউ
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-xs uppercase tracking-wider text-muted-foreground bg-muted/20">
                  <th className="py-3 px-4 text-left">Batch / Cohort</th>
                  <th className="py-3 px-4 text-center">Total Students</th>
                  <th className="py-3 px-4 text-center">Joined Mentorship</th>
                  <th className="py-3 px-4 text-center">Pending Join</th>
                  <th className="py-3 px-4 text-center">Join Rate</th>
                  <th className="py-3 px-4 text-center">Completed (A-10)</th>
                  <th className="py-3 px-4 text-center">Active Mentors</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {batches.map((b) => (
                  <tr key={b.cohort} className="hover:bg-muted/20 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-foreground">Batch {b.cohort}</td>
                    <td className="py-3.5 px-4 text-center font-bold text-foreground">
                      {b.totalStudents}
                    </td>
                    <td className="py-3.5 px-4 text-center text-success font-semibold">
                      {b.joinedMentorship}
                    </td>
                    <td className="py-3.5 px-4 text-center text-warning font-semibold">
                      {b.notJoinedMentorship}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="inline-flex items-center gap-1.5">
                        <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full"
                            style={{ width: `${b.joinRate}%` }}
                          />
                        </div>
                        <span className="text-xs font-semibold">{b.joinRate}%</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center font-semibold text-primary">
                      {b.completedStudents}
                    </td>
                    <td className="py-3.5 px-4 text-center text-xs text-muted-foreground">
                      {b.mentorsCount} mentor(s)
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Overall System Activities */}
      {activeTab === 'activities' && (
        <div className="surface rounded-2xl border overflow-hidden">
          <div className="p-5 border-b">
            <h3 className="font-bold text-sm text-foreground">Recent System Activities</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              সকল মেন্টর কর্তৃক সম্পন্ন হওয়া সাম্প্রতিক কল আউটরিচ এবং ফলো-আপ অ্যাক্টিভিটি
            </p>
          </div>

          <div className="divide-y divide-border/60">
            {recentActivities.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground">
                No recent activities recorded.
              </div>
            ) : (
              recentActivities.map((act) => (
                <div
                  key={act.id}
                  className="p-4 hover:bg-muted/20 transition-colors flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="size-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <PhoneCall className="size-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-foreground">
                        {act.studentName
                          ? `${act.studentName} (Batch ${act.studentCohort || '-'})`
                          : act.title}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Called by <strong className="text-foreground">{act.mentorName}</strong>{' '}
                        &bull; Status:{' '}
                        <span
                          className={
                            act.status === 'RECEIVED'
                              ? 'text-success font-semibold'
                              : 'text-warning'
                          }
                        >
                          {act.status}
                        </span>
                        {act.notes ? ` &bull; "${act.notes}"` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[11px] font-medium text-muted-foreground">
                      {new Date(act.date).toLocaleDateString()}
                    </p>
                    <p className="text-[10px] text-muted-foreground/70">
                      {new Date(act.date).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
