/* eslint-disable @typescript-eslint/no-explicit-any */
import { connectDB } from '@/lib/mongodb';
import { createResponse, handleDbError, logger } from '@/lib/utils';
import Student from '@/models/Student';
import { requireCurrentUserId } from '@/lib/auth-utils';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const authResult = await requireCurrentUserId();
    if (authResult.response) return authResult.response;
    const userId = authResult.userId;

    const body = await request.json();
    const { emails, items } = body;

    let normalizedItems: Array<{ email: string; marks?: number | null; name?: string }> = [];

    if (Array.isArray(items) && items.length > 0) {
      normalizedItems = items
        .filter((it: any) => it && typeof it.email === 'string')
        .map((it: any) => ({
          email: it.email.trim().toLowerCase(),
          marks: typeof it.marks === 'number' ? it.marks : undefined,
          name: typeof it.name === 'string' ? it.name.trim() : undefined,
        }));
    } else if (Array.isArray(emails) && emails.length > 0) {
      normalizedItems = emails
        .filter((e: any) => typeof e === 'string' && e.trim().length > 0)
        .map((e: string) => ({ email: e.trim().toLowerCase() }));
    } else {
      return NextResponse.json(createResponse(400, 'Either items or emails array is required'), {
        status: 400,
      });
    }

    if (normalizedItems.length === 0) {
      return NextResponse.json(createResponse(400, 'No valid emails provided'), { status: 400 });
    }

    const itemMap = new Map<string, { email: string; marks?: number | null; name?: string }>();
    for (const item of normalizedItems) {
      itemMap.set(item.email, item);
    }

    const uniqueEmails = Array.from(itemMap.keys());

    // Find students by email
    const students = await Student.find({
      ownerId: userId,
      email: { $in: uniqueEmails },
    }).select('_id email name cohort');

    const matchedMap = new Map(students.map((s: any) => [s.email.toLowerCase(), s]));
    const matchedStudents: any[] = [];
    const unmatchedEmails: string[] = [];

    for (const email of uniqueEmails) {
      const student = matchedMap.get(email);
      const item = itemMap.get(email);

      if (student) {
        const hasMarks = item?.marks !== undefined && item?.marks !== null;
        const isCompleted = hasMarks && (item.marks as number) > 0;
        matchedStudents.push({
          studentId: student._id.toString(),
          email: student.email,
          name: student.name,
          cohort: student.cohort,
          sheetName: item?.name,
          marks: item?.marks,
          targetStatus: isCompleted ? 'COMPLETED' : 'SUBMITTED',
        });
      } else {
        unmatchedEmails.push(email);
      }
    }

    const withMarksCount = matchedStudents.filter((s) => s.targetStatus === 'COMPLETED').length;
    const pendingMarksCount = matchedStudents.length - withMarksCount;

    logger.info('POST /api/assignments/bulk-match', {
      totalEmails: uniqueEmails.length,
      matched: matchedStudents.length,
      unmatched: unmatchedEmails.length,
      withMarks: withMarksCount,
      pendingMarks: pendingMarksCount,
    });

    const response = createResponse(200, 'Emails matched successfully', {
      matched: matchedStudents,
      unmatched: unmatchedEmails,
      stats: {
        matched: matchedStudents.length,
        unmatched: unmatchedEmails.length,
        total: uniqueEmails.length,
        withMarks: withMarksCount,
        pendingMarks: pendingMarksCount,
      },
    });

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    logger.error('POST /api/assignments/bulk-match failed', error);
    const errorData = handleDbError(error);
    return NextResponse.json(
      createResponse(errorData.statusCode, errorData.message, undefined, errorData.errors),
      { status: errorData.statusCode }
    );
  }
}
