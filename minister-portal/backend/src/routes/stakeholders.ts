import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { logAudit } from '../services/audit';

const prisma = new PrismaClient();

export default async function stakeholderRoutes(fastify: FastifyInstance) {
  fastify.post('/cases/:caseId/stakeholders', {
    preValidation: [async (request, reply) => {
      try { await request.jwtVerify() } catch (err) { reply.send(err) }
    }]
  }, async (request, reply) => {
    try {
      const { caseId } = request.params as any;
      const { officialId } = request.body as any;
      const user = (request.user as any);

      const mapping = await prisma.stakeholderMapping.create({
        data: { caseId, officialId },
        include: { official: true }
      });

      await logAudit('STAKEHOLDER_MAPPED', { official: mapping.official.name }, caseId, user.id);

      return reply.send(mapping);
    } catch (err: any) {
      return reply.status(400).send({ error: 'Failed to map stakeholder' });
    }
  });

  fastify.delete('/cases/:caseId/stakeholders/:officialId', {
    preValidation: [async (request, reply) => {
      try { await request.jwtVerify() } catch (err) { reply.send(err) }
    }]
  }, async (request, reply) => {
    try {
      const { caseId, officialId } = request.params as any;
      const user = (request.user as any);

      await prisma.stakeholderMapping.delete({
        where: { caseId_officialId: { caseId, officialId } }
      });

      await logAudit('STAKEHOLDER_UNMAPPED', { officialId }, caseId, user.id);

      return reply.send({ success: true });
    } catch (err: any) {
      return reply.status(400).send({ error: 'Failed to unmap stakeholder' });
    }
  });
}
