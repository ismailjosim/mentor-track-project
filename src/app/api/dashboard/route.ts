/* eslint-disable @typescript-eslint/no-explicit-any */

import { NextResponse } from 'next/server';
import { requireCurrentUserId } from '@/lib/auth-utils';
import { connectDB } from '@/lib/mongodb';
import { createResponse, handleDbError } from '@/lib/utils';
import Student from '@/models/Student';
import { Settings } from '@/models/Settings';

const PAGE_SIZE = 10;

const parseAssignmentNumber = (assignment?: string | null) => {
  const value = Number.parseInt(assignment?.split('-')[1] || '1', 10);
  return Number.isNaN(value) ? 1 : value;
};

const isSubmitted = (status?: string) => status === 'SUBMITTED' || status === 'COMPLETED';

export async function GET() {
  try {
    await connectDB();
    const authResult = await requireCurrentUserId();
    if (authResult.response) return authResult.response;
    const userId = authResult.userId;

    const [students, settings] = await Promise.all([
      Student.find({ ownerId: userId })
        .select(
          '_id name email phone currentStatus lastCompletedAssignment assignments lastContactedAt'
        )
        .lean(),
      Settings.findOne({ ownerId: userId }).select('currentAssignment').lean(),
    ]);

    const currentAssignmentNumber = parseAssignmentNumber(settings?.currentAssignment);
    let totalAssignments = 0;
    let completedAssignments = 0;

    const callQueue = students
      .filter((student: any) => {
        if (student.currentStatus === 'Dropped' || student.currentStatus === 'Completed') {
          return false;
        }

        const currentAssignment = student.assignments?.find(
          (assignment: any) => assignment.assignmentNumber === currentAssignmentNumber
        );
        return !isSubmitted(currentAssignment?.status);
      })
      .map((student: any) => {
        const missedCount = Array.from(
          { length: currentAssignmentNumber },
          (_, index) => index + 1
        ).filter((assignmentNumber) => {
          const assignment = student.assignments?.find(
            (item: any) => item.assignmentNumber === assignmentNumber
          );
          return !isSubmitted(assignment?.status);
        }).length;

        return {
          _id: student._id,
          name: student.name,
          email: student.email,
          phone: student.phone,
          lastCompletedAssignment: student.lastCompletedAssignment,
          lastContactedAt: student.lastContactedAt,
          currentStatus: missedCount >= 2 ? 'At Risk' : 'Behind',
          missedAssignmentCount: missedCount,
        };
      })
      .sort((a: any, b: any) => {
        if (a.currentStatus !== b.currentStatus) return a.currentStatus === 'At Risk' ? -1 : 1;
        return (
          new Date(a.lastContactedAt || 0).getTime() - new Date(b.lastContactedAt || 0).getTime()
        );
      });

    for (const student of students as any[]) {
      totalAssignments += student.assignments?.length || 0;
      completedAssignments +=
        student.assignments?.filter((assignment: any) => assignment.status === 'COMPLETED')
          .length || 0;
    }

    const failingStudents = students
      .filter((student: any) => ['Behind', 'At Risk'].includes(student.currentStatus))
      .map((student: any) => ({
        _id: student._id,
        name: student.name,
        email: student.email,
        phone: student.phone,
        currentStatus: student.currentStatus,
        lastCompletedAssignment: student.lastCompletedAssignment,
      }));

    const stats = {
      totalStudents: students.length,
      activeStudents: students.filter(
        (student: any) => !['Dropped', 'Completed'].includes(student.currentStatus)
      ).length,
      onTrackStudents: students.filter((student: any) => student.currentStatus === 'On Track')
        .length,
      atRiskStudents: failingStudents.length,
      completedStudents: students.filter((student: any) => student.currentStatus === 'Completed')
        .length,
      totalAssignments,
      pendingAssignments: totalAssignments - completedAssignments,
      completedAssignments,
      totalCallLogs: 0,
      totalFollowUps: callQueue.length,
      pendingFollowUps: callQueue.length,
    };

    // Trim students down to only what is needed for assignment stats charts
    const lightweightStudents = students.map((s: any) => ({
      _id: s._id,
      lastCompletedAssignment: s.lastCompletedAssignment,
    }));

    return NextResponse.json(
      createResponse(200, 'Dashboard overview fetched successfully', {
        stats,
        students: lightweightStudents,
        failingStudents: failingStudents.slice(0, PAGE_SIZE),
        failingPagination: {
          page: 1,
          total: failingStudents.length,
          pages: Math.max(1, Math.ceil(failingStudents.length / PAGE_SIZE)),
        },
        callQueue: callQueue.slice(0, PAGE_SIZE),
        callQueuePagination: {
          page: 1,
          total: callQueue.length,
          pages: Math.max(1, Math.ceil(callQueue.length / PAGE_SIZE)),
        },
      })
    );
  } catch (error) {
    const errorData = handleDbError(error);
    return NextResponse.json(createResponse(errorData.statusCode, errorData.message), {
      status: errorData.statusCode,
    });
  }
}
