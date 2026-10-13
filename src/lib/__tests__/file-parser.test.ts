import { describe, it, expect } from 'vitest';
import { validateStudentData } from '../file-parser';

describe('File Parser & Student Data Validation (Bulk Import Rules)', () => {
  it('should validate row with only name, email, phone (minimum required fields)', () => {
    const rawRow = {
      'Full Name': 'Rahim Ali',
      'Email Address': 'rahim@example.com',
      'Mobile No': '01711111111',
    };

    const result = validateStudentData(rawRow, '14');
    expect(result.valid).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data?.name).toBe('Rahim Ali');
    expect(result.data?.email).toBe('rahim@example.com');
    expect(result.data?.phone).toBe('01711111111');
    expect(result.data?.cohort).toBe('14');
  });

  it('should capture extra matched fields and default cohort to target cohort', () => {
    const rawRow = {
      name: 'Fatema Begum',
      email: 'fatema@example.com',
      phone: '01933333333',
      district: 'Dhaka',
      'Working Device': 'Laptop',
      Status: 'On Track',
      'Some Random Unknown Column': 'Value to ignore',
    };

    const result = validateStudentData(rawRow, '13');
    expect(result.valid).toBe(true);
    expect(result.data?.name).toBe('Fatema Begum');
    expect(result.data?.district).toBe('Dhaka');
    expect(result.data?.workingDevice).toBe('Laptop');
    expect(result.data?.currentStatus).toBe('On Track');
    expect(result.data?.cohort).toBe('13');
  });

  it('should flag row as invalid if email or phone is missing', () => {
    const missingPhone = {
      name: 'Missing Phone',
      email: 'missing@example.com',
    };

    const result = validateStudentData(missingPhone, '14');
    expect(result.valid).toBe(false);
    expect(result.errors).toBeDefined();
    expect(result.errors?.some((e) => e.includes('phone') || e.includes('Phone'))).toBe(true);
  });
});

describe('Assignment Bulk Import Parsing & Deadline Tier Detection', () => {
  it('should parse row with Obtained Marks: 30 and Total Marks: 30 (entry 25 case)', async () => {
    const { validateAssignmentData } = await import('../file-parser');
    const rawRow = {
      SL: 25,
      Email: 'ayashaclassroom@gmail.com',
      'Submitted At': 'Jul 15, 2026 8:01',
      'Obtained Marks': 30,
      'Total Marks': 30,
      'Raw Marks': '30/30',
      Status: 'Done',
      'Student Name': 'Ayasha Siddiqua',
      Roll: 'WEB14-4038',
    };

    const result = validateAssignmentData(rawRow);
    expect(result.valid).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data?.email).toBe('ayashaclassroom@gmail.com');
    expect(result.data?.marks).toBe(30);
    expect(result.data?.totalMarks).toBe(30);
    expect(result.data?.name).toBe('Ayasha Siddiqua');
  });

  it('should parse row with Obtained Marks: 0 and Total Marks: 30', async () => {
    const { validateAssignmentData } = await import('../file-parser');
    const rawRow = {
      SL: 13,
      Email: 'aloktalukder1971@gmail.com',
      'Submitted At': 'Jul 24, 2026 11:20',
      'Obtained Marks': 0,
      'Total Marks': 30,
      'Raw Marks': '0/30',
      Status: 'Done',
      'Student Name': 'Alok talukder',
      Roll: 'WEB14-3504',
    };

    const result = validateAssignmentData(rawRow);
    expect(result.valid).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data?.email).toBe('aloktalukder1971@gmail.com');
    expect(result.data?.marks).toBe(0);
    expect(result.data?.totalMarks).toBe(30);
    expect(result.data?.name).toBe('Alok talukder');
  });

  it('should parse row with Obtained Marks: 50 and Total Marks: 60', async () => {
    const { validateAssignmentData } = await import('../file-parser');
    const rawRow = {
      SL: 23,
      Email: 'beyoushoke@gmail.com',
      'Submitted At': 'Jul 13, 2026 10:15',
      'Obtained Marks': 50,
      'Total Marks': 60,
      'Raw Marks': '50/60',
      Status: 'Done',
      'Student Name': 'Atik Muntasir',
      Roll: 'WEB14-3005',
    };

    const result = validateAssignmentData(rawRow);
    expect(result.valid).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data?.email).toBe('beyoushoke@gmail.com');
    expect(result.data?.marks).toBe(50);
    expect(result.data?.totalMarks).toBe(60);
    expect(result.data?.name).toBe('Atik Muntasir');
  });

  it('should parse pasted text with full tab-separated line from Google Sheets', async () => {
    const { parseAssignmentInput } = await import('../../components/bulk-update/types');
    const pastedText =
      '25\tayashaclassroom@gmail.com\tJul 15, 2026 8:01\t30\t30\t30/30\tDone\tAyasha Siddiqua\tWEB14-4038\n' +
      '13\taloktalukder1971@gmail.com\tJul 24, 2026 11:20\t0\t30\t0/30\tDone\tAlok talukder\tWEB14-3504';

    const parsed = parseAssignmentInput(pastedText);
    expect(parsed.length).toBe(2);

    expect(parsed[0].email).toBe('ayashaclassroom@gmail.com');
    expect(parsed[0].marks).toBe(30);
    expect(parsed[0].totalMarks).toBe(30);
    expect(parsed[0].name).toBe('Ayasha Siddiqua');

    expect(parsed[1].email).toBe('aloktalukder1971@gmail.com');
    expect(parsed[1].marks).toBe(0);
    expect(parsed[1].totalMarks).toBe(30);
    expect(parsed[1].name).toBe('Alok talukder');
  });

  it('should parse pasted text with raw slash format (e.g. 30/30)', async () => {
    const { parseAssignmentInput } = await import('../../components/bulk-update/types');
    const pastedText = 'student@example.com\t30/30';

    const parsed = parseAssignmentInput(pastedText);
    expect(parsed.length).toBe(1);
    expect(parsed[0].email).toBe('student@example.com');
    expect(parsed[0].marks).toBe(30);
    expect(parsed[0].totalMarks).toBe(30);
  });

  it('should parse full table from spreadsheet with Header (Pending, Submitted, Completed rows)', async () => {
    const { parseAssignmentInput } = await import('../../components/bulk-update/types');
    const tableData = [
      'SL\tEmail\tSubmitted At\tObtained Marks\tTotal Marks\tRaw Marks\tStatus\tStudent Name\tRoll',
      '1\ttanvirn014@gmail.com\t—\t0\t50\t0/50\tPending\t\t',
      '2\tabdulmajidrakib@gmail.com\tSep 13, 2026 10:15\t0\t30\t0/30\tSubmitted but marks not given\tAbdul Mazid Rakib\tWEB14-1390',
      '4\tabdmrdhali@gmail.com\tSep 11, 2026 6:15\t60\t60\t60/60\tCompleted\tAbdullah Ikra Bir\tWEB14-0761',
      '11\talwasia674@gmail.com\tSep 13, 2026 8:20\t54\t60\t54/60\tCompleted\tal wasi ahmed\tWEB14-2666',
      '20\tasifahemed79@gmail.com\tOct 3, 2026 8:44\t0\t60\t0/60\tSubmitted but marks not given\tAsif Ahemed\tWEB14-2151',
    ].join('\n');

    const rows = parseAssignmentInput(tableData);
    expect(rows.length).toBe(5);

    // Row 1: Pending
    expect(rows[0].email).toBe('tanvirn014@gmail.com');
    expect(rows[0].status).toBe('PENDING');
    expect(rows[0].totalMarks).toBe(50);
    expect(rows[0].marks).toBeUndefined();

    // Row 2: Submitted but marks not given
    expect(rows[1].email).toBe('abdulmajidrakib@gmail.com');
    expect(rows[1].status).toBe('SUBMITTED');
    expect(rows[1].totalMarks).toBe(30);
    expect(rows[1].marks).toBeUndefined();
    expect(rows[1].name).toBe('Abdul Mazid Rakib');
    expect(rows[1].roll).toBe('WEB14-1390');
    expect(rows[1].submittedAt).toBe('Sep 13, 2026 10:15');

    // Row 4: Completed
    expect(rows[2].email).toBe('abdmrdhali@gmail.com');
    expect(rows[2].status).toBe('COMPLETED');
    expect(rows[2].marks).toBe(60);
    expect(rows[2].totalMarks).toBe(60);
    expect(rows[2].name).toBe('Abdullah Ikra Bir');
    expect(rows[2].roll).toBe('WEB14-0761');

    // Row 11: Completed with partial marks (54/60)
    expect(rows[3].email).toBe('alwasia674@gmail.com');
    expect(rows[3].status).toBe('COMPLETED');
    expect(rows[3].marks).toBe(54);
    expect(rows[3].totalMarks).toBe(60);
    expect(rows[3].name).toBe('al wasi ahmed');

    // Row 20: Submitted with tier 60
    expect(rows[4].email).toBe('asifahemed79@gmail.com');
    expect(rows[4].status).toBe('SUBMITTED');
    expect(rows[4].totalMarks).toBe(60);
    expect(rows[4].name).toBe('Asif Ahemed');
    expect(rows[4].roll).toBe('WEB14-2151');
  });

  it('should parse spreadsheet rows without header', async () => {
    const { parseAssignmentInput } = await import('../../components/bulk-update/types');
    const tableData = [
      '1\ttanvirn014@gmail.com\t—\t0\t50\t0/50\tPending\t\t',
      '4\tabdmrdhali@gmail.com\tSep 11, 2026 6:15\t60\t60\t60/60\tCompleted\tAbdullah Ikra Bir\tWEB14-0761',
    ].join('\n');

    const rows = parseAssignmentInput(tableData);
    expect(rows.length).toBe(2);
    expect(rows[0].email).toBe('tanvirn014@gmail.com');
    expect(rows[0].status).toBe('PENDING');
    expect(rows[0].totalMarks).toBe(50);

    expect(rows[1].email).toBe('abdmrdhali@gmail.com');
    expect(rows[1].status).toBe('COMPLETED');
    expect(rows[1].marks).toBe(60);
    expect(rows[1].name).toBe('Abdullah Ikra Bir');
  });

  it('should validate row objects from CSV/XLSX with Pending and Submitted status', async () => {
    const { validateAssignmentData } = await import('../file-parser');

    const pendingRow = {
      SL: 1,
      Email: 'tanvirn014@gmail.com',
      'Submitted At': '—',
      'Obtained Marks': 0,
      'Total Marks': 50,
      'Raw Marks': '0/50',
      Status: 'Pending',
      'Student Name': '',
      Roll: '',
    };
    const pendingResult = validateAssignmentData(pendingRow);
    expect(pendingResult.valid).toBe(true);
    expect(pendingResult.data?.status).toBe('PENDING');
    expect(pendingResult.data?.totalMarks).toBe(50);
    expect(pendingResult.data?.marks).toBeUndefined();

    const submittedRow = {
      SL: 2,
      Email: 'abdulmajidrakib@gmail.com',
      'Submitted At': 'Sep 13, 2026 10:15',
      'Obtained Marks': 0,
      'Total Marks': 30,
      'Raw Marks': '0/30',
      Status: 'Submitted but marks not given',
      'Student Name': 'Abdul Mazid Rakib',
      Roll: 'WEB14-1390',
    };
    const submittedResult = validateAssignmentData(submittedRow);
    expect(submittedResult.valid).toBe(true);
    expect(submittedResult.data?.status).toBe('SUBMITTED');
    expect(submittedResult.data?.totalMarks).toBe(30);
    expect(submittedResult.data?.name).toBe('Abdul Mazid Rakib');
    expect(submittedResult.data?.roll).toBe('WEB14-1390');
    expect(submittedResult.data?.submittedAt).toBe('Sep 13, 2026 10:15');
  });
});
