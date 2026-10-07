'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { reportsApi } from '@/lib/api-client';
import { exportToCSV, exportToExcel, downloadFile, generateExportFilename } from '@/lib/export';
import { ReportOptionsPanel } from './ReportOptionsPanel';
import { CohortSummaryCards } from './CohortSummaryCards';
import { AssignmentSubmissionReport } from './AssignmentSubmissionReport';
import { CallRoundsReport } from './CallRoundsReport';
import { AssignmentWiseCallsReport } from './AssignmentWiseCallsReport';
import { ReportsHeader } from './ReportsHeader';
import type { GeneratedReport } from '@/types/reports';
import { AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const DEFAULT_SECTIONS = ['summary', 'assignmentSubmission', 'callRounds', 'assignmentWiseCalls'];

export function ReportsClient() {
  const [selectedSections, setSelectedSections] = useState<string[]>(DEFAULT_SECTIONS);
  const [onlyMentorshipGroup, setOnlyMentorshipGroup] = useState(false);
  const [report, setReport] = useState<GeneratedReport | null>(null);

  const toggleSection = (key: string) => {
    setSelectedSections((prev) =>
      prev.includes(key) ? prev.filter((s) => s !== key) : [...prev, key]
    );
  };

  const generateMutation = useMutation({
    mutationFn: async () => {
      const response = await reportsApi.generate(selectedSections, onlyMentorshipGroup);
      if (response.error) throw new Error(response.error);
      return response.data as GeneratedReport;
    },
    onSuccess: (data) => {
      setReport(data);
      toast.success('Report generated successfully');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to generate report');
    },
  });

  const handleGenerate = () => {
    if (selectedSections.length === 0) return;
    generateMutation.mutate();
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

  const loading = generateMutation.isPending;
  const error = generateMutation.error instanceof Error ? generateMutation.error.message : null;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <ReportsHeader hasReport={Boolean(report)} onExport={handleExport} />

      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-destructive/20 bg-destructive/10 p-4">
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
