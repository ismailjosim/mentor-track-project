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

    let normalizedItems: Array<{
      email: string;
      marks?: number | null;
      totalMarks?: 30 | 50 | 60 | null;
      name?: string;
      status?: 'COMPLETED' | 'SUBMITTED' | 'PENDING';
      submittedAt?: string;
      roll?: string;
    }> = [];

    if (Array.isArray(items) && items.length > 0) {
      normalizedItems = items
        .filter((it: any) => it && typeof it.email === 'string')
        .map((it: any) => {
          const rawTotal = it.totalMarks ?? it.tier ?? it.maxMarks;
          const parsedTotal =
            rawTotal === 30 || rawTotal === 50 || rawTotal === 60
              ? (rawTotal as 30 | 50 | 60)
              : undefined;
          return {
            email: it.email.trim().toLowerCase(),
            marks: typeof it.marks === 'number' ? it.marks : undefined,
            totalMarks: parsedTotal,
            name: typeof it.name === 'string' ? it.name.trim() : undefined,
            status: it.status as 'COMPLETED' | 'SUBMITTED' | 'PENDING' | undefined,
            submittedAt: typeof it.submittedAt === 'string' ? it.submittedAt.trim() : undefined,
            roll: typeof it.roll === 'string' ? it.roll.trim() : undefined,
          };
        });
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

    const itemMap = new Map<
      string,
      {
        email: string;
        marks?: number | null;
        totalMarks?: 30 | 50 | 60 | null;
        name?: string;
        status?: 'COMPLETED' | 'SUBMITTED' | 'PENDING';
        submittedAt?: string;
        roll?: string;
      }
    >();
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
        let targetStatus: 'COMPLETED' | 'SUBMITTED' | 'PENDING';
        if (item?.status) {
          targetStatus = item.status;
        } else {
          const hasMarks = item?.marks !== undefined && item?.marks !== null;
          const isCompleted = hasMarks && (item.marks as number) > 0;
          targetStatus = isCompleted ? 'COMPLETED' : 'SUBMITTED';
        }

        matchedStudents.push({
          studentId: student._id.toString(),
          email: student.email,
          name: student.name,
          cohort: student.cohort,
          sheetName: item?.name,
          marks: targetStatus === 'COMPLETED' ? item?.marks : undefined,
          totalMarks: item?.totalMarks,
          targetStatus,
          submittedAt: item?.submittedAt,
          roll: item?.roll,
        });
      } else {
        unmatchedEmails.push(email);
      }
    }

    const withMarksCount = matchedStudents.filter((s) => s.targetStatus === 'COMPLETED').length;
    const submittedCount = matchedStudents.filter((s) => s.targetStatus === 'SUBMITTED').length;
    const pendingCount = matchedStudents.filter((s) => s.targetStatus === 'PENDING').length;

    logger.info('POST /api/assignments/bulk-match', {
      totalEmails: uniqueEmails.length,
      matched: matchedStudents.length,
      unmatched: unmatchedEmails.length,
      withMarks: withMarksCount,
      submitted: submittedCount,
      pending: pendingCount,
    });

    const response = createResponse(200, 'Emails matched successfully', {
      matched: matchedStudents,
      unmatched: unmatchedEmails,
      stats: {
        matched: matchedStudents.length,
        unmatched: unmatchedEmails.length,
        total: uniqueEmails.length,
        withMarks: withMarksCount,
        pendingMarks: submittedCount,
        pendingCount: pendingCount,
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
