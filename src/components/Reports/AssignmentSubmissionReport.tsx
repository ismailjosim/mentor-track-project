'use client';

import type { AssignmentSubmissionReportData } from '@/types/reports';
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { ArrowDown, ArrowUp, Minus } from 'lucide-react';

interface AssignmentSubmissionReportProps {
  data: AssignmentSubmissionReportData;
}

const COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
];

function DiffBadge({ value }: { value: number | null }) {
  if (value === null) {
    return <span className="text-xs text-muted-foreground">-</span>;
  }
  if (value === 0) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground">
        <Minus className="w-3 h-3" /> 0%
      </span>
    );
  }
  const isDrop = value < 0;
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-semibold ${
        isDrop ? 'text-destructive' : 'text-success-foreground'
      }`}
    >
      {isDrop ? <ArrowDown className="w-3 h-3" /> : <ArrowUp className="w-3 h-3" />}
      {Math.abs(value)}%
    </span>
  );
}

export function AssignmentSubmissionReport({ data }: AssignmentSubmissionReportProps) {
  const chartData = data.assignments.map((row) => ({
    name: row.assignmentKey,
    submitted: row.submitted,
  }));

  return (
    <div className="surface overflow-hidden">
      <div className="border-b border-border/70 px-6 py-5">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          Assignment Submission Trend
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          এখন পর্যন্ত কতজন স্টুডেন্ট প্রতিটি অ্যাসাইনমেন্ট সাবমিট করেছে, এবং পূর্ববর্তী
          অ্যাসাইনমেন্টের তুলনায় পার্থক্য
        </p>
      </div>

      <div className="p-6">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={chartData} margin={{ top: 20, right: 20, left: 40, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground) / 0.1)" />
            <XAxis
              dataKey="name"
              stroke="var(--muted-foreground)"
              tick={{ fill: 'var(--foreground)', fontSize: 13, fontWeight: 500 }}
            />
            <YAxis
              stroke="var(--muted-foreground)"
              tick={{ fill: 'var(--foreground)', fontSize: 12 }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--card)',
                borderColor: 'var(--border)',
                borderRadius: '12px',
                color: 'var(--foreground)',
              }}
              itemStyle={{ color: 'var(--foreground)', fontWeight: 500 }}
              labelStyle={{ color: 'var(--foreground)', fontWeight: 700 }}
            />
            <Bar dataKey="submitted" radius={[8, 8, 0, 0]} name="Submitted">
              {chartData.map((_, index) => (
                <Cell key={index} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-130 text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground border-b border-border/70">
                <th className="py-2 pr-4">Assignment</th>
                <th className="py-2 pr-4">Submitted</th>
                <th className="py-2 pr-4">Submission Rate</th>
                <th className="py-2 pr-4">vs Previous (points)</th>
                <th className="py-2 pr-4">vs Previous (relative)</th>
              </tr>
            </thead>
            <tbody>
              {data.assignments.map((row) => (
                <tr key={row.assignmentKey} className="border-b border-border/40 last:border-0">
                  <td className="py-2 pr-4 font-semibold">{row.assignmentKey}</td>
                  <td className="py-2 pr-4">
                    {row.submitted} / {row.totalStudents}
                  </td>
                  <td className="py-2 pr-4">{row.submissionRate}%</td>
                  <td className="py-2 pr-4">
                    {row.pointDiffVsPrevious === null
                      ? '-'
                      : `${row.pointDiffVsPrevious > 0 ? '+' : ''}${row.pointDiffVsPrevious} pts`}
                  </td>
                  <td className="py-2 pr-4">
                    <DiffBadge value={row.relativeChangePercentVsPrevious} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
