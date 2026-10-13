export interface MilestoneRow {
  milestone: string;
  targetPct: number;
  actualCompletion: number | '';
  studentsReached: number | '';
  initiativesTaken: string;
  remarks: string;
}

export interface ComputedMilestoneRow extends MilestoneRow {
  targetCount: number;
  actualPct: number | null;
  gap: number | null;
  shortfall: number | null;
}

export interface ActionLogRow {
  id: string;
  action: string;
  date: string;
  outcome: string;
  followUp: string;
}

export interface MilestoneWeeklyReportProps {
  cohort?: string;
}

export const DEFAULT_MILESTONES: MilestoneRow[] = [
  {
    milestone: 'Milestone-06',
    targetPct: 81.2,
    actualCompletion: 97,
    studentsReached: 97,
    initiativesTaken: '1. Called 40+ student\n2. Share resources in Discord group Regularly\n3. ',
    remarks: '',
  },
  {
    milestone: 'Milestone-07',
    targetPct: 78.4,
    actualCompletion: 68,
    studentsReached: 68,
    initiativesTaken: '1. \n2. \n3. ',
    remarks: '',
  },
  {
    milestone: 'Milestone-08',
    targetPct: 75.6,
    actualCompletion: '',
    studentsReached: '',
    initiativesTaken: '1. \n2. \n3. ',
    remarks: '',
  },
  {
    milestone: 'Milestone-09',
    targetPct: 72.8,
    actualCompletion: '',
    studentsReached: '',
    initiativesTaken: '1. \n2. \n3. ',
    remarks: '',
  },
  {
    milestone: 'Milestone-10',
    targetPct: 70.0,
    actualCompletion: '',
    studentsReached: '',
    initiativesTaken: '1. \n2. \n3. ',
    remarks: '',
  },
];
