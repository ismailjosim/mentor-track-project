import type { StudentWithRelations } from '@/types';

export interface StudentsTableProps {
  students: StudentWithRelations[];
  currentPage?: number;
  totalPages?: number;
  totalStudents?: number;
  onPageChange?: (page: number) => void;
  isLoading?: boolean;
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
  programFilter?: string;
  onProgramFilterChange?: (programType: string) => void;
  onResetFilters?: () => void;
  onExportFiltered?: () => void;
  isExporting?: boolean;
}

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

export const GROUP_OPTIONS = [
  { label: 'All Groups', value: 'all' },
  { label: 'In Group', value: 'in-group' },
  { label: 'Missing', value: 'missing' },
];

export const DEVICE_OPTIONS = [
  { label: 'All Devices', value: 'all' },
  { label: 'Laptop', value: 'Laptop' },
  { label: 'Desktop', value: 'Desktop' },
  { label: 'Mobile', value: 'Mobile' },
  { label: 'No Device', value: 'none' },
];

export const PROGRAM_OPTIONS = [
  { label: 'All Programs', value: 'all' },
  { label: 'EJP', value: 'EJP' },
  { label: 'SCIC', value: 'SCIC' },
  { label: 'Both', value: 'Both' },
  { label: 'Other', value: 'Other' },
];

export const PAGE_SIZE = 10;
