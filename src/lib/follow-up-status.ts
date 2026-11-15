import type { FollowUpStatus } from '../models/FollowUp';

export const getEffectiveFollowUpStatus = (
  status: FollowUpStatus | undefined,
  date: Date,
  now = new Date()
): FollowUpStatus => {
  if (status === 'completed') return 'completed';
  return status === 'overdue' || date < now ? 'overdue' : 'pending';
};
