'use client';

import { useRef, useState } from 'react';
import { Upload } from 'lucide-react';
import toast from 'react-hot-toast';

interface ImportDropzoneProps {
  onFileSelect: (file: File) => void;
}

export function ImportDropzone({ onFileSelect }: ImportDropzoneProps) {
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

      {/* Format guide */}
      <div className="bg-muted/50 rounded-lg p-4 border">
        <h4 className="font-semibold text-sm mb-2">Expected file format:</h4>
        <div className="text-xs space-y-1 text-muted-foreground font-mono">
          <div>name, email, phone, whatsapp, division, institute, ...</div>
          <div>John Doe, john@example.com, 01700000000, 01700000000, ...</div>
          <div>Jane Smith, jane@example.com, 01800000000, 01800000000, ...</div>
        </div>
      </div>
    </div>
  );
}
