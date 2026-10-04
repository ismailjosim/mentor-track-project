/* eslint-disable @typescript-eslint/no-explicit-any */
import 'server-only';
import { connectDB } from '@/lib/mongodb';
import { isValidObjectId, calculateDaysDifference } from '@/lib/utils';
import { getCurrentUserId } from '@/lib/auth-utils';
import Student from '@/models/Student';
import CallLog from '@/models/CallLog';
import FollowUp from '@/models/FollowUp';

export interface SingleStudentResult {
  success: boolean;
  data: any | null;
  error?: string;
}

/**
 * Service to retrieve a student with relations directly from the database (Rule 4.2: Layering).
 * Eliminates fragile self-referencing HTTP fetches within Server Components.
 */
export async function getStudentById(
  id: string,
  userId?: string | null
): Promise<SingleStudentResult> {
  try {
    if (!id || !isValidObjectId(id)) {
      return {
        success: false,
        data: null,
        error: 'Invalid student ID format',
      };
    }

    await connectDB();

    const activeUserId = userId !== undefined ? userId : await getCurrentUserId();
    if (!activeUserId) {
      return {
        success: false,
        data: null,
        error: 'Unauthorized',
      };
    }

    const student = await Student.findOne({ _id: id, ownerId: activeUserId }).lean();
    if (!student) {
      return {
        success: false,
        data: null,
        error: 'Student not found',
      };
    }

    const [callLogs, followUps] = await Promise.all([
      CallLog.find({ studentId: id, ownerId: activeUserId }).sort({ date: -1 }).lean(),
      FollowUp.find({ studentId: id, ownerId: activeUserId }).sort({ date: 1 }).lean(),
    ]);

    const assignments = (student as any).assignments || [];
    const totalAssignmentsSubmitted = assignments.filter(
      (a: any) => a.status === 'SUBMITTED' || a.status === 'COMPLETED'
    ).length;

    const nextFollowUpDate = followUps.length > 0 ? (followUps[0] as any).date : null;
    const daysSinceLastCall =
      callLogs.length > 0
        ? calculateDaysDifference(new Date((callLogs[0] as any).date), new Date())
        : null;

    // Convert ObjectIds to strings for safe client serialization
    const serializedStudent = JSON.parse(
      JSON.stringify({
        ...student,
        assignments,
        totalAssignmentsSubmitted,
        callLogs,
        followUps,
        nextFollowUpDate,
        daysSinceLastCall,
      })
    );

    return {
      success: true,
      data: serializedStudent,
    };
  } catch (error) {
    console.error('getStudentById service error:', error);
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : 'Failed to retrieve student',
    };
  }
}

/**
 * Backward compatibility alias for SingleStudentPage
 */
export async function getSingleStudent(id: string): Promise<SingleStudentResult> {
  return getStudentById(id);
}
