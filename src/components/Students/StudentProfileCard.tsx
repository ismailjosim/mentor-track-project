'use client';

import { useMemo, useState } from 'react';
import {
  Briefcase,
  Check,
  Edit2,
  GraduationCap,
  Loader2,
  Mail,
  MapPin,
  MessageCircle,
  Monitor,
  Phone,
  Users,
  Layers,
} from 'lucide-react';
import toast from 'react-hot-toast';

import type { StudentWithRelations } from '@/types';
import { getStatusBadgeClass } from '@/lib/ui-helpers';
import { studentApi } from '@/lib/api-client';

import { StudentAvatar } from './StudentAvatar';
import { Modal, ModalBody, ModalFooter, ModalHeader } from '@/components/Modal';

interface StudentProfileCardProps {
  student: StudentWithRelations;
  onUpdate?: () => void;
}

interface StudentFormData {
  phone: string;
  whatsapp: string;
  mentorshipJoiningStatus: boolean;
  [key: string]: unknown;
}

const createInitialFormData = (student: StudentWithRelations): StudentFormData => ({
  phone: student.phone || '',
  whatsapp: student.whatsapp || '',
  mentorshipJoiningStatus: student.mentorshipJoiningStatus || false,
});

export function StudentProfileCard({ student, onUpdate }: StudentProfileCardProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [displayedData, setDisplayedData] = useState<StudentFormData>(
    createInitialFormData(student)
  );

  const [formData, setFormData] = useState<StudentFormData>(createInitialFormData(student));

  const details = useMemo(
    () => [
      {
        icon: Layers,
        label: 'Batch / Cohort',
        value: student.cohort ? `Batch ${student.cohort}` : 'Batch 13',
      },
      {
        icon: Phone,
        label: 'Phone',
        value: displayedData.phone,
      },
      {
        icon: MessageCircle,
        label: 'WhatsApp',
        value: displayedData.whatsapp,
      },
      {
        icon: MapPin,
        label: 'Location',
        value:
          [student.town, student.district, student.division].filter(Boolean).join(', ') || null,
      },
      {
        icon: Briefcase,
        label: 'Occupation',
        value: student.occupation,
      },
      {
        icon: GraduationCap,
        label: 'Institute',
        value: student.institute,
      },
      {
        icon: Monitor,
        label: 'Device',
        value: student.workingDevice,
      },
      {
        icon: Users,
        label: 'Age Range',
        value: student.ageRange,
      },
    ],
    [displayedData.phone, displayedData.whatsapp, student]
  );

  const openEditModal = () => {
    setFormData(createInitialFormData(student));
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    if (isLoading) return;

    setIsEditModalOpen(false);
  };

  const updateFormField = <K extends keyof StudentFormData>(
    field: K,
    value: StudentFormData[K]
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    if (!student._id) {
      toast.error('Student ID not found');
      return;
    }

    try {
      setIsLoading(true);

      const response = await studentApi.update(student._id, formData);

      if (response?.error) {
        throw new Error(response.error);
      }

      setDisplayedData(formData);

      toast.success('Student information updated successfully');

      setIsEditModalOpen(false);

      onUpdate?.();
    } catch (error) {
      console.error('Student update error:', error);

      toast.error(error instanceof Error ? error.message : 'Failed to update student');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="overflow-hidden rounded-xl border bg-background shadow-sm">
        {/* Header */}
        <div className="relative flex flex-col items-center border-b bg-muted/20 px-6 py-6 text-center">
          <button
            onClick={openEditModal}
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

      {/* Edit Modal */}
      <Modal isOpen={isEditModalOpen} onClose={closeEditModal}>
        <ModalHeader title="Edit Basic Information" onClose={closeEditModal} />

        <ModalBody>
          <div className="space-y-4">
            {/* Phone */}
            <div className="space-y-1">
              <label className="block text-sm font-medium">Phone Number</label>

              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => updateFormField('phone', e.target.value)}
                placeholder="Enter phone number"
                className="w-full rounded-lg border bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* WhatsApp */}
            <div className="space-y-1">
              <label className="block text-sm font-medium">WhatsApp Number</label>

              <input
                type="tel"
                value={formData.whatsapp}
                onChange={(e) => updateFormField('whatsapp', e.target.value)}
                placeholder="Enter WhatsApp number"
                className="w-full rounded-lg border bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Mentorship Status */}
            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={formData.mentorshipJoiningStatus}
                onChange={(e) => updateFormField('mentorshipJoiningStatus', e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />

              <span className="text-sm font-medium">In Mentorship Group</span>
            </label>
          </div>
        </ModalBody>

        <ModalFooter>
          <button
            onClick={closeEditModal}
            disabled={isLoading}
            className="rounded-lg px-4 py-2 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            onClick={handleSave}
            disabled={isLoading}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                Save Changes
              </>
            )}
          </button>
        </ModalFooter>
      </Modal>
    </>
  );
}
