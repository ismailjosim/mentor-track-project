'use client';

import { REPORT_SECTION_OPTIONS } from '@/types/reports';
import { CheckCircle2, Circle, Loader2, FileBarChart } from 'lucide-react';

interface ReportOptionsPanelProps {
  selectedSections: string[];
  onToggleSection: (key: string) => void;
  onlyMentorshipGroup: boolean;
  onToggleMentorshipGroup: () => void;
  onGenerate: () => void;
  loading: boolean;
}

export function ReportOptionsPanel({
  selectedSections,
  onToggleSection,
  onlyMentorshipGroup,
  onToggleMentorshipGroup,
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
          Choose what to include, then generate the report
        </p>
      </div>

      <div className="p-6 space-y-3">
        {REPORT_SECTION_OPTIONS.map(({ key, label, description }) => {
          const isSelected = selectedSections.includes(key);
          return (
            <button
              key={key}
              type="button"
              onClick={() => onToggleSection(key)}
              className={`w-full flex items-start gap-3 rounded-xl border p-4 text-left transition-colors ${
                isSelected ? 'border-primary/40 bg-primary/5' : 'border-border/70 hover:bg-muted/50'
              }`}
            >
              {isSelected ? (
                <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              ) : (
                <Circle className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
              )}
              <div>
                <p className="text-sm font-semibold">{label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
              </div>
            </button>
          );
        })}

        <button
          type="button"
          onClick={onToggleMentorshipGroup}
          className="w-full flex items-center gap-3 rounded-xl border border-border/70 p-4 text-left transition-colors hover:bg-muted/50"
        >
          {onlyMentorshipGroup ? (
            <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
          ) : (
            <Circle className="w-5 h-5 text-muted-foreground shrink-0" />
          )}
          <div>
            <p className="text-sm font-semibold">Only count mentorship-group members</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Applies to the Call Rounds section. Off = count every student in the roster.
            </p>
          </div>
        </button>

        <button
          onClick={onGenerate}
          disabled={loading || selectedSections.length === 0}
          className="mt-2 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm shadow-primary/20 transition-colors hover:bg-hover disabled:opacity-50"
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
