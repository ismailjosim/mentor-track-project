/**
 * Cache configuration constants - Next.js v16
 * Uses on-demand revalidation only (no time-based expiry)
 * Client-safe module - no server-only API imports
 */

/**
 * Cache configuration for different data types
 * Defines cache tags used with Next.js Data Cache
 * Revalidation happens only on mutations via revalidateTag()
 */
export const CACHE_CONFIG = {
  // Dashboard
  DASHBOARD_STATS: {
    tag: 'dashboard-stats',
  },
  FAILING_STUDENTS: {
    tag: 'failing-students',
  },
  CALL_QUEUE_STUDENTS: {
    tag: 'call-queue-students',
  },

  // Students
  ALL_STUDENTS: {
    tag: 'all-students',
  },
  STUDENT_DETAIL: (id: string) => ({
    tag: `student-${id}`,
  }),
  STUDENT_LIST: {
    tag: 'student-list',
  },

  // Assignments & Tracking
  ASSIGNMENTS: {
    tag: 'assignments',
  },
  ASSIGNMENT_DETAIL: (id: string) => ({
    tag: `assignment-${id}`,
  }),

  // Call Logs & Follow-ups
  CALL_LOGS: {
    tag: 'call-logs',
  },
  FOLLOW_UPS: {
    tag: 'follow-ups',
  },

  // Settings
  SETTINGS: {
    tag: 'settings',
  },
  CURRENT_ASSIGNMENT: {
    tag: 'current-assignment',
  },

  // Reports
  CALL_STATISTICS: {
    tag: 'call-statistics',
  },
  SUBMISSION_DATA: {
    tag: 'submission-data',
  },
  REPORTS: {
    tag: 'reports',
  },
} as const;

/**
 * Cache revalidation triggers
 * Maps mutations to cache tags that should be invalidated
 */
export const CACHE_REVALIDATION_TRIGGERS = {
  // When student is created/updated/deleted
  updateStudent: [
    CACHE_CONFIG.ALL_STUDENTS.tag,
    CACHE_CONFIG.STUDENT_LIST.tag,
    CACHE_CONFIG.FAILING_STUDENTS.tag,
    CACHE_CONFIG.CALL_QUEUE_STUDENTS.tag,
    CACHE_CONFIG.DASHBOARD_STATS.tag,
    CACHE_CONFIG.SUBMISSION_DATA.tag,
  ],

  // When assignment is updated
  updateAssignment: [
    CACHE_CONFIG.ASSIGNMENTS.tag,
    CACHE_CONFIG.ALL_STUDENTS.tag,
    CACHE_CONFIG.STUDENT_LIST.tag,
    CACHE_CONFIG.FAILING_STUDENTS.tag,
    CACHE_CONFIG.CALL_QUEUE_STUDENTS.tag,
    CACHE_CONFIG.DASHBOARD_STATS.tag,
    CACHE_CONFIG.SUBMISSION_DATA.tag,
  ],

  // When call log is added
  addCallLog: [
    CACHE_CONFIG.CALL_LOGS.tag,
    CACHE_CONFIG.CALL_STATISTICS.tag,
    CACHE_CONFIG.CALL_QUEUE_STUDENTS.tag,
    CACHE_CONFIG.DASHBOARD_STATS.tag,
  ],

  // When follow-up is added
  addFollowUp: [
    CACHE_CONFIG.FOLLOW_UPS.tag,
    CACHE_CONFIG.CALL_QUEUE_STUDENTS.tag,
    CACHE_CONFIG.DASHBOARD_STATS.tag,
  ],

  // When settings change
  updateSettings: [
    CACHE_CONFIG.SETTINGS.tag,
    CACHE_CONFIG.CALL_QUEUE_STUDENTS.tag,
    CACHE_CONFIG.FAILING_STUDENTS.tag,
    CACHE_CONFIG.DASHBOARD_STATS.tag,
  ],
} as const;

/**
 * Export cache tags for use in fetch requests
 * Usage: fetch(url, { next: { tags: [CACHE_TAGS.STUDENTS] } })
 */
export const CACHE_TAGS = {
  DASHBOARD_STATS: CACHE_CONFIG.DASHBOARD_STATS.tag,
  FAILING_STUDENTS: CACHE_CONFIG.FAILING_STUDENTS.tag,
  CALL_QUEUE_STUDENTS: CACHE_CONFIG.CALL_QUEUE_STUDENTS.tag,
  ALL_STUDENTS: CACHE_CONFIG.ALL_STUDENTS.tag,
  STUDENT_LIST: CACHE_CONFIG.STUDENT_LIST.tag,
  ASSIGNMENTS: CACHE_CONFIG.ASSIGNMENTS.tag,
  CALL_LOGS: CACHE_CONFIG.CALL_LOGS.tag,
  FOLLOW_UPS: CACHE_CONFIG.FOLLOW_UPS.tag,
  SETTINGS: CACHE_CONFIG.SETTINGS.tag,
  CURRENT_ASSIGNMENT: CACHE_CONFIG.CURRENT_ASSIGNMENT.tag,
  CALL_STATISTICS: CACHE_CONFIG.CALL_STATISTICS.tag,
  SUBMISSION_DATA: CACHE_CONFIG.SUBMISSION_DATA.tag,
  REPORTS: CACHE_CONFIG.REPORTS.tag,
} as const;
