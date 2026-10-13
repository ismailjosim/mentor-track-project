'use client';

import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { ActionLogRow } from './types';

interface MilestoneActionLogProps {
  actionLogs: ActionLogRow[];
  onAddLog: () => void;
  onRemoveLog: (id: string) => void;
  onLogChange: (id: string, field: keyof ActionLogRow, value: string) => void;
}

export function MilestoneActionLog({
  actionLogs,
  onAddLog,
  onRemoveLog,
  onLogChange,
}: MilestoneActionLogProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between border-b pb-1.5">
        <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
          Mentor Action Log
        </h4>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onAddLog}
          className="h-6 px-2 text-[11px] gap-1 text-primary cursor-pointer"
        >
          <Plus className="size-3" />
          <span>Add Log</span>
        </Button>
      </div>

      <div className="rounded-xl border border-border/80 overflow-hidden bg-background">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-neutral-900 text-neutral-100 font-bold border-b border-neutral-800">
              <th className="py-2 px-3 text-left w-2/5">Action / Initiative</th>
              <th className="py-2 px-2 text-center w-1/5">Date</th>
              <th className="py-2 px-2 text-left w-1/5">Outcome</th>
              <th className="py-2 px-2 text-left w-1/5">Follow-up</th>
              <th className="py-2 px-1 text-center w-8"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {actionLogs.map((log) => (
              <tr key={log.id} className="hover:bg-muted/10 transition-colors">
                <td className="py-1.5 px-2">
                  <Input
                    type="text"
                    value={log.action}
                    onChange={(e) => onLogChange(log.id, 'action', e.target.value)}
                    className="h-7 text-xs p-1"
                    placeholder="e.g. Call 15 students"
                    aria-label="Action or Initiative"
                  />
                </td>
                <td className="py-1.5 px-1 text-center">
                  <Input
                    type="text"
                    value={log.date}
                    onChange={(e) => onLogChange(log.id, 'date', e.target.value)}
                    className="h-7 text-xs p-1 text-center font-mono"
                    placeholder="YYYY-MM-DD"
                    aria-label="Log Date"
                  />
                </td>
                <td className="py-1.5 px-1">
                  <Input
                    type="text"
                    value={log.outcome}
                    onChange={(e) => onLogChange(log.id, 'outcome', e.target.value)}
                    className="h-7 text-xs p-1"
                    placeholder="Outcome"
                    aria-label="Log Outcome"
                  />
                </td>
                <td className="py-1.5 px-1">
                  <Input
                    type="text"
                    value={log.followUp}
                    onChange={(e) => onLogChange(log.id, 'followUp', e.target.value)}
                    className="h-7 text-xs p-1"
                    placeholder="Follow-up"
                    aria-label="Log Follow-up"
                  />
                </td>
                <td className="py-1.5 px-1 text-center">
                  <button
                    type="button"
                    onClick={() => onRemoveLog(log.id)}
                    className="text-muted-foreground hover:text-destructive p-1 rounded transition-colors cursor-pointer"
                    title="Remove row"
                    aria-label="Remove row"
                  >
                    <Trash2 className="size-3" />
                  </button>
                </td>
              </tr>
            ))}
            {actionLogs.length === 0 && (
              <tr>
                <td colSpan={5} className="py-4 text-center text-xs text-muted-foreground">
                  No mentor action logs added yet. Click &quot;Add Log&quot; to track initiatives.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
