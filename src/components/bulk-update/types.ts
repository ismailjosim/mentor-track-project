export type Tab = 'assignment' | 'mentorship' | 'student';

export interface AssignmentImportRow {
  email: string;
  marks?: number | null;
  name?: string;
}

export interface BulkMatchedStudent {
  studentId: string;
  email: string;
  name: string;
  sheetName?: string;
  marks?: number | null;
  targetStatus: 'COMPLETED' | 'SUBMITTED';
}

export interface BulkResult {
  matched: number;
  unmatched: number;
  unmatchedEmails: string[];
  matchedStudents?: BulkMatchedStudent[];
  withMarks?: number;
  pendingMarks?: number;
}

export const ASSIGNMENTS = Array.from({ length: 10 }, (_, i) => ({
  value: i + 1,
  label: `A-${String(i + 1).padStart(2, '0')}`,
}));

export const DEADLINE_TIERS = [
  { value: 60, label: '60 Marks (1st Deadline / Full Marks)' },
  { value: 50, label: '50 Marks (2nd Deadline)' },
  { value: 30, label: '30 Marks (No Deadline)' },
] as const;

export type DeadlineTier = 30 | 50 | 60;

export const parseEmails = (text: string): string[] =>
  text
    .split(/[\r\n,;]+/)
    .map((e) => e.trim().toLowerCase())
    .filter((e) => Boolean(e) && e.includes('@'));

/**
 * Smartly parse lines of text (pasted directly from Google Sheets or Excel)
 * Extracts email, marks, and optional student name.
 */
export const parseAssignmentInput = (text: string): AssignmentImportRow[] => {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const results: AssignmentImportRow[] = [];
  const emailRegex = /[^\s@]+@[^\s@]+\.[^\s@]+/;

  for (const line of lines) {
    // Check if line contains an email
    const emailMatch = line.match(emailRegex);
    if (!emailMatch) continue;

    const email = emailMatch[0].toLowerCase().trim();

    // Check for tokens separated by tab, comma, or semicolon
    let tokens = line
      .split(/[\t,;]+/)
      .map((t) => t.trim())
      .filter(Boolean);
    if (tokens.length <= 1) {
      // Fallback split by multiple spaces
      tokens = line
        .split(/\s{2,}|\s+/)
        .map((t) => t.trim())
        .filter(Boolean);
    }

    let marks: number | undefined = undefined;
    let name: string | undefined = undefined;

    // Find numeric token for marks (can be negative like -2, -4, 0, or positive)
    const numToken = tokens.find((t) => t !== email && /^-?\d+(\.\d+)?$/.test(t));
    if (numToken !== undefined) {
      const parsed = Number(numToken);
      if (!Number.isNaN(parsed)) {
        marks = parsed;
      }
    }

    // Find name token (non-email, non-number text with letters)
    const nameToken = tokens.find(
      (t) => t !== email && t !== numToken && /[a-zA-Z\u0980-\u09FF]/.test(t)
    );
    if (nameToken) {
      name = nameToken;
    }

    results.push({
      email,
      marks,
      name,
    });
  }

  return results;
};
