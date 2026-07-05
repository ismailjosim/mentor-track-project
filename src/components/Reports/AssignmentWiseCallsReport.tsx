import type { AssignmentWiseCallReportData } from '@/types/reports';

interface AssignmentWiseCallsReportProps {
  data: AssignmentWiseCallReportData;
}

export function AssignmentWiseCallsReport({ data }: AssignmentWiseCallsReportProps) {
  const maxCalls = Math.max(1, ...data.rows.map((r) => r.callCount));

  return (
    <div className="surface overflow-hidden">
      <div className="border-b border-border/70 px-6 py-5">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          Assignment-wise Call Volume
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          স্টুডেন্ট যে অ্যাসাইনমেন্টের দিকে এগোচ্ছিল তখন কতগুলো কল করা হয়েছে
        </p>
      </div>

      <div className="p-6 space-y-2">
        {data.rows.map((row) => (
          <div key={row.lastCompletedAtCallTime} className="flex items-center gap-3">
            <div className="w-24 shrink-0 text-xs font-semibold text-muted-foreground">
              Pursuing {row.pursuingAssignment}
            </div>
            <div className="flex-1 h-6 rounded-lg bg-muted/40 overflow-hidden">
              <div
                className="h-full rounded-lg bg-primary/70 flex items-center justify-end px-2"
                style={{ width: `${Math.max(4, (row.callCount / maxCalls) * 100)}%` }}
              >
                {row.callCount > 0 && (
                  <span className="text-[11px] font-semibold text-primary-foreground">
                    {row.callCount}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}

        {data.note && <p className="text-xs text-muted-foreground mt-4">{data.note}</p>}
      </div>
    </div>
  );
}
