export type Tab = 'assignment' | 'mentorship' | 'student';

export type AssignmentStatusType = 'COMPLETED' | 'SUBMITTED' | 'PENDING';

export interface AssignmentImportRow {
  email: string;
  marks?: number | null;
  totalMarks?: 30 | 50 | 60 | null;
  name?: string;
  status?: AssignmentStatusType;
  submittedAt?: string;
  roll?: string;
  rawMarks?: string;
}

export interface BulkMatchedStudent {
  studentId: string;
  email: string;
  name: string;
  cohort?: string;
  sheetName?: string;
  marks?: number | null;
  totalMarks?: 30 | 50 | 60 | null;
  targetStatus: AssignmentStatusType;
  submittedAt?: string;
  roll?: string;
}

export interface BulkResult {
  matched: number;
  unmatched: number;
  unmatchedEmails: string[];
  matchedStudents?: BulkMatchedStudent[];
  withMarks?: number;
  pendingMarks?: number;
  pendingCount?: number;
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
 * Normalizes assignment submission status from text, marks, and submitted date
 */
export const normalizeAssignmentStatus = (
  rawStatus: unknown,
  marks?: number | null,
  submittedAt?: string | null
): AssignmentStatusType => {
  if (rawStatus !== undefined && rawStatus !== null && rawStatus !== '') {
    const s = String(rawStatus).trim().toLowerCase();
    if (
      s.includes('completed') ||
      s.includes('done') ||
      s.includes('graded') ||
      s.includes('reviewed')
    ) {
      return 'COMPLETED';
    }
    if (s.includes('submitted')) {
      return 'SUBMITTED';
    }
    if (s.includes('pending') || s.includes('not submitted') || s.includes('missing')) {
      return 'PENDING';
    }
  }

  // Fallback heuristics when status column is not present or blank
  if (typeof marks === 'number' && marks > 0) {
    return 'COMPLETED';
  }
  if (
    submittedAt &&
    submittedAt !== '—' &&
    submittedAt !== '-' &&
    submittedAt.trim().length > 0
  ) {
    return 'SUBMITTED';
  }
  if (marks === 0 && (!submittedAt || submittedAt === '—' || submittedAt === '-')) {
    return 'PENDING';
  }
  return 'SUBMITTED';
};

/**
 * Smartly parse lines of text (pasted directly from Google Sheets or Excel).
 * Supports the 9-column sheet format:
 * [SL | Email | Submitted At | Obtained Marks | Total Marks | Raw Marks | Status | Student Name | Roll]
 * as well as legacy/free-form rows.
 */
export const parseAssignmentInput = (text: string): AssignmentImportRow[] => {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length === 0) return [];

  const emailRegex = /[^\s@]+@[^\s@]+\.[^\s@]+/;

  // Check if first line is a header row
  const firstLine = lines[0];
  const isHeaderLine =
    !emailRegex.test(firstLine) &&
    (/email/i.test(firstLine) ||
      /obtained/i.test(firstLine) ||
      /marks/i.test(firstLine) ||
      /raw/i.test(firstLine) ||
      /^sl\b/i.test(firstLine));

  let headerIndices: {
    sl?: number;
    email?: number;
    submittedAt?: number;
    obtainedMarks?: number;
    totalMarks?: number;
    rawMarks?: number;
    status?: number;
    name?: number;
    roll?: number;
  } | null = null;

  let dataLines = lines;

  if (isHeaderLine) {
    const headerTokens = firstLine.split('\t').map((t) => t.trim().toLowerCase());
    if (headerTokens.length > 1) {
      headerIndices = {
        sl: headerTokens.findIndex((h) => /^sl\b|^serial/i.test(h)),
        email: headerTokens.findIndex((h) => /email/i.test(h)),
        submittedAt: headerTokens.findIndex((h) =>
          /submitted\s*at|submission\s*date|date/i.test(h)
        ),
        obtainedMarks: headerTokens.findIndex((h) =>
          /obtained\s*marks|^marks$|^score$/i.test(h)
        ),
        totalMarks: headerTokens.findIndex((h) =>
          /total\s*marks|max\s*marks|^tier$/i.test(h)
        ),
        rawMarks: headerTokens.findIndex((h) => /raw\s*marks/i.test(h)),
        status: headerTokens.findIndex((h) => /status/i.test(h)),
        name: headerTokens.findIndex((h) => /student\s*name|^name$/i.test(h)),
        roll: headerTokens.findIndex((h) => /roll/i.test(h)),
      };
      dataLines = lines.slice(1);
    }
  }

  const results: AssignmentImportRow[] = [];

  for (const line of dataLines) {
    const emailMatch = line.match(emailRegex);
    if (!emailMatch) continue;

    // Split line by tab (preserving blank positions)
    const tabTokens = line.split('\t').map((t) => t.trim());

    // If line has 7+ tab tokens or matching header indices
    const hasTabStructure =
      tabTokens.length >= 7 &&
      (headerIndices !== null ||
        tabTokens[1]?.includes('@') ||
        tabTokens[0]?.includes('@'));

    if (hasTabStructure) {
      const getCol = (
        key: keyof NonNullable<typeof headerIndices>,
        defaultIdx: number
      ) => {
        const idx =
          headerIndices &&
          headerIndices[key] !== undefined &&
          headerIndices[key] !== -1
            ? headerIndices[key]!
            : defaultIdx;
        return idx < tabTokens.length ? tabTokens[idx] : '';
      };

      const email = (getCol('email', 1) || emailMatch[0]).toLowerCase().trim();
      const rawSubAt = getCol('submittedAt', 2);
      const rawObtMarks = getCol('obtainedMarks', 3);
      const rawTotMarks = getCol('totalMarks', 4);
      const rawSlashMarks = getCol('rawMarks', 5);
      const rawStatusStr = getCol('status', 6);
      const rawNameStr = getCol('name', 7);
      const rawRollStr = getCol('roll', 8);

      const submittedAt =
        rawSubAt && rawSubAt !== '—' && rawSubAt !== '-' ? rawSubAt : undefined;

      let marks: number | undefined = undefined;
      if (rawObtMarks !== '' && !Number.isNaN(Number(rawObtMarks))) {
        marks = Number(rawObtMarks);
      }

      let totalMarks: 30 | 50 | 60 | undefined = parseDeadlineTier(rawTotMarks);

      // Check slash denominator if totalMarks not resolved
      if (rawSlashMarks) {
        const sm = rawSlashMarks.match(/(-?\d+(?:\.\d+)?)\s*[/]\s*(\d+)/);
        if (sm) {
          if (marks === undefined) marks = Number(sm[1]);
          if (totalMarks === undefined) totalMarks = parseDeadlineTier(sm[2]);
        }
      }

      const status = normalizeAssignmentStatus(rawStatusStr, marks, submittedAt);

      const cleanName =
        rawNameStr && rawNameStr !== '—' && rawNameStr !== '-' ? rawNameStr : undefined;
      const cleanRoll =
        rawRollStr && rawRollStr !== '—' && rawRollStr !== '-' ? rawRollStr : undefined;

      results.push({
        email,
        marks: status === 'COMPLETED' ? marks : undefined,
        totalMarks,
        name: cleanName,
        status,
        submittedAt,
        roll: cleanRoll,
        rawMarks:
          rawSlashMarks ||
          (marks !== undefined && totalMarks ? `${marks}/${totalMarks}` : undefined),
      });
      continue;
    }

    // Heuristic parser for free-form or comma/space-separated rows
    const email = emailMatch[0].toLowerCase().trim();
    let marks: number | undefined = undefined;
    let totalMarks: 30 | 50 | 60 | undefined = undefined;
    let name: string | undefined = undefined;
    let rawMarks: string | undefined = undefined;
    let statusText: string | undefined = undefined;

    const slashMatch = line.match(/\b(-?\d+(?:\.\d+)?)\s*[/]\s*(\d+)\b/);
    if (slashMatch) {
      marks = Number(slashMatch[1]);
      totalMarks = parseDeadlineTier(slashMatch[2]);
      rawMarks = slashMatch[0];
    }

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

    const statusToken = tokens.find(
      (t) =>
        /^(?:completed|done|submitted|pending|not submitted)$/i.test(t) ||
        /submitted but/i.test(t)
    );
    if (statusToken) statusText = statusToken;

    if (marks === undefined || totalMarks === undefined) {
      const numericTokens: { value: number; index: number }[] = [];
      tokens.forEach((t, idx) => {
        if (idx === emailIndex) return;
        if (/[:/]/.test(t) || /(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i.test(t))
          return;
        if (/^web/i.test(t)) return;
        if (/^-?\d+(\.\d+)?$/.test(t)) {
          numericTokens.push({ value: Number(t), index: idx });
        }
      });

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

    const ignoredNamePatterns = [
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      /^(?:done|pending|completed|submitted|not submitted)$/i,
      /submitted but/i,
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

    if (nameToken) name = nameToken;

    const status = normalizeAssignmentStatus(statusText, marks, undefined);

    results.push({
      email,
      marks: status === 'COMPLETED' ? marks : undefined,
      totalMarks,
      name,
      status,
      rawMarks,
    });
  }

  return results;
};
