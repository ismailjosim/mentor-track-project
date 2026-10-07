import type { StudentWithRelations } from '@/types';
import { getLastAssignmentNumber } from '@/lib/ui-helpers';

interface AssignmentCompletionStatsProps {
  students: StudentWithRelations[];
}

const ASSIGNMENT_STYLES = [
  'status-info',
  'status-success',
  'bg-secondary text-secondary-foreground border-border',
  'status-warning',
  'status-danger',
  'bg-primary/10 text-primary border-primary/20',
  'status-info',
  'status-success',
  'status-warning',
  'bg-secondary text-secondary-foreground border-border',
];

export function AssignmentCompletionStats({ students }: AssignmentCompletionStatsProps) {
  // Calculate completion count for each assignment (1-10)
  const assignmentStats = Array.from({ length: 10 }, (_, i) => {
    const assignmentNum = i + 1;
    const completedCount = students.filter(
      (s) => getLastAssignmentNumber(s.lastCompletedAssignment) >= assignmentNum
    ).length;
    return {
      number: assignmentNum,
      completed: completedCount,
      percentage: students.length > 0 ? Math.round((completedCount / students.length) * 100) : 0,
      style: ASSIGNMENT_STYLES[i],
    };
  });

  return (
    <div className="surface overflow-hidden">
      <div className="border-b border-border/70 px-6 py-5">
        <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
          Assignment Completion Stats
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Total students who completed each assignment
        </p>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-10 gap-3">
          {assignmentStats.map(({ number, completed, percentage, style }) => (
            <div
              key={number}
              className={`${style} rounded-xl border p-4 text-center transition-all hover:-translate-y-0.5`}
            >
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider">
                A-{String(number).padStart(2, '0')}
              </p>
              <p className="mb-1 text-3xl font-bold">{completed}</p>
              <p className="mb-2 text-xs font-medium opacity-75">
                student{completed !== 1 ? 's' : ''}
              </p>
              <p className="text-sm font-semibold">{percentage}%</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
