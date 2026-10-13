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
import { BulkProgressOverlay } from './BulkProgressOverlay';
import { playCrudSound } from '@/lib/sound-effects';

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
  const [includePending, setIncludePending] = useState(true);

  // Live progress tracking states
  const [progressPercent, setProgressPercent] = useState<number | null>(null);
  const [progressCurrent, setProgressCurrent] = useState<number>(0);
  const [progressTotal, setProgressTotal] = useState<number>(0);
  const [progressStatusText, setProgressStatusText] = useState<string>('');

  const handleProcessAssignment = async () => {
    try {
      setProcessing(true);
      setProgressPercent(null);
      setProgressStatusText('Parsing rows and matching students in database...');
      onError(null);

      let items: AssignmentImportRow[] = [];

      if (file) {
        const fileResult = await processAssignmentImportFile(file);
        items = fileResult.items as AssignmentImportRow[];
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
        pendingCount: data.stats.pendingCount,
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

      const itemsToSubmit = includePending
        ? currentItems
        : currentItems.filter((it) => it.status !== 'PENDING');

      if (itemsToSubmit.length === 0) {
        toast.error('No student records selected to update');
        setProcessing(false);
        return;
      }

      const totalItems = itemsToSubmit.length;
      setProgressTotal(totalItems);
      setProgressCurrent(0);
      setProgressPercent(0);

      // Process in batches of 20 students to provide real progress updates and avoid timeouts
      const CHUNK_SIZE = 20;
      const chunks: AssignmentImportRow[][] = [];
      for (let i = 0; i < itemsToSubmit.length; i += CHUNK_SIZE) {
        chunks.push(itemsToSubmit.slice(i, i + CHUNK_SIZE));
      }

      let completedCount = 0;
      let submittedCount = 0;
      let pendingCount = 0;
      let processedSoFar = 0;

      for (let c = 0; c < chunks.length; c++) {
        const chunk = chunks[c];
        const batchNum = c + 1;

        setProgressStatusText(
          `Updating batch ${batchNum} of ${chunks.length} (${processedSoFar} / ${totalItems})...`
        );

        const response = await fetch('/api/assignments/bulk-submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            assignmentNumber: assignmentNum,
            items: chunk,
            tier,
            includePending,
          }),
        });

        const apiResult = await response.json();

        if (!response.ok) {
          throw new Error(apiResult.message || `Failed to submit batch ${batchNum}`);
        }

        completedCount += apiResult.data?.completed ?? 0;
        submittedCount += apiResult.data?.submitted ?? 0;
        pendingCount += apiResult.data?.pending ?? 0;
        processedSoFar += chunk.length;

        const currentPct = Math.min(100, Math.round((processedSoFar / totalItems) * 100));
        setProgressCurrent(processedSoFar);
        setProgressPercent(currentPct);
        setProgressStatusText(
          `Saved ${processedSoFar} of ${totalItems} students (${currentPct}%)...`
        );
      }

      const label = ASSIGNMENTS[assignmentNum - 1].label;
      const matchedCount = processedSoFar;

      playCrudSound('bulk');
      toast.success(
        `Successfully updated ${matchedCount} students for ${label}: ${completedCount} Completed, ${submittedCount} Submitted, ${pendingCount} Pending`
      );

      setResult(null);
      setCurrentItems([]);
      setEmailsText('');
      setFile(null);
      onSuccess(matchedCount, label);
    } catch (err) {
      playCrudSound('error');
      const message = err instanceof Error ? err.message : 'Failed to commit update';
      onError(message);
      toast.error(message);
    } finally {
      setProcessing(false);
      setProgressPercent(null);
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
          <label className="text-sm font-semibold flex items-center justify-between">
            <span>Default Deadline Tier</span>
            <span className="text-[11px] font-normal text-muted-foreground">
              (Fallback if not in file)
            </span>
          </label>
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
            {file
              ? 'File loaded above'
              : 'Auto-detects SL, Email, Submitted At, Obtained Marks, Total Marks, Status, Student Name, Roll'}
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
              : `1\ttanvirn014@gmail.com\t—\t0\t50\t0/50\tPending\t\t\n2\tabdulmajidrakib@gmail.com\tSep 13, 2026 10:15\t0\t30\t0/30\tSubmitted but marks not given\tAbdul Mazid Rakib\tWEB14-1390\n4\tabdmrdhali@gmail.com\tSep 11, 2026 6:15\t60\t60\t60/60\tCompleted\tAbdullah Ikra Bir\tWEB14-0761\nor paste entire table copied from Google Sheets / Excel`
          }
          rows={6}
          className="border rounded-md px-3 py-2 text-sm font-mono bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none disabled:opacity-50"
        />
      </div>

      {processing && (
        <BulkProgressOverlay
          isVisible={processing}
          title={result ? 'Applying Assignment Updates' : 'Parsing & Matching Students'}
          subtitle={
            result
              ? `Updating database records for ${progressTotal || result.matched} students...`
              : 'Verifying emails against student roster and extracting scores...'
          }
          progressPercent={progressPercent}
          currentCount={progressCurrent}
          totalCount={progressTotal}
          statusText={progressStatusText}
        />
      )}

      {result && !processing && (
        <BulkResultSummary
          result={result}
          processing={processing}
          onCommit={handleCommitAssignment}
          onCancel={() => setResult(null)}
          tier={tier}
          includePending={includePending}
          onToggleIncludePending={setIncludePending}
        />
      )}

      {!result && !processing && (
        <div className="flex justify-end">
          <button
            onClick={handleProcessAssignment}
            disabled={(!file && parseAssignmentInput(emailsText).length === 0) || processing}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-md text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm cursor-pointer"
          >
            <Zap className="w-4 h-4" />
            Process
          </button>
        </div>
      )}
    </div>
  );
}
