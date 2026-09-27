/* eslint-disable @typescript-eslint/no-explicit-any */
import Student from '@/models/Student';
import CallLog from '@/models/CallLog';

export type ReportSection =
  'assignmentSubmission' | 'callRounds' | 'assignmentWiseCalls' | 'summary';

const ASSIGNMENT_KEYS = Array.from({ length: 10 }, (_, i) => `A-${String(i + 1).padStart(2, '0')}`);

/**
 * 1) Assignment submission report
 * How many students have submitted each assignment (A-01..A-10), plus the
 * percentage-point and relative change vs. the previous assignment so a big
 * drop-off (e.g. A-09: 39 students -> A-10: 20 students) is immediately visible.
 */
export async function getAssignmentSubmissionReport(ownerId: string) {
  const rows: any[] = [];

  for (let i = 1; i <= 10; i++) {
    const result = await Student.aggregate([
      { $match: { ownerId } },
      { $unwind: '$assignments' },
      { $match: { 'assignments.assignmentNumber': i } },
      {
        $group: {
          _id: null,
          submitted: {
            $sum: { $cond: [{ $in: ['$assignments.status', ['SUBMITTED', 'COMPLETED']] }, 1, 0] },
          },
          completed: {
            $sum: { $cond: [{ $eq: ['$assignments.status', 'COMPLETED'] }, 1, 0] },
          },
        },
      },
    ]);

    rows.push({
      assignmentNumber: i,
      assignmentKey: `A-${String(i).padStart(2, '0')}`,
      submitted: result[0]?.submitted || 0,
      completed: result[0]?.completed || 0,
    });
  }

  const totalStudents = await Student.countDocuments({ ownerId });

  const withDiff = rows.map((row, index) => {
    const submissionRate = totalStudents > 0 ? (row.submitted / totalStudents) * 100 : 0;
    const previous = index > 0 ? rows[index - 1] : null;

    let pointDiff: number | null = null;
    let relativeChangePercent: number | null = null;

    if (previous) {
      const previousRate = totalStudents > 0 ? (previous.submitted / totalStudents) * 100 : 0;
      pointDiff = Number((submissionRate - previousRate).toFixed(1));
      relativeChangePercent =
        previous.submitted > 0
          ? Number((((row.submitted - previous.submitted) / previous.submitted) * 100).toFixed(1))
          : null;
    }

    return {
      ...row,
      totalStudents,
      submissionRate: Number(submissionRate.toFixed(1)),
      pointDiffVsPrevious: pointDiff,
      relativeChangePercentVsPrevious: relativeChangePercent,
    };
  });

  return { assignments: withDiff, totalStudents };
}

/**
 * 2) Call rounds report
 * A "round" is complete once every student in the considered group has
 * received at least that many calls. E.g. if the lowest call-count among
 * students is 5, then 5 full rounds of calling have been completed.
 */
export async function getCallRoundsReport(ownerId: string, onlyMentorshipGroup = false) {
  const studentFilter: any = { ownerId };
  if (onlyMentorshipGroup) studentFilter.mentorshipJoiningStatus = true;

  const students = await Student.find(studentFilter).select('_id').lean();
  const studentIds = students.map((s: any) => String(s._id));

  if (studentIds.length === 0) {
    return {
      totalStudents: 0,
      completedRounds: 0,
      studentsNeverCalled: 0,
      distribution: [],
      onlyMentorshipGroup,
    };
  }

  const callCounts = await CallLog.aggregate([
    { $match: { ownerId, studentId: { $in: studentIds.map((id) => id) } } },
    { $group: { _id: '$studentId', count: { $sum: 1 } } },
  ]);

  const countByStudent = new Map<string, number>();
  callCounts.forEach((item: any) => countByStudent.set(String(item._id), item.count));

  const counts = studentIds.map((id) => countByStudent.get(id) || 0);
  const completedRounds = Math.min(...counts);
  const studentsNeverCalled = counts.filter((c) => c === 0).length;
  const maxCalls = Math.max(...counts);

  // Distribution: how many students have been called >= N times, for N = 1..maxCalls
  const distribution = Array.from({ length: maxCalls }, (_, i) => {
    const round = i + 1;
    const studentsReached = counts.filter((c) => c >= round).length;
    return {
      round,
      studentsReached,
      percentOfCohort: Number(((studentsReached / studentIds.length) * 100).toFixed(1)),
    };
  });

  return {
    totalStudents: studentIds.length,
    completedRounds,
    studentsNeverCalled,
    averageCallsPerStudent: Number(
      (counts.reduce((a, b) => a + b, 0) / studentIds.length).toFixed(1)
    ),
    distribution,
    onlyMentorshipGroup,
  };
}

/**
 * 3) Assignment-wise call volume report
 * Groups call logs by the assignment the student was working toward at the
 * time of the call (snapshotted as `assignmentContext` on the CallLog).
 * A call logged right after a student finished A-09 is tagged 'A-09' meaning
 * "this call happened while chasing the A-10 submission".
 */
export async function getAssignmentWiseCallReport(ownerId: string) {
  const grouped = await CallLog.aggregate([
    { $match: { ownerId } },
    {
      $group: {
        _id: { $ifNull: ['$assignmentContext', 'Unknown'] },
        callCount: { $sum: 1 },
      },
    },
  ]);

  const byContext = new Map<string, number>();
  grouped.forEach((item: any) => byContext.set(item._id, item.callCount));

  const untaggedCalls = byContext.get('Unknown') || 0;

  const rows = ['None', ...ASSIGNMENT_KEYS].map((key) => {
    const nextAssignment =
      key === 'None' ? 'A-01' : ASSIGNMENT_KEYS[ASSIGNMENT_KEYS.indexOf(key) + 1] || 'Completed';
    return {
      lastCompletedAtCallTime: key,
      pursuingAssignment: nextAssignment,
      callCount: byContext.get(key) || 0,
    };
  });

  return {
    rows,
    untaggedCalls,
    note:
      untaggedCalls > 0
        ? `${untaggedCalls} call(s) were logged before assignment-context tracking was enabled and are not attributable to a specific assignment.`
        : null,
  };
}

/**
 * 4) Cohort summary report
 * Headline counts: total students, mentorship-group joins, students who
 * completed all 10 assignments, and submission counts for a requested subset
 * of assignments (defaults to 6-10, the late-cohort assignments most often
 * used to gauge drop-off).
 */
export async function getCohortSummaryReport(
  ownerId: string,
  assignmentNumbers: number[] = [6, 7, 8, 9, 10]
) {
  const [totalStudents, joinedMentorship, completedAll] = await Promise.all([
    Student.countDocuments({ ownerId }),
    Student.countDocuments({ ownerId, mentorshipJoiningStatus: true }),
    Student.countDocuments({ ownerId, lastCompletedAssignment: 'A-10' }),
  ]);

  const perAssignment = await Promise.all(
    assignmentNumbers.map(async (num) => {
      const result = await Student.aggregate([
        { $match: { ownerId } },
        { $unwind: '$assignments' },
        {
          $match: {
            'assignments.assignmentNumber': num,
            'assignments.status': { $in: ['SUBMITTED', 'COMPLETED'] },
          },
        },
        { $count: 'submitted' },
      ]);

      return {
        assignmentNumber: num,
        assignmentKey: `A-${String(num).padStart(2, '0')}`,
        submitted: result[0]?.submitted || 0,
      };
    })
  );

  return {
    totalStudents,
    joinedMentorship,
    notJoinedMentorship: totalStudents - joinedMentorship,
    completedAllAssignments: completedAll,
    perAssignment,
  };
}

/**
 * Build the requested subset of the report in one call.
 */
export async function generateReport(
  ownerId: string,
  sections: ReportSection[],
  options: { onlyMentorshipGroup?: boolean } = {}
) {
  const result: Record<string, unknown> = {};

  await Promise.all(
    sections.map(async (section) => {
      switch (section) {
        case 'assignmentSubmission':
          result.assignmentSubmission = await getAssignmentSubmissionReport(ownerId);
          break;
        case 'callRounds':
          result.callRounds = await getCallRoundsReport(ownerId, options.onlyMentorshipGroup);
          break;
        case 'assignmentWiseCalls':
          result.assignmentWiseCalls = await getAssignmentWiseCallReport(ownerId);
          break;
        case 'summary':
          result.summary = await getCohortSummaryReport(ownerId);
          break;
      }
    })
  );

  return result;
}
