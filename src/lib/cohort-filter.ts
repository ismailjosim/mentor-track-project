import type { QueryFilter } from 'mongoose';
import type { StudentDocument } from '@/models/Student';

export function buildCohortFilter(ownerId?: string, cohort?: string): QueryFilter<StudentDocument> {
  const filter: QueryFilter<StudentDocument> = {};
  if (ownerId) {
    filter.ownerId = ownerId;
  }
  if (cohort && cohort !== 'all') {
    const cleaned = cohort.trim().replace(/[^\d]/g, '');
    filter.cohort = cleaned || cohort;
  }
  return filter;
}
