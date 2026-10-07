import { Users, AlertTriangle, PhoneCall, CheckCircle, TrendingUp, Clock } from 'lucide-react';
import type { DashboardStats as Stats } from '@/types';

interface DashboardStatsProps {
  stats: Stats;
}

export function DashboardStats({ stats }: DashboardStatsProps) {
  const progressPct =
    stats.totalAssignments > 0
      ? Math.round((stats.completedAssignments / stats.totalAssignments) * 100)
      : 0;

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
      title: 'On Track',
      value: stats.onTrackStudents,
      desc: 'Keeping up with assignments',
      icon: CheckCircle,
      color: 'text-success-foreground',
      bg: 'bg-success-soft border-success-border',
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
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
      {cards.map(({ title, value, desc, icon: Icon, color, bg }) => (
        <div
          key={title}
          className="surface group flex min-h-40 flex-col justify-between p-5 transition duration-200 hover:-translate-y-1 hover:border-primary/25"
        >
          <div
            className={`${bg} ${color} flex size-10 items-center justify-center rounded-xl border`}
          >
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <p className="text-3xl font-bold tracking-[-0.04em]">{value}</p>
            <p className="mt-1 text-sm font-semibold text-foreground">{title}</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">{desc}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
