'use client';

import { useState } from 'react';
import { Heart } from 'lucide-react';
import toast from 'react-hot-toast';
import { parseEmails, type BulkResult } from './types';
import { BulkResultSummary } from './BulkResultSummary';

interface BulkMentorshipTabProps {
  onSuccess: (matchedCount: number, statusText: string) => void;
  onError: (msg: string | null) => void;
}

export function BulkMentorshipTab({ onSuccess, onError }: BulkMentorshipTabProps) {
  const [mentorshipStatus, setMentorshipStatus] = useState<boolean>(true);
  const [mentorshipEmails, setMentorshipEmails] = useState('');
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<BulkResult | null>(null);

  const handleProcessMentorship = async () => {
    try {
      setProcessing(true);
      onError(null);

      const emails = parseEmails(mentorshipEmails);

      if (emails.length === 0) {
        onError('Please enter at least one email');
        return;
      }

      const response = await fetch('/api/students/bulk-match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emails }),
      });

      const resJson = await response.json();

      if (!response.ok) {
        onError(resJson.message || 'Failed to match emails');
        return;
      }

      const { data } = resJson;

      setResult({
        matched: data.stats.matched,
        unmatched: data.stats.unmatched,
        unmatchedEmails: data.unmatched,
        matchedStudents: data.matched,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to process emails';
      onError(message);
      toast.error(message);
    } finally {
      setProcessing(false);
    }
  };

  const handleCommitMentorship = async () => {
    try {
      setProcessing(true);
      const emails =
        result?.matchedStudents && result.matchedStudents.length > 0
          ? result.matchedStudents.map((s) => s.email)
          : parseEmails(mentorshipEmails);

      const response = await fetch('/api/students/bulk-update-mentorship', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emails, mentorshipJoiningStatus: mentorshipStatus }),
      });

      const apiResult = await response.json();

      if (!response.ok) {
        onError(apiResult.message || 'Failed to update mentorship status');
        toast.error(apiResult.message || 'Failed to update mentorship status');
        return;
      }

      const matchedCount = result?.matched ?? 0;
      const statusText = mentorshipStatus ? 'Active' : 'Inactive';
      toast.success(
        `Successfully updated ${matchedCount} students to mentorship status: ${statusText}`
      );

      setResult(null);
      setMentorshipEmails('');
      onSuccess(matchedCount, statusText);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to commit update';
      onError(message);
      toast.error(message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-semibold">Mentorship Status</label>
        <select
          value={mentorshipStatus ? 'active' : 'inactive'}
          onChange={(e) => setMentorshipStatus(e.target.value === 'active')}
          disabled={processing}
          className="border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 w-full md:w-64 disabled:opacity-50"
        >
          <option value="active">Active (Joined Group)</option>
          <option value="inactive">Inactive (Not in Group)</option>
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex justify-between">
          <label className="text-sm font-semibold">Email List</label>
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
          className="border rounded-md px-3 py-2 text-sm font-mono bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none disabled:opacity-50"
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
          <button
            onClick={handleProcessMentorship}
            disabled={parseEmails(mentorshipEmails).length === 0 || processing}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Heart className="w-4 h-4" />
            {processing ? 'Processing...' : 'Process'}
          </button>
        </div>
      )}
    </div>
  );
}
