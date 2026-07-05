/* eslint-disable @typescript-eslint/no-explicit-any */

import { connectDB } from '@/lib/mongodb';
import { createResponse, handleDbError, handleZodError, getPaginationParams } from '@/lib/utils';
import { CallLogCreateSchema, CallLogBatchSchema } from '@/lib/validators';
import { autoCreateFollowUp, resolveOpenFollowUpsAfterCall } from '@/lib/follow-up-logic';
import CallLog from '@/models/CallLog';
import Student from '@/models/Student';
import { requireCurrentUserId } from '@/lib/auth-utils';
import { NextRequest, NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const authResult = await requireCurrentUserId();
    if (authResult.response) return authResult.response;
    const userId = authResult.userId;

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const studentId = searchParams.get('studentId');
    const status = searchParams.get('status');
    const calledBy = searchParams.get('calledBy');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const { skip } = getPaginationParams(page, limit);

    // Build filter
    const filter: any = { ownerId: userId };
    if (studentId) filter.studentId = new ObjectId(studentId);
    if (status) filter.status = status;
    if (calledBy) filter.calledBy = calledBy;

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.date.$lte = end;
      }
    }

    // Get call logs with student info
    const [callLogs, total] = await Promise.all([
      CallLog.find(filter).populate('studentId').sort({ date: -1 }).skip(skip).limit(limit),
      CallLog.countDocuments(filter),
    ]);

    // Calculate status summary
    const statusCounts = await CallLog.aggregate([
      { $match: filter },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const summary = Object.fromEntries(statusCounts.map((item: any) => [item._id, item.count]));

    const pages = Math.ceil(total / limit);

    const response = createResponse(200, 'Call logs fetched successfully', {
      data: callLogs,
      summary,
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

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const authResult = await requireCurrentUserId();
    if (authResult.response) return authResult.response;
    const userId = authResult.userId;

    const body = await request.json();

    // Check if it's a batch request
    if (body.callLogs && Array.isArray(body.callLogs)) {
      const validatedData = CallLogBatchSchema.parse(body);
      const results = { created: 0, failed: 0, errors: [] as any[] };

      for (const logData of validatedData.callLogs) {
        try {
          // Verify student exists
          const student = await Student.findOne({ _id: logData.studentId, ownerId: userId });
          if (!student) {
            results.failed++;
            results.errors.push({
              studentId: logData.studentId,
              error: 'Student not found',
            });
            continue;
          }

          const callLog = new CallLog({
            ...logData,
            ownerId: userId,
            assignmentContext: student.lastCompletedAssignment || 'None',
          });
          const saved = await callLog.save();
          await saved.populate('studentId');

          const contactedAt = logData.date || new Date();

          await resolveOpenFollowUpsAfterCall(logData.studentId, contactedAt, userId);

          // Auto-create the next follow-up after this call
          await autoCreateFollowUp(saved._id.toString(), logData.studentId, undefined, userId);

          // Update student's lastContactedAt
          await Student.findOneAndUpdate(
            { _id: logData.studentId, ownerId: userId },
            { lastContactedAt: contactedAt }
          );

          results.created++;
        } catch (err) {
          results.failed++;
          results.errors.push({ studentId: logData.studentId, error: (err as any).message });
        }
      }

      const response = createResponse(207, 'Batch operation completed', results);
      return NextResponse.json(response, { status: 207 });
    }

    // Single create
    const validatedData = CallLogCreateSchema.parse(body);

    // Verify student exists
    const student = await Student.findOne({ _id: validatedData.studentId, ownerId: userId });
    if (!student) {
      return NextResponse.json(createResponse(404, 'Student not found'), { status: 404 });
    }

    const callLog = new CallLog({
      ...validatedData,
      ownerId: userId,
      assignmentContext: student.lastCompletedAssignment || 'None',
    });
    const saved = await callLog.save();
    await saved.populate('studentId');

    const contactedAt = validatedData.date || new Date();

    await resolveOpenFollowUpsAfterCall(validatedData.studentId, contactedAt, userId);

    // Auto-create the next follow-up after this call
    await autoCreateFollowUp(saved._id.toString(), validatedData.studentId, undefined, userId);

    // Update student's lastContactedAt
    await Student.findOneAndUpdate(
      { _id: validatedData.studentId, ownerId: userId },
      { lastContactedAt: contactedAt }
    );

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
