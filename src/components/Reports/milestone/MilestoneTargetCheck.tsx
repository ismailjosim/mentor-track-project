'use client';

interface MilestoneTargetCheckProps {
  targetStudents: number;
  actualStudents: number;
  actualPct: number;
  gap: number;
}

export function MilestoneTargetCheck({
  targetStudents,
  actualStudents,
  actualPct,
  gap,
}: MilestoneTargetCheckProps) {
  const isNegative = gap < 0;

  return (
    <div className="space-y-3">
      <h4 className="text-xs font-bold uppercase tracking-wider text-foreground border-b pb-1.5">
        Milestone-10 Final Target Check
      </h4>

      <div className="rounded-xl border border-border/80 overflow-hidden bg-background">
        <table className="w-full text-xs">
          <tbody className="divide-y divide-border/40">
            <tr>
              <td className="py-2.5 px-3 font-semibold text-muted-foreground w-1/2">
                Target Students
              </td>
              <td className="py-2.5 px-3 font-bold text-center w-1/2 text-sm">{targetStudents}</td>
            </tr>
            <tr>
              <td className="py-2.5 px-3 font-semibold text-muted-foreground">Actual Students</td>
              <td className="py-2.5 px-3 font-bold text-center text-primary text-sm">
                {actualStudents}
              </td>
            </tr>
            <tr>
              <td className="py-2.5 px-3 font-semibold text-muted-foreground">
                Actual Completion %
              </td>
              <td className="py-2.5 px-3 font-bold text-center">{actualPct}%</td>
            </tr>
            <tr>
              <td className="py-2.5 px-3 font-semibold text-muted-foreground">Gap vs Target</td>
              <td
                className={`py-2.5 px-3 font-bold text-center ${
                  isNegative ? 'text-destructive' : 'text-emerald-600'
                }`}
              >
                {gap > 0 ? `+${gap}%` : `${gap}%`}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
