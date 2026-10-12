'use client';

import { useState, useRef } from 'react';
import { Zap, CheckCircle2, FileSpreadsheet } from 'lucide-react';
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

interface BulkAssignmentTabProps {
  onSuccess: (matchedCount: number, assignmentLabel: string) => void;
  onError: (msg: string | null) => void;
}

export function BulkAssignmentTab({ onSuccess, onError }: BulkAssignmentTabProps) {
  const [assignmentNum, setAssignmentNum] = useState(1);
  const [tier, setTier] = useState<DeadlineTier>(60);
  const [emailsText, setEmailsText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<BulkResult | null>(null);
  const [currentItems, setCurrentItems] = useState<AssignmentImportRow[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files?.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileSelect = (selectedFile: File) => {
    if (!selectedFile.name.match(/\.(csv|xlsx|xls)$/i)) {
      toast.error('File must be CSV or Excel (.xlsx/.xls) format');
      return;
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      toast.error('File size must be under 5MB');
      return;
    }

    setFile(selectedFile);
    setEmailsText('');
    setResult(null);
  };

  const handleProcessAssignment = async () => {
    try {
      setProcessing(true);
      onError(null);

      let items: AssignmentImportRow[] = [];

      if (file) {
        const fileData = await processAssignmentImportFile(file);
        items = fileData.items;

        if (fileData.invalidRows.length > 0) {
          toast(`${fileData.invalidRows.length} rows skipped (invalid or missing email)`, {
            icon: 'ℹ️',
          });
        }
      } else {
        items = parseAssignmentInput(emailsText);
        if (items.length === 0) {
          onError('Please enter at least one email or paste spreadsheet data');
          return;
        }
      }

      if (items.length === 0) {
        onError('No valid entries found with an email address');
        return;
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
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          dragActive
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/20 hover:border-primary/50'
        } ${file ? 'bg-green-50/50 border-green-300 dark:bg-green-950/20' : ''}`}
      >
        {file ? (
          <div className="flex items-center gap-3 justify-center">
            <CheckCircle2 className="w-6 h-6 text-green-600" />
            <div className="text-left">
              <p className="text-sm font-medium text-green-700 dark:text-green-300">{file.name}</p>
              <p className="text-xs text-green-600/80">
                Excel/CSV file ready to match by Email and update Marks
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary mx-auto flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-medium">
                Drag Excel (.xlsx) or CSV file here, or click to browse
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Columns supported: <strong>Name</strong> (optional), <strong>Email</strong>{' '}
                (required), <strong>marks</strong> (optional)
              </p>
            </div>
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          onChange={(e) => {
            if (e.target.files?.[0]) {
              handleFileSelect(e.target.files[0]);
            }
          }}
          className="hidden"
        />
      </div>

      <div className="flex justify-between items-center">
        <span className="text-xs text-muted-foreground">
          Or paste rows directly from Google Sheets / Excel below:
        </span>
        {file && (
          <button
            onClick={() => {
              setFile(null);
              setResult(null);
              setCurrentItems([]);
            }}
            className="text-xs text-muted-foreground hover:text-foreground underline"
          >
            Clear file
          </button>
        )}
      </div>

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
