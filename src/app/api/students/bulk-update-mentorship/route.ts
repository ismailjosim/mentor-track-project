/* eslint-disable @typescript-eslint/no-explicit-any */

import { connectDB } from '@/lib/mongodb';
import { createResponse, handleDbError, handleZodError, logger } from '@/lib/utils';
import Student from '@/models/Student';
import { requireCurrentUserId } from '@/lib/auth-utils';
import { revalidateCacheTags } from '@/lib/server-cache';
import { CACHE_INVALIDATION_TRIGGERS } from '@/lib/cache';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Validation schema for mentorship bulk update
const MentorshipBulkUpdateSchema = z.object({
  emails: z
    .array(z.string().min(1, 'Email cannot be empty'))
    .min(1, 'At least one email is required'),
  mentorshipJoiningStatus: z.boolean(),
});

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const authResult = await requireCurrentUserId();
    if (authResult.response) return authResult.response;
    const userId = authResult.userId;

    const body = await request.json();
    const validatedData = MentorshipBulkUpdateSchema.parse(body);

    const { emails, mentorshipJoiningStatus } = validatedData;

    // Normalize and filter valid email strings (ignoring non-email header rows)
    const normalizedEmails = Array.from(
      new Set(
        emails
          .map((email) => email.toLowerCase().trim())
          .filter((email) => Boolean(email) && email.includes('@'))
      )
    );

    if (normalizedEmails.length === 0) {
      return NextResponse.json(
        createResponse(400, 'No valid email addresses found in the provided list'),
        { status: 400 }
      );
    }

    // Find all matching students
    const students = await Student.find({
      ownerId: userId,
      email: { $in: normalizedEmails },
    })
      .select('_id email name')
      .lean();

    const matchedEmails = new Set(students.map((s: any) => s.email.toLowerCase()));
    const unmatchedEmails: string[] = normalizedEmails.filter((email) => !matchedEmails.has(email));

    const matchedStudents = students.map((s: any) => ({
      email: s.email,
      name: s.name,
      id: s._id.toString(),
    }));

    // Update students in a single database round-trip via updateMany
    let updatedCount = 0;
    if (students.length > 0) {
      const studentIds = students.map((s: any) => s._id);
      const updateResult = await Student.updateMany(
        { _id: { $in: studentIds }, ownerId: userId },
        { $set: { mentorshipJoiningStatus } }
      );
      updatedCount = updateResult.modifiedCount || updateResult.matchedCount || studentIds.length;
      revalidateCacheTags(CACHE_INVALIDATION_TRIGGERS.updateStudent);
    }

    logger.info('POST /api/students/bulk-update-mentorship', {
      mentorshipJoiningStatus,
      matched: matchedStudents.length,
      unmatched: unmatchedEmails.length,
      updated: updatedCount,
    });

    const response = createResponse(200, 'Mentorship status updated successfully', {
      matched: matchedStudents,
      unmatched: unmatchedEmails,
      stats: {
        matched: matchedStudents.length,
        unmatched: unmatchedEmails.length,
        updated: updatedCount,
        total: emails.length,
      },
    });

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorData = handleZodError(error);
      return NextResponse.json(
        createResponse(errorData.statusCode, errorData.message, undefined, errorData.errors),
        { status: errorData.statusCode }
      );
    }

    logger.error('POST /api/students/bulk-update-mentorship failed', error);
    const errorData = handleDbError(error);
    return NextResponse.json(
      createResponse(errorData.statusCode, errorData.message, undefined, errorData.errors),
      { status: errorData.statusCode }
    );
  }
}
