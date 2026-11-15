export function calculateWeeklyAssignmentChange(
  submitted: number,
  newSubmissions: number,
  totalStudents: number
) {
  const previousSubmitted = Math.max(0, submitted - newSubmissions);

  return {
    previousSubmitted,
    newSubmissions,
    relativeChangePercent:
      previousSubmitted > 0
        ? Number(((newSubmissions / previousSubmitted) * 100).toFixed(1))
        : null,
    cohortIncreasePercent:
      totalStudents > 0 ? Number(((newSubmissions / totalStudents) * 100).toFixed(1)) : 0,
  };
}

export function getTopCallIssues(logs: { issues?: string; studentId: string }[], limit = 3) {
  const grouped = new Map<string, { issue: string; calls: number; studentIds: Set<string> }>();

  for (const log of logs) {
    const issue = log.issues?.trim().replace(/\s+/g, ' ');
    if (!issue) continue;

    const key = issue.toLocaleLowerCase();
    const entry = grouped.get(key) || { issue, calls: 0, studentIds: new Set<string>() };
    entry.calls += 1;
    entry.studentIds.add(log.studentId);
    grouped.set(key, entry);
  }

  return Array.from(grouped.values())
    .map(({ issue, calls, studentIds }) => ({ issue, calls, students: studentIds.size }))
    .sort((a, b) => b.calls - a.calls || b.students - a.students || a.issue.localeCompare(b.issue))
    .slice(0, limit);
}
