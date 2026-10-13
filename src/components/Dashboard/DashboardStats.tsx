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
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4 2xl:grid-cols-8">
      {cards.map(({ title, value, desc, icon: Icon, color, bg }) => (
        <div
          key={title}
          className="surface group flex min-h-38 flex-col justify-between p-4.5 transition duration-200 hover:-translate-y-1 hover:border-primary/25"
        >
          <div
            className={`${bg} ${color} flex size-9 items-center justify-center rounded-xl border shrink-0`}
          >
            <Icon className="w-4.5 h-4.5" />
          </div>
          <div className="mt-2">
            <p className="text-2xl lg:text-3xl font-bold tracking-[-0.04em]">{value}</p>
            <p className="mt-1 text-xs font-semibold text-foreground line-clamp-1">{title}</p>
            <p className="mt-0.5 text-[11px] leading-4 text-muted-foreground line-clamp-1">
              {desc}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
