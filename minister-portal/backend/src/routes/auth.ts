import { FastifyInstance } from 'fastify';
import bcrypt from 'bcryptjs';
import prisma from '../data/prisma';
import { loginSchema } from '../utils/validation';
import { logAudit } from '../services/audit';
import { authenticate } from '../middleware/authenticate';
import { requireAdmin } from '../middleware/authorize';
import { handleError } from '../utils/errors';

export default async function authRoutes(fastify: FastifyInstance) {
  fastify.post('/login', {
    config: { rateLimit: { max: 5, timeWindow: '15 minutes' } },
  }, async (request, reply) => {
    try {
      const { email, password } = loginSchema.parse(request.body);

      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        return reply.status(401).send({ error: 'Invalid credentials', code: 'INVALID_CREDENTIALS' });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return reply.status(401).send({ error: 'Invalid credentials', code: 'INVALID_CREDENTIALS' });
      }

      // Token expires after 8 hours (one full workday); clients must re-login after expiry
      const token = fastify.jwt.sign({ id: user.id, role: user.role, name: user.name }, { expiresIn: '8h' });
      await logAudit('USER_LOGIN', { email }, undefined, user.id);

      return reply.send({ token, user: { id: user.id, name: user.name, role: user.role } });
    } catch (err) {
      return handleError(err, reply);
    }
  });

  fastify.get('/me', {
    preValidation: [authenticate],
  }, async (request, reply) => {
    try {
      const dbUser = await prisma.user.findUnique({ where: { id: request.user.id } });
      if (!dbUser) return reply.status(404).send({ error: 'User not found', code: 'NOT_FOUND' });
      return reply.send({ id: dbUser.id, name: dbUser.name, role: dbUser.role });
    } catch (err) {
      return handleError(err, reply);
    }
  });

  // Admin only — staff should not enumerate all users
  fastify.get('/users', {
    preValidation: [authenticate, requireAdmin],
  }, async (_request, reply) => {
    try {
      const users = await prisma.user.findMany({
        select: { id: true, name: true, role: true, email: true },
      });
      return reply.send(users);
    } catch (err) {
      return handleError(err, reply);
    }
  });
}
