'use client';

import { format } from 'date-fns';
import { Trash2, ChevronDown, ChevronUp } from 'lucide-react';

import { getCallLogStatusClass, getCallLogStatusLabel } from '@/lib/ui-helpers';
import { CallLog } from '@/interfaces/callLog.interface';

interface CallLogItemProps {
  log: CallLog;
  isExpanded: boolean;
  isDeleting: boolean;
  onToggleExpand: () => void;
  onDelete: (id: string) => void;
}

export function CallLogItem({
  log,
  isExpanded,
  isDeleting,
  onToggleExpand,
  onDelete,
}: CallLogItemProps) {
  const logId = log._id!;

  return (
    <div className="px-6 py-4 group">
      <button
        className="w-full flex items-center justify-between gap-3 text-left"
        onClick={onToggleExpand}
      >
        <div className="flex items-center gap-3">
          <span
            className={`text-xs font-semibold px-2.5 py-1 rounded ${getCallLogStatusClass(log.status)}`}
          >
            {getCallLogStatusLabel(log.status)}
          </span>
          <span className="text-sm font-medium">{format(new Date(log.date), 'MMM d, yyyy')}</span>
          {log.calledBy && <span className="text-xs text-muted-foreground">by {log.calledBy}</span>}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(logId);
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
}
