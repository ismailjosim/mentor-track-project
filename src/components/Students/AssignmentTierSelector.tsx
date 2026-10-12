'use client';

import { cn } from '@/lib/cn';
import type { AssignmentMaxMarks } from '@/interfaces/assignment.interface';

interface AssignmentTierSelectorProps {
  currentTier: AssignmentMaxMarks;
  onTierChange: (tier: AssignmentMaxMarks) => void;
}

const TIERS: AssignmentMaxMarks[] = [60, 50, 30];

export function AssignmentTierSelector({ currentTier, onTierChange }: AssignmentTierSelectorProps) {
  return (
    <div>
      <label className="text-sm font-medium text-foreground mb-2 block">
        Submission Tier (Max Marks)
      </label>
      <div className="grid grid-cols-3 gap-2">
        {TIERS.map((tier) => (
          <button
            key={tier}
            type="button"
            onClick={() => onTierChange(tier)}
            className={cn(
              'py-2 px-3 rounded-md border text-sm font-semibold transition-colors text-center',
              currentTier === tier
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background border-border hover:bg-muted'
            )}
          >
            {tier} marks
            <span className="block text-xs font-normal opacity-70">
              {tier === 60 ? '1st deadline' : tier === 50 ? '2nd deadline' : 'No deadline'}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
