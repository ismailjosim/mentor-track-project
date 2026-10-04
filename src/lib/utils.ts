import { ZodError } from 'zod';

/**
 * Custom API Error Class
 */
export class ApiError extends Error {
  public statusCode: number;
  public errors?: unknown[];

  constructor(statusCode: number, message: string, errors?: unknown[]) {
    super(message);

    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.errors = errors;

    // Maintains proper stack trace
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

/**
 * Handle Zod Validation Errors
 */
export function handleZodError(error: ZodError) {
  return {
    statusCode: 400,
    message: 'Validation error',
    errors: error.issues.map((err) => ({
      field: err.path.join('.'),
      message: err.message,
    })),
  };
}

/**
 * Handle Database Errors (MongoDB / Mongoose)
 */
export function handleDbError(error: unknown) {
  /**
   * Unknown Error
   */
  if (!(error instanceof Error)) {
    return {
      statusCode: 500,
      message: 'Database error',
      errors: [{ message: 'Unknown error' }],
    };
  }

  const dbError = error as {
    code?: number;
    keyValue?: Record<string, unknown>;
    errors?: Record<string, { message?: string }>;
    name?: string;
    message?: string;
  };

  /**
   * Duplicate Key Error
   */
  if (dbError.code === 11000) {
    const field = Object.keys(dbError.keyValue || {})[0];

    return {
      statusCode: 409,
      message: `${field} already exists`,
      errors: [
        {
          field,
          message: `${field} already exists`,
        },
      ],
    };
  }

  /**
   * Mongoose Validation Error
   */
  if (dbError.name === 'ValidationError') {
    const errors = Object.entries(dbError.errors || {}).map(([field, err]) => ({
      field,
      message: err?.message || 'Validation error',
    }));

    return {
      statusCode: 400,
      message: 'Database validation error',
      errors,
    };
  }

  /**
   * Default Database Error - sanitized, never leak raw message to client (Rule 19.4)
   */
  const errorRef = crypto.randomUUID().slice(0, 8);
  console.error(`[DbError:${errorRef}]`, error);

  return {
    statusCode: 500,
    message: 'An error occurred while processing the database request.',
    errors: [
      {
        message: 'Internal server error. Please try again later.',
        errorRef,
      },
    ],
  };
}

/**
 * Standard API Response
 */
export function createResponse<T>(
  statusCode: number,
  message: string,
  data?: T,
  errors?: unknown[]
) {
  return {
    statusCode,
    message,
    ...(data !== undefined && { data }),
    ...(errors !== undefined && { errors }),
    timestamp: new Date().toISOString(),
  };
}

/**
 * Format Date
 */
export function formatDate(date: Date): string {
  return date.toISOString();
}

/**
 * Parse Date String
 */
export function parseDateString(dateString: string | Date): Date {
  if (dateString instanceof Date) {
    return dateString;
  }

  const parsedDate = new Date(dateString);

  if (isNaN(parsedDate.getTime())) {
    throw new Error('Invalid date string');
  }

  return parsedDate;
}

/**
 * Calculate Difference Between Two Dates
 */
export function calculateDaysDifference(date1: Date, date2: Date): number {
  const diffTime = Math.abs(date2.getTime() - date1.getTime());

  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Check Overdue
 */
export function isOverdue(dueDate: Date): boolean {
  return new Date().getTime() > dueDate.getTime();
}

/**
 * Pagination Utility
 */
export function getPaginationParams(page?: number, limit?: number) {
  const pageNum = Math.max(1, Number(page) || 1);

  const limitNum = Math.min(100, Math.max(1, Number(limit) || 10));

  const skip = (pageNum - 1) * limitNum;

  return {
    page: pageNum,
    limit: limitNum,
    skip,
  };
}

/**
 * Slugify Text
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]/g, '')
    .replace(/--+/g, '-');
}

/**
 * Validate MongoDB ObjectId
 */
export function isValidObjectId(id: string): boolean {
  return /^[0-9a-fA-F]{24}$/.test(id);
}

/**
 * Safely escape string for use in RegExp
 */
export function escapeRegex(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Sanitize Input - Trim and normalize text fields
 */
export function sanitizeInput(data: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string') {
      // Trim whitespace and apply field-specific rules
      let cleanValue = value.trim();

      if (key === 'email') {
        cleanValue = cleanValue.toLowerCase();
      } else if (key === 'phone' || key === 'whatsapp') {
        // Remove all non-digit characters from phone numbers
        cleanValue = cleanValue.replace(/\D/g, '');
      }

      sanitized[key] = cleanValue;
    } else if (Array.isArray(value)) {
      // Sanitize array elements if they're strings
      sanitized[key] = value.map((item) => (typeof item === 'string' ? item.trim() : item));
    } else if (value !== null && value !== undefined) {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Logger Utility
 */
export const logger = {
  info: (message: string, data?: unknown) => {
    console.log(
      `[INFO] ${new Date().toISOString()} - ${message}`,
      data ? JSON.stringify(data) : ''
    );
  },
  error: (message: string, error?: unknown) => {
    console.error(
      `[ERROR] ${new Date().toISOString()} - ${message}`,
      error ? JSON.stringify(error) : ''
    );
  },
  debug: (message: string, data?: unknown) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(
        `[DEBUG] ${new Date().toISOString()} - ${message}`,
        data ? JSON.stringify(data) : ''
      );
    }
  },
};
