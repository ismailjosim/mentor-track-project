'use client';

import { useState } from 'react';
import { reportsApi } from '@/lib/api-client';
import { exportToCSV, exportToExcel, downloadFile, generateExportFilename } from '@/lib/export';
import { ReportOptionsPanel } from '@/components/Reports/ReportOptionsPanel';
import { CohortSummaryCards } from '@/components/Reports/CohortSummaryCards';
import { AssignmentSubmissionReport } from '@/components/Reports/AssignmentSubmissionReport';
import { CallRoundsReport } from '@/components/Reports/CallRoundsReport';
import { AssignmentWiseCallsReport } from '@/components/Reports/AssignmentWiseCallsReport';
import type { GeneratedReport } from '@/types/reports';
import { AlertCircle, Download, FileSpreadsheet } from 'lucide-react';
import toast from 'react-hot-toast';

const DEFAULT_SECTIONS = ['summary', 'assignmentSubmission', 'callRounds', 'assignmentWiseCalls'];

export default function ReportsPage() {
  const [selectedSections, setSelectedSections] = useState<string[]>(DEFAULT_SECTIONS);
  const [onlyMentorshipGroup, setOnlyMentorshipGroup] = useState(false);
  const [report, setReport] = useState<GeneratedReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleSection = (key: string) => {
    setSelectedSections((prev) =>
      prev.includes(key) ? prev.filter((s) => s !== key) : [...prev, key]
    );
  };

  const handleGenerate = async () => {
    if (selectedSections.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      const response = await reportsApi.generate(selectedSections, onlyMentorshipGroup);
      if (response.error) throw new Error(response.error);
      setReport(response.data as GeneratedReport);
      toast.success('Report generated');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate report';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const buildExportRows = (): Record<string, unknown>[] => {
    if (!report) return [];
    const rows: Record<string, unknown>[] = [];

    if (report.assignmentSubmission) {
      report.assignmentSubmission.assignments.forEach((row) => {
        rows.push({
          Section: 'Assignment Submission',
          Assignment: row.assignmentKey,
          Submitted: row.submitted,
          Total: row.totalStudents,
          'Submission Rate %': row.submissionRate,
          'Point Diff vs Previous': row.pointDiffVsPrevious ?? '',
          'Relative Change % vs Previous': row.relativeChangePercentVsPrevious ?? '',
        });
      });
    }

    if (report.callRounds) {
      rows.push({
        Section: 'Call Rounds',
        'Total Students': report.callRounds.totalStudents,
        'Completed Rounds': report.callRounds.completedRounds,
        'Never Called': report.callRounds.studentsNeverCalled,
        'Avg Calls / Student': report.callRounds.averageCallsPerStudent,
      });
      report.callRounds.distribution.forEach((d) => {
        rows.push({
          Section: 'Call Rounds - Distribution',
          Round: d.round,
          'Students Reached': d.studentsReached,
          'Percent of Cohort': d.percentOfCohort,
        });
      });
    }

    if (report.assignmentWiseCalls) {
      report.assignmentWiseCalls.rows.forEach((row) => {
        rows.push({
          Section: 'Assignment-wise Calls',
          'Last Completed at Call Time': row.lastCompletedAtCallTime,
          'Pursuing Assignment': row.pursuingAssignment,
          'Call Count': row.callCount,
        });
      });
    }

    if (report.summary) {
      rows.push({
        Section: 'Cohort Summary',
        'Total Students': report.summary.totalStudents,
        'Joined Mentorship': report.summary.joinedMentorship,
        'Not Joined': report.summary.notJoinedMentorship,
        'Completed All Assignments': report.summary.completedAllAssignments,
      });
      report.summary.perAssignment.forEach((row) => {
        rows.push({
          Section: 'Cohort Summary - Assignments',
          Assignment: row.assignmentKey,
          Submitted: row.submitted,
        });
      });
    }

    return rows;
  };

  const handleExport = (format: 'csv' | 'xlsx') => {
    const rows = buildExportRows();
    if (rows.length === 0) {
      toast.error('Generate a report first');
      return;
    }
    const blob = format === 'csv' ? exportToCSV(rows) : exportToExcel(rows);
    downloadFile(blob, generateExportFilename('report', format));
    toast.success(`Report exported as ${format.toUpperCase()}`);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="page-header rounded-3xl border border-border/70 bg-card/70 p-5 shadow-sm backdrop-blur-sm sm:p-7">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-primary">
            Cohort insights
          </p>
          <h1 className="page-title">Generate Report</h1>
          <p className="page-description">
            Pick the sections you need, generate the report, and export it for sharing.
          </p>
        </div>
        {report && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleExport('csv')}
              className="inline-flex h-10 items-center gap-2 rounded-xl border bg-card px-4 text-sm font-semibold transition-colors hover:bg-muted"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
            <button
              onClick={() => handleExport('xlsx')}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm shadow-primary/20 transition-colors hover:bg-hover"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Export Excel
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-danger-border bg-danger-soft p-4">
          <AlertCircle className="w-5 h-5 text-destructive shrink-0" />
          <p className="text-sm font-medium text-destructive">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-1">
          <ReportOptionsPanel
            selectedSections={selectedSections}
            onToggleSection={toggleSection}
            onlyMentorshipGroup={onlyMentorshipGroup}
            onToggleMentorshipGroup={() => setOnlyMentorshipGroup((v) => !v)}
            onGenerate={handleGenerate}
            loading={loading}
          />
        </div>

        <div className="xl:col-span-2 space-y-6">
          {!report && !loading && (
            <div className="surface p-10 text-center text-sm text-muted-foreground">
              Select report sections on the left and click Generate Report.
            </div>
          )}

          {report?.summary && <CohortSummaryCards data={report.summary} />}
          {report?.assignmentSubmission && (
            <AssignmentSubmissionReport data={report.assignmentSubmission} />
          )}
          {report?.callRounds && <CallRoundsReport data={report.callRounds} />}
          {report?.assignmentWiseCalls && (
            <AssignmentWiseCallsReport data={report.assignmentWiseCalls} />
          )}
        </div>
      </div>
    </div>
  );
}
