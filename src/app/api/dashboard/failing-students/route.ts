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

    // Get query params for pagination and cohort
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const rawCohort = searchParams.get('cohort');
    const selectedCohort =
      rawCohort && rawCohort !== 'all' ? rawCohort.trim().replace(/[^\d]/g, '') : null;
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = {
      ownerId: userId,
      currentStatus: { $in: ['Behind', 'At Risk'] },
    };
    if (selectedCohort) {
      filter.cohort = selectedCohort;
    }

    // Get failing students (At Risk or Behind) and total count in parallel
    const [students, totalCount] = await Promise.all([
      Student.find(filter)
        .select('_id name email phone cohort currentStatus lastCompletedAssignment')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Student.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json(
      createResponse(200, 'Failing students fetched successfully', {
        data: students,
        count: students.length,
        total: totalCount,
        page,
        totalPages,
      })
    );
  } catch (error) {
    const errorData = handleDbError(error);
    return NextResponse.json(createResponse(errorData.statusCode, errorData.message), {
      status: errorData.statusCode,
    });
  }
}
