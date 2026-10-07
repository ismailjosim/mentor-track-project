'use client';

import { useState, useMemo } from 'react';
import {
  Mail,
  Phone,
  MessageSquare,
  Users,
  Layers,
  Laptop,
  GraduationCap,
  Calendar,
  Edit2,
} from 'lucide-react';
import { StudentAvatar } from '@/components/Students/StudentAvatar';
import { getStatusBadgeClass } from '@/lib/ui-helpers';
import type { StudentWithRelations } from '@/types';
import { StudentEditModal, type StudentFormData } from './StudentEditModal';

interface StudentProfileCardProps {
  student: StudentWithRelations;
  onUpdate?: () => void;
}

const createInitialFormData = (student: StudentWithRelations): StudentFormData => ({
  phone: student.phone || '',
  whatsapp: student.whatsapp || '',
  mentorshipJoiningStatus: student.mentorshipJoiningStatus || false,
  cohort: student.cohort ? student.cohort.replace(/^Batch\s*/i, '') : '14',
});

export function StudentProfileCard({ student, onUpdate }: StudentProfileCardProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Directly derive displayedData without useState/useEffect to avoid cascading renders
  const displayedData = useMemo(() => createInitialFormData(student), [student]);

  const details = useMemo(
    () => [
      {
        icon: Layers,
        label: 'Batch / Cohort',
        value: displayedData.cohort
          ? displayedData.cohort.toLowerCase().startsWith('batch')
            ? displayedData.cohort
            : `Batch ${displayedData.cohort}`
          : 'Batch 14',
      },
      {
        icon: GraduationCap,
        label: 'Program',
        value: student.programType,
      },
      {
        icon: Users,
        label: 'Group',
        value: student.mentorshipJoiningStatus ? 'In Group' : 'Not in Group',
      },
      {
        icon: Laptop,
        label: 'Device',
        value: student.workingDevice,
      },
      {
        icon: Phone,
        label: 'Phone',
        value: displayedData.phone,
      },
      {
        icon: MessageSquare,
        label: 'WhatsApp',
        value: displayedData.whatsapp,
      },
      {
        icon: Calendar,
        label: 'Last Active',
        value: student.lastContactedAt
          ? new Date(student.lastContactedAt).toLocaleDateString()
          : 'Never',
      },
    ],
    [
      displayedData,
      student.programType,
      student.mentorshipJoiningStatus,
      student.workingDevice,
      student.lastContactedAt,
    ]
  );

  return (
    <>
      <div className="overflow-hidden rounded-xl border bg-background shadow-sm">
        {/* Header */}
        <div className="relative flex flex-col items-center border-b bg-muted/20 px-6 py-6 text-center">
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="absolute right-4 top-4 rounded-lg p-2 transition-colors hover:bg-muted"
            title="Edit basic info"
          >
            <Edit2 className="h-5 w-5 text-muted-foreground" />
          </button>

          <StudentAvatar name={student.name} size="lg" className="mb-3" />

          <h2 className="text-xl font-bold">{student.name}</h2>

          <p className="mt-0.5 flex items-center gap-1 text-sm text-muted-foreground">
            <Mail className="h-3 w-3" />
            {student.email}
          </p>

          <div className="mt-3 flex items-center gap-2">
            <span
              className={`inline-flex rounded border px-2.5 py-1 text-xs font-semibold ${getStatusBadgeClass(
                student.currentStatus!
              )}`}
            >
              {student.currentStatus}
            </span>

            <span
              className={`inline-flex rounded border px-2.5 py-1 text-xs font-semibold ${
                displayedData.mentorshipJoiningStatus ? 'status-success' : 'status-danger'
              }`}
            >
              {displayedData.mentorshipJoiningStatus ? 'In Group' : 'Not in Group'}
            </span>
          </div>
        </div>

        {/* Details */}
        <div className="space-y-3 px-5 py-4">
          {details.map(({ icon: Icon, label, value }) =>
            value ? (
              <div key={label} className="flex items-start gap-3 text-sm">
                <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />

                <div className="flex w-full justify-between gap-2">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="text-right font-medium">{value}</span>
                </div>
              </div>
            ) : null
          )}
        </div>

        {/* Notes */}
        {(student.comments?.length ?? 0) > 0 && (
          <div className="border-t bg-muted/10 px-5 py-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Notes
            </p>

            <ul className="space-y-1">
              {student.comments?.map((comment, index) => (
                <li key={`${comment}-${index}`} className="text-sm text-muted-foreground">
                  • {comment}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Edit Modal (Extracted Subcomponent) */}
      <StudentEditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        student={student}
        onSuccess={() => onUpdate?.()}
      />
    </>
  );
}
