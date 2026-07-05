// App Constants

export const APP_NAME = 'MentorTrack';
export const APP_DESCRIPTION = 'Student Mentorship Management System';

// API Routes
export const API_ROUTES = {
  HEALTH: '/api/health',
  STUDENTS: '/api/students',
  STUDENT_DETAIL: '/api/students/:id',
  ASSIGNMENTS: '/api/assignments',
  ASSIGNMENT_DETAIL: '/api/assignments/:id',
  CALL_LOGS: '/api/call-logs',
  CALL_LOG_DETAIL: '/api/call-logs/:id',
  FOLLOW_UPS: '/api/follow-ups',
  FOLLOW_UP_DETAIL: '/api/follow-ups/:id',
  DASHBOARD: '/api/dashboard',
};

// Page Routes
export const PAGE_ROUTES = {
  HOME: '/',
  DASHBOARD: '/dashboard',
  STUDENTS: '/students',
  STUDENT_DETAIL: '/students/:id',
  BULK_UPDATE: '/bulk-update',
  REPORTS: '/reports',
};

// Student Status
export const STUDENT_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  GRADUATED: 'graduated',
  DROPPED: 'dropped',
} as const;

export const STUDENT_STATUS_LABELS: Record<string, string> = {
  active: 'Active',
  inactive: 'Inactive',
  graduated: 'Graduated',
  dropped: 'Dropped',
};

// Assignment Status
export const ASSIGNMENT_STATUS = {
  PENDING: 'pending',
  SUBMITTED: 'submitted',
  GRADED: 'graded',
  OVERDUE: 'overdue',
} as const;

export const ASSIGNMENT_STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  submitted: 'Submitted',
  graded: 'Graded',
  overdue: 'Overdue',
};

// CallLog Status
export const CALLLOG_STATUS = {
  COMPLETED: 'completed',
  MISSED: 'missed',
  SCHEDULED: 'scheduled',
} as const;

export const CALLLOG_STATUS_LABELS: Record<string, string> = {
  completed: 'Completed',
  missed: 'Missed',
  scheduled: 'Scheduled',
};

// CallLog Type
export const CALLLOG_TYPE = {
  PHONE: 'phone',
  VIDEO: 'video',
  MESSAGE: 'message',
} as const;

export const CALLLOG_TYPE_LABELS: Record<string, string> = {
  phone: 'Phone',
  video: 'Video',
  message: 'Message',
};

// FollowUp Status
export const FOLLOWUP_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in-progress',
  COMPLETED: 'completed',
} as const;

export const FOLLOWUP_STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  'in-progress': 'In Progress',
  completed: 'Completed',
};

// Priority Levels
export const PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
} as const;

export const PRIORITY_LABELS: Record<string, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
};

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
} as const;

// UI Messages
export const MESSAGES = {
  SUCCESS: 'Operation completed successfully',
  ERROR: 'An error occurred. Please try again.',
  DELETE_CONFIRM: 'Are you sure you want to delete this item?',
  LOADING: 'Loading...',
  NO_DATA: 'No data available',
};
