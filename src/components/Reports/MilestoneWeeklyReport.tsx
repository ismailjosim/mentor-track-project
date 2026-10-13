'use client';

import {
  useMilestoneReport,
  MilestoneToolbar,
  MilestoneSheetHeader,
  MilestoneTable,
  MilestoneTargetCheck,
  MilestoneActionLog,
  type MilestoneWeeklyReportProps,
} from './milestone';

export function MilestoneWeeklyReport({ cohort = 'all' }: MilestoneWeeklyReportProps) {
  const {
    reportTitle,
    setReportTitle,
    totalStudents,
    setTotalStudents,
    finalTarget,
    setFinalTarget,
    computedMilestones,
    actionLogs,
    isExporting,
    isCopied,
    m10TargetStudents,
    m10ActualStudents,
    m10ActualPct,
    m10Gap,
    handleMilestoneChange,
    handleAddActionLog,
    handleRemoveActionLog,
    handleActionLogChange,
    handleExportExcel,
    handleCopyToClipboard,
  } = useMilestoneReport(cohort);

  return (
    <div className="space-y-6">
      {/* Top Action Toolbar */}
      <MilestoneToolbar
        isCopied={isCopied}
        isExporting={isExporting}
        onCopy={handleCopyToClipboard}
        onExport={handleExportExcel}
      />

      {/* Main Spreadsheet Container */}
      <div className="surface overflow-hidden border border-border/80 shadow-md">
        {/* Row 1: Sheet Title & Parameters */}
        <MilestoneSheetHeader
          reportTitle={reportTitle}
          totalStudents={totalStudents}
          finalTarget={finalTarget}
          onTitleChange={setReportTitle}
          onTotalStudentsChange={setTotalStudents}
          onFinalTargetChange={setFinalTarget}
        />

        {/* Milestone Main Table */}
        <MilestoneTable milestones={computedMilestones} onMilestoneChange={handleMilestoneChange} />

        {/* Bottom Section: Milestone-10 Final Target Check & Mentor Action Log */}
        <div className="p-6 border-t border-border bg-card/40 grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5">
            <MilestoneTargetCheck
              targetStudents={m10TargetStudents}
              actualStudents={m10ActualStudents}
              actualPct={m10ActualPct}
              gap={m10Gap}
            />
          </div>

          <div className="lg:col-span-7">
            <MilestoneActionLog
              actionLogs={actionLogs}
              onAddLog={handleAddActionLog}
              onRemoveLog={handleRemoveActionLog}
              onLogChange={handleActionLogChange}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
