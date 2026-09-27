'use client';

import { useState, useRef } from 'react';
import { Zap, Upload, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { processAssignmentImportFile } from '@/lib/file-parser';
import { ASSIGNMENTS, parseEmails, type BulkResult } from './types';
import { BulkResultSummary } from './BulkResultSummary';

interface BulkAssignmentTabProps {
  onSuccess: (matchedCount: number, assignmentLabel: string) => void;
  onError: (msg: string | null) => void;
}

export function BulkAssignmentTab({ onSuccess, onError }: BulkAssignmentTabProps) {
  const [assignmentNum, setAssignmentNum] = useState(1);
  const [emailsText, setEmailsText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<BulkResult | null>(null);
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
    if (!selectedFile.name.match(/\.(csv|xlsx)$/i)) {
      toast.error('File must be CSV or XLSX format');
      return;
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      toast.error('File size must be under 5MB');
      return;
    }

    setFile(selectedFile);
    setEmailsText('');
  };

  const handleProcessAssignment = async () => {
    try {
      setProcessing(true);
      onError(null);

      let emails: string[] = [];

      if (file) {
        const fileData = await processAssignmentImportFile(file);
        emails = fileData.validEmails;
        if (fileData.invalidRows.length > 0) {
          onError(`${fileData.invalidRows.length} invalid rows found`);
        }
      } else {
        emails = parseEmails(emailsText);
        if (emails.length === 0) {
          onError('Please enter at least one email');
          return;
        }
      }

      const response = await fetch('/api/assignments/bulk-match', {
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
      const emails = file
        ? await processAssignmentImportFile(file).then((f) => f.validEmails)
        : parseEmails(emailsText);

      const response = await fetch('/api/assignments/bulk-submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emails, assignmentNumber: assignmentNum }),
      });

      const apiResult = await response.json();

      if (!response.ok) {
        onError(apiResult.message || 'Failed to submit assignments');
        toast.error(apiResult.message || 'Failed to submit assignments');
        return;
      }

      const matchedCount = result?.matched ?? 0;
      const label = ASSIGNMENTS[assignmentNum - 1].label;
      toast.success(`Successfully updated ${matchedCount} students for ${label}`);

      setResult(null);
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
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-semibold">Select Assignment</label>
        <select
          value={assignmentNum}
          onChange={(e) => setAssignmentNum(Number(e.target.value))}
          disabled={processing}
          className="border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 w-full md:w-64 disabled:opacity-50"
        >
          {ASSIGNMENTS.map((a) => (
            <option key={a.value} value={a.value}>
              {a.label}
            </option>
          ))}
        </select>
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
          <div className="flex items-center gap-2 justify-center">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <div className="text-left">
              <p className="text-sm font-medium text-green-600">{file.name}</p>
              <p className="text-xs text-green-500">File selected and ready to process</p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <Upload className="w-6 h-6 text-muted-foreground mx-auto" />
            <div>
              <p className="text-sm font-medium">Drag file here or click to select</p>
              <p className="text-xs text-muted-foreground">CSV or Excel (.xlsx)</p>
            </div>
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.xlsx"
          onChange={(e) => {
            if (e.target.files?.[0]) {
              handleFileSelect(e.target.files[0]);
            }
          }}
          className="hidden"
        />
      </div>

      <div className="flex justify-between items-center">
        <span className="text-xs text-muted-foreground">Or paste emails below (one per line)</span>
        {file && (
          <button
            onClick={() => {
              setFile(null);
              setResult(null);
            }}
            className="text-xs text-muted-foreground hover:text-foreground underline"
          >
            Clear file
          </button>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex justify-between">
          <label className="text-sm font-semibold">Email List</label>
          <span className="text-xs text-muted-foreground">
            {file ? 'File loaded above' : 'One email per line'}
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
              ? 'Emails from file selected above'
              : 'student1@example.com\nstudent2@example.com\nstudent3@example.com'
          }
          rows={7}
          className="border rounded-md px-3 py-2 text-sm font-mono bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none disabled:opacity-50"
        />
      </div>

      {result && (
        <BulkResultSummary
          result={result}
          processing={processing}
          onCommit={handleCommitAssignment}
          onCancel={() => setResult(null)}
        />
      )}

      {!result && (
        <div className="flex justify-end">
          <button
            onClick={handleProcessAssignment}
            disabled={(!file && parseEmails(emailsText).length === 0) || processing}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Zap className="w-4 h-4" />
            {processing ? 'Processing...' : 'Process'}
          </button>
        </div>
      )}
    </div>
  );
}
