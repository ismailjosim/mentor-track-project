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
