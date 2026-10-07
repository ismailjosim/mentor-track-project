'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Heart } from 'lucide-react';
import toast from 'react-hot-toast';
import { parseEmails, type BulkResult } from './types';
import { BulkResultSummary } from './BulkResultSummary';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

interface BulkMentorshipTabProps {
  onSuccess: (matchedCount: number, statusText: string) => void;
  onError: (msg: string | null) => void;
}

export function BulkMentorshipTab({ onSuccess, onError }: BulkMentorshipTabProps) {
  const queryClient = useQueryClient();
  const [mentorshipStatus, setMentorshipStatus] = useState<boolean>(true);
  const [mentorshipEmails, setMentorshipEmails] = useState('');
  const [result, setResult] = useState<BulkResult | null>(null);

  // TanStack Query Mutation for matching emails
  const matchMutation = useMutation({
    mutationFn: async (emails: string[]) => {
      const response = await fetch('/api/students/bulk-match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emails }),
      });
      const resJson = await response.json();
      if (!response.ok) {
        throw new Error(resJson.message || 'Failed to match emails');
      }
      return resJson.data;
    },
    onSuccess: (data) => {
      setResult({
        matched: data.stats.matched,
        unmatched: data.stats.unmatched,
        unmatchedEmails: data.unmatched,
        matchedStudents: data.matched,
      });
    },
    onError: (err: Error) => {
      onError(err.message);
      toast.error(err.message);
    },
  });

  // TanStack Query Mutation for committing mentorship update
  const commitMutation = useMutation({
    mutationFn: async ({ emails, status }: { emails: string[]; status: boolean }) => {
      const response = await fetch('/api/students/bulk-update-mentorship', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emails, mentorshipJoiningStatus: status }),
      });
      const apiResult = await response.json();
      if (!response.ok) {
        throw new Error(apiResult.message || 'Failed to update mentorship status');
      }
      return apiResult;
    },
    onSuccess: () => {
      const matchedCount = result?.matched ?? 0;
      const statusText = mentorshipStatus ? 'Active' : 'Inactive';
      toast.success(
        `Successfully updated ${matchedCount} students to mentorship status: ${statusText}`
      );
      setResult(null);
      setMentorshipEmails('');
      onSuccess(matchedCount, statusText);
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-overview'] });
    },
    onError: (err: Error) => {
      onError(err.message);
      toast.error(err.message);
    },
  });

  const handleProcessMentorship = () => {
    onError(null);
    const emails = parseEmails(mentorshipEmails);
    if (emails.length === 0) {
      onError('Please enter at least one email');
      return;
    }
    matchMutation.mutate(emails);
  };

  const handleCommitMentorship = () => {
    const emails =
      result?.matchedStudents && result.matchedStudents.length > 0
        ? result.matchedStudents.map((s) => s.email)
        : parseEmails(mentorshipEmails);

    commitMutation.mutate({ emails, status: mentorshipStatus });
  };

  const processing = matchMutation.isPending || commitMutation.isPending;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-1.5">
        <Label className="text-sm font-semibold">Mentorship Status</Label>
        <select
          value={mentorshipStatus ? 'active' : 'inactive'}
          onChange={(e) => setMentorshipStatus(e.target.value === 'active')}
          disabled={processing}
          className="border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/30 w-full md:w-64 disabled:opacity-50"
        >
          <option value="active">Active (Joined Group)</option>
          <option value="inactive">Inactive (Not in Group)</option>
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex justify-between">
          <Label className="text-sm font-semibold">Email List</Label>
          <span className="text-xs text-muted-foreground">
            {parseEmails(mentorshipEmails).length} email(s) entered
          </span>
        </div>
        <textarea
          value={mentorshipEmails}
          onChange={(e) => {
            setMentorshipEmails(e.target.value);
            setResult(null);
          }}
          disabled={processing}
          placeholder={'student1@example.com\nstudent2@example.com\nstudent3@example.com'}
          rows={8}
          className="border border-border rounded-lg px-3 py-2 text-sm font-mono bg-background text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/30 resize-none disabled:opacity-50"
        />
      </div>

      {result && (
        <BulkResultSummary
          result={result}
          processing={processing}
          onCommit={handleCommitMentorship}
          onCancel={() => setResult(null)}
        />
      )}

      {!result && (
        <div className="flex justify-end">
          <Button
            onClick={handleProcessMentorship}
            disabled={parseEmails(mentorshipEmails).length === 0 || processing}
            className="gap-2"
          >
            <Heart className="w-4 h-4" />
            {processing ? 'Processing...' : 'Process'}
          </Button>
        </div>
      )}
    </div>
  );
}
