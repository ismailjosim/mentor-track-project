'use client';

import { useState } from 'react';
import type { CallHistoryReportData } from '@/types/reports';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { PhoneCall, CheckCircle2, PhoneOff, Users } from 'lucide-react';

interface CallHistoryReportProps {
  data: CallHistoryReportData;
}

export function CallHistoryReport({ data }: CallHistoryReportProps) {
  const [viewMode, setViewMode] = useState<'weekly' | 'monthly'>('weekly');

  const chartData = viewMode === 'weekly' ? data.weekly : data.monthly;
  const summary = data.summary;

  return (
    <div className="surface overflow-hidden">
      {/* Header */}
      <div className="border-b border-border/70 px-6 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <PhoneCall className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              Call History ({viewMode === 'weekly' ? 'Weekly' : 'Monthly'})
            </h2>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            সাপ্তাহিক ও মাসিক ভিত্তিতে সম্পন্ন হওয়া কল, রেসপন্স ও আউটরিচ বিশ্লেষণ
          </p>
        </div>

        {/* View Toggle */}
        <div className="flex items-center rounded-lg border border-border bg-muted/40 p-1 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setViewMode('weekly')}
            className={`rounded-md px-3 py-1 text-xs font-semibold transition-all ${
              viewMode === 'weekly'
                ? 'bg-background text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Weekly (Last 8 Weeks)
          </button>
          <button
            type="button"
            onClick={() => setViewMode('monthly')}
            className={`rounded-md px-3 py-1 text-xs font-semibold transition-all ${
              viewMode === 'monthly'
                ? 'bg-background text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Monthly (Last 6 Months)
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 p-6 border-b border-border/60 bg-muted/10">
        <div className="rounded-xl border border-border/80 bg-background/60 p-4">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-xs font-medium">Total Calls</span>
            <PhoneCall className="w-4 h-4" />
          </div>
          <p className="text-2xl font-bold text-foreground">{summary.totalCalls}</p>
          <p className="text-[11px] text-muted-foreground mt-1">Total call attempts</p>
        </div>

        <div className="rounded-xl border border-border/80 bg-background/60 p-4">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-xs font-medium">Students Contacted</span>
            <Users className="w-4 h-4" />
          </div>
          <p className="text-2xl font-bold text-primary">{summary.uniqueStudentsCalled}</p>
          <p className="text-[11px] text-muted-foreground mt-1">Unique students reached</p>
        </div>

        <div className="status-success rounded-xl border p-4">
          <div className="flex items-center justify-between mb-1 opacity-80">
            <span className="text-xs font-medium">Received / Answered</span>
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <p className="text-2xl font-bold">{summary.receivedCalls}</p>
          <p className="text-[11px] mt-1 opacity-80">{summary.receivedRate}% connection rate</p>
        </div>

        <div className="status-warning rounded-xl border p-4">
          <div className="flex items-center justify-between mb-1 opacity-80">
            <span className="text-xs font-medium">Missed / Not Reached</span>
            <PhoneOff className="w-4 h-4" />
          </div>
          <p className="text-2xl font-bold">{summary.notReceivedCalls}</p>
          <p className="text-[11px] mt-1 opacity-80">Unanswered or unreachable</p>
        </div>
      </div>

      {/* Chart Section */}
      <div className="p-6">
        {chartData.length > 0 && chartData.some((d) => d.total > 0) ? (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData} margin={{ top: 20, right: 20, left: 10, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground) / 0.1)" />
              <XAxis
                dataKey="label"
                stroke="var(--muted-foreground)"
                tick={{ fill: 'var(--foreground)', fontSize: 12 }}
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
              <Legend wrapperStyle={{ paddingTop: '10px' }} />
              <Bar
                dataKey="received"
                name="Received Calls"
                fill="var(--chart-2)"
                radius={[6, 6, 0, 0]}
              />
              <Bar
                dataKey="notReceived"
                name="Missed / Other"
                fill="var(--chart-5)"
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="py-10 text-center text-sm text-muted-foreground">
            No call records found for this period.
          </div>
        )}

        {/* Detailed Breakdown Table */}
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground border-b border-border/70">
                <th className="py-2.5 pr-4">Time Period</th>
                <th className="py-2.5 pr-4">Total Calls</th>
                <th className="py-2.5 pr-4">Received</th>
                <th className="py-2.5 pr-4">Not Received</th>
                <th className="py-2.5 pr-4">Success Rate</th>
              </tr>
            </thead>
            <tbody>
              {chartData.map((row) => (
                <tr
                  key={row.label}
                  className="border-b border-border/40 last:border-0 hover:bg-muted/20"
                >
                  <td className="py-2.5 pr-4 font-semibold text-foreground">{row.label}</td>
                  <td className="py-2.5 pr-4">{row.total}</td>
                  <td className="py-2.5 pr-4 text-success font-medium">{row.received}</td>
                  <td className="py-2.5 pr-4 text-warning font-medium">{row.notReceived}</td>
                  <td className="py-2.5 pr-4">
                    <span className="font-semibold">{row.successRate}%</span>
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
