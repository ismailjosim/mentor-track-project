'use client';

import { AlertCircle } from 'lucide-react';
import type { ImportPreview } from './types';

interface ImportPreviewSectionProps {
  preview: ImportPreview;
  importing: boolean;
  cohort?: string;
  onImport: () => void;
  onReset: () => void;
}

export function ImportPreviewSection({
  preview,
  importing,
  cohort,
  onImport,
  onReset,
}: ImportPreviewSectionProps) {
  const targetBatch = preview.cohort || cohort || '14';

  return (
    <div className="space-y-6">
      {/* Target batch banner */}
      <div className="surface p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Target Batch:
          </span>
          <span className="inline-flex items-center px-3 py-1 rounded-xl text-xs font-bold bg-primary text-primary-foreground shadow-sm">
            Batch {targetBatch}
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          Required: <strong className="text-foreground">Name, Email, Phone</strong>. All other
          matching columns will be saved.
        </p>
      </div>

      {/* Import stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 bg-muted/50 rounded-lg border">
          <div className="text-xs text-muted-foreground">Total Rows</div>
          <div className="text-2xl font-bold mt-1">{preview.totalRows}</div>
        </div>
        <div className="rounded-xl border border-success-border bg-success-soft p-4">
          <div className="text-xs font-medium text-success-foreground">Valid</div>
          <div className="mt-1 text-2xl font-bold text-success-foreground">
            {preview.validCount}
          </div>
        </div>
        {preview.invalidCount > 0 && (
          <div className="rounded-xl border border-danger-border bg-danger-soft p-4">
            <div className="text-xs font-medium text-danger-foreground">Invalid</div>
            <div className="mt-1 text-2xl font-bold text-danger-foreground">
              {preview.invalidCount}
            </div>
          </div>
        )}
        {preview.duplicateCount > 0 && (
          <div className="rounded-xl border border-warning-border bg-warning-soft p-4">
            <div className="text-xs font-medium text-warning-foreground">Duplicates</div>
            <div className="mt-1 text-2xl font-bold text-warning-foreground">
              {preview.duplicateCount}
            </div>
          </div>
        )}
      </div>

      {/* Errors if present */}
      {preview.invalidRows.length > 0 && (
        <div className="rounded-xl border border-danger-border bg-danger-soft p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="w-4 h-4 text-danger-foreground" />
            <h4 className="text-sm font-semibold text-danger-foreground">
              Invalid Rows ({preview.invalidRows.length})
            </h4>
          </div>
          <div className="space-y-2 text-sm">
            {preview.invalidRows.slice(0, 5).map((row, idx) => (
              <div key={idx} className="text-danger-foreground">
                <div className="font-mono text-xs">
                  Row {row.rowIndex + 1}: {row.errors.join(', ')}
                </div>
              </div>
            ))}
            {preview.invalidRows.length > 5 && (
              <div className="text-muted-foreground italic">
                ... and {preview.invalidRows.length - 5} more errors
              </div>
            )}
          </div>
        </div>
      )}

      {/* Duplicates if present */}
      {preview.duplicateEmails.length > 0 && (
        <div className="rounded-xl border border-warning-border bg-warning-soft p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="w-4 h-4 text-warning-foreground" />
            <h4 className="text-sm font-semibold text-warning-foreground">
              Duplicate Emails ({preview.duplicateEmails.length})
            </h4>
          </div>
          <div className="space-y-1 text-sm text-warning-foreground">
            {preview.duplicateEmails.map((dup, idx) => (
              <div key={idx} className="font-mono text-xs">
                {dup.email} (rows: {dup.rowIndices.map((i) => i + 1).join(', ')})
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Preview table */}
      <div>
        <h4 className="font-semibold mb-3">Preview (first 10 rows)</h4>
        <div className="overflow-x-auto border rounded-lg">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b">
              <tr>
                {preview.headers.map((header) => (
                  <th key={header} className="px-4 py-2 text-left font-medium text-xs">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {preview.validRows.slice(0, 10).map((row, idx) => (
                <tr key={idx} className="border-b hover:bg-muted/50">
                  {preview.headers.map((header) => (
                    <td key={header} className="px-4 py-2 text-xs">
                      {String(row[header as keyof typeof row] || '')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3 justify-end">
        <button
          onClick={onReset}
          className="px-4 py-2 border rounded-md text-sm font-medium hover:bg-muted transition-colors"
        >
          Choose Different File
        </button>
        <button
          onClick={onImport}
          disabled={importing}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
        >
          {importing ? 'Importing...' : 'Import Students'}
        </button>
      </div>
    </div>
  );
}
