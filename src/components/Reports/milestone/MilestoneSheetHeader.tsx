'use client';

import { Input } from '@/components/ui/input';

interface MilestoneSheetHeaderProps {
  reportTitle: string;
  totalStudents: number;
  finalTarget: number;
  onTitleChange: (value: string) => void;
  onTotalStudentsChange: (value: number) => void;
  onFinalTargetChange: (value: number) => void;
}

export function MilestoneSheetHeader({
  reportTitle,
  totalStudents,
  finalTarget,
  onTitleChange,
  onTotalStudentsChange,
  onFinalTargetChange,
}: MilestoneSheetHeaderProps) {
  return (
    <div className="border-b border-border bg-muted/30 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      {/* Report Title Editable Input */}
      <div className="flex items-center gap-2 flex-1 max-w-md">
        <Input
          type="text"
          value={reportTitle}
          onChange={(e) => onTitleChange(e.target.value)}
          className="text-lg font-bold tracking-tight bg-transparent border-transparent hover:border-border focus:border-primary px-1.5 h-9"
          placeholder="Game Changer – Jashim"
          aria-label="Report Title"
        />
      </div>

      {/* Sheet Parameters: Total Students & Final Target % */}
      <div className="flex items-center gap-6 text-sm shrink-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">
            Total Students:
          </span>
          <Input
            type="number"
            value={totalStudents}
            onChange={(e) => onTotalStudentsChange(Number(e.target.value) || 0)}
            className="w-20 h-8 font-bold text-center text-sm"
            aria-label="Total Students"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">
            Final Target:
          </span>
          <div className="flex items-center gap-1">
            <Input
              type="number"
              value={finalTarget}
              onChange={(e) => onFinalTargetChange(Number(e.target.value) || 0)}
              className="w-18 h-8 font-bold text-center text-sm"
              aria-label="Final Target Percentage"
            />
            <span className="font-bold text-muted-foreground">%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
