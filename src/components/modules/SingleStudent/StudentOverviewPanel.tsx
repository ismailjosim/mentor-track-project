import { AssignmentChecklist } from '@/components/Students/AssignmentChecklist';
import { StudentProfileCard } from '@/components/Students/StudentProfileCard';
import type { Assignment } from '@/interfaces/assignment.interface';
import type { StudentWithRelations } from '@/types';

interface StudentOverviewPanelProps {
  assignments: Assignment[];
  onUpdate: () => void;
  student: StudentWithRelations;
  studentId: string;
}

const StudentOverviewPanel = ({
  assignments,
  onUpdate,
  student,
  studentId,
}: StudentOverviewPanelProps) => {
  return (
    <aside className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-6">
      <StudentProfileCard student={student} onUpdate={onUpdate} />
      <AssignmentChecklist assignments={assignments} studentId={studentId} onUpdate={onUpdate} />
    </aside>
  );
};

export default StudentOverviewPanel;
