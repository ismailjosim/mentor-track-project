'use client';

import { useState, useCallback } from 'react';
import { CallLogSection } from '@/components/Students/CallLogSection';
import { FollowUpSection } from '@/components/Students/FollowUpSection';
import type { CallLog } from '@/interfaces/callLog.interface';
import type { FollowUp } from '@/interfaces/followUp.interface';
import { followUpApi } from '@/lib/api-client';

interface StudentActivityPanelProps {
  callLogs: CallLog[];
  followUps: FollowUp[];
  studentId: string;
  onUpdate?: () => void;
}

const StudentActivityPanel = ({
  callLogs: initialCallLogs,
  followUps: initialFollowUps,
  studentId,
  onUpdate,
}: StudentActivityPanelProps) => {
  const [prevInitialLogs, setPrevInitialLogs] = useState<CallLog[]>(initialCallLogs);
  const [callLogs, setCallLogs] = useState<CallLog[]>(initialCallLogs);

  if (initialCallLogs !== prevInitialLogs) {
    setPrevInitialLogs(initialCallLogs);
    setCallLogs(initialCallLogs);
  }

  const [prevInitialFollowUps, setPrevInitialFollowUps] = useState<FollowUp[]>(initialFollowUps);
  const [followUps, setFollowUps] = useState<FollowUp[]>(initialFollowUps);

  if (initialFollowUps !== prevInitialFollowUps) {
    setPrevInitialFollowUps(initialFollowUps);
    setFollowUps(initialFollowUps);
  }

  const refreshFollowUps = useCallback(async () => {
    try {
      const res = await followUpApi.getAll(studentId);
      if (res?.data) {
        const raw = res.data as { data?: FollowUp[] } | FollowUp[];
        const list = Array.isArray(raw) ? raw : raw.data || [];
        setFollowUps(list);
      }
    } catch (err) {
      console.error('Failed to refresh follow-ups:', err);
    }
  }, [studentId]);

  const handleCallLogAdded = useCallback(
    async (newLog: CallLog) => {
      setCallLogs((prev) => [newLog, ...prev]);
      await refreshFollowUps();
      onUpdate?.();
    },
    [refreshFollowUps, onUpdate]
  );

  const handleCallLogDeleted = useCallback(
    (logId: string) => {
      setCallLogs((prev) => prev.filter((log) => log._id !== logId));
      onUpdate?.();
    },
    [onUpdate]
  );

  const handleFollowUpUpdate = useCallback(async () => {
    await refreshFollowUps();
    onUpdate?.();
  }, [refreshFollowUps, onUpdate]);

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <div className="md:col-span-1">
        <CallLogSection
          callLogs={callLogs}
          studentId={studentId}
          onLogAdded={handleCallLogAdded}
          onLogDeleted={handleCallLogDeleted}
          onUpdate={onUpdate}
        />
      </div>

      <div className="md:col-span-1">
        <FollowUpSection
          followUps={followUps}
          studentId={studentId}
          onUpdate={handleFollowUpUpdate}
        />
      </div>
    </div>
  );
};

export default StudentActivityPanel;
