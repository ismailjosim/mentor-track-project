import type { StudentStatus } from '@/interfaces/student.interface';
import type { AssignmentStatus } from '@/interfaces/assignment.interface';
import type { CallLogStatus } from '@/interfaces/callLog.interface';

export function getStatusBadgeClass(status: StudentStatus): string {
  switch (status) {
    case 'On Track':
      return 'status-success';
    case 'Behind':
      return 'status-warning';
    case 'At Risk':
      return 'status-danger';
    case 'Dropped':
      return 'status-neutral';
    case 'Completed':
      return 'status-info';
    default:
      return 'status-neutral';
  }
}

export function getAssignmentStatusClass(status: AssignmentStatus): string {
  switch (status) {
    case 'COMPLETED':
      return 'bg-green-500';
    case 'SUBMITTED':
      return 'bg-blue-400';
    case 'PENDING':
      return 'bg-muted';
    case 'NOT_DEFINED':
    default:
      return 'bg-muted/40';
  }
}

export function getCallLogStatusLabel(status: CallLogStatus): string {
  switch (status) {
    case 'RECEIVED':
      return 'Received';
    case 'NOT_RECEIVED':
      return 'Not Received';
    case 'PHONE_OFF':
      return 'Phone Off';
    case 'SWITCHED_OFF':
      return 'Switched Off';
    case 'FOREIGN_NUMBER':
      return 'Foreign Number';
    case 'BUSY':
      return 'Busy';
    default:
      return status;
  }
}

export function getCallLogStatusClass(status: CallLogStatus): string {
  switch (status) {
    case 'RECEIVED':
      return 'status-success';
    case 'NOT_RECEIVED':
      return 'status-warning';
    case 'PHONE_OFF':
    case 'SWITCHED_OFF':
      return 'status-danger';
    case 'FOREIGN_NUMBER':
      return 'bg-secondary text-secondary-foreground';
    case 'BUSY':
      return 'status-warning';
    default:
      return 'status-neutral';
  }
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function getLastAssignmentNumber(lastCompleted: string | undefined): number {
  if (!lastCompleted || lastCompleted === 'None') return 0;
  return parseInt(lastCompleted.replace('A-', ''), 10);
}

export function getProgressPercent(lastCompleted: string | undefined): number {
  return getLastAssignmentNumber(lastCompleted) * 10;
}
