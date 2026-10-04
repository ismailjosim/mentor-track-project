import { describe, it, expect } from 'vitest';
import { NotFoundError, UnauthorizedError, ValidationError } from '../errors';
import { ok, fail, handleRouteError } from '../result';
import { z } from 'zod';

describe('Error Handling and Result Pattern', () => {
  it('should construct AppError subclasses with correct status codes', () => {
    const notFound = new NotFoundError('Student');
    expect(notFound.statusCode).toBe(404);
    expect(notFound.code).toBe('NOT_FOUND');
    expect(notFound.message).toBe('Student not found');

    const unauth = new UnauthorizedError();
    expect(unauth.statusCode).toBe(401);
    expect(unauth.code).toBe('UNAUTHENTICATED');

    const validation = new ValidationError('Bad email', { email: ['Invalid email format'] });
    expect(validation.statusCode).toBe(400);
    expect(validation.fieldErrors?.email).toContain('Invalid email format');
  });

  it('should create typed Result objects', () => {
    const successResult = ok({ id: '123', name: 'Student 1' });
    expect(successResult.ok).toBe(true);
    if (successResult.ok) {
      expect(successResult.data.name).toBe('Student 1');
    }

    const failResult = fail('FORBIDDEN', 'Access denied', 403);
    expect(failResult.ok).toBe(false);
    if (!failResult.ok) {
      expect(failResult.code).toBe('FORBIDDEN');
      expect(failResult.statusCode).toBe(403);
    }
  });

  it('handleRouteError should map AppError to corresponding status code without leaking stack traces', async () => {
    const appError = new NotFoundError('Student');
    const response = handleRouteError(appError);
    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.message).toBe('Student not found');
    expect(body.stack).toBeUndefined();
  });

  it('handleRouteError should map ZodError to 400 with field issues', async () => {
    const schema = z.object({ email: z.string().email() });
    const parsed = schema.safeParse({ email: 'not-an-email' });
    if (!parsed.success) {
      const response = handleRouteError(parsed.error);
      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.errors?.email).toBeDefined();
    }
  });
});
