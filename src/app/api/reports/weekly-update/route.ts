import { connectDB } from '@/lib/mongodb';
import { createResponse, handleDbError, logger } from '@/lib/utils';
import { getWeeklyUpdateReport } from '@/lib/report-logic';
import { requireCurrentUserId, getCurrentSession, isSuperAdminEmail } from '@/lib/auth-utils';
import Student from '@/models/Student';
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
    const session = await getCurrentSession();
    const isSuperAdmin = session?.user && isSuperAdminEmail(session.user.email);
    let effectiveUserId: string | undefined = authResult.userId;
    if (isSuperAdmin) {
      const ownCount = await Student.countDocuments({ ownerId: authResult.userId });
      if (ownCount === 0) effectiveUserId = undefined;
    }

    const report = await getWeeklyUpdateReport(effectiveUserId, cohort, assignmentParam);
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
