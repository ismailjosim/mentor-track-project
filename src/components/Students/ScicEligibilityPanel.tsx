'use client';

import { Trophy, CheckCircle2, XCircle, Info } from 'lucide-react';
import type { Assignment } from '@/interfaces/assignment.interface';
import { cn } from '@/lib/cn';

export function computeScicEligibility(assignments: Assignment[]) {
  const map = new Map(assignments.map((a) => [a.assignmentNumber, a]));

  const details1 = [1, 2, 3, 4, 5, 6, 7, 8].map((n) => {
    const a = map.get(n);
    const hasMarks = a?.status === 'COMPLETED' && a.marks !== undefined;
    if (!hasMarks || !a) return { num: n, pass: false, pct: null as number | null };
    const max = a.maxMarks ?? 60;
    const pct = Math.round((a.marks! / max) * 100);
    return { num: n, pass: pct >= 50, pct };
  });
  const cond1 = details1.every((r) => r.pass);

  const details2 = [9, 10].map((n) => {
    const a = map.get(n);
    const hasMarks = a?.status === 'COMPLETED' && a.marks !== undefined;
    if (!hasMarks || !a) return { num: n, pass: false, pct: null as number | null };
    const max = a.maxMarks ?? 60;
    const pct = Math.round((a.marks! / max) * 100);
    return { num: n, pass: pct >= 70, pct };
  });
  const cond2 = details2.every((r) => r.pass);

  const completedAll = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => map.get(n));
  const allDone = completedAll.every((a) => a?.status === 'COMPLETED' && a.marks !== undefined);
  const avg = allDone ? completedAll.reduce((s, a) => s + (a?.marks ?? 0), 0) / 10 : null;
  const cond3 = avg !== null && avg >= 48;

  return { cond1, cond2, cond3, eligible: cond1 && cond2 && cond3, avg, details1, details2 };
}

function ScicConditionRow({
  label,
  pass,
  detail,
}: {
  label: string;
  pass: boolean;
  detail: string;
}) {
  return (
    <div className="flex items-start gap-3 px-5 py-3">
      {pass ? (
        <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" />
      ) : (
        <XCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
      )}
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            'text-sm font-medium',
            pass ? 'text-success-foreground' : 'text-foreground'
          )}
        >
          {label}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5 wrap-break-word">{detail}</p>
      </div>
      <span
        className={cn(
          'text-xs font-semibold px-2 py-0.5 rounded border shrink-0',
          pass ? 'status-success' : 'status-danger'
        )}
      >
        {pass ? 'Pass' : 'Pending'}
      </span>
    </div>
  );
}

export function ScicEligibilityPanel({ assignments }: { assignments: Assignment[] }) {
  const scic = computeScicEligibility(assignments);

  return (
    <div className="bg-background rounded-xl border shadow-sm overflow-hidden mt-4">
      <div
        className={cn(
          'px-5 py-4 border-b flex items-center justify-between',
          scic.eligible ? 'bg-success-soft/50' : 'bg-muted/20'
        )}
      >
        <div className="flex items-center gap-2">
          <Trophy
            className={cn('w-4 h-4', scic.eligible ? 'text-success' : 'text-muted-foreground')}
          />
          <h3 className="font-semibold text-sm">SCIC Next Program Eligibility</h3>
        </div>
        <span
          className={cn(
            'text-xs font-bold px-2.5 py-1 rounded border',
            scic.eligible ? 'status-success' : 'bg-muted text-muted-foreground border-transparent'
          )}
        >
          {scic.eligible ? '✓ Eligible' : 'Not Eligible Yet'}
        </span>
      </div>

      <div className="divide-y divide-border">
        <ScicConditionRow
          label="Assignments 1–8 each ≥ 50%"
          pass={scic.cond1}
          detail={scic.details1
            .map((r) =>
              r.pct !== null ? `A${r.num}: ${r.pct}%${r.pass ? ' ✓' : ' ✗'}` : `A${r.num}: —`
            )
            .join('  ')}
        />
        <ScicConditionRow
          label="Assignments 9 & 10 each ≥ 70%"
          pass={scic.cond2}
          detail={scic.details2
            .map((r) =>
              r.pct !== null ? `A${r.num}: ${r.pct}%${r.pass ? ' ✓' : ' ✗'}` : `A${r.num}: —`
            )
            .join('  ')}
        />
        <ScicConditionRow
          label="Average marks ≥ 48"
          pass={scic.cond3}
          detail={
            scic.avg !== null
              ? `Current avg: ${scic.avg.toFixed(1)}`
              : 'Complete all 10 assignments with marks first'
          }
        />
      </div>

      <div className="px-5 py-3 bg-muted/10 text-xs text-muted-foreground flex items-start gap-2">
        <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
        <span>
          All 3 conditions must be met. % = marks received ÷ submission tier (60 / 50 / 30).
        </span>
      </div>
    </div>
  );
}
