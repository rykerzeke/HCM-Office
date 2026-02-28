import { FastifyInstance } from 'fastify';
import bcrypt from 'bcryptjs';
import prisma from '../data/prisma';
import { loginSchema } from '../utils/validation';
import { logAudit } from '../services/audit';
import { authenticate } from '../middleware/authenticate';

export default async function authRoutes(fastify: FastifyInstance) {
  fastify.post('/login', async (request, reply) => {
    try {
      const { email, password } = loginSchema.parse(request.body);

      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        return reply.status(401).send({ error: 'Invalid credentials' });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return reply.status(401).send({ error: 'Invalid credentials' });
      }

      const token = fastify.jwt.sign({ id: user.id, role: user.role, name: user.name });
      
      await logAudit('USER_LOGIN', { email }, undefined, user.id);
      
      return reply.send({ token, user: { id: user.id, name: user.name, role: user.role } });
    } catch (err) {
      return reply.status(400).send({ error: 'Validation failed' });
    }
  });

  fastify.get('/me', {
    preValidation: [authenticate]
  }, async (request, reply) => {
    const user = (request.user as any);
    const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
    if (!dbUser) return reply.status(404).send({ error: 'User not found' });
    
    return reply.send({ id: dbUser.id, name: dbUser.name, role: dbUser.role });
  });

  fastify.get('/users', {
    preValidation: [authenticate]
  }, async (request, reply) => {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, role: true, email: true }
    });
    return reply.send(users);
  });
}
