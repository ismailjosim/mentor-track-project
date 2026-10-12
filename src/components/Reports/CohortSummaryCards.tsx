import type { CohortSummaryReportData } from '@/types/reports';
import { Users, UserCheck, UserX, Award } from 'lucide-react';

interface CohortSummaryCardsProps {
  data: CohortSummaryReportData;
}

export function CohortSummaryCards({ data }: CohortSummaryCardsProps) {
  const joinRate =
    data.totalStudents > 0 ? Math.round((data.joinedMentorship / data.totalStudents) * 100) : 0;
  const notJoinedRate =
    data.totalStudents > 0 ? Math.round((data.notJoinedMentorship / data.totalStudents) * 100) : 0;

  const cards = [
    {
      label: 'Total Students',
      value: data.totalStudents,
      icon: Users,
      style: 'bg-muted/40 border-border/80',
      textColor: 'text-foreground',
      sub: 'All enrolled students',
    },
    {
      label: 'Total Joined',
      value: data.joinedMentorship,
      icon: UserCheck,
      style: 'status-info',
      textColor: 'text-info-foreground',
      sub: `${joinRate}% joined mentorship`,
    },
    {
      label: 'Total Not Joined',
      value: data.notJoinedMentorship,
      icon: UserX,
      style: 'status-warning',
      textColor: 'text-warning-foreground',
      sub: `${notJoinedRate}% pending join`,
    },
    {
      label: 'Completed All Assignments',
      value: data.completedAllAssignments,
      icon: Award,
      style: 'status-success',
      textColor: 'text-success-foreground',
      sub: 'Finished all 10 assignments',
    },
  ];

  return (
    <div className="surface overflow-hidden">
      <div className="border-b border-border/70 px-6 py-5">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          Cohort Summary
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          স্টুডেন্ট এনরোলমেন্ট, মেন্টরশিপ গ্রুপ জয়েনিং স্ট্যাটাস এবং অ্যাসাইনমেন্ট ওভারভিউ
        </p>
      </div>

      <div className="p-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(({ label, value, icon: Icon, style, textColor, sub }) => (
          <div
            key={label}
            className={`${style} rounded-xl border p-4 flex flex-col justify-between`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider opacity-80">
                  {label}
                </span>
                <Icon className="w-4 h-4 opacity-70" />
              </div>
              <p className={`text-3xl font-extrabold ${textColor}`}>{value}</p>
            </div>
            {sub && <p className="text-xs mt-2 opacity-80 font-medium">{sub}</p>}
          </div>
        ))}
      </div>

      {data.perAssignment && data.perAssignment.length > 0 && (
        <div className="px-6 pb-6 pt-2 border-t border-border/50">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Assignment Wise Submissions
            </p>
            <span className="text-xs text-muted-foreground">
              Total Cohort: {data.totalStudents} students
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-2.5">
            {data.perAssignment.map(({ assignmentKey, submitted }) => {
              const pct =
                data.totalStudents > 0 ? Math.round((submitted / data.totalStudents) * 100) : 0;

              return (
                <div
                  key={assignmentKey}
                  className="rounded-xl border border-border/70 p-2.5 text-center bg-background/50 hover:bg-muted/40 transition-colors"
                >
                  <p className="text-xs font-bold text-muted-foreground">{assignmentKey}</p>
                  <p className="text-xl font-bold mt-1 text-foreground">{submitted}</p>
                  <div className="mt-1.5 h-1.5 w-full bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">{pct}%</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
