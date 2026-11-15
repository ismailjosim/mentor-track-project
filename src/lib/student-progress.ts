import type { StudentAssignment, StudentDocument, StudentStatus } from '@/models/Student';

type AssignmentProgress = Pick<StudentAssignment, 'assignmentNumber' | 'status' | 'marks'>;

type StudentProgressInput = Pick<StudentDocument, 'assignments' | 'currentStatus'>;

export const formatAssignmentKey = (assignmentNumber: number) =>
  `A-${String(assignmentNumber).padStart(2, '0')}`;

export const parseAssignmentNumber = (assignment: string | undefined | null) => {
  if (!assignment) return null;

  const assignmentNumber = parseInt(assignment.split('-')[1], 10);
  return Number.isNaN(assignmentNumber) ? null : assignmentNumber;
};

export const isAssignmentSubmitted = (
  assignment?: Pick<StudentAssignment, 'status' | 'marks'> | null
): boolean => assignment?.status === 'SUBMITTED' || assignment?.status === 'COMPLETED';

/**
 * An assignment is completed only if status is COMPLETED or it has marks > 0.
 * Submitted assignments with 0 marks or pending marks are considered PENDING grading.
 */
export const isAssignmentCompleted = (
  assignment?: Pick<StudentAssignment, 'status' | 'marks'> | null
): boolean =>
  assignment?.status === 'COMPLETED' ||
  (typeof assignment?.marks === 'number' &&
    !Number.isNaN(assignment.marks) &&
    assignment.marks > 0);

export const getHighestCompletedAssignment = (assignments: AssignmentProgress[] = []) =>
  assignments.reduce((highest, assignment) => {
    if (!assignment?.assignmentNumber) return highest;
    if (!isAssignmentCompleted(assignment)) return highest;
    return Math.max(highest, assignment.assignmentNumber);
  }, 0);

export const getMissedReleasedAssignmentCount = (
  assignments: AssignmentProgress[] = [],
  currentAssignment: number
) =>
  Array.from({ length: currentAssignment }, (_, index) => index + 1).filter((assignmentNumber) => {
    const assignment = assignments.find((item) => item.assignmentNumber === assignmentNumber);
    return !isAssignmentSubmitted(assignment);
  }).length;

export const getStatusFromMissedCount = (missedCount: number): StudentStatus => {
  if (missedCount === 0) return 'On Track';
  if (missedCount === 1) return 'Behind';
  return 'At Risk';
};

export const resolveStudentProgress = (
  student: StudentProgressInput | null | undefined,
  currentAssignmentNumber: number
) => {
  const assignments = student?.assignments || [];
  const highestCompletedAssignment = getHighestCompletedAssignment(assignments);
  const missedAssignmentCount = getMissedReleasedAssignmentCount(
    assignments,
    currentAssignmentNumber
  );
  const isAheadOfCurrent = highestCompletedAssignment >= currentAssignmentNumber;

  const nextStatus =
    student?.currentStatus === 'Dropped' || student?.currentStatus === 'Completed'
      ? student.currentStatus
      : isAheadOfCurrent && missedAssignmentCount === 0
        ? 'On Track'
        : getStatusFromMissedCount(missedAssignmentCount);

  const lastCompletedAssignment =
    highestCompletedAssignment > 0 ? formatAssignmentKey(highestCompletedAssignment) : 'None';

  return {
    nextStatus,
    lastCompletedAssignment,
    missedAssignmentCount,
    highestCompletedAssignment,
  };
};
