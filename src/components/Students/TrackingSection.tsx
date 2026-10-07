'use client';

import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, TrendingDown, Zap, Flag } from 'lucide-react';
import type { StudentWithRelations } from '@/types';

import type { StudentStatus } from '@/models/Student';
import { studentApi } from '@/lib/api-client';
import toast from 'react-hot-toast';
import { StudentAssignment } from '@/interfaces/assignment.interface';
import { TrackingAssignmentGrid } from './TrackingAssignmentGrid';
import { TrackingStatsOverview } from './TrackingStatsOverview';

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
    let isCancelled = false;
    const fetchCurrentAssignment = async () => {
      try {
        const response = await fetch('/api/settings');
        const data = await response.json();
        const currentAssignment = data?.data?.currentAssignment;

        if (data?.success && currentAssignment && !isCancelled) {
          const assignmentNumber = parseInt(currentAssignment.split('-')[1], 10);

          if (!Number.isNaN(assignmentNumber)) {
            setCurrentAssignmentNumber(assignmentNumber);
          }
        }
      } catch (error) {
        if (!isCancelled) {
          console.error('Failed to fetch current assignment:', error);
        }
      }
    };

    fetchCurrentAssignment();
    return () => {
      isCancelled = true;
    };
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

  // Submitted assignments calculation (COMPLETED or SUBMITTED)
  const submittedAssignments = useMemo(
    () => assignments.filter((a) => a.status === 'COMPLETED' || a.status === 'SUBMITTED'),
    [assignments]
  );
  const totalSubmittedAssignments = submittedAssignments.length;

  // Total marks scored across submitted assignments
  const totalMarks = useMemo(() => {
    return assignments.reduce((sum, a) => {
      const val = typeof a.marks === 'number' && !Number.isNaN(a.marks) ? a.marks : 0;
      return sum + val;
    }, 0);
  }, [assignments]);

  // Average marks based on submitted assignment count (e.g. 360 / 6 = 60)
  const avgMarks = totalSubmittedAssignments > 0 ? totalMarks / totalSubmittedAssignments : 0;
  const avgMarksFormatted =
    totalSubmittedAssignments > 0
      ? Number.isInteger(avgMarks)
        ? String(avgMarks)
        : avgMarks.toFixed(1)
      : '0';

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
        <TrackingStatsOverview
          completedCount={completedCount}
          totalAssignments={totalAssignments}
          currentAssignmentNumber={currentAssignmentNumber}
          totalMarks={totalMarks}
          totalSubmittedAssignments={totalSubmittedAssignments}
          avgMarksFormatted={avgMarksFormatted}
        />

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
        <TrackingAssignmentGrid
          assignments={assignments}
          currentAssignmentNumber={currentAssignmentNumber}
        />
      </div>
    </div>
  );
}
