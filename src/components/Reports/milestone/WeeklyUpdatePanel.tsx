'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { AlertCircle, Download, FileText, Layers, LoaderCircle, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { ASSIGNMENT_TARGET_PERCENTAGES } from '@/lib/assignment-targets';
import { calculateWeeklyAssignmentChange } from '@/lib/weekly-update';
import type { WeeklyUpdateReportData } from '@/types/reports';
import type { ComputedMilestoneRow } from './types';

interface WeeklyUpdatePanelProps {
  cohort: string;
  reportTitle: string;
  milestones: ComputedMilestoneRow[];
}

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };
    return entities[character];
  });

export function WeeklyUpdatePanel({ cohort, reportTitle, milestones }: WeeklyUpdatePanelProps) {
  const [currentAssignment, setCurrentAssignment] = useState(8);
  const reportMutation = useMutation({
    mutationFn: async () => {
      const params = new URLSearchParams({ currentAssignment: String(currentAssignment), cohort });
      const response = await fetch(`/api/reports/weekly-update?${params}`);
      const result = await response.json();
      if (!response.ok || result.statusCode !== 200 || !result.data) {
        throw new Error(result.message || 'Could not generate the weekly update');
      }
      return result.data as WeeklyUpdateReportData;
    },
    onError: (error: Error) => toast.error(error.message),
    onSuccess: () => toast.success('Weekly update report generated'),
  });

  const report = reportMutation.data;
  const selectedMilestone = milestones.find(
    (milestone) => Number(milestone.milestone.match(/\d+/)?.[0]) === currentAssignment
  );
  const targetPct =
    selectedMilestone?.targetPct ?? ASSIGNMENT_TARGET_PERCENTAGES[currentAssignment] ?? null;
  const currentAssignmentReport = report?.assignments.find(
    (assignment) => assignment.assignmentNumber === currentAssignment
  );
  const targetStudents =
    report && targetPct !== null ? Math.round((report.totalStudents * targetPct) / 100) : null;
  const remaining =
    currentAssignmentReport && targetStudents !== null
      ? Math.max(0, targetStudents - currentAssignmentReport.submitted)
      : null;
  const targetProgress =
    targetStudents !== null && targetStudents > 0 && currentAssignmentReport
      ? Math.min(100, (currentAssignmentReport.submitted / targetStudents) * 100)
      : 0;
  const actualCohortPercent =
    report && report.totalStudents > 0 && currentAssignmentReport
      ? Number(((currentAssignmentReport.submitted / report.totalStudents) * 100).toFixed(1))
      : 0;
  const targetGap =
    targetPct === null ? null : Number((actualCohortPercent - targetPct).toFixed(1));
  const remainingTargetPercent = Number(Math.max(0, 100 - targetProgress).toFixed(1));

  const handlePdfDownload = () => {
    if (!report || !currentAssignmentReport) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Allow pop-ups to open the PDF print view');
      return;
    }

    const rows = report.assignments
      .map((assignment) => {
        const change = calculateWeeklyAssignmentChange(
          assignment.submitted,
          assignment.newSubmissions,
          report.totalStudents
        );
        const percent =
          change.relativeChangePercent === null
            ? '—'
            : `${change.relativeChangePercent > 0 ? '+' : ''}${change.relativeChangePercent}%`;
        return `<tr>
          <td>${escapeHtml(assignment.assignmentKey)}</td>
          <td>${assignment.previousSubmitted}</td>
          <td>${assignment.submitted}</td>
          <td class="positive">+${assignment.newSubmissions}</td>
          <td>${percent}</td>
          <td>${assignment.cohortIncreasePercent}%</td>
        </tr>`;
      })
      .join('');
    const problems = report.topProblems.length
      ? report.topProblems
          .map(
            (problem, index) =>
              `<li><span class="rank">${index + 1}</span><div><strong>${escapeHtml(problem.issue)}</strong><small>${problem.calls} call responses · ${problem.students} students</small></div></li>`
          )
          .join('')
      : '<li class="empty">No student problems were recorded in call responses this week.</li>';
    const assignmentTargetProgress = `${targetProgress.toFixed(1)}%`;
    const targetSection =
      targetPct === null
        ? `<div class="target-line"><span>Target not set</span><strong>Actual: ${actualCohortPercent}% of cohort</strong></div>`
        : `<div class="target-line"><span>Target: ${targetPct}% (${targetStudents} students)</span><strong>Actual: ${actualCohortPercent}% · gap ${targetGap !== null && targetGap > 0 ? '+' : ''}${targetGap}%</strong></div>
            <div class="track"><div class="fill" style="width:${targetProgress}%"></div></div>
            <div class="target-line"><span>${currentAssignmentReport.submitted} completed · ${assignmentTargetProgress} of target</span><strong>Remaining: ${remaining} students · ${remainingTargetPercent}%</strong></div>`;
    const cohortName =
      report.selectedCohort === 'all' ? 'All cohorts' : `Cohort ${report.selectedCohort}`;

    printWindow.document.write(`<!doctype html>
      <html><head><meta charset="utf-8"><title>${escapeHtml(reportTitle)} - Weekly Update</title>
      <style>
        @page { size: A4; margin: 16mm; }
        * { box-sizing: border-box; }
        body { margin: 0; color: #17243b; font: 14px/1.5 Arial, sans-serif; background: #fff; }
        .hero { padding: 28px 32px; border-radius: 16px; color: #fff; background: linear-gradient(120deg,#172554,#2563eb); }
        .eyebrow { margin: 0 0 8px; color: #bfdbfe; font-size: 11px; font-weight: 700; letter-spacing: 1.6px; text-transform: uppercase; }
        h1 { margin: 0; font-size: 27px; } .meta { margin-top: 9px; color: #dbeafe; font-size: 12px; }
        .stats { display: grid; grid-template-columns: repeat(3,1fr); gap: 12px; margin: 18px 0 24px; }
        .stat { padding: 15px; border: 1px solid #e2e8f0; border-radius: 12px; background: #f8fafc; }
        .stat small, .label { display: block; color: #64748b; font-size: 10px; font-weight: 700; letter-spacing: .7px; text-transform: uppercase; }
        .stat strong { display: block; margin-top: 5px; color: #1e3a8a; font-size: 25px; }
        section { margin-top: 22px; } h2 { margin: 0 0 10px; font-size: 16px; }
        .target { padding: 15px 18px; border: 1px solid #bfdbfe; border-radius: 12px; background: #eff6ff; }
        .target-line { display: flex; justify-content: space-between; gap: 12px; margin: 8px 0; }
        .track { height: 9px; overflow: hidden; border-radius: 9px; background: #dbeafe; }
        .fill { height: 100%; border-radius: inherit; background: #2563eb; }
        table { width: 100%; border-collapse: collapse; font-size: 11px; }
        th { padding: 9px 7px; color: #fff; background: #172554; text-align: left; }
        td { padding: 9px 7px; border-bottom: 1px solid #e2e8f0; }
        .positive { color: #047857; font-weight: 700; }
        ul { margin: 0; padding: 0; list-style: none; }
        li { display: flex; align-items: flex-start; gap: 11px; padding: 11px 0; border-bottom: 1px solid #e2e8f0; }
        .rank { display: inline-flex; width: 23px; height: 23px; align-items: center; justify-content: center; border-radius: 50%; color: #1d4ed8; background: #dbeafe; font-weight: 700; }
        li strong, li small { display: block; } li small { margin-top: 3px; color: #64748b; font-size: 10px; }
        .empty { color: #64748b; } .note { margin-top: 16px; color: #64748b; font-size: 10px; }
        footer { margin-top: 26px; padding-top: 10px; border-top: 1px solid #e2e8f0; color: #94a3b8; font-size: 10px; }
      </style></head><body>
        <header class="hero"><p class="eyebrow">Weekly Mentor Update</p>
          <h1>${escapeHtml(reportTitle)}</h1>
          <p class="meta">${escapeHtml(cohortName)} · ${formatDate(report.periodStart)} – ${formatDate(report.periodEnd)} · ${report.totalStudents} students</p>
        </header>
        <div class="stats">
          <div class="stat"><small>Call attempts</small><strong>${report.calls.totalCalls}</strong></div>
          <div class="stat"><small>Students reached</small><strong>${report.calls.uniqueStudentsCalled}</strong></div>
          <div class="stat"><small>Calls received</small><strong>${report.calls.receivedCalls}</strong></div>
        </div>
        <section><h2>Assignment ${currentAssignment} target progress</h2>
          <div class="target">
            ${targetSection}
          </div>
        </section>
        <section><h2>Last three assignments · weekly comparison</h2>
          <table><thead><tr><th>Assignment</th><th>Previous total</th><th>Current total</th><th>New this week</th><th>Growth vs previous</th><th>Cohort increase</th></tr></thead><tbody>${rows}</tbody></table>
        </section>
        <section><h2>Top student problems from call responses</h2><ul>${problems}</ul></section>
        <p class="note">Weekly comparison uses assignment submission dates from the Tuesday checkpoint. Submissions without a recorded date are included in the previous total. Growth vs previous is the relative increase from the previous cumulative total.</p>
        <footer>Generated ${formatDate(report.generatedAt)} · Mentor Track</footer>
        <script>window.onload = () => setTimeout(() => window.print(), 250);</script>
      </body></html>`);
    printWindow.document.close();
  };

  return (
    <section className="surface overflow-hidden">
      <div className="flex flex-col gap-4 border-b border-border/70 bg-muted/20 p-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="size-5 text-primary" />
            <h3 className="font-bold">Weekly Update Report</h3>
            <span className="inline-flex items-center gap-1 rounded-full border border-primary/15 bg-primary/5 px-2.5 py-1 text-[11px] font-semibold text-primary">
              <Layers className="size-3" />
              {cohort === 'all' ? 'All batches' : `Batch ${cohort}`}
            </span>
          </div>
          <p className="mt-1 max-w-2xl text-xs leading-5 text-muted-foreground">
            মঙ্গলবারের checkpoint থেকে call summary, response-এ বলা প্রধান সমস্যা এবং assignment
            submission তুলনা তৈরি করুন।
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <label className="grid gap-1 text-xs font-medium text-muted-foreground">
            Current assignment
            <select
              value={currentAssignment}
              onChange={(event) => {
                setCurrentAssignment(Number(event.target.value));
                reportMutation.reset();
              }}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground"
            >
              {Array.from({ length: 10 }, (_, index) => index + 1).map((number) => (
                <option key={number} value={number}>
                  Assignment {number}
                </option>
              ))}
            </select>
          </label>
          <Button
            type="button"
            onClick={() => reportMutation.mutate()}
            disabled={reportMutation.isPending}
            className="h-9 gap-2"
          >
            {reportMutation.isPending ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <FileText className="size-4" />
            )}
            {reportMutation.isPending ? 'Generating...' : 'Generate Update Report'}
          </Button>
          {report && (
            <Button
              type="button"
              variant="outline"
              onClick={handlePdfDownload}
              className="h-9 gap-2"
            >
              <Download className="size-4" />
              Download PDF
            </Button>
          )}
        </div>
      </div>

      {reportMutation.isError && (
        <div className="m-5 flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="size-4 shrink-0" />
          {reportMutation.error.message}
        </div>
      )}

      {report && currentAssignmentReport && (
        <div className="space-y-5 p-5">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
            <span>
              {report.selectedCohort === 'all' ? 'All cohorts' : `Cohort ${report.selectedCohort}`}
              {' · '}
              {formatDate(report.periodStart)} – {formatDate(report.periodEnd)}
            </span>
            <span>{report.totalStudents} students in cohort</span>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { label: 'Total calls this week', value: report.calls.totalCalls },
              { label: 'Students reached', value: report.calls.uniqueStudentsCalled },
              { label: 'Received calls', value: report.calls.receivedCalls },
            ].map((stat) => (
              <div key={stat.label} className="rounded-xl border border-border/70 bg-muted/20 p-4">
                <p className="text-xs font-medium text-muted-foreground">{stat.label}</p>
                <p className="mt-1 text-2xl font-bold text-primary">{stat.value}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <div>
              <h4 className="mb-2 text-sm font-bold">Top student problems from calls</h4>
              {report.topProblems.length ? (
                <ol className="space-y-2">
                  {report.topProblems.map((problem, index) => (
                    <li
                      key={problem.issue}
                      className="flex gap-3 rounded-lg border border-border/60 p-3"
                    >
                      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                        {index + 1}
                      </span>
                      <div>
                        <p className="text-sm font-medium">{problem.issue}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {problem.calls} call responses · {problem.students} students
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
                  এই সপ্তাহের call response-এ কোনো problem নথিভুক্ত নেই।
                </p>
              )}
            </div>

            <div>
              <h4 className="mb-2 text-sm font-bold">
                Assignment {currentAssignment} target progress
              </h4>
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">
                      {targetPct === null
                        ? 'Target not set'
                        : `Target ${targetPct}% · ${targetStudents} students`}
                    </p>
                    <p className="mt-1 text-xl font-bold">
                      {currentAssignmentReport.submitted} students completed
                    </p>
                  </div>
                  <span className="rounded-full bg-background px-2.5 py-1 text-xs font-bold text-primary">
                    {targetPct === null
                      ? 'Target not set'
                      : `${targetProgress.toFixed(1)}% of target`}
                  </span>
                </div>
                {targetPct !== null && (
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-primary/15">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${targetProgress}%` }}
                    />
                  </div>
                )}
                <p className="mt-2 text-xs text-muted-foreground">
                  Cohort completion {actualCohortPercent}%.
                  {targetGap !== null ? (
                    <>
                      {' '}
                      Target gap{' '}
                      <strong className={targetGap < 0 ? 'text-destructive' : 'text-emerald-600'}>
                        {targetGap > 0 ? '+' : ''}
                        {targetGap}%
                      </strong>
                      . Target পূরণে আরও <strong className="text-foreground">{remaining}</strong> জন
                      বাকি ({remainingTargetPercent}% target)।
                    </>
                  ) : (
                    ' Target not set; shortfall is not calculated.'
                  )}
                </p>
              </div>
            </div>
          </div>

          <div>
            <h4 className="mb-2 text-sm font-bold">
              Last three assignments · previous week vs this week
            </h4>
            <div className="overflow-x-auto rounded-xl border border-border/70">
              <table className="w-full min-w-172.5 text-left text-xs">
                <thead className="bg-muted/50 text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2.5 font-semibold">Assignment</th>
                    <th className="px-3 py-2.5 text-right font-semibold">Previous total</th>
                    <th className="px-3 py-2.5 text-right font-semibold">Current total</th>
                    <th className="px-3 py-2.5 text-right font-semibold">New this week</th>
                    <th className="px-3 py-2.5 text-right font-semibold">Growth</th>
                    <th className="px-3 py-2.5 text-right font-semibold">Cohort increase</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {report.assignments.map((assignment) => (
                    <tr key={assignment.assignmentNumber}>
                      <td className="px-3 py-2.5 font-semibold">{assignment.assignmentKey}</td>
                      <td className="px-3 py-2.5 text-right">{assignment.previousSubmitted}</td>
                      <td className="px-3 py-2.5 text-right">{assignment.submitted}</td>
                      <td className="px-3 py-2.5 text-right font-bold text-emerald-600">
                        +{assignment.newSubmissions}
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        {assignment.relativeChangePercent === null
                          ? '—'
                          : `+${assignment.relativeChangePercent}%`}
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        +{assignment.cohortIncreasePercent}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-[11px] leading-5 text-muted-foreground">
              Weekly increase is based on assignment dates in the last 7 days. Entries without a
              date are counted in the previous total; growth % compares new submissions with the
              previous total.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
