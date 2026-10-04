/* eslint-disable @typescript-eslint/no-explicit-any */
import { connectDB } from '@/lib/mongodb';
import {
  createResponse,
  handleDbError,
  handleZodError,
  isValidObjectId,
  logger,
  sanitizeInput,
} from '@/lib/utils';
import { StudentUpdateSchema } from '@/lib/validators';
import Student from '@/models/Student';
import CallLog from '@/models/CallLog';
import FollowUp from '@/models/FollowUp';
import { revalidateCacheTags } from '@/lib/server-cache';
import { CACHE_INVALIDATION_TRIGGERS } from '@/lib/cache';
import { requireCurrentUserId } from '@/lib/auth-utils';
import { NextRequest, NextResponse } from 'next/server';

import { getStudentById } from '@/services/student.service';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await requireCurrentUserId();
    if (authResult.response) return authResult.response;
    const userId = authResult.userId;
    const { id } = await params;

    const result = await getStudentById(id, userId);
    if (!result.success) {
      const statusCode =
        result.error === 'Student not found'
          ? 404
          : result.error === 'Invalid student ID format'
            ? 400
            : 500;
      return NextResponse.json(
        createResponse(statusCode, result.error || 'Failed to fetch student'),
        { status: statusCode }
      );
    }

    logger.info('GET /api/students/[id] - Success', { id });
    return NextResponse.json(createResponse(200, 'Student fetched successfully', result.data));
  } catch (error) {
    logger.error('GET /api/students/[id] - Failed', error);
    const errorData = handleDbError(error);
    return NextResponse.json(
      createResponse(errorData.statusCode, errorData.message, undefined, errorData.errors),
      { status: errorData.statusCode }
    );
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const authResult = await requireCurrentUserId();
    if (authResult.response) return authResult.response;
    const userId = authResult.userId;

    const { id } = await params;

    // Validate ObjectId format
    if (!isValidObjectId(id)) {
      logger.info('PUT /api/students/[id] - Invalid ObjectId', { id });
      return NextResponse.json(createResponse(400, 'Invalid student ID format'), { status: 400 });
    }

    const body = await request.json();

    // Prevent updating immutable fields
    const { ...updateData } = body;

    const sanitizedData = sanitizeInput(updateData);
    const validatedData = StudentUpdateSchema.parse(sanitizedData);

    const student = await Student.findOneAndUpdate({ _id: id, ownerId: userId }, validatedData, {
      new: true,
      runValidators: true,
    });

    if (!student) {
      logger.info('PUT /api/students/[id] - Not found', { id });
      return NextResponse.json(createResponse(404, 'Student not found'), { status: 404 });
    }

    // Invalidate student-related caches
    revalidateCacheTags(CACHE_INVALIDATION_TRIGGERS.updateStudent);

    logger.info('PUT /api/students/[id] - Success', { id });
    const response = createResponse(200, 'Student updated successfully', student);
    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      const errorData = handleZodError(error as any);
      return NextResponse.json(
        createResponse(errorData.statusCode, errorData.message, undefined, errorData.errors),
        { status: errorData.statusCode }
      );
    }

    logger.error('PUT /api/students/[id] - Failed', error);
    const errorData = handleDbError(error);
    return NextResponse.json(
      createResponse(errorData.statusCode, errorData.message, undefined, errorData.errors),
      { status: errorData.statusCode }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const authResult = await requireCurrentUserId();
    if (authResult.response) return authResult.response;
    const userId = authResult.userId;
    const { id } = await params;

    // Validate ObjectId format
    if (!isValidObjectId(id)) {
      logger.info('DELETE /api/students/[id] - Invalid ObjectId', { id });
      return NextResponse.json(createResponse(400, 'Invalid student ID format'), { status: 400 });
    }

    const student = await Student.findOneAndDelete({ _id: id, ownerId: userId });

    if (!student) {
      logger.info('DELETE /api/students/[id] - Not found', { id });
      return NextResponse.json(createResponse(404, 'Student not found'), { status: 404 });
    }

    // Cascade delete related documents
    await Promise.all([
      CallLog.deleteMany({ studentId: id, ownerId: userId }),
      FollowUp.deleteMany({ studentId: id, ownerId: userId }),
    ]);

    // Invalidate student-related caches
    revalidateCacheTags(CACHE_INVALIDATION_TRIGGERS.updateStudent);

    logger.info('DELETE /api/students/[id] - Success', { id });
    const response = createResponse(200, 'Student deleted successfully', student);
    return NextResponse.json(response);
  } catch (error) {
    logger.error('DELETE /api/students/[id] - Failed', error);
    const errorData = handleDbError(error);
    return NextResponse.json(
      createResponse(errorData.statusCode, errorData.message, undefined, errorData.errors),
      { status: errorData.statusCode }
    );
  }
}
