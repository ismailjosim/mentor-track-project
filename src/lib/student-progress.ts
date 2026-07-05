/* eslint-disable @typescript-eslint/no-explicit-any */

export const formatAssignmentKey = (assignmentNumber: number) =>
  `A-${String(assignmentNumber).padStart(2, '0')}`;

export const parseAssignmentNumber = (assignment: string | undefined | null) => {
  if (!assignment) return null;

  const assignmentNumber = parseInt(assignment.split('-')[1], 10);
  return Number.isNaN(assignmentNumber) ? null : assignmentNumber;
};

export const isAssignmentSubmitted = (assignment: any) =>
  assignment?.status === 'SUBMITTED' || assignment?.status === 'COMPLETED';

export const getHighestCompletedAssignment = (assignments: any[] = []) =>
  assignments.reduce((highest, assignment) => {
    if (!assignment?.assignmentNumber) return highest;
    if (!isAssignmentSubmitted(assignment)) return highest;
    return Math.max(highest, assignment.assignmentNumber);
  }, 0);

export const getMissedReleasedAssignmentCount = (
  assignments: any[] = [],
  currentAssignment: number
) =>
  Array.from({ length: currentAssignment }, (_, index) => index + 1).filter((assignmentNumber) => {
    const assignment = assignments.find((item) => item.assignmentNumber === assignmentNumber);
    return !isAssignmentSubmitted(assignment);
  }).length;

export const getStatusFromMissedCount = (missedCount: number) => {
  if (missedCount === 0) return 'On Track';
  if (missedCount === 1) return 'Behind';
  return 'At Risk';
};

export const resolveStudentProgress = (student: any, currentAssignmentNumber: number) => {
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
    highestCompletedAssignment > 0
      ? formatAssignmentKey(highestCompletedAssignment)
      : student?.lastCompletedAssignment || 'None';

  return {
    nextStatus,
    lastCompletedAssignment,
    missedAssignmentCount,
    highestCompletedAssignment,
  };
};
