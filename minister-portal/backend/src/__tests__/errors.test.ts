import { describe, it, expect, vi } from 'vitest';
import { z } from 'zod';
import { AppError, handleError } from '../utils/errors';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { FastifyReply } from 'fastify';

function makeReply() {
  const captured: { status?: number; body?: unknown } = {};
  const replyObj = {
    status: vi.fn((code: number) => {
      captured.status = code;
      return {
        send: vi.fn((body: unknown) => {
          captured.body = body;
        }),
      };
    }),
    captured,
  };
  return replyObj;
}

// Generate a real ZodError by parsing invalid data
function makeZodError() {
  try {
    z.object({ phone: z.string().min(10) }).parse({ phone: '' });
  } catch (err) {
    return err;
  }
}

describe('handleError — ZodError', () => {
  it('returns 400 with VALIDATION_ERROR code and field details', () => {
    const reply = makeReply();
    handleError(makeZodError(), reply as unknown as FastifyReply);

    expect(reply.status).toHaveBeenCalledWith(400);
    const body = reply.captured.body as { code: string; details: { field: string }[] };
    expect(body.code).toBe('VALIDATION_ERROR');
    expect(body.details[0].field).toBe('phone');
  });
});

describe('handleError — PrismaClientKnownRequestError', () => {
  it('returns 409 for P2002 unique constraint', () => {
    const reply = makeReply();
    const err = new PrismaClientKnownRequestError('Unique constraint failed', {
      code: 'P2002',
      clientVersion: '6.0.0',
      meta: { target: ['phone'] },
    });

    handleError(err, reply as unknown as FastifyReply);

    expect(reply.status).toHaveBeenCalledWith(409);
    const body = reply.captured.body as { code: string };
    expect(body.code).toBe('DUPLICATE_RECORD');
  });

  it('returns 404 for P2025 record not found', () => {
    const reply = makeReply();
    const err = new PrismaClientKnownRequestError('Record not found', {
      code: 'P2025',
      clientVersion: '6.0.0',
    });

    handleError(err, reply as unknown as FastifyReply);

    expect(reply.status).toHaveBeenCalledWith(404);
    const body = reply.captured.body as { code: string };
    expect(body.code).toBe('NOT_FOUND');
  });
});

describe('handleError — AppError', () => {
  it('uses the AppError statusCode', () => {
    const reply = makeReply();
    handleError(new AppError(422, 'Unprocessable', 'UNPROCESSABLE'), reply as unknown as FastifyReply);
    expect(reply.status).toHaveBeenCalledWith(422);
  });

  it('includes code and details in response', () => {
    const reply = makeReply();
    handleError(new AppError(400, 'Bad file', 'INVALID_FILE_TYPE', { allowed: ['image/png'] }), reply as unknown as FastifyReply);
    const body = reply.captured.body as { code: string; details: { allowed: string[] } };
    expect(body.code).toBe('INVALID_FILE_TYPE');
    expect(body.details.allowed).toContain('image/png');
  });
});

describe('handleError — unknown errors', () => {
  it('returns 500 with INTERNAL_ERROR and does not leak internal details', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const reply = makeReply();
    handleError(new Error('DB connection lost'), reply as unknown as FastifyReply);
    expect(reply.status).toHaveBeenCalledWith(500);
    const body = reply.captured.body as { code: string; error: string };
    expect(body.code).toBe('INTERNAL_ERROR');
    expect(body.error).not.toContain('DB connection lost');
    consoleSpy.mockRestore();
  });
});
