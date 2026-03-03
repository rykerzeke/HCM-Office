import { FastifyInstance } from 'fastify';
import prisma from '../data/prisma';
import { createCommunicationLogSchema } from '../utils/validation';
import { logAudit } from '../services/audit';
import { authenticate } from '../middleware/authenticate';
import { handleError } from '../utils/errors';
import { CaseIdParam } from '../types/fastify';

const auth = [authenticate];

export default async function communicationRoutes(fastify: FastifyInstance) {
  fastify.post('/cases/:caseId/communications', { preValidation: auth }, async (request, reply) => {
    try {
      const { caseId } = request.params as CaseIdParam;
      const data = createCommunicationLogSchema.parse(request.body);
      const user = request.user;

      const c = await prisma.case.findUnique({ where: { id: caseId } });
      if (!c) return reply.status(404).send({ error: 'Case not found', code: 'NOT_FOUND' });

      const log = await prisma.$transaction(async (tx) => {
        const created = await tx.communicationLog.create({
          data: {
            caseId,
            userId: user.id,
            type: data.type,
            direction: data.direction || undefined,
            summary: data.summary,
          },
          include: { user: { select: { id: true, name: true } } },
        });
        await logAudit('COMMUNICATION_LOGGED', { type: data.type }, caseId, user.id, tx);
        return created;
      });

      return reply.send(log);
    } catch (err) {
      return handleError(err, reply);
    }
  });

  fastify.get('/cases/:caseId/communications', { preValidation: auth }, async (request, reply) => {
    try {
      const { caseId } = request.params as CaseIdParam;
      const logs = await prisma.communicationLog.findMany({
        where: { caseId },
        include: { user: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'desc' },
      });
      return reply.send(logs);
    } catch (err) {
      return handleError(err, reply);
    }
  });
}
