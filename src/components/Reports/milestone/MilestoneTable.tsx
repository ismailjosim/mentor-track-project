'use client';

import { Input } from '@/components/ui/input';
import type { ComputedMilestoneRow, MilestoneRow } from './types';

interface MilestoneTableProps {
  milestones: ComputedMilestoneRow[];
  onMilestoneChange: (
    index: number,
    field: keyof MilestoneRow,
    value: MilestoneRow[keyof MilestoneRow]
  ) => void;
}

export function MilestoneTable({ milestones, onMilestoneChange }: MilestoneTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-220 text-xs border-collapse">
        <thead>
          <tr className="bg-neutral-900 text-neutral-100 dark:bg-neutral-950 font-bold border-b border-neutral-800">
            <th className="py-3 px-3 text-left w-32 border-r border-neutral-800">Milestone</th>
            <th className="py-3 px-2 text-center w-20 border-r border-neutral-800">Target %</th>
            <th className="py-3 px-2 text-center w-28 border-r border-neutral-800">
              Target Students
            </th>
            <th className="py-3 px-2 text-center w-32 border-r border-neutral-800">
              Actual Completion
            </th>
            <th className="py-3 px-2 text-center w-22 border-r border-neutral-800">Actual %</th>
            <th className="py-3 px-2 text-center w-20 border-r border-neutral-800">Gap</th>
            <th className="py-3 px-2 text-center w-30 border-r border-neutral-800">
              Required / Shortfall
            </th>
            <th className="py-3 px-2 text-center w-28 border-r border-neutral-800">
              Students Reached
            </th>
            <th className="py-3 px-3 text-left w-64 border-r border-neutral-800">
              Initiatives Taken
            </th>
            <th className="py-3 px-3 text-left w-44">Remarks</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/60">
          {milestones.map((row, index) => {
            const isNegativeGap = row.gap !== null && row.gap < 0;

            return (
              <tr key={row.milestone} className="hover:bg-muted/10 transition-colors align-top">
                {/* Milestone Name */}
                <td className="py-2.5 px-3 font-bold text-foreground border-r border-border/40">
                  {row.milestone}
                </td>

                {/* Target % */}
                <td className="py-2.5 px-2 text-center border-r border-border/40">
                  <Input
                    type="number"
                    step="0.1"
                    value={row.targetPct}
                    onChange={(e) =>
                      onMilestoneChange(index, 'targetPct', parseFloat(e.target.value) || 0)
                    }
                    className="w-16 h-7 text-center text-xs mx-auto p-1 font-semibold"
                    aria-label={`${row.milestone} Target Percentage`}
                  />
                </td>

                {/* Target Students (Auto calculated) */}
                <td className="py-2.5 px-2 text-center font-bold text-foreground border-r border-border/40 text-sm">
                  {row.targetCount}
                </td>

                {/* Actual Completion (Editable or auto-populated) */}
                <td className="py-2.5 px-2 text-center border-r border-border/40">
                  <Input
                    type="number"
                    value={row.actualCompletion}
                    onChange={(e) =>
                      onMilestoneChange(
                        index,
                        'actualCompletion',
                        e.target.value === '' ? '' : Number(e.target.value)
                      )
                    }
                    className="w-20 h-7 text-center text-xs mx-auto p-1 font-bold text-primary"
                    placeholder="0"
                    aria-label={`${row.milestone} Actual Completion`}
                  />
                </td>

                {/* Actual % (Auto calculated) */}
                <td className="py-2.5 px-2 text-center font-semibold border-r border-border/40">
                  {row.actualPct !== null ? `${row.actualPct}%` : '—'}
                </td>

                {/* Gap (Auto calculated) */}
                <td className="py-2.5 px-2 text-center font-bold border-r border-border/40">
                  {row.gap !== null ? (
                    <span className={isNegativeGap ? 'text-destructive' : 'text-emerald-600'}>
                      {row.gap > 0 ? `+${row.gap}%` : `${row.gap}%`}
                    </span>
                  ) : (
                    '—'
                  )}
                </td>

                {/* Required / Shortfall (Auto calculated) */}
                <td className="py-2.5 px-2 text-center font-semibold text-foreground border-r border-border/40">
                  {row.shortfall !== null ? row.shortfall : '—'}
                </td>

                {/* Students Reached */}
                <td className="py-2.5 px-2 text-center border-r border-border/40">
                  <Input
                    type="number"
                    value={row.studentsReached}
                    onChange={(e) =>
                      onMilestoneChange(
                        index,
                        'studentsReached',
                        e.target.value === '' ? '' : Number(e.target.value)
                      )
                    }
                    className="w-20 h-7 text-center text-xs mx-auto p-1 font-semibold"
                    placeholder="Reached"
                    aria-label={`${row.milestone} Students Reached`}
                  />
                </td>

                {/* Initiatives Taken (Multi-line bullet notes) */}
                <td className="py-2 px-2.5 border-r border-border/40">
                  <textarea
                    value={row.initiativesTaken}
                    onChange={(e) => onMilestoneChange(index, 'initiativesTaken', e.target.value)}
                    rows={3}
                    className="w-full text-[11px] p-1.5 rounded-md border border-border/60 bg-background resize-none focus:outline-hidden focus:ring-1 focus:ring-primary leading-tight font-sans"
                    placeholder="1. Calls&#10;2. Discord support"
                    aria-label={`${row.milestone} Initiatives Taken`}
                  />
                </td>

                {/* Remarks */}
                <td className="py-2 px-2.5">
                  <Input
                    type="text"
                    value={row.remarks}
                    onChange={(e) => onMilestoneChange(index, 'remarks', e.target.value)}
                    className="w-full h-7 text-[11px] p-1 font-normal"
                    placeholder="Remarks..."
                    aria-label={`${row.milestone} Remarks`}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
