'use client';

import type { StudentWithRelations, AssignmentPerformanceStat } from '@/types';
import { getLastAssignmentNumber } from '@/lib/ui-helpers';
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface SubmissionDistributionProps {
  students: StudentWithRelations[];
  stats?: AssignmentPerformanceStat[];
}

// Color palette for different assignment completion levels
const COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
];

export function SubmissionDistribution({ students, stats }: SubmissionDistributionProps) {
  const total = students.length || 1;

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

  return (
    <div className="surface overflow-hidden">
      <div className="px-6 py-4 border-b">
        <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
          Assignment Submission Overview
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          <span className="font-semibold text-foreground">{total}</span> students total • Showing
          completion by assignment
        </p>
      </div>
      <div className="p-6">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} margin={{ top: 10, right: 15, left: 10, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground) / 0.15)" />
            <XAxis
              dataKey="name"
              stroke="var(--border)"
              tick={{ fill: 'var(--foreground)', fontSize: 12, fontWeight: 600 }}
            />
            <YAxis
              stroke="var(--border)"
              tick={{ fill: 'var(--foreground)', fontSize: 12 }}
              label={{
                value: 'Students',
                angle: -90,
                position: 'insideLeft',
                style: { fill: 'var(--foreground)', fontWeight: 600, fontSize: 12 },
              }}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  const entry = payload[0].payload;
                  return (
                    <div className="rounded-xl border border-border/80 bg-card p-3 shadow-xl backdrop-blur-md text-xs space-y-1">
                      <p className="font-bold text-foreground text-sm border-b border-border/40 pb-1">
                        {label} Overview
                      </p>
                      <p className="text-foreground flex items-center justify-between gap-4">
                        <span>Completed (&gt;0):</span>
                        <span className="font-bold text-primary">
                          {entry.students} ({entry.percentage}%)
                        </span>
                      </p>
                      <p className="text-muted-foreground flex items-center justify-between gap-4">
                        <span>&gt; 50% Marks:</span>
                        <span className="font-semibold text-blue-500">
                          {entry.above50} ({entry.above50Pct}%)
                        </span>
                      </p>
                      <p className="text-muted-foreground flex items-center justify-between gap-4">
                        <span>Total Submitted:</span>
                        <span className="font-semibold text-foreground">{entry.submitted}</span>
                      </p>
                      {(entry.zeroMarks > 0 || entry.pending > 0) && (
                        <p className="text-muted-foreground flex items-center justify-between gap-4 pt-1 border-t border-border/20 text-[11px]">
                          <span>0 Marks / Pending:</span>
                          <span className="font-semibold text-amber-500">
                            {entry.zeroMarks} / {entry.pending}
                          </span>
                        </p>
                      )}
                    </div>
                  );
                }
                return null;
              }}
              cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
            />
            <Legend
              wrapperStyle={{ paddingTop: '16px' }}
              formatter={(value) => (
                <span className="text-xs font-medium text-foreground">{value}</span>
              )}
            />
            <Bar dataKey="students" radius={[8, 8, 0, 0]} name="Completed">
              {chartData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {/* Stats Summary */}
        <div className="mt-6 grid grid-cols-2 gap-4 text-xs">
          <div className="p-3 bg-muted/30 rounded-lg">
            <p className="text-muted-foreground font-medium mb-1">Total Students</p>
            <p className="text-xl font-bold">{total}</p>
          </div>
          <div className="rounded-xl border border-success-border bg-success-soft p-3">
            <p className="mb-1 font-medium text-success-foreground">Completed All (A-10)</p>
            <p className="text-xl font-bold text-success-foreground">
              {chartData[9]?.students || 0}
            </p>
          </div>
          <div className="rounded-xl border border-warning-border bg-warning-soft p-3">
            <p className="mb-1 font-medium text-warning-foreground">Latest Completed</p>
            <p className="text-lg font-bold text-warning-foreground">{latestCompletedLabel}</p>
          </div>
          <div className="p-3 bg-muted/30 rounded-lg">
            <p className="text-muted-foreground font-medium mb-1">Average Progress</p>
            <p className="text-xl font-bold">{avgProgress}%</p>
          </div>
        </div>
      </div>
    </div>
  );
}
