/* eslint-disable @typescript-eslint/no-explicit-any */

import { connectDB } from '@/lib/mongodb';
import { createResponse, handleDbError, handleZodError, logger } from '@/lib/utils';
import { AssignmentBulkSubmitSchema } from '@/lib/validators';
import Student from '@/models/Student';
import { Settings } from '@/models/Settings';
import { revalidateCacheTags } from '@/lib/server-cache';
import { CACHE_INVALIDATION_TRIGGERS } from '@/lib/cache';
import { requireCurrentUserId } from '@/lib/auth-utils';
import { NextRequest, NextResponse } from 'next/server';

import { parseAssignmentNumber, resolveStudentProgress } from '@/lib/student-progress';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const authResult = await requireCurrentUserId();
    if (authResult.response) return authResult.response;
    const userId = authResult.userId;

    const body = await request.json();
    const validatedData = AssignmentBulkSubmitSchema.parse(body);

    const { assignmentNumber, emails, items, tier = 60, submittedDate } = validatedData;
    const submissionDate = submittedDate || new Date();
    const settings = await Settings.findOne({ ownerId: userId }).lean();
    const currentAssignmentNumber = parseAssignmentNumber(settings?.currentAssignment);

    // Normalize incoming items
    let targetItems: Array<{
      email: string;
      marks?: number | null;
      totalMarks?: 30 | 50 | 60 | null;
      name?: string;
    }> = [];

    if (Array.isArray(items) && items.length > 0) {
      targetItems = items
        .filter((it) => it && typeof it.email === 'string')
        .map((it) => {
          const rawTotal = it.totalMarks ?? it.tier ?? it.maxMarks;
          const parsedTotal =
            rawTotal === 30 || rawTotal === 50 || rawTotal === 60
              ? (rawTotal as 30 | 50 | 60)
              : undefined;
          return {
            email: it.email.toLowerCase().trim(),
            marks: typeof it.marks === 'number' ? it.marks : undefined,
            totalMarks: parsedTotal,
            name: it.name?.trim(),
          };
        });
    } else if (Array.isArray(emails) && emails.length > 0) {
      targetItems = emails
        .filter((e) => typeof e === 'string' && e.trim().length > 0)
        .map((email) => ({
          email: email.toLowerCase().trim(),
        }));
    }

    const itemMap = new Map<
      string,
      { email: string; marks?: number | null; totalMarks?: 30 | 50 | 60 | null; name?: string }
    >();
    for (const it of targetItems) {
      itemMap.set(it.email, it);
    }

    const uniqueEmails = Array.from(itemMap.keys());

    // Find all matching students
    const students = await Student.find({
      ownerId: userId,
      email: { $in: uniqueEmails },
    });

    const studentMap = new Map(students.map((s: any) => [s.email.toLowerCase(), s]));
    const matchedEmails = new Set<string>();
    const unmatchedEmails: string[] = [];

    // Track results
    let createdCount = 0;
    let updatedCount = 0;
    let completedCount = 0;
    let pendingCount = 0;
    const matchedStudents: any[] = [];

    // Process each email
    for (const email of uniqueEmails) {
      if (!email) continue;

      const student = studentMap.get(email);
      const item = itemMap.get(email);

      if (!student) {
        unmatchedEmails.push(email);
        continue;
      }

      matchedEmails.add(email);

      // Determine student-specific deadline tier: item's totalMarks or fallback to batch tier
      const studentTier: 30 | 50 | 60 = item?.totalMarks || tier;

      // Determine marks & status based on business rules:
      // If marks > 0: status is COMPLETED with assigned marks (capped at studentTier maxMarks)
      // If marks <= 0 (e.g. 0, -2, -4) or not provided: status is SUBMITTED (pending marks)
      const hasPositiveMarks = item?.marks !== undefined && item?.marks !== null && item.marks > 0;
      const status = hasPositiveMarks ? 'COMPLETED' : 'SUBMITTED';
      const marks = hasPositiveMarks ? Math.min(studentTier, Math.max(0, item.marks!)) : undefined;

      if (status === 'COMPLETED') {
        completedCount++;
      } else {
        pendingCount++;
      }

      matchedStudents.push({
        email: student.email,
        name: student.name,
        id: student._id.toString(),
        marks,
        maxMarks: studentTier,
        status,
      });

      // Initialize assignments array if needed
      if (!student.assignments) {
        student.assignments = [];
      }

      // Check if assignment already exists in embedded array
      const existingIndex = student.assignments.findIndex(
        (a: any) => a.assignmentNumber === assignmentNumber
      );

      const assignmentData: any = {
        assignmentNumber,
        status,
        maxMarks: studentTier,
        date: submissionDate,
      };

      if (marks !== undefined) {
        assignmentData.marks = marks;
      }

      if (existingIndex >= 0) {
        // Update existing embedded assignment
        student.assignments[existingIndex] = {
          ...(student.assignments[existingIndex].toObject?.() ||
            student.assignments[existingIndex]),
          ...assignmentData,
        };
        if (marks === undefined) {
          delete student.assignments[existingIndex].marks;
        }
        updatedCount++;
      } else {
        // Add new embedded assignment
        student.assignments.push(assignmentData);
        createdCount++;
      }

      student.markModified('assignments');

      // Update student progress & status
      if (
        currentAssignmentNumber &&
        student.currentStatus !== 'Dropped' &&
        student.currentStatus !== 'Completed'
      ) {
        const { nextStatus, lastCompletedAssignment } = resolveStudentProgress(
          student,
          currentAssignmentNumber
        );

        student.currentStatus = nextStatus;
        if (lastCompletedAssignment) {
          student.lastCompletedAssignment = lastCompletedAssignment;
        }
      } else {
        const assignmentKey = `A-${String(assignmentNumber).padStart(2, '0')}`;
        const currentLast = student.lastCompletedAssignment || 'None';

        if (currentLast === 'None' || parseInt(currentLast.split('-')[1], 10) < assignmentNumber) {
          student.lastCompletedAssignment = assignmentKey;
        }
      }

      // Save the updated student document
      await student.save();
    }

    logger.info('POST /api/assignments/bulk-submit', {
      assignmentNumber,
      matched: matchedEmails.size,
      unmatched: unmatchedEmails.length,
      created: createdCount,
      updated: updatedCount,
      completed: completedCount,
      pending: pendingCount,
      tier,
    });

    const response = createResponse(200, 'Bulk submit completed successfully', {
      matched: {
        count: matchedStudents.length,
        students: matchedStudents,
      },
      unmatched: {
        count: unmatchedEmails.length,
        emails: unmatchedEmails,
      },
      created: createdCount,
      updated: updatedCount,
      completed: completedCount,
      pending: pendingCount,
      tier,
      total: {
        processed: uniqueEmails.length,
        successfulMatches: matchedStudents.length,
      },
    });

    revalidateCacheTags(CACHE_INVALIDATION_TRIGGERS.updateAssignment);

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      const errorData = handleZodError(error as any);
      return NextResponse.json(
        createResponse(errorData.statusCode, errorData.message, undefined, errorData.errors),
        { status: errorData.statusCode }
      );
    }

    logger.error('POST /api/assignments/bulk-submit failed', error);
    const errorData = handleDbError(error);
    return NextResponse.json(
      createResponse(errorData.statusCode, errorData.message, undefined, errorData.errors),
      { status: errorData.statusCode }
    );
  }
}
