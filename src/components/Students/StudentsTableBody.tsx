import type { StudentWithRelations } from '@/types';
import { StudentsTableRow } from './StudentsTableRow';
import { StudentsTableSkeleton } from './StudentsTableSkeleton';

interface StudentsTableBodyProps {
  isLoading: boolean;
  students: StudentWithRelations[];
  selectedIds: Set<string>;
  isDeleting: boolean;
  onDeleteClick: (id: string, name: string) => void;
  onToggleSelect: (id: string) => void;
}

export function StudentsTableBody({
  isLoading,
  students,
  selectedIds,
  isDeleting,
  onDeleteClick,
  onToggleSelect,
}: StudentsTableBodyProps) {
  return (
    <tbody className="divide-y divide-border">
      {isLoading ? (
        <StudentsTableSkeleton />
      ) : students.length === 0 ? (
        <tr>
          <td colSpan={8} className="px-6 py-14 text-center text-muted-foreground italic">
            No students found matching your criteria.
          </td>
        </tr>
      ) : (
        students.map((student) => (
          <StudentsTableRow
            key={student._id}
            student={student}
            onDeleteClick={onDeleteClick}
            isDeleting={isDeleting}
            isSelected={selectedIds.has(student._id!)}
            onToggleSelect={onToggleSelect}
          />
        ))
      )}
    </tbody>
  );
}
