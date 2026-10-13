'use client';

interface DateCellProps {
  date?: string | Date | null;
}

export function DateCell({ date }: DateCellProps) {
  if (!date) return <span className="text-xs text-muted-foreground">—</span>;
  const d = new Date(date);
  return (
    <span className="text-xs text-muted-foreground">
      {d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })}
    </span>
  );
}

export default DateCell;
