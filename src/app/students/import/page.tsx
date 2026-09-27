import type { Metadata } from 'next';
import { ImportStudentsClient } from '@/components/Students/import';

export const metadata: Metadata = {
  title: 'Import Students | Mentor Track',
  description: 'Upload a CSV or Excel file to import multiple students at once.',
};

export default function StudentImportPage() {
  return <ImportStudentsClient />;
}
