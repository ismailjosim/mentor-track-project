import { connectDB } from '@/lib/mongodb';
import { createResponse, handleDbError } from '@/lib/utils';
import { requireCurrentUserId } from '@/lib/auth-utils';
import { getCallQueueCount } from '@/lib/follow-up-logic';
import Student from '@/models/Student';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    await connectDB();
    const authResult = await requireCurrentUserId();
    if (authResult.response) return authResult.response;
    const userId = authResult.userId;

    // Get total students
    const totalStudents = await Student.countDocuments({ ownerId: userId });

    // Get at-risk students (Behind or At Risk status)
    const atRiskStudents = await Student.countDocuments({
      ownerId: userId,
      currentStatus: { $in: ['Behind', 'At Risk'] },
    });

    // Get students needing calls count
    const studentsNeedingCalls = await getCallQueueCount(userId);

    // Get on-track students
    const onTrackStudents = await Student.countDocuments({
      ownerId: userId,
      currentStatus: 'On Track',
    });

    // Get completed students
    const completedStudents = await Student.countDocuments({
      ownerId: userId,
      currentStatus: 'Completed',
    });

    // Get total and completed assignments from embedded arrays
    // Total possible assignments is students * 10 (10 assignments per student)
    const assignmentStats = await Student.aggregate([
      {
        $match: { ownerId: userId },
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
