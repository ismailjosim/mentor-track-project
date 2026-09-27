/* eslint-disable @typescript-eslint/no-explicit-any */
import type { StudentImportData } from '@/lib/file-parser';

export type ImportStep = 'upload' | 'preview' | 'importing' | 'success';

export interface ImportPreview {
  preview: boolean;
  headers: string[];
  totalRows: number;
  validCount: number;
  invalidCount: number;
  duplicateCount: number;
  validRows: (StudentImportData & { rowIndex: number })[];
  invalidRows: { rowIndex: number; data: any; errors: string[] }[];
  duplicateEmails: { email: string; rowIndices: number[] }[];
  message: string;
}
