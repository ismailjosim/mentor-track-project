import { connectDB } from '@/lib/mongodb';
import { createResponse, handleDbError, logger } from '@/lib/utils';
import { generateReport, ReportSection } from '@/lib/report-logic';
import { requireCurrentUserId, getCurrentSession, isSuperAdminEmail } from '@/lib/auth-utils';
import Student from '@/models/Student';
import { NextRequest, NextResponse } from 'next/server';

const VALID_SECTIONS: ReportSection[] = [
  'assignmentSubmission',
  'callRounds',
  'assignmentWiseCalls',
  'summary',
  'callHistory',
];

/**
 * GET /api/reports?sections=assignmentSubmission,callRounds,assignmentWiseCalls,summary,callHistory&cohort=14&onlyMentorshipGroup=false
 * Generates the requested report sections for the authenticated user's cohort/batch.
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const authResult = await requireCurrentUserId();
    if (authResult.response) return authResult.response;
    const userId = authResult.userId;

    const { searchParams } = new URL(request.url);
    const sectionsParam = searchParams.get('sections');
    const onlyMentorshipGroup = searchParams.get('onlyMentorshipGroup') === 'true';
    const cohort = searchParams.get('cohort') || undefined;

    const session = await getCurrentSession();
    const isSuperAdmin = session?.user && isSuperAdminEmail(session.user.email);
    let effectiveUserId: string | undefined = userId;
    if (isSuperAdmin) {
      const ownCount = await Student.countDocuments({ ownerId: userId });
      if (ownCount === 0) {
        effectiveUserId = undefined;
      }
    }

    const requestedSections = sectionsParam
      ? sectionsParam
          .split(',')
          .map((s) => s.trim())
          .filter((s): s is ReportSection => VALID_SECTIONS.includes(s as ReportSection))
      : VALID_SECTIONS;

    if (requestedSections.length === 0) {
      return NextResponse.json(
        createResponse(400, 'No valid report sections were requested', undefined, [
          { message: `sections must include one of: ${VALID_SECTIONS.join(', ')}` },
        ]),
        { status: 400 }
      );
    }

    const cohortOwnerFilter = effectiveUserId ? { ownerId: effectiveUserId } : {};
    const [report, distinctCohorts] = await Promise.all([
      generateReport(effectiveUserId, requestedSections, {
        onlyMentorshipGroup,
        cohort,
      }),
      Student.distinct('cohort', cohortOwnerFilter),
    ]);

    const availableCohorts = Array.from(
      new Set([...distinctCohorts.filter(Boolean).map(String), '13', '14'])
    ).sort((a, b) => Number(a) - Number(b));

    logger.info('GET /api/reports', { sections: requestedSections, cohort });

    const response = createResponse(200, 'Report generated successfully', {
      generatedAt: new Date().toISOString(),
      sections: requestedSections,
      selectedCohort: cohort || 'all',
      availableCohorts,
      ...report,
    });
    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    logger.error('GET /api/reports failed', error);
    const errorData = handleDbError(error);
    return NextResponse.json(
      createResponse(errorData.statusCode, errorData.message, undefined, errorData.errors),
      { status: errorData.statusCode }
    );
  }
}
