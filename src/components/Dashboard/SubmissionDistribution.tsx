'use client';

import type { StudentWithRelations } from '@/types';
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
}

// Color palette for different assignment completion levels
const COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
];

export function SubmissionDistribution({ students }: SubmissionDistributionProps) {
  // Count how many students completed each assignment (1–10)
  const distribution = Array.from(
    { length: 10 },
    (_, i) => students.filter((s) => getLastAssignmentNumber(s.lastCompletedAssignment) > i).length
  );

  const total = students.length || 1;

  // Prepare data for Recharts
  const chartData = distribution.map((count, i) => {
    const pct = total > 0 ? Math.round((count / total) * 100) : 0;
    return {
      name: `A-${String(i + 1).padStart(2, '0')}`,
      students: count,
      percentage: pct,
    };
  });

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
                  const studentCount = payload[0].value;
                  const pct = payload[0].payload?.percentage ?? 0;
                  return (
                    <div className="rounded-xl border border-border/80 bg-card p-3 shadow-xl backdrop-blur-md">
                      <p className="text-xs font-bold text-foreground">{label}</p>
                      <p className="mt-1 text-xs font-medium text-foreground">
                        Completed:{' '}
                        <span className="font-bold text-primary">
                          {studentCount} {studentCount === 1 ? 'student' : 'students'} ({pct}%)
                        </span>
                      </p>
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
              {chartData.map((entry, index) => (
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
            <p className="text-lg font-bold text-warning-foreground">
              A-{String(Math.max(...distribution.map((_, i) => i + 1))).padStart(2, '0')}
            </p>
          </div>
          <div className="p-3 bg-muted/30 rounded-lg">
            <p className="text-muted-foreground font-medium mb-1">Average Progress</p>
            <p className="text-xl font-bold">
              {Math.round(distribution.reduce((a, b) => a + b, 0) / 10)}%
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
