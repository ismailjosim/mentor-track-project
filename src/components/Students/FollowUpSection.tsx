'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { CalendarClock, Plus, Trash2, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import type { FollowUp } from '@/interfaces/followUp.interface';
import { followUpApi } from '@/lib/api-client';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface FollowUpFormData {
  date: string;
  note: string;
}

interface FollowUpSectionProps {
  followUps: FollowUp[];
  studentId: string;
  onUpdate?: () => void;
}

export function FollowUpSection({
  followUps: initialFollowUps,
  studentId,
  onUpdate,
}: FollowUpSectionProps) {
  const [prevInitial, setPrevInitial] = useState(initialFollowUps);
  const [followUps, setFollowUps] = useState(initialFollowUps);

  if (initialFollowUps !== prevInitial) {
    setPrevInitial(initialFollowUps);
    setFollowUps(initialFollowUps);
  }

  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { register, handleSubmit, reset } = useForm<FollowUpFormData>({
    defaultValues: { date: '', note: '' },
  });

  const onSchedule = async (formData: FollowUpFormData) => {
    try {
      setSubmitting(true);
      setError(null);

      if (!formData.date || !formData.note.trim()) {
        throw new Error('Please fill in all fields');
      }

      const followUpDate = new Date(formData.date);
      if (isNaN(followUpDate.getTime())) {
        throw new Error('Invalid date format');
      }

      const response = await followUpApi.create({
        date: followUpDate,
        note: formData.note.trim(),
        studentId,
      });

      if (response.error) {
        throw new Error(response.error);
      }

      const newFollowUp = response.data as FollowUp;
      setFollowUps([newFollowUp, ...followUps]);
      onUpdate?.();
      toast.success('Follow-up scheduled successfully');
      setShowForm(false);
      reset();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create follow-up';
      setError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (followUpId: string) => {
    try {
      setDeletingId(followUpId);
      const response = await followUpApi.delete(followUpId);

      if (response.error) {
        throw new Error(response.error);
      }

      setFollowUps(followUps.filter((f) => f._id !== followUpId));
      onUpdate?.();
      toast.success('Follow-up deleted');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete follow-up';
      toast.error(message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="bg-background rounded-xl border border-border shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarClock className="w-4 h-4 text-blue-500" />
          <h3 className="font-semibold">Follow-Up Schedule</h3>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowForm(!showForm)}
          disabled={submitting}
          className="gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" />
          Schedule
        </Button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="px-6 py-3 bg-destructive/10 border-b flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-destructive shrink-0" />
          <p className="text-sm text-destructive flex-1">{error}</p>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-xs font-medium text-destructive hover:underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {showForm && (
        <div className="px-6 py-5 border-b bg-muted/10">
          <form
            onSubmit={handleSubmit(onSchedule)}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-medium">Follow-Up Date</Label>
              <Input type="date" {...register('date', { required: true })} disabled={submitting} />
            </div>
            <div className="flex flex-col gap-1.5 md:col-span-1">
              <Label className="text-xs font-medium">Note</Label>
              <Input
                type="text"
                {...register('note', { required: true })}
                placeholder="What to check on follow-up..."
                disabled={submitting}
              />
            </div>
            <div className="md:col-span-2 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowForm(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={submitting}>
                {submitting ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </form>
        </div>
      )}

      <div className="divide-y divide-border">
        {followUps.length === 0 ? (
          <div className="px-6 py-10 text-center text-muted-foreground italic text-sm">
            No follow-ups scheduled.
          </div>
        ) : (
          followUps.map((f) => {
            const isDeleting = deletingId === f._id;
            return (
              <div
                key={f._id}
                className="px-6 py-4 flex items-start justify-between gap-4 hover:bg-muted/20 transition-colors group"
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center shrink-0 mt-0.5">
                    <CalendarClock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{f.note}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {format(new Date(f.date), 'MMMM d, yyyy')}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive disabled:opacity-50 cursor-pointer"
                  title="Delete follow-up"
                  onClick={() => handleDelete(f._id!)}
                  disabled={isDeleting}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
