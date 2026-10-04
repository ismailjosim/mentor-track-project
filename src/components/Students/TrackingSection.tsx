'use client';

import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, TrendingDown, Zap, Flag } from 'lucide-react';
import type { StudentWithRelations } from '@/types';

import type { StudentStatus } from '@/models/Student';
import { studentApi } from '@/lib/api-client';
import toast from 'react-hot-toast';
import { StudentAssignment } from '@/interfaces/assignment.interface';

interface TrackingSectionProps {
  student: StudentWithRelations;
  assignments: StudentAssignment[];
  onUpdate: () => void;
}

const STATUS_OPTIONS: {
  value: StudentStatus;
  label: string;
  color: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  {
    value: 'On Track',
    label: 'On Track',
    color: 'status-success',
    icon: CheckCircle2,
  },
  {
    value: 'Behind',
    label: 'Behind',
    color: 'status-warning',
    icon: TrendingDown,
  },
  {
    value: 'At Risk',
    label: 'At Risk',
    color: 'status-danger',
    icon: AlertCircle,
  },
  {
    value: 'Dropped',
    label: 'Dropped',
    color: 'status-neutral',
    icon: Flag,
  },
  {
    value: 'Completed',
    label: 'Completed',
    color: 'status-info',
    icon: CheckCircle2,
  },
];

export function TrackingSection({ student, assignments, onUpdate }: TrackingSectionProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [autoDetectMode, setAutoDetectMode] = useState(false);
  const [currentAssignmentNumber, setCurrentAssignmentNumber] = useState(1);

  useEffect(() => {
    const fetchCurrentAssignment = async () => {
      try {
        const response = await fetch('/api/settings');
        const data = await response.json();
        const currentAssignment = data?.data?.currentAssignment;

        if (data?.success && currentAssignment) {
          const assignmentNumber = parseInt(currentAssignment.split('-')[1], 10);

          if (!Number.isNaN(assignmentNumber)) {
            setCurrentAssignmentNumber(assignmentNumber);
          }
        }
      } catch (error) {
        console.error('Failed to fetch current assignment:', error);
      }
    };

    fetchCurrentAssignment();
  }, []);

  // Calculate auto-detected status
  const detectedStatus = useMemo(() => {
    const incompleteReleasedAssignments = Array.from(
      { length: currentAssignmentNumber },
      (_, index) => index + 1
    ).filter((assignmentNumber) => {
      const assignment = assignments.find((a) => a.assignmentNumber === assignmentNumber);

      return assignment?.status !== 'COMPLETED' && assignment?.status !== 'SUBMITTED';
    }).length;

    if (incompleteReleasedAssignments === 0) {
      return 'On Track';
    }

    if (incompleteReleasedAssignments === 1) {
      return 'Behind';
    }

    if (incompleteReleasedAssignments >= 2) {
      return 'At Risk';
    }

    return 'On Track';
  }, [assignments, currentAssignmentNumber]);

  const handleStatusUpdate = async (newStatus: StudentStatus) => {
    try {
      setIsUpdating(true);
      const response = await studentApi.update(student._id!, {
        currentStatus: newStatus,
      });

      if (response.error) {
        throw new Error(response.error);
      }

      toast.success(`Status updated to ${newStatus}`);
      onUpdate();
      setAutoDetectMode(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update status';
      toast.error(message);
    } finally {
      setIsUpdating(false);
    }
  };

  const currentStatus = student.currentStatus || 'On Track';
  const statusOption = STATUS_OPTIONS.find((opt) => opt.value === currentStatus);
  const StatusIcon = statusOption?.icon || CheckCircle2;

  const completedCount = assignments.filter(
    (a) =>
      a.assignmentNumber <= currentAssignmentNumber &&
      (a.status === 'COMPLETED' || a.status === 'SUBMITTED')
  ).length;

  const totalAssignments = currentAssignmentNumber;

  return (
    <div className="bg-background border rounded-xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b bg-linear-to-r from-primary/5 to-primary/10">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Zap className="w-5 h-5 text-primary" />
          Student Tracking
        </h2>
      </div>

      <div className="p-6 space-y-6">
        {/* Current Status */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Current Status
          </h3>
          <div
            className={`flex items-center gap-3 p-4 rounded-lg border ${statusOption?.color || 'status-neutral'}`}
          >
            <StatusIcon className="w-5 h-5" />
            <span className="font-semibold">{currentStatus}</span>
            {autoDetectMode && (
              <span className="ml-auto text-xs font-medium opacity-70">(Manual)</span>
            )}
          </div>
        </div>

        {/* Progress Overview */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Progress Overview
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="p-4 bg-muted/30 rounded-lg border">
              <p className="text-xs text-muted-foreground mb-1">Assignments Submitted</p>
              <p className="text-2xl font-bold">
                {completedCount}/{totalAssignments}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {Math.round((completedCount / totalAssignments) * 100)}%
              </p>
            </div>
            <div className="p-4 bg-muted/30 rounded-lg border">
              <p className="text-xs text-muted-foreground mb-1">Current Assignment</p>
              <p className="text-2xl font-bold">
                A-{String(currentAssignmentNumber).padStart(2, '0')}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Target to complete</p>
            </div>
          </div>
        </div>

        {/* Auto-Detection Info */}
        <div className="p-4 status-info rounded-lg border">
          <p className="text-xs font-semibold mb-2">Auto-Detection Rules:</p>
          <ul className="text-xs space-y-1 list-disc list-inside">
            <li>
              2+ released assignments not submitted → <strong>At Risk</strong>
            </li>
            <li>
              1 released assignment not submitted → <strong>Behind</strong>
            </li>
            <li>
              All released assignments submitted → <strong>On Track</strong>
            </li>
          </ul>
        </div>

        {/* Recommended Status */}
        {detectedStatus !== currentStatus && (
          <div className="p-4 status-warning rounded-lg border">
            <p className="text-xs font-semibold mb-3">
              Recommended Status: <strong>{detectedStatus}</strong>
            </p>
            <button
              onClick={() => handleStatusUpdate(detectedStatus as StudentStatus)}
              disabled={isUpdating}
              className="w-full px-3 py-2 bg-warning text-primary-foreground text-sm font-medium rounded-md hover:opacity-90 transition-colors disabled:opacity-50"
            >
              {isUpdating ? 'Updating...' : `Apply Recommended Status`}
            </button>
          </div>
        )}

        {/* Manual Status Update */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Update Status Manually
            </h3>
            {autoDetectMode && (
              <button
                onClick={() => setAutoDetectMode(false)}
                className="text-xs text-primary hover:underline"
              >
                Clear
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => {
                  setAutoDetectMode(opt.value !== detectedStatus);
                  handleStatusUpdate(opt.value);
                }}
                disabled={isUpdating}
                className={`p-3 rounded-lg border font-medium text-sm transition-all ${
                  currentStatus === opt.value
                    ? `${opt.color} border-current`
                    : 'bg-muted/50 text-muted-foreground hover:bg-muted border-transparent'
                } disabled:opacity-50`}
              >
                <div className="flex flex-col items-center gap-1">
                  <opt.icon className="w-4 h-4" />
                  <span className="text-xs">{opt.label}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Assignment Status Summary */}
        <div className="space-y-3 border-t pt-6">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Assignment Status
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-3">
            {Array.from({ length: 10 }, (_, i) => {
              const assignmentNum = i + 1;
              const assignment = assignments.find((a) => a.assignmentNumber === assignmentNum);
              const isCompleted = assignment?.status === 'COMPLETED';
              const isSubmitted = assignment?.status === 'SUBMITTED';
              const isCurrent = assignmentNum === currentAssignmentNumber;

              const statusClass = isCompleted
                ? 'status-success font-semibold shadow-xs'
                : isSubmitted
                  ? 'status-info font-semibold shadow-xs'
                  : isCurrent
                    ? 'status-warning font-semibold'
                    : 'status-neutral';

              const statusTitle = isCompleted
                ? 'Completed (Graded / Has Marks)'
                : isSubmitted
                  ? 'Submitted (No Marks Yet)'
                  : isCurrent
                    ? 'Current Assignment'
                    : 'Not Started';

              return (
                <div
                  key={assignmentNum}
                  className={`flex flex-col items-center justify-center min-h-14 rounded-lg border px-2 py-2 text-xs transition-all ${statusClass}`}
                  title={statusTitle}
                >
                  <span className="font-bold">A-{String(assignmentNum).padStart(2, '0')}</span>
                  <span className="text-[10px] font-medium opacity-90 mt-0.5">
                    {isCompleted
                      ? 'Completed'
                      : isSubmitted
                        ? 'Submitted'
                        : isCurrent
                          ? 'Current'
                          : 'Pending'}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground pt-1">
            <span className="inline-flex items-center">
              <span className="inline-block w-3.5 h-3.5 bg-success-soft border border-success-border rounded mr-2" />
              Completed
            </span>
            <span className="inline-flex items-center">
              <span className="inline-block w-3.5 h-3.5 bg-info-soft border border-info-border rounded mr-2" />
              Submitted (No Marks)
            </span>
            <span className="inline-flex items-center">
              <span className="inline-block w-3.5 h-3.5 bg-warning-soft border border-warning-border rounded mr-2" />
              Current
            </span>
            <span className="inline-flex items-center">
              <span className="inline-block w-3.5 h-3.5 bg-neutral-soft border border-neutral-border rounded mr-2" />
              Not Started
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
