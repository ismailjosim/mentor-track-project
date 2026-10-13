import { Users, GraduationCap, Layers, PhoneCall } from 'lucide-react';
import type { AdminStats } from './admin.types';

interface AdminStatsCardsProps {
  stats: AdminStats;
}

export function AdminStatsCards({ stats }: AdminStatsCardsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="surface p-5 rounded-2xl border border-border/80 flex flex-col justify-between hover:border-primary/30 transition-all">
        <div className="flex items-center justify-between text-muted-foreground mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider">Registered Users</span>
          <div className="size-8 rounded-lg bg-info-soft text-info flex items-center justify-center">
            <Users className="size-4" />
          </div>
        </div>
        <p className="text-3xl font-extrabold tracking-tight text-foreground">{stats.totalUsers}</p>
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
          <span className="text-xs font-semibold uppercase tracking-wider">Total Calls Logged</span>
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
  );
}
