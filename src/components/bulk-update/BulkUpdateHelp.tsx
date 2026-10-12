import { Info } from 'lucide-react';

const steps = [
  {
    step: 1,
    text: 'Upload an Excel (.xlsx) / CSV file or paste rows copied from Google Sheets. Supported columns: Name (optional), Email (required), marks (optional).',
  },
  {
    step: 2,
    text: 'Select target assignment (A-01 to A-10) and deadline tier (60, 50, or 30 marks).',
  },
  {
    step: 3,
    text: 'Review the preview report: marks > 0 are marked as Completed; 0, negative numbers (e.g. -2, -4), or empty cells are marked as Submitted (pending marks).',
  },
  {
    step: 4,
    text: 'Click "Confirm & Apply" to update student assignments and recalculate student statuses.',
  },
];

export function BulkUpdateHelp() {
  return (
    <div className="space-y-4">
      <div className="bg-background rounded-xl border shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <Info className="w-4 h-4 text-primary" />
          <h2 className="font-semibold text-sm uppercase tracking-widest text-muted-foreground">
            Help Center
          </h2>
        </div>
        <ol className="space-y-3">
          {steps.map(({ step, text }) => (
            <li key={step} className="flex items-start gap-3">
              <span className="shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center mt-0.5">
                {step}
              </span>
              <p className="text-sm text-muted-foreground">{text}</p>
            </li>
          ))}
        </ol>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 dark:bg-amber-950/20 dark:border-amber-900/50">
        <p className="text-xs font-semibold text-amber-800 dark:text-amber-300 uppercase tracking-wider mb-2">
          ⚠ Important Note
        </p>
        <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
          Students are matched by email address. If an email does not match any student under your
          account, it will be safely skipped and listed in the unmatched section.
        </p>
      </div>
    </div>
  );
}
