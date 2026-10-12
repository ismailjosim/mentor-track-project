'use client';

import { Plus, Minus } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { AssignmentMaxMarks } from '@/interfaces/assignment.interface';

interface AssignmentMarksInputProps {
  newMarks: string;
  newMaxMarks: AssignmentMaxMarks;
  isLoading: boolean;
  onMarksChange: (val: string) => void;
  onAdjustMarks: (delta: number) => void;
}

export function AssignmentMarksInput({
  newMarks,
  newMaxMarks,
  isLoading,
  onMarksChange,
  onAdjustMarks,
}: AssignmentMarksInputProps) {
  const parsed = Number(newMarks);
  const liveMarksNum = !Number.isNaN(parsed) && newMarks.trim() !== '' ? parsed : null;
  const liveMarksPct =
    liveMarksNum !== null ? Math.min(100, Math.round((liveMarksNum / newMaxMarks) * 100)) : null;

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-sm font-medium text-foreground">
          Assignment Marks (0–{newMaxMarks})
        </label>
        <span className="text-xs text-muted-foreground">Defaulted to {newMaxMarks}</span>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onAdjustMarks(-1)}
          disabled={isLoading || (liveMarksNum !== null && liveMarksNum <= 0)}
          className="h-10 w-10 shrink-0 rounded-md border border-border flex items-center justify-center hover:bg-muted font-bold transition-colors disabled:opacity-40"
          title="Minus 1 mark"
        >
          <Minus className="w-4 h-4" />
        </button>
        <input
          type="number"
          min={0}
          max={newMaxMarks}
          value={newMarks}
          onChange={(e) => onMarksChange(e.target.value)}
          placeholder="Enter marks"
          disabled={isLoading}
          className="flex-1 px-3 py-2 border border-border rounded-md bg-background text-foreground disabled:opacity-50 text-sm text-center font-bold"
        />
        <button
          type="button"
          onClick={() => onAdjustMarks(1)}
          disabled={isLoading || (liveMarksNum !== null && liveMarksNum >= newMaxMarks)}
          className="h-10 w-10 shrink-0 rounded-md border border-border flex items-center justify-center hover:bg-muted font-bold transition-colors disabled:opacity-40"
          title="Plus 1 mark"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <div className="flex items-center justify-end gap-1.5 mt-2">
        <span className="text-[11px] text-muted-foreground mr-1">Quick adjust:</span>
        {[-5, -1, 1, 5].map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => onAdjustMarks(d)}
            disabled={isLoading}
            className="text-xs px-2.5 py-1 rounded border border-border bg-muted/40 hover:bg-muted text-foreground font-medium transition-colors"
          >
            {d > 0 ? `+${d}` : d}
          </button>
        ))}
      </div>

      {liveMarksPct !== null && (
        <div className="mt-2">
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>Score preview</span>
            <span className="font-semibold">
              {liveMarksPct}% of {newMaxMarks}
            </span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all',
                liveMarksPct >= 70
                  ? 'bg-success'
                  : liveMarksPct >= 50
                    ? 'bg-primary'
                    : 'bg-destructive'
              )}
              style={{ width: `${liveMarksPct}%` }}
            />
          </div>
        </div>
      )}

      <p className="text-xs text-success font-medium mt-1.5">
        Status is Completed (graded). Card will appear in green.
      </p>
    </div>
  );
}
