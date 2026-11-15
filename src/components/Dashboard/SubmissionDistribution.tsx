'use client';

import type { StudentWithRelations, AssignmentPerformanceStat } from '@/types';
import { getLastAssignmentNumber } from '@/lib/ui-helpers';
import { Award, GraduationCap, ListChecks, TrendingUp, Users } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LabelList,
  ResponsiveContainer,
} from 'recharts';

interface SubmissionDistributionProps {
  students: StudentWithRelations[];
  stats?: AssignmentPerformanceStat[];
}

export function SubmissionDistribution({ students, stats }: SubmissionDistributionProps) {
  const total = students.length;

  // Prepare chart data using live assignment performance stats when available
  const chartData = Array.from({ length: 10 }, (_, i) => {
    const assignmentNum = i + 1;
    const name = `A-${String(assignmentNum).padStart(2, '0')}`;
    const stat = stats?.find((s) => s.assignmentNumber === assignmentNum);

    if (stat) {
      const count = stat.gradedCount;
      const pct = total > 0 ? Number(((count / total) * 100).toFixed(1)) : 0;
      return {
        name,
        students: count,
        percentage: pct,
        submitted: stat.submittedCount,
        above50: stat.above50Count,
        above50Pct: stat.above50Rate,
        fullMarks: stat.fullMarksCount,
        zeroMarks: stat.zeroMarksCount ?? 0,
        pending: stat.pendingCount ?? stat.pendingOrZeroCount - (stat.zeroMarksCount || 0),
      };
    }

    // Fallback based on students' lastCompletedAssignment
    const count = students.filter(
      (s) => getLastAssignmentNumber(s.lastCompletedAssignment) >= assignmentNum
    ).length;
    const pct = total > 0 ? Number(((count / total) * 100).toFixed(1)) : 0;
    return {
      name,
      students: count,
      percentage: pct,
      submitted: count,
      above50: count,
      above50Pct: pct,
      fullMarks: count,
      zeroMarks: 0,
      pending: 0,
    };
  });

  // Calculate highest assignment index with active completed submissions
  const latestCompletedIndex = chartData.reduce(
    (max, d, idx) => (d.students > 0 ? idx + 1 : max),
    0
  );
  const latestCompletedLabel =
    latestCompletedIndex > 0 ? `A-${String(latestCompletedIndex).padStart(2, '0')}` : 'None';

  // Total completed assignments vs total possible assignments (totalStudents * 10)
  const totalPossible = total * 10;
  const totalCompleted = chartData.reduce((acc, d) => acc + d.students, 0);
  const avgProgress =
    totalPossible > 0 ? Number(((totalCompleted / totalPossible) * 100).toFixed(1)) : 0;

  const summaryCards = [
    { label: 'Total students', value: total, icon: Users, tone: 'text-primary bg-primary/10' },
    {
      label: 'Completed all',
      value: chartData[9]?.students || 0,
      icon: Award,
      tone: 'text-emerald-700 bg-emerald-500/10 dark:text-emerald-400',
    },
    {
      label: 'Latest completed',
      value: latestCompletedLabel,
      icon: GraduationCap,
      tone: 'text-amber-700 bg-amber-500/10 dark:text-amber-400',
    },
    {
      label: 'Average progress',
      value: `${avgProgress}%`,
      icon: TrendingUp,
      tone: 'text-violet-700 bg-violet-500/10 dark:text-violet-400',
    },
  ];

  return (
    <div className="surface overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-border/70 px-5 py-4 sm:px-6">
        <div>
          <h2 className="text-sm font-bold tracking-wide text-foreground">
            Assignment Submission Overview
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Graded students by assignment · {total} students in this cohort
          </p>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-primary/15 bg-primary/5 px-3 py-1.5 text-[11px] font-semibold text-primary">
          <ListChecks className="size-3.5" />
          10 assignments
        </span>
      </div>

      <div className="p-4 sm:p-5">
        <div className="rounded-2xl bg-muted/20 p-3 sm:p-4">
          <ResponsiveContainer width="100%" height={340}>
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 4, right: 30, left: 4, bottom: 4 }}
              barCategoryGap={10}
            >
              <defs>
                <linearGradient id="assignmentCompletionFill" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#06b6d4" />
                </linearGradient>
              </defs>
              <CartesianGrid
                horizontal={false}
                stroke="hsl(var(--muted-foreground) / 0.12)"
                strokeDasharray="3 5"
              />
              <XAxis
                type="number"
                domain={[0, Math.max(total, 1)]}
                allowDecimals={false}
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={58}
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'var(--foreground)', fontSize: 11, fontWeight: 600 }}
              />
              <Tooltip
                cursor={{ fill: 'hsl(var(--primary) / 0.05)' }}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const entry = payload[0].payload;
                  return (
                    <div className="min-w-44 rounded-xl border border-border bg-card p-3 text-xs shadow-xl">
                      <p className="mb-2 border-b border-border/70 pb-2 font-bold text-foreground">
                        {entry.name}
                      </p>
                      <div className="flex justify-between gap-4">
                        <span className="text-muted-foreground">Graded students</span>
                        <strong>{entry.students}</strong>
                      </div>
                      <div className="mt-1 flex justify-between gap-4">
                        <span className="text-muted-foreground">Cohort rate</span>
                        <strong>{entry.percentage}%</strong>
                      </div>
                      <div className="mt-1 flex justify-between gap-4">
                        <span className="text-muted-foreground">Total submitted</span>
                        <strong>{entry.submitted}</strong>
                      </div>
                      <div className="mt-1 flex justify-between gap-4">
                        <span className="text-muted-foreground">&gt;50% marks</span>
                        <strong>{entry.above50}</strong>
                      </div>
                      {(entry.zeroMarks > 0 || entry.pending > 0) && (
                        <div className="mt-2 flex justify-between gap-4 border-t border-border/70 pt-2 text-muted-foreground">
                          <span>0 marks / pending</span>
                          <strong className="text-foreground">
                            {entry.zeroMarks} / {entry.pending}
                          </strong>
                        </div>
                      )}
                    </div>
                  );
                }}
              />
              <Bar
                dataKey="students"
                name="Graded students"
                fill="url(#assignmentCompletionFill)"
                radius={[0, 8, 8, 0]}
                maxBarSize={22}
              >
                <LabelList
                  dataKey="students"
                  position="right"
                  fill="var(--muted-foreground)"
                  fontSize={10}
                  fontWeight={600}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 2xl:grid-cols-4">
          {summaryCards.map(({ label, value, icon: Icon, tone }) => (
            <div
              key={label}
              className="flex items-center gap-3 rounded-xl border border-border/70 bg-card/70 p-3.5"
            >
              <div
                className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${tone}`}
              >
                <Icon className="size-4.5" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-medium text-muted-foreground">{label}</p>
                <p className="mt-0.5 truncate text-lg font-bold tracking-tight text-foreground">
                  {value}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
