'use client';

import { useState } from 'react';
import { UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

interface BulkStudentsTabProps {
  onSuccess: (count: number) => void;
  onError: (msg: string | null) => void;
}

export function BulkStudentsTab({ onSuccess, onError }: BulkStudentsTabProps) {
  const [studentData, setStudentData] = useState('');
  const [processing, setProcessing] = useState(false);

  const handleProcessStudents = async () => {
    try {
      setProcessing(true);
      onError(null);

      const lines = studentData
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean);

      if (lines.length === 0) {
        onError('Please enter at least one student record');
        return;
      }

      toast.success(`Processing ${lines.length} student records`);
      onSuccess(lines.length);
      setStudentData('');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to process students';
      onError(message);
      toast.error(message);
    } finally {
      setProcessing(false);
    }
  };

  const lineCount = studentData.split('\n').filter((l) => l.trim()).length;

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 p-3 bg-blue-50/70 border border-blue-200 dark:bg-blue-950/20 dark:border-blue-900/50 rounded-lg text-xs text-blue-800 dark:text-blue-300">
        <span className="font-bold shrink-0">Format:</span>
        <code>Name, Email, Phone, Division, Status (one per line)</code>
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex justify-between">
          <Label className="text-sm font-semibold">Student Records</Label>
          <span className="text-xs text-muted-foreground font-mono italic">CSV Format</span>
        </div>
        <textarea
          value={studentData}
          onChange={(e) => setStudentData(e.target.value)}
          placeholder={
            'John Doe, john@example.com, +880 1712 000111, Dhaka, On Track\nJane Smith, jane@example.com, +880 1812 000222, Chittagong, Behind'
          }
          rows={8}
          className="border border-border rounded-lg px-3 py-2 text-sm font-mono bg-background text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/30 resize-none"
        />
        <p className="text-xs text-muted-foreground">
          {lineCount} record{lineCount !== 1 ? 's' : ''} entered
        </p>
      </div>

      <div className="flex justify-end">
        <Button
          onClick={handleProcessStudents}
          disabled={!studentData.trim() || processing}
          className="gap-2"
        >
          <UserPlus className="w-4 h-4" />
          {processing ? 'Processing...' : 'Process Student Upsert'}
        </Button>
      </div>
    </div>
  );
}
