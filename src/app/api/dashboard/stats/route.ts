import { connectDB } from '@/lib/mongodb';
import { createResponse, handleDbError } from '@/lib/utils';
import { requireCurrentUserId } from '@/lib/auth-utils';
import { getCallQueueCount } from '@/lib/follow-up-logic';
import Student from '@/models/Student';
import { Settings } from '@/models/Settings';
import { NextRequest, NextResponse } from 'next/server';

const parseAssignmentNumber = (assignment?: string | null) => {
  const value = Number.parseInt(assignment?.split('-')[1] || '1', 10);
  return Number.isNaN(value) ? 1 : value;
};

const isSubmitted = (status?: string) => status === 'SUBMITTED' || status === 'COMPLETED';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const authResult = await requireCurrentUserId();
    if (authResult.response) return authResult.response;
    const userId = authResult.userId;

    const { searchParams } = new URL(request.url);
    const rawCohort = searchParams.get('cohort');
    const selectedCohort =
      rawCohort && rawCohort !== 'all' ? rawCohort.trim().replace(/[^\d]/g, '') : null;

    const baseFilter: Record<string, unknown> = { ownerId: userId };
    if (selectedCohort) {
      baseFilter.cohort = selectedCohort;
    }

    // Query dashboard stats concurrently with Promise.all to eliminate sequential waterfall
    const [
      totalStudents,
      atRiskStudents,
      studentsNeedingCalls,
      onTrackStudents,
      settings,
      allStudentsWithAssignments,
      assignmentStats,
    ] = await Promise.all([
      Student.countDocuments(baseFilter),
      Student.countDocuments({
        ...baseFilter,
        currentStatus: { $in: ['Behind', 'At Risk'] },
      }),
      getCallQueueCount(userId, selectedCohort || undefined),
      Student.countDocuments({
        ...baseFilter,
        currentStatus: 'On Track',
      }),
      Settings.findOne({ ownerId: userId }).select('currentAssignment').lean(),
      Student.find(baseFilter).select('currentStatus assignments').lean(),
      Student.aggregate([
        {
          $match: baseFilter,
        },
        {
          $group: {
            _id: null,
            totalAssignmentsCreated: {
              $sum: { $size: { $ifNull: ['$assignments', []] } },
            },
            totalCompleted: {
              $sum: {
                $size: {
                  $filter: {
                    input: { $ifNull: ['$assignments', []] },
                    as: 'assignment',
                    cond: { $eq: ['$$assignment.status', 'COMPLETED'] },
                  },
                },
              },
            },
          },
        },
      ]),
    ]);

    const currentAssignmentNumber = parseAssignmentNumber(settings?.currentAssignment);
    const currentAssignmentLabel =
      settings?.currentAssignment || `A-${String(currentAssignmentNumber).padStart(2, '0')}`;

    interface StudentWithAssigns {
      currentStatus?: string;
      assignments?: { assignmentNumber?: number; status?: string }[];
    }

    // A student is completed if they finished all assignments up to currentAssignment
    const completedStudents = (allStudentsWithAssignments as StudentWithAssigns[]).filter(
      (student) => {
        if (student.currentStatus === 'Dropped') return false;
        if (student.currentStatus === 'Completed') return true;
        if (!currentAssignmentNumber || currentAssignmentNumber < 1) return false;
        for (let i = 1; i <= currentAssignmentNumber; i++) {
          const a = student.assignments?.find((item) => item.assignmentNumber === i);
          if (!a || !isSubmitted(a.status)) {
            return false;
          }
        }
        return true;
      }
    ).length;

    const totalAssignmentsCreated = assignmentStats[0]?.totalAssignmentsCreated || 0;
    const totalCompletedCount = assignmentStats[0]?.totalCompleted || 0;
    const averageProgress =
      totalAssignmentsCreated > 0
        ? Math.round((totalCompletedCount / totalAssignmentsCreated) * 100)
        : 0;

    return NextResponse.json(
      createResponse(200, 'Dashboard stats fetched successfully', {
        totalStudents,
        atRiskStudents,
        pendingFollowUps: studentsNeedingCalls,
        onTrackStudents,
        completedStudents,
        currentAssignment: currentAssignmentLabel,
        averageProgress,
        totalAssignments: totalAssignmentsCreated,
        completedAssignments: totalCompletedCount,
      })
    );
  } catch (error) {
    const errorData = handleDbError(error);
    return NextResponse.json(createResponse(errorData.statusCode, errorData.message), {
      status: errorData.statusCode,
    });
  }
}
