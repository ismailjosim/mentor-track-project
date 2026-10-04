import { describe, it, expect } from 'vitest';
import { StudentCreateSchema, StudentUpdateSchema } from '../validators';

describe('Student Validators & Cohort Logic', () => {
  it('should accept valid student with cohort 14', () => {
    const input = {
      name: 'John Doe',
      email: 'john@example.com',
      phone: '01700000000',
      cohort: '14',
    };

    const parsed = StudentCreateSchema.parse(input);
    expect(parsed.name).toBe('John Doe');
    expect(parsed.email).toBe('john@example.com');
    expect(parsed.cohort).toBe('14');
  });

  it('should default cohort to 13 if omitted', () => {
    const input = {
      name: 'Jane Doe',
      email: 'jane@example.com',
      phone: '01800000000',
    };

    const parsed = StudentCreateSchema.parse(input);
    expect(parsed.cohort).toBe('13');
  });

  it('should fail when name or phone is missing', () => {
    const missingPhone = {
      name: 'Jane Doe',
      email: 'jane@example.com',
    };

    expect(() => StudentCreateSchema.parse(missingPhone)).toThrow();
  });

  it('should allow partial updates in StudentUpdateSchema', () => {
    const update = {
      cohort: '14',
      currentStatus: 'On Track',
    };

    const parsed = StudentUpdateSchema.parse(update);
    expect(parsed.cohort).toBe('14');
    expect(parsed.currentStatus).toBe('On Track');
  });
});
