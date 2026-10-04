export type Tab = 'assignment' | 'mentorship' | 'student';

export interface BulkResult {
  matched: number;
  unmatched: number;
  unmatchedEmails: string[];
  matchedStudents?: Array<{ studentId: string; email: string; name: string }>;
}

export const ASSIGNMENTS = Array.from({ length: 10 }, (_, i) => ({
  value: i + 1,
  label: `A-${String(i + 1).padStart(2, '0')}`,
}));

export const parseEmails = (text: string): string[] =>
  text
    .split(/[\r\n,;]+/)
    .map((e) => e.trim().toLowerCase())
    .filter((e) => Boolean(e) && e.includes('@'));
