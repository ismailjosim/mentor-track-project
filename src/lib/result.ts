import { AppError } from './errors';
import { ZodError } from 'zod';
import { NextResponse } from 'next/server';
import { logger } from './utils';

export type Result<T> =
  | { ok: true; data: T }
  | {
      ok: false;
      code: string;
      message: string;
      fieldErrors?: Record<string, string[]>;
      statusCode?: number;
    };

export function ok<T>(data: T): Result<T> {
  return { ok: true, data };
}

export function fail(
  code: string,
  message: string,
  statusCode = 400,
  fieldErrors?: Record<string, string[]>
): Result<never> {
  return {
    ok: false,
    code,
    message,
    statusCode,
    fieldErrors,
  };
}

export function formatZodIssues(error: ZodError): Record<string, string[]> {
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const path = issue.path.join('.') || 'root';
    if (!fieldErrors[path]) {
      fieldErrors[path] = [];
    }
    fieldErrors[path].push(issue.message);
  }
  return fieldErrors;
}

export function handleRouteError(error: unknown): NextResponse {
  if (error instanceof AppError) {
    return NextResponse.json(
      {
        success: false,
        code: error.code,
        message: error.message,
        errors: error.fieldErrors,
      },
      { status: error.statusCode }
    );
  }

  if (error instanceof ZodError) {
    const fieldErrors = formatZodIssues(error);
    return NextResponse.json(
      {
        success: false,
        code: 'VALIDATION_ERROR',
        message: 'Invalid input provided',
        errors: fieldErrors,
      },
      { status: 400 }
    );
  }

  // Handle Mongoose duplicate key error (11000)
  if (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: number }).code === 11000
  ) {
    const keyValue = (error as { keyValue?: Record<string, unknown> }).keyValue;
    const field = keyValue ? Object.keys(keyValue)[0] : 'Resource';
    return NextResponse.json(
      {
        success: false,
        code: 'CONFLICT',
        message: `${field} already exists`,
      },
      { status: 409 }
    );
  }

  // Never leak raw internal ORM / driver errors to the client (Rule 19.4)
  const requestId = crypto.randomUUID();
  logger.error(`[UnhandledError:${requestId}]`, error);

  return NextResponse.json(
    {
      success: false,
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred. Please try again later.',
      requestId,
    },
    { status: 500 }
  );
}
