'use client';

import { useState, useRef } from 'react';
import { CheckCircle2, FileSpreadsheet } from 'lucide-react';
import toast from 'react-hot-toast';

interface BulkFileUploadZoneProps {
  file: File | null;
  onFileSelect: (file: File) => void;
  onClearFile: () => void;
}

export function BulkFileUploadZone({ file, onFileSelect, onClearFile }: BulkFileUploadZoneProps) {
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
      validateAndSelect(files[0]);
    }
  };

  const validateAndSelect = (selectedFile: File) => {
    if (!selectedFile.name.match(/\.(csv|xlsx|xls)$/i)) {
      toast.error('File must be CSV or Excel (.xlsx/.xls) format');
      return;
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      toast.error('File size exceeds 5MB limit');
      return;
    }

    onFileSelect(selectedFile);
  };

  return (
    <>
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          dragActive
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/20 hover:border-primary/50'
        } ${file ? 'bg-green-50/50 border-green-300 dark:bg-green-950/20' : ''}`}
      >
        {file ? (
          <div className="flex items-center gap-3 justify-center">
            <CheckCircle2 className="w-6 h-6 text-green-600" />
            <div className="text-left">
              <p className="text-sm font-medium text-green-700 dark:text-green-300">{file.name}</p>
              <p className="text-xs text-green-600/80">
                Excel/CSV file ready to match by Email and update Marks
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary mx-auto flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-medium">
                Drag Excel (.xlsx) or CSV file here, or click to browse
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Columns supported: <strong>Name</strong> (optional), <strong>Email</strong>{' '}
                (required), <strong>Obtained Marks</strong>, <strong>Total Marks</strong> (deadline tier 60/50/30)
              </p>
            </div>
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          onChange={(e) => {
            if (e.target.files?.[0]) {
              validateAndSelect(e.target.files[0]);
            }
          }}
          className="hidden"
        />
      </div>

      <div className="flex justify-between items-center">
        <span className="text-xs text-muted-foreground">
          Or paste rows directly from Google Sheets / Excel below:
        </span>
        {file && (
          <button
            onClick={onClearFile}
            className="text-xs text-muted-foreground hover:text-foreground underline"
          >
            Clear file
          </button>
        )}
      </div>
    </>
  );
}
