'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';

import type { Assignment } from '@/interfaces/assignment.interface';
import type { CallLog } from '@/interfaces/callLog.interface';
import type { FollowUp } from '@/interfaces/followUp.interface';
import type { StudentWithRelations } from '@/types';

import StudentActivityPanel from './StudentActivityPanel';
import StudentOverviewPanel from './StudentOverviewPanel';
import StudentTrackingPanel from './StudentTrackingPanel';

interface SingleStudentDetailsProps {
  student: StudentWithRelations;
}

const SingleStudentDetails = ({ student }: SingleStudentDetailsProps) => {
  const router = useRouter();

  const refreshStudent = useCallback(() => {
    router.refresh();
  }, [router]);

  const studentId = student._id;
  const assignments = (student.assignments || []) as unknown as Assignment[];
  const callLogs = (student.callLogs || []) as CallLog[];
  const followUps = (student.followUps || []) as FollowUp[];

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <StudentOverviewPanel
        assignments={assignments}
        onUpdate={refreshStudent}
        student={student}
        studentId={studentId}
      />

      <div className="space-y-6 lg:col-span-2">
        <StudentTrackingPanel
          assignments={assignments}
          onUpdate={refreshStudent}
          student={student}
        />

        <StudentActivityPanel
          callLogs={callLogs}
          followUps={followUps}
          studentId={studentId}
          onUpdate={refreshStudent}
        />
      </div>
    </div>
  );
};

export default SingleStudentDetails;
