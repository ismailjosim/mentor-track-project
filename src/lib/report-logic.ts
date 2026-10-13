/* eslint-disable @typescript-eslint/no-explicit-any */
import mongoose from 'mongoose';
import Student from '@/models/Student';
import CallLog from '@/models/CallLog';
import {
  format,
  subWeeks,
  subMonths,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
} from 'date-fns';

export type ReportSection =
  'assignmentSubmission' | 'callRounds' | 'assignmentWiseCalls' | 'summary' | 'callHistory';

const ASSIGNMENT_KEYS = Array.from({ length: 10 }, (_, i) => `A-${String(i + 1).padStart(2, '0')}`);

function buildCohortFilter(ownerId: string, cohort?: string) {
  const filter: any = { ownerId };
  if (cohort && cohort !== 'all') {
    const cleaned = cohort.trim().replace(/[^\d]/g, '');
    if (cleaned) {
      filter.$or = [
        { cohort },
        { cohort: cleaned },
        { cohort: new RegExp(`^.*${cleaned}.*$`, 'i') },
      ];
    } else {
      filter.cohort = cohort;
    }
  }
  return filter;
}

async function getCohortStudentIds(ownerId: string, cohort?: string) {
  const filter = buildCohortFilter(ownerId, cohort);
  const students = await Student.find(filter).select('_id').lean();
  const stringIds = students.map((s: any) => String(s._id));
  const objectIds = stringIds
    .filter((id) => mongoose.Types.ObjectId.isValid(id))
    .map((id) => new mongoose.Types.ObjectId(id));

  return {
    stringIds,
    allIds: [...objectIds, ...stringIds],
  };
}

/**
 * 1) Assignment submission report
 * How many students have submitted each assignment (A-01..A-10)
 */
export async function getAssignmentSubmissionReport(ownerId: string, cohort?: string) {
  const studentMatch = buildCohortFilter(ownerId, cohort);
  const rows: any[] = [];

  for (let i = 1; i <= 10; i++) {
    const result = await Student.aggregate([
      { $match: studentMatch },
      { $unwind: '$assignments' },
      { $match: { 'assignments.assignmentNumber': i } },
      {
        $group: {
          _id: null,
          submitted: {
            $sum: {
              $cond: [
                {
                  $or: [
                    { $in: ['$assignments.status', ['SUBMITTED', 'COMPLETED']] },
                    { $gt: ['$assignments.marks', null] },
                  ],
                },
                1,
                0,
              ],
            },
          },
          completed: {
            $sum: { $cond: [{ $eq: ['$assignments.status', 'COMPLETED'] }, 1, 0] },
          },
          graded: {
            $sum: { $cond: [{ $gt: ['$assignments.marks', 0] }, 1, 0] },
          },
          pendingOrZero: {
            $sum: {
              $cond: [
                {
                  $and: [
                    {
                      $or: [
                        { $in: ['$assignments.status', ['SUBMITTED', 'COMPLETED']] },
                        { $gt: ['$assignments.marks', null] },
                      ],
                    },
                    {
                      $or: [
                        { $lte: ['$assignments.marks', 0] },
                        { $eq: ['$assignments.marks', null] },
                      ],
                    },
                  ],
                },
                1,
                0,
              ],
            },
          },
          fullMarks: {
            $sum: {
              $cond: [
                {
                  $gte: ['$assignments.marks', { $ifNull: ['$assignments.maxMarks', 60] }],
                },
                1,
                0,
              ],
            },
          },
          above50: {
            $sum: {
              $cond: [
                {
                  $gt: [
                    '$assignments.marks',
                    { $multiply: [{ $ifNull: ['$assignments.maxMarks', 60] }, 0.5] },
                  ],
                },
                1,
                0,
              ],
            },
          },
          totalMarks: {
            $sum: {
              $cond: [{ $gt: ['$assignments.marks', 0] }, '$assignments.marks', 0],
            },
          },
        },
      },
    ]);

    const stat = result[0] || {
      submitted: 0,
      completed: 0,
      graded: 0,
      pendingOrZero: 0,
      fullMarks: 0,
      above50: 0,
      totalMarks: 0,
    };

    const avgMarks = stat.graded > 0 ? Number((stat.totalMarks / stat.graded).toFixed(1)) : null;

    rows.push({
      assignmentNumber: i,
      assignmentKey: `A-${String(i).padStart(2, '0')}`,
      submitted: stat.submitted,
      completed: stat.completed,
      graded: stat.graded,
      pendingOrZero: stat.pendingOrZero,
      fullMarks: stat.fullMarks,
      above50: stat.above50,
      avgMarks,
    });
  }

  const totalStudents = await Student.countDocuments(studentMatch);

  const withDiff = rows.map((row, index) => {
    const submissionRate = totalStudents > 0 ? (row.submitted / totalStudents) * 100 : 0;
    const fullMarksRate = row.submitted > 0 ? (row.fullMarks / row.submitted) * 100 : 0;
    const above50Rate = row.submitted > 0 ? (row.above50 / row.submitted) * 100 : 0;
    const pendingOrZeroRate = row.submitted > 0 ? (row.pendingOrZero / row.submitted) * 100 : 0;
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
      fullMarksRate: Number(fullMarksRate.toFixed(1)),
      above50Rate: Number(above50Rate.toFixed(1)),
      pendingOrZeroRate: Number(pendingOrZeroRate.toFixed(1)),
      pointDiffVsPrevious: pointDiff,
      relativeChangePercentVsPrevious: relativeChangePercent,
    };
  });

  return { assignments: withDiff, totalStudents };
}

/**
 * 2) Call rounds report
 * A "round" is complete once every student in the considered group has
 * received at least that many calls.
 */
export async function getCallRoundsReport(
  ownerId: string,
  onlyMentorshipGroup = false,
  cohort?: string
) {
  const studentFilter: any = buildCohortFilter(ownerId, cohort);
  if (onlyMentorshipGroup) studentFilter.mentorshipJoiningStatus = true;

  const students = await Student.find(studentFilter).select('_id').lean();
  const studentIds = students.map((s: any) => String(s._id));

  if (studentIds.length === 0) {
    return {
      totalStudents: 0,
      completedRounds: 0,
      studentsNeverCalled: 0,
      averageCallsPerStudent: 0,
      distribution: [],
      onlyMentorshipGroup,
    };
  }

  const objectIds = studentIds
    .filter((id) => mongoose.Types.ObjectId.isValid(id))
    .map((id) => new mongoose.Types.ObjectId(id));
  const allTargetIds = [...objectIds, ...studentIds];

  const callCounts = await CallLog.aggregate([
    { $match: { ownerId, studentId: { $in: allTargetIds } } },
    { $group: { _id: { $toString: '$studentId' }, count: { $sum: 1 } } },
  ]);

  const countByStudent = new Map<string, number>();
  callCounts.forEach((item: any) => countByStudent.set(String(item._id), item.count));

  const counts = studentIds.map((id) => countByStudent.get(id) || 0);
  const completedRounds = Math.min(...counts);
  const studentsNeverCalled = counts.filter((c) => c === 0).length;
  const maxCalls = Math.max(...counts, 0);

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
 */
export async function getAssignmentWiseCallReport(ownerId: string, cohort?: string) {
  const matchFilter: any = { ownerId };

  if (cohort && cohort !== 'all') {
    const { allIds } = await getCohortStudentIds(ownerId, cohort);
    matchFilter.studentId = { $in: allIds };
  }

  const grouped = await CallLog.aggregate([
    { $match: matchFilter },
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
 * Headline counts: total students, mentorship-group joins (joined vs not joined),
 * students who completed all assignments, and submissions per assignment.
 */
export async function getCohortSummaryReport(
  ownerId: string,
  assignmentNumbers: number[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  cohort?: string
) {
  const studentMatch = buildCohortFilter(ownerId, cohort);

  const [totalStudents, joinedMentorship, completedAll] = await Promise.all([
    Student.countDocuments(studentMatch),
    Student.countDocuments({ ...studentMatch, mentorshipJoiningStatus: true }),
    Student.countDocuments({ ...studentMatch, lastCompletedAssignment: 'A-10' }),
  ]);

  const perAssignment = await Promise.all(
    assignmentNumbers.map(async (num) => {
      const result = await Student.aggregate([
        { $match: studentMatch },
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
    notJoinedMentorship: Math.max(0, totalStudents - joinedMentorship),
    completedAllAssignments: completedAll,
    perAssignment,
  };
}

/**
 * 5) Call history weekly and monthly report
 */
export async function getCallHistoryReport(ownerId: string, cohort?: string) {
  const callFilter: any = { ownerId };

  if (cohort && cohort !== 'all') {
    const { allIds } = await getCohortStudentIds(ownerId, cohort);
    callFilter.studentId = { $in: allIds };
  }

  const now = new Date();

  // Weekly buckets (Last 8 weeks)
  const weeklyBuckets: { label: string; start: Date; end: Date }[] = [];
  for (let i = 7; i >= 0; i--) {
    const targetDate = subWeeks(now, i);
    const wStart = startOfWeek(targetDate, { weekStartsOn: 1 });
    const wEnd = endOfWeek(targetDate, { weekStartsOn: 1 });
    weeklyBuckets.push({
      label: `${format(wStart, 'MMM d')} - ${format(wEnd, 'MMM d')}`,
      start: wStart,
      end: wEnd,
    });
  }

  // Monthly buckets (Last 6 months)
  const monthlyBuckets: { label: string; start: Date; end: Date }[] = [];
  for (let i = 5; i >= 0; i--) {
    const targetDate = subMonths(now, i);
    monthlyBuckets.push({
      label: format(targetDate, 'MMM yyyy'),
      start: startOfMonth(targetDate),
      end: endOfMonth(targetDate),
    });
  }

  // Fetch all logs in range or for cohort
  const earliestDate =
    weeklyBuckets[0].start < monthlyBuckets[0].start
      ? weeklyBuckets[0].start
      : monthlyBuckets[0].start;

  const logs = await CallLog.find({
    ...callFilter,
    date: { $gte: earliestDate },
  })
    .select('date status studentId')
    .lean();

  const processBuckets = (buckets: { label: string; start: Date; end: Date }[]) => {
    return buckets.map((bucket) => {
      const matched = logs.filter((l) => {
        const time = new Date(l.date).getTime();
        return time >= bucket.start.getTime() && time <= bucket.end.getTime();
      });

      const total = matched.length;
      const received = matched.filter((l: any) => l.status === 'RECEIVED').length;
      const notReceived = total - received;
      const successRate = total > 0 ? Math.round((received / total) * 100) : 0;

      return {
        label: bucket.label,
        total,
        received,
        notReceived,
        successRate,
      };
    });
  };

  const weekly = processBuckets(weeklyBuckets);
  const monthly = processBuckets(monthlyBuckets);

  // Overall summary for cohort
  const allCohortLogs = await CallLog.find(callFilter).select('status studentId').lean();
  const totalCalls = allCohortLogs.length;
  const receivedCalls = allCohortLogs.filter((l: any) => l.status === 'RECEIVED').length;
  const notReceivedCalls = totalCalls - receivedCalls;
  const receivedRate = totalCalls > 0 ? Math.round((receivedCalls / totalCalls) * 100) : 0;
  const uniqueStudentsCalled = new Set(
    allCohortLogs.map((l: any) => String(l.studentId)).filter((id) => id && id !== 'undefined')
  ).size;

  return {
    summary: {
      totalCalls,
      receivedCalls,
      notReceivedCalls,
      receivedRate,
      uniqueStudentsCalled,
    },
    weekly,
    monthly,
  };
}

/**
 * Build the requested subset of the report in one call.
 */
export async function generateReport(
  ownerId: string,
  sections: ReportSection[],
  options: { onlyMentorshipGroup?: boolean; cohort?: string } = {}
) {
  const result: Record<string, unknown> = {};
  const { onlyMentorshipGroup, cohort } = options;

  await Promise.all(
    sections.map(async (section) => {
      switch (section) {
        case 'assignmentSubmission':
          result.assignmentSubmission = await getAssignmentSubmissionReport(ownerId, cohort);
          break;
        case 'callRounds':
          result.callRounds = await getCallRoundsReport(ownerId, onlyMentorshipGroup, cohort);
          break;
        case 'assignmentWiseCalls':
          result.assignmentWiseCalls = await getAssignmentWiseCallReport(ownerId, cohort);
          break;
        case 'summary':
          result.summary = await getCohortSummaryReport(
            ownerId,
            [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
            cohort
          );
          break;
        case 'callHistory':
          result.callHistory = await getCallHistoryReport(ownerId, cohort);
          break;
      }
    })
  );

  return result;
}
