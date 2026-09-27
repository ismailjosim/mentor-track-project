export type AgeRange = '16-17' | '18-19' | '20-25' | '26-30' | '31-40' | '41-50' | '50+';
export type WorkingDevice = 'Laptop' | 'Desktop' | 'Mobile';
export type StudentStatus = 'On Track' | 'Behind' | 'At Risk' | 'Dropped' | 'Completed';
export type ProgramType = 'EJP' | 'SCIC' | 'Both' | 'Other';
export type LastCompletedAssignment =
  'A-01' | 'A-02' | 'A-03' | 'A-04' | 'A-05' | 'A-06' | 'A-07' | 'A-08' | 'A-09' | 'A-10' | 'None';

export interface Student {
  _id?: string;
  // Basic Info
  name: string;
  email: string;
  phone: string;
  whatsapp?: string;

  // Location
  division?: string;
  district?: string;
  town?: string;
  livingArea?: string;

  // Academic
  occupation?: string;
  institute?: string;
  educationalBackground?: string;
  currentYear?: string;
  ageRange?: AgeRange;

  // Device
  workingDevice?: WorkingDevice;

  // Progress
  currentStatus?: StudentStatus;
  lastCompletedAssignment?: LastCompletedAssignment;
  mentorshipJoiningStatus?: boolean;

  // Relations
  callLogs?: string[];
  assignments?: string[];
  followUps?: string[];

  // Metadata
  lastContactedAt?: Date;
  comments?: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface StudentCreateInput {
  name: string;
  email: string;
  phone: string;
  whatsapp?: string;
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
  comments?: string[];
}

export interface StudentUpdateInput {
  name?: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
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
  comments?: string[];
}
