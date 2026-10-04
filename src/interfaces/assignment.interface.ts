export type AssignmentStatus = 'PENDING' | 'SUBMITTED' | 'COMPLETED' | 'NOT_DEFINED';

export interface Assignment {
  assignmentNumber: number;
  status: AssignmentStatus;
  marks?: number;
  date?: Date;
  notes?: string;
}

// Alias for consistency
export type StudentAssignment = Assignment;
