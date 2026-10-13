'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import toast from 'react-hot-toast';
import type { AssignmentPerformanceStat } from '@/types';
import {
  DEFAULT_MILESTONES,
  type MilestoneRow,
  type ComputedMilestoneRow,
  type ActionLogRow,
} from './types';

export function useMilestoneReport(cohort: string = 'all') {
  const [reportTitle, setReportTitle] = useState('Game Changer – Jashim');
  const [totalStudents, setTotalStudents] = useState<number>(212);
  const [finalTarget, setFinalTarget] = useState<number>(70);
  const [milestones, setMilestones] = useState<MilestoneRow[]>(DEFAULT_MILESTONES);
  const [actionLogs, setActionLogs] = useState<ActionLogRow[]>([
    {
      id: '1',
      action: 'Outreach to inactive students',
      date: new Date().toISOString().split('T')[0],
      outcome: 'Reached 15 students',
      followUp: 'Check A-06 marks next round',
    },
  ]);
  const [isExporting, setIsExporting] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // Auto-fetch cohort data from dashboard overview to prefill accurate live numbers
  useEffect(() => {
    async function loadLiveData() {
      try {
        const res = await fetch(`/api/dashboard${cohort !== 'all' ? `?cohort=${cohort}` : ''}`);
        if (!res.ok) return;
        const data = await res.json();
        const overview = data.data;

        if (overview?.stats?.totalStudents) {
          setTotalStudents(overview.stats.totalStudents);
        }

        // Prefill actual milestone completion if available in assignmentStats
        if (overview?.assignmentStats && Array.isArray(overview.assignmentStats)) {
          setMilestones((current) =>
            current.map((row) => {
              const num = parseInt(row.milestone.replace(/\D/g, ''), 10);
              const found = overview.assignmentStats.find(
                (item: AssignmentPerformanceStat) => item.assignmentNumber === num
              );
              if (found) {
                const completionVal =
                  found.gradedCount > 0 ? found.gradedCount : found.submittedCount;
                return {
                  ...row,
                  actualCompletion: completionVal > 0 ? completionVal : row.actualCompletion,
                  studentsReached:
                    completionVal > 0 && row.studentsReached === ''
                      ? completionVal
                      : row.studentsReached,
                };
              }
              return row;
            })
          );
        }
      } catch (err) {
        console.warn('Could not auto-fetch live dashboard overview for milestone report', err);
      }
    }

    loadLiveData();
  }, [cohort]);

  // Derived calculations for milestone rows
  const computedMilestones: ComputedMilestoneRow[] = useMemo(() => {
    return milestones.map((m) => {
      const targetCount = Math.round(totalStudents * (m.targetPct / 100));
      const actualVal = typeof m.actualCompletion === 'number' ? m.actualCompletion : null;
      const actualPct =
        actualVal !== null && totalStudents > 0
          ? Number(((actualVal / totalStudents) * 100).toFixed(1))
          : null;
      const gap = actualPct !== null ? Number((actualPct - m.targetPct).toFixed(1)) : null;
      const shortfall = actualVal !== null ? Math.max(0, targetCount - actualVal) : null;

      return {
        ...m,
        targetCount,
        actualPct,
        gap,
        shortfall,
      };
    });
  }, [milestones, totalStudents]);

  // Milestone-10 summary statistics
  const m10Row =
    computedMilestones.find((m) => m.milestone.includes('10')) ||
    computedMilestones[computedMilestones.length - 1];
  const m10TargetStudents = m10Row?.targetCount ?? Math.round(totalStudents * (finalTarget / 100));
  const m10ActualStudents =
    typeof m10Row?.actualCompletion === 'number' ? m10Row.actualCompletion : 0;
  const m10ActualPct =
    totalStudents > 0 ? Number(((m10ActualStudents / totalStudents) * 100).toFixed(1)) : 0;
  const m10Gap = Number((m10ActualPct - finalTarget).toFixed(1));

  const handleMilestoneChange = useCallback(
    (index: number, field: keyof MilestoneRow, val: MilestoneRow[keyof MilestoneRow]) => {
      setMilestones((prev) => {
        const updated = [...prev];
        updated[index] = { ...updated[index], [field]: val };
        return updated;
      });
    },
    []
  );

  const handleAddActionLog = useCallback(() => {
    setActionLogs((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        action: '',
        date: new Date().toISOString().split('T')[0],
        outcome: '',
        followUp: '',
      },
    ]);
  }, []);

  const handleRemoveActionLog = useCallback((id: string) => {
    setActionLogs((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const handleActionLogChange = useCallback(
    (id: string, field: keyof ActionLogRow, val: string) => {
      setActionLogs((prev) =>
        prev.map((item) => (item.id === id ? { ...item, [field]: val } : item))
      );
    },
    []
  );

  // Export to Excel file matching the official spreadsheet
  const handleExportExcel = useCallback(async () => {
    try {
      setIsExporting(true);
      const payload = {
        title: reportTitle,
        totalStudents,
        finalTarget,
        milestones: computedMilestones.map((m) => ({
          milestone: m.milestone,
          targetPct: m.targetPct,
          targetStudents: m.targetCount,
          actualCompletion: m.actualCompletion,
          actualPct: m.actualPct,
          gap: m.gap,
          shortfall: m.shortfall,
          studentsReached: m.studentsReached,
          initiativesTaken: m.initiativesTaken,
          remarks: m.remarks,
        })),
        actionLogs,
      };

      const res = await fetch('/api/export/milestone-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Failed to generate Excel file');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Milestone_Weekly_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Excel spreadsheet downloaded!');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setIsExporting(false);
    }
  }, [reportTitle, totalStudents, finalTarget, computedMilestones, actionLogs]);

  // Copy Tab-Separated string directly to clipboard for instant pasting into Google Sheets
  const handleCopyToClipboard = useCallback(() => {
    try {
      const rows: string[] = [];
      rows.push(`${reportTitle}\t\t\t\t\t\t\t\t\t`);
      rows.push('');
      rows.push(`Total Students\t${totalStudents}\t\tFinal Target\t${finalTarget}%\t\t\t\t\t`);
      rows.push('');
      rows.push(
        [
          'Milestone',
          'Target %',
          'Target Students',
          'Actual Completion',
          'Actual %',
          'Gap',
          'Required / Shortfall',
          'Students Reached',
          'Initiatives Taken',
          'Remarks',
        ].join('\t')
      );

      computedMilestones.forEach((m) => {
        rows.push(
          [
            m.milestone,
            `${m.targetPct}%`,
            m.targetCount,
            m.actualCompletion,
            m.actualPct !== null ? `${m.actualPct}%` : '',
            m.gap !== null ? `${m.gap}%` : '',
            m.shortfall !== null ? m.shortfall : '',
            m.studentsReached,
            `"${m.initiativesTaken.replace(/"/g, '""')}"`,
            `"${m.remarks.replace(/"/g, '""')}"`,
          ].join('\t')
        );
      });

      rows.push('');
      rows.push(`Milestone-10 Final Target Check\t\t\tMentor Action Log\t\t\t`);
      rows.push(
        `Target Students\t${m10TargetStudents}\t\tAction / Initiative\tDate\tOutcome\tFollow-up`
      );
      rows.push(
        `Actual Students\t${m10ActualStudents}\t\t${actionLogs[0]?.action || ''}\t${actionLogs[0]?.date || ''}\t${actionLogs[0]?.outcome || ''}\t${actionLogs[0]?.followUp || ''}`
      );
      rows.push(
        `Actual Completion %\t${m10ActualPct}%\t\t${actionLogs[1]?.action || ''}\t${actionLogs[1]?.date || ''}\t${actionLogs[1]?.outcome || ''}\t${actionLogs[1]?.followUp || ''}`
      );
      rows.push(
        `Gap vs Target\t${m10Gap}%\t\t${actionLogs[2]?.action || ''}\t${actionLogs[2]?.date || ''}\t${actionLogs[2]?.outcome || ''}\t${actionLogs[2]?.followUp || ''}`
      );

      navigator.clipboard.writeText(rows.join('\n'));
      setIsCopied(true);
      toast.success('Copied! You can paste (Ctrl+V) directly into Google Sheets.');
      setTimeout(() => setIsCopied(false), 3000);
    } catch {
      toast.error('Failed to copy to clipboard');
    }
  }, [
    reportTitle,
    totalStudents,
    finalTarget,
    computedMilestones,
    m10TargetStudents,
    m10ActualStudents,
    m10ActualPct,
    m10Gap,
    actionLogs,
  ]);

  return {
    reportTitle,
    setReportTitle,
    totalStudents,
    setTotalStudents,
    finalTarget,
    setFinalTarget,
    milestones,
    computedMilestones,
    actionLogs,
    isExporting,
    isCopied,
    m10TargetStudents,
    m10ActualStudents,
    m10ActualPct,
    m10Gap,
    handleMilestoneChange,
    handleAddActionLog,
    handleRemoveActionLog,
    handleActionLogChange,
    handleExportExcel,
    handleCopyToClipboard,
  };
}
