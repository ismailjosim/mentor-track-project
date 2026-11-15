/* eslint-disable @typescript-eslint/no-explicit-any */
import type { QueryFilter } from 'mongoose';
import { connectDB } from '@/lib/mongodb';
import { createResponse, handleDbError, handleZodError, getPaginationParams } from '@/lib/utils';
import { FollowUpCreateSchema } from '@/lib/validators';
import { getEffectiveFollowUpStatus } from '@/lib/follow-up-status';
import FollowUp from '@/models/FollowUp';
import type { FollowUpDocument } from '@/models/FollowUp';
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
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const { skip } = getPaginationParams(page, limit);

    const now = new Date();
    const filters: QueryFilter<FollowUpDocument>[] = [{ ownerId: userId }];
    if (studentId) {
      if (!ObjectId.isValid(studentId)) {
        return NextResponse.json(createResponse(400, 'Invalid student ID'), { status: 400 });
      }
      filters.push({ studentId });
    }

    if (status === 'overdue') {
      filters.push({
        $or: [{ status: 'overdue' }, { status: 'pending', date: { $lt: now } }],
      });
    } else if (status === 'pending') {
      filters.push({ status: 'pending' }, { date: { $gte: now } });
    } else if (status === 'completed') {
      filters.push({ status: 'completed' });
    } else if (status) {
      return NextResponse.json(createResponse(400, 'Invalid follow-up status'), { status: 400 });
    }

    const dateFilter: { $gte?: Date; $lte?: Date } = {};
    if (startDate || endDate) {
      if (startDate) dateFilter.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        dateFilter.$lte = end;
      }
    }
    if (Object.keys(dateFilter).length > 0) {
      filters.push({ date: dateFilter });
    }
    const filter = filters.length > 1 ? { $and: filters } : filters[0];

    const [followUps, total] = await Promise.all([
      FollowUp.find(filter).populate('studentId').sort({ date: 1 }).skip(skip).limit(limit).lean(),
      FollowUp.countDocuments(filter),
    ]);

    const pages = Math.ceil(total / limit);
    const data = followUps.map((followUp) => ({
      ...followUp,
      status: getEffectiveFollowUpStatus(followUp.status, followUp.date, now),
    }));

    const response = createResponse(200, 'Follow-ups fetched successfully', {
      data,
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
    const validatedData = FollowUpCreateSchema.parse(body);

    // Verify student exists
    const student = await Student.findOne({ _id: validatedData.studentId, ownerId: userId });
    if (!student) {
      return NextResponse.json(createResponse(404, 'Student not found'), { status: 404 });
    }

    const followUp = new FollowUp({
      ...validatedData,
      ownerId: userId,
      status: 'pending',
    });
    await followUp.save();
    await followUp.populate('studentId');

    const response = createResponse(201, 'Follow-up created successfully', followUp);
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
