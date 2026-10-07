'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Loader2, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/Modal';
import { studentApi } from '@/lib/api-client';
import type { StudentWithRelations } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export interface StudentFormData {
  phone: string;
  whatsapp: string;
  mentorshipJoiningStatus: boolean;
  cohort: string;
}

interface StudentEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: StudentWithRelations;
  onSuccess: (updated: Partial<StudentFormData>) => void;
}

export function StudentEditModal({ isOpen, onClose, student, onSuccess }: StudentEditModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, setValue, watch } = useForm<StudentFormData>({
    defaultValues: {
      phone: student.phone || '',
      whatsapp: student.whatsapp || '',
      mentorshipJoiningStatus: student.mentorshipJoiningStatus || false,
      cohort: student.cohort ? student.cohort.replace(/^Batch\s*/i, '') : '14',
    },
  });

  // eslint-disable-next-line react-hooks/incompatible-library
  const cohortValue = watch('cohort');

  const onSave = async (formData: StudentFormData) => {
    try {
      setIsLoading(true);
      const normalizedCohort = formData.cohort.trim();

      const response = await studentApi.update(student._id!, {
        phone: formData.phone.trim() || undefined,
        whatsapp: formData.whatsapp.trim() || undefined,
        mentorshipJoiningStatus: formData.mentorshipJoiningStatus,
        cohort: normalizedCohort
          ? `Batch ${normalizedCohort.replace(/^Batch\s*/i, '')}`
          : undefined,
      });

      if (response.error) {
        throw new Error(response.error);
      }

      toast.success('Student information updated successfully');
      onSuccess(formData);
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update student';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalHeader title="Edit Basic Information" onClose={onClose} />

      <form onSubmit={handleSubmit(onSave)}>
        <ModalBody>
          <div className="space-y-4">
            {/* Batch / Cohort */}
            <div className="space-y-1.5">
              <Label className="block text-sm font-medium">Batch / Cohort</Label>
              <div className="flex gap-2">
                <select
                  value={['14', '13', '15', '12'].includes(cohortValue) ? cohortValue : 'custom'}
                  onChange={(e) => {
                    if (e.target.value !== 'custom') {
                      setValue('cohort', e.target.value);
                    }
                  }}
                  className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary"
                >
                  <option value="14">Batch 14 (Current)</option>
                  <option value="13">Batch 13</option>
                  <option value="15">Batch 15</option>
                  <option value="12">Batch 12</option>
                  <option value="custom">Other / Custom</option>
                </select>
                <Input
                  type="text"
                  {...register('cohort')}
                  placeholder="e.g. 14"
                  className="flex-1"
                />
              </div>
              <p className="text-[11px] text-muted-foreground">
                Select or type the batch number (e.g. 14)
              </p>
            </div>

            {/* Phone */}
            <div className="space-y-1.5">
              <Label className="block text-sm font-medium">Phone Number</Label>
              <Input type="tel" {...register('phone')} placeholder="Enter phone number" />
            </div>

            {/* WhatsApp */}
            <div className="space-y-1.5">
              <Label className="block text-sm font-medium">WhatsApp Number</Label>
              <Input type="tel" {...register('whatsapp')} placeholder="Enter WhatsApp number" />
            </div>

            {/* Mentorship Status */}
            <label className="flex cursor-pointer items-center gap-3 pt-1">
              <input
                type="checkbox"
                {...register('mentorshipJoiningStatus')}
                className="h-4 w-4 rounded border-border text-primary accent-primary"
              />
              <span className="text-sm font-medium">In Mentorship Group</span>
            </label>
          </div>
        </ModalBody>

        <ModalFooter>
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>

          <Button type="submit" size="sm" disabled={isLoading} className="flex items-center gap-2">
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
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
