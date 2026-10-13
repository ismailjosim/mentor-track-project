/* eslint-disable @typescript-eslint/no-explicit-any */

import { NextRequest, NextResponse } from 'next/server';
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

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const authResult = await requireCurrentUserId();
    if (authResult.response) return authResult.response;
    const userId = authResult.userId;

    const { searchParams } = new URL(request.url);
    const rawCohort = searchParams.get('cohort');
    const selectedCohort =
      rawCohort && rawCohort !== 'all' ? rawCohort.trim().replace(/[^\d]/g, '') : null;

    const studentFilter: any = { ownerId: userId };
    if (selectedCohort) {
      studentFilter.cohort = selectedCohort;
    }

    const [students, settings, distinctCohorts] = await Promise.all([
      Student.find(studentFilter)
        .select(
          '_id name email phone cohort currentStatus lastCompletedAssignment assignments lastContactedAt mentorshipJoiningStatus'
        )
        .lean(),
      Settings.findOne({ ownerId: userId }).select('currentAssignment').lean(),
      Student.distinct('cohort', { ownerId: userId }),
    ]);

    const availableCohorts = Array.from(
      new Set([...distinctCohorts.filter(Boolean).map(String), '13', '14'])
    ).sort((a, b) => Number(a) - Number(b));

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

    const completedStudentsCount = students.filter((student: any) => {
      if (student.currentStatus === 'Dropped') return false;
      if (student.currentStatus === 'Completed') return true;
      if (!currentAssignmentNumber || currentAssignmentNumber < 1) return false;
      for (let i = 1; i <= currentAssignmentNumber; i++) {
        const a = student.assignments?.find((item: any) => item.assignmentNumber === i);
        if (!a || !isSubmitted(a.status)) {
          return false;
        }
      }
      return true;
    }).length;

    const mentorshipJoined = students.filter(
      (student: any) => student.mentorshipJoiningStatus === true
    ).length;
    const mentorshipNotJoined = students.length - mentorshipJoined;

    // Detailed assignment performance stats for A-01..A-10
    const totalStudentsCount = students.length;
    const assignmentStats = Array.from({ length: 10 }, (_, idx) => {
      const assignmentNumber = idx + 1;
      const assignmentKey = `A-${String(assignmentNumber).padStart(2, '0')}`;

      let submittedCount = 0;
      let gradedCount = 0;
      let fullMarksCount = 0;
      let above50Count = 0;
      let pendingOrZeroCount = 0;
      let totalMarksSum = 0;

      for (const student of students as any[]) {
        const a = student.assignments?.find(
          (item: any) => item.assignmentNumber === assignmentNumber
        );
        if (!a) continue;

        const isSub =
          a.status === 'SUBMITTED' ||
          a.status === 'COMPLETED' ||
          (typeof a.marks === 'number' && !Number.isNaN(a.marks));

        if (!isSub) continue;

        submittedCount++;
        const marks = typeof a.marks === 'number' && !Number.isNaN(a.marks) ? a.marks : undefined;
        const maxMarks = a.maxMarks || 60;

        if (marks === undefined || marks <= 0) {
          // Submitted but pending grading or 0 marks
          pendingOrZeroCount++;
        } else {
          gradedCount++;
          totalMarksSum += marks;
          if (marks >= maxMarks) {
            fullMarksCount++;
          }
          if (marks > maxMarks * 0.5) {
            above50Count++;
          }
        }
      }

      const submissionRate =
        totalStudentsCount > 0
          ? Number(((submittedCount / totalStudentsCount) * 100).toFixed(1))
          : 0;
      const fullMarksRate =
        submittedCount > 0 ? Number(((fullMarksCount / submittedCount) * 100).toFixed(1)) : 0;
      const above50Rate =
        submittedCount > 0 ? Number(((above50Count / submittedCount) * 100).toFixed(1)) : 0;
      const pendingOrZeroRate =
        submittedCount > 0 ? Number(((pendingOrZeroCount / submittedCount) * 100).toFixed(1)) : 0;
      const gradedRate =
        submittedCount > 0 ? Number(((gradedCount / submittedCount) * 100).toFixed(1)) : 0;
      const avgMarks = gradedCount > 0 ? Number((totalMarksSum / gradedCount).toFixed(1)) : null;

      return {
        assignmentNumber,
        assignmentKey,
        totalStudents: totalStudentsCount,
        submittedCount,
        submissionRate,
        gradedCount,
        gradedRate,
        pendingOrZeroCount,
        pendingOrZeroRate,
        fullMarksCount,
        fullMarksRate,
        above50Count,
        above50Rate,
        avgMarks,
      };
    });

    const stats = {
      totalStudents: students.length,
      activeStudents: students.filter(
        (student: any) => !['Dropped', 'Completed'].includes(student.currentStatus)
      ).length,
      onTrackStudents: students.filter((student: any) => student.currentStatus === 'On Track')
        .length,
      atRiskStudents: failingStudents.length,
      completedStudents: completedStudentsCount,
      currentAssignment:
        settings?.currentAssignment || `A-${String(currentAssignmentNumber).padStart(2, '0')}`,
      totalAssignments,
      pendingAssignments: totalAssignments - completedAssignments,
      completedAssignments,
      totalCallLogs: 0,
      totalFollowUps: callQueue.length,
      pendingFollowUps: callQueue.length,
      mentorshipJoined,
      mentorshipNotJoined,
    };

    // Trim students down to only what is needed for assignment stats charts
    const lightweightStudents = students.map((s: any) => ({
      _id: s._id,
      lastCompletedAssignment: s.lastCompletedAssignment,
    }));

    return NextResponse.json(
      createResponse(200, 'Dashboard overview fetched successfully', {
        stats,
        cohort: selectedCohort || 'all',
        availableCohorts,
        students: lightweightStudents,
        assignmentStats,
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
