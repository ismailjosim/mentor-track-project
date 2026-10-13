'use client';

import { Download, Copy, Printer, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MilestoneToolbarProps {
  isCopied: boolean;
  isExporting: boolean;
  onCopy: () => void;
  onExport: () => void;
}

export function MilestoneToolbar({
  isCopied,
  isExporting,
  onCopy,
  onExport,
}: MilestoneToolbarProps) {
  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-card border border-border/70 rounded-2xl p-4 sm:p-5 shadow-xs">
      <div>
        <div className="flex items-center gap-2">
          <h3 className="text-base font-bold text-foreground">Weekly Milestone Target Sheet</h3>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">
            Spreadsheet View
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          সাপ্তাহিক আপডেট ও স্ক্রিনশট রিপোর্ট তৈরির জন্য সরাসরি এডিটেবল স্প্রেডশিট
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onCopy}
          className="h-9 gap-1.5 text-xs font-semibold cursor-pointer"
          title="Copy for Google Sheets"
        >
          {isCopied ? (
            <Check className="size-3.5 text-emerald-500" />
          ) : (
            <Copy className="size-3.5" />
          )}
          <span>{isCopied ? 'Copied for Sheets!' : 'Copy for Sheets'}</span>
        </Button>

        <Button
          type="button"
          variant="default"
          size="sm"
          onClick={onExport}
          disabled={isExporting}
          className="h-9 gap-1.5 text-xs font-semibold cursor-pointer"
        >
          <Download className="size-3.5" />
          <span>{isExporting ? 'Generating Excel...' : 'Download Excel (.xlsx)'}</span>
        </Button>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => window.print()}
          className="h-9 gap-1.5 text-xs font-semibold cursor-pointer"
          title="Print or Save PDF"
        >
          <Printer className="size-3.5" />
          <span>Print</span>
        </Button>
      </div>
    </div>
  );
}
