/* eslint-disable @typescript-eslint/no-explicit-any */
import { z } from 'zod';

// Type definitions
export type AgeRange = '16-17' | '18-19' | '20-25' | '26-30' | '31-40' | '41-50' | '50+';
export type WorkingDevice = 'Laptop' | 'Desktop' | 'Mobile';
export type StudentStatus = 'On Track' | 'Behind' | 'At Risk' | 'Dropped' | 'Completed';
export type LastCompletedAssignment =
  'A-01' | 'A-02' | 'A-03' | 'A-04' | 'A-05' | 'A-06' | 'A-07' | 'A-08' | 'A-09' | 'A-10' | 'None';
export type AssignmentStatus = 'PENDING' | 'SUBMITTED' | 'COMPLETED';
export type CallLogStatus =
  'RECEIVED' | 'NOT_RECEIVED' | 'PHONE_OFF' | 'SWITCHED_OFF' | 'FOREIGN_NUMBER' | 'BUSY';

// ==================== ASSIGNMENT SCHEMAS ====================

export const StudentAssignmentSchema = z.object({
  assignment: z.number().int().min(1).max(10),
  status: z.enum(['PENDING', 'SUBMITTED', 'COMPLETED']).default('PENDING'),
  marks: z.number().min(0).max(100).optional(),
  submittedDate: z.coerce.date().optional(),
  completedDate: z.coerce.date().optional(),
});

// ==================== STUDENT SCHEMAS ====================

export const StudentCreateSchema = z.object({
  name: z.string().min(1, 'Name is required').trim(),
  email: z.string().email('Invalid email address').toLowerCase().trim(),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  whatsapp: z.string().optional(),
  division: z.string().optional(),
  district: z.string().optional(),
  town: z.string().optional(),
  livingArea: z.string().optional(),
  occupation: z.string().optional(),
  institute: z.string().optional(),
  educationalBackground: z.string().optional(),
  currentYear: z.string().optional(),
  ageRange: z.enum(['16-17', '18-19', '20-25', '26-30', '31-40', '41-50', '50+']).optional(),
  workingDevice: z.enum(['Laptop', 'Desktop', 'Mobile']).optional(),
  currentStatus: z.enum(['On Track', 'Behind', 'At Risk', 'Dropped', 'Completed']).optional(),
  lastCompletedAssignment: z
    .enum(['A-01', 'A-02', 'A-03', 'A-04', 'A-05', 'A-06', 'A-07', 'A-08', 'A-09', 'A-10', 'None'])
    .optional(),
  mentorshipJoiningStatus: z.boolean().optional(),
  programType: z.enum(['EJP', 'SCIC', 'Both', 'Other']).optional(),
  scicMarks: z.number().min(0).max(100).optional(),
  scicConfirmed: z.boolean().optional(),
  assignments: z.array(StudentAssignmentSchema).optional(),
  comments: z.array(z.string()).optional(),
});

export const StudentUpdateSchema = StudentCreateSchema.partial();

// ==================== STUDENT ASSIGNMENT UPDATE SCHEMAS ====================

export const UpdateStudentAssignmentSchema = z.object({
  assignmentNumber: z.number().int().min(1).max(10),
  status: z.enum(['PENDING', 'SUBMITTED', 'COMPLETED']).optional(),
  marks: z.number().min(0).max(100).optional(),
  date: z.coerce.date().optional(),
});

export const BulkAssignmentSubmitSchema = z.object({
  assignmentNumber: z
    .number()
    .int()
    .min(1, 'Assignment number must be between 1 and 10')
    .max(10, 'Assignment number must be between 1 and 10'),
  emails: z.array(z.string().email('Invalid email')).min(1, 'At least one email is required'),
  submittedDate: z.coerce.date().optional(),
});

// Legacy assignment schemas (kept for backward compatibility during migration)
export const AssignmentCreateSchema = StudentAssignmentSchema.extend({
  studentId: z.string().min(1, 'Student ID is required'),
});

export const AssignmentUpdateSchema = AssignmentCreateSchema.partial().omit({ studentId: true });

export const AssignmentStatusSchema = z.object({
  status: z.enum(['PENDING', 'SUBMITTED', 'COMPLETED']),
  completedDate: z.coerce.date().optional(),
});

export const AssignmentBulkSubmitSchema = BulkAssignmentSubmitSchema;

// ==================== CALLLOG SCHEMAS ====================

export const CallLogCreateSchema = z.object({
  date: z.coerce.date().refine((date) => date <= new Date(), 'Date cannot be in the future'),
  status: z.enum([
    'RECEIVED',
    'NOT_RECEIVED',
    'PHONE_OFF',
    'SWITCHED_OFF',
    'FOREIGN_NUMBER',
    'BUSY',
  ]),
  notes: z.string().optional(),
  calledBy: z.string().optional(),
  issues: z.string().optional(),
  promised: z.string().optional(),
  nextFollowUp: z.coerce.date().optional(),
  studentId: z.string().min(1, 'Student ID is required'),
});

export const CallLogUpdateSchema = CallLogCreateSchema.partial().omit({ studentId: true });

export const CallLogBatchSchema = z.object({
  callLogs: z.array(CallLogCreateSchema),
});

// ==================== FOLLOWUP SCHEMAS ====================

export const FollowUpCreateSchema = z.object({
  date: z.coerce.date().refine((date) => date > new Date(), 'Date must be in the future'),
  note: z.string().min(1, 'Follow-up note is required'),
  studentId: z.string().min(1, 'Student ID is required'),
});

export const FollowUpUpdateSchema = z.object({
  date: z.coerce
    .date()
    .refine((date) => date > new Date(), 'Date must be in the future')
    .optional(),
  note: z.string().min(1, 'Follow-up note is required').optional(),
  status: z.enum(['pending', 'completed', 'overdue']).optional(),
  completedDate: z.coerce.date().optional(),
});

export const FollowUpCompleteSchema = z.object({
  completedDate: z.coerce.date().optional(),
});

// ==================== UTILITY SCHEMAS ====================

export const PaginationSchema = z.object({
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(10),
});

// ==================== TYPE EXPORTS ====================

export type StudentCreate = z.infer<typeof StudentCreateSchema>;
export type StudentUpdate = z.infer<typeof StudentUpdateSchema>;
export type AssignmentCreate = z.infer<typeof AssignmentCreateSchema>;
export type AssignmentUpdate = z.infer<typeof AssignmentUpdateSchema>;
export type CallLogCreate = z.infer<typeof CallLogCreateSchema>;
export type CallLogUpdate = z.infer<typeof CallLogUpdateSchema>;
export type CallLogBatch = z.infer<typeof CallLogBatchSchema>;
export type FollowUpCreate = z.infer<typeof FollowUpCreateSchema>;
export type FollowUpUpdate = z.infer<typeof FollowUpUpdateSchema>;
export type FollowUpComplete = z.infer<typeof FollowUpCompleteSchema>;
export type Pagination = z.infer<typeof PaginationSchema>;

// ==================== UTILITY FUNCTIONS ====================

/**
 * Email validation utility
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Phone number formatter - removes all non-digit characters
 */
export const formatPhoneNumber = (phone: string): string => {
  return phone.replace(/\D/g, '');
};

/**
 * Phone number validation
 */
export const isValidPhoneNumber = (phone: string): boolean => {
  const formatted = formatPhoneNumber(phone);
  return formatted.length >= 10 && formatted.length <= 15;
};

/**
 * Date validation utility - ensures date is not in future
 */
export const isValidPastDate = (date: Date): boolean => {
  return date <= new Date();
};

/**
 * Date validation utility - ensures date is valid
 */
export const isValidDate = (date: any): date is Date => {
  return date instanceof Date && !isNaN(date.getTime());
};

/**
 * Student data validation with parsing
 */
export const validateStudentData = (data: any) => {
  return StudentCreateSchema.parse(data);
};

/**
 * Assignment data validation with parsing
 */
export const validateAssignmentData = (data: any) => {
  return AssignmentCreateSchema.parse(data);
};

/**
 * Call log data validation with parsing
 */
export const validateCallLogData = (data: any) => {
  return CallLogCreateSchema.parse(data);
};

/**
 * Follow-up data validation with parsing
 */
export const validateFollowUpData = (data: any) => {
  return FollowUpCreateSchema.parse(data);
};

/**
 * Safe validation wrapper - returns error message instead of throwing
 */
export const safeValidate = <T = unknown>(
  schema: z.ZodSchema,
  data: unknown
): { success: boolean; data?: T; error?: string } => {
  try {
    const result = schema.parse(data) as T;
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    return { success: false, error: 'Validation failed' };
  }
};
