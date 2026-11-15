import {
  Users,
  AlertTriangle,
  PhoneCall,
  CheckCircle,
  TrendingUp,
  Clock,
  UserCheck,
  UserX,
} from 'lucide-react';
import type { DashboardStats as Stats } from '@/types';

interface DashboardStatsProps {
  stats: Stats;
}

export function DashboardStats({ stats }: DashboardStatsProps) {
  const progressPct =
    stats.totalAssignments > 0
      ? Math.round((stats.completedAssignments / stats.totalAssignments) * 100)
      : 0;

  const joined = stats.mentorshipJoined ?? 0;
  const notJoined = stats.mentorshipNotJoined ?? Math.max(0, stats.totalStudents - joined);
  const joinedPct = stats.totalStudents > 0 ? Math.round((joined / stats.totalStudents) * 100) : 0;
  const notJoinedPct = stats.totalStudents > 0 ? 100 - joinedPct : 0;

  const cards = [
    {
      title: 'Total Students',
      value: stats.totalStudents,
      desc: 'Active in cohort',
      icon: Users,
      color: 'text-info-foreground',
      bg: 'bg-info-soft border-info-border',
    },
    {
      title: 'Mentorship Joined',
      value: joined,
      desc: `${joinedPct}% joined group`,
      icon: UserCheck,
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-500/10 border-emerald-500/25',
    },
    {
      title: 'Not Joined (Group)',
      value: notJoined,
      desc: `${notJoinedPct}% missing from group`,
      icon: UserX,
      color: 'text-rose-600 dark:text-rose-400',
      bg: 'bg-rose-500/10 border-rose-500/25',
    },
    {
      title: 'On Track',
      value: stats.onTrackStudents,
      desc: 'Keeping up with assignments',
      icon: CheckCircle,
      color: 'text-success-foreground',
      bg: 'bg-success-soft border-success-border',
    },
    {
      title: 'At Risk',
      value: stats.atRiskStudents,
      desc: 'Need immediate attention',
      icon: AlertTriangle,
      color: 'text-danger-foreground',
      bg: 'bg-danger-soft border-danger-border',
    },
    {
      title: 'Need Calls',
      value: stats.pendingFollowUps,
      desc: 'Pending follow-ups',
      icon: PhoneCall,
      color: 'text-warning-foreground',
      bg: 'bg-warning-soft border-warning-border',
    },
    {
      title: 'Completed',
      value: stats.completedStudents,
      desc: stats.currentAssignment
        ? `Finished up to ${stats.currentAssignment}`
        : 'Finished all assignments',
      icon: TrendingUp,
      color: 'text-primary',
      bg: 'bg-primary/10 border-primary/15',
    },
    {
      title: 'Cohort Progress',
      value: `${progressPct}%`,
      desc: 'Average completion rate',
      icon: Clock,
      color: 'text-accent-foreground',
      bg: 'bg-accent border-border',
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map(({ title, value, desc, icon: Icon, color, bg }) => (
        <div
          key={title}
          className="surface relative overflow-hidden border-border/70 p-5 transition-colors hover:border-primary/30"
        >
          <div
            aria-hidden="true"
            className="absolute -right-8 -top-8 size-24 rounded-full bg-primary/[0.035]"
          />
          <div className="relative flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {title}
              </p>
              <p className="mt-3 text-3xl font-bold tracking-[-0.04em] text-foreground">{value}</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">{desc}</p>
            </div>
            <div
              className={`${bg} ${color} flex size-11 shrink-0 items-center justify-center rounded-2xl border`}
            >
              <Icon className="size-5" />
            </div>
          </div>
          {title === 'Cohort Progress' && (
            <div className="relative mt-4 h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
