'use client';

import { Loader2, RefreshCw, Sparkles, CheckCircle2 } from 'lucide-react';
import { useEffect, useState } from 'react';

export interface BulkProgressOverlayProps {
  isVisible: boolean;
  title?: string;
  subtitle?: string;
  progressPercent?: number | null;
  currentCount?: number;
  totalCount?: number;
  statusText?: string;
}

const DEFAULT_STEPS = [
  { key: 'parsing', label: 'Reading and parsing file data...' },
  { key: 'matching', label: 'Matching student emails in database...' },
  { key: 'committing', label: 'Applying updates and recalculating progress...' },
  { key: 'finalizing', label: 'Finalizing database records...' },
];

export function BulkProgressOverlay({
  isVisible,
  title = 'Processing Bulk Update',
  subtitle = 'Please wait while student records are being processed and updated.',
  progressPercent = null,
  currentCount,
  totalCount,
  statusText,
}: BulkProgressOverlayProps) {
  const [activeStepIndex, setActiveStepIndex] = useState(0);

  const hasExplicitPercent = typeof progressPercent === 'number' && progressPercent >= 0;
  const clampedPercent = hasExplicitPercent ? Math.min(100, Math.max(0, progressPercent)) : null;

  useEffect(() => {
    if (!isVisible) return;
    if (hasExplicitPercent) return;

    const interval = setInterval(() => {
      setActiveStepIndex((prev) => (prev < DEFAULT_STEPS.length - 1 ? prev + 1 : prev));
    }, 1200);

    return () => {
      clearInterval(interval);
      setActiveStepIndex(0);
    };
  }, [isVisible, hasExplicitPercent]);

  if (!isVisible) return null;

  const displayPercent = hasExplicitPercent
    ? clampedPercent
    : Math.round(((activeStepIndex + 1) / DEFAULT_STEPS.length) * 100);

  return (
    <div className="relative overflow-hidden rounded-xl border border-primary/30 bg-primary/5 p-5 shadow-sm animate-in fade-in zoom-in-95 duration-200">
      {/* Background Animated Gradient Glow */}
      <div className="absolute -top-12 -right-12 h-36 w-36 rounded-full bg-primary/10 blur-2xl animate-pulse" />
      <div className="absolute -bottom-12 -left-12 h-36 w-36 rounded-full bg-primary/10 blur-2xl animate-pulse delay-700" />

      <div className="relative z-10 space-y-4">
        {/* Header with spinner and percentage badge */}
        <div className="flex items-center gap-3">
          <div className="relative flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/20">
            <Loader2 className="size-5 animate-spin" />
            <span className="absolute -top-1 -right-1 flex size-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex rounded-full size-3 bg-primary" />
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-foreground">{title}</h4>
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold text-primary">
                <Sparkles className="size-2.5 animate-spin" />
                Active
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{subtitle}</p>
          </div>

          {/* Big percentage counter */}
          <div className="text-right shrink-0">
            <span className="text-2xl font-black tracking-tight text-primary font-mono">
              {displayPercent}%
            </span>
          </div>
        </div>

        {/* Dynamic Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-xs font-semibold">
            <span className="text-primary font-medium flex items-center gap-1.5">
              <RefreshCw className="size-3 animate-spin text-primary" />
              {statusText ||
                (hasExplicitPercent
                  ? `Updating database records (${displayPercent}%)...`
                  : DEFAULT_STEPS[activeStepIndex]?.label)}
            </span>
            <span className="text-muted-foreground font-mono">
              {currentCount !== undefined && totalCount !== undefined ? (
                <>
                  {currentCount} / {totalCount} Records
                </>
              ) : hasExplicitPercent ? (
                `${clampedPercent}% Complete`
              ) : (
                `Step ${activeStepIndex + 1} of ${DEFAULT_STEPS.length}`
              )}
            </span>
          </div>

          <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted/60 relative">
            <div
              className="h-full bg-linear-to-r from-primary/80 via-primary to-primary transition-all duration-300 ease-out"
              style={{ width: `${displayPercent}%` }}
            />
            {/* Shimmer sweep effect */}
            <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/25 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]" />
          </div>
        </div>

        {/* Steps Checkmark Pills */}
        {!hasExplicitPercent && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px]">
            {DEFAULT_STEPS.map((s, idx) => {
              const isDone = idx < activeStepIndex;
              const isCurrent = idx === activeStepIndex;
              return (
                <div
                  key={s.key}
                  className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 border transition-all ${
                    isDone
                      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-medium'
                      : isCurrent
                        ? 'border-primary/40 bg-primary/15 text-primary font-bold shadow-xs'
                        : 'border-border/40 bg-muted/20 text-muted-foreground/70'
                  }`}
                >
                  {isDone ? (
                    <CheckCircle2 className="size-3 text-emerald-500 shrink-0" />
                  ) : isCurrent ? (
                    <Loader2 className="size-3 animate-spin shrink-0 text-primary" />
                  ) : (
                    <div className="size-3 rounded-full border border-muted-foreground/30 shrink-0" />
                  )}
                  <span className="truncate">{s.label.split(' ')[0]}...</span>
                </div>
              );
            })}
          </div>
        )}

        <p className="text-[11px] text-muted-foreground text-center font-medium pt-0.5">
          Please do not refresh or leave this page until the operation completes.
        </p>
      </div>
    </div>
  );
}
