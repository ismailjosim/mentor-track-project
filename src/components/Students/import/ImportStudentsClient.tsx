'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, FileUp } from 'lucide-react';
import toast from 'react-hot-toast';
import { PAGE_ROUTES } from '@/lib/constants';
import type { ImportPreview, ImportStep } from './types';
import { ImportDropzone } from './ImportDropzone';
import { ImportPreviewSection } from './ImportPreviewSection';
import { ImportSuccessSection } from './ImportSuccessSection';

export function ImportStudentsClient() {
  const [step, setStep] = useState<ImportStep>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [importing, setImporting] = useState(false);

  const handleFileSelect = async (selectedFile: File) => {
    setFile(selectedFile);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('previewOnly', 'true');

      const response = await fetch('/api/students/import', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to preview file');
      }

      const data = (await response.json()) as ImportPreview;
      setPreview(data);
      setStep('preview');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to process file';
      toast.error(message);
      setFile(null);
    }
  };

  const handleImport = async () => {
    if (!file || !preview) return;

    try {
      setStep('importing');
      setImporting(true);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('confirmed', 'true');

      const response = await fetch('/api/students/import', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Import failed');
      }

      const result = await response.json();
      setStep('success');
      toast.success(`Successfully imported ${result.summary.created} students!`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Import failed';
      toast.error(message);
      setStep('preview');
    } finally {
      setImporting(false);
    }
  };

  const handleReset = () => {
    setStep('upload');
    setFile(null);
    setPreview(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Back button */}
      <div className="flex items-center gap-2">
        <Link
          href={PAGE_ROUTES.STUDENTS}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Students
        </Link>
      </div>

      {/* Header */}
      <div className="page-header rounded-3xl border border-border/70 bg-card/70 p-5 shadow-sm backdrop-blur-sm sm:p-7">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-primary">
            Student directory
          </p>
          <h1 className="page-title">Import Students</h1>
          <p className="page-description">
            Upload a CSV or Excel file to import multiple students at once.
          </p>
        </div>
      </div>

      {step === 'upload' && <ImportDropzone onFileSelect={handleFileSelect} />}

      {step === 'preview' && preview && (
        <ImportPreviewSection
          preview={preview}
          importing={importing}
          onImport={handleImport}
          onReset={handleReset}
        />
      )}

      {step === 'importing' && (
        <div className="flex items-center justify-center py-16">
          <div className="text-center space-y-4">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto animate-spin">
              <FileUp className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">Importing students...</h3>
              <p className="text-sm text-muted-foreground mt-1">This may take a moment</p>
            </div>
          </div>
        </div>
      )}

      {step === 'success' && preview && (
        <ImportSuccessSection preview={preview} onReset={handleReset} />
      )}
    </div>
  );
}
