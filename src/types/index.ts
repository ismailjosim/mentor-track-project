/* eslint-disable @typescript-eslint/no-explicit-any */
// ==================== ENUMS & TYPES ====================

export type AgeRange = '16-17' | '18-19' | '20-25' | '26-30' | '31-40' | '41-50' | '50+';
export type WorkingDevice = 'Laptop' | 'Desktop' | 'Mobile';
export type StudentStatus = 'On Track' | 'Behind' | 'At Risk' | 'Dropped' | 'Completed';
export type ProgramType = 'EJP' | 'SCIC' | 'Both' | 'Other';
export type AssignmentStatus = 'PENDING' | 'SUBMITTED' | 'COMPLETED';
export type LastCompletedAssignment =
  'A-01' | 'A-02' | 'A-03' | 'A-04' | 'A-05' | 'A-06' | 'A-07' | 'A-08' | 'A-09' | 'A-10' | 'None';
export type CallLogStatus =
  'RECEIVED' | 'NOT_RECEIVED' | 'PHONE_OFF' | 'SWITCHED_OFF' | 'FOREIGN_NUMBER';
export type Priority = 'low' | 'medium' | 'high';

export interface StudentAssignment {
  assignment?: number;
  assignmentNumber?: number;
  status: AssignmentStatus;
  marks?: number;
  submittedDate?: Date;
  completedDate?: Date;
}

// ==================== API RESPONSE TYPES ====================

export interface ApiResponse<T = unknown> {
  statusCode: number;
  message: string;
  data?: T;
  errors?: Array<{ field?: string; message: string }>;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// ==================== DASHBOARD TYPES ====================

export interface DashboardStats {
  totalStudents: number;
  activeStudents: number;
  onTrackStudents: number;
  atRiskStudents: number;
  completedStudents: number;
  totalAssignments: number;
  pendingAssignments: number;
  completedAssignments: number;
  totalCallLogs: number;
  totalFollowUps: number;
  pendingFollowUps: number;
}

// ==================== EXTENDED INTERFACES ====================

export interface StudentWithRelations {
  _id: string;
  name: string;
  email: string;
  phone: string;
  whatsapp?: string;
  cohort?: string;
  division?: string;
  district?: string;
  town?: string;
  livingArea?: string;
  occupation?: string;
  institute?: string;
  educationalBackground?: string;
  currentYear?: string;
  ageRange?: AgeRange;
  workingDevice?: WorkingDevice;
  currentStatus?: StudentStatus;
  lastCompletedAssignment?: LastCompletedAssignment;
  mentorshipJoiningStatus?: boolean;
  programType?: ProgramType;
  scicMarks?: number;
  scicConfirmed?: boolean;
  callLogs?: any[];
  assignments?: StudentAssignment[];
  followUps?: any[];
  comments?: string[];
  lastContactedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface StudentSummary {
  totalStudents: number;
  byStatus: Record<StudentStatus, number>;
  byAgeRange: Record<AgeRange, number>;
  byWorkingDevice: Record<WorkingDevice, number>;
}

// ==================== FILTER TYPES ====================

export interface StudentFilterOptions {
  status?: StudentStatus;
  cohort?: string;
  ageRange?: AgeRange;
  workingDevice?: WorkingDevice;
  division?: string;
  institute?: string;
  search?: string;
}

export interface AssignmentFilterOptions {
  status?: AssignmentStatus;
  studentId?: string;
  fromDate?: Date;
  toDate?: Date;
}

export interface CallLogFilterOptions {
  status?: CallLogStatus;
  studentId?: string;
  fromDate?: Date;
  toDate?: Date;
}
