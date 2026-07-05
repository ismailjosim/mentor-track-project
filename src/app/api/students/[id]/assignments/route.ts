/* eslint-disable @typescript-eslint/no-explicit-any */

import { connectDB } from '@/lib/mongodb';
import {
  createResponse,
  handleDbError,
  handleZodError,
  isValidObjectId,
  logger,
} from '@/lib/utils';
import { UpdateStudentAssignmentSchema } from '@/lib/validators';
import Student from '@/models/Student';
import { Settings } from '@/models/Settings';
import type { StudentAssignment } from '@/models/Student';
import { revalidateCacheTags } from '@/lib/server-cache';
import { CACHE_INVALIDATION_TRIGGERS } from '@/lib/cache';
import { requireCurrentUserId } from '@/lib/auth-utils';
import { NextRequest, NextResponse } from 'next/server';
import { parseAssignmentNumber, resolveStudentProgress } from '@/lib/student-progress';

const syncStudentProgressForAssignment = async (
  student: any,
  assignmentNumber: number,
  status: string | undefined,
  ownerId: string
) => {
  if (status === 'SUBMITTED' || status === 'COMPLETED') {
    const assignmentKey = `A-${String(assignmentNumber).padStart(2, '0')}`;
    const lastCompletedNumber = parseAssignmentNumber(student.lastCompletedAssignment);

    if (!lastCompletedNumber || assignmentNumber > lastCompletedNumber) {
      student.lastCompletedAssignment = assignmentKey;
    }
  }

  const settings = await Settings.findOne({ ownerId });
  const currentAssignmentNumber = parseAssignmentNumber(settings?.currentAssignment);

  if (!currentAssignmentNumber || assignmentNumber > currentAssignmentNumber) {
    return;
  }

  if (student.currentStatus === 'Dropped' || student.currentStatus === 'Completed') {
    return;
  }

  const { nextStatus, lastCompletedAssignment } = resolveStudentProgress(
    student,
    currentAssignmentNumber
  );

  student.currentStatus = nextStatus;
  student.lastCompletedAssignment = lastCompletedAssignment;
};

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const authResult = await requireCurrentUserId();
    if (authResult.response) return authResult.response;
    const userId = authResult.userId;
    const { id } = await params;

    // Validate ObjectId format
    if (!isValidObjectId(id)) {
      logger.info('GET /api/students/[id]/assignments - Invalid ObjectId', { id });
      return NextResponse.json(createResponse(400, 'Invalid student ID format'), { status: 400 });
    }

    // Check if student exists
    const student = await Student.findOne({ _id: id, ownerId: userId }).lean();
    if (!student) {
      logger.info('GET /api/students/[id]/assignments - Student not found', { id });
      return NextResponse.json(createResponse(404, 'Student not found'), { status: 404 });
    }

    // Get embedded assignments
    const assignments = (student.assignments || []) as StudentAssignment[];

    // Calculate statistics
    const totalSubmitted = assignments.filter(
      (assignment: StudentAssignment) =>
        assignment.status === 'SUBMITTED' || assignment.status === 'COMPLETED'
    ).length;

    const totalPending = assignments.filter(
      (assignment: StudentAssignment) => assignment.status === 'PENDING'
    ).length;
    const totalCompleted = assignments.filter(
      (assignment: StudentAssignment) => assignment.status === 'COMPLETED'
    ).length;

    const percentageComplete = assignments.length > 0 ? (totalCompleted / 10) * 100 : 0;

    const stats = {
      totalAssignments: assignments.length,
      totalSubmitted,
      totalPending,
      totalCompleted,
      percentageComplete: Math.round(percentageComplete * 100) / 100,
    };

    logger.info('GET /api/students/[id]/assignments - Success', { id, total: assignments.length });

    const response = createResponse(200, 'Assignments fetched successfully', {
      assignments,
      stats,
    });

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    logger.error('GET /api/students/[id]/assignments - Failed', error);
    const errorData = handleDbError(error);
    return NextResponse.json(
      createResponse(errorData.statusCode, errorData.message, undefined, errorData.errors),
      { status: errorData.statusCode }
    );
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const authResult = await requireCurrentUserId();
    if (authResult.response) return authResult.response;
    const userId = authResult.userId;
    const { id } = await params;

    // Validate student ID format
    if (!isValidObjectId(id)) {
      return NextResponse.json(createResponse(400, 'Invalid student ID format'), { status: 400 });
    }

    // Check if student exists
    const student = await Student.findOne({ _id: id, ownerId: userId });
    if (!student) {
      return NextResponse.json(createResponse(404, 'Student not found'), { status: 404 });
    }

    const body = await request.json();

    // Validate data
    const validatedData = UpdateStudentAssignmentSchema.parse(body);

    // Check for duplicate assignment
    const existing = student.assignments?.some(
      (assignment: StudentAssignment) =>
        assignment.assignmentNumber === validatedData.assignmentNumber
    );

    if (existing) {
      return NextResponse.json(
        createResponse(409, 'Assignment already exists for this student', undefined, [
          {
            field: 'assignmentNumber',
            message: `Student already has assignment ${validatedData.assignmentNumber}`,
          },
        ]),
        { status: 409 }
      );
    }

    // Create new embedded assignment
    const newAssignment: StudentAssignment = {
      assignmentNumber: validatedData.assignmentNumber,
      status: validatedData.status || 'PENDING',
      date: validatedData.date,
    };

    if (!student.assignments) {
      student.assignments = [];
    }

    student.assignments.push(newAssignment);
    // Keep sorted by assignment number
    student.assignments.sort(
      (a: StudentAssignment, b: StudentAssignment) => a.assignmentNumber - b.assignmentNumber
    );

    await syncStudentProgressForAssignment(
      student,
      validatedData.assignmentNumber,
      newAssignment.status,
      userId
    );

    await student.save();
    revalidateCacheTags(CACHE_INVALIDATION_TRIGGERS.updateAssignment);

    logger.info('POST /api/students/[id]/assignments', {
      studentId: id,
      assignmentNumber: validatedData.assignmentNumber,
    });

    const response = createResponse(201, 'Assignment created successfully', newAssignment);
    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      const errorData = handleZodError(error as any);
      return NextResponse.json(
        createResponse(errorData.statusCode, errorData.message, undefined, errorData.errors),
        { status: errorData.statusCode }
      );
    }

    logger.error('POST /api/students/[id]/assignments failed', error);
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

    // Validate student ID format
    if (!isValidObjectId(id)) {
      return NextResponse.json(createResponse(400, 'Invalid student ID format'), { status: 400 });
    }

    const student = await Student.findOne({ _id: id, ownerId: userId });
    if (!student) {
      return NextResponse.json(createResponse(404, 'Student not found'), { status: 404 });
    }

    const body = await request.json();

    // Validate data (support both old and new field names for backward compatibility)
    const normalizedData = {
      assignmentNumber: body.assignmentNumber || body.assignment,
      status: body.status,
      date: body.date || body.completedDate || body.submittedDate,
    };
    const validatedData = UpdateStudentAssignmentSchema.parse(normalizedData);

    // Find and update assignment
    if (!student.assignments) {
      student.assignments = [];
    }

    const assignmentIndex = student.assignments.findIndex(
      (assignment: StudentAssignment) =>
        assignment.assignmentNumber === validatedData.assignmentNumber
    );

    if (assignmentIndex < 0) {
      return NextResponse.json(createResponse(404, 'Assignment not found for this student'), {
        status: 404,
      });
    }

    // Update assignment
    student.assignments[assignmentIndex] = {
      ...student.assignments[assignmentIndex],
      ...validatedData,
      assignmentNumber: validatedData.assignmentNumber, // Keep original assignment number
    };

    await syncStudentProgressForAssignment(
      student,
      validatedData.assignmentNumber,
      validatedData.status,
      userId
    );

    await student.save();
    revalidateCacheTags(CACHE_INVALIDATION_TRIGGERS.updateAssignment);

    logger.info('PUT /api/students/[id]/assignments', {
      studentId: id,
      assignmentNumber: validatedData.assignmentNumber,
    });

    const response = createResponse(
      200,
      'Assignment updated successfully',
      student.assignments[assignmentIndex]
    );
    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      const errorData = handleZodError(error as any);
      return NextResponse.json(
        createResponse(errorData.statusCode, errorData.message, undefined, errorData.errors),
        { status: errorData.statusCode }
      );
    }

    logger.error('PUT /api/students/[id]/assignments failed', error);
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

    // Validate student ID format
    if (!isValidObjectId(id)) {
      return NextResponse.json(createResponse(400, 'Invalid student ID format'), { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const assignmentNumber = searchParams.get('assignmentNumber');

    if (!assignmentNumber) {
      return NextResponse.json(createResponse(400, 'Assignment number is required'), {
        status: 400,
      });
    }

    const assignNum = parseInt(assignmentNumber, 10);
    if (isNaN(assignNum) || assignNum < 1 || assignNum > 10) {
      return NextResponse.json(createResponse(400, 'Invalid assignment number'), { status: 400 });
    }

    const student = await Student.findOne({ _id: id, ownerId: userId });

    if (!student) {
      return NextResponse.json(createResponse(404, 'Student not found'), { status: 404 });
    }

    student.assignments =
      student.assignments?.filter(
        (assignment: StudentAssignment) => assignment.assignmentNumber !== assignNum
      ) || [];

    await syncStudentProgressForAssignment(student, assignNum, undefined, userId);
    await student.save();
    revalidateCacheTags(CACHE_INVALIDATION_TRIGGERS.updateAssignment);

    logger.info('DELETE /api/students/[id]/assignments', {
      studentId: id,
      assignmentNumber: assignNum,
    });

    const response = createResponse(200, 'Assignment deleted successfully');
    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    logger.error('DELETE /api/students/[id]/assignments failed', error);
    const errorData = handleDbError(error);
    return NextResponse.json(
      createResponse(errorData.statusCode, errorData.message, undefined, errorData.errors),
      { status: errorData.statusCode }
    );
  }
}
