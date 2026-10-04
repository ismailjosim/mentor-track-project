import { connectDB } from '@/lib/mongodb';
import { createResponse, handleDbError } from '@/lib/utils';
import { requireCurrentUserId } from '@/lib/auth-utils';
import { getCallQueueCount } from '@/lib/follow-up-logic';
import Student from '@/models/Student';
import { NextRequest, NextResponse } from 'next/server';

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
      completedStudents,
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
      Student.countDocuments({
        ...baseFilter,
        currentStatus: 'Completed',
      }),
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
