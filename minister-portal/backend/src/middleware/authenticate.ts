import { FastifyRequest, FastifyReply } from 'fastify';

/**
 * Shared authentication middleware for all protected routes.
 * Returns a proper 401 response instead of leaking internal JWT error details.
 */
export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify();
  } catch {
    reply.status(401).send({ error: 'Unauthorized' });
  }
}
