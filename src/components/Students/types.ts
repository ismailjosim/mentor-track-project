import type { StudentWithRelations } from '@/types';
import type { SortingState } from '@tanstack/react-table';

export interface StudentTableFilters {
  search: string;
  cohort: string;
  status: string;
  progress: string;
  submittedAssignment: string;
  notSubmittedAssignment: string;
  group: string;
  programType: string;
}

export type StudentFilterKey = keyof StudentTableFilters;

export interface StudentsTableProps {
  students: StudentWithRelations[];
  currentPage?: number;
  totalPages?: number;
  totalStudents?: number;
  onPageChange?: (page: number) => void;
  isLoading?: boolean;

  // Unified Filter State
  filters?: Partial<StudentTableFilters>;
  onFilterChange?: (key: StudentFilterKey, val: string) => void;
  onResetFilters?: () => void;
  onExportFiltered?: () => void;
  isExporting?: boolean;

  // Sorting
  sorting?: SortingState;
  onSortingChange?: (sorting: SortingState) => void;

  // Optional legacy props
  search?: string;
  onSearchChange?: (search: string) => void;
  statusFilter?: string;
  onStatusFilterChange?: (status: string) => void;
  progressFilter?: string;
  onProgressFilterChange?: (progress: string) => void;
  groupFilter?: string;
  onGroupFilterChange?: (group: string) => void;
  deviceFilter?: string;
  onDeviceFilterChange?: (device: string) => void;
  cohortFilter?: string;
  onCohortFilterChange?: (cohort: string) => void;
  programFilter?: string;
  onProgramFilterChange?: (programType: string) => void;
}

export const COHORT_OPTIONS: { label: string; value: string }[] = [
  { label: 'All Batches', value: 'all' },
  { label: 'Batch 13', value: '13' },
  { label: 'Batch 14', value: '14' },
];

export const STATUS_OPTIONS: { label: string; value: string }[] = [
  { label: 'All Statuses', value: 'all' },
  { label: 'On Track', value: 'On Track' },
  { label: 'Behind', value: 'Behind' },
  { label: 'At Risk', value: 'At Risk' },
  { label: 'Completed', value: 'Completed' },
  { label: 'Dropped', value: 'Dropped' },
];

export const PROGRESS_OPTIONS = [
  { label: 'All Progress', value: 'all' },
  ...Array.from({ length: 11 }, (_, progress) => ({
    label: `${progress}/10`,
    value: String(progress),
  })),
];

export const SUBMITTED_ASSIGNMENT_OPTIONS = [
  { label: 'Submitted: Any', value: 'all' },
  ...Array.from({ length: 10 }, (_, i) => ({
    label: `A-${String(i + 1).padStart(2, '0')} Submitted`,
    value: String(i + 1),
  })),
  { label: '0 Submissions (None)', value: '0' },
];

export const NOT_SUBMITTED_ASSIGNMENT_OPTIONS = [
  { label: 'Not Submitted: None / Any', value: 'none' },
  ...Array.from({ length: 10 }, (_, i) => ({
    label: `A-${String(i + 1).padStart(2, '0')} Not Submitted`,
    value: String(i + 1),
  })),
];

export interface FilterPreset {
  id: string;
  label: string;
  submittedAssignment: string;
  notSubmittedAssignment: string;
  group: string;
}

export const FILTER_PRESETS: FilterPreset[] = [
  {
    id: 'a6_done_a7_miss',
    label: 'A-06 Submitted & A-07 Missing',
    submittedAssignment: '6',
    notSubmittedAssignment: '7',
    group: 'all',
  },
  {
    id: 'a6_done_mentor_miss',
    label: 'A-06 Submitted & Mentorship Missing',
    submittedAssignment: '6',
    notSubmittedAssignment: 'none',
    group: 'missing',
  },
  {
    id: 'a5_done_a6_miss',
    label: 'A-05 Submitted & A-06 Missing',
    submittedAssignment: '5',
    notSubmittedAssignment: '6',
    group: 'all',
  },
  {
    id: 'a7_done_mentor_miss',
    label: 'A-07 Submitted & Mentorship Missing',
    submittedAssignment: '7',
    notSubmittedAssignment: 'none',
    group: 'missing',
  },
  {
    id: 'all_10_completed',
    label: '10/10 All Submitted',
    submittedAssignment: '10',
    notSubmittedAssignment: 'none',
    group: 'all',
  },
  {
    id: 'zero_submitted',
    label: '0/10 No Submissions',
    submittedAssignment: '0',
    notSubmittedAssignment: 'none',
    group: 'all',
  },
];

export const GROUP_OPTIONS = [
  { label: 'All Groups', value: 'all' },
  { label: 'In Group', value: 'in-group' },
  { label: 'Missing', value: 'missing' },
];

export const PROGRAM_OPTIONS = [
  { label: 'All Programs', value: 'all' },
  { label: 'EJP', value: 'EJP' },
  { label: 'SCIC', value: 'SCIC' },
  { label: 'Both', value: 'Both' },
  { label: 'Other', value: 'Other' },
];

export const PAGE_SIZE = 10;
