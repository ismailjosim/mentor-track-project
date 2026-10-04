/* eslint-disable @typescript-eslint/no-explicit-any */
import * as XLSX from 'xlsx';
import { z } from 'zod';

/**
 * Student import validation schema
 */
/**
 * Student import validation schema - ONLY name, email, and phone are required
 */
const StudentDataSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email format'),
  phone: z.string().min(10, 'Phone must be at least 10 digits'),
  whatsapp: z.string().optional(),
  cohort: z.string().optional(),
  division: z.string().optional(),
  district: z.string().optional(),
  town: z.string().optional(),
  livingArea: z.string().optional(),
  occupation: z.string().optional(),
  institute: z.string().optional(),
  educationalBackground: z.string().optional(),
  currentYear: z.string().optional(),
  workingDevice: z.enum(['Laptop', 'Desktop', 'Mobile']).optional(),
  currentStatus: z.enum(['On Track', 'Behind', 'At Risk', 'Dropped', 'Completed']).optional(),
  lastCompletedAssignment: z
    .enum(['A-01', 'A-02', 'A-03', 'A-04', 'A-05', 'A-06', 'A-07', 'A-08', 'A-09', 'A-10', 'None'])
    .optional(),
  mentorshipJoiningStatus: z.boolean().optional(),
  programType: z.enum(['EJP', 'SCIC', 'Both', 'Other']).optional(),
  scicMarks: z.number().min(0).max(100).optional(),
  scicConfirmed: z.boolean().optional(),
  comments: z.array(z.string()).optional(),
});

export type StudentImportData = z.infer<typeof StudentDataSchema>;

/**
 * Assignment import validation schema
 */
const AssignmentDataSchema = z.object({
  email: z.string().email('Invalid email format'),
});

export type AssignmentImportData = z.infer<typeof AssignmentDataSchema>;

/**
 * Parse CSV file to JSON array
 */
export async function parseCSV(file: File): Promise<Record<string, any>[]> {
  const text = await file.text();
  const workbook = XLSX.read(text, { type: 'string' });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) throw new Error('No sheet found in CSV file');

  const sheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(sheet) as Record<string, any>[];

  if (data.length === 0) throw new Error('CSV file is empty');
  return data;
}

/**
 * Parse XLSX file to JSON array
 */
export async function parseXLSX(file: File): Promise<Record<string, any>[]> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) throw new Error('No sheet found in Excel file');

  const sheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(sheet) as Record<string, any>[];

  if (data.length === 0) throw new Error('Excel file is empty');
  return data;
}

/**
 * Normalize phone number - remove non-digits and ensure 10+ digits
 */
export function formatPhoneNumber(phone: string | number | undefined | null): string {
  if (phone === undefined || phone === null) return '';
  const cleaned = phone.toString().replace(/\D/g, '');
  if (cleaned.length < 10) return '';
  // BD numbers often have 11 digits (e.g. 017xxxxxxxx)
  return cleaned.length > 11 && cleaned.startsWith('880') ? cleaned.slice(2) : cleaned;
}

/**
 * Normalize email - lowercase and trim
 */
export function normalizeEmail(email: string | undefined | null): string {
  if (!email) return '';
  return email.toString().toLowerCase().trim();
}

/**
 * Clean cohort string - extracts numbers if present, e.g. "batch-14" -> "14"
 */
export function cleanCohort(cohort: string | number | undefined | null): string | undefined {
  if (cohort === undefined || cohort === null || cohort === '') return undefined;
  const str = cohort.toString().trim();
  const match = str.match(/\d+/);
  return match ? match[0] : str;
}

/**
 * Normalize field names by converting to lowercase and removing non-alphanumeric characters
 */
function normalizeFieldName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Aliases for existing database fields
 */
const FIELD_ALIASES: Record<string, string[]> = {
  name: ['name', 'studentname', 'fullname', 'student', 'nam'],
  email: ['email', 'emailaddress', 'mail', 'emailid'],
  phone: ['phone', 'phonenumber', 'phoneno', 'mobile', 'mobileno', 'contact', 'cell', 'cellphone'],
  whatsapp: ['whatsapp', 'wa', 'wanumber', 'whatsappnumber', 'whatsappno'],
  cohort: ['cohort', 'batch', 'batchno', 'cohortbatch', 'batchnumber', 'batchname'],
  division: ['division', 'bibhag'],
  district: ['district', 'zila'],
  town: ['town', 'city', 'upazila', 'thana'],
  livingArea: ['livingarea', 'area', 'presentaddress', 'address', 'location'],
  occupation: ['occupation', 'profession', 'job'],
  institute: [
    'institute',
    'institution',
    'university',
    'college',
    'school',
    'varsity',
    'academicinstitute',
  ],
  educationalBackground: [
    'educationalbackground',
    'education',
    'background',
    'dept',
    'department',
    'subject',
    'degree',
  ],
  currentYear: ['currentyear', 'year', 'academicyear', 'session', 'semester'],
  workingDevice: ['workingdevice', 'device', 'laptopdesktop', 'devicetype'],
  currentStatus: ['currentstatus', 'status', 'studentstatus'],
  lastCompletedAssignment: [
    'lastcompletedassignment',
    'lastassignment',
    'assignment',
    'completedassignment',
  ],
  mentorshipJoiningStatus: [
    'mentorshipjoiningstatus',
    'mentorshipstatus',
    'mentorshipgroup',
    'groupstatus',
    'ingroup',
    'mentorship',
    'group',
  ],
  programType: ['programtype', 'program', 'track'],
  scicMarks: ['scicmarks', 'scicmark', 'marks'],
  scicConfirmed: ['scicconfirmed', 'scic'],
  comments: ['comments', 'comment', 'note', 'notes', 'remarks'],
};

/**
 * Detect column mapping
 */
export function detectColumnMapping(
  headers: string[],
  targetFields: string[]
): Record<string, number> {
  const mapping: Record<string, number> = {};
  const normalizedHeaders = headers.map(normalizeFieldName);

  for (const field of targetFields) {
    const normalizedField = normalizeFieldName(field);
    const index = normalizedHeaders.findIndex(
      (h) => h.includes(normalizedField) || normalizedField.includes(h)
    );
    if (index !== -1) {
      mapping[field] = index;
    }
  }

  return mapping;
}

/**
 * Helper to parse boolean values from various sheet formats
 */
function parseBoolean(val: any): boolean | undefined {
  if (val === undefined || val === null || val === '') return undefined;
  if (typeof val === 'boolean') return val;
  const s = val.toString().trim().toLowerCase();
  if (['true', 'yes', 'y', '1', 'in group', 'in-group', 'active'].includes(s)) return true;
  if (['false', 'no', 'n', '0', 'missing', 'not in group', 'not-in-group'].includes(s))
    return false;
  return undefined;
}

/**
 * Helper to normalize working device
 */
function parseWorkingDevice(val: any): 'Laptop' | 'Desktop' | 'Mobile' | undefined {
  if (!val) return undefined;
  const s = val.toString().trim().toLowerCase();
  if (s.includes('laptop')) return 'Laptop';
  if (s.includes('desktop') || s.includes('pc')) return 'Desktop';
  if (s.includes('mobile') || s.includes('phone')) return 'Mobile';
  return undefined;
}

/**
 * Helper to normalize student status
 */
function parseStudentStatus(
  val: any
): 'On Track' | 'Behind' | 'At Risk' | 'Dropped' | 'Completed' | undefined {
  if (!val) return undefined;
  const s = val.toString().trim().toLowerCase();
  if (s === 'on track' || s === 'ontrack') return 'On Track';
  if (s === 'behind') return 'Behind';
  if (s === 'at risk' || s === 'atrisk') return 'At Risk';
  if (s === 'dropped') return 'Dropped';
  if (s === 'completed') return 'Completed';
  return undefined;
}

/**
 * Helper to normalize last assignment
 */
function parseLastAssignment(val: any): StudentImportData['lastCompletedAssignment'] {
  if (!val) return undefined;
  const s = val.toString().trim().toUpperCase();
  if (s === 'NONE' || s === '0') return 'None';
  const match = s.match(/\d+/);
  if (match) {
    const num = parseInt(match[0], 10);
    if (num >= 1 && num <= 10) {
      return `A-${String(num).padStart(2, '0')}` as any;
    }
  }
  return undefined;
}

/**
 * Helper to normalize program type
 */
function parseProgramType(val: any): 'EJP' | 'SCIC' | 'Both' | 'Other' | undefined {
  if (!val) return undefined;
  const s = val.toString().trim().toUpperCase();
  if (s === 'EJP') return 'EJP';
  if (s === 'SCIC') return 'SCIC';
  if (s === 'BOTH') return 'Both';
  if (s === 'OTHER') return 'Other';
  return undefined;
}

/**
 * Validate student import data.
 * ONLY name, email, and phone are required.
 * Any other matching database field is captured; unknown fields are ignored.
 */
export function validateStudentData(
  row: any,
  defaultCohort: string = '14'
): {
  valid: boolean;
  data?: StudentImportData;
  errors?: string[];
} {
  try {
    // Map normalized row keys
    const normalizedKeyMap: Record<string, any> = {};
    for (const key of Object.keys(row)) {
      normalizedKeyMap[normalizeFieldName(key)] = row[key];
    }

    const getMatchedValue = (field: string) => {
      const aliases = FIELD_ALIASES[field] || [field.toLowerCase()];
      for (const alias of aliases) {
        if (
          normalizedKeyMap[alias] !== undefined &&
          normalizedKeyMap[alias] !== null &&
          normalizedKeyMap[alias] !== ''
        ) {
          return normalizedKeyMap[alias];
        }
      }
      return undefined;
    };

    const rawName = getMatchedValue('name');
    const rawEmail = getMatchedValue('email');
    const rawPhone = getMatchedValue('phone');
    const rawWhatsapp = getMatchedValue('whatsapp');
    const rawCohort = getMatchedValue('cohort');
    const rawDivision = getMatchedValue('division');
    const rawDistrict = getMatchedValue('district');
    const rawTown = getMatchedValue('town');
    const rawLivingArea = getMatchedValue('livingArea');
    const rawOccupation = getMatchedValue('occupation');
    const rawInstitute = getMatchedValue('institute');
    const rawEducationalBackground = getMatchedValue('educationalBackground');
    const rawCurrentYear = getMatchedValue('currentYear');
    const rawWorkingDevice = getMatchedValue('workingDevice');
    const rawCurrentStatus = getMatchedValue('currentStatus');
    const rawLastCompletedAssignment = getMatchedValue('lastCompletedAssignment');
    const rawMentorshipJoiningStatus = getMatchedValue('mentorshipJoiningStatus');
    const rawProgramType = getMatchedValue('programType');
    const rawScicMarks = getMatchedValue('scicMarks');
    const rawScicConfirmed = getMatchedValue('scicConfirmed');
    const rawComments = getMatchedValue('comments');

    const normalizedStudent: Record<string, any> = {
      name: rawName?.toString().trim() || '',
      email: normalizeEmail(rawEmail),
      phone: formatPhoneNumber(rawPhone),
      cohort: cleanCohort(rawCohort) || cleanCohort(defaultCohort) || '14',
    };

    if (rawWhatsapp) normalizedStudent.whatsapp = formatPhoneNumber(rawWhatsapp) || undefined;
    if (rawDivision) normalizedStudent.division = rawDivision.toString().trim();
    if (rawDistrict) normalizedStudent.district = rawDistrict.toString().trim();
    if (rawTown) normalizedStudent.town = rawTown.toString().trim();
    if (rawLivingArea) normalizedStudent.livingArea = rawLivingArea.toString().trim();
    if (rawOccupation) normalizedStudent.occupation = rawOccupation.toString().trim();
    if (rawInstitute) normalizedStudent.institute = rawInstitute.toString().trim();
    if (rawEducationalBackground)
      normalizedStudent.educationalBackground = rawEducationalBackground.toString().trim();
    if (rawCurrentYear) normalizedStudent.currentYear = rawCurrentYear.toString().trim();

    const device = parseWorkingDevice(rawWorkingDevice);
    if (device) normalizedStudent.workingDevice = device;

    const status = parseStudentStatus(rawCurrentStatus);
    if (status) normalizedStudent.currentStatus = status;

    const lastAssign = parseLastAssignment(rawLastCompletedAssignment);
    if (lastAssign) normalizedStudent.lastCompletedAssignment = lastAssign;

    const mentorship = parseBoolean(rawMentorshipJoiningStatus);
    if (mentorship !== undefined) normalizedStudent.mentorshipJoiningStatus = mentorship;

    const program = parseProgramType(rawProgramType);
    if (program) normalizedStudent.programType = program;

    if (rawScicMarks !== undefined && rawScicMarks !== null && rawScicMarks !== '') {
      const marks = Number(rawScicMarks);
      if (!Number.isNaN(marks) && marks >= 0 && marks <= 100) {
        normalizedStudent.scicMarks = marks;
      }
    }

    const scicConf = parseBoolean(rawScicConfirmed);
    if (scicConf !== undefined) normalizedStudent.scicConfirmed = scicConf;

    if (rawComments) {
      normalizedStudent.comments = Array.isArray(rawComments)
        ? rawComments.map((c: any) => c.toString().trim()).filter(Boolean)
        : [rawComments.toString().trim()].filter(Boolean);
    }

    const result = StudentDataSchema.parse(normalizedStudent);
    return { valid: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.issues.map((issue) => {
        const fieldName = issue.path.join('.');
        return fieldName ? `${fieldName}: ${issue.message}` : issue.message;
      });
      return {
        valid: false,
        errors: errorMessages,
      };
    }
    return { valid: false, errors: ['Unknown validation error'] };
  }
}

/**
 * Validate assignment import data (email only)
 */
export function validateAssignmentData(row: any): {
  valid: boolean;
  data?: AssignmentImportData;
  error?: string;
} {
  try {
    const normalized = {
      email: normalizeEmail(row.email),
    };

    const result = AssignmentDataSchema.parse(normalized);
    return { valid: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        valid: false,
        error: (error as any).errors.map((e: any) => e.message).join(', '),
      };
    }
    return { valid: false, error: 'Unknown validation error' };
  }
}

/**
 * Process student import file - returns preview with validation results
 */
export async function processStudentImportFile(
  file: File,
  defaultCohort: string = '14'
): Promise<{
  valid: boolean;
  headers: string[];
  rows: number;
  preview: any[];
  validRows: (StudentImportData & { rowIndex: number })[];
  invalidRows: { rowIndex: number; data: any; errors: string[] }[];
  duplicateEmails: { email: string; rowIndices: number[] }[];
}> {
  // Validate file type and size
  if (!file.name.match(/\.(csv|xlsx)$/i)) {
    throw new Error('File must be CSV or XLSX format');
  }

  if (file.size > 5 * 1024 * 1024) {
    throw new Error('File size must be under 5MB');
  }

  // Parse file
  let data: Record<string, any>[] = [];
  if (file.name.endsWith('.csv')) {
    data = await parseCSV(file);
  } else if (file.name.endsWith('.xlsx')) {
    data = await parseXLSX(file);
  } else {
    throw new Error('Unsupported file format');
  }

  const headers = Object.keys(data[0] || {});
  const validRows: (StudentImportData & { rowIndex: number })[] = [];
  const invalidRows: { rowIndex: number; data: any; errors: string[] }[] = [];
  const emailMap: Record<string, number[]> = {};

  // Validate each row
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const validation = validateStudentData(row, defaultCohort);

    if (validation.valid && validation.data) {
      validRows.push({ ...validation.data, rowIndex: i });
      if (!emailMap[validation.data.email]) {
        emailMap[validation.data.email] = [];
      }
      emailMap[validation.data.email].push(i);
    } else {
      invalidRows.push({
        rowIndex: i,
        data: row,
        errors: validation.errors || [],
      });
    }
  }

  // Find duplicate emails
  const duplicateEmails = Object.entries(emailMap)
    .filter(([, indices]) => indices.length > 1)
    .map(([email, indices]) => ({ email, rowIndices: indices }));

  return {
    valid: invalidRows.length === 0 && duplicateEmails.length === 0,
    headers,
    rows: data.length,
    preview: data.slice(0, 10),
    validRows,
    invalidRows,
    duplicateEmails,
  };
}

/**
 * Process assignment import file - returns preview with validation results
 */
export async function processAssignmentImportFile(file: File): Promise<{
  valid: boolean;
  headers: string[];
  rows: number;
  preview: any[];
  validEmails: string[];
  invalidRows: { rowIndex: number; data: any; error: string }[];
}> {
  // Validate file type and size
  if (!file.name.match(/\.(csv|xlsx)$/i)) {
    throw new Error('File must be CSV or XLSX format');
  }

  if (file.size > 5 * 1024 * 1024) {
    throw new Error('File size must be under 5MB');
  }

  // Parse file
  let data: Record<string, any>[] = [];
  if (file.name.endsWith('.csv')) {
    data = await parseCSV(file);
  } else if (file.name.endsWith('.xlsx')) {
    data = await parseXLSX(file);
  } else {
    throw new Error('Unsupported file format');
  }

  const headers = Object.keys(data[0] || {});
  const validEmails: string[] = [];
  const invalidRows: { rowIndex: number; data: any; error: string }[] = [];

  // Validate each row
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const validation = validateAssignmentData(row);

    if (validation.valid && validation.data) {
      validEmails.push(validation.data.email);
    } else {
      invalidRows.push({
        rowIndex: i,
        data: row,
        error: validation.error || 'Invalid row',
      });
    }
  }

  return {
    valid: invalidRows.length === 0,
    headers,
    rows: data.length,
    preview: data.slice(0, 10),
    validEmails,
    invalidRows,
  };
}
