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

    // Get query params for pagination
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Get failing students (At Risk or Behind) and total count in parallel
    const [students, totalCount] = await Promise.all([
      Student.find({
        ownerId: userId,
        currentStatus: { $in: ['Behind', 'At Risk'] },
      })
        .select('_id name email phone currentStatus lastCompletedAssignment')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Student.countDocuments({
        ownerId: userId,
        currentStatus: { $in: ['Behind', 'At Risk'] },
      }),
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
