'use client';

import React, { useState, useRef, useEffect } from 'react';
import { GraduationCap, ChevronDown, Check } from 'lucide-react';
import { useBatch } from '@/components/providers/BatchProvider';
import { cn } from '@/lib/cn';

interface BatchSelectorProps {
  className?: string;
  compact?: boolean;
}

export function BatchSelector({ className, compact = false }: BatchSelectorProps) {
  const { selectedBatch, setSelectedBatch, availableBatches, batchLabel } = useBatch();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);

  return (
    <div ref={containerRef} className={cn('relative inline-block text-left', className)}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          'inline-flex items-center gap-2 rounded-xl border border-border/80 bg-card/80 backdrop-blur-md px-3 py-1.5 text-xs font-semibold shadow-xs transition-all hover:bg-muted hover:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/20',
          open && 'border-primary/50 ring-2 ring-primary/20'
        )}
        aria-haspopup="listbox"
        aria-expanded={open}
        title="Select Active Batch"
      >
        <div className="flex items-center justify-center size-5 rounded-md bg-primary/10 text-primary">
          <GraduationCap className="size-3.5" />
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-muted-foreground hidden sm:inline">Batch:</span>
          <span className="font-bold text-foreground">
            <span className="inline sm:hidden">
              {selectedBatch === 'all' ? 'All' : `B-${selectedBatch}`}
            </span>
            <span className="hidden sm:inline">
              {compact
                ? selectedBatch === 'all'
                  ? 'All'
                  : `B-${selectedBatch}`
                : batchLabel(selectedBatch)}
            </span>
          </span>
        </div>
        <ChevronDown
          className={cn(
            'size-3.5 text-muted-foreground transition-transform duration-200',
            open && 'rotate-180'
          )}
        />
      </button>

      {open && (
        <div
          className="absolute right-0 mt-2 w-48 origin-top-right rounded-xl border border-border bg-popover/95 backdrop-blur-xl p-1.5 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-150"
          role="listbox"
        >
          <div className="px-2.5 py-1.5 text-[11px] font-medium text-muted-foreground border-b border-border/50 mb-1">
            Switch Active Batch
          </div>
          {availableBatches.map((batch) => {
            const isSelected = selectedBatch === batch;
            return (
              <button
                key={batch}
                type="button"
                onClick={() => {
                  setSelectedBatch(batch);
                  setOpen(false);
                }}
                className={cn(
                  'w-full flex items-center justify-between gap-2 px-2.5 py-2 text-xs rounded-lg font-medium transition-colors text-left',
                  isSelected
                    ? 'bg-primary text-primary-foreground font-semibold'
                    : 'text-foreground hover:bg-muted'
                )}
                role="option"
                aria-selected={isSelected}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      'size-2 rounded-full',
                      batch === '14'
                        ? 'bg-emerald-500'
                        : batch === '13'
                          ? 'bg-blue-500'
                          : 'bg-amber-500'
                    )}
                  />
                  <span>{batchLabel(batch)}</span>
                </div>
                {isSelected && <Check className="size-3.5 shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
