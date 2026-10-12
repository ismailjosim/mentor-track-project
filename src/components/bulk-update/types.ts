export type Tab = 'assignment' | 'mentorship' | 'student';

export interface AssignmentImportRow {
  email: string;
  marks?: number | null;
  totalMarks?: 30 | 50 | 60 | null;
  name?: string;
}

export interface BulkMatchedStudent {
  studentId: string;
  email: string;
  name: string;
  sheetName?: string;
  marks?: number | null;
  totalMarks?: 30 | 50 | 60 | null;
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

/**
 * Helper to normalize and parse deadline tier (30, 50, or 60 marks)
 */
export const parseDeadlineTier = (val: unknown): 30 | 50 | 60 | undefined => {
  if (val === undefined || val === null || val === '') return undefined;
  const str = String(val).trim();
  const match = str.match(/\d+/);
  if (match) {
    const num = parseInt(match[0], 10);
    if (num === 30 || num === 50 || num === 60) return num as 30 | 50 | 60;
    if (num >= 55) return 60;
    if (num >= 40) return 50;
    if (num > 0) return 30;
  }
  return undefined;
};

export const parseEmails = (text: string): string[] =>
  text
    .split(/[\r\n,;]+/)
    .map((e) => e.trim().toLowerCase())
    .filter((e) => Boolean(e) && e.includes('@'));

/**
 * Smartly parse lines of text (pasted directly from Google Sheets or Excel)
 * Extracts email, marks (obtained marks), totalMarks (deadline tier), and optional student name.
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

    // First check if line has slash pattern e.g. 30/30, 50/60, 0/30, 30/60
    let marks: number | undefined = undefined;
    let totalMarks: 30 | 50 | 60 | undefined = undefined;
    let name: string | undefined = undefined;

    const slashMatch = line.match(/\b(-?\d+(?:\.\d+)?)\s*[/]\s*(\d+)\b/);
    if (slashMatch) {
      marks = Number(slashMatch[1]);
      totalMarks = parseDeadlineTier(slashMatch[2]);
    }

    // Split tokens by tab, comma, or semicolon
    let tokens = line
      .split(/[\t,;]+/)
      .map((t) => t.trim())
      .filter(Boolean);
    if (tokens.length <= 1) {
      tokens = line
        .split(/\s{2,}|\s+/)
        .map((t) => t.trim())
        .filter(Boolean);
    }

    const emailIndex = tokens.findIndex((t) => t.toLowerCase() === email || t.includes('@'));

    // If marks or totalMarks not fully determined from slash pattern, check numeric tokens
    if (marks === undefined || totalMarks === undefined) {
      const numericTokens: { value: number; index: number }[] = [];
      tokens.forEach((t, idx) => {
        if (idx === emailIndex) return;
        // Ignore date formats like "2026", "11:50", "Jul 13, 2026"
        if (/[:/]/.test(t) || /(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i.test(t))
          return;
        // Ignore roll formats like WEB14-3518
        if (/^web/i.test(t)) return;

        if (/^-?\d+(\.\d+)?$/.test(t)) {
          numericTokens.push({ value: Number(t), index: idx });
        }
      });

      // If there's an integer before the email and other numbers after it, the one before email is likely SL
      const candidateTokens =
        emailIndex > 0 &&
        numericTokens.some((nt) => nt.index < emailIndex) &&
        numericTokens.some((nt) => nt.index > emailIndex)
          ? numericTokens.filter((nt) => nt.index > emailIndex)
          : numericTokens;

      if (marks === undefined && candidateTokens.length > 0) {
        marks = candidateTokens[0].value;
      }
      if (totalMarks === undefined && candidateTokens.length > 1) {
        totalMarks = parseDeadlineTier(candidateTokens[1].value);
      }
    }

    // Extract name token: string with letters that is not email, date, roll, status
    const ignoredNamePatterns = [
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      /^(?:done|pending|submitted|not submitted)$/i,
      /^web\d*[-_]?\d+/i,
      /(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i,
    ];

    const nameToken = tokens.find((t, idx) => {
      if (idx === emailIndex) return false;
      if (/^-?\d+(\.\d+)?$/.test(t)) return false;
      if (/^\d+\/\d+$/.test(t)) return false;
      if (ignoredNamePatterns.some((p) => p.test(t))) return false;
      return /[a-zA-Z\u0980-\u09FF]/.test(t) && t.length > 1;
    });

    if (nameToken) {
      name = nameToken;
    }

    results.push({
      email,
      marks,
      totalMarks,
      name,
    });
  }

  return results;
};
