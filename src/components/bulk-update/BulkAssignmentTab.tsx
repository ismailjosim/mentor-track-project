'use client';

import { useState } from 'react';
import { Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import { processAssignmentImportFile } from '@/lib/file-parser';
import {
  ASSIGNMENTS,
  DEADLINE_TIERS,
  parseAssignmentInput,
  type BulkResult,
  type DeadlineTier,
  type AssignmentImportRow,
} from './types';
import { BulkResultSummary } from './BulkResultSummary';
import { BulkFileUploadZone } from './BulkFileUploadZone';

interface BulkAssignmentTabProps {
  onSuccess: (matchedCount: number, assignmentLabel: string) => void;
  onError: (msg: string | null) => void;
}

export function BulkAssignmentTab({ onSuccess, onError }: BulkAssignmentTabProps) {
  const [assignmentNum, setAssignmentNum] = useState(1);
  const [tier, setTier] = useState<DeadlineTier>(60);
  const [emailsText, setEmailsText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<BulkResult | null>(null);
  const [currentItems, setCurrentItems] = useState<AssignmentImportRow[]>([]);

  const handleProcessAssignment = async () => {
    try {
      setProcessing(true);
      onError(null);

      let items: AssignmentImportRow[] = [];

      if (file) {
        const fileResult = await processAssignmentImportFile(file);
        items = fileResult.items;
        if (items.length === 0) {
          throw new Error('No valid student email rows found in the uploaded file');
        }
      } else {
        items = parseAssignmentInput(emailsText);
        if (items.length === 0) {
          throw new Error('No valid student email rows detected in the input');
        }
      }

      setCurrentItems(items);

      const response = await fetch('/api/assignments/bulk-match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      });

      const resJson = await response.json();

      if (!response.ok) {
        onError(resJson.message || 'Failed to match student emails');
        return;
      }

      const { data } = resJson;

      setResult({
        matched: data.stats.matched,
        unmatched: data.stats.unmatched,
        unmatchedEmails: data.unmatched,
        matchedStudents: data.matched,
        withMarks: data.stats.withMarks,
        pendingMarks: data.stats.pendingMarks,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to process file';
      onError(message);
      toast.error(message);
    } finally {
      setProcessing(false);
    }
  };

  const handleCommitAssignment = async () => {
    try {
      setProcessing(true);

      const response = await fetch('/api/assignments/bulk-submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignmentNumber: assignmentNum,
          items: currentItems,
          tier,
        }),
      });

      const apiResult = await response.json();

      if (!response.ok) {
        onError(apiResult.message || 'Failed to submit assignments');
        toast.error(apiResult.message || 'Failed to submit assignments');
        return;
      }

      const matchedCount = result?.matched ?? 0;
      const label = ASSIGNMENTS[assignmentNum - 1].label;
      const completedCount = apiResult.data?.completed ?? 0;
      const pendingCount = apiResult.data?.pending ?? 0;

      toast.success(
        `Successfully updated ${matchedCount} students for ${label} (${completedCount} marked, ${pendingCount} pending)`
      );

      setResult(null);
      setCurrentItems([]);
      setEmailsText('');
      setFile(null);
      onSuccess(matchedCount, label);
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
      {/* Configuration Row: Assignment and Deadline Tier */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold">Select Assignment</label>
          <select
            value={assignmentNum}
            onChange={(e) => {
              setAssignmentNum(Number(e.target.value));
              setResult(null);
            }}
            disabled={processing}
            className="border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 w-full disabled:opacity-50"
          >
            {ASSIGNMENTS.map((a) => (
              <option key={a.value} value={a.value}>
                {a.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold">Deadline / Marks Tier</label>
          <select
            value={tier}
            onChange={(e) => {
              setTier(Number(e.target.value) as DeadlineTier);
              setResult(null);
            }}
            disabled={processing}
            className="border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 w-full disabled:opacity-50"
          >
            {DEADLINE_TIERS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* File Upload Zone */}
      <BulkFileUploadZone
        file={file}
        onFileSelect={(f) => {
          setFile(f);
          setResult(null);
        }}
        onClearFile={() => {
          setFile(null);
          setResult(null);
          setCurrentItems([]);
        }}
      />

      <div className="flex flex-col gap-1.5">
        <div className="flex justify-between items-center">
          <label className="text-sm font-semibold">Paste Data / Email List</label>
          <span className="text-xs text-muted-foreground">
            {file ? 'File loaded above' : 'Auto-detects Name, Email, and Marks'}
          </span>
        </div>
        <textarea
          value={emailsText}
          onChange={(e) => {
            setEmailsText(e.target.value);
            setResult(null);
          }}
          disabled={file !== null || processing}
          placeholder={
            file
              ? 'File is selected above. Click "Process" to match students.'
              : `Abdur Rahman\tabdurrahman436021@gmail.com\t57\nAlok talukder\taloktalukder1971@gmail.com\t60\nAmran Hossain\tamran879k@gmail.com\t0\nor just emails: student@example.com`
          }
          rows={6}
          className="border rounded-md px-3 py-2 text-sm font-mono bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none disabled:opacity-50"
        />
      </div>

      {result && (
        <BulkResultSummary
          result={result}
          processing={processing}
          onCommit={handleCommitAssignment}
          onCancel={() => setResult(null)}
          tier={tier}
        />
      )}

      {!result && (
        <div className="flex justify-end">
          <button
            onClick={handleProcessAssignment}
            disabled={(!file && parseAssignmentInput(emailsText).length === 0) || processing}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-md text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            <Zap className="w-4 h-4" />
            {processing ? 'Processing...' : 'Process'}
          </button>
        </div>
      )}
    </div>
  );
}
