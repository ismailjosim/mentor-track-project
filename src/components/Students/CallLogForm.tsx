'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { getCallLogStatusLabel } from '@/lib/ui-helpers';
import { CallLog } from '@/interfaces/callLog.interface';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const CALL_STATUSES: CallLog['status'][] = [
  'RECEIVED',
  'NOT_RECEIVED',
  'PHONE_OFF',
  'SWITCHED_OFF',
  'FOREIGN_NUMBER',
  'BUSY',
];

const ISSUE_OPTIONS = [
  'None',
  'Conceptual Doubts',
  'Time Management / Busy',
  'Device / Environment Issue',
  'Health / Personal Issue',
  'Job / Family Commitment',
  'Lacking Motivation',
  'Assignment Backlog',
  'Exam / Academic Pressure',
  'Other',
];

interface CallLogFormData {
  status: CallLog['status'];
  issues: string;
  promised: string;
  notes: string;
}

interface CallLogFormProps {
  loggedInUserName: string;
  submitting: boolean;
  onCancel: () => void;
  onSubmit: (formData: CallLogFormData) => Promise<void>;
}

export function CallLogForm({
  loggedInUserName,
  submitting,
  onCancel,
  onSubmit,
}: CallLogFormProps) {
  const [selectedIssue, setSelectedIssue] = useState('None');

  const { register, handleSubmit, setValue } = useForm<CallLogFormData>({
    defaultValues: {
      status: 'RECEIVED',
      issues: '',
      promised: '',
      notes: '',
    },
  });

  const onFormSubmit = (data: CallLogFormData) => {
    onSubmit(data);
  };

  return (
    <div className="px-6 py-5 border-b bg-muted/10">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
        New Call Entry
      </p>
      <form onSubmit={handleSubmit(onFormSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs font-medium">Call Status</Label>
          <select
            {...register('status')}
            className="border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/30"
            disabled={submitting}
          >
            {CALL_STATUSES.map((s) => (
              <option key={s} value={s}>
                {getCallLogStatusLabel(s)}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label className="text-xs font-medium">Called By</Label>
          <Input
            type="text"
            value={loggedInUserName || 'Mentor'}
            readOnly
            title="Logged-in mentor name (read-only)"
            className="bg-muted/60 text-muted-foreground cursor-not-allowed"
            disabled={submitting}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label className="text-xs font-medium">Issue Mentioned</Label>
          <select
            value={selectedIssue}
            onChange={(e) => {
              const val = e.target.value;
              setSelectedIssue(val);
              if (val === 'None') {
                setValue('issues', '');
              } else if (val !== 'Other') {
                setValue('issues', val);
              }
            }}
            className="border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/30"
            disabled={submitting}
          >
            {ISSUE_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
          {selectedIssue === 'Other' && (
            <Input
              type="text"
              {...register('issues')}
              placeholder="Specify other issue..."
              className="mt-1"
              disabled={submitting}
            />
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label className="text-xs font-medium">Promise Made</Label>
          <Input
            type="text"
            {...register('promised')}
            placeholder="e.g. Finish A6 by Saturday"
            disabled={submitting}
          />
        </div>

        <div className="md:col-span-2 flex flex-col gap-1.5">
          <Label className="text-xs font-medium">Notes</Label>
          <textarea
            {...register('notes')}
            placeholder="Additional call notes..."
            rows={3}
            className="border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/30 resize-none"
            disabled={submitting}
          />
        </div>

        <div className="md:col-span-2 flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onCancel}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button type="submit" size="sm" disabled={submitting}>
            {submitting ? 'Saving...' : 'Save Log'}
          </Button>
        </div>
      </form>
    </div>
  );
}
