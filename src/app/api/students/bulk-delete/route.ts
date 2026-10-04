/* eslint-disable @typescript-eslint/no-explicit-any */
import { connectDB } from '@/lib/mongodb';
import { createResponse, handleDbError, handleZodError, logger } from '@/lib/utils';
import Student from '@/models/Student';
import CallLog from '@/models/CallLog';
import FollowUp from '@/models/FollowUp';
import Assignment from '@/models/Assignment';
import { revalidateCacheTags } from '@/lib/server-cache';
import { CACHE_INVALIDATION_TRIGGERS } from '@/lib/cache';
import { requireCurrentUserId } from '@/lib/auth-utils';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const BulkDeleteSchema = z.object({
  studentIds: z
    .array(z.string().min(1, 'Student ID is required'))
    .min(1, 'At least one student ID is required'),
});

export async function DELETE(request: NextRequest) {
  try {
    await connectDB();
    const authResult = await requireCurrentUserId();
    if (authResult.response) return authResult.response;
    const userId = authResult.userId;

    const body = await request.json();
    const validatedData = BulkDeleteSchema.parse(body);
    const { studentIds } = validatedData;

    // Only delete students that belong to the authenticated mentor
    const students = await Student.find({
      _id: { $in: studentIds },
      ownerId: userId,
    }).select('_id');

    if (students.length === 0) {
      return NextResponse.json(createResponse(404, 'No matching students found'), { status: 404 });
    }

    const validIds = students.map((s: any) => s._id);

    // Cascade delete: remove all related data for these students
    await Promise.all([
      Student.deleteMany({ _id: { $in: validIds }, ownerId: userId }),
      CallLog.deleteMany({ studentId: { $in: validIds }, ownerId: userId }),
      FollowUp.deleteMany({ studentId: { $in: validIds }, ownerId: userId }),
      Assignment.deleteMany({ studentId: { $in: validIds } }),
    ]);

    // Invalidate student-related caches
    revalidateCacheTags(CACHE_INVALIDATION_TRIGGERS.updateStudent);

    logger.info('DELETE /api/students/bulk-delete - Success', {
      requested: studentIds.length,
      deleted: validIds.length,
    });

    return NextResponse.json(
      createResponse(200, 'Students deleted successfully', {
        deleted: validIds.length,
        total: studentIds.length,
      }),
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      const errorData = handleZodError(error as any);
      return NextResponse.json(
        createResponse(errorData.statusCode, errorData.message, undefined, errorData.errors),
        { status: errorData.statusCode }
      );
    }

    logger.error('DELETE /api/students/bulk-delete failed', error);
    const errorData = handleDbError(error);
    return NextResponse.json(
      createResponse(errorData.statusCode, errorData.message, undefined, errorData.errors),
      { status: errorData.statusCode }
    );
  }
}
