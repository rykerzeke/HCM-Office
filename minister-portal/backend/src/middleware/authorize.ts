import { FastifyRequest, FastifyReply } from 'fastify';

/**
 * Returns a Fastify preHandler that requires the authenticated user to have
 * one of the specified roles. Must be used AFTER `authenticate`.
 */
export function requireRole(...roles: string[]) {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const user = request.user as { id: string; role: string; name: string } | undefined;
    if (!user || !roles.includes(user.role)) {
      reply.status(403).send({
        error: 'Forbidden',
        code: 'INSUFFICIENT_ROLE',
        details: `Required role: ${roles.join(' or ')}`,
      });
    }
  };
}

/** Shorthand — ADMIN only */
export const requireAdmin = requireRole('ADMIN');

/** Shorthand — ADMIN or STAFF */
export const requireStaffOrAdmin = requireRole('ADMIN', 'STAFF');
