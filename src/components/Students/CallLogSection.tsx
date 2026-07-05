/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState } from 'react';
import { Phone, Plus, ChevronDown, ChevronUp, Trash2, AlertCircle } from 'lucide-react';
import { authClient } from '@/lib/auth-client';
import { format } from 'date-fns';
import type { CallLog } from '@/interfaces/callLog.interface';
import { getCallLogStatusLabel, getCallLogStatusClass } from '@/lib/ui-helpers';
import { callLogApi } from '@/lib/api-client';
import toast from 'react-hot-toast';

interface CallLogSectionProps {
  callLogs: CallLog[];
  studentId: string;
}

const CALL_STATUSES: CallLog['status'][] = [
  'RECEIVED',
  'NOT_RECEIVED',
  'PHONE_OFF',
  'SWITCHED_OFF',
  'FOREIGN_NUMBER',
  'BUSY',
];

export function CallLogSection({ callLogs: initialCallLogs, studentId }: CallLogSectionProps) {
  const [callLogs, setCallLogs] = useState(initialCallLogs);
  const [showForm, setShowForm] = useState(false);
  const [expandedLog, setExpandedLog] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { data: session } = authClient.useSession();

  const [form, setForm] = useState({
    status: 'RECEIVED' as CallLog['status'],
    issues: '',
    promised: '',
    notes: '',
    calledBy: session?.user?.name || '',
  });

  const latestCall = callLogs[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);

      // Build payload with only non-empty fields
      const payload: any = {
        studentId,
        status: form.status,
        date: new Date(),
      };

      if (form.calledBy.trim()) payload.calledBy = form.calledBy.trim();
      if (form.issues.trim()) payload.issues = form.issues.trim();
      if (form.promised.trim()) payload.promised = form.promised.trim();
      if (form.notes.trim()) payload.notes = form.notes.trim();

      const response = await callLogApi.create(payload);

      if (response.error) {
        throw new Error(response.error);
      }

      const newLog = response.data as CallLog;
      setCallLogs([newLog, ...callLogs]);

      toast.success('Call log and next follow-up created successfully');

      setShowForm(false);
      setForm({
        status: 'RECEIVED',
        issues: '',
        promised: '',
        notes: '',
        calledBy: session?.user?.name || '',
      });
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

      if (response.error) {
        throw new Error(response.error);
      }

      setCallLogs(callLogs.filter((log) => log._id !== logId));
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
          <h3 className="font-semibold">Call Log & Outreach</h3>
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

      {/* Add Log Form */}
      {showForm && (
        <div className="px-6 py-5 border-b bg-muted/10">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
            New Call Entry
          </p>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium">Call Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as CallLog['status'] })}
                className="border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
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
              <label className="text-xs font-medium">Called By</label>
              <input
                type="text"
                value={form.calledBy}
                onChange={(e) => setForm({ ...form, calledBy: e.target.value })}
                placeholder="Mentor name"
                className="border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                disabled={submitting}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium">Issue Mentioned</label>
              <input
                type="text"
                value={form.issues}
                onChange={(e) => setForm({ ...form, issues: e.target.value })}
                placeholder="e.g. Too busy at work"
                className="border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                disabled={submitting}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium">Promise Made</label>
              <input
                type="text"
                value={form.promised}
                onChange={(e) => setForm({ ...form, promised: e.target.value })}
                placeholder="e.g. Finish A6 by Saturday"
                className="border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                disabled={submitting}
              />
            </div>

            <div className="md:col-span-2 flex flex-col gap-1.5">
              <label className="text-xs font-medium">Notes</label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Additional call notes..."
                rows={3}
                className="border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                disabled={submitting}
              />
            </div>

            <div className="md:col-span-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 border rounded-md text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                disabled={submitting}
              >
                {submitting ? 'Saving...' : 'Save Log'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Call Log History */}
      <div className="divide-y divide-border">
        {callLogs.length === 0 ? (
          <div className="px-6 py-10 text-center text-muted-foreground italic text-sm">
            No call history recorded yet.
          </div>
        ) : (
          callLogs.map((log) => {
            const logId = log._id!;
            const isExpanded = expandedLog === logId;
            const isDeleting = deletingId === logId;
            return (
              <div key={logId} className="px-6 py-4 group">
                <button
                  className="w-full flex items-center justify-between gap-3 text-left"
                  onClick={() => setExpandedLog(isExpanded ? null : logId)}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded ${getCallLogStatusClass(log.status)}`}
                    >
                      {getCallLogStatusLabel(log.status)}
                    </span>
                    <span className="text-sm font-medium">
                      {format(new Date(log.date), 'MMM d, yyyy')}
                    </span>
                    {log.calledBy && (
                      <span className="text-xs text-muted-foreground">by {log.calledBy}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(logId);
                      }}
                      disabled={isDeleting}
                      className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-destructive/10 rounded transition-all disabled:opacity-50"
                      title="Delete call log"
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </button>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                </button>

                {isExpanded && (
                  <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    {log.issues && (
                      <div>
                        <p className="text-xs text-muted-foreground font-medium">Issue</p>
                        <p>{log.issues}</p>
                      </div>
                    )}
                    {log.promised && (
                      <div>
                        <p className="text-xs text-muted-foreground font-medium">Promise</p>
                        <p>{log.promised}</p>
                      </div>
                    )}
                    {log.notes && (
                      <div className="md:col-span-2">
                        <p className="text-xs text-muted-foreground font-medium">Notes</p>
                        <p className="text-muted-foreground">{log.notes}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
