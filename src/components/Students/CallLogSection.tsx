'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { Phone, Plus, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { callLogApi } from '@/lib/api-client';

import { authClient } from '@/lib/auth-client';
import { CallLogForm } from './CallLogForm';
import { CallLogItem } from './CallLogItem';
import { CallLog } from '@/interfaces/callLog.interface';

interface CallLogSectionProps {
  studentId: string;
  callLogs?: CallLog[];
  onLogAdded?: (log: CallLog) => void;
  onLogDeleted?: (logId: string) => void;
  onUpdate?: () => void;
}

export function CallLogSection({
  studentId,
  callLogs: initialCallLogs = [],
  onLogAdded,
  onLogDeleted,
  onUpdate,
}: CallLogSectionProps) {
  // Sync state during render when prop changes to avoid cascading renders in useEffect
  const [prevInitial, setPrevInitial] = useState(initialCallLogs);
  const [callLogs, setCallLogs] = useState(initialCallLogs);

  if (initialCallLogs !== prevInitial) {
    setPrevInitial(initialCallLogs);
    setCallLogs(initialCallLogs);
  }

  const [showForm, setShowForm] = useState(false);
  const [expandedLog, setExpandedLog] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: session } = authClient.useSession();
  const loggedInUserName = session?.user?.name || '';
  const latestCall = callLogs[0];

  const handleFormSubmit = async (formData: {
    status: CallLog['status'];
    issues: string;
    promised: string;
    notes: string;
  }) => {
    try {
      setSubmitting(true);
      setError(null);

      const mentorName = loggedInUserName.trim() || 'Mentor';

      const payload: {
        studentId: string;
        status: CallLog['status'];
        date: Date;
        calledBy?: string;
        issues?: string;
        promised?: string;
        notes?: string;
      } = {
        studentId,
        status: formData.status,
        date: new Date(),
        calledBy: mentorName,
      };

      if (formData.issues.trim()) payload.issues = formData.issues.trim();
      if (formData.promised.trim()) payload.promised = formData.promised.trim();
      if (formData.notes.trim()) payload.notes = formData.notes.trim();

      const response = await callLogApi.create(payload);
      if (response.error) throw new Error(response.error);

      const newLog = response.data as CallLog;
      setCallLogs([newLog, ...callLogs]);
      onLogAdded?.(newLog);
      onUpdate?.();

      toast.success('Call log and next follow-up created successfully');
      setShowForm(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create call log';
      setError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (logId: string) => {
    try {
      setDeletingId(logId);
      const response = await callLogApi.delete(logId);
      if (response.error) throw new Error(response.error);

      setCallLogs(callLogs.filter((log) => log._id !== logId));
      onLogDeleted?.(logId);
      onUpdate?.();
      toast.success('Call log deleted');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete call log';
      toast.error(message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="bg-background rounded-xl border shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Phone className="w-4 h-4 text-amber-500" />
          <h3 className="font-semibold text-sm">Call Log & Outreach</h3>
        </div>
        <div className="flex items-center gap-3">
          {latestCall && (
            <span className="text-xs px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded font-medium">
              Last: {format(new Date(latestCall.date), 'MMM d, yyyy')}
            </span>
          )}
          <button
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-xs font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
            disabled={submitting}
          >
            <Plus className="w-3.5 h-3.5" />
            Add Log
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="px-6 py-3 bg-destructive/10 border-b flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-destructive shrink-0" />
          <p className="text-sm text-destructive flex-1">{error}</p>
          <button
            onClick={() => setError(null)}
            className="text-xs font-medium text-destructive hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Add Log Form Component */}
      {showForm && (
        <CallLogForm
          loggedInUserName={loggedInUserName}
          submitting={submitting}
          onCancel={() => setShowForm(false)}
          onSubmit={handleFormSubmit}
        />
      )}

      {/* Call Log History List */}
      <div className="divide-y divide-border">
        {callLogs.length === 0 ? (
          <div className="px-6 py-10 text-center text-muted-foreground italic text-sm">
            No call history recorded yet.
          </div>
        ) : (
          callLogs.map((log) => {
            const logId = log._id!;
            return (
              <CallLogItem
                key={logId}
                log={log}
                isExpanded={expandedLog === logId}
                isDeleting={deletingId === logId}
                onToggleExpand={() => setExpandedLog(expandedLog === logId ? null : logId)}
                onDelete={handleDelete}
              />
            );
          })
        )}
      </div>
    </div>
  );
}
