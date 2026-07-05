import { connectDB } from '@/lib/mongodb';
import { createResponse, handleDbError, logger } from '@/lib/utils';
import { generateReport, ReportSection } from '@/lib/report-logic';
import { requireCurrentUserId } from '@/lib/auth-utils';
import { NextRequest, NextResponse } from 'next/server';

const VALID_SECTIONS: ReportSection[] = [
  'assignmentSubmission',
  'callRounds',
  'assignmentWiseCalls',
  'summary',
];

/**
 * GET /api/reports?sections=assignmentSubmission,callRounds,assignmentWiseCalls,summary&onlyMentorshipGroup=false
 * Generates the requested report sections for the authenticated user's cohort.
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

    const report = await generateReport(userId as string, requestedSections, {
      onlyMentorshipGroup,
    });

    logger.info('GET /api/reports', { sections: requestedSections });

    const response = createResponse(200, 'Report generated successfully', {
      generatedAt: new Date().toISOString(),
      sections: requestedSections,
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
