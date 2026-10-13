/* eslint-disable @typescript-eslint/no-explicit-any */

import { connectDB } from '@/lib/mongodb';
import { createResponse, handleDbError, handleZodError, getPaginationParams } from '@/lib/utils';
import { CallLogCreateSchema } from '@/lib/validators';
import { autoCreateFollowUp, resolveOpenFollowUpsAfterCall } from '@/lib/follow-up-logic';
import CallLog from '@/models/CallLog';
import Student from '@/models/Student';
import { revalidateCacheTags } from '@/lib/server-cache';
import { CACHE_INVALIDATION_TRIGGERS } from '@/lib/cache';
import { requireCurrentUserId } from '@/lib/auth-utils';
import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';

/**
 * GET /api/students/[id]/call-logs
 * Get all call logs for a specific student
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const authResult = await requireCurrentUserId();
    if (authResult.response) return authResult.response;
    const userId = authResult.userId;
    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(createResponse(400, 'Invalid student ID'), { status: 400 });
    }

    // Verify student exists
    const student = await Student.findOne({ _id: id, ownerId: userId });
    if (!student) {
      return NextResponse.json(createResponse(404, 'Student not found'), { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const { skip } = getPaginationParams(page, limit);

    const [callLogs, total] = await Promise.all([
      CallLog.find({ studentId: id, ownerId: userId }).sort({ date: -1 }).skip(skip).limit(limit),
      CallLog.countDocuments({ studentId: id, ownerId: userId }),
    ]);

    // Calculate statistics
    const statusCounts = await CallLog.aggregate([
      { $match: { ownerId: userId, studentId: { $in: [new ObjectId(id), id] } } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const callsByStatus = Object.fromEntries(
      statusCounts.map((item: any) => [item._id, item.count])
    );
    const totalCalls = total;
    const lastCallDate = callLogs.length > 0 ? callLogs[0].date : null;

    // Calculate average time between calls
    let avgTimesBetweenCalls = 0;
    if (callLogs.length > 1) {
      let totalDays = 0;
      for (let i = 1; i < callLogs.length; i++) {
        const daysBetween = Math.floor(
          (callLogs[i - 1].date.getTime() - callLogs[i].date.getTime()) / (1000 * 60 * 60 * 24)
        );
        totalDays += daysBetween;
      }
      avgTimesBetweenCalls = totalDays / (callLogs.length - 1);
    }

    const pages = Math.ceil(total / limit);

    const response = createResponse(200, 'Student call history fetched successfully', {
      data: callLogs,
      summary: {
        totalCalls,
        lastCallDate,
        callsByStatus,
        averageTimesBetweenCalls: Number(avgTimesBetweenCalls.toFixed(1)),
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

/**
 * POST /api/students/[id]/call-logs
 * Create a new call log for a specific student
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const authResult = await requireCurrentUserId();
    if (authResult.response) return authResult.response;
    const userId = authResult.userId;
    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(createResponse(400, 'Invalid student ID'), { status: 400 });
    }

    // Verify student exists
    const student = await Student.findOne({ _id: id, ownerId: userId });
    if (!student) {
      return NextResponse.json(createResponse(404, 'Student not found'), { status: 404 });
    }

    const body = await request.json();

    // Add studentId to request body
    const requestBody = { ...body, studentId: id };
    const validatedData = CallLogCreateSchema.parse(requestBody);

    const callLog = new CallLog({
      ...validatedData,
      ownerId: userId,
      cohort: student.cohort || '14',
    });
    const saved = await callLog.save();
    await saved.populate('studentId');

    const contactedAt = validatedData.date || new Date();

    await resolveOpenFollowUpsAfterCall(id, contactedAt, userId);

    // Auto-create the next follow-up after this call
    await autoCreateFollowUp(saved._id.toString(), id, undefined, userId);

    // Update student's lastContactedAt
    await Student.findOneAndUpdate({ _id: id, ownerId: userId }, { lastContactedAt: contactedAt });

    // Invalidate related caches
    revalidateCacheTags(CACHE_INVALIDATION_TRIGGERS.addCallLog);
    revalidateCacheTags(CACHE_INVALIDATION_TRIGGERS.addFollowUp);
    revalidateCacheTags(CACHE_INVALIDATION_TRIGGERS.updateStudent);

    const response = createResponse(201, 'Call log created successfully', saved);
    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      const errorData = handleZodError(error as any);
      return NextResponse.json(
        createResponse(errorData.statusCode, errorData.message, undefined, errorData.errors),
        { status: errorData.statusCode }
      );
    }

    const errorData = handleDbError(error);
    return NextResponse.json(
      createResponse(errorData.statusCode, errorData.message, undefined, errorData.errors),
      { status: errorData.statusCode }
    );
  }
}
