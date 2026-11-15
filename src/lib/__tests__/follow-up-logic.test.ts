import { describe, expect, it } from 'vitest';
import { getEffectiveFollowUpStatus } from '../follow-up-status';

describe('getEffectiveFollowUpStatus', () => {
  const now = new Date('2026-11-15T12:00:00.000Z');

  it('reports expired pending follow-ups as overdue without requiring a stored transition', () => {
    expect(getEffectiveFollowUpStatus('pending', new Date('2026-11-14T12:00:00.000Z'), now)).toBe(
      'overdue'
    );
  });

  it('preserves completed status and future pending status', () => {
    expect(getEffectiveFollowUpStatus('completed', new Date('2026-11-14T12:00:00.000Z'), now)).toBe(
      'completed'
    );
    expect(getEffectiveFollowUpStatus('pending', new Date('2026-11-16T12:00:00.000Z'), now)).toBe(
      'pending'
    );
  });
});
