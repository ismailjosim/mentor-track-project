'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PhoneCall, CheckCircle2, PhoneOff, Loader2 } from 'lucide-react';
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
import { dashboardApi } from '@/lib/api-client';

interface CallStatisticsChartProps {
  cohort?: string;
}

type RangeType = 'day' | 'week' | 'month';

interface CallStatItem {
  label: string;
  total: number;
  received: number;
  notReceived: number;
}

interface CallStatsResponse {
  range: RangeType;
  summary: {
    totalCalls: number;
    receivedCalls: number;
    notReceivedCalls: number;
    receivedRate: number;
  };
  chartData: CallStatItem[];
}

export function CallStatisticsChart({ cohort }: CallStatisticsChartProps) {
  const [range, setRange] = useState<RangeType>('week');

  const { data, isLoading: loading } = useQuery<CallStatsResponse>({
    queryKey: ['call-stats', cohort, range],
    queryFn: async () => {
      const res = await dashboardApi.getCallStats(range, cohort);
      if (res.error) throw new Error(res.error);
      return res.data as CallStatsResponse;
    },
    staleTime: 60 * 1000,
  });

  const summary = data?.summary || {
    totalCalls: 0,
    receivedCalls: 0,
    notReceivedCalls: 0,
    receivedRate: 0,
  };

  const chartData = data?.chartData || [];

  return (
    <div className="surface overflow-hidden">
      {/* Header with Title and Range Filter */}
      <div className="flex flex-col gap-4 border-b px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <PhoneCall className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Total Calls & Outreach
            </h2>
            <p className="text-xs text-muted-foreground">
              Call volume trends filtered by{' '}
              {range === 'day' ? 'day' : range === 'week' ? 'week' : 'month'}
            </p>
          </div>
        </div>

        {/* Filter buttons: Day, Week, Month */}
        <div className="flex items-center rounded-lg border bg-muted/40 p-1">
          {(['day', 'week', 'month'] as RangeType[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`rounded-md px-3 py-1 text-xs font-semibold capitalize transition-all ${
                range === r
                  ? 'bg-background text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {r === 'day' ? 'Day' : r === 'week' ? 'Week' : 'Month'}
            </button>
          ))}
        </div>
      </div>

      {/* Summary KPI Pills */}
      <div className="grid grid-cols-2 gap-3 border-b bg-muted/10 p-4 sm:grid-cols-4">
        <div className="rounded-lg border bg-background/50 p-3">
          <p className="text-[11px] font-medium text-muted-foreground">Total Calls</p>
          <p className="mt-0.5 text-xl font-bold tracking-tight text-foreground">
            {summary.totalCalls}
          </p>
          <p className="mt-0.5 text-[10px] text-muted-foreground">In selected period</p>
        </div>

        <div className="rounded-lg border border-success-border bg-success-soft/50 p-3">
          <div className="flex items-center gap-1.5 text-success">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <p className="text-[11px] font-medium">Received / Answered</p>
          </div>
          <p className="mt-0.5 text-xl font-bold tracking-tight text-success-foreground">
            {summary.receivedCalls}
          </p>
          <p className="mt-0.5 text-[10px] text-muted-foreground">
            {summary.receivedRate}% success rate
          </p>
        </div>

        <div className="rounded-lg border border-warning-border bg-warning-soft/50 p-3">
          <div className="flex items-center gap-1.5 text-warning-foreground">
            <PhoneOff className="h-3.5 w-3.5 text-warning" />
            <p className="text-[11px] font-medium">Missed / Other</p>
          </div>
          <p className="mt-0.5 text-xl font-bold tracking-tight text-foreground">
            {summary.notReceivedCalls}
          </p>
          <p className="mt-0.5 text-[10px] text-muted-foreground">Not reached</p>
        </div>

        <div className="rounded-lg border bg-background/50 p-3">
          <p className="text-[11px] font-medium text-muted-foreground">Connection Rate</p>
          <p className="mt-0.5 text-xl font-bold tracking-tight text-primary">
            {summary.receivedRate}%
          </p>
          <p className="mt-0.5 text-[10px] text-muted-foreground">Answered calls ratio</p>
        </div>
      </div>

      {/* Chart Section */}
      <div className="p-6">
        {loading ? (
          <div className="flex h-64 items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            Loading call trends...
          </div>
        ) : chartData.length === 0 || summary.totalCalls === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center text-center text-muted-foreground">
            <PhoneCall className="h-8 w-8 opacity-40 mb-2" />
            <p className="text-sm font-medium">No calls recorded for this period</p>
            <p className="text-xs text-muted-foreground mt-1">
              Recorded calls will appear here in the {range} chart breakdown.
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={290}>
            <BarChart data={chartData} margin={{ top: 15, right: 20, left: -10, bottom: 25 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground) / 0.1)" />
              <XAxis
                dataKey="label"
                stroke="var(--muted-foreground)"
                tick={{ fill: 'var(--foreground)', fontSize: 11, fontWeight: 500 }}
                interval={0}
                angle={range === 'day' ? -20 : 0}
                textAnchor={range === 'day' ? 'end' : 'middle'}
              />
              <YAxis
                stroke="var(--muted-foreground)"
                tick={{ fill: 'var(--foreground)', fontSize: 11 }}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--card)',
                  borderColor: 'var(--border)',
                  borderRadius: '0.75rem',
                  boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.2)',
                  fontSize: '12px',
                  color: 'var(--foreground)',
                }}
                itemStyle={{ color: 'var(--foreground)', fontWeight: 500 }}
                labelStyle={{ color: 'var(--foreground)', fontWeight: 700, marginBottom: '6px' }}
              />
              <Legend
                verticalAlign="top"
                align="right"
                wrapperStyle={{ paddingBottom: '12px', fontSize: '12px' }}
                formatter={(value) => (
                  <span className="text-xs font-medium text-foreground">{value}</span>
                )}
              />
              <Bar
                name="Received Calls"
                dataKey="received"
                fill="#10b981"
                radius={[4, 4, 0, 0]}
                stackId="calls"
              />
              <Bar
                name="Missed / Other"
                dataKey="notReceived"
                fill="#f59e0b"
                radius={[4, 4, 0, 0]}
                stackId="calls"
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
