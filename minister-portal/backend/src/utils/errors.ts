import { FastifyReply } from 'fastify';
import { ZodError } from 'zod';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly code?: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function handleError(err: unknown, reply: FastifyReply): void {
  // Zod validation errors
  if (err instanceof ZodError) {
    reply.status(400).send({
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: err.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
    });
    return;
  }

  // Known Prisma errors
  if (err instanceof PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      reply.status(409).send({
        error: 'A record with these details already exists',
        code: 'DUPLICATE_RECORD',
        details: err.meta?.target,
      });
      return;
    }
    if (err.code === 'P2025') {
      reply.status(404).send({
        error: 'Record not found',
        code: 'NOT_FOUND',
      });
      return;
    }
    reply.status(400).send({
      error: 'Database operation failed',
      code: 'DB_ERROR',
      details: err.message,
    });
    return;
  }

  // App-level errors
  if (err instanceof AppError) {
    reply.status(err.statusCode).send({
      error: err.message,
      code: err.code,
      details: err.details,
    });
    return;
  }

  // Unexpected errors — don't leak internals
  console.error('Unhandled error:', err);
  reply.status(500).send({
    error: 'An unexpected error occurred',
    code: 'INTERNAL_ERROR',
  });
}
