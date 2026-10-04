export type AssignmentStatus = 'PENDING' | 'SUBMITTED' | 'COMPLETED' | 'NOT_DEFINED';

/** Which deadline / marks tier the student submitted under */
export type AssignmentMaxMarks = 60 | 50 | 30;

export interface Assignment {
  assignmentNumber: number;
  status: AssignmentStatus;
  marks?: number;
  /** Maximum possible marks for this submission tier (60 = first deadline, 50 = second, 30 = no deadline) */
  maxMarks?: AssignmentMaxMarks;
  date?: Date;
  notes?: string;
}

// Alias for consistency
export type StudentAssignment = Assignment;
