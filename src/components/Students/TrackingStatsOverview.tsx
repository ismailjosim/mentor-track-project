'use client';

interface TrackingStatsOverviewProps {
  completedCount: number;
  totalAssignments: number;
  currentAssignmentNumber: number;
  totalMarks: number;
  totalSubmittedAssignments: number;
  avgMarksFormatted: string;
}

export function TrackingStatsOverview({
  completedCount,
  totalAssignments,
  currentAssignmentNumber,
  totalMarks,
  totalSubmittedAssignments,
  avgMarksFormatted,
}: TrackingStatsOverviewProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
        Progress Overview
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 bg-muted/30 rounded-lg border">
          <p className="text-xs text-muted-foreground mb-1">Assignments Submitted</p>
          <p className="text-2xl font-bold">
            {completedCount}/{totalAssignments}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {totalAssignments > 0 ? Math.round((completedCount / totalAssignments) * 100) : 0}%
          </p>
        </div>
        <div className="p-4 bg-muted/30 rounded-lg border">
          <p className="text-xs text-muted-foreground mb-1">Current Assignment</p>
          <p className="text-2xl font-bold">A-{String(currentAssignmentNumber).padStart(2, '0')}</p>
          <p className="text-xs text-muted-foreground mt-1">Target to complete</p>
        </div>
        <div className="p-4 bg-muted/30 rounded-lg border">
          <p className="text-xs text-muted-foreground mb-1">Total Marks</p>
          <p className="text-2xl font-bold">{totalMarks}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {totalSubmittedAssignments > 0
              ? `Across ${totalSubmittedAssignments} submitted`
              : 'No submissions yet'}
          </p>
        </div>
        <div className="p-4 bg-muted/30 rounded-lg border">
          <p className="text-xs text-muted-foreground mb-1">Average Marks</p>
          <p className="text-2xl font-bold text-primary">{avgMarksFormatted}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {totalSubmittedAssignments > 0
              ? `Based on ${totalSubmittedAssignments} submitted`
              : 'No submissions yet'}
          </p>
        </div>
      </div>
    </div>
  );
}
