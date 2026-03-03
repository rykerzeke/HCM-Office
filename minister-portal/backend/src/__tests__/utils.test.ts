import { describe, it, expect } from 'vitest';
import { z, ZodError } from 'zod';
import { loginSchema, createCitizenSchema, createCaseSchema, assignCaseSchema, createCommentSchema } from '../utils/validation';
import { AppError, handleError } from '../utils/errors';

// ---------------------------------------------------------------------------
// Validation schemas
// ---------------------------------------------------------------------------
describe('loginSchema', () => {
  it('accepts valid email and password', () => {
    const result = loginSchema.parse({ email: 'admin@portal.gov', password: 'secret' });
    expect(result.email).toBe('admin@portal.gov');
  });

  it('rejects invalid email', () => {
    expect(() => loginSchema.parse({ email: 'not-an-email', password: 'x' })).toThrow(ZodError);
  });

  it('rejects empty password', () => {
    expect(() => loginSchema.parse({ email: 'a@b.com', password: '' })).toThrow(ZodError);
  });
});

describe('createCitizenSchema', () => {
  it('accepts valid citizen', () => {
    const result = createCitizenSchema.parse({ name: 'Ramu', phone: '9876543210' });
    expect(result.name).toBe('Ramu');
  });

  it('rejects phone shorter than 10 digits', () => {
    expect(() => createCitizenSchema.parse({ name: 'X', phone: '123' })).toThrow(ZodError);
  });

  it('rejects aadhaar not exactly 12 chars', () => {
    expect(() => createCitizenSchema.parse({ name: 'X', phone: '9876543210', aadhaar: '1234' })).toThrow(ZodError);
  });

  it('accepts empty string aadhaar', () => {
    const result = createCitizenSchema.parse({ name: 'X', phone: '9876543210', aadhaar: '' });
    expect(result.aadhaar).toBe('');
  });
});

describe('createCaseSchema', () => {
  const valid = {
    citizenId: '550e8400-e29b-41d4-a716-446655440000',
    purpose: 'Need help with land dispute issue',
    referringOfficer: 'VISHAL_GUPTA',
    referenceMode: 'CALL',
  };

  it('accepts valid case data', () => {
    const result = createCaseSchema.parse(valid);
    expect(result.referringOfficer).toBe('VISHAL_GUPTA');
  });

  it('rejects purpose shorter than 10 chars', () => {
    expect(() => createCaseSchema.parse({ ...valid, purpose: 'Short' })).toThrow(ZodError);
  });

  it('rejects invalid citizenId (not UUID)', () => {
    expect(() => createCaseSchema.parse({ ...valid, citizenId: 'not-a-uuid' })).toThrow(ZodError);
  });

  it('rejects unknown referringOfficer', () => {
    expect(() => createCaseSchema.parse({ ...valid, referringOfficer: 'UNKNOWN_OFFICER' })).toThrow(ZodError);
  });
});

describe('createCommentSchema', () => {
  it('accepts non-empty content', () => {
    const result = createCommentSchema.parse({ content: 'Follow up needed' });
    expect(result.content).toBe('Follow up needed');
  });

  it('rejects empty content', () => {
    expect(() => createCommentSchema.parse({ content: '' })).toThrow(ZodError);
  });
});

// ---------------------------------------------------------------------------
// AppError and handleError
// ---------------------------------------------------------------------------
describe('AppError', () => {
  it('creates error with correct properties', () => {
    const err = new AppError(403, 'Forbidden', 'FORBIDDEN', { role: 'STAFF' });
    expect(err.statusCode).toBe(403);
    expect(err.message).toBe('Forbidden');
    expect(err.code).toBe('FORBIDDEN');
    expect(err.details).toEqual({ role: 'STAFF' });
  });
});

describe('handleError', () => {
  const makeReply = () => {
    let capturedStatus = 200;
    let capturedBody: unknown = null;
    return {
      status: (code: number) => ({ send: (body: unknown) => { capturedStatus = code; capturedBody = body; } }),
      getStatus: () => capturedStatus,
      getBody: () => capturedBody,
    };
  };

  it('handles ZodError with 400 and field details', () => {
    const reply = makeReply() as unknown as import('fastify').FastifyReply;
    let zodErr: unknown;
    try { z.object({ email: z.string().email() }).parse({ email: 'not-an-email' }); } catch (e) { zodErr = e; }
    handleError(zodErr, reply);
    const body = (reply as unknown as ReturnType<typeof makeReply>).getBody() as { error: string; code: string; details: { field: string }[] };
    expect(body.error).toBe('Validation failed');
    expect(body.code).toBe('VALIDATION_ERROR');
    expect(body.details[0].field).toBe('email');
  });

  it('handles AppError with its own statusCode', () => {
    const reply = makeReply() as unknown as import('fastify').FastifyReply;
    const appErr = new AppError(409, 'Duplicate', 'DUPLICATE_RECORD');
    handleError(appErr, reply);
    expect((reply as unknown as ReturnType<typeof makeReply>).getStatus()).toBe(409);
  });

  it('handles unknown errors with 500', () => {
    const reply = makeReply() as unknown as import('fastify').FastifyReply;
    handleError(new Error('Something broke'), reply);
    const body = (reply as unknown as ReturnType<typeof makeReply>).getBody() as { code: string };
    expect(body.code).toBe('INTERNAL_ERROR');
  });
});
