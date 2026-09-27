import type { Metadata } from 'next';
import { CreateStudentClient } from '@/components/Students/CreateStudentClient';

export const metadata: Metadata = {
  title: 'Create Student | Mentor Track',
  description: 'Add a student profile and the context mentors need to support them.',
};

export default function CreateStudentPage() {
  return <CreateStudentClient />;
}
