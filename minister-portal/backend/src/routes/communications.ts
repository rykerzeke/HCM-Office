import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { createCommunicationLogSchema } from '../utils/validation';
import { logAudit } from '../services/audit';

const prisma = new PrismaClient();

const auth = [async (request: any, reply: any) => {
  try { await request.jwtVerify(); } catch (err) { reply.send(err); }
}];

export default async function communicationRoutes(fastify: FastifyInstance) {
  fastify.post('/cases/:caseId/communications', { preValidation: auth }, async (request, reply) => {
    try {
      const { caseId } = request.params as any;
      const data = createCommunicationLogSchema.parse(request.body);
      const user = (request.user as any);

      const c = await prisma.case.findUnique({ where: { id: caseId } });
      if (!c) return reply.status(404).send({ error: 'Case not found' });

      const log = await prisma.communicationLog.create({
        data: {
          caseId,
          userId: user.id,
          type: data.type,
          direction: data.direction || undefined,
          summary: data.summary,
        },
        include: { user: { select: { id: true, name: true } } }
      });
      await logAudit('COMMUNICATION_LOGGED', { type: data.type }, caseId, user.id);
      return reply.send(log);
    } catch (err: any) {
      return reply.status(400).send({ error: 'Validation failed', details: err.errors || err.message });
    }
  });

  fastify.get('/cases/:caseId/communications', { preValidation: auth }, async (request, reply) => {
    const { caseId } = request.params as any;
    const logs = await prisma.communicationLog.findMany({
      where: { caseId },
      include: { user: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' }
    });
    return reply.send(logs);
  });
}
