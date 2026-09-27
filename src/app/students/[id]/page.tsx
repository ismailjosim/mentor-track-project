import type { Metadata } from 'next';
import SingleStudentWrapper from '@/components/modules/SingleStudent/SingleStudentWrapper';
import { getSingleStudent } from '@/services/student.service';
import StudentNotFound from '@/components/modules/SingleStudent/StudentNotFound';

interface SingleStudentPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: SingleStudentPageProps): Promise<Metadata> {
  const { id } = await params;
  const singleStudentRes = await getSingleStudent(id);
  const student = singleStudentRes?.data;

  return {
    title: student ? `${student.name} | Mentor Track` : 'Student Details | Mentor Track',
    description: student
      ? `Student profile and progress tracking for ${student.name}.`
      : 'Student details view',
  };
}

export default async function SingleStudentPage({ params }: SingleStudentPageProps) {
  const { id } = await params;
  const singleStudentRes = await getSingleStudent(id);
  const student = singleStudentRes?.data;

  if (!singleStudentRes.success || !student) {
    return <StudentNotFound message={singleStudentRes.error} />;
  }

  return <SingleStudentWrapper student={student} />;
}
