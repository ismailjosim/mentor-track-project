export interface AdminStats {
  totalUsers: number;
  totalStudents: number;
  totalBatches: number;
  totalCallLogs: number;
  totalFollowUps: number;
}

export interface UserItem {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string | null;
  studentsCount: number;
  callsCount: number;
  lastCallDate: string | null;
}

export interface BatchItem {
  cohort: string;
  totalStudents: number;
  joinedMentorship: number;
  notJoinedMentorship: number;
  completedStudents: number;
  onTrackStudents: number;
  atRiskStudents: number;
  mentorsCount: number;
  joinRate: number;
}

export interface ActivityItem {
  id: string;
  type: string;
  title: string;
  studentName?: string;
  studentCohort?: string;
  mentorName?: string;
  status?: string;
  date: string;
  notes?: string;
}

export interface AdminOverviewData {
  stats: AdminStats;
  users: UserItem[];
  batches: BatchItem[];
  recentActivities: ActivityItem[];
  recentStudents: unknown[];
}
