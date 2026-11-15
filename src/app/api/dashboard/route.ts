import { NextRequest, NextResponse } from 'next/server';
import { requireCurrentUserId } from '@/lib/auth-utils';
import { connectDB } from '@/lib/mongodb';
import { createResponse, handleDbError } from '@/lib/utils';
import Student from '@/models/Student';
import { Settings } from '@/models/Settings';
import type { StudentAssignment } from '@/models/Student';
import {
  getMissedReleasedAssignmentCount,
  isAssignmentSubmitted,
  resolveStudentProgress,
} from '@/lib/student-progress';
import { ASSIGNMENT_TARGET_PERCENTAGES } from '@/lib/assignment-targets';
import { getTuesdayWeeklyPeriodStart } from '@/lib/weekly-update';

const PAGE_SIZE = 10;

const parseAssignmentNumber = (assignment?: string | null) => {
  const value = Number.parseInt(assignment?.split('-')[1] || '1', 10);
  return Number.isNaN(value) ? 1 : value;
};

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

    const studentFilter = selectedCohort
      ? { ownerId: userId, cohort: selectedCohort }
      : { ownerId: userId };

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
    const progressByStudentId = new Map(
      students.map((student) => [
        String(student._id),
        resolveStudentProgress(student, currentAssignmentNumber),
      ])
    );
    const getCurrentStatus = (student: (typeof students)[number]) =>
      progressByStudentId.get(String(student._id))?.nextStatus || student.currentStatus;
    let totalAssignments = 0;
    let completedAssignments = 0;

    const callQueue = students
      .filter((student) => {
        const currentStatus = getCurrentStatus(student);
        if (currentStatus === 'Dropped' || currentStatus === 'Completed') {
          return false;
        }

        const currentAssignment = student.assignments?.find(
          (assignment: StudentAssignment) => assignment.assignmentNumber === currentAssignmentNumber
        );
        return !isAssignmentSubmitted(currentAssignment);
      })
      .map((student) => {
        const progress = progressByStudentId.get(String(student._id));
        const missedCount =
          progress?.missedAssignmentCount ??
          getMissedReleasedAssignmentCount(student.assignments, currentAssignmentNumber);

        return {
          _id: student._id,
          name: student.name,
          email: student.email,
          phone: student.phone,
          lastCompletedAssignment: student.lastCompletedAssignment,
          lastContactedAt: student.lastContactedAt,
          currentStatus: progress?.nextStatus || getCurrentStatus(student) || 'Behind',
          missedAssignmentCount: missedCount,
        };
      })
      .sort((a, b) => {
        if (a.currentStatus !== b.currentStatus) return a.currentStatus === 'At Risk' ? -1 : 1;
        return (
          new Date(a.lastContactedAt || 0).getTime() - new Date(b.lastContactedAt || 0).getTime()
        );
      });

    for (const student of students) {
      totalAssignments += student.assignments?.length || 0;
      completedAssignments +=
        student.assignments?.filter(
          (assignment: StudentAssignment) => assignment.status === 'COMPLETED'
        ).length || 0;
    }

    const failingStudents = students
      .filter((student) => ['Behind', 'At Risk'].includes(getCurrentStatus(student) || ''))
      .map((student) => ({
        _id: student._id,
        name: student.name,
        email: student.email,
        phone: student.phone,
        currentStatus: getCurrentStatus(student),
        lastCompletedAssignment: student.lastCompletedAssignment,
      }));

    const completedStudentsCount = students.filter((student) => {
      const currentStatus = getCurrentStatus(student);
      if (currentStatus === 'Dropped') return false;
      if (currentStatus === 'Completed') return true;
      if (!currentAssignmentNumber || currentAssignmentNumber < 1) return false;
      for (let i = 1; i <= currentAssignmentNumber; i++) {
        const a = student.assignments?.find(
          (item: StudentAssignment) => item.assignmentNumber === i
        );
        if (!a || !isAssignmentSubmitted(a)) {
          return false;
        }
      }
      return true;
    }).length;

    const mentorshipJoined = students.filter(
      (student) => student.mentorshipJoiningStatus === true
    ).length;
    const mentorshipNotJoined = students.length - mentorshipJoined;

    // Detailed assignment performance stats for A-01..A-10
    const totalStudentsCount = students.length;
    const now = new Date();
    const tuesdayPeriodStart = getTuesdayWeeklyPeriodStart(now);
    const assignmentStats = Array.from({ length: 10 }, (_, idx) => {
      const assignmentNumber = idx + 1;
      const assignmentKey = `A-${String(assignmentNumber).padStart(2, '0')}`;

      let submittedCount = 0;
      let gradedCount = 0;
      let fullMarksCount = 0;
      let above50Count = 0;
      let zeroMarksCount = 0;
      let pendingCount = 0;
      let pendingOrZeroCount = 0;
      let totalMarksSum = 0;
      let newThisWeekSubmittedCount = 0;

      for (const student of students) {
        const a = student.assignments?.find(
          (item: StudentAssignment) => item.assignmentNumber === assignmentNumber
        );
        if (!a) continue;

        if (!isAssignmentSubmitted(a)) continue;

        submittedCount++;
        const submissionTime = a.date ? new Date(a.date).getTime() : Number.NaN;
        if (
          Number.isFinite(submissionTime) &&
          submissionTime >= tuesdayPeriodStart.getTime() &&
          submissionTime <= now.getTime()
        ) {
          newThisWeekSubmittedCount++;
        }
        const marks = typeof a.marks === 'number' && !Number.isNaN(a.marks) ? a.marks : undefined;
        const maxMarks = a.maxMarks || 60;

        if (marks === undefined) {
          pendingCount++;
          pendingOrZeroCount++;
        } else if (marks <= 0) {
          zeroMarksCount++;
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
      const zeroMarksRate =
        submittedCount > 0 ? Number(((zeroMarksCount / submittedCount) * 100).toFixed(1)) : 0;
      const pendingRate =
        submittedCount > 0 ? Number(((pendingCount / submittedCount) * 100).toFixed(1)) : 0;
      const pendingOrZeroRate =
        submittedCount > 0 ? Number(((pendingOrZeroCount / submittedCount) * 100).toFixed(1)) : 0;
      const gradedRate =
        submittedCount > 0 ? Number(((gradedCount / submittedCount) * 100).toFixed(1)) : 0;
      const avgMarks = gradedCount > 0 ? Number((totalMarksSum / gradedCount).toFixed(1)) : null;
      const targetPercentage = ASSIGNMENT_TARGET_PERCENTAGES[assignmentNumber];
      const targetCount =
        targetPercentage === null
          ? null
          : Math.round((totalStudentsCount * targetPercentage) / 100);
      const targetGapPercentage =
        targetPercentage === null ? null : Number((submissionRate - targetPercentage).toFixed(1));

      return {
        assignmentNumber,
        assignmentKey,
        totalStudents: totalStudentsCount,
        submittedCount,
        submissionRate,
        previousWeekSubmittedCount: Math.max(0, submittedCount - newThisWeekSubmittedCount),
        newThisWeekSubmittedCount,
        targetPercentage,
        targetCount,
        actualCompletionRate: submissionRate,
        targetGapPercentage,
        studentsToTarget: targetCount === null ? null : Math.max(0, targetCount - submittedCount),
        gradedCount,
        gradedRate,
        zeroMarksCount,
        zeroMarksRate,
        pendingCount,
        pendingRate,
        pendingOrZeroCount,
        pendingOrZeroRate,
        fullMarksCount,
        fullMarksRate,
        above50Count,
        above50Rate,
        lowOrZeroCount: Math.max(0, gradedCount - above50Count + zeroMarksCount),
        avgMarks,
      };
    });

    const stats = {
      totalStudents: students.length,
      activeStudents: students.filter(
        (student) => !['Dropped', 'Completed'].includes(getCurrentStatus(student) || '')
      ).length,
      onTrackStudents: students.filter((student) => getCurrentStatus(student) === 'On Track')
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
    const lightweightStudents = students.map((s) => ({
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
