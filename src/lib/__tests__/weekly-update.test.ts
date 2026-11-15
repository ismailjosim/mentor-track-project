import { describe, expect, it } from 'vitest';
import {
  calculateWeeklyAssignmentChange,
  getTopCallIssues,
  getTuesdayWeeklyPeriodStart,
} from '../weekly-update';

describe('getTuesdayWeeklyPeriodStart', () => {
  it('uses the latest Tuesday as the baseline during the week', () => {
    expect(getTuesdayWeeklyPeriodStart(new Date('2026-11-15T08:00:00.000Z')).toISOString()).toBe(
      '2026-11-09T18:00:00.000Z'
    );
  });

  it('uses the previous Tuesday as the baseline on Tuesday', () => {
    expect(getTuesdayWeeklyPeriodStart(new Date('2026-11-17T08:00:00.000Z')).toISOString()).toBe(
      '2026-11-09T18:00:00.000Z'
    );
  });
});

describe('calculateWeeklyAssignmentChange', () => {
  it('calculates prior total, relative growth, and cohort percentage points', () => {
    expect(calculateWeeklyAssignmentChange(60, 10, 200)).toEqual({
      previousSubmitted: 50,
      newSubmissions: 10,
      relativeChangePercent: 20,
      cohortIncreasePercent: 5,
    });
  });

  it('does not report relative growth when there was no previous submission', () => {
    expect(calculateWeeklyAssignmentChange(4, 4, 100)).toEqual({
      previousSubmitted: 0,
      newSubmissions: 4,
      relativeChangePercent: null,
      cohortIncreasePercent: 4,
    });
  });
});

describe('getTopCallIssues', () => {
  it('normalizes duplicate issue text and counts unique students', () => {
    expect(
      getTopCallIssues([
        { issues: 'Work schedule conflicts', studentId: 'student-1' },
        { issues: ' work   schedule conflicts ', studentId: 'student-1' },
        { issues: 'Health issue', studentId: 'student-2' },
        { issues: '   ', studentId: 'student-3' },
      ])
    ).toEqual([
      { issue: 'Work schedule conflicts', calls: 2, students: 1 },
      { issue: 'Health issue', calls: 1, students: 1 },
    ]);
  });
});
