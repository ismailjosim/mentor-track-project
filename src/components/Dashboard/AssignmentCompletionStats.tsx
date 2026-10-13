'use client';

import { useState } from 'react';
import type { StudentWithRelations, AssignmentPerformanceStat } from '@/types';
import { getLastAssignmentNumber } from '@/lib/ui-helpers';
import { CheckCircle2, Clock, Award, TableProperties, LayoutGrid } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
          return {
            assignmentNumber: assignmentNum,
            assignmentKey: `A-${String(assignmentNum).padStart(2, '0')}`,
            totalStudents: students.length,
            submittedCount: completedCount,
            submissionRate: pct,
            gradedCount: completedCount,
            gradedRate: pct,
            pendingOrZeroCount: 0,
            pendingOrZeroRate: 0,
            fullMarksCount: completedCount,
            fullMarksRate: pct,
            above50Count: completedCount,
            above50Rate: pct,
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
            Total submissions, 100% scores, &gt;50% scores, and pending / 0 marks per assignment
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
              return (
                <div
                  key={item.assignmentNumber}
                  className="rounded-xl border border-border/80 bg-card/60 p-4 transition-all duration-200 hover:-translate-y-1 hover:shadow-md flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between mb-3 border-b border-border/40 pb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-primary">
                      {item.assignmentKey}
                    </span>
                    <span className="text-[11px] font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded">
                      {item.submittedCount} Submissions
                    </span>
                  </div>

                  {/* Primary highlight: >50% Marks count & rate */}
                  <div className="mb-3">
                    <div className="flex items-baseline justify-between">
                      <p className="text-2xl font-bold tracking-tight text-foreground">
                        {item.above50Count}
                      </p>
                      <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                        {item.above50Rate}% (&gt;50%)
                      </span>
                    </div>
                    <div className="w-full bg-muted/60 h-1.5 rounded-full overflow-hidden mt-1.5">
                      <div
                        className="bg-blue-600 dark:bg-blue-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, item.above50Rate)}%` }}
                      />
                    </div>
                  </div>

                  {/* Metrics breakdown */}
                  <div className="space-y-1.5 text-xs pt-1 border-t border-border/30">
                    {/* 100% Marks */}
                    <div className="flex items-center justify-between py-0.5">
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <Award className="size-3 text-emerald-500" />
                        <span>100% Marks</span>
                      </span>
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                        {item.fullMarksCount} ({item.fullMarksRate}%)
                      </span>
                    </div>

                    {/* Graded (>0) */}
                    <div className="flex items-center justify-between py-0.5">
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <CheckCircle2 className="size-3 text-teal-500" />
                        <span>Graded (&gt;0)</span>
                      </span>
                      <span className="font-semibold text-foreground">
                        {item.gradedCount} ({item.gradedRate}%)
                      </span>
                    </div>

                    {/* 0 Marks */}
                    <div className="flex items-center justify-between py-0.5">
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <Clock className="size-3 text-rose-500" />
                        <span>0 Marks</span>
                      </span>
                      <span className="font-semibold text-rose-600 dark:text-rose-400">
                        {item.zeroMarksCount ?? 0} ({item.zeroMarksRate ?? 0}%)
                      </span>
                    </div>

                    {/* Pending Grading */}
                    <div className="flex items-center justify-between py-0.5">
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <Clock className="size-3 text-amber-500" />
                        <span>Pending</span>
                      </span>
                      <span className="font-semibold text-amber-600 dark:text-amber-400">
                        {item.pendingCount ?? item.pendingOrZeroCount - (item.zeroMarksCount || 0)}{' '}
                        ({item.pendingRate ?? item.pendingOrZeroRate}%)
                      </span>
                    </div>

                    {/* Average Marks */}
                    {item.avgMarks !== null && (
                      <div className="flex items-center justify-between pt-1 border-t border-border/20 text-[11px]">
                        <span className="text-muted-foreground">Avg Score:</span>
                        <span className="font-bold text-foreground font-mono">{item.avgMarks}</span>
                      </div>
                    )}
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
