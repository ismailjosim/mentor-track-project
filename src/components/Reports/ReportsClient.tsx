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
import { CallHistoryReport } from './CallHistoryReport';
import { ReportsHeader } from './ReportsHeader';
import { MilestoneWeeklyReport } from './MilestoneWeeklyReport';
import type { GeneratedReport } from '@/types/reports';
import { TableProperties, BarChart3, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const DEFAULT_SECTIONS = [
  'summary',
  'assignmentSubmission',
  'callHistory',
  'callRounds',
  'assignmentWiseCalls',
];

interface GeneratedReportWithCohorts extends GeneratedReport {
  availableCohorts?: string[];
}

export function ReportsClient() {
  const [activeTab, setActiveTab] = useState<'weekly-milestone' | 'analytics'>('weekly-milestone');
  const [selectedSections, setSelectedSections] = useState<string[]>(DEFAULT_SECTIONS);
  const [onlyMentorshipGroup, setOnlyMentorshipGroup] = useState(false);
  const [selectedCohort, setSelectedCohort] = useState<string>('all');
  const [availableCohorts, setAvailableCohorts] = useState<string[]>(['13', '14']);
  const [report, setReport] = useState<GeneratedReportWithCohorts | null>(null);

  const toggleSection = (key: string) => {
    setSelectedSections((prev) =>
      prev.includes(key) ? prev.filter((s) => s !== key) : [...prev, key]
    );
  };

  const generateMutation = useMutation({
    mutationFn: async () => {
      const response = await reportsApi.generate(
        selectedSections,
        onlyMentorshipGroup,
        selectedCohort
      );
      if (response.error) throw new Error(response.error);
      return response.data as GeneratedReportWithCohorts;
    },
    onSuccess: (data) => {
      setReport(data);
      if (data.availableCohorts && data.availableCohorts.length > 0) {
        setAvailableCohorts(data.availableCohorts);
      }
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
    const cohortLabel = selectedCohort === 'all' ? 'All Batches' : `Batch ${selectedCohort}`;

    if (report.summary) {
      rows.push({
        Section: 'Cohort Summary',
        Cohort: cohortLabel,
        'Total Students': report.summary.totalStudents,
        'Joined Mentorship': report.summary.joinedMentorship,
        'Not Joined': report.summary.notJoinedMentorship,
        'Completed All Assignments': report.summary.completedAllAssignments,
      });
      report.summary.perAssignment.forEach((row) => {
        rows.push({
          Section: 'Cohort Summary - Assignments',
          Cohort: cohortLabel,
          Assignment: row.assignmentKey,
          Submitted: row.submitted,
        });
      });
    }

    if (report.assignmentSubmission) {
      report.assignmentSubmission.assignments.forEach((row) => {
        rows.push({
          Section: 'Assignment Submission',
          Cohort: cohortLabel,
          Assignment: row.assignmentKey,
          Submitted: row.submitted,
          Total: row.totalStudents,
          'Submission Rate %': row.submissionRate,
          'Point Diff vs Previous': row.pointDiffVsPrevious ?? '',
          'Relative Change % vs Previous': row.relativeChangePercentVsPrevious ?? '',
        });
      });
    }

    if (report.callHistory) {
      rows.push({
        Section: 'Call History - Summary',
        Cohort: cohortLabel,
        'Total Calls': report.callHistory.summary.totalCalls,
        'Unique Students Contacted': report.callHistory.summary.uniqueStudentsCalled,
        'Received Calls': report.callHistory.summary.receivedCalls,
        'Not Received Calls': report.callHistory.summary.notReceivedCalls,
        'Success Rate %': report.callHistory.summary.receivedRate,
      });

      report.callHistory.weekly.forEach((item) => {
        rows.push({
          Section: 'Call History - Weekly',
          Cohort: cohortLabel,
          Period: item.label,
          'Total Calls': item.total,
          Received: item.received,
          'Not Received': item.notReceived,
          'Success Rate %': item.successRate,
        });
      });

      report.callHistory.monthly.forEach((item) => {
        rows.push({
          Section: 'Call History - Monthly',
          Cohort: cohortLabel,
          Period: item.label,
          'Total Calls': item.total,
          Received: item.received,
          'Not Received': item.notReceived,
          'Success Rate %': item.successRate,
        });
      });
    }

    if (report.callRounds) {
      rows.push({
        Section: 'Call Rounds',
        Cohort: cohortLabel,
        'Total Students': report.callRounds.totalStudents,
        'Completed Rounds': report.callRounds.completedRounds,
        'Never Called': report.callRounds.studentsNeverCalled,
        'Avg Calls / Student': report.callRounds.averageCallsPerStudent,
      });
      report.callRounds.distribution.forEach((d) => {
        rows.push({
          Section: 'Call Rounds - Distribution',
          Cohort: cohortLabel,
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
          Cohort: cohortLabel,
          'Last Completed at Call Time': row.lastCompletedAtCallTime,
          'Pursuing Assignment': row.pursuingAssignment,
          'Call Count': row.callCount,
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
    const suffix = selectedCohort !== 'all' ? `batch-${selectedCohort}` : 'all-batches';
    downloadFile(blob, generateExportFilename(`report-${suffix}`, format));
    toast.success(`Report exported as ${format.toUpperCase()}`);
  };

  const loading = generateMutation.isPending;
  const error = generateMutation.error instanceof Error ? generateMutation.error.message : null;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Report Type Navigation Tabs */}
      <div className="flex border-b border-border/80 gap-4 pb-0">
        <button
          type="button"
          onClick={() => setActiveTab('weekly-milestone')}
          className={`flex items-center gap-2 pb-3 px-2 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
            activeTab === 'weekly-milestone'
              ? 'border-primary text-primary font-bold'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <TableProperties className="size-4" />
          <span>Weekly Milestone Target Sheet</span>
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">
            Weekly Report
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('analytics')}
          className={`flex items-center gap-2 pb-3 px-2 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
            activeTab === 'analytics'
              ? 'border-primary text-primary font-bold'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <BarChart3 className="size-4" />
          <span>Cohort Analytics &amp; Trend Reports</span>
        </button>
      </div>

      {activeTab === 'weekly-milestone' ? (
        <MilestoneWeeklyReport cohort={selectedCohort} />
      ) : (
        <div className="space-y-6">
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
                selectedCohort={selectedCohort}
                onSelectCohort={setSelectedCohort}
                availableCohorts={availableCohorts}
                onGenerate={handleGenerate}
                loading={loading}
              />
            </div>

            <div className="xl:col-span-2 space-y-6">
              {!report && !loading && (
                <div className="surface p-12 text-center text-sm text-muted-foreground">
                  Select batch and report sections on the left, then click{' '}
                  <strong>Generate Report</strong>.
                </div>
              )}

              {report?.summary && <CohortSummaryCards data={report.summary} />}
              {report?.assignmentSubmission && (
                <AssignmentSubmissionReport data={report.assignmentSubmission} />
              )}
              {report?.callHistory && <CallHistoryReport data={report.callHistory} />}
              {report?.callRounds && <CallRoundsReport data={report.callRounds} />}
              {report?.assignmentWiseCalls && (
                <AssignmentWiseCallsReport data={report.assignmentWiseCalls} />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
