'use client';

import { useRef, useState } from 'react';
import { Upload, Layers, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface ImportDropzoneProps {
  cohort: string;
  onCohortChange: (cohort: string) => void;
  onFileSelect: (file: File) => void;
}

export function ImportDropzone({ cohort, onCohortChange, onFileSelect }: ImportDropzoneProps) {
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files?.length > 0) {
      validateAndPassFile(files[0]);
    }
  };

  const validateAndPassFile = (file: File) => {
    if (!file.name.match(/\.(csv|xlsx)$/i)) {
      toast.error('File must be CSV or XLSX format');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be under 5MB');
      return;
    }

    onFileSelect(file);
  };

  return (
    <div className="space-y-6">
      {/* Batch / Cohort selector */}
      <div className="surface p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <label className="text-sm font-semibold flex items-center gap-2">
            <Layers className="w-4 h-4 text-primary" />
            Target Batch / Cohort
          </label>
          <p className="text-xs text-muted-foreground mt-0.5">
            Select the cohort where the students from this sheet will be imported.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={cohort}
            onChange={(e) => onCohortChange(e.target.value)}
            className="px-3.5 py-2 text-sm font-semibold rounded-xl border bg-background text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-primary min-w-37.5"
          >
            <option value="14">Batch 14 (Current)</option>
            <option value="13">Batch 13</option>
          </select>
        </div>
      </div>

      {/* File upload zone */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`surface border-2 border-dashed p-8 text-center cursor-pointer transition-colors sm:p-12 ${
          dragActive
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/20 hover:border-primary/50'
        }`}
      >
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
            <Upload className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">Drag and drop your file here</h3>
            <p className="text-sm text-muted-foreground mt-1">or click to select a file</p>
          </div>
          <p className="text-xs text-muted-foreground">CSV or Excel (.xlsx) • Max 5MB</p>
          <button
            type="button"
            className="mt-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 pointer-events-none"
          >
            Choose File
          </button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.xlsx"
          onChange={(e) => {
            if (e.target.files?.[0]) {
              validateAndPassFile(e.target.files[0]);
            }
          }}
          className="hidden"
        />
      </div>

      {/* Format guide & requirements */}
      <div className="surface rounded-2xl p-5 border space-y-3">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <h4 className="font-semibold text-sm">Flexible Import Requirements</h4>
        </div>
        <div className="text-xs space-y-2 text-muted-foreground leading-relaxed">
          <p>
            <strong className="text-foreground">Required fields:</strong> Only{' '}
            <code className="bg-muted px-1.5 py-0.5 rounded text-primary font-semibold">name</code>,{' '}
            <code className="bg-muted px-1.5 py-0.5 rounded text-primary font-semibold">email</code>
            , and{' '}
            <code className="bg-muted px-1.5 py-0.5 rounded text-primary font-semibold">phone</code>{' '}
            are mandatory.
          </p>
          <p>
            <strong className="text-foreground">Optional fields:</strong> If the sheet contains
            extra columns matching database fields (e.g.{' '}
            <code className="bg-muted px-1 py-0.5 rounded">district</code>,{' '}
            <code className="bg-muted px-1 py-0.5 rounded">institute</code>,{' '}
            <code className="bg-muted px-1 py-0.5 rounded">device</code>,{' '}
            <code className="bg-muted px-1 py-0.5 rounded">whatsapp</code>,{' '}
            <code className="bg-muted px-1 py-0.5 rounded">status</code>), they will be
            automatically imported. Any non-matching columns will be safely ignored.
          </p>
        </div>
      </div>
    </div>
  );
}
