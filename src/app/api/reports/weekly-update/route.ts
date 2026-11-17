import { connectDB } from '@/lib/mongodb';
import { createResponse, handleDbError, logger } from '@/lib/utils';
import { getWeeklyUpdateReport } from '@/lib/report-logic';
import { requireCurrentUserId } from '@/lib/auth-utils';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const authResult = await requireCurrentUserId();
    if (authResult.response) return authResult.response;

    const { searchParams } = new URL(request.url);
    const assignmentParam = Number(searchParams.get('currentAssignment') || 8);
    if (!Number.isInteger(assignmentParam) || assignmentParam < 1 || assignmentParam > 10) {
      return NextResponse.json(createResponse(400, 'Current assignment must be between 1 and 10'), {
        status: 400,
      });
    }

    const cohort = searchParams.get('cohort') || undefined;
    const report = await getWeeklyUpdateReport(authResult.userId, cohort, assignmentParam);
    logger.info('GET /api/reports/weekly-update', { cohort, currentAssignment: assignmentParam });
    return NextResponse.json(
      createResponse(200, 'Weekly update report generated successfully', report)
    );
  } catch (error) {
    logger.error('GET /api/reports/weekly-update failed', error);
    const errorData = handleDbError(error);
    return NextResponse.json(
      createResponse(errorData.statusCode, errorData.message, undefined, errorData.errors),
      { status: errorData.statusCode }
    );
  }
}
