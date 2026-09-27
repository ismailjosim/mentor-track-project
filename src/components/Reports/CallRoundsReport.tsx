'use client';

import type { CallRoundsReportData } from '@/types/reports';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface CallRoundsReportProps {
  data: CallRoundsReportData;
}

export function CallRoundsReport({ data }: CallRoundsReportProps) {
  const chartData = data.distribution.map((d) => ({
    name: `Round ${d.round}`,
    studentsReached: d.studentsReached,
  }));

  return (
    <div className="surface overflow-hidden">
      <div className="border-b border-border/70 px-6 py-5">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          Call Rounds
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          এখন পর্যন্ত টোটাল কতবার সকল স্টুডেন্টকে কল করা হয়েছে (
          {data.onlyMentorshipGroup ? 'শুধু মেন্টরশিপ গ্রুপ' : 'সকল স্টুডেন্ট'})
        </p>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="status-success rounded-xl border p-4 text-center">
            <p className="text-xs font-semibold uppercase tracking-wider opacity-75">
              Completed Rounds
            </p>
            <p className="text-3xl font-bold mt-1">{data.completedRounds}</p>
            <p className="text-[11px] opacity-75 mt-1">every student called this many times</p>
          </div>
          <div className="rounded-xl border border-border/70 p-4 text-center bg-muted/30">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Total Students
            </p>
            <p className="text-3xl font-bold mt-1">{data.totalStudents}</p>
          </div>
          <div className="status-warning rounded-xl border p-4 text-center">
            <p className="text-xs font-semibold uppercase tracking-wider opacity-75">
              Never Called
            </p>
            <p className="text-3xl font-bold mt-1">{data.studentsNeverCalled}</p>
          </div>
          <div className="status-info rounded-xl border p-4 text-center">
            <p className="text-xs font-semibold uppercase tracking-wider opacity-75">
              Avg Calls / Student
            </p>
            <p className="text-3xl font-bold mt-1">{data.averageCallsPerStudent}</p>
          </div>
        </div>

        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData} margin={{ top: 20, right: 20, left: 20, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground) / 0.1)" />
              <XAxis
                dataKey="name"
                stroke="var(--muted-foreground)"
                tick={{ fill: 'var(--foreground)', fontSize: 12 }}
              />
              <YAxis
                stroke="var(--muted-foreground)"
                tick={{ fill: 'var(--foreground)', fontSize: 12 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--popover)',
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                  color: 'var(--popover-foreground)',
                }}
              />
              <Bar
                dataKey="studentsReached"
                radius={[8, 8, 0, 0]}
                fill="var(--chart-2)"
                name="Students reached"
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-sm text-muted-foreground">No calls logged yet.</p>
        )}
      </div>
    </div>
  );
}
