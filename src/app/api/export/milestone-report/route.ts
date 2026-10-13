/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import ExcelJS from 'exceljs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title = 'Game Changer – Jashim',
      totalStudents = 212,
      finalTarget = 70,
      milestones = [],
      actionLogs = [],
    } = body;

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Mentor Track';
    workbook.lastModifiedBy = 'Mentor Track';
    workbook.created = new Date();
    workbook.modified = new Date();

    const sheet = workbook.addWorksheet('Weekly Milestone Report', {
      views: [{ showGridLines: true }],
    });

    // Set column widths
    sheet.columns = [
      { key: 'colA', width: 16 }, // Milestone
      { key: 'colB', width: 12 }, // Target %
      { key: 'colC', width: 16 }, // Target Students
      { key: 'colD', width: 18 }, // Actual Completion
      { key: 'colE', width: 12 }, // Actual %
      { key: 'colF', width: 12 }, // Gap
      { key: 'colG', width: 18 }, // Required / Shortfall
      { key: 'colH', width: 18 }, // Students Reached
      { key: 'colI', width: 36 }, // Initiatives Taken
      { key: 'colJ', width: 22 }, // Remarks
    ];

    // Row 1: Header Title
    const titleCell = sheet.getCell('A1');
    titleCell.value = title;
    titleCell.font = { name: 'Arial', size: 13, bold: true, color: { argb: 'FF000000' } };

    // Row 3: Total Students & Final Target
    sheet.getCell('A3').value = 'Total Students';
    sheet.getCell('A3').font = { name: 'Arial', size: 10, bold: true };
    sheet.getCell('B3').value = Number(totalStudents);
    sheet.getCell('B3').font = { name: 'Arial', size: 10, bold: true };
    sheet.getCell('B3').alignment = { horizontal: 'center' };

    sheet.getCell('D3').value = 'Final Target';
    sheet.getCell('D3').font = { name: 'Arial', size: 10, bold: true };
    sheet.getCell('E3').value = `${finalTarget}%`;
    sheet.getCell('E3').font = { name: 'Arial', size: 10, bold: true };
    sheet.getCell('E3').alignment = { horizontal: 'center' };

    // Row 5: Table Header (Black background, White text)
    const headers = [
      'Milestone',
      'Target %',
      'Target Students',
      'Actual Completion',
      'Actual %',
      'Gap',
      'Required / Shortfall',
      'Students Reached',
      'Initiatives Taken',
      'Remarks',
    ];

    const headerRow = sheet.getRow(5);
    headers.forEach((h, idx) => {
      const cell = headerRow.getCell(idx + 1);
      cell.value = h;
      cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF000000' },
      };
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF000000' } },
        bottom: { style: 'thin', color: { argb: 'FF000000' } },
        left: { style: 'thin', color: { argb: 'FF333333' } },
        right: { style: 'thin', color: { argb: 'FF333333' } },
      };
    });
    headerRow.height = 26;

    // Milestone Data Rows (Starting at Row 6)
    let currentRowIndex = 6;
    for (const m of milestones) {
      const row = sheet.getRow(currentRowIndex);

      row.getCell(1).value = m.milestone;
      row.getCell(2).value = typeof m.targetPct === 'number' ? `${m.targetPct}%` : m.targetPct;
      row.getCell(3).value =
        m.targetStudents !== '' && m.targetStudents !== undefined ? Number(m.targetStudents) : '';
      row.getCell(4).value =
        m.actualCompletion !== '' && m.actualCompletion !== undefined
          ? Number(m.actualCompletion)
          : '';
      row.getCell(5).value = m.actualPct ? `${m.actualPct}%` : '';
      row.getCell(6).value = m.gap ? `${m.gap}%` : '';
      row.getCell(7).value =
        m.shortfall !== '' && m.shortfall !== undefined ? Number(m.shortfall) : '';
      row.getCell(8).value =
        m.studentsReached !== '' && m.studentsReached !== undefined
          ? Number(m.studentsReached)
          : '';
      row.getCell(9).value = m.initiativesTaken || '';
      row.getCell(10).value = m.remarks || '';

      // Style data cells
      for (let c = 1; c <= 10; c++) {
        const cell = row.getCell(c);
        cell.font = { name: 'Arial', size: 9.5 };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE0E0E0' } },
          bottom: { style: 'thin', color: { argb: 'FFE0E0E0' } },
          left: { style: 'thin', color: { argb: 'FFE0E0E0' } },
          right: { style: 'thin', color: { argb: 'FFE0E0E0' } },
        };
        if (c >= 2 && c <= 8) {
          cell.alignment = { horizontal: 'center', vertical: 'top' };
        } else if (c === 9 || c === 10) {
          cell.alignment = { horizontal: 'left', vertical: 'top', wrapText: true };
        } else {
          cell.alignment = { horizontal: 'left', vertical: 'top' };
        }
      }

      row.height = m.initiativesTaken && m.initiativesTaken.includes('\n') ? 54 : 24;
      currentRowIndex++;
    }

    // Space before bottom tables
    currentRowIndex += 2;

    // Milestone-10 Final Target Check & Mentor Action Log
    const m10CheckRow = currentRowIndex;
    sheet.getCell(`A${m10CheckRow}`).value = 'Milestone-10 Final Target Check';
    sheet.getCell(`A${m10CheckRow}`).font = { name: 'Arial', size: 10, bold: true };

    sheet.getCell(`D${m10CheckRow}`).value = 'Mentor Action Log';
    sheet.getCell(`D${m10CheckRow}`).font = {
      name: 'Arial',
      size: 10,
      bold: true,
      color: { argb: 'FFFFFFFF' },
    };
    sheet.getCell(`D${m10CheckRow}`).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF000000' },
    };

    // Action Log Headers: Action / Initiative, Date, Outcome, Follow-up
    const actionHeaders = ['Action / Initiative', 'Date', 'Outcome', 'Follow-up'];
    actionHeaders.forEach((ah, idx) => {
      const cell = sheet.getCell(m10CheckRow + 1, idx + 4);
      cell.value = ah;
      cell.font = { name: 'Arial', size: 9.5, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF000000' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF000000' } },
        bottom: { style: 'thin', color: { argb: 'FF000000' } },
        left: { style: 'thin', color: { argb: 'FF444444' } },
        right: { style: 'thin', color: { argb: 'FF444444' } },
      };
    });

    // Milestone-10 items
    const m10 = milestones.find((item: any) => item.milestone.includes('10')) || {};
    const targetStudentsM10 = m10.targetStudents ?? Math.round(totalStudents * (finalTarget / 100));
    const actualStudentsM10 = m10.actualCompletion || 0;
    const actualPctM10 =
      m10.actualPct ||
      (totalStudents > 0 ? ((actualStudentsM10 / totalStudents) * 100).toFixed(1) : 0);
    const gapM10 = m10.gap || (Number(actualPctM10) - finalTarget).toFixed(1);

    const checkItems = [
      { label: 'Target Students', val: targetStudentsM10 },
      { label: 'Actual Students', val: actualStudentsM10 },
      { label: 'Actual Completion %', val: `${actualPctM10}%` },
      { label: 'Gap vs Target', val: `${gapM10}%` },
    ];

    checkItems.forEach((ci, idx) => {
      const r = m10CheckRow + 1 + idx;
      sheet.getCell(`A${r}`).value = ci.label;
      sheet.getCell(`A${r}`).font = { name: 'Arial', size: 9.5 };
      sheet.getCell(`A${r}`).border = {
        top: { style: 'thin', color: { argb: 'FFE0E0E0' } },
        bottom: { style: 'thin', color: { argb: 'FFE0E0E0' } },
        left: { style: 'thin', color: { argb: 'FFE0E0E0' } },
        right: { style: 'thin', color: { argb: 'FFE0E0E0' } },
      };

      sheet.getCell(`B${r}`).value = ci.val;
      sheet.getCell(`B${r}`).font = { name: 'Arial', size: 9.5, bold: true };
      sheet.getCell(`B${r}`).alignment = { horizontal: 'center' };
      sheet.getCell(`B${r}`).border = {
        top: { style: 'thin', color: { argb: 'FFE0E0E0' } },
        bottom: { style: 'thin', color: { argb: 'FFE0E0E0' } },
        left: { style: 'thin', color: { argb: 'FFE0E0E0' } },
        right: { style: 'thin', color: { argb: 'FFE0E0E0' } },
      };
    });

    // Action Log Rows
    let actionLogStartRow = m10CheckRow + 2;
    const logList = actionLogs.length > 0 ? actionLogs : [{}, {}, {}];
    logList.forEach((al: any) => {
      sheet.getCell(`D${actionLogStartRow}`).value = al.action || '';
      sheet.getCell(`E${actionLogStartRow}`).value = al.date || '';
      sheet.getCell(`F${actionLogStartRow}`).value = al.outcome || '';
      sheet.getCell(`G${actionLogStartRow}`).value = al.followUp || '';

      for (let c = 4; c <= 7; c++) {
        const cell = sheet.getCell(actionLogStartRow, c);
        cell.font = { name: 'Arial', size: 9.5 };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE0E0E0' } },
          bottom: { style: 'thin', color: { argb: 'FFE0E0E0' } },
          left: { style: 'thin', color: { argb: 'FFE0E0E0' } },
          right: { style: 'thin', color: { argb: 'FFE0E0E0' } },
        };
      }
      actionLogStartRow++;
    });

    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="Milestone_Weekly_Report_${new Date().toISOString().split('T')[0]}.xlsx"`,
      },
    });
  } catch (error: any) {
    console.error('Error generating milestone report excel:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to generate Excel report' },
      { status: 500 }
    );
  }
}
