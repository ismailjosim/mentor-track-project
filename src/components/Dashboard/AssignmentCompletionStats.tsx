'use client';

import { useState } from 'react';
import type { StudentWithRelations, AssignmentPerformanceStat } from '@/types';
import { getLastAssignmentNumber } from '@/lib/ui-helpers';
import { LayoutGrid, TableProperties, TrendingDown, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ASSIGNMENT_TARGET_PERCENTAGES } from '@/lib/assignment-targets';

interface AssignmentCompletionStatsProps {
  students?: StudentWithRelations[];
  stats?: AssignmentPerformanceStat[];
}

export function AssignmentCompletionStats({
  students = [],
  stats: serverStats,
}: AssignmentCompletionStatsProps) {
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  // If serverStats not available, fallback to basic calculation
  const computedStats: AssignmentPerformanceStat[] =
    serverStats && serverStats.length > 0
      ? serverStats
      : Array.from({ length: 10 }, (_, i) => {
          const assignmentNum = i + 1;
          const completedCount = students.filter(
            (s) => getLastAssignmentNumber(s.lastCompletedAssignment) >= assignmentNum
          ).length;
          const pct =
            students.length > 0 ? Math.round((completedCount / students.length) * 100) : 0;
          const targetPercentage = ASSIGNMENT_TARGET_PERCENTAGES[assignmentNum];
          const targetCount =
            targetPercentage === null
              ? null
              : Math.round((students.length * targetPercentage) / 100);
          return {
            assignmentNumber: assignmentNum,
            assignmentKey: `A-${String(assignmentNum).padStart(2, '0')}`,
            totalStudents: students.length,
            submittedCount: completedCount,
            submissionRate: pct,
            targetPercentage,
            targetCount,
            actualCompletionRate: pct,
            targetGapPercentage:
              targetPercentage === null ? null : Number((pct - targetPercentage).toFixed(1)),
            studentsToTarget:
              targetCount === null ? null : Math.max(0, targetCount - completedCount),
            gradedCount: completedCount,
            gradedRate: pct,
            pendingOrZeroCount: 0,
            pendingOrZeroRate: 0,
            fullMarksCount: completedCount,
            fullMarksRate: pct,
            above50Count: completedCount,
            above50Rate: pct,
            lowOrZeroCount: 0,
            avgMarks: null,
          };
        });

  return (
    <div className="surface overflow-hidden">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-border/70 px-6 py-5">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
              Assignment Performance &amp; Completion Stats
            </h2>
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-primary/10 text-primary border border-primary/20">
              Assignment-Wise
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Submission totals and new submissions use Tuesday checkpoints
          </p>
        </div>

        <div className="flex items-center gap-1.5 self-end sm:self-auto bg-muted/40 p-1 rounded-lg border border-border/60">
          <Button
            type="button"
            variant={viewMode === 'cards' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('cards')}
            className="h-7 px-2.5 text-xs gap-1.5 cursor-pointer font-medium"
          >
            <LayoutGrid className="size-3.5" />
            <span>Cards</span>
          </Button>
          <Button
            type="button"
            variant={viewMode === 'table' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('table')}
            className="h-7 px-2.5 text-xs gap-1.5 cursor-pointer font-medium"
          >
            <TableProperties className="size-3.5" />
            <span>Detailed Table</span>
          </Button>
        </div>
      </div>

      <div className="p-6">
        {viewMode === 'cards' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
            {computedStats.map((item) => {
              const targetIsSet = item.targetPercentage != null && item.targetCount != null;
              const actualCompletionRate = item.actualCompletionRate ?? item.submissionRate;
              const lowerOrZeroCount =
                item.lowOrZeroCount ??
                Math.max(0, item.gradedCount - item.above50Count + (item.zeroMarksCount || 0));

              return (
                <div
                  key={item.assignmentNumber}
                  className="flex flex-col justify-between rounded-xl border border-border/80 bg-card/60 p-4 transition-all duration-200 hover:-translate-y-1 hover:shadow-md"
                >
                  <div className="mb-3 flex items-center justify-between border-b border-border/40 pb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-primary">
                      {item.assignmentKey}
                    </span>
                    <span className="text-[11px] font-semibold text-muted-foreground">
                      Assignment
                    </span>
                  </div>

                  <div className="mb-3">
                    <p className="text-[11px] font-medium text-muted-foreground">
                      Total submissions
                    </p>
                    <p className="mt-0.5 text-3xl font-bold tracking-tight text-foreground">
                      {item.submittedCount}
                    </p>
                  </div>

                  <div className="mb-3 grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-lg bg-muted/40 p-2">
                      <p className="text-[10px] leading-4 text-muted-foreground">Last Tuesday</p>
                      <p className="font-bold">{item.previousWeekSubmittedCount ?? '—'}</p>
                    </div>
                    <div className="rounded-lg bg-emerald-500/10 p-2">
                      <p className="text-[10px] leading-4 text-muted-foreground">New this week</p>
                      <p className="font-bold text-emerald-700 dark:text-emerald-400">
                        {item.newThisWeekSubmittedCount === undefined
                          ? '—'
                          : `+${item.newThisWeekSubmittedCount}`}
                      </p>
                    </div>
                  </div>

                  <div className="mb-3 rounded-lg border border-border/50 p-2.5 text-xs">
                    {targetIsSet ? (
                      <>
                        <div className="flex justify-between gap-2">
                          <span className="text-muted-foreground">Target</span>
                          <span className="font-semibold">
                            {item.targetPercentage}% · {item.targetCount} students
                          </span>
                        </div>
                        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-primary"
                            style={{ width: `${Math.min(100, actualCompletionRate)}%` }}
                          />
                        </div>
                        <div className="mt-2 flex justify-between gap-2">
                          <span className="text-muted-foreground">Actual completion</span>
                          <span className="font-semibold">{actualCompletionRate}%</span>
                        </div>
                        <div className="mt-1 flex justify-between gap-2">
                          <span className="text-muted-foreground">Gap</span>
                          <span
                            className={`font-semibold ${
                              (item.targetGapPercentage ?? 0) < 0
                                ? 'text-rose-600 dark:text-rose-400'
                                : 'text-emerald-600 dark:text-emerald-400'
                            }`}
                          >
                            {item.targetGapPercentage != null
                              ? `${item.targetGapPercentage > 0 ? '+' : ''}${item.targetGapPercentage}%`
                              : '—'}
                          </span>
                        </div>
                        <p className="mt-1 text-[11px] text-muted-foreground">
                          Need {item.studentsToTarget ?? '—'} more submissions
                        </p>
                      </>
                    ) : (
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-muted-foreground">Target not set</span>
                        <span className="font-semibold">Actual {actualCompletionRate}%</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 border-t border-border/30 pt-2 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <TrendingUp className="size-3 text-emerald-500" />
                        <span>&gt;50% marks</span>
                      </span>
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                        {item.above50Count}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <TrendingDown className="size-3 text-rose-500" />
                        <span>≤50% or 0 marks</span>
                      </span>
                      <span className="font-semibold text-rose-600 dark:text-rose-400">
                        {lowerOrZeroCount}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border/70">
            <table className="w-full min-w-160 text-sm">
              <thead className="bg-muted/40 border-b border-border/70">
                <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="py-3 px-4 font-bold">Assignment</th>
                  <th className="py-3 px-4 font-bold text-blue-600 dark:text-blue-400">
                    &gt; 50% Marks
                  </th>
                  <th className="py-3 px-4 font-bold">Total Submitted</th>
                  <th className="py-3 px-4 font-bold text-emerald-600 dark:text-emerald-400">
                    100% Marks
                  </th>
                  <th className="py-3 px-4 font-bold">Graded (&gt;0)</th>
                  <th className="py-3 px-4 font-bold text-rose-600 dark:text-rose-400">0 Marks</th>
                  <th className="py-3 px-4 font-bold text-amber-600 dark:text-amber-400">
                    Pending
                  </th>
                  <th className="py-3 px-4 font-bold">Avg Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {computedStats.map((item) => (
                  <tr key={item.assignmentNumber} className="hover:bg-muted/10 transition-colors">
                    <td className="py-3 px-4 font-bold text-primary">{item.assignmentKey}</td>
                    <td className="py-3 px-4 font-bold text-blue-600 dark:text-blue-400">
                      {item.above50Count} ({item.above50Rate}%)
                    </td>
                    <td className="py-3 px-4 font-semibold text-foreground">
                      {item.submittedCount} ({item.submissionRate}%)
                    </td>
                    <td className="py-3 px-4 font-semibold text-emerald-600 dark:text-emerald-400">
                      {item.fullMarksCount} ({item.fullMarksRate}%)
                    </td>
                    <td className="py-3 px-4 font-medium text-foreground">
                      {item.gradedCount} ({item.gradedRate}%)
                    </td>
                    <td className="py-3 px-4 font-semibold text-rose-600 dark:text-rose-400">
                      {item.zeroMarksCount ?? 0} ({item.zeroMarksRate ?? 0}%)
                    </td>
                    <td className="py-3 px-4 font-semibold text-amber-600 dark:text-amber-400">
                      {item.pendingCount ?? item.pendingOrZeroCount - (item.zeroMarksCount || 0)} (
                      {item.pendingRate ?? item.pendingOrZeroRate}%)
                    </td>
                    <td className="py-3 px-4 font-mono font-medium">
                      {item.avgMarks !== null ? item.avgMarks : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
