'use client';

import { REPORT_SECTION_OPTIONS } from '@/types/reports';
import { CheckCircle2, Circle, Loader2, FileBarChart, Layers } from 'lucide-react';

interface ReportOptionsPanelProps {
  selectedSections: string[];
  onToggleSection: (key: string) => void;
  onlyMentorshipGroup: boolean;
  onToggleMentorshipGroup: () => void;
  selectedCohort: string;
  onSelectCohort: (cohort: string) => void;
  availableCohorts: string[];
  onGenerate: () => void;
  loading: boolean;
}

export function ReportOptionsPanel({
  selectedSections,
  onToggleSection,
  onlyMentorshipGroup,
  onToggleMentorshipGroup,
  selectedCohort,
  onSelectCohort,
  availableCohorts = ['13', '14'],
  onGenerate,
  loading,
}: ReportOptionsPanelProps) {
  return (
    <div className="surface overflow-hidden">
      <div className="border-b border-border/70 px-6 py-5">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          Report Options
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Select batch and sections, then generate your report
        </p>
      </div>

      <div className="p-6 space-y-4">
        {/* Batch / Cohort Selector */}
        <div className="rounded-xl border border-border/80 bg-muted/20 p-3.5">
          <div className="flex items-center gap-1.5 mb-1.5 text-foreground font-semibold text-xs uppercase tracking-wider">
            <Layers className="w-3.5 h-3.5 text-primary" />
            <span>Select Batch</span>
          </div>
          <select
            value={selectedCohort}
            onChange={(e) => onSelectCohort(e.target.value)}
            disabled={loading}
            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
          >
            <option value="all">All Batches (Combined)</option>
            {availableCohorts.map((c) => (
              <option key={c} value={c}>
                Batch {c}
              </option>
            ))}
          </select>
          <p className="text-[11px] text-muted-foreground mt-1.5">
            ফিল্টার করা ব্যাচের ওপর ভিত্তি করে সব তথ্য জেনারেট হবে
          </p>
        </div>

        {/* Sections Selection */}
        <div className="space-y-2.5">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Include Sections
          </p>
          {REPORT_SECTION_OPTIONS.map(({ key, label, description }) => {
            const isSelected = selectedSections.includes(key);
            return (
              <button
                key={key}
                type="button"
                onClick={() => onToggleSection(key)}
                className={`w-full flex items-start gap-3 rounded-xl border p-3.5 text-left transition-colors ${
                  isSelected
                    ? 'border-primary/40 bg-primary/5'
                    : 'border-border/70 hover:bg-muted/50'
                }`}
              >
                {isSelected ? (
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                ) : (
                  <Circle className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                )}
                <div>
                  <p className="text-sm font-semibold">{label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Mentorship Group Only Option */}
        <button
          type="button"
          onClick={onToggleMentorshipGroup}
          className="w-full flex items-center gap-3 rounded-xl border border-border/70 p-3.5 text-left transition-colors hover:bg-muted/50"
        >
          {onlyMentorshipGroup ? (
            <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
          ) : (
            <Circle className="w-4 h-4 text-muted-foreground shrink-0" />
          )}
          <div>
            <p className="text-sm font-semibold">Only count mentorship-group members</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Applies to the Call Rounds section.
            </p>
          </div>
        </button>

        {/* Generate Button */}
        <button
          onClick={onGenerate}
          disabled={loading || selectedSections.length === 0}
          className="mt-2 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm shadow-primary/20 transition-colors hover:bg-hover disabled:opacity-50 cursor-pointer"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <FileBarChart className="w-4 h-4" />
          )}
          {loading ? 'Generating...' : 'Generate Report'}
        </button>
      </div>
    </div>
  );
}
