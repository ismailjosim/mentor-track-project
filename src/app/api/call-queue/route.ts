/* eslint-disable @typescript-eslint/no-explicit-any */

import { connectDB } from '@/lib/mongodb';
import { createResponse, handleDbError, getPaginationParams } from '@/lib/utils';
import { getCallQueue } from '@/lib/follow-up-logic';
import { requireCurrentUserId } from '@/lib/auth-utils';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/call-queue
 * Get auto-generated list of students who need calling
 * Priority: At Risk students > Behind students. Follow-up dates are metadata only.
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const authResult = await requireCurrentUserId();
    if (authResult.response) return authResult.response;
    const userId = authResult.userId;

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const page = parseInt(searchParams.get('page') || '1');
    const rawCohort = searchParams.get('cohort');
    const selectedCohort =
      rawCohort && rawCohort !== 'all' ? rawCohort.trim().replace(/[^\d]/g, '') : undefined;

    const { skip } = getPaginationParams(page, limit);

    // Get the full generated queue for this cohort so pagination metadata stays accurate.
    const queue = await getCallQueue(0, userId, selectedCohort);

    // Apply pagination
    const paginatedQueue = queue.slice(skip, skip + limit);
    const total = queue.length;
    const pages = Math.ceil(total / limit);

    const response = createResponse(200, 'Call queue generated successfully', {
      data: paginatedQueue,
      stats: {
        total,
        highPriority: queue.filter((q: any) => q.priority === 'high').length,
        normalPriority: queue.filter((q: any) => q.priority === 'normal').length,
      },
      pagination: { page, limit, total, pages },
    });

    return NextResponse.json(response);
  } catch (error) {
    const errorData = handleDbError(error);
    return NextResponse.json(
      createResponse(errorData.statusCode, errorData.message, undefined, errorData.errors),
      { status: errorData.statusCode }
    );
  }
}
