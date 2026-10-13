export interface AssignmentSubmissionRow {
  assignmentNumber: number;
  assignmentKey: string;
  submitted: number;
  completed: number;
  graded?: number;
  pendingOrZero?: number;
  fullMarks?: number;
  above50?: number;
  avgMarks?: number | null;
  totalStudents: number;
  submissionRate: number;
  fullMarksRate?: number;
  above50Rate?: number;
  pendingOrZeroRate?: number;
  pointDiffVsPrevious: number | null;
  relativeChangePercentVsPrevious: number | null;
}

export interface AssignmentSubmissionReportData {
  assignments: AssignmentSubmissionRow[];
  totalStudents: number;
}

export interface CallRoundsReportData {
  totalStudents: number;
  completedRounds: number;
  studentsNeverCalled: number;
  averageCallsPerStudent: number;
  distribution: { round: number; studentsReached: number; percentOfCohort: number }[];
  onlyMentorshipGroup: boolean;
}

export interface AssignmentWiseCallRow {
  lastCompletedAtCallTime: string;
  pursuingAssignment: string;
  callCount: number;
}

export interface AssignmentWiseCallReportData {
  rows: AssignmentWiseCallRow[];
  untaggedCalls: number;
  note: string | null;
}

export interface CohortSummaryReportData {
  totalStudents: number;
  joinedMentorship: number;
  notJoinedMentorship: number;
  completedAllAssignments: number;
  perAssignment: { assignmentNumber: number; assignmentKey: string; submitted: number }[];
}

export interface CallHistoryItem {
  label: string;
  total: number;
  received: number;
  notReceived: number;
  successRate: number;
}

export interface CallHistoryReportData {
  summary: {
    totalCalls: number;
    receivedCalls: number;
    notReceivedCalls: number;
    receivedRate: number;
    uniqueStudentsCalled: number;
  };
  weekly: CallHistoryItem[];
  monthly: CallHistoryItem[];
}

export interface GeneratedReport {
  generatedAt: string;
  sections: string[];
  selectedCohort?: string;
  assignmentSubmission?: AssignmentSubmissionReportData;
  callRounds?: CallRoundsReportData;
  assignmentWiseCalls?: AssignmentWiseCallReportData;
  summary?: CohortSummaryReportData;
  callHistory?: CallHistoryReportData;
}

export const REPORT_SECTION_OPTIONS = [
  {
    key: 'summary',
    label: 'Cohort Summary',
    description: 'Total students, mentorship joins (joined vs not joined), and completion counts',
  },
  {
    key: 'assignmentSubmission',
    label: 'Assignment Submission Trend',
    description: 'Submissions per assignment (A-01 - A-10) with drop-off %',
  },
  {
    key: 'callHistory',
    label: 'Call History (Weekly & Monthly)',
    description: 'Weekly and monthly call volumes, success rate, and outreach breakdown',
  },
  {
    key: 'callRounds',
    label: 'Call Rounds',
    description: 'How many full calling rounds the cohort has completed',
  },
  {
    key: 'assignmentWiseCalls',
    label: 'Assignment-wise Call Volume',
    description: 'Calls made while students were pursuing each assignment',
  },
] as const;
