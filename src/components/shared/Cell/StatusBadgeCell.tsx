'use client';

import { getStatusBadgeClass } from '@/lib/ui-helpers';
import type { StudentStatus } from '@/models/Student';

interface StatusBadgeCellProps {
  status: StudentStatus | string;
}

export function StatusBadgeCell({ status }: StatusBadgeCellProps) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${getStatusBadgeClass(
        (status || 'On Track') as StudentStatus
      )}`}
    >
      {status}
    </span>
  );
}

export default StatusBadgeCell;
