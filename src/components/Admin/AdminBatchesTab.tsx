import type { BatchItem } from './admin.types';

interface AdminBatchesTabProps {
  batches: BatchItem[];
}

export function AdminBatchesTab({ batches }: AdminBatchesTabProps) {
  return (
    <div className="surface rounded-2xl border overflow-hidden">
      <div className="p-5 border-b">
        <h3 className="font-bold text-sm text-foreground">System Batches & Enrolment Health</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          প্রতিটি ব্যাচে স্টুডেন্টের সংখ্যা, মেন্টরশিপ জয়েনিং ও অগ্রগতি ওভারভিউ
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-xs uppercase tracking-wider text-muted-foreground bg-muted/20">
              <th className="py-3 px-4 text-left">Batch / Cohort</th>
              <th className="py-3 px-4 text-center">Total Students</th>
              <th className="py-3 px-4 text-center">Joined Mentorship</th>
              <th className="py-3 px-4 text-center">Pending Join</th>
              <th className="py-3 px-4 text-center">Join Rate</th>
              <th className="py-3 px-4 text-center">Completed (A-10)</th>
              <th className="py-3 px-4 text-center">Active Mentors</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {batches.map((b) => (
              <tr key={b.cohort} className="hover:bg-muted/20 transition-colors">
                <td className="py-3.5 px-4 font-bold text-foreground">
                  {b.cohort.toLowerCase().startsWith('batch') ? b.cohort : `Batch ${b.cohort}`}
                </td>
                <td className="py-3.5 px-4 text-center font-bold text-foreground">
                  {b.totalStudents}
                </td>
                <td className="py-3.5 px-4 text-center text-success font-semibold">
                  {b.joinedMentorship}
                </td>
                <td className="py-3.5 px-4 text-center text-warning font-semibold">
                  {b.notJoinedMentorship}
                </td>
                <td className="py-3.5 px-4 text-center">
                  <div className="inline-flex items-center gap-1.5">
                    <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${b.joinRate}%` }}
                      />
                    </div>
                    <span className="text-xs font-semibold">{b.joinRate}%</span>
                  </div>
                </td>
                <td className="py-3.5 px-4 text-center font-semibold text-primary">
                  {b.completedStudents}
                </td>
                <td className="py-3.5 px-4 text-center text-xs text-muted-foreground">
                  {b.mentorsCount} mentor(s)
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
