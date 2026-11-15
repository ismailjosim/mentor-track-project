import { describe, expect, it } from 'vitest';
import {
  getMissedReleasedAssignmentCount,
  isAssignmentCompleted,
  isAssignmentSubmitted,
} from '../student-progress';

describe('isAssignmentSubmitted', () => {
  it('counts only submitted and completed statuses, independent of marks', () => {
    expect(isAssignmentSubmitted({ status: 'SUBMITTED' })).toBe(true);
    expect(isAssignmentSubmitted({ status: 'COMPLETED' })).toBe(true);
    expect(isAssignmentSubmitted({ status: 'PENDING' })).toBe(false);
    expect(isAssignmentSubmitted(null)).toBe(false);
  });

  it('does not count marks without a submitted status', () => {
    expect(isAssignmentSubmitted({ status: 'PENDING', marks: 0 })).toBe(false);
    expect(isAssignmentSubmitted({ status: 'PENDING', marks: 35 })).toBe(false);
  });
});

describe('assignment progress', () => {
  it('keeps submitted and completed status semantics consistent when counting missed work', () => {
    expect(
      getMissedReleasedAssignmentCount(
        [
          { assignmentNumber: 1, status: 'SUBMITTED' },
          { assignmentNumber: 2, status: 'COMPLETED' },
          { assignmentNumber: 3, status: 'PENDING', marks: 40 },
        ],
        3
      )
    ).toBe(1);
  });

  it('does not treat a zero score as completed', () => {
    expect(isAssignmentCompleted({ status: 'SUBMITTED', marks: 0 })).toBe(false);
  });
});
