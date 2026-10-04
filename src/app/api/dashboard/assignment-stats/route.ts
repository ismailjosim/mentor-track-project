import { connectDB } from '@/lib/mongodb';
import { createResponse, handleDbError } from '@/lib/utils';
import { requireCurrentUserId } from '@/lib/auth-utils';
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

    // Query total students and submitted assignment counts in a single aggregation pipeline concurrently
    const [totalStudents, assignmentAggResult] = await Promise.all([
      Student.countDocuments(baseFilter),
      Student.aggregate<{ _id: number; submittedCount: number }>([
        { $match: baseFilter },
        { $unwind: '$assignments' },
        {
          $match: {
            'assignments.status': { $in: ['SUBMITTED', 'COMPLETED'] },
            'assignments.assignmentNumber': { $gte: 1, $lte: 10 },
          },
        },
        {
          $group: {
            _id: '$assignments.assignmentNumber',
            submittedCount: { $sum: 1 },
          },
        },
      ]),
    ]);

    const countMap = new Map<number, number>(
      assignmentAggResult.map((item) => [item._id, item.submittedCount])
    );

    const stats = Array.from({ length: 10 }, (_, index) => {
      const assignmentNumber = index + 1;
      const submitted = countMap.get(assignmentNumber) || 0;
      const submissionRate = totalStudents > 0 ? Math.round((submitted / totalStudents) * 100) : 0;

      return {
        assignmentNumber,
        submitted,
        total: totalStudents,
        rate: submissionRate,
      };
    });

    return NextResponse.json(
      createResponse(200, 'Assignment stats fetched successfully', {
        stats,
        totalStudents,
      })
    );
  } catch (error) {
    const errorData = handleDbError(error);
    return NextResponse.json(createResponse(errorData.statusCode, errorData.message), {
      status: errorData.statusCode,
    });
  }
}
