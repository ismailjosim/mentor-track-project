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
});
