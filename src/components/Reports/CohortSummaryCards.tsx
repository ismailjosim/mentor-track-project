import type { CohortSummaryReportData } from '@/types/reports';

interface CohortSummaryCardsProps {
  data: CohortSummaryReportData;
}

export function CohortSummaryCards({ data }: CohortSummaryCardsProps) {
  const cards = [
    { label: 'Total Students', value: data.totalStudents, style: 'bg-muted/30' },
    {
      label: 'Joined Mentorship Group',
      value: data.joinedMentorship,
      style: 'status-info',
      sub: `${data.notJoinedMentorship} not yet joined`,
    },
    {
      label: 'Completed All Assignments',
      value: data.completedAllAssignments,
      style: 'status-success',
    },
  ];

  return (
    <div className="surface overflow-hidden">
      <div className="border-b border-border/70 px-6 py-5">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          Cohort Summary
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          এখন পর্যন্ত মোট কতজন স্টুডেন্ট, মেন্টরশিপ গ্রুপে যোগ দিয়েছে, এবং সব অ্যাসাইনমেন্ট সম্পন্ন
          করেছে
        </p>
      </div>
      <div className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
        {cards.map(({ label, value, style, sub }) => (
          <div key={label} className={`${style} rounded-xl border p-4`}>
            <p className="text-xs font-semibold uppercase tracking-wider opacity-75 mb-2">
              {label}
            </p>
            <p className="text-3xl font-bold">{value}</p>
            {sub && <p className="text-xs mt-1 opacity-75">{sub}</p>}
          </div>
        ))}
      </div>

      {data.perAssignment.length > 0 && (
        <div className="px-6 pb-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            Submissions - selected assignments
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {data.perAssignment.map(({ assignmentKey, submitted }) => (
              <div
                key={assignmentKey}
                className="rounded-xl border border-border/70 p-3 text-center"
              >
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {assignmentKey}
                </p>
                <p className="text-2xl font-bold mt-1">{submitted}</p>
                <p className="text-[11px] text-muted-foreground">students</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
